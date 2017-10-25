const Debug = require('debug');
const Web3 = require('web3');
const Promise = require('bluebird');
const ora = require('ora');
const truffle = require('./truffle-cli');
const wallet = require('./wallet');
const utils = require('./utils');

const debug = Debug('iexec:migrate');

const migrate = async (cliNetwork) => {
  const spinner = ora();
  try {
    const network = utils.truffleConfig.networks[cliNetwork];
    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);

    await truffle.compile();

    const contractDesc = await utils.loadContractDesc();
    const { abi, unlinked_binary } = contractDesc;

    const Contract = web3.eth.contract(abi);

    const constructorArgs = network.constructorArgs || [];

    const unsignedTx = Contract.new.getData(...constructorArgs, { data: unlinked_binary });
    debug('unsignedTx', unsignedTx);

    const userWallet = await wallet.load();

    spinner.start(`Deploying ${utils.iexecConfig.name} contract...`);
    const txHash = await utils.signAndSendTx({
      web3,
      userWallet,
      unsignedTx,
      network,
    });
    spinner.succeed(`new contract txHash: ${txHash} \n`);

    spinner.start('waiting for txReceipt');
    const txReceipt = await utils.waitFor(web3.eth.getTransactionReceiptAsync, txHash);
    spinner.succeed('new contract txReceipt:');
    console.log(JSON.stringify(txReceipt, null, 4));
    console.log(`View on etherscan: https://${cliNetwork}.etherscan.io/tx/${txReceipt.transactionHash}\n`);

    const chainId = parseInt(web3.version.network, 10);
    contractDesc.networks[chainId] = { address: txReceipt.contractAddress };
    const path = await utils.saveContractDesc(contractDesc);
    console.log(`saved new contract address to ${path}\n`);
  } catch (error) {
    spinner.fail(`"iexec migrate" failed with ${error}`);
  }
};
module.exports = migrate;
