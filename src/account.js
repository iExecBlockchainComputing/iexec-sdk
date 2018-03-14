const Debug = require('debug');
const fs = require('fs-extra');
const ora = require('ora');
const rlcJSON = require('rlc-faucet-contract/build/contracts/FaucetRLC.json');
const escrowJSON = require('iexec-oracle-contract/build/contracts/IexecOracleEscrow.json');
const Promise = require('bluebird');
const inquirer = require('inquirer');
const sigUtil = require('eth-sig-util');
const http = require('./api');
const { getChains, signAndSendTx, waitFor } = require('./utils');
const wallet = require('./wallet');
const oraOptions = require('./oraOptions');

const debug = Debug('iexec:account');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const LOGIN_CONFIRMATION = 'You are not logged in yet, log in?';
const ACCOUNT_FILE_NAME = 'account.json';

const save = async (account) => {
  const jsonAccount = JSON.stringify(account, null, 4);
  try {
    const fd = await openAsync(ACCOUNT_FILE_NAME, 'wx');
    await writeAsync(fd, jsonAccount, 0, 'utf8');
    return fs.close(fd);
  } catch (error) {
    if (error.code === 'EEXIST') {
      return writeFileAsync(ACCOUNT_FILE_NAME, jsonAccount);
    }
    debug('save() error', error);
    throw error;
  }
};

const login = async (authServer = 'https://auth.iex.ec') => {
  const spinner = ora(oraOptions);
  try {
    http.setAuthServer(authServer.concat('/'));
    const userWallet = await wallet.load();
    debug('userWallet', userWallet);
    spinner.start('logging into iExec...');

    const { message } = await http.get('typedmessage');
    debug('message', message);

    const msgJSON = JSON.stringify(message);

    const address = '0x'.concat(userWallet.address);
    const privateKeyBuffer = Buffer.from(userWallet.privateKey, 'hex');
    const signature = sigUtil.signTypedData(privateKeyBuffer, { data: message });
    debug('signature', signature);

    const { jwtoken } = await http.get('typedauth', { message: msgJSON, signature, address });
    debug('jwtoken', jwtoken);
    await save({ jwtoken });
    spinner.succeed('You are logged into iExec\n');
  } catch (error) {
    spinner.fail(`login() failed with ${error}`);
    throw error;
  }
};

const load = async () => {
  try {
    const accountJSON = await readFileAsync(ACCOUNT_FILE_NAME, 'utf8');
    debug('accountJSON', accountJSON);
    const account = JSON.parse(accountJSON);
    return account;
  } catch (error) {
    if (error.code === 'ENOENT') {
      const answers = await inquirer.prompt([{
        type: 'confirm',
        name: 'login',
        message: LOGIN_CONFIRMATION,
      }]);
      if (answers.login) {
        return login().then(() => load());
      }

      throw new Error('Aborting. You need to login to continue');
    }
    debug('load() error', error);
    throw error;
  }
};

const allow = async (chainName, amount) => {
  const spinner = ora(oraOptions);
  try {
    const userWallet = await wallet.load();
    const chain = getChains()[chainName];
    const escrowAddress = escrowJSON.networks[chain.id].address;
    const rlcAddress = rlcJSON.networks[chain.id].address;
    const rlcContract = chain.web3.eth.contract(rlcJSON.abi).at(rlcAddress);

    const creditAmount = parseInt(amount, 10);

    const unsignedTx = rlcContract.approve.getData(escrowAddress, creditAmount);
    spinner.start('credit nRLC on iExec account');
    const txHash = await signAndSendTx({
      chain,
      userWallet,
      unsignedTx,
      contractAddress: rlcAddress,
    });
    spinner.info(`txHash: ${txHash} \n`);

    spinner.start('waiting for transaction to be mined');
    const txReceipt = await waitFor(chain.web3.eth.getTransactionReceiptAsync, txHash);
    debug('txReceipt:', JSON.stringify(txReceipt, null, 4));
    spinner.info(`View on etherscan: https://${chainName}.etherscan.io/tx/${txReceipt.transactionHash}\n`);
    spinner.succeed(`Set you iExec account credit to ${amount} nRLC, run "iexec account show" to check \n`);
  } catch (error) {
    spinner.fail(`allow() failed with ${error}`);
    throw error;
  }
};

const show = async () => {
  const spinner = ora('Requesting iExec account details...');
  try {
    const userWallet = await wallet.load();
    const chains = getChains();

    const chainIDs = Object.keys(rlcJSON.networks).filter(id => id in chains);

    spinner.start();
    const rlcAllowances = await Promise.all(chainIDs.map((id) => {
      const rlcAddress = rlcJSON.networks[id].address;
      const rlcContract = chains[id].web3.eth.contract(rlcJSON.abi).at(rlcAddress);
      Promise.promisifyAll(rlcContract);
      const owner = '0x'.concat(userWallet.address);
      const escrow = escrowJSON.networks[id].address;
      return rlcContract.allowanceAsync(owner, escrow);
    }));
    spinner.succeed('iExec account details:\n');

    const rlcAllowancesString = chainIDs.reduce(
      (accu, curr, index) => accu.concat(`  ${chains[curr].name}: \t ${rlcAllowances[index]} nRLC\n`),
      '',
    );

    console.log('nRLC allowances:');
    console.log(rlcAllowancesString, '\n');
  } catch (error) {
    spinner.fail(`show() failed with ${error}`);
    throw error;
  }
};

module.exports = {
  login,
  allow,
  show,
  load,
};
