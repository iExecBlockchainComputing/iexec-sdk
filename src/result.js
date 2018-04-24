const Debug = require('debug');
const ora = require('ora');
const createIEXECClient = require('iexec-server-js-client');
const utils = require('./utils');
const oraOptions = require('./oraOptions');
const account = require('./account');
const { result } = require('./server');

const debug = Debug('iexec:result');

const fetchResults = async (txHash, chainName, save, watch) => {
  const spinner = ora(oraOptions);
  try {
    const { jwtoken } = await account.load();

    const chain = utils.getChains()[chainName];
    debug('chain.server', chain.server);
    const iexec = createIEXECClient({ server: chain.server });
    await iexec.getCookieByJWT(jwtoken);

    const txReceipt = await chain.web3.eth.getTransactionReceiptAsync(txHash);
    debug('txReceipt', txReceipt);
    if (!txReceipt) {
      throw Error(`The transaction hash ${txHash} does not exist, or has not been mined yet`);
    }

    const work = await iexec.getWorkByExternalID(txHash);
    if (!('work' in work.xwhep)) {
      throw Error(`No current work associated with txHash: ${txHash}`);
    }

    const workUID = iexec.getFieldValue(work, 'uid');
    debug('workUID', workUID);

    const saveName = save === true ? txHash : save;
    debug('saveName', saveName);

    await result(workUID, chainName, saveName, watch);
  } catch (error) {
    spinner.fail(`"iexec result" failed with ${error}`);
    throw error;
  }
};

module.exports = fetchResults;
