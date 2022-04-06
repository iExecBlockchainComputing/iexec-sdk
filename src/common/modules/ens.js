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
const { ConfigurationError } = require('../utils/errors');
const { Observable, SafeObserver } = require('../utils/reactive');
const { NULL_ADDRESS } = require('../utils/utils');

const debug = Debug('iexec:ens');

const BASE_DOMAIN = 'users.iexec.eth';

const getEnsRegistryAddress = async (contracts = throwIfMissing()) => {
  try {
    const { ensAddress } = await wrapCall(contracts.provider.getNetwork());
    if (!ensAddress) {
      throw new ConfigurationError('Network does not support ENS');
    }
    return ensAddress;
  } catch (e) {
    debug('getEnsRegistryAddress()', e);
    throw e;
  }
};

const checkEns = async (contracts = throwIfMissing()) => {
  try {
    await getEnsRegistryAddress(contracts);
  } catch (e) {
    debug('checkEns()', e);
    throw e;
  }
};

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
      const domainOwnerCode = await wrapCall(
        contracts.provider.getCode(domainOwner),
      );
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

const obsConfigureResolutionMessages = {
  DESCRIBE_WORKFLOW: 'DESCRIBE_WORKFLOW',
  SET_RESOLVER_TX_REQUEST: 'SET_RESOLVER_TX_REQUEST',
  SET_RESOLVER_TX_SENT: 'SET_RESOLVER_TX_SENT',
  SET_RESOLVER_SUCCESS: 'SET_RESOLVER_SUCCESS',
  SET_ADDR_TX_REQUEST: 'SET_ADDR_TX_REQUEST',
  SET_ADDR_TX_SENT: 'SET_ADDR_TX_SENT',
  SET_ADDR_SUCCESS: 'SET_ADDR_SUCCESS',
  SET_NAME_TX_REQUEST: 'SET_NAME_TX_REQUEST',
  SET_NAME_TX_SENT: 'SET_NAME_TX_SENT',
  SET_NAME_SUCCESS: 'SET_NAME_SUCCESS',
};

const obsConfigureResolution = (
  contracts = throwIfMissing(),
  publicResolverAddress = throwIfMissing(),
  name = throwIfMissing(),
  address,
) =>
  new Observable((observer) => {
    const safeObserver = new SafeObserver(observer);
    let abort = false;

    const configure = async () => {
      try {
        const vAddress =
          address !== undefined
            ? await addressSchema().validate(address)
            : await getAddress(contracts);
        const vName = await ensDomainSchema().validate(name);
        const nameHash = utils.namehash(vName);
        const walletAddress = await getAddress(contracts);
        const ensAddress = await getEnsRegistryAddress(contracts);

        const REVERSE_DOMAIN = 'addr.reverse';

        let addressIsContract = false;
        if (vAddress !== walletAddress) {
          const addressCode = await wrapCall(
            contracts.provider.getCode(vAddress),
          );
          if (addressCode === '0x') {
            throw Error(
              `Target address ${vAddress} is not a contract and don't match current wallet address ${walletAddress}, impossible to setup ENS resolution`,
            );
          } else {
            addressIsContract = true;
          }
        }

        const nameOwner = await getOwner(contracts, vName);
        if (nameOwner.toLowerCase() !== walletAddress.toLowerCase()) {
          throw Error(
            `The current address ${walletAddress} is not owner of ${vName}`,
          );
        }

        if (addressIsContract) {
          const registryEntryContract = new Contract(
            vAddress,
            RegistryEntry.abi,
            contracts.signer,
          );
          const entryOwner = await wrapCall(registryEntryContract.owner());
          if (
            !(
              entryOwner &&
              entryOwner.toLowerCase() === walletAddress.toLowerCase()
            )
          ) {
            throw Error(
              `${walletAddress} is not the owner of ${vAddress}, impossible to setup ENS resolution`,
            );
          }
        }

        if (abort) return;
        safeObserver.next({
          message: obsConfigureResolutionMessages.DESCRIBE_WORKFLOW,
          addessType: addressIsContract ? 'CONTRACT' : 'EAO',
          steps: ['SET_RESOLVER', 'SET_ADDR', 'SET_NAME'],
        });

        const resolverCode = await wrapCall(
          contracts.provider.getCode(publicResolverAddress),
        );
        if (resolverCode === '0x') {
          throw Error(
            `The resolver ${publicResolverAddress} is not a contract`,
          );
        }

        // 1 - setup resolution
        // set resolver
        const currentResolver = await wrapCall(
          contracts.provider.getResolver(vName),
        );
        const isResolverSet =
          currentResolver &&
          currentResolver.address &&
          currentResolver.address.toLowerCase() ===
            publicResolverAddress.toLowerCase();

        if (!isResolverSet) {
          const registryContract = new Contract(
            ensAddress,
            ENSRegistry.abi,
            contracts.signer,
          );
          safeObserver.next({
            message: obsConfigureResolutionMessages.SET_RESOLVER_TX_REQUEST,
            name: vName,
            resolverAddress: publicResolverAddress,
          });
          if (abort) return;
          const setResolverTx = await wrapSend(
            registryContract.setResolver(
              nameHash,
              publicResolverAddress,
              contracts.txOptions,
            ),
          );
          safeObserver.next({
            message: obsConfigureResolutionMessages.SET_RESOLVER_TX_SENT,
            txHash: setResolverTx.hash,
          });
          if (abort) return;
          await wrapWait(setResolverTx.wait(contracts.confirms));
        }
        safeObserver.next({
          message: obsConfigureResolutionMessages.SET_RESOLVER_SUCCESS,
          name: vName,
          resolverAddress: publicResolverAddress,
        });

        // set addr
        const resolverContract = new Contract(
          publicResolverAddress,
          PublicResolver.abi,
          contracts.signer,
        );
        const addr = await wrapCall(
          resolverContract.functions['addr(bytes32)'](nameHash),
        );
        const isAddrSet =
          addr && addr[0] && addr[0].toLowerCase() === vAddress.toLowerCase();

        if (!isAddrSet) {
          safeObserver.next({
            message: obsConfigureResolutionMessages.SET_ADDR_TX_REQUEST,
            name: vName,
            address: vAddress,
          });
          if (abort) return;
          const setAddrTx = await wrapSend(
            resolverContract.functions['setAddr(bytes32,address)'](
              nameHash,
              vAddress,
              contracts.txOptions,
            ),
          );
          safeObserver.next({
            message: obsConfigureResolutionMessages.SET_ADDR_TX_SENT,
            txHash: setAddrTx.hash,
          });
          if (abort) return;
          await wrapWait(setAddrTx.wait(contracts.confirms));
        }
        safeObserver.next({
          message: obsConfigureResolutionMessages.SET_ADDR_SUCCESS,
          name: vName,
          address: vAddress,
        });

        // 2 - setup reverse resolution
        const configuredName = await lookupAddress(contracts, vAddress);
        if (configuredName !== vName) {
          if (addressIsContract) {
            // set name for iExec NFTs
            const registryEntryContract = new Contract(
              vAddress,
              RegistryEntry.abi,
              contracts.signer,
            );
            safeObserver.next({
              message: obsConfigureResolutionMessages.SET_NAME_TX_REQUEST,
              name: vName,
              address: vAddress,
            });
            if (abort) return;
            const setNameTx = await wrapSend(
              registryEntryContract.setName(
                ensAddress,
                vName,
                contracts.txOptions,
              ),
            );
            safeObserver.next({
              message: obsConfigureResolutionMessages.SET_NAME_TX_SENT,
              txHash: setNameTx.hash,
            });
            if (abort) return;
            await wrapWait(setNameTx.wait(contracts.confirms));
          } else {
            // set name for EOA
            const reverseRegistrarAddress = await getOwner(
              contracts,
              REVERSE_DOMAIN,
            );
            const reverseRegistrarContract = new Contract(
              reverseRegistrarAddress,
              ReverseRegistrar.abi,
              contracts.signer,
            );
            safeObserver.next({
              message: obsConfigureResolutionMessages.SET_NAME_TX_REQUEST,
              name: vName,
              address: vAddress,
            });
            if (abort) return;
            const setNameTx = await wrapSend(
              reverseRegistrarContract.setName(vName, contracts.txOptions),
            );
            safeObserver.next({
              message: obsConfigureResolutionMessages.SET_NAME_TX_SENT,
              txHash: setNameTx.hash,
            });
            if (abort) return;
            await wrapWait(setNameTx.wait(contracts.confirms));
          }
        }
        safeObserver.next({
          message: obsConfigureResolutionMessages.SET_NAME_SUCCESS,
          name: vName,
          address: vAddress,
        });
        safeObserver.complete();
      } catch (e) {
        debug('obsConfigureResolution()', e);
        safeObserver.error(e);
      }
    };
    configure();

    safeObserver.unsub = () => {
      abort = true;
    };
    return safeObserver.unsubscribe.bind(safeObserver);
  });

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
    const configObserver = await obsConfigureResolution(
      contracts,
      publicResolverAddress,
      name,
      address,
    );
    return new Promise((resolve, reject) => {
      const result = {
        name: vName,
        address: vAddress,
      };
      configObserver.subscribe({
        error: (e) => reject(e),
        next: ({ message, ...rest }) => {
          switch (message) {
            case obsConfigureResolutionMessages.SET_RESOLVER_TX_SENT:
              result.setResolverTxHash = rest.txHash;
              break;
            case obsConfigureResolutionMessages.SET_ADDR_TX_SENT:
              result.setAddrTxHash = rest.txHash;
              break;
            case obsConfigureResolutionMessages.SET_NAME_TX_SENT:
              result.setNameTxHash = rest.txHash;
              break;
            default:
              break;
          }
        },
        complete: () => {
          resolve(result);
        },
      });
    });
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
  obsConfigureResolution,
};
