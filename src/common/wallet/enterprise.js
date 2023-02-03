import Debug from 'debug';
import BN from 'bn.js';
import { NULL_BYTES } from '../utils/constant.js';
import { checkSigner } from '../utils/utils.js';
import {
  addressSchema,
  nRlcAmountSchema,
  throwIfMissing,
} from '../utils/validator.js';
import { wrapCall, wrapSend, wrapWait } from '../utils/errorWrappers.js';
import { getAddress } from './address.js';
import { getRlcBalance } from './balance.js';

const debug = Debug('iexec:wallet:enterprise');

export const isInWhitelist = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
  { strict = true } = {},
) => {
  if (contracts.flavour !== 'enterprise') {
    throw Error('Cannot check authorized eRLC holders on current chain');
  }
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(address);
  try {
    const eRlcContract = await wrapCall(contracts.fetchTokenContract());
    const isKYC = await wrapCall(eRlcContract.isKYC(vAddress));
    if (!isKYC && strict) {
      throw Error(`${vAddress} is not authorized to interact with eRLC`);
    }
    return isKYC;
  } catch (error) {
    debug('isInWhitelist()', error);
    throw error;
  }
};

export const wrapEnterpriseRLC = async (
  contracts = throwIfMissing(),
  enterpriseContracts,
  nRlcAmount = throwIfMissing(),
) => {
  checkSigner(contracts);
  if (contracts.flavour !== 'standard' || contracts.isNative) {
    throw Error('Unable to wrap RLC into eRLC on current chain');
  }
  if (!enterpriseContracts) {
    throw Error('Unable to find eRLC on current chain');
  }
  const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
  await isInWhitelist(enterpriseContracts, await getAddress(contracts), {
    strict: true,
  });
  const balance = await getRlcBalance(contracts, await getAddress(contracts));
  if (balance.lt(new BN(vAmount))) {
    throw Error('Amount to wrap exceed wallet balance');
  }
  try {
    const eRlcAddress = await wrapCall(enterpriseContracts.fetchTokenAddress());
    const rlcContract = await wrapCall(contracts.fetchTokenContract());
    const tx = await wrapSend(
      rlcContract.approveAndCall(
        eRlcAddress,
        vAmount,
        NULL_BYTES,
        contracts.txOptions,
      ),
    );
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (error) {
    debug('wrapEnterpriseRLC()', error);
    throw error;
  }
};

export const unwrapEnterpriseRLC = async (
  contracts = throwIfMissing(),
  nRlcAmount = throwIfMissing(),
) => {
  checkSigner(contracts);
  if (contracts.flavour !== 'enterprise' || contracts.isNative) {
    throw Error('Unable to unwrap eRLC into RLC on current chain');
  }
  const vAmount = await nRlcAmountSchema().validate(nRlcAmount);
  await isInWhitelist(contracts, await getAddress(contracts), { strict: true });
  const balance = await getRlcBalance(contracts, await getAddress(contracts));
  if (balance.lt(new BN(vAmount))) {
    throw Error('Amount to unwrap exceed wallet balance');
  }
  try {
    const eRlcContract = await wrapCall(contracts.fetchTokenContract());
    const tx = await wrapSend(eRlcContract.withdraw(vAmount));
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (error) {
    debug('unwrapEnterpriseRLC()', error);
    throw error;
  }
};
