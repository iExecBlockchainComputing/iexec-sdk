const Debug = require('debug');
const {
  ethersBnToBn,
  bnifyNestedEthersBn,
  getEventFromLogs,
  checkSigner,
} = require('../utils/utils');
const {
  uint256Schema,
  categorySchema,
  throwIfMissing,
} = require('../utils/validator');
const { wrapCall, wrapSend, wrapWait } = require('../utils/errorWrappers');

const debug = Debug('iexec:hub:category');

const createCategory = async (
  contracts = throwIfMissing(),
  obj = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const vCategory = await categorySchema().validate(obj);
    const iexecContract = contracts.getIExecContract();
    const categoryOwner = await wrapCall(iexecContract.owner());
    const userAddress = await contracts.signer.getAddress();
    if (!(categoryOwner === userAddress)) {
      throw Error(
        `only category owner ${categoryOwner} can create new categories`,
      );
    }
    const args = [
      vCategory.name,
      vCategory.description,
      vCategory.workClockTimeRef,
    ];
    const tx = await wrapSend(
      iexecContract.createCategory(...args, contracts.txOptions),
    );
    const txReceipt = await wrapWait(tx.wait(contracts.confirms));
    const { catid } = getEventFromLogs('CreateCategory', txReceipt.events, {
      strict: true,
    }).args;
    const txHash = txReceipt.transactionHash;
    return { catid, txHash };
  } catch (error) {
    debug('createCategory()', error);
    throw error;
  }
};

const showCategory = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
) => {
  try {
    const vIndex = await uint256Schema().validate(index);
    const iexecContract = contracts.getIExecContract();
    const categoryRPC = await wrapCall(iexecContract.viewCategory(vIndex));
    const categoryPropNames = ['name', 'description', 'workClockTimeRef'];
    const category = categoryRPC.reduce(
      (accu, curr, i) =>
        Object.assign(accu, {
          [categoryPropNames[i]]: curr,
        }),
      {},
    );
    return bnifyNestedEthersBn(category);
  } catch (error) {
    debug('showCategory()', error);
    throw error;
  }
};

const countCategory = async (contracts = throwIfMissing()) => {
  try {
    const countBN = ethersBnToBn(
      await wrapCall(contracts.getIExecContract().countCategory()),
    );
    return countBN;
  } catch (error) {
    debug('countCategory()', error);
    throw error;
  }
};

module.exports = {
  createCategory,
  showCategory,
  countCategory,
};
