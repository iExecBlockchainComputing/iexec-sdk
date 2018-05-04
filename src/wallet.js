const Debug = require('debug');
const Promise = require('bluebird');
const fetch = require('node-fetch');
const inquirer = require('inquirer');
const rlcJSON = require('rlc-faucet-contract/build/contracts/RLC.json');
const { Spinner } = require('./cli-helper');
const { getContractAddress, getRPCObjValue } = require('./utils');

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
        body: JSON.stringify({ toWhom: '0x'.concat(address) }),
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

  spinner.start(`Requesting ${chainName} faucet for nRLC...`);
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

const sendETH = async (chain, amount, to, account) => {
  const spinner = Spinner();

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'transfer',
      message: `Do you want to send ${amount} ${
        chain.name
      } ETH to ${to} [chainID: ${chain.id}]`,
    },
  ]);
  if (!answers.transfer) throw Error('Transfer aborted by user.');

  spinner.start(`Sending ${amount} ${chain.name} ETH to ${to}...`);

  const txHash = await chain.ethjs.sendTransaction({
    from: account,
    data: '0x',
    to,
    value: chain.EthJS.toWei(amount, 'ether'),
  });
  spinner.info(`transfer txHash: ${txHash} \n`);

  spinner.start('waiting for transaction to be mined');
  const txReceipt = await chain.contracts.waitForReceipt(txHash);
  debug('txReceipt:', txReceipt);

  spinner.succeed(`${amount} ${chain.name} ETH sent from ${account} to ${to}\n`);
  return txReceipt;
};

const sendRLC = async (chain, amount, to, token, account) => {
  const spinner = Spinner();

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'transfer',
      message: `Do you want to send ${amount} ${
        chain.name
      } nRLC to ${to} [chainID: ${chain.id}]`,
    },
  ]);
  if (!answers.transfer) throw Error('Transfer aborted by user.');

  spinner.start(`Sending ${amount} ${chain.name} nRLC to ${to}...`);

  const rlcAddress = token || getContractAddress(rlcJSON, chain.id);
  const rlcContract = chain.ethjs.contract(rlcJSON.abi).at(rlcAddress);

  const txHash = await rlcContract.transfer(to, amount, {
    from: account,
    data: '0x',
  });
  spinner.info(`transfer txHash: ${txHash} \n`);

  spinner.start('waiting for transaction to be mined');
  const txReceipt = await chain.contracts.waitForReceipt(txHash);
  debug('txReceipt:', txReceipt);

  const events = chain.contracts.decodeLogs(txReceipt.logs, rlcJSON.abi);
  debug('events', events);

  spinner.succeed(`${amount} ${chain.name} nRLC sent from ${account} to ${to}\n`);
  return events;
};

const sweep = async (chain, to, token, account) => {
  const spinner = Spinner();

  const rlcAddress = token || getContractAddress(rlcJSON, chain.id);
  const rlcContract = chain.ethjs.contract(rlcJSON.abi).at(rlcAddress);

  const rlcBalanceRPC = await rlcContract.balanceOf(account);
  const rlcBalance = getRPCObjValue(rlcBalanceRPC);
  debug('rlcBalance', rlcBalance.toNumber());
  if (rlcBalance.toNumber() > 0) {
    await sendRLC(chain.name, rlcBalance, to, token);
  }

  const ethBalance = await chain.ethjs
    .getBalance(account)
    .then(balance => chain.EthJS.fromWei(balance, 'ether'));
  debug('ethBalance', ethBalance);
  const ethToSweep = ethBalance - 0.01;
  if (ethToSweep > 0) await sendETH(chain.name, ethToSweep, to);

  spinner.succeed(`wallet swept from ${account} to ${to}\n`);
  return true;
};

module.exports = {
  getETH,
  getRLC,
  sendETH,
  sendRLC,
  sweep,
};
