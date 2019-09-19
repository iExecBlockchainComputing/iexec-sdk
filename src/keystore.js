const Debug = require('debug');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const uuidv4 = require('uuid/v4');
const { stripHexPrefix } = require('ethjs-util');
const ethjsSigner = require('ethjs-signer');
const { generate, privateToAccount } = require('ethjs-account');
const EC = require('elliptic').ec;
const { Wallet } = require('ethers');
const {
  saveWalletConf,
  loadWalletConf,
  saveEncryptedWalletConf,
  loadEncryptedWalletConf,
} = require('./fs');
const { prompt, option, computeWalletLoadOptions } = require('./cli-helper');
const sigUtils = require('./sig-utils');
const { checksummedAddress, NULL_ADDRESS } = require('./utils');

const debug = Debug('iexec:keystore');
const secp256k1 = new EC('secp256k1');

const WALLET_FILE_NAME = 'wallet.json';
const osDefaultPathMap = {
  linux: {
    keystoredir: '.ethereum/keystore',
    datadir: '.config/iexec',
  },
  darwin: {
    keystoredir: 'Library/Ethereum/keystore',
    datadir: 'Library/iexec',
  },
  win32: {
    keystoredir: 'AppData/Roaming/Ethereum/keystore',
    datadir: 'AppData/Roaming/iexec',
  },
  fallback: {
    keystoredir: '',
    datadir: '',
  },
};

const walletFromPrivKey = (
  privateKey,
  { prefix = true, lowercase = false } = {},
) => {
  const userWallet = privateToAccount(privateKey);
  const walletKeys = Object.keys(userWallet);
  if (!prefix) {
    walletKeys.forEach((e) => {
      userWallet[e] = stripHexPrefix(userWallet[e]);
    });
  }
  if (lowercase) {
    walletKeys.forEach((e) => {
      userWallet[e] = userWallet[e].toLowerCase();
    });
  }
  return userWallet;
};

const decrypt = async (encryptedJSON, password) => {
  try {
    const { privateKey } = await Wallet.fromEncryptedJson(
      JSON.stringify(encryptedJSON),
      password,
    );
    const wallet = walletFromPrivKey(privateKey);
    return wallet;
  } catch (error) {
    debug('decrypt()', error);
    throw error;
  }
};

const encrypt = async (privateKey, password) => {
  try {
    const wallet = new Wallet(privateKey);
    const encryptedJSON = await wallet.encrypt(password);
    const encrypted = await JSON.parse(encryptedJSON);
    return encrypted;
  } catch (error) {
    debug('encryptAndSave()', error);
    throw error;
  }
};

const saveWallet = async (userWallet, options) => {
  // keystoredir
  let fileDir;
  if (options.walletOptions && options.walletOptions.global) {
    const keystoredir = osDefaultPathMap[os.platform()]
      ? osDefaultPathMap[os.platform()].keystoredir
      : osDefaultPathMap.fallback.keystoredir;
    fileDir = path.join(os.homedir(), keystoredir);
  } else if (options.walletOptions && options.walletOptions.path) {
    fileDir = path.join(options.walletOptions.path);
  }

  // encryted
  if (options.walletOptions && options.walletOptions.password) {
    const encryptedWallet = await encrypt(
      userWallet.privateKey,
      options.walletOptions.password,
    );
    // Wallet name
    const now = new Date();
    const pad = (number) => {
      if (number < 10) {
        return `0${number}`;
      }
      return number;
    };
    const creationDate = `${now.getUTCFullYear()}-${pad(
      now.getUTCMonth() + 1,
    )}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}-${pad(
      now.getUTCMinutes(),
    )}-${pad(now.getUTCSeconds())}.${(now.getUTCMilliseconds() / 1000)
      .toFixed(3)
      .slice(2, 5)}000000Z`;
    const walletName = `UTC--${creationDate}--${userWallet.address.slice(2)}`;

    const fileName = await saveEncryptedWalletConf(
      encryptedWallet,
      Object.assign({}, options, { walletName }, { fileDir }),
    );
    return { wallet: encryptedWallet, fileName, address: userWallet.address };
  }
  // decrypted
  const fileName = await saveWalletConf(userWallet, options);
  return { wallet: userWallet, fileName, address: userWallet.address };
};

const createAndSave = async (options) => {
  const userWallet = generate(uuidv4());
  return saveWallet(userWallet, options);
};

const importPrivateKeyAndSave = async (privateKey, options) => {
  const userWallet = walletFromPrivKey(privateKey);
  return saveWallet(userWallet, options);
};

const Keystore = ({
  walletOptions = computeWalletLoadOptions().walletOptions,
  isSigner = true,
} = {}) => {
  const cachedWallet = {};
  let password = (walletOptions && walletOptions.password) || false;
  // keystoreDir
  let fileDir;
  if (walletOptions && walletOptions.global) {
    const keystoredir = osDefaultPathMap[os.platform()]
      ? osDefaultPathMap[os.platform()].keystoredir
      : osDefaultPathMap.fallback.keystoredir;
    fileDir = path.join(os.homedir(), keystoredir);
  } else if (walletOptions && walletOptions.path) {
    fileDir = path.join(walletOptions.path);
  } else {
    fileDir = process.cwd();
  }

  const descSortWallet = (a, b) => {
    const aDate = a.split('--')[1];
    const bDate = b.split('--')[1];
    if (aDate < bDate) return 1;
    if (aDate > bDate) return -1;
    return 0;
  };

  const getMostRecentWalletFileName = async () => {
    let files;
    try {
      files = await fs.readdir(fileDir);
      debug('files', files);
    } catch (error) {
      debug('getMostRecentWalletFileName()', error);
      throw error;
    }
    const sortedWallet = files
      .filter(e => e.split('--')[2])
      .sort(descSortWallet);
    return sortedWallet[0] || null;
  };

  const getWalletFileName = async () => {
    if (walletOptions && walletOptions.walletFileName) {
      return walletOptions.walletFileName;
    }
    if (walletOptions && walletOptions.walletAddress) {
      let files;
      try {
        files = await fs.readdir(fileDir);
      } catch (error) {
        debug('getWalletFileName()', error);
        throw Error(
          `Missing keystore directory ${fileDir}, did you forget to run 'iexec wallet create' ?`,
        );
      }
      const match = files
        .filter((e) => {
          const address = e.split('--')[2];
          return (
            address
            && ('0x'.concat(address).toLowerCase()
              === walletOptions.walletAddress.toLowerCase()
              || address.toLowerCase()
                === walletOptions.walletAddress.toLowerCase())
          );
        })
        .sort(descSortWallet)[0];
      if (match) {
        return match;
      }
      throw Error(
        `No wallet file matching address ${
          walletOptions.walletAddress
        } found in ${fileDir}`,
      );
    }
    const existsUnencrypted = await fs.existsSync(
      path.join(process.cwd(), 'wallet.json'),
    );
    if (existsUnencrypted) return null;
    return getMostRecentWalletFileName();
  };

  // load wallet from FS
  const load = async ({ prefix = true } = {}) => {
    if (prefix && cachedWallet && cachedWallet.prefixed) return cachedWallet.prefixed;
    if (!prefix && cachedWallet && cachedWallet.noPrefixed) return cachedWallet.noPrefixed;

    const fileName = await getWalletFileName();
    // try local unencrypted
    let pk;
    if (!fileName) {
      try {
        const loadingOptions = Object.assign(
          {},
          { fileName: WALLET_FILE_NAME },
        );
        const { privateKey } = await loadWalletConf(loadingOptions);
        pk = privateKey;
      } catch (error) {
        debug('try load unencrypted', error);
        throw Error(
          `Missing option ${option.walletAddress()[0]} or ${
            option.walletFileName()[0]
          } and no wallet.json found in working directory`,
        );
      }
    }
    // try encrypted
    if (!pk) {
      try {
        const loadingOptions = Object.assign({}, { fileName }, { fileDir });
        const encryptedWallet = await loadEncryptedWalletConf(loadingOptions);
        if (!password) {
          password = await prompt.password(
            `Using wallet ${fileName}\nPlease enter your password to unlock your wallet`,
          );
        }
        const wallet = await decrypt(encryptedWallet, password);
        pk = wallet.privateKey;
      } catch (error) {
        debug('try load encrypted', error);
        throw error;
      }
    }

    const derivedUserWallet = walletFromPrivKey(pk, {
      prefix,
    });

    if (prefix) cachedWallet.prefixed = derivedUserWallet;
    else cachedWallet.noPrefixed = derivedUserWallet;

    return derivedUserWallet;
  };

  const loadWalletAddress = async () => {
    const fileName = await getWalletFileName();
    let walletAddress;
    // try local unencrypted
    if (!fileName) {
      try {
        const loadingOptions = Object.assign(
          {},
          { fileName: WALLET_FILE_NAME },
        );
        const { address } = await loadWalletConf(loadingOptions);
        walletAddress = checksummedAddress(address);
      } catch (error) {
        debug('try loadWalletAddress unencrypted', error);
      }
    }
    // try encrypted
    if (!walletAddress) {
      try {
        const loadingOptions = Object.assign({}, { fileName }, { fileDir });
        const { address } = await loadEncryptedWalletConf(loadingOptions);
        walletAddress = checksummedAddress(address);
      } catch (error) {
        debug('try loadWalletAddress encrypted', error);
      }
    }
    return walletAddress;
  };

  const accounts = async () => {
    try {
      debug('accounts');
      let walletAddress;
      try {
        if (isSigner) walletAddress = (await load()).address;
        else walletAddress = await loadWalletAddress();
      } catch (error) {
        debug('accounts() loading wallet', error);
        if (isSigner) throw error;
      }
      if (!walletAddress) walletAddress = NULL_ADDRESS;
      debug('walletAddress', walletAddress);
      return [walletAddress];
    } catch (error) {
      debug('accounts()', error);
      throw error;
    }
  };

  const signTransaction = async (rawTx) => {
    try {
      debug('signTransaction');
      const { privateKey } = await load();
      const signedTx = ethjsSigner.sign(rawTx, privateKey);
      return signedTx;
    } catch (error) {
      debug('signTransaction()', error);
      throw error;
    }
  };

  const signMessage = async (address, message) => {
    try {
      debug('signMessage', message);
      throw Error('eth_sign not implemented');
    } catch (error) {
      debug('signMessage()', error);
      throw error;
    }
  };

  const signPersonalMessage = async (address, message) => {
    try {
      debug('signPersonalMessage', message);
      const { privateKey } = await load();
      const wallet = new Wallet(privateKey);
      const sign = wallet.signMessage(message);
      return sign;
    } catch (error) {
      debug('signPersonalMessage()', error);
      throw error;
    }
  };

  const signTypedData = async (address, typedData) => {
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

  const signTypedDatav3 = async (address, typedData) => {
    try {
      const { privateKey } = await load({ prefix: false });
      const signedTypedData = sigUtils.signTypedDatav3(privateKey, typedData);
      return signedTypedData;
    } catch (error) {
      debug('signTypedDatav3()', error);
      throw error;
    }
  };

  const sign = async (message, noncefn, data) => {
    try {
      debug('sign');
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

  return {
    load,
    accounts,
    signTransaction,
    signMessage,
    signPersonalMessage,
    signTypedData,
    sign,
    signTypedDatav3,
  };
};

module.exports = {
  Keystore,
  walletFromPrivKey,
  importPrivateKeyAndSave,
  createAndSave,
};
