const Debug = require('debug');
const BN = require('bn.js');
const {
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
  apporder: {
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
  },
  datasetorder: {
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
  },
  workerpoolorder: {
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
  },
  requestorder: {
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
  },
  sign: {
    structMembers: [
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
  },
};

const getEIP712Domain = (chainId, verifyingContract) => ({
  name: 'iExecODB',
  version: '3.0-alpha',
  chainId,
  verifyingContract,
});

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

const getContractOwner = async (orderName, orderObj, contracts) => {
  const contractAddress = orderObj[objDesc[orderName].contractPropName];
  const contract = contracts.getContract(objDesc[orderName].contractName)({
    at: contractAddress,
  });
  const owner = checksummedAddress(await contract.m_owner());
  return owner;
};

const getOrderHash = (orderName, order) => hashStruct(
  objDesc[orderName].primaryType,
  objDesc[orderName].structMembers,
  order,
);

const checkRemainingVolume = async (
  orderName,
  order,
  contracts,
  { strict = true } = {},
) => {
  const initial = new BN(order.volume);
  const orderHash = getOrderHash(orderName, order);
  const clerkAddress = await contracts.fetchClerkAddress();
  const clerkContract = contracts.getClerkContract({
    at: clerkAddress,
  });
  const consumed = ethersBnToBn(await clerkContract.viewConsumed(orderHash));
  const remain = initial.sub(consumed);
  if (remain.lte(new BN(0)) && strict) throw new Error(`${orderName} is fully consumed`);
  return remain;
};

const signOrder = async (orderName, orderObj, domainObj, eth, address) => {
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
    eth.sendAsync(
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
  debug('sig', sig);

  const sign = deserializeSig(sig);

  const signedOrder = Object.assign(saltedOrderObj, { sign });
  debug('signedOrder', signedOrder);
  return signedOrder;
};
const signAppOrder = (order, domain, eth, address) => signOrder('apporder', order, domain, eth, address);
const signDatasetOrder = (order, domain, eth, address) => signOrder('datasetorder', order, domain, eth, address);
const signWorkerpoolOrder = (order, domain, eth, address) => signOrder('workerpoolorder', order, domain, eth, address);
const signRequestOrder = (order, domain, eth, address) => signOrder('requestorder', order, domain, eth, address);

const cancelOrder = async (orderName, orderObj, contracts) => {
  const args = signedOrderToStruct(orderName, orderObj);
  const clerkAddress = await contracts.fetchClerkAddress();
  const clerkContact = contracts.getClerkContract({ at: clerkAddress });
  const tx = await clerkContact[objDesc[orderName].cancelMethode](args);
  const txReceipt = await tx.wait();
  const logs = contracts.decodeClerkLogs(txReceipt.logs);
  debug('logs', logs);
  if (!checkEvent(objDesc[orderName].cancelEvent, logs)) throw Error(`${objDesc[orderName].cancelEvent} not confirmed`);
  return true;
};
const cancelAppOrder = (order, domain) => cancelOrder('apporder', order, domain);
const cancelDatasetOrder = (order, domain) => cancelOrder('datasetorder', order, domain);
const cancelWorkerpoolOrder = (order, domain) => cancelOrder('workerpoolorder', order, domain);
const cancelRequestOrder = (order, domain) => cancelOrder('requestorder', order, domain);

const publishOrder = async (
  chainID,
  address,
  eth,
  orderName,
  orderToPublish,
) => {
  try {
    const endpoint = objDesc[orderName].apiEndpoint.concat('/publish');
    const body = { chainID, order: orderToPublish };
    const authorization = await getAuthorization(chainID, address, eth);
    const response = await http.post(endpoint, body, { authorization });
    debug('response', response);
    if (response.ok && response.saved && response.saved.orderHash) {
      return response.saved.orderHash;
    }
    throw new Error('An error occured while publishing order');
  } catch (error) {
    debug('publishOrder()', error);
    throw error;
  }
};

const unpublishOrder = async (chainID, address, eth, orderName, orderHash) => {
  try {
    const endpoint = objDesc[orderName].apiEndpoint.concat('/unpublish');
    debug('endpoint', endpoint);
    const body = { chainID, orderHash };
    debug('body', body);
    const authorization = await getAuthorization(chainID, address, eth);
    const response = await http.post(endpoint, body, { authorization });
    debug('response', response);
    if (response.ok && response.unpublished) {
      return response.unpublished;
    }
    throw new Error('An error occured while unpublishing order');
  } catch (error) {
    debug('publishOrder()', error);
    throw error;
  }
};

const showOrder = async (chainID, orderName, { orderHash } = {}) => {
  try {
    const endpoint = objDesc[orderName].apiEndpoint;
    debug('endpoint', endpoint);
    const body = {
      chainID,
      sort: {
        publicationTimestamp: -1,
      },
      limit: 1,
    };
    if (orderHash) body.find = { orderHash };
    debug('body', body);
    const response = await http.post(endpoint, body);
    debug('response', response);
    if (response.ok && response.orders) {
      const order = response.orders[0];
      if (order) return order;
      throw new Error('Order not published');
    }
    throw new Error('An error occured while getting order');
  } catch (error) {
    debug('publishOrder()', error);
    throw error;
  }
};

const matchOrders = async (
  appOrder,
  datasetOrder = NULL_DATASETORDER,
  workerpoolOrder,
  requestOrder,
  contracts,
) => {
  try {
    const appOrderStruct = signedOrderToStruct('apporder', appOrder);
    const datasetOrderStruct = signedOrderToStruct(
      'datasetorder',
      datasetOrder,
    );
    const workerpoolOrderStruct = signedOrderToStruct(
      'workerpoolorder',
      workerpoolOrder,
    );
    const requestOrderStruct = signedOrderToStruct(
      'requestorder',
      requestOrder,
    );

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
    debug('logs', logs);
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
  cancelOrder,
  cancelAppOrder,
  cancelDatasetOrder,
  cancelWorkerpoolOrder,
  cancelRequestOrder,
  checkRemainingVolume,
  publishOrder,
  unpublishOrder,
  showOrder,
  signAppOrder,
  signDatasetOrder,
  signWorkerpoolOrder,
  signRequestOrder,
  matchOrders,
};
