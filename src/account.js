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

const checkBalance = async (contracts, address, { hub } = {}) => {
  const clerkAddress = await contracts.fetchClerkAddress({ hub });
  const clerkContract = contracts.getClerkContract({
    at: clerkAddress,
  });
  const balance = await clerkContract.viewAccountABILegacy(address);
  debug('balance', balance);
  return {
    stake: balance[0],
    locked: balance[1],
  };
};

const deposit = async (contracts, amount, { hub } = {}) => {
  const spinner = Spinner();
  spinner.start(info.depositing());

  const hubAddress = hub || contracts.hubAddress;
  debug('hubAddress', hubAddress);
  if (!hubAddress) {
    throw Error(
      `no hub address provided, and no existing hub contract on chain ${
        contracts.chainID
      }`,
    );
  }

  const escrowAddress = await contracts.fetchEscrowAddress({ hub: hubAddress });
  debug('escrowAddress', escrowAddress);

  const rlcAddress = await contracts.fetchRLCAddress();
  const allowTxHash = await contracts
    .getRLCContract({
      at: rlcAddress,
    })
    .approve(escrowAddress, amount);
  const allowTxReceipt = await contracts.waitForReceipt(allowTxHash);
  const allowEvents = contracts.decodeRLCLogs(allowTxReceipt.logs);
  debug('allowEvents', allowEvents);

  const escrowContract = contracts.getEscrowContract({
    at: escrowAddress,
  });

  const txHash = await escrowContract.deposit(amount);
  debug('txHash', txHash);

  const txReceipt = await contracts.waitForReceipt(txHash);
  const events = contracts.decodeEscrowLogs(txReceipt.logs);
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

  const escrowAddress = await contracts.fetchEscrowAddress({ hub: hubAddress });
  debug('escrowAddress', escrowAddress);

  const escrowContract = contracts.getEscrowContract({
    at: escrowAddress,
  });

  const txHash = await escrowContract.withdraw(amount);
  debug('txHash', txHash);

  const txReceipt = await contracts.waitForReceipt(txHash);
  const events = contracts.decodeEscrowLogs(txReceipt.logs);
  debug('events', events);

  spinner.succeed(info.withdrawed(amount));
};

module.exports = {
  auth,
  checkBalance,
  deposit,
  withdraw,
};
