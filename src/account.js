const Debug = require('debug');
const ora = require('ora');
const rlcJSON = require('rlc-faucet-contract/build/contracts/FaucetRLC.json');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const wallet = require('./wallet');
const { getChains, signAndSendTx, waitFor } = require('./utils');
const Promise = require('bluebird');

const debug = Debug('iexec:account');

const login = async () => {
  const spinner = ora();
  try {
    const userWallet = await wallet.load();
    debug('userWallet', userWallet);
    spinner.start('logging in iExec...');
    spinner.succeed('You are logged into iExec\n');
  } catch (error) {
    spinner.fail(`login() failed with ${error}`);
    throw error;
  }
};

const setCredit = async (networkName, cliArgs) => {
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
    spinner.fail(`setCredit() failed with ${error}`);
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
  setCredit,
  show,
};
