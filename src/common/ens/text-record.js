const Debug = require('debug');
const { Contract, utils } = require('ethers');
const PublicResolver = require('./abi/PublicResolver-min.json');
const {
  throwIfMissing,
  ensDomainSchema,
  textRecordKeySchema,
  textRecordValueSchema,
} = require('../utils/validator');
const { getAddress } = require('../wallet/address');
const { wrapSend, wrapWait, wrapCall } = require('../utils/errorWrappers');
const { NULL_ADDRESS } = require('../utils/utils');
const { getOwner } = require('./resolution');

const debug = Debug('iexec:ens:text-record');

const readTextRecord = async (contracts = throwIfMissing(), name, key) => {
  try {
    const vName = await ensDomainSchema().validate(name);
    const vKey = await textRecordKeySchema().validate(key);
    const node = utils.namehash(vName);
    const currentResolver = await wrapCall(
      contracts.provider.getResolver(vName),
    );
    const isResolverSet =
      currentResolver &&
      currentResolver.address &&
      currentResolver.address !== NULL_ADDRESS;
    if (!isResolverSet) {
      throw Error(`No resolver is configured for ${vName}`);
    }
    const resolverContract = new Contract(
      currentResolver.address,
      PublicResolver.abi,
      contracts.provider,
    );
    const txt = await wrapCall(resolverContract.text(node, vKey));
    return txt;
  } catch (e) {
    debug('readText()', e);
    throw e;
  }
};

const setTextRecord = async (
  contracts = throwIfMissing(),
  name,
  key,
  value = '',
) => {
  try {
    const vName = await ensDomainSchema().validate(name);
    const vKey = await textRecordKeySchema().validate(key);
    const vValue = await textRecordValueSchema().validate(value);
    const node = utils.namehash(vName);
    const currentResolver = await wrapCall(
      contracts.provider.getResolver(vName),
    );
    const isResolverSet =
      currentResolver &&
      currentResolver.address &&
      currentResolver.address !== NULL_ADDRESS;
    if (!isResolverSet) {
      throw Error(`No resolver is configured for ${vName}`);
    }
    const ownedBy = await getOwner(contracts, vName);
    const userAddress = await getAddress(contracts);
    if (ownedBy !== userAddress) {
      throw Error(
        `${userAddress} is not authorised to set a text record for ${vName}`,
      );
    }
    const resolverContract = new Contract(
      currentResolver.address,
      PublicResolver.abi,
      contracts.signer,
    );
    const tx = await wrapSend(resolverContract.setText(node, vKey, vValue));
    await wrapWait(tx.wait(contracts.confirms));
    return tx.hash;
  } catch (e) {
    debug('setTextRecord()', e);
    throw e;
  }
};

module.exports = {
  readTextRecord,
  setTextRecord,
};
