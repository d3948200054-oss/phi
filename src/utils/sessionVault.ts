import { Account } from '../types';
import { bufToHex, hexToBuf, generateRandomBytes } from './crypto';

const SESSION_TOKEN_KEY = 'teachdesk_session_token';
const SESSION_DATA_KEY = 'teachdesk_session_sealed_data';

// Derive an AES-GCM key from the 32-byte session token
async function deriveSessionKey(tokenHex: string): Promise<CryptoKey> {
  const tokenBytes = hexToBuf(tokenHex);
  return await crypto.subtle.importKey(
    'raw',
    tokenBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface SessionData {
  account: Account;
  unlockedSigningPrivateJwk?: JsonWebKey;
  unlockedAt: number;
}

export async function storeSession(data: SessionData): Promise<void> {
  let tokenHex = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (!tokenHex) {
    const rawToken = generateRandomBytes(32);
    tokenHex = bufToHex(rawToken);
    sessionStorage.setItem(SESSION_TOKEN_KEY, tokenHex);
  }

  const key = await deriveSessionKey(tokenHex);
  const iv = generateRandomBytes(12);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    plaintext
  );

  const sealed = {
    iv: bufToHex(iv),
    ciphertext: bufToHex(ciphertext)
  };

  sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(sealed));
}

export async function retrieveSession(): Promise<SessionData | null> {
  const tokenHex = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const rawSealed = sessionStorage.getItem(SESSION_DATA_KEY);
  if (!tokenHex || !rawSealed) return null;

  try {
    const sealed = JSON.parse(rawSealed) as { iv: string; ciphertext: string };
    const key = await deriveSessionKey(tokenHex);
    const iv = hexToBuf(sealed.iv);
    const ciphertext = hexToBuf(sealed.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted)) as SessionData;
  } catch (err) {
    console.warn('Session decryption failed or corrupted, clearing session', err);
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_DATA_KEY);
}
