const Debug = require('debug');
const Promise = require('bluebird');
const EthJS = require('ethjs');
const SignerProvider = require('ethjs-custom-signer');
const createIExecContracts = require('iexec-contracts-js-client');
const createIExecClient = require('iexec-server-js-client');
const keystore = require('./keystore');
const { loadChainConf } = require('./fs');
const { Spinner } = require('./cli-helper');

const debug = Debug('iexec:chains');

const createChains = (
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
      chains[name].iexec = createIExecClient({ server: chain.server });
      chains[name].contracts = createIExecContracts({
        eth: chains[name].ethjs,
        chainID: chains[name].id,
        txOptions: {
          from,
        },
        hubAddress: chains[name].hub,
      });
      // index by chainID
      chains[chain.id] = chains[name];
    });
    return chains;
  } catch (error) {
    debug('createChains()', error);
    throw error;
  }
};

const loadChains = async () => {
  try {
    const [{ address }, chainsConf] = await Promise.all([
      keystore.load(),
      loadChainConf(),
    ]);
    const chains = createChains(address, chainsConf, keystore);
    if (chainsConf.default) chains.default = chainsConf.default;
    return chains;
  } catch (error) {
    debug('loadChains()', error);
    throw error;
  }
};

const loadChain = async (chainName) => {
  const spinner = Spinner();
  try {
    const chains = await loadChains();
    if (chainName) {
      if (!(chainName in chains)) {
        throw Error(`missing "${chainName}" chain in "chains.json"`);
      }
      spinner.info(`using chain [${chainName}]`);
      return chains[chainName];
    }
    if (chains.default) {
      if (!(chains.default in chains)) {
        throw Error(`missing "${chains.default}" chain in "chains.json"`);
      }
      spinner.info(`using chain [${chains.default}]`);
      return chains[chains.default];
    }
    if ('ropsten' in chains) {
      spinner.info('using chain [ropsten]');
      return chains.ropsten;
    }
    throw Error('missing chain parameter. Check your "chains.json" file');
  } catch (error) {
    debug('loadChain()', error);
    throw error;
  }
};

module.exports = {
  loadChains,
  loadChain,
};
