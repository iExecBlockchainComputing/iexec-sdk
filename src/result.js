const Debug = require('debug');
const Promise = require('bluebird');
const ora = require('ora');
const Web3 = require('web3');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const createXWHEPClient = require('xwhep-js-client');
const wallet = require('./wallet');
const utils = require('./utils');
const oraOptions = require('./oraOptions');
const account = require('./account');

const debug = Debug('iexec:result');

const fetchResults = async (txHash, chainName, save) => {
  const spinner = ora(oraOptions);
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

    const xwhep = createXWHEPClient({ hostname: 'xw.iex.ec', port: '443' });
    const { jwtoken } = await account.load();
    const cookies = await xwhep.auth(jwtoken);
    const res = await xwhep.getWorkByExternalID(cookies, txHash);
    debug('res.xwhep.work[0]', res.xwhep.work[0]);
    let savePath;
    if (save) savePath = await xwhep.download(cookies, res.xwhep.work[0].resulturi[0], txHash.concat('.txt'));
    debug('savePath', savePath);

    spinner.succeed('Result:');
    console.log('   stdout:  ', JSON.stringify(result[2]));
    console.log('   stderr:  ', JSON.stringify(result[3]));
    console.log('   resuri:  ', JSON.stringify(res.xwhep.work[0].resulturi[0]), '\n');
    if (save) spinner.succeed(`Saved result to file ${savePath}`);
  } catch (error) {
    spinner.fail(`"iexec result" failed with ${error}`);
    throw error;
  }
};

module.exports = fetchResults;
