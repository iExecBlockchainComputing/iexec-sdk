const Debug = require('debug');
const { Contract, utils } = require('ethers');
const ENSRegistry = require('./abi/ENSRegistry-min.json');
const {
  throwIfMissing,
  addressSchema,
  ensDomainSchema,
} = require('../utils/validator');
const { wrapCall } = require('../utils/errorWrappers');
const { getEnsRegistryAddress, checkEns } = require('./registry');

const debug = Debug('iexec:ens:resolution');

const getOwner = async (
  contracts = throwIfMissing(),
  name = throwIfMissing(),
) => {
  try {
    const vName = await ensDomainSchema().validate(name);
    const nameHash = utils.namehash(vName);
    const ensAddress = await getEnsRegistryAddress(contracts);
    const ensRegistryContract = new Contract(
      ensAddress,
      ENSRegistry.abi,
      contracts.provider,
    );
    const owner = await wrapCall(ensRegistryContract.owner(nameHash));
    return owner;
  } catch (e) {
    debug('getOwner()', e);
    throw e;
  }
};

const resolveName = async (
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

const lookupAddress = async (
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

module.exports = {
  getOwner,
  resolveName,
  lookupAddress,
};
