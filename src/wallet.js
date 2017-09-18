const Debug = require('debug');
const fs = require('fs-extra');
const Web3 = require('web3');
const ora = require('ora');
const Promise = require('bluebird');
const inquirer = require('inquirer');
const fetch = require('node-fetch');
const { genKeyPair } = require('@warren-bank/ethereumjs-tx-sign/lib/keypairs');
const { privateToPublic } = require('@warren-bank/ethereumjs-tx-sign/lib/keypairs');
const { publicToAddress } = require('@warren-bank/ethereumjs-tx-sign/lib/keypairs');
const path = require('path');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));

const debug = Debug('iexec:wallet');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const WALLET_FILE_NAME = 'wallet.json';
const OVERWRITE_CONFIRMATION = `${WALLET_FILE_NAME} already exists, replace it with new wallet? (y/n):`;
const CREATE_CONFIRMATION = `You don't have a ${WALLET_FILE_NAME} yet, create one?`;

const walletFromPrivKey = (privateKey) => {
  const publicKey = privateToPublic(privateKey);
  const address = publicToAddress(publicKey);

  return {
    privateKey,
    publicKey,
    address,
  };
};

const save = async (userWallet) => {
  const userJSONWallet = JSON.stringify(userWallet, null, 4);
  try {
    const fd = await openAsync(WALLET_FILE_NAME, 'wx');
    await writeAsync(fd, userJSONWallet, 0, 'utf8');
    return fs.close(fd);
  } catch (error) {
    if (error.code === 'EEXIST') {
      const answers = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: OVERWRITE_CONFIRMATION,
      }]);
      if (answers.overwrite) {
        return writeFileAsync(WALLET_FILE_NAME, userJSONWallet);
      }
      return console.log('keeping old wallet');
    }
    debug('save() error', error);
    throw error;
  }
};

const create = async () => {
  const userWallet = genKeyPair();
  await save(userWallet);
  console.log('Wallet successfully created!');
  return userWallet;
};

const load = async () => {
  try {
    const userWalletJSON = await readFileAsync(WALLET_FILE_NAME, 'utf8');
    debug('userWalletJSON', userWalletJSON);
    const userWallet = JSON.parse(userWalletJSON);
    return walletFromPrivKey(userWallet.privateKey);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const answers = await inquirer.prompt([{
        type: 'confirm',
        name: 'create',
        message: CREATE_CONFIRMATION,
      }]);
      if (answers.create) {
        return create();
      }

      throw new Error('Aborting. You need a wallet to continue');
    }
    debug('load() error', error);
    throw error;
  }
};

const faucets = [
  {
    networkName: 'ropsten',
    name: 'faucet.ropsten.be',
    getETH: address => fetch(`http://faucet.ropsten.be:3001/donate/${address}`).then(res => res.json()),
  },
  {
    networkName: 'ropsten',
    name: 'ropsten.faucet.b9lab.com',
    getETH: address => fetch('https://ropsten.faucet.b9lab.com/tap',
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ toWhom: '0x'.concat(address) }),
      }).then(res => res.json()),
  },
  {
    networkName: 'rinkeby',
    name: 'faucet.rinkeby.io',
    getETH: () => ({ message: 'Go to https://faucet.rinkeby.io/ to manually ask for ETH' }),
  },
  {
    networkName: 'kovan',
    name: 'gitter.im/kovan-testnet/faucet',
    getETH: () => ({ message: 'Go to https://gitter.im/kovan-testnet/faucet to manually ask for ETH' }),
  },
];

const getETH = async (networkName) => {
  const spinner = ora('Requesting faucets for ETH...').start();
  try {
    const userWallet = await load();
    debug('networkName', networkName);
    const filteredFaucets = faucets.filter(e => e.networkName === networkName);
    const responses = await Promise.all(
      filteredFaucets.map(faucet => faucet.getETH(userWallet.address)));
    const responsesMessage = filteredFaucets.reduce((accu, curr, index) =>
      accu.concat('- ', curr.name, ' : \n', JSON.stringify(responses[index], null, '\t'), '\n\n'), '');
    spinner.succeed('Faucets responses:\n');
    console.log(responsesMessage);
  } catch (error) {
    spinner.fail(`getETH() failed with ${error}`);
    throw error;
  }
};

const show = async () => {
  const spinner = ora();
  try {
    const userWallet = await load();

    console.log('Wallet:\n');
    console.log(JSON.stringify(userWallet, null, 4), '\n');
    spinner.start('Checking ETH balances...');

    const networkNames = Object.keys(truffleConfig.networks);
    const providers = networkNames.map(
      name => new Web3(new Web3.providers.HttpProvider(truffleConfig.networks[name].host)));
    debug('providers', providers);
    providers.map(e => Promise.promisifyAll(e.eth));
    const balances = await Promise.all(
      providers.map(web3 => web3.eth.getBalanceAsync(userWallet.address).then(balance => web3.fromWei(balance, 'ether')).catch(() => 0)));
    spinner.succeed('ETH balances:\n');
    const balancesString = balances.reduce(
      (accu, curr, index) => accu.concat(`  ${networkNames[index]}: \t ${curr} ETH \t\t https://${networkNames[index]}.etherscan.io/address/${userWallet.address}\n`),
      '',
    );

    console.log(balancesString, '\n');
    console.log('Run "iexec wallet getETH" to top up your account');
  } catch (error) {
    spinner.fail(`show() failed with ${error}`);
    throw error;
  }
};

module.exports = {
  create,
  load,
  getETH,
  show,
};
