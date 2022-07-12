const Debug = require('debug');
const { NULL_ADDRESS, NULL_BYTES32 } = require('../utils/constant');
const { ObjectNotFoundError } = require('../utils/errors');
const { wrapCall } = require('../utils/errorWrappers');
const { bnifyNestedEthersBn, cleanRPC } = require('../utils/utils');
const { throwIfMissing, bytes32Schema } = require('../utils/validator');

const debug = Debug('iexec:execution:common');

const viewDeal = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) => {
  try {
    const vDealid = await bytes32Schema().validate(dealid);
    const { chainId } = contracts;
    const iexecContract = contracts.getIExecContract();
    const deal = bnifyNestedEthersBn(
      cleanRPC(await wrapCall(iexecContract.viewDeal(vDealid))),
    );
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

const viewTask = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  { strict = true } = {},
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const { chainId } = contracts;
    const iexecContract = contracts.getIExecContract();
    const task = bnifyNestedEthersBn(
      cleanRPC(await wrapCall(iexecContract.viewTask(vTaskId))),
    );
    if (task.dealid === NULL_BYTES32 && strict) {
      throw new ObjectNotFoundError('task', vTaskId, chainId);
    }
    return task;
  } catch (error) {
    debug('viewTask()', error);
    throw error;
  }
};

module.exports = {
  viewDeal,
  viewTask,
};
