export const formatSecretValue = async (secretValue) => {
  if (!secretValue) {
    return '';
  }

  if (globalThis.CryptoKey && secretValue instanceof CryptoKey) {
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

// Universal base64 encode = works for both Node.js and browsers
const toBase64 = (string) => {
  // Prefer to use Buffer.toString('base64') in Node.js
  if (globalThis.Buffer) {
    return Buffer.from(string, 'utf8').toString('base64');
  }
  // For browsers
  return btoa(string);
};

/**
 * Format Crypto public key for SMS and POST COMPUTE
 * Browser-only
 * @param publicKey CryptoKey (https://developer.mozilla.org/fr/docs/Web/API/CryptoKey)
 */
const formatCryptoKey = async (publicKey) => {
  const publicKeyAsPem = await publicAsPem(publicKey);
  return btoa(publicKeyAsPem);
};

/**
 * Browser-only
 * @param publicKey CryptoKey (https://developer.mozilla.org/fr/docs/Web/API/CryptoKey)
 */
const publicAsPem = async (publicKey) => {
  const publicKeyAsBuffer = await crypto.subtle.exportKey('spki', publicKey);

  let body = btoa(String.fromCharCode(...new Uint8Array(publicKeyAsBuffer)));
  body = body.match(/.{1,64}/g).join('\n');

  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
};
