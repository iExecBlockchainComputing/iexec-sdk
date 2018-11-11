const Debug = require('debug');
const { getSalt } = require('./sig-utils');
const { signStruct } = require('./keystore.js');

const debug = Debug('iexec:order');

const structDesc = {
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
  appOrder: {
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
  },
};

const signOrder = async (orderName, orderObj, domainObj) => {
  const domain = {
    structType: structDesc.EIP712Domain.structType,
    structMembers: structDesc.EIP712Domain.structMembers,
    values: domainObj,
  };
  debug('domain', domain);

  const salt = getSalt();
  debug('salt', salt);

  const saltedOrderObj = Object.assign(orderObj, { salt });
  const order = {
    structType: structDesc[orderName].structType,
    structMembers: structDesc[orderName].structMembers,
    values: saltedOrderObj,
  };
  debug('order', order);

  const sign = await signStruct(order, domain);
  debug('sign', sign);

  const signedOrder = Object.assign(saltedOrderObj, { sign });
  debug('signedOrder', signedOrder);
  return signedOrder;
};

const signDappOrder = (order, domain) => signOrder('appOrder', order, domain);

module.exports = {
  signDappOrder,
};
