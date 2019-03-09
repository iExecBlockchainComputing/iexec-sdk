const Debug = require('debug');
const {
  isEthAddress,
  checkEvent,
  ethersBnToBn,
  throwIfMissing,
} = require('./utils');

const debug = Debug('iexec:account');

const checkBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    isEthAddress(address, { strict: true });
    const { stake, locked } = await contracts.checkBalance(address);
    const balance = {
      stake: ethersBnToBn(stake),
      locked: ethersBnToBn(locked),
    };
    return balance;
  } catch (error) {
    debug('checkBalance()', error);
    throw error;
  }
};

const deposit = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing(),
) => {
  try {
    const clerkAddress = await contracts.fetchClerkAddress();
    const rlcAddress = await contracts.fetchRLCAddress();
    const allowTx = await contracts
      .getRLCContract({
        at: rlcAddress,
      })
      .approve(clerkAddress, amount);
    const allowTxReceipt = await allowTx.wait();
    if (!checkEvent('Approval', allowTxReceipt.events)) throw Error('Approval not confirmed');

    const clerkContract = contracts.getClerkContract({
      at: clerkAddress,
    });
    const tx = await clerkContract.deposit(amount);
    const txReceipt = await tx.wait();
    if (!checkEvent('Deposit', txReceipt.events)) throw Error('Deposit not confirmed');
    return amount;
  } catch (error) {
    debug('deposit()', error);
    throw error;
  }
};

const withdraw = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing(),
) => {
  try {
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({
      at: clerkAddress,
    });
    const tx = await clerkContract.withdraw(amount);
    const txReceipt = await tx.wait();
    if (!checkEvent('Withdraw', txReceipt.events)) throw Error('Withdraw not confirmed');
    return amount;
  } catch (error) {
    debug('withdraw()', error);
    throw error;
  }
};

module.exports = {
  checkBalance,
  deposit,
  withdraw,
};
