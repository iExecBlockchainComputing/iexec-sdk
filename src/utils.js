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
const BLOCK_GAS_LIMIT = 4600000;

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
  chain,
  userWallet,
  unsignedTx,
  contractAddress = ZERO_ADDRESS,
  value = 0,
  nonceOffset = 0,
}) => {
  try {
    const isMigrating = contractAddress === ZERO_ADDRESS;
    DEFAULT_GAS_LIMIT_MULTIPLIER = isMigrating ? 5 : 3;

    const [networkGasPrice, nonce, estimatedGas] = await Promise.all([
      chain.web3.eth.getGasPriceAsync(),
      chain.web3.eth.getTransactionCountAsync('0x'.concat(userWallet.address)),
      chain.web3.eth.estimateGasAsync({ data: unsignedTx, to: contractAddress, from: '0x'.concat(userWallet.address) }),
    ]);

    debug('contractAddress', contractAddress);
    debug('networkGasPrice', networkGasPrice.toNumber());
    debug('nonce', nonce);
    debug('nonceOffset', nonceOffset);
    debug('estimatedGas', estimatedGas);
    debug('value', chain.web3.toHex(value));

    const gasPriceMultiplier = chain.gasPriceMultiplier || DEFAULT_GAS_PRICE_MULTIPLIER;
    const gasPrice = chain.gasPrice || networkGasPrice * gasPriceMultiplier;
    debug('gasPrice', gasPrice);
    const gasLimitMultiplier = chain.gasLimitMultiplier || DEFAULT_GAS_LIMIT_MULTIPLIER;
    debug('network.gas', chain.gas);
    const gasLimit = Math.min(chain.gas || estimatedGas * gasLimitMultiplier, BLOCK_GAS_LIMIT);
    debug('gasLimit', gasLimit);
    debug('chain.id', chain.id);

    const txObject = {
      nonce: chain.web3.toHex(nonce + nonceOffset),
      gasPrice: chain.web3.toHex(gasPrice),
      gasLimit: chain.web3.toHex(gasLimit),
      value: chain.web3.toHex(value),
      data: unsignedTx,
      chainId: parseInt(chain.id, 10),
    };
    debug('txObject', txObject);
    if (contractAddress !== ZERO_ADDRESS) txObject.to = contractAddress;
    const { rawTx } = tx.sign(txObject, userWallet.privateKey);

    const txHash = await chain.web3.eth.sendRawTransactionAsync('0x'.concat(rawTx));
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

const chainToEtherscanURL = chainName => `https://${chainName === 'mainnet' ? '' : chainName.concat('.')}etherscan.io/tx/`;

const ORACLE_WALLET_ADDRESS = '0x486a5986f795d323555c0321d655f1eb78d68381';
const getOracleWallet = (to) => {
  const toAddress = to === 'iexec' ? ORACLE_WALLET_ADDRESS : to;
  return toAddress;
};

const FAUCET_WALLET_ADDRESS = '0x1d78323c836d6e6681fe77128ae55923c8d5e0f0';
const getFaucetWallet = (to) => {
  const toAddress = to === 'iexec' ? FAUCET_WALLET_ADDRESS : to;
  return toAddress;
};

const checkTxReceipt = (txReceipt, gasLimit) => {
  if (txReceipt.status === '0x0') throw Error('transaction failed, state REVERTED');
  if (txReceipt.gasUsed === gasLimit) throw Error('transaction throw, out of gas');
};

module.exports = {
  iexecConfig,
  truffleConfig,
  waitFor,
  signAndSendTx,
  getChains,
  loadContractDesc,
  saveContractDesc,
  chainToEtherscanURL,
  getOracleWallet,
  getFaucetWallet,
  checkTxReceipt,
};
