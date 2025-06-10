import Debug from 'debug';
import { getId, getChainDefaults } from '../../common/utils/config.js';
import IExecContractsClient from '../../common/utils/IExecContractsClient.js';
import { EnhancedWallet } from '../../common/utils/signers.js';
import { loadChainConf } from './fs.js';
import { Spinner } from './cli-helper.js';
import { getReadOnlyProvider } from '../../common/utils/providers.js';

const debug = Debug('iexec:chains');

const createChainFromConf = (
  chainName,
  chainConf,
  { bridgeConf, providerOptions, txOptions = {} } = {},
) => {
  try {
    const chain = { ...chainConf };
    const provider = getReadOnlyProvider(chainConf.host, {
      providers: providerOptions,
    });

    chain.name = chainName;
    const contracts = new IExecContractsClient({
      provider,
      chainId: chain.id,
      hubAddress: chain.hub,
      useGas: chain.useGas,
      isNative: chain.native,
      confirms: txOptions.confirms,
    });
    chain.contracts = contracts;
    if (bridgeConf) {
      chain.bridgedNetwork = { ...bridgeConf };
      const bridgeProvider = getReadOnlyProvider(bridgeConf.host, {
        providers: providerOptions,
      });
      chain.bridgedNetwork.contracts = new IExecContractsClient({
        provider: bridgeProvider,
        chainId: bridgeConf.id,
        hubAddress: bridgeConf.hub,
        useGas: bridgeConf.useGas,
        isNative: bridgeConf.native,
        confirms: txOptions.confirms,
      });
    }
    return chain;
  } catch (error) {
    debug('createChainFromConf()', error);
    throw error;
  }
};

export const loadChain = async (
  chainNameOrId,
  { txOptions, spinner = Spinner() } = {},
) => {
  try {
    const chainsConf = await loadChainConf();
    const providerOptions = chainsConf.providers;
    let name;
    let loadedConf;
    if (chainNameOrId) {
      if (chainsConf.chains[chainNameOrId]) {
        loadedConf = chainsConf.chains[chainNameOrId];
        name = chainNameOrId;
      } else {
        const { name: alias } = getChainDefaults({
          id: getId(chainNameOrId),
          allowExperimental: chainsConf.allowExperimentalNetworks,
        });
        if (alias && chainsConf.chains[alias]) {
          loadedConf = chainsConf.chains[alias];
          name = alias;
        }
        if (!name)
          throw Error(`Missing "${chainNameOrId}" chain in "chain.json"`);
      }
    } else if (chainsConf.default) {
      if (chainsConf.chains[chainsConf.default]) {
        name = chainsConf.default;
        loadedConf = chainsConf.chains[chainsConf.default];
      } else {
        throw Error(`Missing "${chainsConf.default}" chain in "chain.json"`);
      }
    }
    if (!name)
      throw Error('Missing chain parameter. Check your "chain.json" file');

    const idConf = {
      id: loadedConf.id || getId(name),
    };

    const defaultConf = getChainDefaults({
      id: idConf.id,
      allowExperimental: chainsConf.allowExperimentalNetworks,
    });

    debug('loading chain', name);
    debug('loadedConf', loadedConf);
    debug('defaultConf', defaultConf);
    const conf = { ...idConf, ...defaultConf, ...loadedConf };
    debug('conf', conf);
    if (!conf.host) {
      throw Error(
        `Missing RPC host, no "host" key in "chain.json" and no default value for chain ${conf.id}`,
      );
    }

    let bridgeConf;
    const bridgedChainNameOrId = conf.bridge && conf.bridge.bridgedChainName;
    if (bridgedChainNameOrId) {
      let bridgeLoadedConf;
      if (chainsConf.chains[bridgedChainNameOrId]) {
        bridgeLoadedConf = chainsConf.chains[bridgedChainNameOrId];
      } else {
        const { name: alias } = getChainDefaults({
          id: getId(bridgedChainNameOrId),
          allowExperimental: chainsConf.allowExperimentalNetworks,
        });
        if (alias && chainsConf.chains[alias]) {
          bridgeLoadedConf = chainsConf.chains[alias];
        }
        if (!bridgeLoadedConf)
          throw Error(`Missing "${name}" chain in "chain.json"`);
      }
      const bridgeIdConf = {
        id: bridgeLoadedConf.id || getId(bridgedChainNameOrId),
      };
      const bridgeDefaultConf = getChainDefaults(bridgeIdConf);
      debug('bridgeLoadedConf', bridgeLoadedConf);
      debug('bridgeDefaultConf', defaultConf);
      bridgeConf = {
        ...bridgeIdConf,
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
      providerOptions,
      txOptions,
    });
    spinner.info(`Using chain ${name} [chainId: ${chain.id}]`);
    return chain;
  } catch (error) {
    debug('loadChain()', error);
    throw error;
  }
};

export const connectKeystore = async (
  chain,
  keystore,
  { txOptions = {} } = {},
) => {
  const { privateKey } = await keystore.load();
  const keystoreOptions = { gasPrice: txOptions.gasPrice };
  chain.contracts.setSigner(
    new EnhancedWallet(privateKey, undefined, keystoreOptions),
  );
};
