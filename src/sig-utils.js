const Debug = require('debug');
const BN = require('bn.js');
const {
  defaultAbiCoder,
  keccak256,
  solidityKeccak256,
  bigNumberify,
} = require('ethers').utils;

const SignerProvider = require('ethjs-custom-signer');
const { Wallet } = require('ethers');
const ethSigUtils = require('eth-sig-util');

const debug = Debug('iexec:sig-utils');

const getStructType = (primaryType, members) => {
  const reducer = (oldValue, e) => {
    let newValue = oldValue;
    if (newValue) newValue = newValue.concat(',');
    newValue = newValue.concat(e.type.concat(' ').concat(e.name));
    return newValue;
  };
  const args = members.reduce(reducer, String(''));
  const structType = primaryType
    .concat('(')
    .concat(args)
    .concat(')');
  return structType;
};

const hashStruct = (primaryType, members, obj) => {
  const type = getStructType(primaryType, members);
  const typeHash = keccak256(Buffer.from(type, 'utf8'));
  const encodedTypes = ['bytes32'].concat(
    members.map((e) => {
      if (e.type === 'string' || e.type === 'bytes') return 'bytes32';
      return e.type;
    }),
  );
  const values = [typeHash].concat(
    members.map((e) => {
      if (e.type === 'string') return keccak256(Buffer.from(obj[e.name], 'utf8'));
      if (e.type === 'uint256') return bigNumberify(obj[e.name]);
      if (e.type === 'uint8') return bigNumberify(obj[e.name]);
      return obj[e.name];
    }),
  );
  const encoded = defaultAbiCoder.encode(encodedTypes, values);
  const structHash = keccak256(encoded);
  return structHash;
};

const hashEIP712 = (typedData) => {
  const domainSeparatorHash = hashStruct(
    'EIP712Domain',
    typedData.types.EIP712Domain,
    typedData.domain,
  );
  const messageHash = hashStruct(
    typedData.primaryType,
    typedData.types[typedData.primaryType],
    typedData.message,
  );
  const hash = solidityKeccak256(
    ['bytes', 'bytes32', 'bytes32'],
    ['0x1901', domainSeparatorHash, messageHash],
  );
  return hash;
};

const accounts = wallet => async () => [wallet.address];
const signTransaction = wallet => async ({
  gasPrice,
  to,
  data,
  gasLimit,
  nonce,
  value,
}) => {
  try {
    const signed = await wallet.sign({
      gasPrice,
      to,
      data,
      gasLimit,
      nonce,
      value,
    });
    return signed;
  } catch (error) {
    debug('signTransaction()', error);
    throw error;
  }
};
const signPersonalMessage = wallet => async (address, message) => {
  try {
    const sign = wallet.signMessage(message);
    return sign;
  } catch (error) {
    debug('signPersonalMessage()', error);
    throw error;
  }
};
const signTypedDatav3 = wallet => async (address, typedData) => {
  try {
    const data = JSON.parse(typedData);
    const pk = Buffer.from(wallet.privateKey.substring(2), 'hex');
    const sign = ethSigUtils.signTypedData(pk, {
      data,
    });
    return sign;
  } catch (error) {
    debug('signTypedDatav3()', error);
    throw error;
  }
};

const getSignerFromPrivateKey = (host, privateKey, { gasPrice } = {}) => {
  const wallet = new Wallet(privateKey);
  let gasPriceOption;
  if (gasPrice !== undefined) {
    const bnGasPrice = new BN(gasPrice);
    if (bnGasPrice.isNeg()) throw Error('Invalid gas price, must be positive');
    gasPriceOption = '0x'.concat(bnGasPrice.toString('hex'));
  }
  return new SignerProvider(host, {
    accounts: accounts(wallet),
    signTransaction: signTransaction(wallet),
    signPersonalMessage: signPersonalMessage(wallet),
    signTypedDatav3: signTypedDatav3(wallet),
    gasPrice: gasPriceOption,
  });
};

module.exports = {
  getSignerFromPrivateKey,
  accounts,
  signTransaction,
  signPersonalMessage,
  signTypedDatav3,
  hashEIP712,
};
