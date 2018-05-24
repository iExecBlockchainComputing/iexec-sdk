const Debug = require('debug');
const uuidv4 = require('uuid/v4');
const ethjsUtil = require('ethjs-util');
const ethjsSigner = require('ethjs-signer');
const { generate, privateToAccount } = require('ethjs-account');
const EC = require('elliptic').ec;
const { saveWalletConf, loadWalletConf } = require('./fs');
const { prompt } = require('./cli-helper');
const sigUtils = require('./sig-utils');

const debug = Debug('iexec:keystore');
const secp256k1 = new EC('secp256k1');
const WALLET_FILE_NAME = 'wallet.json';

const walletFromPrivKey = (
  privateKey,
  { prefix = true, lowercase = false } = {},
) => {
  const userWallet = privateToAccount(privateKey);

  const walletKeys = Object.keys(userWallet);
  if (!prefix) {
    walletKeys.forEach((e) => {
      userWallet[e] = ethjsUtil.stripHexPrefix(userWallet[e]);
    });
  }
  if (lowercase) {
    walletKeys.forEach((e) => {
      userWallet[e] = userWallet[e].toLowerCase();
    });
  }
  return userWallet;
};

const save = saveWalletConf;

const createAndSave = async (options) => {
  const userWallet = generate(uuidv4());
  const fileName = await save(userWallet, options);
  return { wallet: userWallet, fileName };
};

const load = async ({
  prefix = true,
  create = true,
  lowercase = true,
} = {}) => {
  const cb = create
    ? async () => {
      await prompt.create(WALLET_FILE_NAME);
      await createAndSave();
      return load({ prefix, retry: false, lowercase });
    }
    : undefined;

  const { privateKey } = await loadWalletConf({
    retry: cb,
  });

  const derivedUserWallet = walletFromPrivKey(privateKey, {
    prefix,
    lowercase,
  });
  return derivedUserWallet;
};

const accounts = async () => {
  try {
    const userWallet = await load();

    return userWallet.address;
  } catch (error) {
    debug('accounts()', error);
    throw error;
  }
};

const signTransaction = async (rawTx) => {
  try {
    const { privateKey } = await load();

    const signedTx = ethjsSigner.sign(rawTx, privateKey);

    return signedTx;
  } catch (error) {
    debug('signTransaction()', error);
    throw error;
  }
};

const signMessage = async (message) => {
  try {
    debug('message', message);
    // const { privateKey } = await load();
    // const messageBuffer = Buffer.from(ethjsUtil.stripHexPrefix(message), 'hex');
    // const msgSig = ethUtil.ecsign(messageBuffer, privateKey);
    // const signedMessage = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s));
    // return signedMessage;
    throw Error('eth_sign not implemented');
  } catch (error) {
    debug('signMessage()', error);
    throw error;
  }
};

const signPersonalMessage = async (msgHex) => {
  try {
    debug('msgHex', msgHex);
    throw Error('personal_sign not implemented');
    // const { privateKey } = await load({ prefix: false });
    // const privKeyBuffer = Buffer.from(privateKey, 'hex');
    // const signedPersonalMess = sigUtil.personalSign(privKeyBuffer, {
    //   data: msgHex,
    // });
    // return signedPersonalMess;
  } catch (error) {
    debug('signPersonalMessage()', error);
    throw error;
  }
};

const signTypedData = async (typedData) => {
  try {
    const { privateKey } = await load({ prefix: false });
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    const signedTypedData = sigUtils.signTypedData(privKeyBuffer, {
      data: typedData,
    });
    return signedTypedData;
  } catch (error) {
    debug('signTypedData()', error);
    throw error;
  }
};

const sign = async (message, noncefn, data) => {
  try {
    const { privateKey } = await load({ prefix: false });
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    const messageBuffer = Buffer.from(message);
    const result = secp256k1.sign(messageBuffer, privKeyBuffer, {
      canonical: true,
      k: noncefn,
      pers: data,
    });
    return {
      signature: Buffer.concat([
        result.r.toArrayLike(Buffer, 'be', 32),
        result.s.toArrayLike(Buffer, 'be', 32),
      ]),
      recovery: result.recoveryParam,
    };
  } catch (error) {
    debug('sign()', error);
    throw error;
  }
};

module.exports = {
  walletFromPrivKey,
  save,
  createAndSave,
  load,
  accounts,
  signTransaction,
  signMessage,
  signPersonalMessage,
  signTypedData,
  sign,
};
