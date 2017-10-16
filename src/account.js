const Debug = require('debug');
const fs = require('fs-extra');
const ora = require('ora');
const rlcJSON = require('rlc-faucet-contract/build/contracts/FaucetRLC.json');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const wallet = require('./wallet');
const { getChains, signAndSendTx, waitFor } = require('./utils');
const Promise = require('bluebird');
const ethUtil = require('ethereumjs-util');
const sigUtil = require('eth-sig-util');
const inquirer = require('inquirer');
const http = require('./api');

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

const login = async () => {
  const spinner = ora();
  try {
    const userWallet = await wallet.load();
    debug('userWallet', userWallet);
    spinner.start('logging into iExec...');
    const { secret } = await http.get('secret');
    debug('secret', secret);

    const msgHashBuffer = ethUtil.hashPersonalMessage(ethUtil.toBuffer(secret));
    const msgHash = ethUtil.bufferToHex(msgHashBuffer);
    debug('msgHash', msgHash);
    const sig = ethUtil.ecsign(msgHashBuffer, ethUtil.toBuffer('0x'.concat(userWallet.privateKey)));
    const signature = ethUtil.bufferToHex(sigUtil.concatSig(sig.v, sig.r, sig.s));

    const { jwtoken } = await http.get('auth', { msgHash, signature });
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

const allow = async (networkName, cliArgs) => {
  const spinner = ora();
  try {
    const userWallet = await wallet.load();
    const chains = getChains();
    const chain = chains[networkName];
    const oracleAddress = oracleJSON.networks[chain.id].address;
    const rlcAddress = rlcJSON.networks[chain.id].address;
    const rlcContract = chain.web3.eth.contract(rlcJSON.abi).at(rlcAddress);

    const creditAmount = parseInt(cliArgs[0], 10);

    const unsignedTx = rlcContract.approve.getData(oracleAddress, creditAmount);
    spinner.start('credit RLC on iExec account');
    const txHash = await signAndSendTx({
      web3: chain.web3,
      userWallet,
      unsignedTx,
      network: chain,
      contractAddress: rlcAddress,
    });
    spinner.succeed(`txHash: ${txHash} \n`);

    spinner.start('waiting for txReceipt');
    const txReceipt = await waitFor(chain.web3.eth.getTransactionReceiptAsync, txHash);
    spinner.succeed('txReceipt:');
    console.log(JSON.stringify(txReceipt, null, 4));
    console.log(`\nView on etherscan: https://${networkName}.etherscan.io/tx/${txReceipt.transactionHash}\n`);
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

    const chainIDs = Object.keys(rlcJSON.networks);

    spinner.start();
    const rlcAllowances = await Promise.all(chainIDs.map((id) => {
      const rlcAddress = rlcJSON.networks[id].address;
      const rlcContract = chains[id].web3.eth.contract(rlcJSON.abi).at(rlcAddress);
      Promise.promisifyAll(rlcContract);
      const owner = '0x'.concat(userWallet.address);
      const spender = oracleJSON.networks[id].address;
      return rlcContract.allowanceAsync(owner, spender);
    }));
    spinner.succeed('iExec account details:\n');

    const rlcAllowancesString = chainIDs.reduce(
      (accu, curr, index) => accu.concat(`  ${chains[curr].name}: \t ${rlcAllowances[index]} RLC\n`),
      '',
    );

    console.log('RLC credits:');
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
