const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const tx = require('@warren-bank/ethereumjs-tx-sign');
const path = require('path');
const Web3 = require('web3');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:utils');
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const FETCH_INTERVAL = 1000;
const TIMEOUT = 60 * 1000;
const sleep = ms => new Promise(res => setTimeout(res, ms));
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEFAULT_GAS_PRICE_MULTIPLIER = 1;
let DEFAULT_GAS_LIMIT_MULTIPLIER = 1;
const BLOCK_GAS_LIMIT = 5500000;

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
  value = 0,
}) => {
  try {
    const isMigrating = contractAddress === ZERO_ADDRESS;
    DEFAULT_GAS_LIMIT_MULTIPLIER = isMigrating ? 5 : 3;

    const [networkGasPrice, nonce, estimatedGas] = await Promise.all([
      web3.eth.getGasPriceAsync(),
      web3.eth.getTransactionCountAsync('0x'.concat(userWallet.address)),
      web3.eth.estimateGasAsync({ data: unsignedTx, to: contractAddress, from: '0x'.concat(userWallet.address) }),
    ]);
    debug('contractAddress', contractAddress);
    debug('networkGasPrice', networkGasPrice.toNumber());
    debug('nonce', nonce);
    debug('estimatedGas', estimatedGas);
    debug('value', web3.toHex(value));

    const gasPriceMultiplier = network.gasPriceMultiplier || DEFAULT_GAS_PRICE_MULTIPLIER;
    const gasPrice = network.gasPrice || networkGasPrice * gasPriceMultiplier;
    debug('gasPrice', gasPrice);
    const gasLimitMultiplier = network.gasLimitMultiplier || DEFAULT_GAS_LIMIT_MULTIPLIER;
    debug('network.gas', network.gas);
    const gasLimit = Math.min(network.gas || estimatedGas * gasLimitMultiplier, BLOCK_GAS_LIMIT);
    debug('gasLimit', gasLimit);
    const chainId = parseInt(web3.version.network, 10);
    debug('chainId', chainId);

    const txObject = {
      nonce: web3.toHex(nonce),
      gasPrice: web3.toHex(gasPrice),
      gasLimit: web3.toHex(gasLimit),
      value: web3.toHex(value),
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

const getChains = () => {
  try {
    const chains = {};
    const networkNames = Object.keys(truffleConfig.networks);
    networkNames.forEach((name) => {
      chains[name] = Object.assign({}, truffleConfig.networks[name]);
      chains[name].name = name;
      chains[name].web3 =
        new Web3(new Web3.providers.HttpProvider(truffleConfig.networks[name].host));
      Promise.promisifyAll(chains[name].web3.eth);
      chains[name].id = truffleConfig.networks[name].network_id;
      chains[chains[name].id] = chains[name];
    });
    return chains;
  } catch (error) {
    debug('getChains()', error);
    throw error;
  }
};

const loadContractDesc = async () => {
  try {
    const contractDescJSONPath = path.join('build', 'contracts', `${iexecConfig.name}.json`);
    const contractDescJSON = await readFileAsync(contractDescJSONPath);
    const contractDesc = JSON.parse(contractDescJSON);
    return contractDesc;
  } catch (error) {
    debug('loadContractDesc()', error);
    throw error;
  }
};

const saveContractDesc = async (contractDesc) => {
  try {
    const contractDescJSONPath = path.join('build', 'contracts', `${iexecConfig.name}.json`);
    await writeFileAsync(contractDescJSONPath, JSON.stringify(contractDesc, null, 4));
    return contractDescJSONPath;
  } catch (error) {
    debug('saveContractDesc()', error);
    throw error;
  }
};

module.exports = {
  iexecConfig,
  truffleConfig,
  waitFor,
  signAndSendTx,
  getChains,
  loadContractDesc,
  saveContractDesc,
};
