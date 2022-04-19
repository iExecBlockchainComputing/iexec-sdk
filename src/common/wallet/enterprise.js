const Debug = require('debug');
const BN = require('bn.js');
const { NULL_BYTES, checkSigner } = require('../utils/utils');
const {
  addressSchema,
  nRlcAmountSchema,
  throwIfMissing,
} = require('../utils/validator');
const { wrapCall, wrapSend, wrapWait } = require('../utils/errorWrappers');
const { getAddress } = require('./address');
const { getRlcBalance } = require('./balance');

const debug = Debug('iexec:wallet:enterprise');

const isInWhitelist = async (
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

const wrapEnterpriseRLC = async (
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

const unwrapEnterpriseRLC = async (
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

module.exports = { isInWhitelist, wrapEnterpriseRLC, unwrapEnterpriseRLC };
