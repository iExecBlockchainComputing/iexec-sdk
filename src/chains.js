const Debug = require('debug');
const SignerProvider = require('ethjs-custom-signer');
const createIExecContracts = require('iexec-contracts-js-client');
const { loadChainConf } = require('./fs');
const { Spinner } = require('./cli-helper');

const debug = Debug('iexec:chains');

const createChainFromConf = (
  chainName,
  chainConf,
  {
    signTransaction,
    accounts,
    signTypedData,
    signTypedDatav3,
    signMessage,
    signPersonalMessage,
  },
  { txOptions = {}, bridgeConf } = {},
) => {
  try {
    const chain = Object.assign({}, chainConf);
    const signerOptions = Object.assign(
      {},
      {
        signTransaction,
        accounts,
        signTypedData,
        signTypedDatav3,
        signMessage,
        signPersonalMessage,
      },
      { gasPrice: txOptions.gasPrice },
    );
    const ethProvider = new SignerProvider(chainConf.host, signerOptions);
    chain.name = chainName;
    chain.contracts = createIExecContracts({
      ethProvider,
      chainId: chain.id,
      hubAddress: chain.hub,
      isNative: chain.native,
    });
    if (bridgeConf) {
      chain.bridgedNetwork = Object.assign({}, bridgeConf);
      chain.bridgedNetwork.contracts = createIExecContracts({
        ethProvider: bridgeConf.host,
        chainId: bridgeConf.id,
        hubAddress: bridgeConf.hub,
        isNative:
          bridgeConf.native === undefined
            ? !chain.contracts.isNative
            : bridgeConf.native,
      });
    }
    return chain;
  } catch (error) {
    debug('createChainFromConf()', error);
    throw error;
  }
};

const loadChain = async (
  chainName,
  keystore,
  { spinner = Spinner(), txOptions } = {},
) => {
  try {
    const chainsConf = await loadChainConf();
    debug('chainsConf', chainsConf);
    let name;
    let conf;
    if (chainName) {
      if (chainsConf.chains[chainName]) {
        conf = chainsConf.chains[chainName];
        name = chainName;
      } else {
        const names = Object.keys(chainsConf.chains);
        names.forEach((n) => {
          const chainConf = chainsConf.chains[n];
          if (chainConf.id && chainConf.id === chainName) {
            name = n;
            conf = chainConf;
          }
        });
        if (!name) throw Error(`Missing "${chainName}" chain in "chain.json"`);
      }
    } else if (chainsConf.default) {
      if (chainsConf.chains[chainsConf.default]) {
        name = chainsConf.default;
        conf = chainsConf.chains[chainsConf.default];
      } else {
        throw Error(`Missing "${chainsConf.default}" chain in "chain.json"`);
      }
    } else if (chainsConf.chains && chainsConf.chains.kovan) {
      name = 'kovan';
      conf = chainsConf.chain.kovan;
    }
    if (!name) throw Error('Missing chain parameter. Check your "chain.json" file');
    debug('loading chain', name, conf);
    let bridgeConf;
    if (conf.bridge && conf.bridge.bridgedNetworkId) {
      const names = Object.keys(chainsConf.chains);
      names.forEach((n) => {
        const chainConf = chainsConf.chains[n];
        if (chainConf.id && chainConf.id === conf.bridge.bridgedNetworkId) {
          bridgeConf = chainConf;
        }
      });
    }
    debug('bridged chain', bridgeConf);
    const chain = createChainFromConf(name, conf, keystore, {
      bridgeConf,
      txOptions,
    });
    spinner.info(`using chain [${name}]`);
    return chain;
  } catch (error) {
    debug('loadChain()', error);
    throw error;
  }
};

module.exports = {
  loadChain,
};
