import Debug from 'debug';
import { NULL_ADDRESS, NULL_BYTES32 } from '../utils/constant.js';
import { ObjectNotFoundError } from '../utils/errors.js';
import { wrapCall } from '../utils/errorWrappers.js';
import { formatEthersResult } from '../utils/utils.js';
import { throwIfMissing, bytes32Schema } from '../utils/validator.js';

const debug = Debug('iexec:execution:common');

export const viewDeal = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing()
) => {
  try {
    const vDealid = await bytes32Schema().validate(dealid);
    const { chainId } = contracts;
    const iexecContract = contracts.getIExecContract();
    const viewDealResult = await wrapCall(iexecContract.viewDeal(vDealid));
    const deal = formatEthersResult(viewDealResult);
    const dealExists =
      deal && deal.app && deal.app.pointer && deal.app.pointer !== NULL_ADDRESS;
    if (!dealExists) {
      throw new ObjectNotFoundError('deal', dealid, chainId);
    }
    return deal;
  } catch (error) {
    debug('viewDeal()', error);
    throw error;
  }
};

export const viewTask = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  { strict = true } = {}
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const { chainId } = contracts;
    const iexecContract = contracts.getIExecContract();
    const task = formatEthersResult(
      await wrapCall(iexecContract.viewTask(vTaskId))
    );
    // cast BN to number to keep view task interface
    task.status = task.status.toNumber();
    if (task.dealid === NULL_BYTES32 && strict) {
      throw new ObjectNotFoundError('task', vTaskId, chainId);
    }
    return task;
  } catch (error) {
    debug('viewTask()', error);
    throw error;
  }
};
