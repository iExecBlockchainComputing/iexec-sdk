import { Buffer } from 'buffer';
import { getCrypto } from './crypto.js';

export const formatEncryptionKey = async (secretValue) => {
  if (!secretValue) {
    return '';
  }

  const { CryptoKey } = await getCrypto();
  if (secretValue instanceof CryptoKey) {
    return await formatCryptoKey(secretValue);
  }

  // If key is given as PEM format
  if (secretValue.startsWith('-----BEGIN PUBLIC KEY-----')) {
    // Need to base64 it before sending if to the SMS
    return toBase64(secretValue);
  }

  // Else: Assume base64 key
  return secretValue;
};

const toBase64 = (string) => Buffer.from(string, 'utf8').toString('base64');

/**
 * Format Crypto public key for SMS and POST COMPUTE
 * Browser-only
 * @param publicKey CryptoKey (https://developer.mozilla.org/fr/docs/Web/API/CryptoKey)
 */
const formatCryptoKey = async (publicKey) => {
  const publicKeyAsPem = await publicAsPem(publicKey);
  return toBase64(publicKeyAsPem);
};

/**
 * Browser-only
 * @param publicKey CryptoKey (https://developer.mozilla.org/fr/docs/Web/API/CryptoKey)
 */
const publicAsPem = async (publicKey) => {
  const { crypto } = await getCrypto();
  const publicKeyAsBuffer = await crypto.subtle.exportKey('spki', publicKey);

  let body = toBase64(
    String.fromCharCode(...new Uint8Array(publicKeyAsBuffer)),
  );
  body = body.match(/.{1,64}/g).join('\n');

  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
};
