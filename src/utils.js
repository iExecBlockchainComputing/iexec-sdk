const Debug = require('debug');
const Promise = require('bluebird');
const tx = require('@warren-bank/ethereumjs-tx-sign');

const debug = Debug('iexec:utils');
const FETCH_INTERVAL = 1000;
const TIMEOUT = 60 * 1000;
const sleep = ms => new Promise(res => setTimeout(res, ms));
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const waitFor = async (fn, hash) => {
  let counter = 0;
  try {
    const txReceipt = await fn(hash);
    if (counter < TIMEOUT && txReceipt === null) {
      await sleep(FETCH_INTERVAL);
      counter += FETCH_INTERVAL;
      return waitFor(fn, hash);
    } else if (counter > TIMEOUT) {
      throw Error('TIMEOUT: Transaction still not included in a Block');
    }
    return txReceipt;
  } catch (error) {
    debug('waitFor()', error);
    throw error;
  }
};

const signAndSendTx = async ({
  web3,
  userWallet,
  unsignedTx,
  network,
  contractAddress = ZERO_ADDRESS,
}) => {
  try {
    const [networkGasPrice, nonce, estimatedGas] = await Promise.all([
      web3.eth.getGasPriceAsync(),
      web3.eth.getTransactionCountAsync('0x'.concat(userWallet.address)),
      web3.eth.estimateGasAsync({ data: unsignedTx, to: contractAddress }),
    ]);
    debug('contractAddress', contractAddress);
    debug('networkGasPrice', networkGasPrice);
    debug('nonce', nonce);
    debug('estimatedGas', estimatedGas);

    const gasPriceMultiplier = network.gasPriceMultiplier || 1;
    const gasPrice = network.gasPrice || networkGasPrice * gasPriceMultiplier;
    debug('gasPrice', gasPrice);
    const gasLimitMultiplier = network.gasLimitMultiplier || 2;
    const gasLimit = (network.gas || estimatedGas * gasLimitMultiplier);
    debug('gasLimit', gasLimit);
    const chainId = parseInt(web3.version.network, 10);
    debug('chainId', chainId);

    const txObject = {
      nonce: web3.toHex(nonce),
      gasPrice: web3.toHex(gasPrice),
      gasLimit: web3.toHex(gasLimit),
      data: unsignedTx,
      chainId,
    };
    if (contractAddress !== ZERO_ADDRESS) txObject.to = contractAddress;
    const { rawTx } = tx.sign(txObject, userWallet.privateKey);

    const txHash = await web3.eth.sendRawTransactionAsync('0x'.concat(rawTx));
    return txHash;
  } catch (error) {
    debug('signAndSendTx()', error);
    throw error;
  }
};

module.exports = {
  waitFor,
  signAndSendTx,
};
