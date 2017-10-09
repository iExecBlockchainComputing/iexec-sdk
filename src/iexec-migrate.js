#!/usr/bin/env node

const Debug = require('debug');
const fs = require('fs');
const Web3 = require('web3');
const Promise = require('bluebird');
const cli = require('commander');
const path = require('path');
const ora = require('ora');
const truffle = require('./truffle-cli');
const wallet = require('./wallet');
const utils = require('./utils');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:iexec-migrate');
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

cli
  .option('--network [name]', 'migrate to network name', 'ropsten')
  .option('--wallet <type>', 'choose type of wallet', /^(local|remote)$/i, 'local')
  .parse(process.argv);

const migrate = async () => {
  const spinner = ora();
  try {
    const network = truffleConfig.networks[cli.network];
    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);

    await truffle.compile();

    const compiledFileJSONPath = path.join('build', 'contracts', `${iexecConfig.name}.json`);
    const compiledFileJSON = await readFileAsync(compiledFileJSONPath);
    const compiledFile = JSON.parse(compiledFileJSON);
    const { abi, unlinked_binary } = compiledFile;

    const Contract = web3.eth.contract(abi);

    const constructorArgs = iexecConfig.constructorArgs || [];

    const unsignedTx = Contract.new.getData(constructorArgs, { data: unlinked_binary });
    debug('unsignedTx', unsignedTx);
    if (cli.wallet === 'local') {
      const userWallet = await wallet.load();

      spinner.start(`Deploying ${iexecConfig.name} contract...`);
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
      console.log(`View on etherscan: https://${cli.network}.etherscan.io/tx/${txReceipt.transactionHash}\n`);

      const chainId = parseInt(web3.version.network, 10);
      compiledFile.networks[chainId] = { address: txReceipt.contractAddress };
      await writeFileAsync(compiledFileJSONPath, JSON.stringify(compiledFile, null, 4));
      console.log(`saved new contract address to ${compiledFileJSONPath}\n`);
    } else if (cli.wallet === 'remote') {
      debug('remote');
    }
  } catch (error) {
    spinner.fail(`"iexec migrate" failed with ${error}`);
  }
};
migrate();
