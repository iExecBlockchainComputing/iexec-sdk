const Debug = require('debug');
const Web3 = require('web3');
const Promise = require('bluebird');
const ora = require('ora');
const truffle = require('./truffle-cli');
const wallet = require('./wallet');
const utils = require('./utils');

const debug = Debug('iexec:migrate');

const migrate = async (chainName) => {
  const spinner = ora({ color: 'yellow' });
  try {
    const network = utils.truffleConfig.networks[chainName];
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
      chainID: network.network_id,
    });
    spinner.info(`txHash: ${txHash} \n`);

    spinner.start('waiting for transaction to be mined');
    const txReceipt = await utils.waitFor(web3.eth.getTransactionReceiptAsync, txHash);
    debug('txReceipt:', JSON.stringify(txReceipt, null, 4));

    spinner.info(`View on etherscan: https://${chainName}.etherscan.io/tx/${txReceipt.transactionHash}\n`);

    spinner.start('saving contract address');
    const chainId = parseInt(web3.version.network, 10);
    contractDesc.networks[chainId] = { address: txReceipt.contractAddress };
    await utils.saveContractDesc(contractDesc);
    spinner.succeed(`Dapp contract deployed on ethereum. Contract address is ${txReceipt.contractAddress} \n`);
  } catch (error) {
    spinner.fail(`"iexec migrate" failed with ${error}`);
    throw error;
  }
};

module.exports = migrate;
