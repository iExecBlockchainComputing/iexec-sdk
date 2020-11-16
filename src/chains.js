const Debug = require('debug');
const { getDefaultProvider } = require('ethers');
const IExecContractsClient = require('iexec-contracts-js-client');
const { EnhancedWallet } = require('./signers');
const { loadChainConf } = require('./fs');
const { Spinner } = require('./cli-helper');
const { getChainDefaults } = require('./config');

const debug = Debug('iexec:chains');

const CHAIN_ALIASES_MAP = {
  1: 'mainnet',
  5: 'goerli',
  133: 'viviani',
  134: 'bellecour',
};

const CHAIN_NAME_MAP = {
  1: { id: 1, flavour: 'standard' },
  mainnet: { id: 1, flavour: 'standard' },
  5: { id: 5, flavour: 'standard' },
  goerli: { id: 5, flavour: 'standard' },
  133: { id: 133, flavour: 'standard' },
  viviani: { id: 133, flavour: 'standard' },
  134: { id: 134, flavour: 'standard' },
  bellecour: { id: 134, flavour: 'standard' },
  enterprise: { id: 1, flavour: 'enterprise' },
  'enterprise-sidechain': { id: 133, flavour: 'enterprise' },
};

const createChainFromConf = (
  chainName,
  chainConf,
  { bridgeConf, providersOptions } = {},
) => {
  try {
    const chain = { ...chainConf };
    const provider = getDefaultProvider(chainConf.host, providersOptions);
    chain.name = chainName;
    const contracts = new IExecContractsClient({
      provider,
      chainId: chain.id,
      hubAddress: chain.hub,
      isNative: chain.native,
      flavour: chain.flavour,
    });
    chain.contracts = contracts;
    if (bridgeConf) {
      chain.bridgedNetwork = { ...bridgeConf };
      const bridgeProvider = getDefaultProvider(
        bridgeConf.host,
        providersOptions,
      );
      chain.bridgedNetwork.contracts = new IExecContractsClient({
        provider: bridgeProvider,
        chainId: bridgeConf.id,
        hubAddress: bridgeConf.hub,
        isNative: bridgeConf.native,
        flavour: bridgeConf.flavour,
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
        const alias = CHAIN_ALIASES_MAP[chainName];
        if (alias && chainsConf.chains[alias]) {
          loadedConf = chainsConf.chains[alias];
          name = alias;
        }
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

    const idAndFlavour = {
      ...CHAIN_NAME_MAP[name],
      ...(loadedConf.id && { id: loadedConf.id }),
      ...(loadedConf.flavour && { flavour: loadedConf.flavour }),
    };

    const defaultConf = getChainDefaults(idAndFlavour);

    debug('loading chain', name);
    debug('loadedConf', loadedConf);
    debug('defaultConf', defaultConf);
    const conf = { ...idAndFlavour, ...defaultConf, ...loadedConf };
    debug('conf', conf);
    if (!conf.host) {
      throw Error(
        `Missing RPC host, no "host" key in "chain.json" and no default value for chain ${conf.id}`,
      );
    }

    let bridgeConf;
    const bridgedChainNameOrId = conf.bridge.bridgedChainName || conf.bridge.bridgedChainId;
    if (conf.bridge && bridgedChainNameOrId) {
      let bridgeLoadedConf;
      if (chainsConf.chains[bridgedChainNameOrId]) {
        bridgeLoadedConf = chainsConf.chains[bridgedChainNameOrId];
      } else {
        const alias = CHAIN_ALIASES_MAP[bridgedChainNameOrId];
        if (alias && chainsConf.chains[alias]) {
          bridgeLoadedConf = chainsConf.chains[alias];
        }
        if (!bridgeLoadedConf) throw Error(`Missing "${chainName}" chain in "chain.json"`);
      }
      const bridgedIdAndFlavour = {
        ...CHAIN_NAME_MAP[bridgedChainNameOrId],
        ...(bridgeLoadedConf.id && { id: bridgeLoadedConf.id }),
        ...(bridgeLoadedConf.flavour && { flavour: bridgeLoadedConf.flavour }),
      };
      const bridgeDefaultConf = getChainDefaults(bridgedIdAndFlavour);
      debug('bridgeLoadedConf', bridgeLoadedConf);
      debug('bridgeDefaultConf', defaultConf);
      bridgeConf = {
        ...bridgedIdAndFlavour,
        ...bridgeDefaultConf,
        ...bridgeLoadedConf,
      };
      if (!bridgeConf.host) {
        throw Error(
          `Missing RPC host for bridged chain, no "host" key in "chain.json" and no default value for bridged chain ${bridgeConf.id}`,
        );
      }
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
