import Debug from 'debug';
import {
  addressSchema,
  appSchema,
  datasetSchema,
  workerpoolSchema,
  uint256Schema,
  objMrenclaveSchema,
  throwIfMissing,
} from '../utils/validator';
import {
  getEventFromLogs,
  checkSigner,
  bnifyNestedEthersBn,
  checksummedAddress,
  ethersBnToBn,
  multiaddrHexToHuman,
  hexToBuffer,
  BN,
} from '../utils/utils';
import { NULL_ADDRESS, APP, DATASET, WORKERPOOL } from '../utils/constant';
import { wrapCall, wrapSend, wrapWait } from '../utils/errorWrappers';
import { ObjectNotFoundError } from '../utils/errors';

const debug = Debug('iexec:protocol:registries');

const tokenIdToAddress = (tokenId) => {
  const hexTokenId = tokenId.toHexString().substring(2);
  const lowerCaseAddress = NULL_ADDRESS.substring(
    0,
    42 - hexTokenId.length,
  ).concat(hexTokenId);
  return checksummedAddress(lowerCaseAddress);
};

export const checkDeployedObj =
  (objName = throwIfMissing()) =>
  async (contracts = throwIfMissing(), address = throwIfMissing()) => {
    try {
      const registryContract = await wrapCall(
        contracts.fetchRegistryContract(objName),
      );
      const isDeployed = await wrapCall(registryContract.isRegistered(address));
      return isDeployed;
    } catch (error) {
      debug('checkDeployedObj()', error);
      throw error;
    }
  };

export const checkDeployedApp = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  checkDeployedObj(APP)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

export const checkDeployedDataset = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  checkDeployedObj(DATASET)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

export const checkDeployedWorkerpool = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  checkDeployedObj(WORKERPOOL)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

const toUpperFirst = (str) => ''.concat(str[0].toUpperCase(), str.substr(1));

const createArgs = {
  [APP]: ['owner', 'name', 'type', 'multiaddr', 'checksum', 'mrenclave'],
  [DATASET]: ['owner', 'name', 'multiaddr', 'checksum'],
  [WORKERPOOL]: ['owner', 'description'],
};

const predictObjAddress =
  (objName = throwIfMissing()) =>
  async (contracts = throwIfMissing(), obj = throwIfMissing()) => {
    try {
      const registryContract = await wrapCall(
        contracts.fetchRegistryContract(objName),
      );
      const args = createArgs[objName].map((e) => obj[e]);
      const predictFunctionName = 'predict'.concat(toUpperFirst(objName));
      const predictedAddress = await wrapCall(
        registryContract[predictFunctionName](...args),
      );
      return predictedAddress;
    } catch (error) {
      debug('predictObjAddress()', error);
      throw error;
    }
  };

const deployObj =
  (objName = throwIfMissing()) =>
  async (contracts = throwIfMissing(), obj = throwIfMissing()) => {
    try {
      checkSigner(contracts);
      const registryContract = await wrapCall(
        contracts.fetchRegistryContract(objName),
      );
      const predictedAddress = await predictObjAddress(objName)(contracts, obj);
      const isDeployed = await checkDeployedObj(objName)(
        contracts,
        predictedAddress,
      );
      if (isDeployed) {
        throw Error(
          `${toUpperFirst(
            objName,
          )} already deployed at address ${predictedAddress}`,
        );
      }
      const args = createArgs[objName].map((e) => obj[e]);
      const createFunctionName = 'create'.concat(toUpperFirst(objName));
      const tx = await wrapSend(
        registryContract[createFunctionName](...args, contracts.txOptions),
      );
      const txReceipt = await wrapWait(tx.wait(contracts.confirms));
      const event = getEventFromLogs('Transfer', txReceipt.events, {
        strict: true,
      });
      const { tokenId } = event.args;
      const address = tokenIdToAddress(tokenId);
      const txHash = txReceipt.transactionHash;
      return { address, txHash };
    } catch (error) {
      debug('deployObj()', error);
      throw error;
    }
  };

export const predictAppAddress = async (contracts, app) =>
  predictObjAddress(APP)(
    contracts,
    await appSchema({ ethProvider: contracts.provider }).validate(app),
  );
export const predictDatasetAddress = async (contracts, dataset) =>
  predictObjAddress(DATASET)(
    contracts,
    await datasetSchema({ ethProvider: contracts.provider }).validate(dataset),
  );
export const predictWorkerpoolAddress = async (contracts, workerpool) =>
  predictObjAddress(WORKERPOOL)(
    contracts,
    await workerpoolSchema({ ethProvider: contracts.provider }).validate(
      workerpool,
    ),
  );

export const deployApp = async (contracts, app) =>
  deployObj(APP)(
    contracts,
    await appSchema({ ethProvider: contracts.provider }).validate(app),
  );
export const deployDataset = async (contracts, dataset) =>
  deployObj(DATASET)(
    contracts,
    await datasetSchema({ ethProvider: contracts.provider }).validate(dataset),
  );
export const deployWorkerpool = async (contracts, workerpool) =>
  deployObj(WORKERPOOL)(
    contracts,
    await workerpoolSchema({ ethProvider: contracts.provider }).validate(
      workerpool,
    ),
  );

const getObjOwner =
  (objName = throwIfMissing()) =>
  async (contracts = throwIfMissing(), address = throwIfMissing()) => {
    try {
      const contract = contracts.getContract(objName, address);
      const owner = checksummedAddress(await wrapCall(contract.owner()));
      return owner;
    } catch (error) {
      debug('getObjOwner()', error);
      throw error;
    }
  };

export const getAppOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  getObjOwner(APP)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

export const getDatasetOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  getObjOwner(DATASET)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

export const getWorkerpoolOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  getObjOwner(WORKERPOOL)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

const showObjByAddress =
  (objName = throwIfMissing()) =>
  async (contracts = throwIfMissing(), objAddress = throwIfMissing()) => {
    try {
      const vAddress = await addressSchema({
        ethProvider: contracts.provider,
      }).validate(objAddress);
      const isDeployed = await checkDeployedObj(objName)(contracts, objAddress);
      if (!isDeployed)
        throw new ObjectNotFoundError(objName, objAddress, contracts.chainId);
      const contract = contracts.getContract(objName, vAddress);
      const readableProps = Object.values(contract.interface.functions)
        .filter((fragment) => fragment.constant)
        .map((fragment) => fragment.name);
      const values = await Promise.all(
        readableProps.map((e) => wrapCall(contract[e]())),
      );
      const objProps = values.reduce(
        (acc, curr, i) => ({ ...acc, [readableProps[i]]: curr }),
        {},
      );
      const obj = bnifyNestedEthersBn(objProps);
      return { obj, objAddress: vAddress };
    } catch (error) {
      debug('showObjByAddress()', error);
      throw error;
    }
  };

const countUserObj =
  (objName = throwIfMissing()) =>
  async (contracts = throwIfMissing(), userAddress = throwIfMissing()) => {
    try {
      const vAddress = await addressSchema({
        ethProvider: contracts.provider,
      }).validate(userAddress);
      const registryContract = await wrapCall(
        contracts.fetchRegistryContract(objName),
      );
      const objCount = await wrapCall(registryContract.balanceOf(vAddress));
      return ethersBnToBn(objCount);
    } catch (error) {
      debug('countObj()', error);
      throw error;
    }
  };

export const countUserApps = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) =>
  countUserObj(APP)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
export const countUserDatasets = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) =>
  countUserObj(DATASET)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
export const countUserWorkerpools = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) =>
  countUserObj(WORKERPOOL)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );

const showUserObjByIndex =
  (objName = throwIfMissing()) =>
  async (
    contracts = throwIfMissing(),
    objIndex = throwIfMissing(),
    userAddress = throwIfMissing(),
  ) => {
    try {
      const vIndex = await uint256Schema().validate(objIndex);
      const vAddress = await addressSchema({
        ethProvider: contracts.provider,
      }).validate(userAddress);
      const totalObj = await countUserObj(objName)(contracts, userAddress);
      if (new BN(vIndex).gte(totalObj)) throw Error(`${objName} not deployed`);
      const registryContract = await wrapCall(
        contracts.fetchRegistryContract(objName),
      );
      const tokenId = await wrapCall(
        registryContract.tokenOfOwnerByIndex(vAddress, vIndex),
      );
      const objAddress = tokenIdToAddress(tokenId);
      return showObjByAddress(objName)(contracts, objAddress);
    } catch (error) {
      debug('showObjByIndex()', error);
      throw error;
    }
  };

const cleanObj = (obj) => {
  const reducer = (acc, curr) => {
    const name =
      curr[0].substr(0, 2) === 'm_' ? curr[0].split('m_')[1] : curr[0];
    return Object.assign(acc, { [name]: curr[1] });
  };
  return Object.entries(obj).reduce(reducer, {});
};

const cleanApp = (obj) =>
  Object.assign(
    cleanObj(obj),
    obj.m_appMultiaddr && {
      appMultiaddr: multiaddrHexToHuman(obj.m_appMultiaddr),
    },
    obj.m_appMREnclave && {
      appMREnclave: hexToBuffer(obj.m_appMREnclave).toString(),
    },
  );

export const showApp = async (
  contracts = throwIfMissing(),
  appAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress(APP)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      appAddress,
    ),
  );
  return { objAddress, app: cleanApp(obj) };
};

export const showUserApp = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showUserObjByIndex(APP)(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
  return { objAddress, app: cleanApp(obj) };
};

export const showDataset = async (
  contracts = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress(DATASET)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      datasetAddress,
    ),
  );
  const clean = Object.assign(
    cleanObj(obj),
    obj.m_datasetMultiaddr && {
      datasetMultiaddr: multiaddrHexToHuman(obj.m_datasetMultiaddr),
    },
  );
  return { objAddress, dataset: clean };
};

export const showUserDataset = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showUserObjByIndex(DATASET)(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
  const clean = Object.assign(
    cleanObj(obj),
    obj.m_datasetMultiaddr && {
      datasetMultiaddr: multiaddrHexToHuman(obj.m_datasetMultiaddr),
    },
  );
  return { objAddress, dataset: clean };
};

export const showWorkerpool = async (
  contracts = throwIfMissing(),
  workerpoolAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress(WORKERPOOL)(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      workerpoolAddress,
    ),
  );
  const clean = cleanObj(obj);
  return { objAddress, workerpool: clean };
};

export const showUserWorkerpool = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showUserObjByIndex(WORKERPOOL)(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
  const clean = cleanObj(obj);
  return { objAddress, workerpool: clean };
};

export const resolveTeeFrameworkFromApp = async (
  app,
  { strict = true } = {},
) => {
  if (app.appMREnclave) {
    try {
      const mrenclave = await objMrenclaveSchema().validate(app.appMREnclave);
      return mrenclave.framework;
    } catch (err) {
      debug('resolveTeeFrameworkFromApp()', err);
      if (strict) {
        throw Error('Failed to resolve TEE framework from app');
      }
    }
  }
  return undefined;
};
