const Debug = require('debug');
const BN = require('bn.js');
const {
  checkEvent,
  ethersBnToBn,
  bnNRlcToBnWei,
  bnToEthersBn,
} = require('./utils');
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
    let txHash;
    const clerkAddress = await wrapCall(contracts.fetchClerkAddress());
    const clerkContract = contracts.getClerkContract({
      at: clerkAddress,
    });
    if (!contracts.isNative) {
      const rlcAddress = await wrapCall(contracts.fetchRLCAddress());
      const allowTx = await wrapSend(
        contracts
          .getRLCContract({
            at: rlcAddress,
          })
          .approve(clerkAddress, vAmount, contracts.txOptions),
      );
      const allowTxReceipt = await wrapWait(allowTx.wait());
      if (!checkEvent('Approval', allowTxReceipt.events)) throw Error('Approval not confirmed');
      const tx = await wrapSend(
        clerkContract.deposit(vAmount, contracts.txOptions),
      );
      const txReceipt = await wrapWait(tx.wait());
      if (!checkEvent('Deposit', txReceipt.events)) throw Error('Deposit not confirmed');
      txHash = tx.hash;
    } else {
      const weiAmount = bnToEthersBn(
        bnNRlcToBnWei(new BN(vAmount)),
      ).toHexString();
      const tx = await wrapSend(
        clerkContract.deposit({
          value: weiAmount,
          gasPrice:
            (contracts.txOptions && contracts.txOptions.gasPrice) || undefined,
        }),
      );
      const txReceipt = await wrapWait(tx.wait());
      if (!checkEvent('Deposit', txReceipt.events)) throw Error('Deposit not confirmed');
      txHash = tx.hash;
    }
    return { amount: vAmount, txHash };
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
    // if (contracts.isNative) {
    //   const withdrawGas = ethersBnToBn(
    //     await clerkContract.estimate.withdraw(amount),
    //   );
    //   const gasPrice = new BN((await contracts.jsonRpcProvider.getGasPrice()).toString());
    //   const withdrawWeiCost = withdrawGas.mul(gasPrice);
    //   const weiAmount = bnNRlcToBnWei(new BN(amount));
    //   debug('withdrawCost', withdrawWeiCost.toString());
    //   debug('weiAmount', weiAmount.toString());
    //   if (withdrawWeiCost.gt(weiAmount)) throw Error('withdraw cost is higher than witdrawed amount');
    // }
    const tx = await wrapSend(
      clerkContract.withdraw(vAmount, contracts.txOptions),
    );
    const txReceipt = await wrapWait(tx.wait());
    if (!checkEvent('Withdraw', txReceipt.events)) throw Error('Withdraw not confirmed');
    return { amount: vAmount, txHash: tx.hash };
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
