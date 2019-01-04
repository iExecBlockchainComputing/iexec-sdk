const Debug = require('debug');
const { checkEvent, ethersBnToBn } = require('./utils');

const debug = Debug('iexec:account');


const auth = async (address, iexec, eth) => {
  const { message } = await iexec.getTypedMessage();
  debug('message', message);
  const msgJSON = JSON.stringify(message);

  const signature = await eth.signTypedData(message, address);
  debug('signature', signature);

  const { jwtoken } = await iexec.getJWTBySignature(
    msgJSON,
    address.toLowerCase(),
    signature,
  );
  debug('jwtoken', jwtoken);
  return jwtoken;
};

const checkBalance = async (contracts, address) => {
  const { stake, locked } = await contracts.checkBalance(address);
  const balance = {
    stake: ethersBnToBn(stake),
    locked: ethersBnToBn(locked),
  };
  debug('balance', balance);
  return balance;
};

const deposit = async (contracts, amount) => {
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
  return amount;
};

const withdraw = async (contracts, amount) => {
  const clerkAddress = await contracts.fetchClerkAddress();
  const clerkContract = contracts.getClerkContract({
    at: clerkAddress,
  });
  const tx = await clerkContract.withdraw(amount);
  const txReceipt = await tx.wait();
  const events = contracts.decodeClerkLogs(txReceipt.logs);
  debug('events', events);
  if (!checkEvent('Withdraw', events)) throw Error('Withdraw not confirmed');
  return amount;
};

module.exports = {
  auth,
  checkBalance,
  deposit,
  withdraw,
};
