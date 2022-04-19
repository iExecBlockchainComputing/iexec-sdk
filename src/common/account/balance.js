const Debug = require('debug');
const { ethersBnToBn } = require('../utils/utils');
const { addressSchema, throwIfMissing } = require('../utils/validator');
const { wrapCall } = require('../utils/errorWrappers');

const debug = Debug('iexec:account:balance');

const checkBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(address);
    const iexecContract = contracts.getIExecContract();
    const { stake, locked } = await wrapCall(
      iexecContract.viewAccount(vAddress),
    );
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

module.exports = {
  checkBalance,
};
