const {
  Wallet, Signer, BigNumber, getDefaultProvider,
} = require('ethers');
const { Web3Provider } = require('ethers').providers;

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

  getGasPrice() {
    if (this._options.gasPrice === undefined) return super.getGasPrice();
    return BigNumber.from(this._options.gasPrice);
  }

  getTransactionCount(...args) {
    if (this._options.getTransactionCount === undefined) return super.getTransactionCount(...args);
    return this._options.getTransactionCount(...args);
  }
}

class EnhancedWeb3Signer extends Signer {
  constructor(web3) {
    super();
    const web3Provider = new Web3Provider(web3);
    this.provider = web3Provider;
  }

  getAddress() {
    return this.provider.getSigner().getAddress();
  }

  signMessage(message) {
    return this.provider.getSigner().signMessage(message);
  }

  signTypedData(...args) {
    const signer = this.provider.getSigner();
    // use experiental ether Signer._signTypedData (to remove when signTypedData is included)
    // https://docs.ethers.io/v5/api/signer/#Signer-signTypedData
    return signer._signTypedData && typeof signer._signTypedData === 'function'
      ? signer._signTypedData(...args)
      : signer.signTypedData(...args);
  }

  sendTransaction(tx) {
    return this.provider.getSigner().sendTransaction(tx);
  }
}

const getSignerFromPrivateKey = (
  host,
  privateKey,
  { gasPrice, getTransactionCount, providers } = {},
) => new EnhancedWallet(privateKey, getDefaultProvider(host, providers), {
  gasPrice,
  getTransactionCount,
});

module.exports = {
  EnhancedWallet,
  EnhancedWeb3Signer,
  getSignerFromPrivateKey,
};
