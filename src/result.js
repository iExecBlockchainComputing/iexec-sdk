const Debug = require('debug');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const ora = require('ora');
const Web3 = require('web3');
const oracleJSON = require('iexec-oracle-contract/build/contracts/IexecOracle.json');
const createIEXECClient = require('iexec-server-js-client');
const wallet = require('./wallet');
const utils = require('./utils');
const oraOptions = require('./oraOptions');
const account = require('./account');

const debug = Debug('iexec:result');

const fetchResults = async (txHash, chainName, save, cliDappAddress) => {
  const spinner = ora(oraOptions);
  try {
    const network = utils.truffleConfig.networks[chainName];
    const web3 = new Web3(new Web3.providers.HttpProvider(network.host));
    Promise.promisifyAll(web3.eth);
    const userWallet = await wallet.load();
    const { jwtoken } = await account.load();

    spinner.start('Fetching submitted job result');

    const { networks } = await utils.loadContractDesc();

    const providerAddress =
      cliDappAddress || networks[network.network_id].address;
    const oracleAddress = oracleJSON.networks[network.network_id].address;

    const oracle = web3.eth.contract(oracleJSON.abi).at(oracleAddress);
    Promise.promisifyAll(oracle);

    debug('user address', '0x'.concat(userWallet.address.toString('hex')));
    debug('providerAddress', providerAddress);

    const chain = utils.getChains()[chainName];
    debug('chain.server', chain.server);
    const iexec = createIEXECClient({ server: chain.server });
    await iexec.getCookieByJWT(jwtoken);

    const [txReceipt, result, work] = await Promise.all([
      web3.eth.getTransactionReceiptAsync(txHash),
      oracle.getWorkAsync(txHash),
      iexec.getWorkByExternalID(txHash),
    ]);
    debug('txReceipt', txReceipt);
    if (txReceipt === null) throw Error('Transaction hash does not exist');

    debug('result', result);
    const status = iexec.getFieldValue(work, 'status');
    if (status !== 'COMPLETED') {
      spinner.info(status.concat('...'));
      return;
    }

    debug('work.xwhep.work[0]', work.xwhep.work[0]);
    let resultPath;
    const resultURI = iexec.getFieldValue(work, 'resulturi');
    const resultUID = iexec.uri2uid(resultURI);
    if (save) {
      const resultObj = await iexec.getUID(resultUID);
      const extension = iexec.getFieldValue(resultObj, 'type').toLowerCase();
      resultPath = path.join(process.cwd(), txHash.concat('.', extension));
      const resultStream = fs.createWriteStream(resultPath);
      await iexec.downloadStream(resultUID, resultStream);
    }

    spinner.succeed('Result:');
    console.log('   stdout:  ', JSON.stringify(result[2]));
    console.log('   stderr:  ', JSON.stringify(result[3]));
    console.log('   resuri:  ', JSON.stringify(resultURI), '\n');
    if (save) spinner.succeed(`Saved result to file ${resultPath}`);
  } catch (error) {
    spinner.fail(`"iexec result" failed with ${error}`);
    throw error;
  }
};

module.exports = fetchResults;
