const Debug = require('debug');
const fs = require('fs-extra');
const Promise = require('bluebird');
const inquirer = require('inquirer');
const { genKeyPair } = require('@warren-bank/ethereumjs-tx-sign/lib/keypairs');

const debug = Debug('iexec:wallet');
const writeAsync = Promise.promisify(fs.write);
const writeFileAsync = Promise.promisify(fs.writeFile);

const WALLET_FILE_NAME = 'wallet.json';
const OVERWRITE_CONFIRMATION = `${WALLET_FILE_NAME} already exists, replace it with new wallet? (y/n):`;

const save = async (userWallet) => {
  fs.open(WALLET_FILE_NAME, 'wx', async (error, fd) => {
    const userJSONWallet = JSON.stringify(userWallet, null, 4);
    if (error && error.code === 'EEXIST') {
      const answers = await inquirer.prompt([{
        type: 'confirm',
        name: 'answer',
        message: OVERWRITE_CONFIRMATION,
      }]);
      if (answers.answer) {
        return writeFileAsync(WALLET_FILE_NAME, userJSONWallet);
      }
      return console.log('keeping old wallet');
    } else if (error) {
      debug('error', error);
      throw error;
    }
    await writeAsync(fd, Buffer.from(userJSONWallet, 'utf8'));
    return fs.close(fd);
  });
};

const create = async () => {
  debug('wallet');
  const userWallet = genKeyPair();
  await save(userWallet);
};

module.exports = {
  create,
};
