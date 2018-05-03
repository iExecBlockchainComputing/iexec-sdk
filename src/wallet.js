const Debug = require('debug');
const Promise = require('bluebird');
const fetch = require('node-fetch');
const inquirer = require('inquirer');
const keystore = require('./keystore');
const rlcJSON = require('rlc-faucet-contract/build/contracts/RLC.json');
const { Spinner, handleError } = require('./cli-helper');
const { getChains, getContractAddress, getRPCObjValue } = require('./utils');

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

const getETH = async (chainName) => {
  const spinner = Spinner();
  try {
    const userWallet = await keystore.load();

    spinner.start(`Requesting ETH from ${chainName} faucets...`);
    const filteredFaucets = ethFaucets.filter(e => e.chainName === chainName);
    const responses = await Promise.all(filteredFaucets.map(faucet => faucet.getETH(userWallet.address)));
    const responsesMessage = filteredFaucets.reduce(
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
    spinner.succeed('Faucets responses:\n');
    console.log(responsesMessage);
  } catch (error) {
    handleError(error, 'wallet', spinner);
  }
};

const rlcFaucets = [
  {
    name: 'faucet.iex.ec',
    getRLC: (chainName, address) =>
      fetch(`https://api.faucet.iex.ec/getRLC?chainName=${chainName}&address=${address}`).then(res => res.json()),
  },
];

const getRLC = async (chainName) => {
  const spinner = Spinner();
  try {
    const userWallet = await keystore.load();

    spinner.start(`Requesting ${chainName} faucet for nRLC...`);
    const responses = await Promise.all(rlcFaucets.map(faucet => faucet.getRLC(chainName, userWallet.address)));
    const responsesMessage = rlcFaucets.reduce(
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
    spinner.succeed('Faucets responses:\n');
    console.log(responsesMessage);
  } catch (error) {
    handleError(error, 'wallet', spinner);
  }
};

const sendETH = async (chainName, amount, to) => {
  const spinner = Spinner();
  try {
    const userWallet = await keystore.load();
    const chain = getChains()[chainName];

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'transfer',
        message: `Do you want to send ${amount} ${chainName} ETH to ${to} [chainID: ${
          chain.id
        }]`,
      },
    ]);
    if (!answers.transfer) throw Error('Transfer aborted by user.');

    spinner.start(`Sending ${amount} ${chainName} ETH to ${to}...`);

    const txHash = await chain.ethjs.sendTransaction({
      from: userWallet.address,
      data: '0x',
      to,
      value: chain.EthJS.toWei(amount, 'ether'),
    });
    spinner.info(`transfer txHash: ${txHash} \n`);

    spinner.start('waiting for transaction to be mined');
    const txReceipt = await chain.contracts.waitForReceipt(txHash);

    debug('txReceipt:', JSON.stringify(txReceipt, null, 4));

    spinner.succeed(`${amount} ${chainName} ETH sent to ${to}\n`);
  } catch (error) {
    handleError(error, 'wallet', spinner);
  }
};

const sendRLC = async (chainName, amount, to, token) => {
  const spinner = Spinner();
  try {
    const userWallet = await keystore.load();
    const chain = getChains()[chainName];

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'transfer',
        message: `Do you want to send ${amount} ${chainName} nRLC to ${to} [chainID: ${
          chain.id
        }]`,
      },
    ]);
    if (!answers.transfer) throw Error('Transfer aborted by user.');

    spinner.start(`Sending ${amount} ${chainName} nRLC to ${to}...`);

    const rlcAddress = token || getContractAddress(rlcJSON, chain.id);
    const rlcContract = chain.ethjs.contract(rlcJSON.abi).at(rlcAddress);

    const txHash = await rlcContract.transfer(to, amount, {
      from: userWallet.address,
      data: '0x',
    });
    spinner.info(`transfer txHash: ${txHash} \n`);

    spinner.start('waiting for transaction to be mined');
    const txReceipt = await chain.contracts.waitForReceipt(txHash);

    debug('txReceipt:', JSON.stringify(txReceipt, null, 4));

    spinner.succeed(`${amount} ${chainName} nRLC sent to ${to}\n`);
  } catch (error) {
    handleError(error, 'wallet', spinner);
  }
};

const sweep = async (chainName, to, token) => {
  const spinner = Spinner();
  try {
    const userWallet = await keystore.load();

    const chain = getChains()[chainName];

    const rlcAddress = token || getContractAddress(rlcJSON, chain.id);
    const rlcContract = chain.ethjs.contract(rlcJSON.abi).at(rlcAddress);

    const rlcBalanceRPC = await rlcContract.balanceOf(userWallet.address);
    const rlcBalance = getRPCObjValue(rlcBalanceRPC);
    debug('rlcBalance', rlcBalance.toNumber());
    if (rlcBalance.toNumber() > 0) {
      await sendRLC(chainName, rlcBalance, to, token);
    }

    const ethBalance = await chain.ethjs
      .getBalance(userWallet.address)
      .then(balance => chain.EthJS.fromWei(balance, 'ether'));
    debug('ethBalance', ethBalance);
    const ethToSweep = ethBalance - 0.01;
    if (ethToSweep > 0) await sendETH(chainName, ethToSweep, to);

    spinner.succeed(`wallet swept to ${to}\n`);
  } catch (error) {
    handleError(error, 'wallet', spinner);
  }
};

module.exports = {
  getETH,
  getRLC,
  sendETH,
  sendRLC,
  sweep,
};
