const Debug = require('debug');
const fs = require('fs-extra');
const Promise = require('bluebird');
const inquirer = require('inquirer');
const fetch = require('node-fetch');
const { genKeyPair } = require('@warren-bank/ethereumjs-tx-sign/lib/keypairs');
const { privateToPublic } = require('@warren-bank/ethereumjs-tx-sign/lib/keypairs');
const { publicToAddress } = require('@warren-bank/ethereumjs-tx-sign/lib/keypairs');

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
    name: 'facet.ropsten.be',
    getETH: address => fetch(`http://faucet.ropsten.be:3001/donate/${address}`).then(res => res.json()),
  },
  {
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
];

const getETH = async () => {
  try {
    const userWallet = await load();
    const responses = await Promise.all(faucets.map(faucet => faucet.getETH(userWallet.address)));
    const responsesMessage = faucets.reduce((accu, curr, index) =>
      accu.concat('- ', curr.name, ' : \n', JSON.stringify(responses[index], null, '\t'), '\n\n'), '');
    console.log(responsesMessage);
  } catch (error) {
    debug('getETH() error', error);
    throw error;
  }
};

module.exports = {
  create,
  load,
  getETH,
};
