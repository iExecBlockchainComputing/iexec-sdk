import { Buffer } from 'buffer';

export async function getCrypto() {
  if (globalThis.crypto) {
    // Browser and Node >= 20
    return { crypto: globalThis.crypto, CryptoKey };
  }
  // Node <= 18 and webpack (needs polyfill)
  const crypto = await import(/* webpackIgnore: true */ 'crypto');
  return {
    crypto: crypto.webcrypto,
    CryptoKey: crypto.webcrypto.CryptoKey,
  };
}

/**
 * @param publicKey CryptoKey (https://developer.mozilla.org/fr/docs/Web/API/CryptoKey)
 */
export const publicAsPem = async (publicKey) => {
  const { crypto } = await getCrypto();
  const publicKeyBin = await crypto.subtle.exportKey('spki', publicKey);
  let body = Buffer.from(publicKeyBin).toString('base64');
  body = body.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
};
/**
 * @param privateKey CryptoKey (https://developer.mozilla.org/fr/docs/Web/API/CryptoKey)
 */
export const privateAsPem = async (privateKey) => {
  const { crypto } = await getCrypto();
  const privateKeyBin = await crypto.subtle.exportKey('pkcs8', privateKey);
  let body = Buffer.from(privateKeyBin).toString('base64');
  body = body.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
};
