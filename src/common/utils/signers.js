import { Wallet } from 'ethers';
import { getReadOnlyProvider } from './providers.js';

export class EnhancedWallet extends Wallet {
  constructor(privateKey, provider, options = {}) {
    super(privateKey, provider);
    this._options = options;
    if (options.gasPrice) {
      try {
        BigInt(options.gasPrice);
      } catch (e) {
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
    return super.sendTransaction({ gasPrice, ...tx });
  }
}

export const getSignerFromPrivateKey = (
  host,
  privateKey,
  { gasPrice, getTransactionCount, providers } = {},
) =>
  new EnhancedWallet(privateKey, getReadOnlyProvider(host, { providers }), {
    gasPrice,
    getTransactionCount,
  });
