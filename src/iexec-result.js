#!/usr/bin/env node

const Debug = require('debug');
const fs = require('fs');
const Promise = require('bluebird');
const cli = require('commander');
const ora = require('ora');
const Web3 = require('web3');
const path = require('path');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const wallet = require('./wallet');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:iexec-result');
const readFileAsync = Promise.promisify(fs.readFile);

cli
  .option('--chain, --network [name]', 'network name', 'ropsten')
  .parse(process.argv);

debug('cli.args', cli.args);

const fetchResults = async () => {
  const spinner = ora();
  try {
    const network = truffleConfig.networks[cli.network];
    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);
    const userWallet = await wallet.load();

    spinner.start('Fetching submitted jobs results');

    const providerFileJSONPath = path.join('.', 'build', 'contracts', `${iexecConfig.name}.json`);
    const providerFileJSON = await readFileAsync(providerFileJSONPath);
    const providerJSON = JSON.parse(providerFileJSON);

    const providerAddress = providerJSON.networks[network.network_id].address;
    const oracleAddress = oracleJSON.networks[network.network_id].address;

    const oracle = web3.eth.contract(oracleJSON.abi).at(oracleAddress);
    Promise.promisifyAll(oracle);

    debug('user address', '0x'.concat(userWallet.address.toString('hex')));
    debug('providerAddress', providerAddress);

    const [txReceipt, result] = await Promise.all([
      web3.eth.getTransactionReceiptAsync(cli.args[0]),
      oracle.getWorkAsync(cli.args[0]),
    ]);
    debug('txReceipt', txReceipt);
    if (txReceipt === null) throw Error('Transaction hash does not exist');

    debug('result', result);

    if (!result[4] && !result[5]) {
      spinner.info('PENDING...');
      return;
    }

    spinner.succeed('Result:');
    console.log(JSON.stringify(result, null, 4));
  } catch (error) {
    spinner.fail(`"iexec result" failed with ${error}`);
  }
};
fetchResults();
