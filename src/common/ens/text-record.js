import Debug from 'debug';
import { Contract, utils } from 'ethers';
import { abi } from '../generated/@ensdomains/resolvers/PublicResolver.js';
import {
  throwIfMissing,
  ensDomainSchema,
  textRecordKeySchema,
  textRecordValueSchema,
} from '../utils/validator.js';
import { getAddress } from '../wallet/address.js';
import { wrapSend, wrapWait, wrapCall } from '../utils/errorWrappers.js';
import { NULL_ADDRESS } from '../utils/constant.js';
import { getOwner } from './resolution.js';

const debug = Debug('iexec:ens:text-record');

export const readTextRecord = async (
  contracts = throwIfMissing(),
  name,
  key,
) => {
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
      abi,
      contracts.provider,
    );
    return await wrapCall(resolverContract.text(node, vKey));
  } catch (e) {
    debug('readText()', e);
    throw e;
  }
};

export const setTextRecord = async (
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
      abi,
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
