// Device-scoped encrypted ledger using IndexedDB and non-extractable Web Crypto key
// Part 3: Shared institute data sealed with a non-extractable AES-GCM key in IndexedDB.

const DB_NAME = 'teachdesk_device_ledger';
const DB_VERSION = 1;
const KEY_STORE_NAME = 'master_key_store';
const DATA_STORE_NAME = 'encrypted_records';
const MASTER_KEY_ID = 'device_ledger_key_v1';

function openLedgerDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DATA_STORE_NAME)) {
        db.createObjectStore(DATA_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Retrieve or generate non-extractable AES-GCM key
async function getDeviceLedgerKey(): Promise<CryptoKey> {
  const db = await openLedgerDb();

  return new Promise<CryptoKey>((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readonly');
    const store = tx.objectStore(KEY_STORE_NAME);
    const req = store.get(MASTER_KEY_ID);

    req.onsuccess = async () => {
      if (req.result && req.result.cryptoKey) {
        resolve(req.result.cryptoKey as CryptoKey);
      } else {
        // Generate non-extractable AES-GCM key
        try {
          const newKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false, // non-extractable!
            ['encrypt', 'decrypt']
          );

          const writeTx = db.transaction(KEY_STORE_NAME, 'readwrite');
          const writeStore = writeTx.objectStore(KEY_STORE_NAME);
          writeStore.put({ id: MASTER_KEY_ID, cryptoKey: newKey, createdAt: Date.now() });

          writeTx.oncomplete = () => resolve(newKey);
          writeTx.onerror = () => reject(writeTx.error);
        } catch (err) {
          reject(err);
        }
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Save encrypted entry in ledger
export async function saveToDeviceLedger<T>(id: string, payload: T): Promise<void> {
  const key = await getDeviceLedgerKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(payload));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  const db = await openLedgerDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DATA_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DATA_STORE_NAME);
    store.put({
      id,
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext)),
      updatedAt: Date.now()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Load and decrypt entry from ledger
export async function loadFromDeviceLedger<T>(id: string): Promise<T | null> {
  const db = await openLedgerDb();
  const record = await new Promise<{ id: string; iv: number[]; data: number[] } | undefined>((resolve, reject) => {
    const tx = db.transaction(DATA_STORE_NAME, 'readonly');
    const store = tx.objectStore(DATA_STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!record) return null;

  try {
    const key = await getDeviceLedgerKey();
    const iv = new Uint8Array(record.iv);
    const ciphertext = new Uint8Array(record.data);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted)) as T;
  } catch (err) {
    console.error('Failed to decrypt ledger record', id, err);
    return null;
  }
}
