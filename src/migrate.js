const Debug = require('debug');
const ora = require('ora');
const truffle = require('./truffle-cli');
const wallet = require('./wallet');
const utils = require('./utils');
const oraOptions = require('./oraOptions');

const debug = Debug('iexec:migrate');

const migrate = async (chainName) => {
  const spinner = ora(oraOptions);
  try {
    const chain = utils.getChains()[chainName];

    await truffle.compile();

    const contractDesc = await utils.loadContractDesc();
    const { abi, bytecode } = contractDesc;

    const Contract = chain.web3.eth.contract(abi);

    const constructorArgs = chain.constructorArgs || [];

    const unsignedTx = Contract.new.getData(...constructorArgs, {
      data: bytecode,
    });
    debug('unsignedTx', unsignedTx);

    const userWallet = await wallet.load();

    spinner.start(`Deploying ${utils.iexecConfig.name} contract...`);
    const txHash = await utils.signAndSendTx({
      chain,
      userWallet,
      unsignedTx,
    });
    spinner.info(`txHash: ${txHash} \n`);

    spinner.start('waiting for transaction to be mined');
    const txReceipt = await utils.waitFor(
      chain.web3.eth.getTransactionReceiptAsync,
      txHash,
    );
    debug('txReceipt:', JSON.stringify(txReceipt, null, 4));

    spinner.info(`View on the iExec Explorer: https://explorer.iex.ec/${chainName}/tx/${
      txReceipt.transactionHash
    }\n`);

    spinner.start('saving contract address');
    contractDesc.networks[chain.id] = { address: txReceipt.contractAddress };
    await utils.saveContractDesc(contractDesc);
    spinner.succeed(`Dapp contract deployed on ethereum. Contract address is ${
      txReceipt.contractAddress
    } \n`);
  } catch (error) {
    spinner.fail(`"iexec migrate" failed with ${error}`);
    throw error;
  }
};

module.exports = migrate;
