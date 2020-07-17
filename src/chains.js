const Debug = require('debug');
const { getDefaultProvider } = require('ethers');
const IExecContractsClient = require('iexec-contracts-js-client');
const { EnhancedWallet } = require('./signers');
const { loadChainConf } = require('./fs');
const { Spinner } = require('./cli-helper');
const { getChainDefaults } = require('./config');

const debug = Debug('iexec:chains');

const createChainFromConf = (
  chainName,
  chainConf,
  { bridgeConf, providersOptions } = {},
) => {
  try {
    const chain = Object.assign({}, chainConf);
    const provider = getDefaultProvider(chainConf.host, providersOptions);
    chain.name = chainName;
    const contracts = new IExecContractsClient({
      provider,
      chainId: chain.id,
      hubAddress: chain.hub,
      isNative: chain.native,
    });
    chain.contracts = contracts;
    if (bridgeConf) {
      chain.bridgedNetwork = Object.assign({}, bridgeConf);
      const bridgeProvider = getDefaultProvider(
        bridgeConf.host,
        providersOptions,
      );
      chain.bridgedNetwork.contracts = new IExecContractsClient({
        provider: bridgeProvider,
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

const loadChain = async (chainName, { spinner = Spinner() } = {}) => {
  try {
    const chainsConf = await loadChainConf();
    debug('chainsConf', chainsConf);
    const providersOptions = chainsConf.providers;
    let name;
    let loadedConf;
    if (chainName) {
      if (chainsConf.chains[chainName]) {
        loadedConf = chainsConf.chains[chainName];
        name = chainName;
      } else {
        const names = Object.keys(chainsConf.chains);
        names.forEach((n) => {
          const chainConf = chainsConf.chains[n];
          if (chainConf.id && chainConf.id === chainName) {
            name = n;
            loadedConf = chainConf;
          }
        });
        if (!name) throw Error(`Missing "${chainName}" chain in "chain.json"`);
      }
    } else if (chainsConf.default) {
      if (chainsConf.chains[chainsConf.default]) {
        name = chainsConf.default;
        loadedConf = chainsConf.chains[chainsConf.default];
      } else {
        throw Error(`Missing "${chainsConf.default}" chain in "chain.json"`);
      }
    } else if (chainsConf.chains && chainsConf.chains.goerli) {
      name = 'goerli';
      loadedConf = chainsConf.chain.goerli;
    }
    if (!name) throw Error('Missing chain parameter. Check your "chain.json" file');

    const defaultConf = getChainDefaults(loadedConf.id);
    debug('loading chain', name);
    debug('loadedConf', loadedConf);
    debug('defaultConf', defaultConf);
    const conf = { ...defaultConf, ...loadedConf };
    debug('conf', conf);
    if (!conf.host) {
      throw Error(
        `Missing RPC host, no "host" key in "chain.json" and no default value for chain ${conf.id}`,
      );
    }

    let bridgeConf;
    if (conf.bridge && conf.bridge.bridgedChainId) {
      const names = Object.keys(chainsConf.chains);
      names.forEach((n) => {
        const bridgeLoadedConf = chainsConf.chains[n];
        if (
          bridgeLoadedConf.id
          && bridgeLoadedConf.id === conf.bridge.bridgedChainId
        ) {
          const bridgeDefaultConf = getChainDefaults(bridgeLoadedConf.id);
          debug('bridgeLoadedConf', bridgeLoadedConf);
          debug('bridgeDefaultConf', defaultConf);
          bridgeConf = { ...bridgeDefaultConf, ...bridgeLoadedConf };
          if (!bridgeConf.host) {
            throw Error(
              `Missing RPC host for bridged chain, no "host" key in "chain.json" and no default value for bridged chain ${bridgeConf.id}`,
            );
          }
        }
      });
    }
    debug('bridged chain', bridgeConf);
    const chain = createChainFromConf(name, conf, {
      bridgeConf,
      providersOptions,
    });
    spinner.info(`Using chain [${name}]`);
    return chain;
  } catch (error) {
    debug('loadChain()', error);
    throw error;
  }
};

const connectKeystore = async (chain, keystore, { txOptions } = {}) => {
  const { privateKey } = await keystore.load();
  chain.contracts.setSigner(
    new EnhancedWallet(privateKey, undefined, txOptions),
  );
};

module.exports = {
  loadChain,
  connectKeystore,
};
