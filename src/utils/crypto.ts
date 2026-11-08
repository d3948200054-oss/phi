// Pure Web Crypto API implementation adhering to TeachDesk Part 7 specification

const PBKDF2_ITERATIONS = 210000;
const HASH_ALG = 'SHA-256';

export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

export function generateRandomTokenHex(bytesLength = 32): string {
  return bufToHex(generateRandomBytes(bytesLength));
}

// Derive AES-GCM key from password and salt using PBKDF2
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALG
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Seal data using AES-GCM with AAD
export async function sealWithPassword(
  plainObject: Record<string, unknown>,
  password: string,
  emailAad: string
): Promise<{ saltHex: string; ivHex: string; ciphertextHex: string }> {
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12);
  const key = await deriveKeyFromPassword(password, salt);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(plainObject));
  const aad = enc.encode(emailAad);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      additionalData: aad
    },
    key,
    plaintext
  );

  return {
    saltHex: bufToHex(salt),
    ivHex: bufToHex(iv),
    ciphertextHex: bufToHex(ciphertext)
  };
}

// Unseal data using AES-GCM with AAD
export async function unsealWithPassword<T = Record<string, unknown>>(
  saltHex: string,
  ivHex: string,
  ciphertextHex: string,
  password: string,
  emailAad: string
): Promise<T> {
  const salt = hexToBuf(saltHex);
  const iv = hexToBuf(ivHex);
  const ciphertext = hexToBuf(ciphertextHex);
  const key = await deriveKeyFromPassword(password, salt);

  const enc = new TextEncoder();
  const aad = enc.encode(emailAad);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      additionalData: aad
    },
    key,
    ciphertext as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted)) as T;
}

// Derive a password hash representation for quick check
export async function computePasswordVerifier(password: string, saltHex: string): Promise<string> {
  const salt = hexToBuf(saltHex);
  const key = await deriveKeyFromPassword(password, salt);
  const rawExport = await crypto.subtle.exportKey ? '' : ''; // non-extractable, so encrypt a known probe
  const probeIv = new Uint8Array(12); // fixed zero IV for verifier token
  const enc = new TextEncoder();
  const verifierCipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: probeIv },
    key,
    enc.encode('TEACHDESK_VERIFY_PAYLOAD_V1')
  );
  return bufToHex(verifierCipher);
}

// ECDSA P-256 for receipt signing & verification
export async function generateSigningKeyPair(): Promise<{
  publicJwk: JsonWebKey;
  privateJwk: JsonWebKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true, // extractable so we can seal private key into account vault and publish public key
    ['sign', 'verify']
  );

  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return { publicJwk, privateJwk };
}

// Build canonical string for fee payment
export function buildCanonicalReceiptPayload(payment: {
  id: string;
  payerStudentId: string;
  payeeId: string;
  feePlanId: string;
  course: string;
  cohortId?: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  signingTimestamp: string;
}): string {
  const ordered = {
    amount: payment.amount,
    cohortId: payment.cohortId || '',
    course: payment.course,
    currency: payment.currency,
    feePlanId: payment.feePlanId,
    id: payment.id,
    payeeId: payment.payeeId,
    payerStudentId: payment.payerStudentId,
    reference: payment.reference,
    signingTimestamp: payment.signingTimestamp,
    status: payment.status
  };
  return JSON.stringify(ordered);
}

// Sign canonical payload with teacher's ECDSA private key
export async function signReceipt(
  canonicalPayload: string,
  privateJwk: JsonWebKey
): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['sign']
  );

  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    privateKey,
    enc.encode(canonicalPayload)
  );

  return bufToHex(signature);
}

// Verify signature with teacher's published ECDSA public key
export async function verifyReceiptSignature(
  canonicalPayload: string,
  signatureHex: string,
  publicJwk: JsonWebKey
): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicJwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );

    const enc = new TextEncoder();
    const signature = hexToBuf(signatureHex);

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      signature as unknown as BufferSource,
      enc.encode(canonicalPayload)
    );
  } catch (err) {
    console.error('Verification failed with error:', err);
    return false;
  }
}
