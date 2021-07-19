const Debug = require('debug');
const BN = require('bn.js');
const { getAddress, isInWhitelist, checkBalances } = require('./wallet');
const {
  checkEvent,
  ethersBnToBn,
  bnNRlcToBnWei,
  bnToEthersBn,
  NULL_BYTES,
} = require('../utils/utils');
const {
  nRlcAmountSchema,
  addressSchema,
  throwIfMissing,
} = require('../utils/validator');
const { wrapCall, wrapSend, wrapWait } = require('../utils/errorWrappers');

const debug = Debug('iexec:account');

const checkBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(address);
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
    const vAmount = await nRlcAmountSchema().validate(amount);
    if (new BN(vAmount).lte(new BN(0)))
      throw Error('Deposit amount must be greather than 0');
    if (contracts.flavour === 'enterprise') {
      await isInWhitelist(contracts, await getAddress(contracts), {
        strict: true,
      });
    }
    let txHash;
    const { nRLC } = await checkBalances(
      contracts,
      await getAddress(contracts),
    );
    if (nRLC.lt(new BN(vAmount)))
      throw Error('Deposit amount exceed wallet balance');
    const iexecAddress = await contracts.fetchIExecAddress();
    const iexecContract = contracts.getIExecContract();
    if (!contracts.isNative) {
      const rlcAddress = await wrapCall(contracts.fetchRLCAddress());
      const tx = await wrapSend(
        contracts
          .getRLCContract({
            at: rlcAddress,
          })
          .approveAndCall(
            iexecAddress,
            vAmount,
            NULL_BYTES,
            contracts.txOptions,
          ),
      );
      const txReceipt = await wrapWait(tx.wait(contracts.confirms));
      if (!checkEvent('Approval', txReceipt.events))
        throw Error('Approval not confirmed');
      if (!checkEvent('Transfer', txReceipt.events))
        throw Error('Transfer not confirmed');
      txHash = tx.hash;
    } else {
      const weiAmount = bnToEthersBn(
        bnNRlcToBnWei(new BN(vAmount)),
      ).toHexString();
      const tx = await wrapSend(
        iexecContract.deposit({
          value: weiAmount,
          gasPrice:
            (contracts.txOptions && contracts.txOptions.gasPrice) || undefined,
        }),
      );
      const txReceipt = await wrapWait(tx.wait(contracts.confirms));
      if (!checkEvent('Transfer', txReceipt.events))
        throw Error('Deposit not confirmed');
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
    const vAmount = await nRlcAmountSchema().validate(amount);
    if (new BN(vAmount).lte(new BN(0)))
      throw Error('Withdraw amount must be greather than 0');
    if (contracts.flavour === 'enterprise') {
      await isInWhitelist(contracts, await getAddress(contracts), {
        strict: true,
      });
    }
    const iexecContract = contracts.getIExecContract();
    const { stake } = await checkBalance(
      contracts,
      await getAddress(contracts),
    );
    if (stake.lt(new BN(vAmount)))
      throw Error('Withdraw amount exceed account balance');
    const tx = await wrapSend(
      iexecContract.withdraw(vAmount, contracts.txOptions),
    );
    const txReceipt = await wrapWait(tx.wait(contracts.confirms));
    if (!checkEvent('Transfer', txReceipt.events))
      throw Error('Withdraw not confirmed');
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
