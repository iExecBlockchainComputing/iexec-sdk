import Debug from 'debug';
import BN from 'bn.js';
import { checkBalance } from './balance.js';
import { getAddress } from '../wallet/address.js';
import { isInWhitelist } from '../wallet/enterprise.js';
import { checkBalances } from '../wallet/balance.js';
import {
  checkEventFromLogs,
  bnNRlcToBnWei,
  bnToBigInt,
  checkSigner,
} from '../utils/utils.js';
import { NULL_BYTES } from '../utils/constant.js';
import { nRlcAmountSchema, throwIfMissing } from '../utils/validator.js';
import { wrapCall, wrapSend, wrapWait } from '../utils/errorWrappers.js';

const debug = Debug('iexec:account:fund');

export const deposit = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing()
) => {
  try {
    checkSigner(contracts);
    const vAmount = await nRlcAmountSchema().validate(amount);
    if (new BN(vAmount).lte(new BN(0)))
      throw Error('Deposit amount must be greater than 0');
    if (contracts.flavour === 'enterprise') {
      await isInWhitelist(contracts, await getAddress(contracts), {
        strict: true,
      });
    }
    let txHash;
    const { nRLC } = await checkBalances(
      contracts,
      await getAddress(contracts)
    );
    if (nRLC.lt(new BN(vAmount)))
      throw Error('Deposit amount exceed wallet balance');
    const iexecContract = contracts.getIExecContract();
    if (!contracts.isNative) {
      const rlcContract = await wrapCall(contracts.fetchTokenContract());
      const tx = await wrapSend(
        rlcContract.approveAndCall(
          contracts.hubAddress,
          vAmount,
          NULL_BYTES,
          contracts.txOptions
        )
      );
      const txReceipt = await wrapWait(tx.wait(contracts.confirms));
      if (!checkEventFromLogs('Approval', txReceipt.logs))
        throw Error('Approval not confirmed');
      if (!checkEventFromLogs('Transfer', txReceipt.logs))
        throw Error('Transfer not confirmed');
      txHash = tx.hash;
    } else {
      const weiAmount = bnToBigInt(bnNRlcToBnWei(new BN(vAmount)));
      const tx = await wrapSend(
        iexecContract.deposit({
          value: weiAmount,
          ...contracts.txOptions,
        })
      );
      const txReceipt = await wrapWait(tx.wait(contracts.confirms));
      if (!checkEventFromLogs('Transfer', txReceipt.logs))
        throw Error('Deposit not confirmed');
      txHash = tx.hash;
    }
    return { amount: vAmount, txHash };
  } catch (error) {
    debug('deposit()', error);
    throw error;
  }
};

export const withdraw = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing()
) => {
  try {
    checkSigner(contracts);
    const vAmount = await nRlcAmountSchema().validate(amount);
    if (new BN(vAmount).lte(new BN(0)))
      throw Error('Withdraw amount must be greater than 0');
    if (contracts.flavour === 'enterprise') {
      await isInWhitelist(contracts, await getAddress(contracts), {
        strict: true,
      });
    }
    const iexecContract = contracts.getIExecContract();
    const { stake } = await checkBalance(
      contracts,
      await getAddress(contracts)
    );
    if (stake.lt(new BN(vAmount)))
      throw Error('Withdraw amount exceed account balance');
    const tx = await wrapSend(
      iexecContract.withdraw(vAmount, contracts.txOptions)
    );
    const txReceipt = await wrapWait(tx.wait(contracts.confirms));
    if (!checkEventFromLogs('Transfer', txReceipt.logs))
      throw Error('Withdraw not confirmed');
    return { amount: vAmount, txHash: tx.hash };
  } catch (error) {
    debug('withdraw()', error);
    throw error;
  }
};
