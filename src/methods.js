const Debug = require('debug');
const fs = require('fs');
const Web3 = require('web3');
const Promise = require('bluebird');
const path = require('path');
const tx = require('@warren-bank/ethereumjs-tx-sign');
const wallet = require('./wallet');
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:methods');
const readFileAsync = Promise.promisify(fs.readFile);

const send = async (walletType, network, methodName, args) => {
  try {
    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));

    const compiledFile = await readFileAsync(`build/contracts/${iexecConfig.name}.json`);
    const { abi, networks } = JSON.parse(compiledFile);

    const contractAddress = networks[network.network_id].address;
    const contract = new web3.eth.Contract(abi, contractAddress);

    const unsignedTx = contract.methods[methodName](...args).encodeABI();

    if (walletType === 'local') {
      const userWallet = await wallet.load();
      const [networkGasPrice, nonce, networkChainId] = await Promise.all([
        web3.eth.getGasPrice(),
        web3.eth.getTransactionCount(userWallet.address),
        web3.eth.net.getId(),
      ]);
      debug('networkGasPrice', networkGasPrice);
      debug('nonce', nonce);

      const gasPriceMultiplier = network.gasPriceMultiplier || 3;
      const gasPrice = network.gasPrice || networkGasPrice * gasPriceMultiplier;
      debug('gasPrice', gasPrice);
      const gasLimit = network.gas || 4400000;
      debug('gasLimit', gasLimit);
      const chainId = network.network_id || networkChainId;
      debug('chainId', chainId);

      const { rawTx } = tx.sign({
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasLimit),
        data: unsignedTx,
        chainId,
      }, userWallet.privateKey);

      const txReceipt = await web3.eth.sendSignedTransaction('0x'.concat(rawTx))
        .once('transactionHash', hash => console.log('txHash :', hash))
        .on('error', error => debug('error', error));
      console.log('txReceipt :', txReceipt);
    } else if (walletType === 'remote') {
      debug('remote wallet');
    }
  } catch (error) {
    debug('send()', error);
    throw error;
  }
};

module.exports = {
  send,
};
