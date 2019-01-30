const Debug = require('debug');
const BN = require('bn.js');
const {
  isBytes32,
  checkEvent,
  getEventFromLogs,
  ethersBnToBn,
  http,
  getSalt,
  checksummedAddress,
  getAuthorization,
} = require('./utils');
const { hashStruct, deserializeSig } = require('./sig-utils');

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
  if (!ORDERS_TYPES.includes(orderName)) throw Error(`Invalid orderName value ${orderName}`);
};

const NULL_DATASETORDER = {
  dataset: '0x0000000000000000000000000000000000000000',
  datasetprice: '0',
  volume: '0',
  tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
  apprestrict: '0x0000000000000000000000000000000000000000',
  workerpoolrestrict: '0x0000000000000000000000000000000000000000',
  requesterrestrict: '0x0000000000000000000000000000000000000000',
  salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
  sign: {
    r: '0x0000000000000000000000000000000000000000000000000000000000000000',
    s: '0x0000000000000000000000000000000000000000000000000000000000000000',
    v: '0',
  },
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
    contractName: 'app',
    cancelMethode: 'cancelAppOrder',
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
    contractName: 'dataset',
    cancelMethode: 'cancelDatasetOrder',
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
    contractName: 'workerpool',
    cancelMethode: 'cancelWorkerpoolOrder',
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
    cancelMethode: 'cancelRequestOrder',
    cancelEvent: 'ClosedRequestOrder',
    apiEndpoint: 'requestorders',
    dealField: 'requestHash',
  },
  sign: {
    structMembers: [
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
  },
};

const objToStructArray = (objName, obj) => {
  const reducer = (total, current) => total.concat([obj[current.name]]);
  const struct = objDesc[objName].structMembers.reduce(reducer, []);
  return struct;
};

const signedOrderToStruct = (orderName, orderObj) => {
  const unsigned = objToStructArray(orderName, orderObj);
  const sign = objToStructArray('sign', orderObj.sign);
  const signed = unsigned.concat([sign]);
  return signed;
};

const getEIP712Domain = (chainId, verifyingContract) => ({
  name: 'iExecODB',
  version: '3.0-alpha',
  chainId,
  verifyingContract,
});

const getContractOwner = async (contracts, orderName, orderObj) => {
  try {
    checkOrderName(orderName);
    const contractAddress = orderObj[objDesc[orderName].contractPropName];
    const contract = contracts.getContract(objDesc[orderName].contractName)({
      at: contractAddress,
    });
    const owner = checksummedAddress(await contract.m_owner());
    return owner;
  } catch (error) {
    debug('getContractOwner()', error);
    throw error;
  }
};

const getOrderHash = (orderName, order) => {
  try {
    checkOrderName(orderName);
    return hashStruct(
      objDesc[orderName].primaryType,
      objDesc[orderName].structMembers,
      order,
    );
  } catch (error) {
    debug('getOrderHash()', error);
    throw error;
  }
};

const checkRemainingVolume = async (
  contracts,
  orderName,
  order,
  { strict = true } = {},
) => {
  try {
    checkOrderName(orderName);
    const initial = new BN(order.volume);
    const orderHash = getOrderHash(orderName, order);
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({
      at: clerkAddress,
    });
    const cons = await clerkContract.viewConsumed(orderHash);
    const consumed = ethersBnToBn(cons);
    const remain = initial.sub(consumed);
    if (remain.lte(new BN(0)) && strict) throw new Error(`${orderName} is fully consumed`);
    return remain;
  } catch (error) {
    debug('checkRemainingVolume()', error);
    throw error;
  }
};

const signOrder = async (
  contracts,
  orderName,
  orderObj,
  domainObj,
  address,
) => {
  checkOrderName(orderName);
  const signerAddress = orderName === REQUEST_ORDER
    ? orderObj.requester
    : await getContractOwner(contracts, orderName, orderObj);
  if (signerAddress.toLowerCase() !== address.toLowerCase()) {
    throw Error(
      `Invalid order signer, must be the ${
        orderName === REQUEST_ORDER ? 'requester' : 'resource owner'
      }`,
    );
  }

  const salt = getSalt();
  const saltedOrderObj = Object.assign(orderObj, { salt });

  const domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ];

  const order = objDesc[orderName].structMembers;

  const types = {};
  types.EIP712Domain = domain;
  types[objDesc[orderName].primaryType] = order;

  const message = orderObj;

  const typedData = {
    types,
    domain: domainObj,
    primaryType: objDesc[orderName].primaryType,
    message,
  };

  const signTypedDatav3 = data => new Promise((resolve, reject) => {
    contracts.ethProvider.sendAsync(
      {
        method: 'eth_signTypedData_v3',
        params: [address, JSON.stringify(data)],
      },
      (err, result) => {
        if (err) reject(err);
        resolve(result.result);
      },
    );
  });
  const sig = await signTypedDatav3(typedData);
  const sign = deserializeSig(sig);
  const signedOrder = Object.assign(saltedOrderObj, { sign });
  return signedOrder;
};

const cancelOrder = async (contracts, orderName, orderObj) => {
  try {
    checkOrderName(orderName);
    const args = signedOrderToStruct(orderName, orderObj);
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContact = contracts.getClerkContract({ at: clerkAddress });
    const tx = await clerkContact[objDesc[orderName].cancelMethode](args);
    const txReceipt = await tx.wait();
    const logs = contracts.decodeClerkLogs(txReceipt.logs);
    if (!checkEvent(objDesc[orderName].cancelEvent, logs)) throw Error(`${objDesc[orderName].cancelEvent} not confirmed`);
    return true;
  } catch (error) {
    debug('cancelOrder()', error);
    throw error;
  }
};

const publishOrder = async (contracts, orderName, signedOrder, address) => {
  try {
    checkOrderName(orderName);
    const { chainId } = signedOrder.domain;
    const endpoint = objDesc[orderName].apiEndpoint.concat('/publish');
    const body = { chainId, order: signedOrder };
    const authorization = await getAuthorization(
      chainId,
      address,
      contracts.ethProvider,
    );
    const response = await http.post(endpoint, body, { authorization });
    if (response.ok && response.saved && response.saved.orderHash) {
      return response.saved.orderHash;
    }
    throw new Error('An error occured while publishing order');
  } catch (error) {
    debug('publishOrder()', error);
    throw error;
  }
};

const unpublishOrder = async (
  contracts,
  orderName,
  chainId,
  orderHash,
  address,
) => {
  try {
    checkOrderName(orderName);
    const endpoint = objDesc[orderName].apiEndpoint.concat('/unpublish');
    const body = { chainId, orderHash };
    const authorization = await getAuthorization(
      chainId,
      address,
      contracts.ethProvider,
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

const fetchPublishedOrderByHash = async (orderName, chainId, orderHash) => {
  try {
    checkOrderName(orderName);
    isBytes32(orderHash);
    const endpoint = objDesc[orderName].apiEndpoint;
    if (!endpoint) throw Error(`Unsuported orderName ${orderName}`);
    const body = {
      chainId,
      sort: {
        publicationTimestamp: -1,
      },
      limit: 1,
      find: { orderHash },
    };
    const response = await http.post(endpoint, body);
    if (response.ok && response.orders) {
      return response.orders[0] || null;
    }
    throw Error('An error occured while getting order');
  } catch (error) {
    debug('fetchPublishedOrderByHash()', error);
    throw error;
  }
};

const fetchDealsByOrderHash = async (orderName, chainId, orderHash) => {
  try {
    checkOrderName(orderName);
    isBytes32(orderHash);
    const hashFiedName = objDesc[orderName].dealField;
    const endpoint = 'deals';
    const body = {
      chainId,
      sort: {
        publicationTimestamp: -1,
      },
      limit: 1,
      find: { [hashFiedName]: orderHash },
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
  contracts,
  appOrder,
  datasetOrder = NULL_DATASETORDER,
  workerpoolOrder,
  requestOrder,
) => {
  try {
    const appOrderStruct = signedOrderToStruct(APP_ORDER, appOrder);
    const datasetOrderStruct = signedOrderToStruct(DATASET_ORDER, datasetOrder);
    const workerpoolOrderStruct = signedOrderToStruct(
      WORKERPOOL_ORDER,
      workerpoolOrder,
    );
    const requestOrderStruct = signedOrderToStruct(REQUEST_ORDER, requestOrder);

    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({ at: clerkAddress });
    const tx = await clerkContract.matchOrders(
      appOrderStruct,
      datasetOrderStruct,
      workerpoolOrderStruct,
      requestOrderStruct,
    );
    const txReceipt = await tx.wait();
    const logs = contracts.decodeClerkLogs(txReceipt.logs);
    const matchEvent = 'OrdersMatched';
    if (!checkEvent(matchEvent, logs)) throw Error(`${matchEvent} not confirmed`);
    const { dealid, volume } = getEventFromLogs(matchEvent, logs);
    return { dealid, volume };
  } catch (error) {
    debug('matchOrders() error', error);
    throw error;
  }
};

module.exports = {
  getEIP712Domain,
  getOrderHash,
  getContractOwner,
  checkRemainingVolume,
  signOrder,
  cancelOrder,
  publishOrder,
  unpublishOrder,
  matchOrders,
  fetchPublishedOrderByHash,
  fetchDealsByOrderHash,
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
};
