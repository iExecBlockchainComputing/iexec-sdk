const Debug = require('debug');
const { getSalt } = require('./sig-utils');
const { signStruct, load } = require('./keystore.js');

const debug = Debug('iexec:order');

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
  },
};

const verifyOwner = async (orderName, orderObj, contracts) => {
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

const signDappOrder = (order, domain) => signOrder('apporder', order, domain);

module.exports = {
  verifyOwner,
  signDappOrder,
};
