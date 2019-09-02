const Debug = require('debug');
const BN = require('bn.js');
const {
  isEthAddress,
  checkEvent,
  ethersBnToBn,
  throwIfMissing,
  bnNRlcToBnWei,
  bnToEthersBn,
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
    let txHash;
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({
      at: clerkAddress,
    });
    if (!contracts.isNative) {
      const rlcAddress = await contracts.fetchRLCAddress();
      const allowTx = await contracts
        .getRLCContract({
          at: rlcAddress,
        })
        .approve(clerkAddress, amount);
      const allowTxReceipt = await allowTx.wait();
      if (!checkEvent('Approval', allowTxReceipt.events)) throw Error('Approval not confirmed');
      const tx = await clerkContract.deposit(amount);
      const txReceipt = await tx.wait();
      if (!checkEvent('Deposit', txReceipt.events)) throw Error('Deposit not confirmed');
      txHash = tx.hash;
    } else {
      const weiAmount = bnToEthersBn(
        bnNRlcToBnWei(new BN(amount)),
      ).toHexString();
      const tx = await clerkContract.deposit({ value: weiAmount });
      const txReceipt = await tx.wait();
      if (!checkEvent('Deposit', txReceipt.events)) throw Error('Deposit not confirmed');
      txHash = tx.hash;
    }
    return { amount, txHash };
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
    // if (contracts.isNative) {
    //   const withdrawGas = ethersBnToBn(
    //     await clerkContract.estimate.withdraw(amount),
    //   );
    //   const gasPrice = new BN((await contracts.eth.getGasPrice()).toString());
    //   const withdrawWeiCost = withdrawGas.mul(gasPrice);
    //   const weiAmount = bnNRlcToBnWei(new BN(amount));
    //   debug('withdrawCost', withdrawWeiCost.toString());
    //   debug('weiAmount', weiAmount.toString());
    //   if (withdrawWeiCost.gt(weiAmount)) throw Error('withdraw cost is higher than witdrawed amount');
    // }
    const tx = await clerkContract.withdraw(amount);
    const txReceipt = await tx.wait();
    if (!checkEvent('Withdraw', txReceipt.events)) throw Error('Withdraw not confirmed');
    return { amount, txHash: tx.hash };
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
