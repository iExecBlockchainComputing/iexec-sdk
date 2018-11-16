const Debug = require('debug');
const BN = require('bn.js');
const { getSalt, hashStruct } = require('./sig-utils');
const { signStruct, load } = require('./keystore.js');
const { checkEvent, getEventFromLogs, ethersBnToBn } = require('./utils');

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
    structType:
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
    structMembers: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  apporder: {
    structType:
      'DappOrder(address dapp,uint256 dappprice,uint256 volume,uint256 tag,address datarestrict,address poolrestrict,address userrestrict,bytes32 salt)',
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
  },
  dataorder: {
    structType:
      'DataOrder(address data,uint256 dataprice,uint256 volume,uint256 tag,address dapprestrict,address poolrestrict,address userrestrict,bytes32 salt)',
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
  },
  poolorder: {
    structType:
      'PoolOrder(address pool,uint256 poolprice,uint256 volume,uint256 tag,uint256 category,uint256 trust,address dapprestrict,address datarestrict,address userrestrict,bytes32 salt)',
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
  },
  userorder: {
    structType:
      'UserOrder(address dapp,uint256 dappmaxprice,address data,uint256 datamaxprice,address pool,uint256 poolmaxprice,address requester,uint256 volume,uint256 tag,uint256 category,uint256 trust,address beneficiary,address callback,string params,bytes32 salt)',
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

const checkContractOwner = async (orderName, orderObj, contracts) => {
  const contractAddress = orderObj[objDesc[orderName].contractPropName];
  const contract = contracts.getContract(objDesc[orderName].contractName)({
    at: contractAddress,
  });
  const owner = await contract.m_owner();
  const { address } = await load();
  if (owner.toLowerCase() !== address.toLowerCase()) {
    throw new Error(
      `only owner ${owner} can sign order for contract ${address}`,
    );
  }
  return true;
};

const checkRemainingVolume = async (
  orderName,
  order,
  contracts,
  { strict = true } = {},
) => {
  const initial = new BN(order.volume);
  const orderHash = hashStruct(
    objDesc[orderName].structType,
    objDesc[orderName].structMembers,
    order,
  );
  const clerkContract = contracts.getClerkContract();
  const consumed = ethersBnToBn(await clerkContract.viewConsumed(orderHash));
  const remain = initial.sub(consumed);
  if (remain.lte(new BN(0)) && strict) throw new Error(`${orderName} is fully consumed`);
  return remain;
};

const signOrder = async (orderName, orderObj, domainObj) => {
  const domain = {
    structType: objDesc.EIP712Domain.structType,
    structMembers: objDesc.EIP712Domain.structMembers,
    values: domainObj,
  };
  debug('domain', domain);

  const salt = getSalt();
  debug('salt', salt);

  const saltedOrderObj = Object.assign(orderObj, { salt });
  const order = {
    structType: objDesc[orderName].structType,
    structMembers: objDesc[orderName].structMembers,
    values: saltedOrderObj,
  };
  debug('order', order);

  const sign = await signStruct(order, domain);
  debug('sign', sign);

  const signedOrder = Object.assign(saltedOrderObj, { sign });
  debug('signedOrder', signedOrder);
  return signedOrder;
};
const signAppOrder = (order, domain) => signOrder('apporder', order, domain);
const signDataOrder = (order, domain) => signOrder('dataorder', order, domain);
const signPoolOrder = (order, domain) => signOrder('poolorder', order, domain);
const signUserOrder = (order, domain) => signOrder('userorder', order, domain);

const cancelOrder = async (orderName, orderObj, contracts) => {
  const args = signedOrderToStruct(orderName, orderObj);
  const clerkContact = contracts.getClerkContract();
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

  const clerkContact = contracts.getClerkContract();
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
  checkContractOwner,
  cancelOrder,
  cancelAppOrder,
  cancelDataOrder,
  cancelPoolOrder,
  cancelUserOrder,
  checkRemainingVolume,
  signAppOrder,
  signDataOrder,
  signPoolOrder,
  signUserOrder,
  matchOrders,
};
