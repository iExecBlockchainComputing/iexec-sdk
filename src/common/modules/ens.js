const Debug = require('debug');
const { Contract, utils } = require('ethers');
const RegistryEntry = require('@iexec/poco/build/contracts-min/RegistryEntry.json');
const ENSRegistry = require('../abi/ens/ENSRegistry-min.json');
const FIFSRegistrar = require('../abi/ens/FIFSRegistrar-min.json');
const PublicResolver = require('../abi/ens/PublicResolver-min.json');
const ReverseRegistrar = require('../abi/ens/ReverseRegistrar-min.json');
const {
  throwIfMissing,
  addressSchema,
  ensDomainSchema,
  ensLabelSchema,
} = require('../utils/validator');
const { getAddress } = require('./wallet');
const { wrapSend, wrapWait, wrapCall } = require('../utils/errorWrappers');
const { NULL_ADDRESS } = require('../utils/utils');

const debug = Debug('iexec:ens');

const BASE_DOMAIN = 'users.iexec.eth';

const getOwner = async (
  contracts = throwIfMissing(),
  name = throwIfMissing(),
) => {
  try {
    const vName = await ensDomainSchema().validate(name);
    const nameHash = utils.namehash(vName);
    const { ensAddress } = await contracts.provider.getNetwork();
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
    const address = await contracts.provider.resolveName(vName);
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
    const ens = await contracts.provider.lookupAddress(vAddress);
    return ens;
  } catch (e) {
    debug('lookupAddress()', e);
    throw e;
  }
};

const registerFifsEns = async (
  contracts = throwIfMissing(),
  label = throwIfMissing(),
  domain = BASE_DOMAIN,
) => {
  try {
    const vDomain = await ensDomainSchema().validate(domain);
    const vLabel = await ensLabelSchema().validate(label);
    let registerTxHash;
    const name = `${vLabel}.${vDomain}`;
    const labelHash = utils.id(vLabel);
    const address = await getAddress(contracts);
    const ownedBy = await getOwner(contracts, name);
    if (ownedBy === NULL_ADDRESS) {
      const domainOwner = await getOwner(contracts, vDomain);
      const domainOwnerCode = await contracts.provider.getCode(domainOwner);
      if (domainOwnerCode === '0x') {
        throw Error(
          `The base domain ${vDomain} owner ${domainOwner} is not a contract`,
        );
      }
      const fifsRegistrarContract = new Contract(
        domainOwner,
        FIFSRegistrar.abi,
        contracts.signer,
      );
      const registerTx = await wrapSend(
        fifsRegistrarContract.register(labelHash, address, contracts.txOptions),
      );
      await wrapWait(registerTx.wait(contracts.confirms));
      registerTxHash = registerTx.hash;
    } else if (ownedBy.toLowerCase() === address.toLowerCase()) {
      debug(`${name} is already owned by current wallet ${ownedBy}`);
    } else {
      throw Error(`${name} is already owned by ${ownedBy}`);
    }
    return {
      registerTxHash,
      name,
    };
  } catch (e) {
    debug('registerFifsEns()', e);
    throw e;
  }
};

const configureResolution = async (
  contracts = throwIfMissing(),
  publicResolverAddress = throwIfMissing(),
  name = throwIfMissing(),
  address,
) => {
  try {
    const vAddress =
      address !== undefined
        ? await addressSchema().validate(address)
        : await getAddress(contracts);
    const vName = await ensDomainSchema().validate(name);
    const nameHash = utils.namehash(vName);
    const walletAddress = await getAddress(contracts);
    const { ensAddress } = await contracts.provider.getNetwork();

    let addressIsContract = false;
    if (vAddress !== walletAddress) {
      const addressCode = await contracts.provider.getCode(vAddress);
      if (addressCode === '0x') {
        throw Error(
          `Target address ${vAddress} is not a contract and don't match current wallet address ${walletAddress}, impossible to setup ENS resolution`,
        );
      } else {
        addressIsContract = true;
      }
    }

    // setup resolution
    const ownedBy = await getOwner(contracts, vName);
    if (ownedBy.toLowerCase() !== walletAddress.toLowerCase()) {
      throw Error(
        `The current address ${walletAddress} is not owner of ${vName}`,
      );
    }
    const resolverCode = await contracts.provider.getCode(
      publicResolverAddress,
    );
    if (resolverCode === '0x') {
      throw Error(`The resolver ${publicResolverAddress} is not a contract`);
    }
    const currentResolver = await contracts.provider.getResolver(vName);
    let setResolverTx;
    if (
      currentResolver &&
      currentResolver.address &&
      currentResolver.address.toLowerCase() ===
        publicResolverAddress.toLowerCase()
    ) {
      debug(`Resolver already setup with ${publicResolverAddress}`);
    } else {
      const registryContract = new Contract(
        ensAddress,
        ENSRegistry.abi,
        contracts.signer,
      );
      setResolverTx = await wrapSend(
        registryContract.setResolver(
          nameHash,
          publicResolverAddress,
          contracts.txOptions,
        ),
      );
      await wrapWait(setResolverTx.wait(contracts.confirms));
    }
    const resolverContract = new Contract(
      publicResolverAddress,
      PublicResolver.abi,
      contracts.signer,
    );
    const addr = await wrapCall(
      resolverContract.functions['addr(bytes32)'](nameHash),
    );
    let setAddrTx;
    if (addr && addr[0] && addr[0].toLowerCase() === vAddress.toLowerCase()) {
      debug(`Addr already setup with ${vAddress}`);
    } else {
      setAddrTx = await wrapSend(
        resolverContract.functions['setAddr(bytes32,address)'](
          nameHash,
          vAddress,
          contracts.txOptions,
        ),
      );
      await wrapWait(setAddrTx.wait(contracts.confirms));
    }

    // setup reverse resolution
    let setNameTx;
    let claimReverseTx;

    const configuredName = await lookupAddress(contracts, vAddress);
    debug('configuredName', configuredName);
    if (configuredName === vName) {
      debug('Reverse resolution configuration already done');
    } else if (addressIsContract) {
      // for iExec NFTs
      const registryEntryContract = new Contract(
        vAddress,
        RegistryEntry.abi,
        contracts.signer,
      );
      const entryOwner = await wrapCall(registryEntryContract.owner());
      if (
        !(
          entryOwner && entryOwner.toLowerCase() === walletAddress.toLowerCase()
        )
      ) {
        throw Error(
          `${walletAddress} is not the owner of ${vAddress}, impossible to setup ENS resolution`,
        );
      }
      setNameTx = await wrapSend(
        registryEntryContract.setName(ensAddress, vName, contracts.txOptions),
      );
      await wrapWait(setNameTx.wait(contracts.confirms));
    } else {
      // for EOA
      const REVERSE_DOMAIN = 'addr.reverse';
      const reverseName = `${vAddress
        .toLowerCase()
        .substring(2)}.${REVERSE_DOMAIN}`;
      debug('reverseName', reverseName);
      const reverseNameOwner = await getOwner(contracts, reverseName);
      debug('reverseNameOwner', reverseNameOwner);

      const reverseRegistrarAddress = await getOwner(contracts, REVERSE_DOMAIN);
      const reverseRegistrarContract = new Contract(
        reverseRegistrarAddress,
        ReverseRegistrar.abi,
        contracts.signer,
      );
      debug('walletAddress', walletAddress);
      debug('publicResolverAddress', publicResolverAddress);
      if (reverseNameOwner && reverseNameOwner.toLowerCase() !== NULL_ADDRESS) {
        debug('Reverse registration already done');
      } else {
        claimReverseTx = await wrapSend(
          reverseRegistrarContract.claimWithResolver(
            vAddress,
            publicResolverAddress,
            contracts.txOptions,
          ),
        );
        await wrapWait(claimReverseTx.wait(contracts.confirms));
      }
      setNameTx = await wrapSend(
        reverseRegistrarContract.setName(vName, contracts.txOptions),
      );
      await wrapWait(setNameTx.wait(contracts.confirms));
    }

    return {
      address: vAddress,
      name: vName,
      setResolverTxHash: setResolverTx && setResolverTx.hash,
      setAddrTxHash: setAddrTx && setAddrTx.hash,
      setNameTxHash: setNameTx && setNameTx.hash,
      claimReverseTxHash: claimReverseTx && claimReverseTx.hash,
    };
  } catch (e) {
    debug('configureResolution()', e);
    throw e;
  }
};

module.exports = {
  getOwner,
  resolveName,
  lookupAddress,
  registerFifsEns,
  configureResolution,
};
