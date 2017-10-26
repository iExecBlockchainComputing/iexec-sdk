const Debug = require('debug');
const Promise = require('bluebird');
const ora = require('ora');
const Web3 = require('web3');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const wallet = require('./wallet');
const utils = require('./utils');

const debug = Debug('iexec:result');

const fetchResults = async (txHash, chainName) => {
  const spinner = ora({ color: 'yellow' });
  try {
    const network = utils.truffleConfig.networks[chainName];
    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);
    const userWallet = await wallet.load();

    spinner.start('Fetching submitted job result');

    const contractDesc = await utils.loadContractDesc();

    const providerAddress = contractDesc.networks[network.network_id].address;
    const oracleAddress = oracleJSON.networks[network.network_id].address;

    const oracle = web3.eth.contract(oracleJSON.abi).at(oracleAddress);
    Promise.promisifyAll(oracle);

    debug('user address', '0x'.concat(userWallet.address.toString('hex')));
    debug('providerAddress', providerAddress);

    const [txReceipt, result] = await Promise.all([
      web3.eth.getTransactionReceiptAsync(txHash),
      oracle.getWorkAsync(txHash),
    ]);
    debug('txReceipt', txReceipt);
    if (txReceipt === null) throw Error('Transaction hash does not exist');

    debug('result', result);
    if (!result[2] && !result[3]) {
      spinner.info('PENDING...');
      return;
    }

    spinner.succeed('Result:');
    console.log('   stdout:  ', JSON.stringify(result[2]));
    console.log('   stderr:  ', JSON.stringify(result[3]));
  } catch (error) {
    spinner.fail(`"iexec result" failed with ${error}`);
    throw error;
  }
};

module.exports = fetchResults;
