import Debug from 'debug';
import { ethersBnToBn } from '../utils/utils';
import { throwIfMissing } from '../utils/validator';
import { wrapCall } from '../utils/errorWrappers';

const debug = Debug('iexec:protocol:configuration');

export const getTimeoutRatio = async (contracts = throwIfMissing()) => {
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
