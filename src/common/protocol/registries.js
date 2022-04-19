const Debug = require('debug');
const {
  addressSchema,
  appSchema,
  datasetSchema,
  workerpoolSchema,
  uint256Schema,
  throwIfMissing,
} = require('../utils/validator');
const {
  getEventFromLogs,
  checkSigner,
  bnifyNestedEthersBn,
  checksummedAddress,
  ethersBnToBn,
  multiaddrHexToHuman,
  hexToBuffer,
  BN,
  NULL_ADDRESS,
} = require('../utils/utils');
const { wrapCall, wrapSend, wrapWait } = require('../utils/errorWrappers');
const { ObjectNotFoundError } = require('../utils/errors');

const debug = Debug('iexec:protocol:registries');

const tokenIdToAddress = (tokenId) => {
  const hexTokenId = tokenId.toHexString().substring(2);
  const lowerCaseAddress = NULL_ADDRESS.substring(
    0,
    42 - hexTokenId.length,
  ).concat(hexTokenId);
  return checksummedAddress(lowerCaseAddress);
};

const checkDeployedObj =
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

const checkDeployedApp = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  checkDeployedObj('app')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

const checkDeployedDataset = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  checkDeployedObj('dataset')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

const checkDeployedWorkerpool = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  checkDeployedObj('workerpool')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

const toUpperFirst = (str) => ''.concat(str[0].toUpperCase(), str.substr(1));

const createArgs = {
  app: ['owner', 'name', 'type', 'multiaddr', 'checksum', 'mrenclave'],
  dataset: ['owner', 'name', 'multiaddr', 'checksum'],
  workerpool: ['owner', 'description'],
};

const deployObj =
  (objName = throwIfMissing()) =>
  async (contracts = throwIfMissing(), obj = throwIfMissing()) => {
    try {
      checkSigner(contracts);
      const registryContract = await wrapCall(
        contracts.fetchRegistryContract(objName),
      );
      const args = createArgs[objName].map((e) => obj[e]);
      const predictFonctionName = 'predict'.concat(toUpperFirst(objName));
      const predictedAddress = await wrapCall(
        registryContract[predictFonctionName](...args),
      );
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
      const createFonctionName = 'create'.concat(toUpperFirst(objName));
      const tx = await wrapSend(
        registryContract[createFonctionName](...args, contracts.txOptions),
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

const deployApp = async (contracts, app) =>
  deployObj('app')(
    contracts,
    await appSchema({ ethProvider: contracts.provider }).validate(app),
  );
const deployDataset = async (contracts, dataset) =>
  deployObj('dataset')(
    contracts,
    await datasetSchema({ ethProvider: contracts.provider }).validate(dataset),
  );
const deployWorkerpool = async (contracts, workerpool) =>
  deployObj('workerpool')(
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

const getAppOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  getObjOwner('app')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

const getDatasetOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  getObjOwner('dataset')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(address),
  );

const getWorkerpoolOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) =>
  getObjOwner('workerpool')(
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

const countUserApps = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) =>
  countUserObj('app')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
const countUserDatasets = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) =>
  countUserObj('dataset')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
const countUserWorkerpools = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) =>
  countUserObj('workerpool')(
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

const showApp = async (
  contracts = throwIfMissing(),
  appAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress('app')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      appAddress,
    ),
  );
  return { objAddress, app: cleanApp(obj) };
};

const showUserApp = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showUserObjByIndex('app')(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
  return { objAddress, app: cleanApp(obj) };
};

const showDataset = async (
  contracts = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress('dataset')(
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

const showUserDataset = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showUserObjByIndex('dataset')(
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

const showWorkerpool = async (
  contracts = throwIfMissing(),
  workerpoolAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress('workerpool')(
    contracts,
    await addressSchema({ ethProvider: contracts.provider }).validate(
      workerpoolAddress,
    ),
  );
  const clean = cleanObj(obj);
  return { objAddress, workerpool: clean };
};

const showUserWorkerpool = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showUserObjByIndex('workerpool')(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema({ ethProvider: contracts.provider }).validate(
      userAddress,
    ),
  );
  const clean = cleanObj(obj);
  return { objAddress, workerpool: clean };
};

module.exports = {
  checkDeployedObj,
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
  deployObj,
  deployApp,
  deployDataset,
  deployWorkerpool,
  getObjOwner,
  getAppOwner,
  getDatasetOwner,
  getWorkerpoolOwner,
  showObjByAddress,
  showApp,
  showDataset,
  showWorkerpool,
  showUserObjByIndex,
  showUserApp,
  showUserDataset,
  showUserWorkerpool,
  countUserObj,
  countUserApps,
  countUserDatasets,
  countUserWorkerpools,
};
