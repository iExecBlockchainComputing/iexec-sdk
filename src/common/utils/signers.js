import { Wallet, BrowserProvider, AbstractSigner } from 'ethers';
import { getReadOnlyProvider } from './providers.js';

export class EnhancedWallet extends Wallet {
  constructor(privateKey, provider, options = {}) {
    super(privateKey, provider);
    this._options = options;
    if (options.gasPrice) {
      try {
        BigInt(options.gasPrice);
      } catch {
        throw Error('Invalid gasPrice option');
      }
    }
    if (
      options.getTransactionCount !== undefined &&
      typeof options.getTransactionCount !== 'function'
    ) {
      throw Error('Invalid getTransactionCount option, must be a function');
    }
  }

  static createRandom() {
    return new EnhancedWallet(super.createRandom().privateKey);
  }

  connect(provider) {
    return new EnhancedWallet(this.privateKey, provider, this._options);
  }

  getFeeData() {
    if (this._options.gasPrice === undefined) return super.getFeeData();
    return {
      gasPrice: BigInt(this._options.gasPrice),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    };
  }

  getNonce(...args) {
    if (this._options.getTransactionCount === undefined)
      return super.getNonce(...args);
    return this._options.getTransactionCount(...args);
  }

  sendTransaction(tx) {
    let gasPrice;
    if (this._options.gasPrice !== undefined) {
      gasPrice = BigInt(this._options.gasPrice);
    }
    return super.sendTransaction({ ...tx, gasPrice: tx.gasPrice ?? gasPrice });
  }
}

/**
 * BrowserProvider wrapped in an AbstractSigner
 */
export class BrowserProviderSignerAdapter extends AbstractSigner {
  constructor(browserProvider) {
    if (!(browserProvider instanceof BrowserProvider)) {
      throw Error('Invalid BrowserProvider');
    }
    super(browserProvider);
  }

  getAddress() {
    return this.provider.getSigner().then((signer) => signer.getAddress());
  }

  // eslint-disable-next-line class-methods-use-this
  connect() {
    throw Error('Unsupported');
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
  {
    gasPrice,
    getTransactionCount,
    providers,
    allowExperimentalNetworks = false,
  } = {},
) =>
  new EnhancedWallet(
    privateKey,
    getReadOnlyProvider(host, { providers, allowExperimentalNetworks }),
    {
      gasPrice,
      getTransactionCount,
    },
  );
