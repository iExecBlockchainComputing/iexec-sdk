const Debug = require('debug');
const { ethersBnToBn } = require('../utils/utils');
const { throwIfMissing } = require('../utils/validator');
const { wrapCall } = require('../utils/errorWrappers');

const debug = Debug('iexec:protocol:configuration');

const getTimeoutRatio = async (contracts = throwIfMissing()) => {
  try {
    const timeoutRatio = ethersBnToBn(
      await wrapCall(contracts.getIExecContract().final_deadline_ratio()),
    );
    return timeoutRatio;
  } catch (error) {
    debug('getTimeoutRatio()', error);
    throw error;
  }
};

module.exports = { getTimeoutRatio };
