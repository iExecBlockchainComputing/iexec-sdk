const Debug = require('debug');
const { Spinner, info } = require('./cli-helper');
const { checkEvent, ethersBnToBn } = require('./utils');

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

const checkBalance = async (contracts, address) => {
  const clerkAddress = await contracts.fetchClerkAddress();
  const clerkContract = contracts.getClerkContract({
    at: clerkAddress,
  });
  const { stake, locked } = await clerkContract.viewAccount(address);
  const balance = {
    stake: ethersBnToBn(stake),
    locked: ethersBnToBn(locked),
  };
  debug('balance', balance);
  return balance;
};

const deposit = async (contracts, amount) => {
  const spinner = Spinner();
  spinner.start(info.depositing());

  const clerkAddress = await contracts.fetchClerkAddress();

  const rlcAddress = await contracts.fetchRLCAddress();
  debug('rlcAddress', rlcAddress);
  const allowTx = await contracts
    .getRLCContract({
      at: rlcAddress,
    })
    .approve(clerkAddress, amount);
  const allowTxReceipt = await allowTx.wait();
  const allowEvents = contracts.decodeRLCLogs(allowTxReceipt.logs);
  debug('allowEvents', allowEvents);
  if (!checkEvent('Approval', allowEvents)) throw Error('Approval not confirmed');

  const clerkContract = contracts.getClerkContract({
    at: clerkAddress,
  });

  const tx = await clerkContract.deposit(amount);
  const txReceipt = await tx.wait();
  const events = contracts.decodeClerkLogs(txReceipt.logs);
  debug('events', events);
  if (!checkEvent('Deposit', events)) throw Error('Deposit not confirmed');

  spinner.succeed(info.deposited(amount));
};

const withdraw = async (contracts, amount) => {
  const spinner = Spinner();
  spinner.start(info.withdrawing());

  const clerkAddress = await contracts.fetchClerkAddress();

  const clerkContract = contracts.getClerkContract({
    at: clerkAddress,
  });

  const tx = await clerkContract.withdraw(amount);
  const txReceipt = await tx.wait();
  const events = contracts.decodeClerkLogs(txReceipt.logs);
  debug('events', events);
  if (!checkEvent('Withdraw', events)) throw Error('Withdraw not confirmed');

  spinner.succeed(info.withdrawed(amount));
};

module.exports = {
  auth,
  checkBalance,
  deposit,
  withdraw,
};
