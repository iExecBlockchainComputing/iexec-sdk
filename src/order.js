const Debug = require('debug');
const BN = require('bn.js');
const {
  cleanRPC,
  checkEvent,
  getEventFromLogs,
  ethersBnToBn,
  http,
  getSalt,
  getAuthorization,
  NULL_ADDRESS,
  NULL_BYTES,
  NULL_BYTES32,
  signTypedDatav3,
} = require('./utils');
const { hashEIP712 } = require('./sig-utils');
const { getAddress } = require('./wallet');
const { getAppOwner, getDatasetOwner, getWorkerpoolOwner } = require('./hub');
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
  paramsSchema,
  tagSchema,
  chainIdSchema,
  bytes32Schema,
  uint256Schema,
  throwIfMissing,
  ValidationError,
} = require('./validator');
const { ObjectNotFoundError } = require('./errors');

const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');

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
    apiEndpoint: 'apporders',
    dealField: 'appHash',
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
    apiEndpoint: 'datasetorders',
    dealField: 'datasetHash',
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
    apiEndpoint: 'workerpoolorders',
    dealField: 'workerpoolHash',
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
    apiEndpoint: 'requestorders',
    dealField: 'requestHash',
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
  const domain = await wrapCall(iexecContract.domain());
  return cleanRPC(domain);
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
          ethProvider: contracts.jsonRpcProvider,
        }).validate(order);
        break;
      case DATASET_ORDER:
        vOrder = await saltedDatasetorderSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(order);
        break;
      case WORKERPOOL_ORDER:
        vOrder = await saltedWorkerpoolorderSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(order);
        break;
      case REQUEST_ORDER:
        vOrder = await saltedRequestorderSchema({
          ethProvider: contracts.jsonRpcProvider,
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
    ethProvider: contracts.jsonRpcProvider,
  }).validate(order),
);
const hashDatasetorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) => computeOrderHash(
  contracts,
  DATASET_ORDER,
  await saltedDatasetorderSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(order),
);
const hashWorkerpoolorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) => computeOrderHash(
  contracts,
  WORKERPOOL_ORDER,
  await saltedWorkerpoolorderSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(order),
);
const hashRequestorder = async (
  contracts = throwIfMissing(),
  order = throwIfMissing(),
) => computeOrderHash(
  contracts,
  REQUEST_ORDER,
  await saltedRequestorderSchema({
    ethProvider: contracts.jsonRpcProvider,
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
  if (signerAddress.toLowerCase() !== address.toLowerCase()) {
    throw Error(
      `Invalid order signer, must be the ${
        orderName === REQUEST_ORDER ? 'requester' : 'resource owner'
      }`,
    );
  }
  const domainObj = await getEIP712Domain(contracts);

  const salt = getSalt();
  const saltedOrderObj = Object.assign(orderObj, { salt });

  const order = objDesc[orderName].structMembers;

  const types = {};
  types.EIP712Domain = objDesc.EIP712Domain.structMembers;
  types[objDesc[orderName].primaryType] = order;

  const message = orderObj;

  const typedData = {
    types,
    domain: domainObj,
    primaryType: objDesc[orderName].primaryType,
    message,
  };

  const sign = await signTypedDatav3(
    contracts.jsonRpcProvider,
    address,
    typedData,
  );
  const signedOrder = Object.assign(saltedOrderObj, { sign });
  return signedOrder;
};

const signApporder = async (
  contracts = throwIfMissing(),
  apporder = throwIfMissing(),
) => signOrder(
  contracts,
  APP_ORDER,
  await apporderSchema({ ethProvider: contracts.jsonRpcProvider }).validate(
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
    ethProvider: contracts.jsonRpcProvider,
  }).validate(datasetorder),
);

const signWorkerpoolorder = async (
  contracts = throwIfMissing(),
  workerpoolorder = throwIfMissing(),
) => signOrder(
  contracts,
  WORKERPOOL_ORDER,
  await workerpoolorderSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(workerpoolorder),
);

const signRequestorder = async (
  contracts = throwIfMissing(),
  requestorder = throwIfMissing(),
) => signOrder(
  contracts,
  REQUEST_ORDER,
  await requestorderSchema({
    ethProvider: contracts.jsonRpcProvider,
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
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  signedOrder = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const address = await getAddress(contracts);
    const endpoint = objDesc[orderName].apiEndpoint.concat('/publish');
    const body = { chainId, order: signedOrder };
    const authorization = await getAuthorization(
      chainId,
      address,
      contracts.jsonRpcProvider,
    );
    const response = await http.post(endpoint, body, { authorization });
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
  signedApporder = throwIfMissing(),
) => publishOrder(
  contracts,
  APP_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedApporderSchema().validate(signedApporder),
);

const publishDatasetorder = async (
  contracts = throwIfMissing(),
  signedDatasetorder = throwIfMissing(),
) => publishOrder(
  contracts,
  DATASET_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedDatasetorderSchema().validate(signedDatasetorder),
);

const publishWorkerpoolorder = async (
  contracts = throwIfMissing(),
  signedWorkerpoolorder = throwIfMissing(),
) => publishOrder(
  contracts,
  WORKERPOOL_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedWorkerpoolorderSchema().validate(signedWorkerpoolorder),
);

const publishRequestorder = async (
  contracts = throwIfMissing(),
  signedRequestorder = throwIfMissing(),
) => publishOrder(
  contracts,
  REQUEST_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await signedRequestorderSchema().validate(signedRequestorder),
);

const unpublishOrder = async (
  contracts = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  orderHash = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const address = await getAddress(contracts);
    const endpoint = objDesc[orderName].apiEndpoint.concat('/unpublish');
    const body = { chainId, orderHash };
    const authorization = await getAuthorization(
      chainId,
      address,
      contracts.jsonRpcProvider,
    );
    const response = await http.post(endpoint, body, { authorization });
    if (response.ok && response.unpublished) {
      return response.unpublished;
    }
    throw new Error('An error occured while unpublishing order');
  } catch (error) {
    debug('publishOrder()', error);
    throw error;
  }
};

const unpublishApporder = async (
  contracts = throwIfMissing(),
  apporderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  APP_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await bytes32Schema().validate(apporderHash),
);

const unpublishDatasetorder = async (
  contracts = throwIfMissing(),
  datasetorderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  DATASET_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await bytes32Schema().validate(datasetorderHash),
);

const unpublishWorkerpoolorder = async (
  contracts = throwIfMissing(),
  workerpoolorderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  WORKERPOOL_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await bytes32Schema().validate(workerpoolorderHash),
);

const unpublishRequestorder = async (
  contracts = throwIfMissing(),
  requestorderHash = throwIfMissing(),
) => unpublishOrder(
  contracts,
  REQUEST_ORDER,
  await chainIdSchema().validate(contracts.chainId),
  await bytes32Schema().validate(requestorderHash),
);

const fetchPublishedOrderByHash = async (
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
    const response = await http.post(endpoint, body);
    if (response.ok && response.orders) {
      if (response.orders[0]) return response.orders[0];
      throw new ObjectNotFoundError(orderName, vOrderHash, chainId);
    }

    throw Error('An error occured while getting order');
  } catch (error) {
    debug('fetchPublishedOrderByHash()', error);
    throw error;
  }
};

const fetchDealsByOrderHash = async (
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  orderHash = throwIfMissing(),
) => {
  try {
    checkOrderName(orderName);
    const vChainId = await chainIdSchema().validate(chainId);
    const vOrderHash = await bytes32Schema().validate(orderHash);
    const hashFiedName = objDesc[orderName].dealField;
    const endpoint = 'deals';
    const body = {
      chainId: vChainId,
      sort: {
        publicationTimestamp: -1,
      },
      limit: 1,
      find: { [hashFiedName]: vOrderHash },
    };
    const response = await http.post(endpoint, body);
    if (response.ok && response.deals) {
      return { count: response.count, deals: response.deals };
    }
    throw Error('An error occured while getting deals');
  } catch (error) {
    debug('fetchDealsByOrderHash()', error);
    throw error;
  }
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
    appprice = throwIfMissing(),
    volume = throwIfMissing(),
    tag = NULL_BYTES32,
    datasetrestrict = NULL_ADDRESS,
    workerpoolrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  app: await addressSchema({ ethProvider: contracts.jsonRpcProvider }).validate(
    app,
  ),
  appprice: await uint256Schema().validate(appprice),
  volume: await uint256Schema().validate(volume),
  tag: await tagSchema().validate(tag),
  datasetrestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(datasetrestrict),
  workerpoolrestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(workerpoolrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(requesterrestrict),
});

const createDatasetorder = async (
  contracts = throwIfMissing(),
  {
    dataset = throwIfMissing(),
    datasetprice = throwIfMissing(),
    volume = throwIfMissing(),
    tag = NULL_BYTES32,
    apprestrict = NULL_ADDRESS,
    workerpoolrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  dataset: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(dataset),
  datasetprice: await uint256Schema().validate(datasetprice),
  volume: await uint256Schema().validate(volume),
  tag: await tagSchema().validate(tag),
  apprestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(apprestrict),
  workerpoolrestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(workerpoolrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(requesterrestrict),
});

const createWorkerpoolorder = async (
  contracts = throwIfMissing(),
  {
    workerpool = throwIfMissing(),
    workerpoolprice = throwIfMissing(),
    volume = throwIfMissing(),
    category = throwIfMissing(),
    trust = '0',
    tag = NULL_BYTES32,
    apprestrict = NULL_ADDRESS,
    datasetrestrict = NULL_ADDRESS,
    requesterrestrict = NULL_ADDRESS,
  } = {},
) => ({
  workerpool: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(workerpool),
  workerpoolprice: await uint256Schema().validate(workerpoolprice),
  volume: await uint256Schema().validate(volume),
  category: await uint256Schema().validate(category),
  trust: await uint256Schema().validate(trust),
  tag: await tagSchema().validate(tag),
  apprestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(apprestrict),
  datasetrestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(datasetrestrict),
  requesterrestrict: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(requesterrestrict),
});

const createRequestorder = async (
  contracts = throwIfMissing(),
  {
    app = throwIfMissing(),
    appmaxprice = throwIfMissing(),
    workerpoolmaxprice = throwIfMissing(),
    requester = throwIfMissing(),
    volume = throwIfMissing(),
    category = throwIfMissing(),
    workerpool = NULL_ADDRESS,
    dataset = NULL_ADDRESS,
    datasetmaxprice = '0',
    beneficiary,
    params = '',
    callback = NULL_ADDRESS,
    trust = '0',
    tag = NULL_BYTES32,
  } = {},
) => ({
  app: await addressSchema({ ethProvider: contracts.jsonRpcProvider }).validate(
    app,
  ),
  appmaxprice: await uint256Schema().validate(appmaxprice),
  dataset: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(dataset),
  datasetmaxprice: await uint256Schema().validate(datasetmaxprice),
  workerpool: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(workerpool),
  workerpoolmaxprice: await uint256Schema().validate(workerpoolmaxprice),
  requester: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(requester),
  beneficiary: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(beneficiary || requester),
  volume: await uint256Schema().validate(volume),
  params: await paramsSchema().validate(params),
  callback: await addressSchema({
    ethProvider: contracts.jsonRpcProvider,
  }).validate(callback),
  category: await uint256Schema().validate(category),
  trust: await uint256Schema().validate(trust),
  tag: await tagSchema().validate(tag),
});

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
  matchOrders,
  fetchPublishedOrderByHash,
  fetchDealsByOrderHash,
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
  NULL_DATASETORDER,
};
