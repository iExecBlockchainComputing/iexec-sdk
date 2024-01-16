export async function getCrypto() {
  if (globalThis.crypto) {
    // Browser and Node >= 20
    return { crypto, CryptoKey };
  }
  // Node <= 18
  const nodeCrypto = await import('node:crypto');
  return {
    crypto: nodeCrypto.webcrypto,
    CryptoKey: nodeCrypto.webcrypto.CryptoKey,
  };
}
