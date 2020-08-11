const Debug = require('debug');
const BN = require('bn.js');
const {
  checkEvent,
  getEventFromLogs,
  ethersBnToBn,
  getSalt,
  NULL_ADDRESS,
  NULL_BYTES,
  NULL_BYTES32,
  sumTags,
  findMissingBitsInTag,
  checkActiveBitInTag,
  tagBitToHuman,
} = require('./utils');
const { jsonApi, getAuthorization } = require('./api-utils');
const { hashEIP712 } = require('./sig-utils');
const { createObjParams } = require('./request-helper');
const { getAddress } = require('./wallet');
const { checkBalance } = require('./account');
const {
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
  getAppOwner,
  getDatasetOwner,
  getWorkerpoolOwner,
} = require('./hub');
const {
  addressSchema,
  apporderSchema,
  datasetorderSchema,
  workerpoolorderSchema,
  requestorderSchema,
  saltedApporderSchema,
  saltedDatasetorderSchema,
  saltedWorkerpoolorderSchema,
  saltedRequestorderSchema,
  signedApporderSchema,
  signedDatasetorderSchema,
  signedWorkerpoolorderSchema,
  signedRequestorderSchema,
  tagSchema,
  chainIdSchema,
  bytes32Schema,
  uint256Schema,
  nRlcAmountSchema,
  throwIfMissing,
  ValidationError,
} = require('./validator');
const { ObjectNotFoundError } = require('./errors');
const {
  wrapCall,
  wrapSend,
  wrapWait,
  wrapSignTypedDataV3,
} = require('./errorWrappers');

const debug = Debug('iexec:order');

const APP_ORDER = 'apporder';
const DATASET_ORDER = 'datasetorder';
const WORKERPOOL_ORDER = 'workerpoolorder';
const REQUEST_ORDER = 'requestorder';

const ORDERS_TYPES = [
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
];

const checkOrderName = (orderName) => {
  if (!ORDERS_TYPES.includes(orderName)) throw new ValidationError(`Invalid orderName value ${orderName}`);
};

const NULL_DATASETORDER = {
  dataset: NULL_ADDRESS,
  datasetprice: 0,
  volume: 0,
  tag: NULL_BYTES32,
  apprestrict: NULL_ADDRESS,
  workerpoolrestrict: NULL_ADDRESS,
  requesterrestrict: NULL_ADDRESS,
  salt: NULL_BYTES32,
  sign: NULL_BYTES,
};

const objDesc = {
  EIP712Domain: {
    primaryType: 'EIP712Domain',
    structMembers: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  [APP_ORDER]: {
    primaryType: 'AppOrder',
    structMembers: [
      { name: 'app', type: 'address' },
      { name: 'appprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'datasetrestrict', type: 'address' },
      { name: 'workerpoolrestrict', type: 'address' },
      { name: 'requesterrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'app',
    ownerMethod: getAppOwner,
    cancelMethod: 'manageAppOrder',
    cancelEvent: 'ClosedAppOrder',
    apiEndpoint: '/apporders',
    dealField: 'appHash',
    addressField: 'app',
  },
  [DATASET_ORDER]: {
    primaryType: 'DatasetOrder',
    structMembers: [
      { name: 'dataset', type: 'address' },
      { name: 'datasetprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'apprestrict', type: 'address' },
      { name: 'workerpoolrestrict', type: 'address' },
      { name: 'requesterrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'dataset',
    ownerMethod: getDatasetOwner,
    cancelMethod: 'manageDatasetOrder',
    cancelEvent: 'ClosedDatasetOrder',
    apiEndpoint: '/datasetorders',
    dealField: 'datasetHash',
    addressField: 'dataset',
  },
  [WORKERPOOL_ORDER]: {
    primaryType: 'WorkerpoolOrder',
    structMembers: [
      { name: 'workerpool', type: 'address' },
      { name: 'workerpoolprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'category', type: 'uint256' },
      { name: 'trust', type: 'uint256' },
      { name: 'apprestrict', type: 'address' },
      { name: 'datasetrestrict', type: 'address' },
      { name: 'requesterrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'workerpool',
    ownerMethod: getWorkerpoolOwner,
    cancelMethod: 'manageWorkerpoolOrder',
    cancelEvent: 'ClosedWorkerpoolOrder',
    apiEndpoint: '/workerpoolorders',
    dealField: 'workerpoolHash',
    addressField: 'workerpool',
  },
  [REQUEST_ORDER]: {
    primaryType: 'RequestOrder',
    structMembers: [
      { name: 'app', type: 'address' },
      { name: 'appmaxprice', type: 'uint256' },
      { name: 'dataset', type: 'address' },
      { name: 'datasetmaxprice', type: 'uint256' },
      { name: 'workerpool', type: 'address' },
      { name: 'workerpoolmaxprice', type: 'uint256' },
      { name: 'requester', type: 'address' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'bytes32' },
      { name: 'category', type: 'uint256' },
      { name: 'trust', type: 'uint256' },
      { name: 'beneficiary', type: 'address' },
      { name: 'callback', type: 'address' },
      { name: 'params', type: 'string' },
      { name: 'salt', type: 'bytes32' },
    ],
    cancelMethod: 'manageRequestOrder',
    cancelEvent: 'ClosedRequestOrder',
    apiEndpoint: '/requestorders',
    dealField: 'requestHash',
    addressField: 'requester',
  },
};

const objToStructArray = (objName, obj) => {
  const reducer = (total, current) => total.concat([obj[current.name]]);
  const struct = objDesc[objName].structMembers.reduce(reducer, []);
  return struct;
};

const signedOrderToStruct = (orderName, orderObj) => {
  const unsigned = objToStructArray(orderName, orderObj);
  const signed = unsigned.concat([orderObj.sign]);
  return signed;
};

const getEIP712Domain = async (contracts) => {
  const iexecContract = await contracts.getIExecContract();
  const {
    name, version, chainId, verifyingContract,
  } = await wrapCall(
    iexecContract.domain(),
  );
  return {
    name,
    version,
    chainId: chainId.toString(),
    verifyingContract,
  };
};

const getContractOwner = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  orderObj = throwIfMissing(),
) => {
  const contractAddress = orderObj[objDesc[orderName].contractPropName];
  return objDesc[orderName].ownerMethod(contracts, contractAddress);
};

const computeOrderHash = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  order = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    let vOrder;
    switch (orderName) {
      case APP_ORDER:
        vOrder = await saltedApporderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      case DATASET_ORDER:
        vOrder = await saltedDatasetorderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      case WORKERPOOL_ORDER:
        vOrder = await saltedWorkerpoolorderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      case REQUEST_ORDER:
        vOrder = await saltedRequestorderSchema({
          ethProvider: contracts.provider,
        }).validate(order);
        break;
      default:
    }
    const domainObj = await getEIP712Domain(contracts);
    const types = {};
    types.EIP712Domain = objDesc.EIP712Domain.structMembers;
    types[objDesc[orderName].primaryType] = objDesc[orderName].structMembers;

    const typedData = {
      types,
      domain: domainObj,
      primaryType: objDesc[orderName].primaryType,
      message: vOrder,
    };
    return hashEIP712(typedData);
  } catch (error) {
    debug('computeOrderHash()', error);
    throw error;
  }
};

const hashApporder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) => computeOrderHash(
  contracts,
  APP_ORDER,
  await saltedApporderSchema({
    ethProvider: contracts.provider,
  }).validate(order),
);
const hashDatasetorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) => computeOrderHash(
  contracts,
  DATASET_ORDER,
  await saltedDatasetorderSchema({
    ethProvider: contracts.provider,
  }).validate(order),
);
const hashWorkerpoolorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) => computeOrderHash(
  contracts,
  WORKERPOOL_ORDER,
  await saltedWorkerpoolorderSchema({
    ethProvider: contracts.provider,
  }).validate(order),
);
const hashRequestorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) => computeOrderHash(
  contracts,
  REQUEST_ORDER,
  await saltedRequestorderSchema({
    ethProvider: contracts.provider,
  }).validate(order),
);

const getRemainingVolume = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  order = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const initial = new BN(order.volume);
    const orderHash = await computeOrderHash(contracts, orderName, order);
    const iexecContract = contracts.getIExecContract();
    const cons = await wrapCall(iexecContract.viewConsumed(orderHash));
    const consumed = ethersBnToBn(cons);
    const remain = initial.sub(consumed);
    return remain;
  } catch (error) {
    debug('getRemainingVolume()', error);
    throw error;
  }
};

const signOrder = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  orderObj = throwIfMissing(),
) => {
  checkOrderName(orderName);
  const signerAddress = orderName === REQUEST_ORDER
    ? orderObj.requester
    : await getContractOwner(contracts, orderName, orderObj);
  const address = await getAddress(contracts);
  if (signerAddress !== address) {
    throw Error(
      `Invalid order signer, must be the ${
        orderName === REQUEST_ORDER ? 'requester' : 'resource owner'
      }`,
    );
  }
  const domainObj = await getEIP712Domain(contracts);

  const salt = getSalt();
  const saltedOrderObj = { ...orderObj, salt };

  const order = objDesc[orderName].structMembers;

  const types = {};
  types.EIP712Domain = objDesc.EIP712Domain.structMembers;
  types[objDesc[orderName].primaryType] = order;

  const message = saltedOrderObj;

  const typedData = {
    types,
    domain: domainObj,
    primaryType: objDesc[orderName].primaryType,
    message,
  };

  const sign = await wrapSignTypedDataV3(
    contracts.signer.signTypedDataV3(typedData),
  );
  const signedOrder = { ...saltedOrderObj, sign };
  return signedOrder;
};

const signApporder = async (
  contracts = throwIfMissing(),
  apporder = throwIfMissing(),
) => signOrder(
  contracts,
  APP_ORDER,
  await apporderSchema({ ethProvider: contracts.provider }).validate(
    apporder,
  ),
);

const signDatasetorder = async (
  contracts = throwIfMissing(),
  datasetorder = throwIfMissing(),
) => signOrder(
  contracts,
  DATASET_ORDER,
  await datasetorderSchema({
    ethProvider: contracts.provider,
  }).validate(datasetorder),
);

const signWorkerpoolorder = async (
  contracts = throwIfMissing(),
  workerpoolorder = throwIfMissing(),
) => signOrder(
  contracts,
  WORKERPOOL_ORDER,
  await workerpoolorderSchema({
    ethProvider: contracts.provider,
  }).validate(workerpoolorder),
);

const signRequestorder = async (
  contracts = throwIfMissing(),
  requestorder = throwIfMissing(),
) => signOrder(
  contracts,
  REQUEST_ORDER,
  await requestorderSchema({
    ethProvider: contracts.provider,
  }).validate(requestorder),
);

const cancelOrder = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  orderObj = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const args = signedOrderToStruct(orderName, orderObj);
    const remainingVolume = await getRemainingVolume(
      contracts,
      orderName,
      orderObj,
    );
    if (remainingVolume.isZero()) throw Error(`${orderName} already canceled`);
    const iexecContract = contracts.getIExecContract();
    const tx = await wrapSend(
      iexecContract[objDesc[orderName].cancelMethod](
        [args, 1, NULL_BYTES],
        contracts.txOptions,
      ),
    );
    const txReceipt = await wrapWait(tx.wait());
    if (!checkEvent(objDesc[orderName].cancelEvent, txReceipt.events)) throw Error(`${objDesc[orderName].cancelEvent} not confirmed`);
    return { order: orderObj, txHash: tx.hash };
  } catch (error) {
    debug('cancelOrder()', error);
    throw error;
  }
};

const cancelApporder = async (
  contracts = throwIfMissing(),
  apporder = throwIfMissing(),
) => cancelOrder(
  contracts,
  APP_ORDER,
  await signedApporderSchema().validate(apporder),
);

const cancelDatasetorder = async (
  contracts = throwIfMissing(),
  datasetorder = throwIfMissing(),
) => cancelOrder(
  contracts,
  DATASET_ORDER,
  await signedDatasetorderSchema().validate(datasetorder),
);

const cancelWorkerpoolorder = async (
  contracts = throwIfMissing(),
  workerpoolorder = throwIfMissing(),
) => cancelOrder(
  contracts,
  WORKERPOOL_ORDER,
  await signedWorkerpoolorderSchema().validate(workerpoolorder),
);

const cancelRequestorder = async (
  contracts = throwIfMissing(),
  requestorder = throwIfMissing(),
) => cancelOrder(
  contracts,
  REQUEST_ORDER,
  await signedRequestorderSchema().validate(requestorder),
);

const publishOrder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  signedOrder = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const address = await getAddress(contracts);
    const body = { chainId, order: signedOrder };
    const authorization = await getAuthorization(iexecGatewayURL, '/challenge')(
      contracts.chainId,
      address,
      contracts.signer,
    );
    const response = await jsonApi.post({
      api: iexecGatewayURL,
      endpoint: objDesc[orderName].apiEndpoint.concat('/publish'),
      body,
      headers: { authorization },
    });
    if (response.ok && response.saved && response.saved.orderHash) {
      return response.saved.orderHash;
    }
    throw Error('An error occured while publishing order');
  } catch (error) {
    debug('publishOrder()', error);
    throw error;
  }
};

const publishApporder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedApporder = throwIfMissing(),
) => publishOrder(
  contracts,
  iexecGatewayURL,
  APP_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedApporderSchema().validate(signedApporder),
);

const publishDatasetorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedDatasetorder = throwIfMissing(),
) => publishOrder(
  contracts,
  iexecGatewayURL,
  DATASET_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedDatasetorderSchema().validate(signedDatasetorder),
);

const publishWorkerpoolorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedWorkerpoolorder = throwIfMissing(),
) => publishOrder(
  contracts,
  iexecGatewayURL,
  WORKERPOOL_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedWorkerpoolorderSchema().validate(signedWorkerpoolorder),
);

const publishRequestorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedRequestorder = throwIfMissing(),
) => publishOrder(
  contracts,
  iexecGatewayURL,
  REQUEST_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedRequestorderSchema().validate(signedRequestorder),
);

const UNPUBLISH_TARGET_ORDERHASH = 'unpublish_orderHash';
const UNPUBLISH_TARGET_ALL_ORDERS = 'unpublish_all';
const UNPUBLISH_TARGET_LAST_ORDER = 'unpublish_last';

const unpublishOrder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  { target = UNPUBLISH_TARGET_ORDERHASH, orderHash, address } = {},
) => {
  try {
    checkOrderName(orderName);
    const body = { chainId, target };
    if (target === UNPUBLISH_TARGET_ORDERHASH) {
      if (!orderHash) throwIfMissing();
      body.orderHash = orderHash;
    } else if (
      target === UNPUBLISH_TARGET_LAST_ORDER
      || target === UNPUBLISH_TARGET_ALL_ORDERS
    ) {
      if (!address) throwIfMissing();
      body[objDesc[orderName].addressField] = address;
    }
    const userAddress = await getAddress(contracts);
    const authorization = await getAuthorization(iexecGatewayURL, '/challenge')(
      contracts.chainId,
      userAddress,
      contracts.signer,
    );
    const response = await jsonApi.post({
      api: iexecGatewayURL,
      endpoint: objDesc[orderName].apiEndpoint.concat('/unpublish'),
      body,
      headers: { authorization },
    });
    if (response.ok && response.unpublished) {
      return response.unpublished;
    }
    throw new Error('An error occured while unpublishing order');
  } catch (error) {
    debug('unpublishOrder()', error);
    throw error;
  }
};

const unpublishApporder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  apporderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  APP_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  { orderHash: await bytes32Schema().validate(apporderHash) },
);

const unpublishDatasetorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetorderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  DATASET_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  { orderHash: await bytes32Schema().validate(datasetorderHash) },
);

const unpublishWorkerpoolorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  workerpoolorderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  WORKERPOOL_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  { orderHash: await bytes32Schema().validate(workerpoolorderHash) },
);

const unpublishRequestorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  requestorderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  REQUEST_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  { orderHash: await bytes32Schema().validate(requestorderHash) },
);

const unpublishAllApporders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  appAddress = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  APP_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_ALL_ORDERS,
    address: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(appAddress),
  },
);

const unpublishAllDatasetorders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  DATASET_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_ALL_ORDERS,
    address: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(datasetAddress),
  },
);

const unpublishAllWorkerpoolorders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  workerpoolAddress = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  WORKERPOOL_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_ALL_ORDERS,
    address: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(workerpoolAddress),
  },
);

const unpublishAllRequestorders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  REQUEST_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_ALL_ORDERS,
    address: await getAddress(contracts),
  },
);

const unpublishLastApporder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  appAddress = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  APP_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_LAST_ORDER,
    address: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(appAddress),
  },
);

const unpublishLastDatasetorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  DATASET_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_LAST_ORDER,
    address: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(datasetAddress),
  },
);

const unpublishLastWorkerpoolorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  workerpoolAddress = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  WORKERPOOL_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_LAST_ORDER,
    address: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(workerpoolAddress),
  },
);

const unpublishLastRequestorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
) => unpublishOrder(
  contracts,
  iexecGatewayURL,
  REQUEST_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  {
    target: UNPUBLISH_TARGET_LAST_ORDER,
    address: await getAddress(contracts),
  },
);

const fetchPublishedOrderByHash = async (
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  orderHash = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const vChainId = await chainIdSchema().validate(chainId);
    const vOrderHash = await bytes32Schema().validate(orderHash);
    const endpoint = objDesc[orderName].apiEndpoint;
    if (!endpoint) throw Error(`Unsuported orderName ${orderName}`);
    const body = {
      chainId: vChainId,
      sort: {
        publicationTimestamp: -1,
      },
      limit: 1,
      find: { orderHash: vOrderHash },
    };
    const response = await jsonApi.post({
      api: iexecGatewayURL,
      endpoint: objDesc[orderName].apiEndpoint,
      body,
    });
    if (response.ok && response.orders) {
      if (response.orders[0]) return response.orders[0];
      throw new ObjectNotFoundError(orderName, vOrderHash, chainId);
    }
    throw Error('An error occured while fetching order');
  } catch (error) {
    debug('fetchPublishedOrderByHash()', error);
    throw error;
  }
};

const fetchDealsByOrderHash = async (
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  orderHash = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const vChainId = await chainIdSchema().validate(chainId);
    const vOrderHash = await bytes32Schema().validate(orderHash);
    const hashFiedName = objDesc[orderName].dealField;
    const body = {
      chainId: vChainId,
      sort: {
        publicationTimestamp: -1,
      },
      limit: 1,
      find: { [hashFiedName]: vOrderHash },
    };
    const response = await jsonApi.post({
      api: iexecGatewayURL,
      endpoint: '/deals',
      body,
    });
    if (response.ok && response.deals) {
      return { count: response.count, deals: response.deals };
    }
    throw Error('An error occured while getting deals');
  } catch (error) {
    debug('fetchDealsByOrderHash()', error);
    throw error;
  }
};

const verifySign = async (
  contracts = throwIfMissing(),
  signer = throwIfMissing(),
  orderHash = throwIfMissing(),
  sign = throwIfMissing(),
) => {
  const iexecContract = contracts.getIExecContract();
  const isValid = await wrapCall(
    iexecContract.verifySignature(signer, orderHash, sign),
  );
  return !!isValid;
};

const matchOrders = async (
  contracts = throwIfMissing(),
  appOrder = throwIfMissing(),
  datasetOrder = NULL_DATASETORDER,
  workerpoolOrder = throwIfMissing(),
  requestOrder = throwIfMissing(),
) => {
  try {
    const [
      vAppOrder,
      vDatasetOrder,
      vWorkerpoolOrder,
      vRequestOrder,
    ] = await Promise.all([
      signedApporderSchema().validate(appOrder),
      signedDatasetorderSchema().validate(datasetOrder),
      signedWorkerpoolorderSchema().validate(workerpoolOrder),
      signedRequestorderSchema().validate(requestOrder),
    ]);

    // deployment checks
    const checkAppDeployedAsync = async () => {
      if (!(await checkDeployedApp(contracts, vAppOrder.app))) {
        throw new Error(`No app deployed at address ${vAppOrder.app}`);
      }
    };
    const checkDatasetDeployedAsync = async () => {
      if (vDatasetOrder.dataset !== NULL_ADDRESS) {
        if (!(await checkDeployedDataset(contracts, vDatasetOrder.dataset))) {
          throw new Error(
            `No dataset deployed at address ${vDatasetOrder.dataset}`,
          );
        }
      }
    };
    const checkWorkerpoolDeployedAsync = async () => {
      if (
        !(await checkDeployedWorkerpool(contracts, vWorkerpoolOrder.workerpool))
      ) {
        throw new Error(
          `No workerpool deployed at address ${vWorkerpoolOrder.workerpool}`,
        );
      }
    };

    await Promise.all([
      checkAppDeployedAsync(),
      checkDatasetDeployedAsync(),
      checkWorkerpoolDeployedAsync(),
    ]);

    // signatures checks
    const checkAppSignAsync = async () => {
      const isValid = await verifySign(
        contracts,
        await getAppOwner(contracts, vAppOrder.app),
        await hashApporder(contracts, vAppOrder),
        vAppOrder.sign,
      );
      if (!isValid) {
        throw new Error('apporder invalid sign');
      }
    };
    const checkDatasetSignAsync = async () => {
      if (vDatasetOrder.dataset !== NULL_ADDRESS) {
        const isValid = await verifySign(
          contracts,
          await getDatasetOwner(contracts, vDatasetOrder.dataset),
          await hashDatasetorder(contracts, vDatasetOrder),
          vDatasetOrder.sign,
        );
        if (!isValid) {
          throw new Error('datasetorder invalid sign');
        }
      }
    };
    const checkWorkerpoolSignAsync = async () => {
      const isValid = await verifySign(
        contracts,
        await getWorkerpoolOwner(contracts, vWorkerpoolOrder.workerpool),
        await hashWorkerpoolorder(contracts, vWorkerpoolOrder),
        vWorkerpoolOrder.sign,
      );
      if (!isValid) {
        throw new Error('workerpoolorder invalid sign');
      }
    };
    const checkRequestSignAsync = async () => {
      const isValid = await verifySign(
        contracts,
        vRequestOrder.requester,
        await hashRequestorder(contracts, vRequestOrder),
        vRequestOrder.sign,
      );
      if (!isValid) {
        throw new Error('requestorder invalid sign');
      }
    };

    await Promise.all([
      checkAppSignAsync(),
      checkDatasetSignAsync(),
      checkWorkerpoolSignAsync(),
      checkRequestSignAsync(),
    ]);

    // address checks
    if (vRequestOrder.app !== vAppOrder.app) {
      throw new Error(
        `app address mismatch between requestorder (${vRequestOrder.app}) and apporder (${vAppOrder.app})`,
      );
    }
    if (
      vRequestOrder.dataset !== NULL_ADDRESS
      && vRequestOrder.dataset !== vDatasetOrder.dataset
    ) {
      throw new Error(
        `dataset address mismatch between requestorder (${vRequestOrder.dataset}) and datasetorder (${vDatasetOrder.dataset})`,
      );
    }
    if (
      vRequestOrder.workerpool !== NULL_ADDRESS
      && vRequestOrder.workerpool !== vWorkerpoolOrder.workerpool
    ) {
      throw new Error(
        `workerpool address mismatch between requestorder (${vRequestOrder.workerpool}) and workerpoolorder (${vWorkerpoolOrder.workerpool})`,
      );
    }
    // category check
    const requestCat = new BN(vRequestOrder.category);
    const workerpoolCat = new BN(vWorkerpoolOrder.category);
    if (!workerpoolCat.eq(requestCat)) {
      throw new Error(
        `category mismatch between requestorder (${requestCat}) and workerpoolorder (${workerpoolCat})`,
      );
    }
    // trust check
    const requestTrust = new BN(vRequestOrder.trust);
    const workerpoolTrust = new BN(vWorkerpoolOrder.trust);
    if (workerpoolTrust.lt(requestTrust)) {
      throw new Error(
        `workerpoolorder trust is too low (expected ${requestTrust}, got ${workerpoolTrust})`,
      );
    }
    // workerpool tag check
    const workerpoolMissingTagBits = findMissingBitsInTag(
      vWorkerpoolOrder.tag,
      sumTags([vRequestOrder.tag, vAppOrder.tag, vDatasetOrder.tag]),
    );
    if (workerpoolMissingTagBits.length > 0) {
      throw Error(
        `Missing tags [${workerpoolMissingTagBits.map(bit => tagBitToHuman(bit))}] in workerpoolorder`,
      );
    }
    // app tag check
    const teeAppRequired = checkActiveBitInTag(
      sumTags([vRequestOrder.tag, vDatasetOrder.tag]),
      1,
    );
    if (teeAppRequired) {
      if (!checkActiveBitInTag(vAppOrder.tag, 1)) {
        throw Error('Missing tag [tee] in apporder');
      }
    }
    // price check
    const workerpoolPrice = new BN(vWorkerpoolOrder.workerpoolprice);
    const workerpoolMaxPrice = new BN(vRequestOrder.workerpoolmaxprice);
    const appPrice = new BN(vAppOrder.appprice);
    const appMaxPrice = new BN(vRequestOrder.appmaxprice);
    const datasetPrice = new BN(vDatasetOrder.datasetprice);
    const datasetMaxPrice = new BN(vRequestOrder.datasetmaxprice);
    if (appMaxPrice.lt(appPrice)) {
      throw new Error(
        `appmaxprice too low (expected ${appPrice}, got ${appMaxPrice})`,
      );
    }
    if (workerpoolMaxPrice.lt(workerpoolPrice)) {
      throw new Error(
        `workerpoolmaxprice too low (expected ${workerpoolPrice}, got ${workerpoolMaxPrice})`,
      );
    }
    if (datasetMaxPrice.lt(datasetPrice)) {
      throw new Error(
        `datasetmaxprice too low (expected ${datasetPrice}, got ${datasetMaxPrice})`,
      );
    }

    // volumes checks
    const checkRequestVolumeAsync = async () => {
      const requestVolume = await getRemainingVolume(
        contracts,
        REQUEST_ORDER,
        vRequestOrder,
      );
      if (requestVolume.lte(new BN(0))) throw new Error('requestorder is fully consumed');
    };
    const checkWorkerpoolVolumeAsync = async () => {
      const workerpoolVolume = await getRemainingVolume(
        contracts,
        WORKERPOOL_ORDER,
        vWorkerpoolOrder,
      );
      if (workerpoolVolume.lte(new BN(0))) throw new Error('workerpoolorder is fully consumed');
    };
    const checkAppVolumeAsync = async () => {
      const appVolume = await getRemainingVolume(
        contracts,
        APP_ORDER,
        vAppOrder,
      );
      if (appVolume.lte(new BN(0))) throw new Error('apporder is fully consumed');
    };
    const checkDatasetVolumeAsync = async () => {
      if (vDatasetOrder.dataset !== NULL_ADDRESS) {
        const datasetVolume = await getRemainingVolume(
          contracts,
          DATASET_ORDER,
          vDatasetOrder,
        );
        if (datasetVolume.lte(new BN(0))) throw new Error('datasetorder is fully consumed');
      }
    };
    // account stake check
    const checkRequesterSolvabilityAsync = async () => {
      const costPerTask = appPrice.add(datasetPrice).add(workerpoolPrice);
      const { stake } = await checkBalance(contracts, vRequestOrder.requester);
      if (stake.lt(costPerTask)) {
        throw new Error(
          `Cost per task (${costPerTask}) is greather than requester account stake (${stake}). Orders can't be matched. If you are the requester, you should deposit to top up your account`,
        );
      }
    };

    // workerpool owner stake check
    const checkWorkerpoolStakeAsync = async () => {
      const workerpoolOwner = await getWorkerpoolOwner(
        contracts,
        vWorkerpoolOrder.workerpool,
      );
      const { stake } = await checkBalance(contracts, workerpoolOwner);
      const requiredStake = workerpoolPrice.mul(new BN(30)).div(new BN(100));
      if (stake.lt(requiredStake)) {
        throw Error(
          `workerpool required stake (${requiredStake}) is greather than workerpool owner's account stake (${stake}). Orders can't be matched. If you are the workerpool owner, you should deposit to top up your account`,
        );
      }
    };

    await Promise.all([
      checkWorkerpoolVolumeAsync(),
      checkRequestVolumeAsync(),
      checkAppVolumeAsync(),
      checkDatasetVolumeAsync(),
      checkRequesterSolvabilityAsync(),
      checkWorkerpoolStakeAsync(),
    ]);

    const appOrderStruct = signedOrderToStruct(APP_ORDER, vAppOrder);
    const datasetOrderStruct = signedOrderToStruct(
      DATASET_ORDER,
      vDatasetOrder,
    );
    const workerpoolOrderStruct = signedOrderToStruct(
      WORKERPOOL_ORDER,
      vWorkerpoolOrder,
    );
    const requestOrderStruct = signedOrderToStruct(
      REQUEST_ORDER,
      vRequestOrder,
    );
    const iexecContract = contracts.getIExecContract();
    const tx = await wrapSend(
      iexecContract.matchOrders(
        appOrderStruct,
        datasetOrderStruct,
        workerpoolOrderStruct,
        requestOrderStruct,
        contracts.txOptions,
      ),
    );
    const txReceipt = await wrapWait(tx.wait());
    const matchEvent = 'OrdersMatched';
    if (!checkEvent(matchEvent, txReceipt.events)) throw Error(`${matchEvent} not confirmed`);
    const { dealid, volume } = getEventFromLogs(
      matchEvent,
      txReceipt.events,
    ).args;
    return { dealid, volume: ethersBnToBn(volume), txHash: tx.hash };
  } catch (error) {
    debug('matchOrders() error', error);
    throw error;
  }
};

const createApporder = async (
  contracts = throwIfMissing(),
  {
    app = throwIfMissing(),
    appprice = '0',
    volume = '1',
    tag = NULL_BYTES32,
    datasetrestrict = NULL_ADDRESS,
    workerpoolrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  app: await addressSchema({ ethProvider: contracts.provider }).validate(app),
  appprice: await nRlcAmountSchema().validate(appprice),
  volume: await uint256Schema().validate(volume),
  tag: await tagSchema().validate(tag),
  datasetrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(datasetrestrict),
  workerpoolrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(workerpoolrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(requesterrestrict),
});

const createDatasetorder = async (
  contracts = throwIfMissing(),
  {
    dataset = throwIfMissing(),
    datasetprice = '0',
    volume = '1',
    tag = NULL_BYTES32,
    apprestrict = NULL_ADDRESS,
    workerpoolrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  dataset: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(dataset),
  datasetprice: await nRlcAmountSchema().validate(datasetprice),
  volume: await uint256Schema().validate(volume),
  tag: await tagSchema().validate(tag),
  apprestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(apprestrict),
  workerpoolrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(workerpoolrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(requesterrestrict),
});

const createWorkerpoolorder = async (
  contracts = throwIfMissing(),
  {
    workerpool = throwIfMissing(),
    category = throwIfMissing(),
    workerpoolprice = '0',
    volume = '1',
    trust = '0',
    tag = NULL_BYTES32,
    apprestrict = NULL_ADDRESS,
    datasetrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  workerpool: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(workerpool),
  workerpoolprice: await nRlcAmountSchema().validate(workerpoolprice),
  volume: await uint256Schema().validate(volume),
  category: await uint256Schema().validate(category),
  trust: await uint256Schema().validate(trust),
  tag: await tagSchema().validate(tag),
  apprestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(apprestrict),
  datasetrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(datasetrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.provider,
  }).validate(requesterrestrict),
});

const createRequestorder = async (
  { contracts = throwIfMissing(), resultProxyURL = throwIfMissing() } = {},
  {
    app = throwIfMissing(),
    category = throwIfMissing(),
    dataset = NULL_ADDRESS,
    workerpool = NULL_ADDRESS,
    appmaxprice = '0',
    datasetmaxprice = '0',
    workerpoolmaxprice = '0',
    volume = '1',
    requester,
    beneficiary,
    params = {},
    callback = NULL_ADDRESS,
    trust = '0',
    tag = NULL_BYTES32,
  } = {},
) => {
  const requesterOrUser = requester || (await getAddress(contracts));
  return {
    app: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(app),
    appmaxprice: await nRlcAmountSchema().validate(appmaxprice),
    dataset: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(dataset),
    datasetmaxprice: await nRlcAmountSchema().validate(datasetmaxprice),
    workerpool: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(workerpool),
    workerpoolmaxprice: await nRlcAmountSchema().validate(workerpoolmaxprice),
    requester: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(requesterOrUser),
    beneficiary: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(beneficiary || requesterOrUser),
    volume: await uint256Schema().validate(volume),
    params: await createObjParams({
      params,
      tag: await tagSchema().validate(tag),
      callback: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(callback),
      resultProxyURL,
    }),
    callback: await addressSchema({
      ethProvider: contracts.provider,
    }).validate(callback),
    category: await uint256Schema().validate(category),
    trust: await uint256Schema().validate(trust),
    tag: await tagSchema().validate(tag),
  };
};

module.exports = {
  computeOrderHash,
  getRemainingVolume,
  hashApporder,
  hashDatasetorder,
  hashWorkerpoolorder,
  hashRequestorder,
  createApporder,
  createDatasetorder,
  createWorkerpoolorder,
  createRequestorder,
  signApporder,
  signDatasetorder,
  signWorkerpoolorder,
  signRequestorder,
  cancelApporder,
  cancelDatasetorder,
  cancelWorkerpoolorder,
  cancelRequestorder,
  publishApporder,
  publishDatasetorder,
  publishWorkerpoolorder,
  publishRequestorder,
  unpublishApporder,
  unpublishDatasetorder,
  unpublishWorkerpoolorder,
  unpublishRequestorder,
  unpublishLastApporder,
  unpublishLastDatasetorder,
  unpublishLastWorkerpoolorder,
  unpublishLastRequestorder,
  unpublishAllApporders,
  unpublishAllDatasetorders,
  unpublishAllWorkerpoolorders,
  unpublishAllRequestorders,
  matchOrders,
  fetchPublishedOrderByHash,
  fetchDealsByOrderHash,
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
  NULL_DATASETORDER,
};
