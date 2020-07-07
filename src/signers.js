const { Wallet, BigNumber, getDefaultProvider } = require('ethers');
const { signTypedDataV3 } = require('./sig-utils');

class EnhancedWallet extends Wallet {
  constructor(privateKey, provider, options = {}) {
    super(privateKey, provider);
    this._options = options;
    if (options.gasPrice) {
      try {
        BigNumber.from(options.gasPrice);
      } catch (e) {
        throw Error('Invalid gasPrice option');
      }
    }
    if (
      options.getTransactionCount !== undefined
      && typeof options.getTransactionCount !== 'function'
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

  signTypedDataV3(data) {
    return signTypedDataV3(this)(data);
  }

  getGasPrice() {
    if (this._options.gasPrice === undefined) return super.getGasPrice();
    return BigNumber.from(this._options.gasPrice);
  }

  getTransactionCount(...args) {
    if (this._options.getTransactionCount === undefined) return super.getTransactionCount(...args);
    return this._options.getTransactionCount(...args);
  }
}

const enhanceJsonRpcSigner = (jsonRpcSigner) => {
  const ennhancedSigner = jsonRpcSigner;
  ennhancedSigner.signTypedDataV3 = async typedData => ennhancedSigner.provider.send('eth_signTypedData_v3', [
    await ennhancedSigner.getAddress(),
    JSON.stringify(typedData),
  ]);
  return ennhancedSigner;
};

const getSignerFromPrivateKey = (
  host,
  privateKey,
  { gasPrice, getTransactionCount } = {},
) => new EnhancedWallet(privateKey, getDefaultProvider(host), {
  gasPrice,
  getTransactionCount,
});

module.exports = {
  EnhancedWallet,
  getSignerFromPrivateKey,
  enhanceJsonRpcSigner,
};
