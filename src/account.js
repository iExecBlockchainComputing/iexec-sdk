const Debug = require('debug');
const { Spinner, info } = require('./cli-helper');

const debug = Debug('iexec:account');

const auth = async (address, iexec, eth) => {
  const spinner = Spinner();
  spinner.start(info.logging());

  const { message } = await iexec.getTypedMessage();
  debug('message', message);
  const msgJSON = JSON.stringify(message);

  const signature = await eth.signTypedData(message, address);
  debug('signature', signature);

  const { jwtoken } = await iexec.getJWTBySignature(
    msgJSON,
    address,
    signature,
  );
  debug('jwtoken', jwtoken);
  spinner.stop();
  return jwtoken;
};

const deposit = async (contracts, amount, { hub, token } = {}) => {
  const spinner = Spinner();

  spinner.start(info.depositing());

  const hubAddress = hub || contracts.hubAddress;
  debug('hubAddress', hubAddress);
  if (!hubAddress) {
    throw Error(`no hub address provided, and no existing hub contract on chain ${
      contracts.chainID
    }`);
  }

  const rlcAddress = token || contracts.rlcAddress;
  debug('rlcAddress', rlcAddress);
  if (!rlcAddress) {
    throw Error(`no rlc address provided, and no existing rlc contract on chain ${
      contracts.chainID
    }`);
  }

  const allowTxHash = await contracts
    .getRLCContract({
      at: rlcAddress,
    })
    .approve(hubAddress, amount);
  const allowTxReceipt = await contracts.waitForReceipt(allowTxHash);
  debug('allowTxReceipt', allowTxReceipt);

  const allowEvents = contracts.decodeHubLogs(allowTxReceipt.logs);
  debug('allowEvents', allowEvents);

  const txHash = await contracts
    .getHubContract({
      at: hub,
    })
    .deposit(amount);
  debug('txHash', txHash);

  const txReceipt = await contracts.waitForReceipt(txHash);
  debug('txReceipt', txReceipt);

  const events = contracts.decodeHubLogs(txReceipt.logs);
  debug('events', events);

  spinner.succeed(`deposited ${amount} nRLC to your iExec account`);
};

module.exports = {
  auth,
  deposit,
};
