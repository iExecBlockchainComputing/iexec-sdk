import Debug from 'debug';
import { Contract, namehash } from 'ethers';
import { abi } from '../generated/@ensdomains/registry/ENSRegistry.js';
import {
  throwIfMissing,
  addressSchema,
  ensDomainSchema,
} from '../utils/validator.js';
import { wrapCall } from '../utils/errorWrappers.js';
import { getEnsRegistryAddress, checkEns } from './registry.js';

const debug = Debug('iexec:ens:resolution');

export const getOwner = async (
  contracts = throwIfMissing(),
  name = throwIfMissing(),
) => {
  try {
    const vName = await ensDomainSchema().validate(name);
    const nameHash = namehash(vName);
    const ensAddress = await getEnsRegistryAddress(contracts);
    const ensRegistryContract = new Contract(
      ensAddress,
      abi,
      contracts.provider,
    );
    return await wrapCall(ensRegistryContract.owner(nameHash));
  } catch (e) {
    debug('getOwner()', e);
    throw e;
  }
};

export const resolveName = async (
  contracts = throwIfMissing(),
  name = throwIfMissing(),
) => {
  try {
    const vName = await ensDomainSchema().validate(name);
    await checkEns(contracts);
    return await wrapCall(contracts.provider.resolveName(vName));
  } catch (e) {
    debug('resolveName()', e);
    throw e;
  }
};

export const lookupAddress = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(address);
    await checkEns(contracts);
    return await wrapCall(contracts.provider.lookupAddress(vAddress));
  } catch (e) {
    debug('lookupAddress()', e);
    throw e;
  }
};
