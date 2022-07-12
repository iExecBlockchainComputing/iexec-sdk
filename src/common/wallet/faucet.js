const Debug = require('debug');
const fetch = require('cross-fetch');
const { addressSchema, throwIfMissing } = require('../utils/validator');

const debug = Debug('iexec:wallet:faucet');

const ethFaucets = [
  {
    chainName: 'ropsten',
    name: 'faucet.ropsten.be',
    getETH: (address) =>
      fetch(`http://faucet.ropsten.be:3001/donate/${address}`)
        .then((res) => res.json())
        .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'ropsten',
    name: 'ropsten.faucet.b9lab.com',
    getETH: (address) =>
      fetch('https://ropsten.faucet.b9lab.com/tap', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ toWhom: address }),
      })
        .then((res) => res.json())
        .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'rinkeby',
    name: 'faucet.rinkeby.io',
    getETH: () => ({
      error: 'Go to https://faucet.rinkeby.io/ to manually ask for ETH',
    }),
  },
  {
    chainName: 'kovan',
    name: 'gitter.im/kovan-testnet/faucet',
    getETH: () => ({
      error:
        'Go to https://gitter.im/kovan-testnet/faucet to manually ask for ETH',
    }),
  },
  {
    chainName: 'kovan',
    name: 'faucet.kovan.network',
    getETH: () => ({
      error: 'Go to https://faucet.kovan.network to manually ask for ETH',
    }),
  },
  {
    chainName: 'goerli',
    name: 'goerli-faucet.slock.it',
    getETH: () => ({
      error: 'Go to https://goerli-faucet.slock.it/ to manually ask for ETH',
    }),
  },
];

const getETH = async (
  chainName = throwIfMissing(),
  account = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(account);
    const filteredFaucets = ethFaucets.filter((e) => e.chainName === chainName);
    if (filteredFaucets.length === 0)
      throw Error(`No ETH faucet on chain ${chainName}`);
    const faucetsResponses = await Promise.all(
      filteredFaucets.map((faucet) => faucet.getETH(vAddress)),
    );
    const responses = filteredFaucets.reduce((accu, curr, index) => {
      accu.push({
        name: curr.name,
        response: faucetsResponses[index],
      });
      return accu;
    }, []);
    return responses;
  } catch (error) {
    debug('getETH()', error);
    throw error;
  }
};

const rlcFaucets = [
  {
    name: 'faucet.iex.ec',
    getRLC: (chainName, address) =>
      fetch(
        `https://api.faucet.iex.ec/getRLC?chainName=${chainName}&address=${address}`,
      ).then((res) => res.json()),
  },
];

const getRLC = async (
  chainName = throwIfMissing(),
  account = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(account);
    const faucetsResponses = await Promise.all(
      rlcFaucets.map((faucet) => faucet.getRLC(chainName, vAddress)),
    );
    const responses = rlcFaucets.reduce((accu, curr, index) => {
      accu.push({
        name: curr.name,
        response: faucetsResponses[index],
      });
      return accu;
    }, []);
    return responses;
  } catch (error) {
    debug('getRLC()', error);
    throw error;
  }
};

module.exports = {
  getETH,
  getRLC,
};
