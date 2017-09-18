const Debug = require('debug');
const fs = require('fs');
const Web3 = require('web3');
const Promise = require('bluebird');
const path = require('path');
const ora = require('ora');
const wallet = require('./wallet');
const utils = require('./utils');
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:methods');
const readFileAsync = Promise.promisify(fs.readFile);

const send = async (walletType, networkName, truffleConfig, methodName, args) => {
  const spinner = ora();
  try {
    const fnString = methodName.concat('(', args.join(), ')');
    spinner.start(`calling ${fnString}`);
    const network = truffleConfig.networks[networkName];

    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);

    const compiledFile = await readFileAsync(`build/contracts/${iexecConfig.name}.json`);
    const { abi, networks } = JSON.parse(compiledFile);

    const contractAddress = networks[network.network_id].address;
    const contract = web3.eth.contract(abi).at(contractAddress);

    const unsignedTx = contract[methodName].getData(...args);

    if (walletType === 'local') {
      const userWallet = await wallet.load();

      const txHash = await utils.signAndSendTx({
        web3,
        userWallet,
        unsignedTx,
        network,
        contractAddress,
      });
      spinner.succeed(`${fnString} txHash: ${txHash} \n`);

      spinner.start('waiting for txReceipt');
      const txReceipt = await utils.waitFor(web3.eth.getTransactionReceiptAsync, txHash);
      spinner.succeed('txReceipt:');
      console.log(JSON.stringify(txReceipt, null, 4));
      console.log(`\nView on etherscan: https://${networkName}.etherscan.io/tx/${txReceipt.transactionHash}\n`);
    } else if (walletType === 'remote') {
      debug('remote wallet');
    }
  } catch (error) {
    spinner.fail();
    debug('send()', error);
    throw error;
  }
};

module.exports = {
  send,
};
