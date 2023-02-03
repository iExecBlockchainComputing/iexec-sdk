import Debug from 'debug';
import { Contract, utils } from 'ethers';
import { abi } from './abi/ENSRegistry-min.json';
import {
  throwIfMissing,
  addressSchema,
  ensDomainSchema,
} from '../utils/validator';
import { wrapCall } from '../utils/errorWrappers';
import { getEnsRegistryAddress, checkEns } from './registry';

const debug = Debug('iexec:ens:resolution');

export const getOwner = async (
  contracts = throwIfMissing(),
  name = throwIfMissing(),
) => {
  try {
    const vName = await ensDomainSchema().validate(name);
    const nameHash = utils.namehash(vName);
    const ensAddress = await getEnsRegistryAddress(contracts);
    const ensRegistryContract = new Contract(
      ensAddress,
      abi,
      contracts.provider,
    );
    const owner = await wrapCall(ensRegistryContract.owner(nameHash));
    return owner;
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
    const address = await wrapCall(contracts.provider.resolveName(vName));
    return address;
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
    const ens = await wrapCall(contracts.provider.lookupAddress(vAddress));
    return ens;
  } catch (e) {
    debug('lookupAddress()', e);
    throw e;
  }
};
