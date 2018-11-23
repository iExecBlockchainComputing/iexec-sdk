const Debug = require('debug');
const BN = require('bn.js');
const {
  checkEvent,
  getEventFromLogs,
  ethersBnToBn,
  http,
  getSalt,
} = require('./utils');
const { hashStruct } = require('./sig-utils');

const debug = Debug('iexec:order');

const NULLDATASET = {
  data: '0x0000000000000000000000000000000000000000',
  dataprice: '0',
  volume: '0',
  tag: '0',
  dapprestrict: '0x0000000000000000000000000000000000000000',
  poolrestrict: '0x0000000000000000000000000000000000000000',
  userrestrict: '0x0000000000000000000000000000000000000000',
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
    primaryType: 'DappOrder',
    structMembers: [
      { name: 'dapp', type: 'address' },
      { name: 'dappprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'uint256' },
      { name: 'datarestrict', type: 'address' },
      { name: 'poolrestrict', type: 'address' },
      { name: 'userrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'dapp',
    contractName: 'dapp',
    cancelMethode: 'cancelDappOrder',
    cancelEvent: 'ClosedDappOrder',
    apiEndpoint: 'apporders',
  },
  dataorder: {
    primaryType: 'DataOrder',
    structMembers: [
      { name: 'data', type: 'address' },
      { name: 'dataprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'uint256' },
      { name: 'dapprestrict', type: 'address' },
      { name: 'poolrestrict', type: 'address' },
      { name: 'userrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'data',
    contractName: 'data',
    cancelMethode: 'cancelDataOrder',
    cancelEvent: 'ClosedDataOrder',
    apiEndpoint: 'datasetorders',
  },
  poolorder: {
    primaryType: 'PoolOrder',
    structMembers: [
      { name: 'pool', type: 'address' },
      { name: 'poolprice', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'uint256' },
      { name: 'category', type: 'uint256' },
      { name: 'trust', type: 'uint256' },
      { name: 'dapprestrict', type: 'address' },
      { name: 'datarestrict', type: 'address' },
      { name: 'userrestrict', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    contractPropName: 'pool',
    contractName: 'pool',
    cancelMethode: 'cancelPoolOrder',
    cancelEvent: 'ClosedPoolOrder',
    apiEndpoint: 'workerpoolorders',
  },
  userorder: {
    primaryType: 'UserOrder',
    structMembers: [
      { name: 'dapp', type: 'address' },
      { name: 'dappmaxprice', type: 'uint256' },
      { name: 'data', type: 'address' },
      { name: 'datamaxprice', type: 'uint256' },
      { name: 'pool', type: 'address' },
      { name: 'poolmaxprice', type: 'uint256' },
      { name: 'requester', type: 'address' },
      { name: 'volume', type: 'uint256' },
      { name: 'tag', type: 'uint256' },
      { name: 'category', type: 'uint256' },
      { name: 'trust', type: 'uint256' },
      { name: 'beneficiary', type: 'address' },
      { name: 'callback', type: 'address' },
      { name: 'params', type: 'string' },
      { name: 'salt', type: 'bytes32' },
    ],
    cancelMethode: 'cancelUserOrder',
    cancelEvent: 'ClosedUserOrder',
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
  const owner = await contract.m_owner();
  return owner;
};

const checkRemainingVolume = async (
  orderName,
  order,
  contracts,
  { strict = true } = {},
) => {
  const initial = new BN(order.volume);
  const orderHash = hashStruct(
    objDesc[orderName].primaryType,
    objDesc[orderName].structMembers,
    order,
  );
  const clerkAddress = await contracts.fetchClerkAddress();
  const clerkContract = contracts.getClerkContract({
    at: clerkAddress,
  });
  const consumed = ethersBnToBn(await clerkContract.viewConsumed(orderHash));
  const remain = initial.sub(consumed);
  if (remain.lte(new BN(0)) && strict) throw new Error(`${orderName} is fully consumed`);
  return remain;
};

const signOrder = async (orderName, orderObj, domainObj, eth) => {
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
        params: [null, data],
      },
      (err, { result }) => {
        if (err) reject(err);
        resolve(result);
      },
    );
  });

  const sign = await signTypedDatav3(typedData);
  debug('sign', sign);

  const signedOrder = Object.assign(saltedOrderObj, { sign });
  debug('signedOrder', signedOrder);
  return signedOrder;
};
const signAppOrder = (order, domain, eth) => signOrder('apporder', order, domain, eth);
const signDataOrder = (order, domain, eth) => signOrder('dataorder', order, domain, eth);
const signPoolOrder = (order, domain, eth) => signOrder('poolorder', order, domain, eth);
const signUserOrder = (order, domain, eth) => signOrder('userorder', order, domain, eth);

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
const cancelDataOrder = (order, domain) => cancelOrder('dataorder', order, domain);
const cancelPoolOrder = (order, domain) => cancelOrder('poolorder', order, domain);
const cancelUserOrder = (order, domain) => cancelOrder('userorder', order, domain);

const publishOrder = async (chainID, orderName, orderToPublish) => {
  try {
    const endpoint = objDesc[orderName].apiEndpoint.concat('/publish');
    debug('endpoint', endpoint);
    const body = { chainID, order: orderToPublish };
    debug('body', body);
    const response = await http.post(endpoint, body);
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

const matchOrders = async (
  appOrder,
  dataOrder = NULLDATASET,
  poolOrder,
  userOrder,
  contracts,
) => {
  const appOrderStruct = signedOrderToStruct('apporder', appOrder);
  const dataOrderStruct = signedOrderToStruct('dataorder', dataOrder);
  const poolOrderStruct = signedOrderToStruct('poolorder', poolOrder);
  const userOrderStruct = signedOrderToStruct('userorder', userOrder);

  const clerkAddress = await contracts.fetchClerkAddress();
  const clerkContact = contracts.getClerkContract({ at: clerkAddress });
  debug('appOrderStruct', appOrderStruct);
  debug('dataOrderStruct', dataOrderStruct);
  debug('poolOrderStruct', poolOrderStruct);
  debug('userOrderStruct', userOrderStruct);
  let logs;
  try {
    const tx = await clerkContact.matchOrders(
      appOrderStruct,
      dataOrderStruct,
      poolOrderStruct,
      userOrderStruct,
    );
    const txReceipt = await tx.wait();
    logs = contracts.decodeClerkLogs(txReceipt.logs);
  } catch (error) {
    debug('matchOrders() error', error);
    throw error;
  }
  debug('logs', logs);
  const matchEvent = 'OrdersMatched';
  if (!checkEvent(matchEvent, logs)) throw Error(`${matchEvent} not confirmed`);
  const { dealid, volume } = getEventFromLogs(matchEvent, logs);
  return { dealid, volume };
};

module.exports = {
  getEIP712Domain,
  getContractOwner,
  cancelOrder,
  cancelAppOrder,
  cancelDataOrder,
  cancelPoolOrder,
  cancelUserOrder,
  checkRemainingVolume,
  publishOrder,
  signAppOrder,
  signDataOrder,
  signPoolOrder,
  signUserOrder,
  matchOrders,
};
