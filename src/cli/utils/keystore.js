import Debug from 'debug';
import os from 'os';
import path from 'path';
import fsExtra from 'fs-extra';
import { SigningKey, Wallet } from 'ethers';
import { checksummedAddress } from '../../common/utils/utils.js';
import { NULL_ADDRESS } from '../../common/utils/constant.js';
import {
  saveWalletConf,
  loadWalletConf,
  saveEncryptedWalletConf,
  loadEncryptedWalletConf,
} from './fs.js';
import { prompt, option, computeWalletLoadOptions } from './cli-helper.js';

const debug = Debug('iexec:keystore');

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

const walletFromPrivKey = (privateKey) => {
  const signerWallet = new Wallet(privateKey);
  const wallet = {
    privateKey: signerWallet.privateKey,
    publicKey: SigningKey.computePublicKey(signerWallet.privateKey, false),
    address: signerWallet.address,
  };
  return { wallet, signerWallet };
};

const decrypt = async (encryptedJSON, password) => {
  try {
    const { privateKey } = await Wallet.fromEncryptedJson(
      JSON.stringify(encryptedJSON),
      password,
    );
    const { wallet } = walletFromPrivKey(privateKey);
    return wallet;
  } catch (error) {
    debug('decrypt()', error);
    if (error.shortMessage) {
      throw Error(error.shortMessage)
    }
    throw Error('Failed to decrypt wallet');
  }
};

const encrypt = async (privateKey, password) => {
  try {
    const wallet = new Wallet(privateKey);
    const encryptedJSON = await wallet.encrypt(password);
    return await JSON.parse(encryptedJSON);
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

    const fileName = await saveEncryptedWalletConf(encryptedWallet, {
      ...options,
      walletName,
      fileDir,
    });
    return { wallet: encryptedWallet, fileName, address: userWallet.address };
  }
  // decrypted
  const fileName = await saveWalletConf(userWallet, options);
  return { wallet: userWallet, fileName, address: userWallet.address };
};

export const importPrivateKeyAndSave = async (privateKey, options) => {
  const { wallet } = walletFromPrivKey(privateKey);
  return saveWallet(wallet, options);
};

export const createAndSave = async (options) =>
  importPrivateKeyAndSave(Wallet.createRandom().privateKey, options);

export const Keystore = ({
  walletOptions = computeWalletLoadOptions().walletOptions,
  isSigner = true,
} = {}) => {
  let cachedWallet = {};
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
      files = await fsExtra.readdir(fileDir);
      debug('files', files);
    } catch (error) {
      debug('getMostRecentWalletFileName()', error);
      throw error;
    }
    const sortedWallet = files
      .filter((e) => e.split('--')[2])
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
        files = await fsExtra.readdir(fileDir);
      } catch (error) {
        debug('getWalletFileName()', error);
        throw Error(
          `Missing keystore directory ${fileDir}, did you forget to run "iexec wallet create" ?`,
        );
      }
      const match = files
        .filter((e) => {
          const address = e.split('--')[2];
          return (
            address &&
            ('0x'.concat(address).toLowerCase() ===
              walletOptions.walletAddress.toLowerCase() ||
              address.toLowerCase() ===
                walletOptions.walletAddress.toLowerCase())
          );
        })
        .sort(descSortWallet)[0];
      if (match) {
        return match;
      }
      throw Error(
        `No wallet file matching address ${walletOptions.walletAddress} found in ${fileDir}`,
      );
    }
    const existsUnencrypted = await fsExtra.existsSync(
      path.join(process.cwd(), 'wallet.json'),
    );
    if (existsUnencrypted) return null;
    return getMostRecentWalletFileName();
  };

  // load wallet from FS
  const load = async () => {
    if (cachedWallet && cachedWallet.wallet) return cachedWallet.wallet;
    const fileName = await getWalletFileName();
    // try local unencrypted
    let pk;
    if (!fileName) {
      try {
        const loadingOptions = {
          fileName: WALLET_FILE_NAME,
        };
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
        const loadingOptions = { fileName, fileDir };
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
    cachedWallet = walletFromPrivKey(pk);
    return cachedWallet.wallet;
  };

  const loadWalletAddress = async () => {
    const fileName = await getWalletFileName();
    let walletAddress;
    // try local unencrypted
    if (!fileName) {
      try {
        const loadingOptions = {
          fileName: WALLET_FILE_NAME,
        };
        const { address } = await loadWalletConf(loadingOptions);
        walletAddress = checksummedAddress(address);
      } catch (error) {
        debug('try loadWalletAddress unencrypted', error);
      }
    }
    // try encrypted
    if (!walletAddress) {
      try {
        const loadingOptions = { fileName, fileDir };
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
      if (isSigner) {
        try {
          const wallet = await load();
          walletAddress = wallet.address;
        } catch (error) {
          debug('account() load signer wallet', error);
          throw error;
        }
      } else {
        walletAddress = await loadWalletAddress().catch((e) => {
          debug(`accounts() unable to find existing wallet: ${e.message}`);
          return NULL_ADDRESS;
        });
      }
      debug('walletAddress', walletAddress);
      return [walletAddress];
    } catch (error) {
      debug('accounts()', error);
      throw error;
    }
  };

  return {
    load,
    accounts,
  };
};
