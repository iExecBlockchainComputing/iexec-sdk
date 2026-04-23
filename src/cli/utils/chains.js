import Debug from 'debug';
import { getId, getChainDefaults } from '../../common/utils/config.js';
import IExecContractsClient from '../../common/utils/IExecContractsClient.js';
import { loadChainConf } from './fs.js';
import { Spinner } from './cli-helper.js';
import { getReadOnlyProvider } from '../../common/utils/providers.js';
import { Wallet } from 'ethers';

const debug = Debug('iexec:chains');

const createChainFromConf = (
  chainName,
  chainConf,
  { txOptions = {}, allowExperimentalNetworks = false } = {},
) => {
  try {
    const chain = { ...chainConf };
    const provider = getReadOnlyProvider(chainConf.host, {
      allowExperimentalNetworks,
    });

    chain.name = chainName;
    const contracts = new IExecContractsClient({
      provider,
      chainId: chain.id,
      hubAddress: chain.hub,
      confirms: txOptions.confirms,
    });
    chain.contracts = contracts;
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
    const { allowExperimentalNetworks } = chainsConf;
    let name;
    let loadedConf;
    if (chainNameOrId) {
      if (chainsConf.chains[chainNameOrId]) {
        loadedConf = chainsConf.chains[chainNameOrId];
        name = chainNameOrId;
      } else {
        const { name: alias } = getChainDefaults(
          getId(chainNameOrId, {
            allowExperimentalNetworks,
          }),
          {
            allowExperimentalNetworks,
          },
        );
        if (alias && chainsConf.chains[alias]) {
          loadedConf = chainsConf.chains[alias];
          name = alias;
        }
        if (!name)
          throw new Error(`Missing "${chainNameOrId}" chain in "chain.json"`);
      }
    } else if (chainsConf.default) {
      if (chainsConf.chains[chainsConf.default]) {
        name = chainsConf.default;
        loadedConf = chainsConf.chains[chainsConf.default];
      } else {
        throw new Error(
          `Missing "${chainsConf.default}" chain in "chain.json"`,
        );
      }
    }
    if (!name)
      throw new Error('Missing chain parameter. Check your "chain.json" file');

    const idConf = {
      id:
        loadedConf.id ||
        getId(name, {
          allowExperimentalNetworks,
        }),
    };

    const defaultConf = getChainDefaults(idConf.id, {
      allowExperimentalNetworks,
    });

    debug('loading chain', name);
    debug('loadedConf', loadedConf);
    debug('defaultConf', defaultConf);
    const conf = { ...idConf, ...defaultConf, ...loadedConf };
    debug('conf', conf);
    if (!conf.host) {
      throw new Error(
        `Missing RPC host, no "host" key in "chain.json" and no default value for chain ${conf.id}`,
      );
    }
    const chain = createChainFromConf(name, conf, {
      txOptions,
      allowExperimentalNetworks,
    });
    spinner.info(`Using chain ${name} [chainId: ${chain.id}]`);
    return chain;
  } catch (error) {
    debug('loadChain()', error);
    throw error;
  }
};

export const connectKeystore = async (chain, keystore) => {
  const { privateKey } = await keystore.load();
  chain.contracts.setSigner(new Wallet(privateKey));
};
