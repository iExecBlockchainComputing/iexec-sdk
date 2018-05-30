const Debug = require('debug');
const Promise = require('bluebird');
const fetch = require('node-fetch');
const EthJS = require('ethjs');
const { Spinner } = require('./cli-helper');

const debug = Debug('iexec:wallet');

const ethFaucets = [
  {
    chainName: 'ropsten',
    name: 'faucet.ropsten.be',
    getETH: address =>
      fetch(`http://faucet.ropsten.be:3001/donate/${address}`)
        .then(res => res.json())
        .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'ropsten',
    name: 'ropsten.faucet.b9lab.com',
    getETH: address =>
      fetch('https://ropsten.faucet.b9lab.com/tap', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ toWhom: address }),
      })
        .then(res => res.json())
        .catch(() => ({ error: 'ETH faucet is down.' })),
  },
  {
    chainName: 'rinkeby',
    name: 'faucet.rinkeby.io',
    getETH: () => ({
      message: 'Go to https://faucet.rinkeby.io/ to manually ask for ETH',
    }),
  },
  {
    chainName: 'kovan',
    name: 'gitter.im/kovan-testnet/faucet',
    getETH: () => ({
      message:
        'Go to https://gitter.im/kovan-testnet/faucet to manually ask for ETH',
    }),
  },
];

const checkBalances = async (contracts, address, { hub } = {}) => {
  const rlcAddress = await contracts.fetchRLCAddress({ hub });

  const getETH = () =>
    contracts.eth.getBalance(address).catch((error) => {
      debug(error);
      return 0;
    });
  const getRLC = () =>
    contracts
      .getRLCContract({
        at: rlcAddress,
      })
      .balanceOf(address)
      .then(({ balance }) => balance)
      .catch((error) => {
        debug(error);
        return 0;
      });

  const [weiBalance, rlcBalance] = await Promise.all([getETH(), getRLC()]);
  const balances = {
    wei: weiBalance,
    nRLC: rlcBalance,
  };
  debug('balances', balances);
  return balances;
};

const getETH = async (chainName, account) => {
  const spinner = Spinner();
  spinner.start(`requesting ETH from ${chainName} faucets...`);

  const filteredFaucets = ethFaucets.filter(e => e.chainName === chainName);
  const responses = await Promise.all(filteredFaucets.map(faucet => faucet.getETH(account)));
  const responsesString = filteredFaucets.reduce(
    (accu, curr, index) =>
      accu.concat(
        '- ',
        curr.name,
        ' : \n',
        JSON.stringify(responses[index], null, '\t'),
        '\n\n',
      ),
    '',
  );
  spinner.succeed(`Faucets responses:\n${responsesString}`);
  return responses;
};

const rlcFaucets = [
  {
    name: 'faucet.iex.ec',
    getRLC: (chainName, address) =>
      fetch(`https://api.faucet.iex.ec/getRLC?chainName=${chainName}&address=${address}`).then(res => res.json()),
  },
];

const getRLC = async (chainName, account) => {
  const spinner = Spinner();

  spinner.start(`requesting ${chainName} faucet for nRLC...`);
  const responses = await Promise.all(rlcFaucets.map(faucet => faucet.getRLC(chainName, account)));
  const responsesString = rlcFaucets.reduce(
    (accu, curr, index) =>
      accu.concat(
        '- ',
        curr.name,
        ' : \n',
        JSON.stringify(responses[index], null, '\t'),
        '\n\n',
      ),
    '',
  );
  spinner.succeed(`Faucets responses:\n${responsesString}`);
  return responses;
};

const sendETH = async (contracts, value, from, to) => {
  const txHash = await contracts.eth.sendTransaction({
    from,
    data: '0x',
    to,
    value,
  });

  const txReceipt = await contracts.waitForReceipt(txHash);
  debug('txReceipt:', txReceipt);

  return txReceipt;
};

const sendRLC = async (contracts, amount, to, { hub } = {}) => {
  const rlcAddress = await contracts.fetchRLCAddress({ hub });
  debug('rlcAddress', rlcAddress);

  const rlcContract = contracts.getRLCContract({ at: rlcAddress });

  const txHash = await rlcContract.transfer(to, amount);
  debug('txHash', txHash);

  const txReceipt = await contracts.waitForReceipt(txHash);
  debug('txReceipt', txReceipt);

  return txReceipt;
};

const sweep = async (contracts, address, to, { hub } = {}) => {
  const balances = await checkBalances(contracts, address, { hub });

  if (balances.nRLC.gt(new EthJS.BN(0))) {
    await sendRLC(contracts, balances.nRLC, to, { hub });
  }

  const txFee = new EthJS.BN('10000000000000000');
  debug('txFee.toString()', txFee.toString());
  debug('balances.wei.toString()', balances.wei.toString());

  debug('balances.wei.gt(txFee)', balances.wei.gt(txFee));

  const sweepETH = balances.wei.sub(txFee);
  debug('sweepETH.toString()', sweepETH.toString());
  if (balances.wei.gt(new EthJS.BN(txFee))) {
    await sendETH(contracts, sweepETH, address, to);
  }
  return true;
};

module.exports = {
  checkBalances,
  getETH,
  getRLC,
  sendETH,
  sendRLC,
  sweep,
};
