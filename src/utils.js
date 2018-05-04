const Debug = require('debug');
const EthJS = require('ethjs');
const ethUtil = require('ethjs-util');
const SignerProvider = require('./ethjs-iexec-signer');
const createIExecContracts = require('./iexec-contracts-js-client');

const debug = Debug('iexec:utils');

const FETCH_INTERVAL = 1000;
const TIMEOUT = 60 * 1000;
const sleep = ms => new Promise(res => setTimeout(res, ms));

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

const getChains = (
  from,
  chainsConf,
  {
    signTransaction,
    accounts,
    signTypedData,
    signMessage,
    signPersonalMessage,
  },
) => {
  try {
    const chains = { names: Object.keys(chainsConf.chains) };
    chains.names.forEach((name) => {
      const chain = chainsConf.chains[name];
      const ethProvider = new SignerProvider(chain.host, {
        signTransaction,
        accounts,
        signTypedData,
        signMessage,
        signPersonalMessage,
      });

      chains[name] = Object.assign({}, chain);
      chains[name].name = name;
      chains[name].ethjs = new EthJS(ethProvider);
      chains[name].EthJS = EthJS;
      chains[name].contracts = createIExecContracts({
        eth: chains[name].ethjs,
        chainID: chains[name].id,
        txOptions: {
          from,
          chainId: parseInt(chains[name].id, 10),
        },
      });
      // index by chainID
      chains[chain.id] = chains[name];
    });
    return chains;
  } catch (error) {
    debug('getChains()', error);
    throw error;
  }
};

const chainToEtherscanURL = chainName =>
  `https://${
    chainName === 'mainnet' ? '' : chainName.concat('.')
  }etherscan.io/tx/`;

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
  if (txReceipt.status === '0x0') {
    throw Error('transaction failed, state REVERTED');
  }
  if (txReceipt.gasUsed === gasLimit) {
    throw Error('transaction throw, out of gas');
  }
};

const getContractAddress = (desc, chainID, { strict = true } = {}) => {
  try {
    if (!('networks' in desc)) {
      if (strict) {
        throw Error('missing networks key in contract JSON description');
      }
      return undefined;
    }
    if (!(chainID in desc.networks)) {
      if (strict) {
        throw Error(`missing "${chainID}" key in contract JSON description`);
      }
      return undefined;
    }
    if (!('address' in desc.networks[chainID])) {
      if (strict) {
        throw Error(`missing address key in contract JSON description for chainID: ${chainID}`);
      }
      return undefined;
    }
    return desc.networks[chainID].address;
  } catch (error) {
    debug('getContractAddress()', error);
    throw error;
  }
};

const getRPCObjValue = (obj, { strict = true } = {}) => {
  if (!(typeof obj === 'object')) {
    if (strict) throw Error('RPC object is not of type object');
    return obj;
  }
  if (!('0' in obj)) {
    if (strict) throw Error('no "0" key in RPC response object');
    return undefined;
  }
  return obj[0];
};

const stringifyRPCObj = (obj) => {
  try {
    const str = Object.keys(obj).reduce(
      (accu, curr) =>
        accu.concat(`\n   ${curr}: ${getRPCObjValue(obj[curr], { strict: false })}`),
      '   ',
    );
    return str;
  } catch (error) {
    debug('stringifyRPCObj()', error);
    throw error;
  }
};

const isEthAddress = (address, { strict = false } = {}) => {
  const isHexString = ethUtil.isHexString(address);
  if (!isHexString && strict) {
    throw Error(`address ${address} is not a valid Ethereum address`);
  }
  return isHexString;
};

const toUpperFirst = str => ''.concat(str[0].toUpperCase(), str.substr(1));

module.exports = {
  waitFor,
  getChains,
  chainToEtherscanURL,
  getOracleWallet,
  getFaucetWallet,
  checkTxReceipt,
  getContractAddress,
  stringifyRPCObj,
  isEthAddress,
  getRPCObjValue,
  toUpperFirst,
};
