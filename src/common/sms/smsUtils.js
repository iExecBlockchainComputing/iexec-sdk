import { Buffer } from 'buffer';
import { getCrypto, publicAsPem } from '../utils/crypto.js';

const toBase64 = (string) => Buffer.from(string, 'utf8').toString('base64');

/**
 * Format Crypto public key for SMS and POST COMPUTE
 * @param publicKey CryptoKey (https://developer.mozilla.org/fr/docs/Web/API/CryptoKey)
 */
const formatCryptoKey = async (publicKey) => {
  const publicKeyAsPem = await publicAsPem(publicKey);
  return toBase64(publicKeyAsPem);
};

export const formatEncryptionKey = async (secretValue) => {
  if (!secretValue) {
    return '';
  }

  const { CryptoKey } = await getCrypto();
  if (secretValue instanceof CryptoKey) {
    return formatCryptoKey(secretValue);
  }

  // If key is given as PEM format
  if (secretValue.startsWith('-----BEGIN PUBLIC KEY-----')) {
    // Need to base64 it before sending if to the SMS
    return toBase64(secretValue);
  }

  // Else: Assume base64 key
  return secretValue;
};
