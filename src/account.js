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

const deposit = async (contracts, amount, { hub } = {}) => {
  const spinner = Spinner();
  spinner.start(info.depositing());

  const hubContract = contracts.getHubContract({ at: hub });
  const rlcAddress = await contracts.fetchRLCAddress();
  const allowTxHash = await contracts
    .getRLCContract({
      at: rlcAddress,
    })
    .approve(hub || contracts.hubAddress, amount);
  const allowTxReceipt = await contracts.waitForReceipt(allowTxHash);
  const allowEvents = contracts.decodeHubLogs(allowTxReceipt.logs);
  debug('allowEvents', allowEvents);

  const txHash = await hubContract.deposit(amount);
  debug('txHash', txHash);

  const txReceipt = await contracts.waitForReceipt(txHash);
  const events = contracts.decodeHubLogs(txReceipt.logs);
  debug('events', events);

  spinner.succeed(info.deposited(amount));
};

const withdraw = async (contracts, amount, { hub } = {}) => {
  const spinner = Spinner();
  spinner.start(info.withdrawing());

  const hubAddress = hub || contracts.hubAddress;
  debug('hubAddress', hubAddress);
  if (!hubAddress) {
    throw Error(
      `no hub address provided, and no existing hub contract on chain ${
        contracts.chainID
      }`,
    );
  }

  const txHash = await contracts
    .getHubContract({
      at: hub,
    })
    .withdraw(amount);
  debug('txHash', txHash);

  const txReceipt = await contracts.waitForReceipt(txHash);
  const events = contracts.decodeHubLogs(txReceipt.logs);
  debug('events', events);

  spinner.succeed(info.withdrawed(amount));
};

module.exports = {
  auth,
  deposit,
  withdraw,
};
