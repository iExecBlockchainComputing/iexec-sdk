import Debug from 'debug';
import { Contract, namehash, id } from 'ethers';
import { abi as RegistryEntryAbi } from '../generated/@iexec/poco/RegistryEntry.js';
import { abi as ENSRegistryAbi } from '../generated/@ensdomains/registry/ENSRegistry.js';
import { abi as FIFSRegistrarAbi } from '../generated/@ensdomains/registry/FIFSRegistrar.js';
import { abi as ReverseRegistrarAbi } from '../generated/@ensdomains/registry/ReverseRegistrar.js';
import { abi as PublicResolverAbi } from '../generated/@ensdomains/resolvers/PublicResolver.js';
import {
  throwIfMissing,
  addressSchema,
  ensDomainSchema,
  ensLabelSchema,
} from '../utils/validator.js';
import { getAddress } from '../wallet/address.js';
import { checkDeployedObj } from '../protocol/registries.js';
import { wrapSend, wrapWait, wrapCall } from '../utils/errorWrappers.js';
import { Observable, SafeObserver } from '../utils/reactive.js';
import { checkSigner } from '../utils/utils.js';
import { NULL_ADDRESS, APP, DATASET, WORKERPOOL } from '../utils/constant.js';
import { getEnsRegistryAddress } from './registry.js';
import { getOwner, lookupAddress } from './resolution.js';

const debug = Debug('iexec:ens:registration');

const FIFS_DOMAINS = {
  [APP]: 'apps.iexec.eth',
  [DATASET]: 'datasets.iexec.eth',
  [WORKERPOOL]: 'pools.iexec.eth',
  default: 'users.iexec.eth',
};

export const getDefaultDomain = async (
  contracts = throwIfMissing(),
  address,
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(address);
    const [isApp, isDataset, isWorkerpool] = await Promise.all([
      checkDeployedObj(APP)(contracts, vAddress),
      checkDeployedObj(DATASET)(contracts, vAddress),
      checkDeployedObj(WORKERPOOL)(contracts, vAddress),
    ]);
    if (isApp) {
      return FIFS_DOMAINS[APP];
    }
    if (isDataset) {
      return FIFS_DOMAINS[DATASET];
    }
    if (isWorkerpool) {
      return FIFS_DOMAINS[WORKERPOOL];
    }
    return FIFS_DOMAINS.default;
  } catch (error) {
    debug('getDefaultDomain()', error);
    throw error;
  }
};

export const registerFifsEns = async (
  contracts = throwIfMissing(),
  label = throwIfMissing(),
  domain = FIFS_DOMAINS.default,
) => {
  try {
    checkSigner(contracts);
    const vDomain = await ensDomainSchema().validate(domain);
    const vLabel = await ensLabelSchema().validate(label);
    let registerTxHash;
    const name = `${vLabel}.${vDomain}`;
    const labelHash = id(vLabel);
    const address = await getAddress(contracts);
    const ownedBy = await getOwner(contracts, name);
    if (ownedBy === NULL_ADDRESS) {
      const domainOwner = await getOwner(contracts, vDomain);
      const domainOwnerCode = await wrapCall(
        contracts.provider.getCode(domainOwner),
      );
      if (domainOwnerCode === '0x') {
        throw new Error(
          `The base domain ${vDomain} owner ${domainOwner} is not a contract`,
        );
      }
      const fifsRegistrarContract = new Contract(
        domainOwner,
        FIFSRegistrarAbi,
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
      throw new Error(`${name} is already owned by ${ownedBy}`);
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

export const obsConfigureResolution = (
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
        checkSigner(contracts);
        const vAddress =
          address !== undefined
            ? await addressSchema({
                ethProvider: contracts.provider,
              }).validate(address)
            : await getAddress(contracts);
        const vName = await ensDomainSchema().validate(name);
        const nameHash = namehash(vName);
        const walletAddress = await getAddress(contracts);
        const ensAddress = await getEnsRegistryAddress(contracts);

        const REVERSE_DOMAIN = 'addr.reverse';

        let addressIsContract = false;
        if (vAddress !== walletAddress) {
          const addressCode = await wrapCall(
            contracts.provider.getCode(vAddress),
          );
          if (addressCode === '0x') {
            throw new Error(
              `Target address ${vAddress} is not a contract and don't match current wallet address ${walletAddress}, impossible to setup ENS resolution`,
            );
          } else {
            addressIsContract = true;
          }
        }

        const nameOwner = await getOwner(contracts, vName);
        if (nameOwner.toLowerCase() !== walletAddress.toLowerCase()) {
          throw new Error(
            `The current address ${walletAddress} is not owner of ${vName}`,
          );
        }

        if (addressIsContract) {
          const registryEntryContract = new Contract(
            vAddress,
            RegistryEntryAbi,
            contracts.signer,
          );
          const entryOwner = await wrapCall(registryEntryContract.owner());
          if (
            !(
              entryOwner &&
              entryOwner.toLowerCase() === walletAddress.toLowerCase()
            )
          ) {
            throw new Error(
              `${walletAddress} is not the owner of ${vAddress}, impossible to setup ENS resolution`,
            );
          }
        }

        if (abort) return;
        safeObserver.next({
          message: obsConfigureResolutionMessages.DESCRIBE_WORKFLOW,
          addressType: addressIsContract ? 'CONTRACT' : 'EAO',
          steps: ['SET_RESOLVER', 'SET_ADDR', 'SET_NAME'],
        });

        const resolverCode = await wrapCall(
          contracts.provider.getCode(publicResolverAddress),
        );
        if (resolverCode === '0x') {
          throw new Error(
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
            ENSRegistryAbi,
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
          PublicResolverAbi,
          contracts.signer,
        );
        const addr = await wrapCall(
          resolverContract.getFunction('addr(bytes32)')(nameHash),
        );
        const isAddrSet = addr && addr.toLowerCase() === vAddress.toLowerCase();
        if (!isAddrSet) {
          safeObserver.next({
            message: obsConfigureResolutionMessages.SET_ADDR_TX_REQUEST,
            name: vName,
            address: vAddress,
          });
          if (abort) return;
          const setAddrTx = await wrapSend(
            resolverContract.getFunction('setAddr(bytes32,address)')(
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
              RegistryEntryAbi,
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
              ReverseRegistrarAbi,
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

export const configureResolution = async (
  contracts = throwIfMissing(),
  publicResolverAddress = throwIfMissing(),
  name = throwIfMissing(),
  address,
) => {
  try {
    checkSigner(contracts);
    const vAddress =
      address !== undefined
        ? await addressSchema({ ethProvider: contracts.provider }).validate(
            address,
          )
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
