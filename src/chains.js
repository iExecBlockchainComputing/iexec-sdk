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
  { txOptions = {} } = {},
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
    const ethSignerProvider = new SignerProvider(chainConf.host, signerOptions);
    chain.name = chainName;
    chain.contracts = createIExecContracts({
      ethSignerProvider,
      chainId: chain.id,
      hubAddress: chain.hub,
      isNative: !!chain.native,
    });
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
        if (!name) throw Error(`missing "${chainName}" chain in "chain.json"`);
      }
    } else if (chainsConf.default) {
      if (chainsConf.chains[chainsConf.default]) {
        name = chainsConf.default;
        conf = chainsConf.chains[chainsConf.default];
      } else {
        throw Error(`missing "${chainsConf.default}" chain in "chain.json"`);
      }
    } else if (chainsConf.chains && chainsConf.chains.kovan) {
      name = 'kovan';
      conf = chainsConf.chain.kovan;
    }
    if (!name) throw Error('missing chain parameter. Check your "chain.json" file');
    debug('loading chain', name, conf);
    const chain = createChainFromConf(name, conf, keystore, { txOptions });
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
