const Debug = require('debug');
const ethers = require('ethers');
const {
  isBytes32,
  cleanRPC,
  bnifyNestedEthersBn,
  throwIfMissing,
} = require('./utils');

const debug = Debug('iexec:deal');

const show = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) => {
  try {
    isBytes32(dealid, { strict: true });
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({ at: clerkAddress });
    const deal = bnifyNestedEthersBn(
      cleanRPC(await clerkContract.viewDeal(dealid)),
    );
    return deal;
  } catch (error) {
    debug('show()', error);
    throw error;
  }
};

// const claim = async (
//   contracts = throwIfMissing(),
//   dealid = throwIfMissing(),
//   userAddress = throwIfMissing(),
// ) => {
//   try {
//     throw new Error('Not implemented');
//   } catch (error) {
//     debug('claim()', error);
//     throw error;
//   }
// };

const computeTaskId = (
  dealid = throwIfMissing(),
  taskIdx = throwIfMissing(),
) => {
  try {
    isBytes32(dealid, { strict: true });
    const encodedTypes = ['bytes32', 'uint256'];
    const values = [dealid, taskIdx];
    const encoded = ethers.utils.defaultAbiCoder.encode(encodedTypes, values);
    const taskid = ethers.utils.keccak256(encoded);
    return taskid;
  } catch (error) {
    debug('computeTaskId()', error);
    throw error;
  }
};

module.exports = {
  show,
  // claim,
  computeTaskId,
};
