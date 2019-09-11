const Debug = require('debug');
const { checkEvent, ethersBnToBn } = require('./utils');
const { uint256Schema, addressSchema, throwIfMissing } = require('./validator');
const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');

const debug = Debug('iexec:account');

const checkBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(address);
    const { stake, locked } = await wrapCall(contracts.checkBalance(vAddress));
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
    const vAmount = await uint256Schema().validate(amount);
    const clerkAddress = await wrapCall(contracts.fetchClerkAddress());
    const rlcAddress = await wrapCall(contracts.fetchRLCAddress());
    const allowTx = await wrapSend(
      contracts
        .getRLCContract({
          at: rlcAddress,
        })
        .approve(clerkAddress, vAmount),
    );
    const allowTxReceipt = await wrapWait(allowTx.wait());
    if (!checkEvent('Approval', allowTxReceipt.events)) throw Error('Approval not confirmed');

    const clerkContract = contracts.getClerkContract({
      at: clerkAddress,
    });
    const tx = await wrapSend(clerkContract.deposit(vAmount));
    const txReceipt = await wrapWait(tx.wait());
    if (!checkEvent('Deposit', txReceipt.events)) throw Error('Deposit not confirmed');
    return vAmount;
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
    const vAmount = await uint256Schema().validate(amount);
    const clerkAddress = await wrapCall(contracts.fetchClerkAddress());
    const clerkContract = contracts.getClerkContract({
      at: clerkAddress,
    });
    const tx = await wrapSend(clerkContract.withdraw(vAmount));
    const txReceipt = await wrapWait(tx.wait());
    if (!checkEvent('Withdraw', txReceipt.events)) throw Error('Withdraw not confirmed');
    return vAmount;
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
