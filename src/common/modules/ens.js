const Debug = require('debug');
const { Contract, utils } = require('ethers');
const RegistryEntry = require('@iexec/poco/build/contracts-min/RegistryEntry.json');
const ENSRegistry = require('../abi/ens/ENSRegistry-min.json');
const FIFSRegistrar = require('../abi/ens/FIFSRegistrar-min.json');
const PublicResolver = require('../abi/ens/PublicResolver-min.json');
const ReverseRegistrar = require('../abi/ens/ReverseRegistrar-min.json');
const { throwIfMissing, addressSchema } = require('../utils/validator');
const { getAddress } = require('./wallet');
const { wrapSend, wrapWait, wrapCall } = require('../utils/errorWrappers');
const { NULL_ADDRESS } = require('../utils/utils');

const debug = Debug('iexec:ens');

const BASE_DOMAIN = 'users.iexec.eth';

const lookupAddress = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema().validate(address);
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
    const domainHash = utils.namehash(domain);
    const name = `${label}.${domain}`;
    debug('name', name);
    const nameHash = utils.namehash(name);
    const labelHash = utils.id(label);
    const address = await getAddress(contracts);
    debug('address', address);

    const { ensAddress } = await contracts.provider.getNetwork();
    const registryContract = new Contract(
      ensAddress,
      ENSRegistry.abi,
      contracts.signer,
    );

    const ownedBy = await wrapCall(registryContract.owner(nameHash));
    if (
      ownedBy !== NULL_ADDRESS &&
      ownedBy.toLowerCase() !== address.toLowerCase()
    ) {
      throw Error(`${name} is already owned by ${ownedBy}`);
    }

    const domainOwner = await wrapCall(registryContract.owner(domainHash));
    const domainOwnerCode = await contracts.provider.getCode(domainOwner);
    if (domainOwnerCode === '0x') {
      throw Error(
        `The base domain ${domain} owner ${domainOwner} is not a contract`,
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
    const newOwnedBy = await wrapCall(registryContract.owner(nameHash));
    if (!newOwnedBy.toLowerCase() === address.toLowerCase()) {
      throw Error(
        `the register tx did not set ${address} as the owner of the node ${name}`,
      );
    }
    return {
      registerTxHash: registerTx.hash,
      registeredName: name,
    };
  } catch (e) {
    debug('registerFifsEns()', e);
    throw e;
  }
};

const setupEnsResolution = async (
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
    const nameHash = utils.namehash(name);
    const walletAddress = await getAddress(contracts);

    // setup resolution
    const { ensAddress } = await contracts.provider.getNetwork();
    const registryContract = new Contract(
      ensAddress,
      ENSRegistry.abi,
      contracts.signer,
    );

    const ownedBy = await wrapCall(registryContract.owner(nameHash));
    if (ownedBy.toLowerCase() !== walletAddress.toLowerCase()) {
      throw Error(
        `The current address ${walletAddress} is not owner of ${name}`,
      );
    }

    const resolverCode = await contracts.provider.getCode(
      publicResolverAddress,
    );
    if (resolverCode === '0x') {
      throw Error(`The resolver ${publicResolverAddress} is not a contract`);
    }

    const currentResolver = await contracts.provider.getResolver(name);
    let setResolverTx;
    if (
      currentResolver &&
      currentResolver.address &&
      currentResolver.address.toLowerCase() ===
        publicResolverAddress.toLowerCase()
    ) {
      debug(
        `Resolver already setup with PublicResolver ${publicResolverAddress}`,
      );
    } else {
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
    const addressCode = await contracts.provider.getCode(vAddress);
    let setNameTx;
    let claimReverseTx;
    if (addressCode !== '0x') {
      // for iExec NFTs
      const registryEntryContract = new Contract(
        vAddress,
        RegistryEntry.abi,
        contracts.signer,
      );
      const entryOwner = await wrapCall(registryEntryContract.owner());
      if (
        !(
          entryOwner &&
          entryOwner.toLowerCase() === walletAddress.toLocaleLowerCase()
        )
      ) {
        throw Error(
          `${walletAddress} is not the owner of ${vAddress}, impossible to setup ENS resolution`,
        );
      }
      setNameTx = await wrapSend(
        registryEntryContract.setName(ensAddress, name, contracts.txOptions),
      );
      await wrapWait(setNameTx.wait(contracts.confirms));
    } else {
      // for EOA
      const REVERSE_DOMAIN = 'addr.reverse';
      const reverseName = `${walletAddress
        .toLocaleLowerCase()
        .substring(2)}.${REVERSE_DOMAIN}`;
      debug('reverseName', reverseName);
      const reverseNameOwner = await wrapCall(
        registryContract.owner(utils.namehash(reverseName)),
      );
      debug('reverseNameOwner', reverseNameOwner);

      const reverseRegistrarAddress = await wrapCall(
        registryContract.owner(utils.namehash(REVERSE_DOMAIN)),
      );

      const reverseRegistrarContract = new Contract(
        reverseRegistrarAddress,
        ReverseRegistrar.abi,
        contracts.signer,
      );
      if (
        reverseNameOwner &&
        reverseNameOwner.toLowerCase() === walletAddress.toLocaleLowerCase()
      ) {
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
        reverseRegistrarContract.setName(name, contracts.txOptions),
      );
      await wrapWait(setNameTx.wait(contracts.confirms));
    }

    return {
      setResolverTxHash: setResolverTx && setResolverTx.hash,
      setAddrTxHash: setAddrTx && setAddrTx.hash,
      setNameTxHash: setNameTx && setNameTx.hash,
      claimReverseTxHash: claimReverseTx && claimReverseTx.hash,
    };
  } catch (e) {
    debug('setupEnsResolution()', e);
    throw e;
  }
};

module.exports = {
  lookupAddress,
  registerFifsEns,
  setupEnsResolution,
};
