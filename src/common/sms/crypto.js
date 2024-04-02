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
