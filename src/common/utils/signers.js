import { BrowserProvider, AbstractSigner, Wallet } from 'ethers';
import { getReadOnlyProvider } from './providers.js';

/**
 * BrowserProvider wrapped in an AbstractSigner
 */
export class BrowserProviderSignerAdapter extends AbstractSigner {
  constructor(browserProvider) {
    if (!(browserProvider instanceof BrowserProvider)) {
      throw new Error('Invalid BrowserProvider');
    }
    super(browserProvider);
  }

  getAddress() {
    return this.provider.getSigner().then((signer) => signer.getAddress());
  }

  // eslint-disable-next-line class-methods-use-this
  connect() {
    throw new Error('Unsupported');
  }

  signMessage(message) {
    return this.provider
      .getSigner()
      .then((signer) => signer.signMessage(message));
  }

  signTypedData(domain, types, value) {
    return this.provider
      .getSigner()
      .then((signer) => signer.signTypedData(domain, types, value));
  }

  signTransaction(tx) {
    return this.provider
      .getSigner()
      .then((signer) => signer.signTransaction(tx));
  }

  sendTransaction(tx) {
    return this.provider
      .getSigner()
      .then((signer) => signer.sendTransaction(tx));
  }
}

export const getSignerFromPrivateKey = (
  host,
  privateKey,
  { allowExperimentalNetworks = false } = {},
) =>
  new Wallet(
    privateKey,
    getReadOnlyProvider(host, { allowExperimentalNetworks }),
  );
