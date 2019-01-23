const Debug = require('debug');
const ethers = require('ethers');
const { isBytes32, cleanRPC, bnifyNestedEthersBn } = require('./utils');

const debug = Debug('iexec:deal');
const objName = 'deal';

const show = async (contracts, dealid) => {
  try {
    if (!isBytes32(dealid, { strict: false })) throw Error('invalid dealid');
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

const claim = async (contracts, dealid, userAddress) => {
  try {
    throw new Error('Not implemented');
  } catch (error) {
    debug('claim()', error);
    throw error;
  }
};

const computeTaskId = (dealid, taskIdx) => {
  const encodedTypes = ['bytes32', 'uint256'];
  const values = [dealid, taskIdx];
  const encoded = ethers.utils.defaultAbiCoder.encode(encodedTypes, values);
  const taskid = ethers.utils.keccak256(encoded);
  return taskid;
};

module.exports = {
  show,
  claim,
  computeTaskId,
};
