import Debug from 'debug';
import BN from 'bn.js';
import {
  bigIntToBn,
  bnToBigInt,
  bnNRlcToBnWei,
  checkSigner,
} from '../utils/utils.js';
import {
  addressSchema,
  uint256Schema,
  nRlcAmountSchema,
  weiAmountSchema,
  throwIfMissing,
} from '../utils/validator.js';
import { wrapCall, wrapSend, wrapWait } from '../utils/errorWrappers.js';
import { getAddress } from './address.js';
import { getEthBalance, getRlcBalance, checkBalances } from './balance.js';

const debug = Debug('iexec:wallet:send');

const sendNativeToken = async (
  contracts = throwIfMissing(),
  value,
  to,
  { gasFees = {} } = {},
) => {
  try {
    checkSigner(contracts);
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(to);
    const vValue = await uint256Schema().required().validate(value);
    const tx = await wrapSend(
      contracts.signer.sendTransaction({
        data: '0x',
        to: vAddress,
        value: BigInt(vValue),
        ...contracts.txOptions,
        ...gasFees,
      }),
    );
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (error) {
    debug('sendNativeToken()', error);
    throw error;
  }
};

const sendERC20 = async (contracts = throwIfMissing(), nRlcAmount, to) => {
  checkSigner(contracts);
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  })
    .required()
    .validate(to);
  const vAmount = await nRlcAmountSchema().required().validate(nRlcAmount);
  try {
    const rlcContract = await wrapCall(contracts.fetchTokenContract());
    const tx = await wrapSend(
      rlcContract.transfer(vAddress, bnToBigInt(vAmount), contracts.txOptions),
    );
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (error) {
    debug('sendERC20()', error);
    throw error;
  }
};

export const sendETH = async (contracts = throwIfMissing(), amount, to) => {
  try {
    checkSigner(contracts);
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(to);
    const vAmount = await weiAmountSchema().required().validate(amount);
    if (contracts.isNative)
      throw new Error('sendETH() is disabled on sidechain, use sendRLC()');
    const balance = await getEthBalance(contracts, await getAddress(contracts));
    if (balance.lt(new BN(vAmount))) {
      throw new Error('Amount to send exceed wallet balance');
    }
    return await sendNativeToken(contracts, vAmount, vAddress);
  } catch (error) {
    debug('sendETH()', error);
    throw error;
  }
};

export const sendRLC = async (contracts = throwIfMissing(), nRlcAmount, to) => {
  try {
    checkSigner(contracts);
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(to);
    const vAmount = await nRlcAmountSchema().required().validate(nRlcAmount);
    const balance = await getRlcBalance(contracts, await getAddress(contracts));
    if (balance.lt(new BN(vAmount))) {
      throw new Error('Amount to send exceed wallet balance');
    }
    if (contracts.isNative) {
      debug('send native token');
      const weiValue = bnNRlcToBnWei(new BN(vAmount)).toString();
      return await sendNativeToken(contracts, weiValue, vAddress);
    }
    debug('send ERC20 token');
    return await sendERC20(contracts, vAmount, vAddress);
  } catch (error) {
    debug('sendRLC()', error);
    throw error;
  }
};

export const sweep = async (contracts = throwIfMissing(), to) => {
  try {
    checkSigner(contracts);
    const vAddressTo = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(to);
    const userAddress = await getAddress(contracts);
    const code = await contracts.provider.getCode(vAddressTo);
    if (code !== '0x') {
      throw new Error('Cannot sweep to a contract');
    }
    let balances = await checkBalances(contracts, userAddress);
    const res = {};
    const errors = [];
    if (!contracts.isNative && balances.nRLC.gt(new BN(0))) {
      try {
        const sendERC20TxHash = await sendERC20(
          contracts,
          balances.nRLC,
          vAddressTo,
        );
        Object.assign(res, { sendERC20TxHash });
      } catch (error) {
        debug('error', error);
        errors.push(`Failed to transfer ERC20: ${error.message}`);
        throw new Error(
          `Failed to sweep ERC20, sweep aborted. errors: ${errors}`,
        );
      }
      balances = await checkBalances(contracts, userAddress);
    }

    let maxGasPrice;
    const gasFees = {
      gasPrice: contracts.txOptions && contracts.txOptions.gasPrice,
    };
    if (gasFees.gasPrice === undefined) {
      const networkGasFees = await contracts.provider.getFeeData();
      if (
        (networkGasFees.gasPrice || 0n) < (networkGasFees.maxFeePerGas || 0n)
      ) {
        gasFees.gasPrice = undefined;
        gasFees.maxFeePerGas = networkGasFees.maxFeePerGas || 0n;
        gasFees.maxPriorityFeePerGas = gasFees.maxFeePerGas; // pay all
      } else {
        gasFees.gasPrice = networkGasFees.gasPrice || 0n;
      }
    }
    if ((gasFees.gasPrice || 0n) < (gasFees.maxFeePerGas || 0n)) {
      maxGasPrice = gasFees.maxFeePerGas;
    } else {
      maxGasPrice = gasFees.gasPrice;
    }

    const txFee = maxGasPrice * 21000n; // send native tx
    const sweepNativeBn = balances.wei.sub(bigIntToBn(txFee));
    if (sweepNativeBn.gt(new BN(0))) {
      try {
        const sendNativeTxHash = await sendNativeToken(
          contracts,
          sweepNativeBn,
          vAddressTo,
          { gasFees },
        );
        Object.assign(res, { sendNativeTxHash });
      } catch (error) {
        debug(error);
        errors.push(`Failed to transfer native token': ${error.message}`);
      }
    } else {
      const err = 'Tx fees are greater than wallet balance';
      debug(err);
      errors.push(`Failed to transfer native token': ${err}`);
    }
    if (errors.length > 0) Object.assign(res, { errors });
    return res;
  } catch (error) {
    debug('sweep()', error);
    throw error;
  }
};
