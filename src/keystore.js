const Debug = require('debug');
const uuidv4 = require('uuid/v4');
const ethjsUtil = require('ethjs-util');
const ethjsSigner = require('ethjs-signer');
const { generate, privateToAccount } = require('ethjs-account');
const EC = require('elliptic').ec;
const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');
const { saveJSONToFile, loadJSONAndRetry } = require('./fs');
const { prompt } = require('./cli-helper');

const debug = Debug('iexec:keystore');
const secp256k1 = new EC('secp256k1');

const WALLET_FILE_NAME = 'wallet.json';
const OVERWRITE_CONFIRMATION = `${WALLET_FILE_NAME} already exists, replace it with new wallet?`;

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

const save = (userWallet, { force = false } = {}) =>
  saveJSONToFile(WALLET_FILE_NAME, userWallet, {
    force,
    message: OVERWRITE_CONFIRMATION,
  });

const createAndSave = async (options) => {
  const userWallet = generate(uuidv4());
  const fileName = await save(userWallet, options);
  return { wallet: userWallet, fileName };
};

const load = async ({ prefix = true, retry = true } = {}) => {
  const cb = retry
    ? async () => {
      await prompt.create(WALLET_FILE_NAME);
      await createAndSave();
      return load({ prefix, retry: false });
    }
    : undefined;

  const { privateKey } = await loadJSONAndRetry(WALLET_FILE_NAME, cb);

  const derivedUserWallet = walletFromPrivKey(privateKey, {
    prefix,
  });
  return derivedUserWallet;
};

const loadPrivateKey = async (options) => {
  const { privateKey } = await load(options);
  return privateKey;
};

const loadPublicKey = async (options) => {
  const { publicKey } = await load(options);
  return publicKey;
};

const loadAddress = async (options) => {
  const { address } = await load(options);
  return address;
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
    const { privateKey } = await load();
    const messageBuffer = Buffer.from(ethjsUtil.stripHexPrefix(message), 'hex');
    const msgSig = ethUtil.ecsign(messageBuffer, privateKey);
    const signedMessage = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s));
    return signedMessage;
  } catch (error) {
    debug('signMessage()', error);
    throw error;
  }
};

const signPersonalMessage = async (msgHex) => {
  try {
    const { privateKey } = await load({ prefix: false });
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    const signedPersonalMess = sigUtil.personalSign(privKeyBuffer, {
      data: msgHex,
    });
    return signedPersonalMess;
  } catch (error) {
    debug('signPersonalMessage()', error);
    throw error;
  }
};

const signTypedData = async (withAccount, typedData) => {
  try {
    const { privateKey } = await load();
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    const signedTypedData = sigUtil.signTypedData(privKeyBuffer, {
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
    const messageBuffer = Buffer.from(message, 'hex');
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
  loadPrivateKey,
  loadPublicKey,
  loadAddress,
  accounts,
  signTransaction,
  signMessage,
  signPersonalMessage,
  signTypedData,
  sign,
};
