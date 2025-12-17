import { exec } from 'child_process';
import { randomInt } from 'crypto';
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ethers,
  hexlify,
  randomBytes,
} from 'ethers';
import { abi as voucherHubAbi } from '../src/common/generated/@iexec/voucher-contracts/VoucherHub.js';
import { getEventFromLogs } from '../src/common/utils/utils.js';
import { IExec } from '../src/lib/index.js';
import { getSignerFromPrivateKey } from '../src/lib/utils.js';
import { getTestConfig } from './test-config-utils.js';

export {
  NULL_ADDRESS,
  NULL_BYTES,
  NULL_BYTES32,
  TEE_FRAMEWORKS,
} from '../src/common/utils/constant.js';

export const sleep = (ms) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });

export const execAsync = (cmd) =>
  new Promise((res, rej) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        rej(Error(stdout + stderr));
      }
      res(stdout + stderr);
    });
  });

export const { INFURA_PROJECT_ID, ETHERSCAN_API_KEY, ALCHEMY_API_KEY } =
  process.env;

console.log('using env INFURA_PROJECT_ID', !!INFURA_PROJECT_ID);
console.log('using env ETHERSCAN_API_KEY', !!ETHERSCAN_API_KEY);
console.log('using env ALCHEMY_API_KEY', !!ALCHEMY_API_KEY);

export const DEFAULT_PROVIDER_OPTIONS = {
  cloudflare: true,
  alchemy: ALCHEMY_API_KEY,
  etherscan: ETHERSCAN_API_KEY,
  infura: INFURA_PROJECT_ID,
  quorum: 1,
};

export const SERVICE_HTTP_500_URL = 'http://localhost:5500';

export const SERVICE_UNREACHABLE_URL = 'http://unreachable:80';

export const TEST_CHAINS = {
  // autoseal chain with iExec token
  'custom-token-chain': {
    rpcURL: 'http://localhost:18545',
    chainId: '65535',
    hubAddress: '0xeB196D71Bf359bfDB7Ee54429236A09DBF3966B3',
    ensRegistryAddress: '0xaf87b82B01E484f8859c980dE69eC8d09D30F22a',
    ensPublicResolverAddress: '0x464E9FC01C2970173B183D24B43A0FA07e6A072E',
    ipfsNodeURL: 'http://localhost:5001',
    ipfsGatewayURL: 'http://localhost:8080',
    pocoAdminWallet: new Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    ),
    // TODO use another wallet
    faucetWallet: new Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    ),
    provider: new JsonRpcProvider('http://localhost:18545', undefined, {
      pollingInterval: 100,
    }),
    defaults: {
      isNative: false,
      useGas: true,
    },
    isAnvil: false,
  },
  'custom-token-chain-no-ens': {
    rpcURL: 'http://localhost:18545',
    chainId: '65535',
    hubAddress: '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    compassURL: 'http://localhost:8069',
    // TODO use another wallet
    faucetWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    provider: new JsonRpcProvider('http://localhost:18545', undefined, {
      pollingInterval: 100,
    }),
    defaults: {
      isNative: false,
      useGas: true,
    },
    isAnvil: false,
  },
  'bellecour-fork': {
    rpcURL: 'http://localhost:8545',
    chainId: '134',
    sconeSmsURL: 'http://localhost:13300',
    gramineSmsURL: 'http://localhost:13309',
    iexecGatewayURL: 'http://localhost:3000',
    resultProxyURL: 'http://localhost:13200',
    ipfsNodeURL: 'http://localhost:5001',
    ipfsGatewayURL: 'http://localhost:8080',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    faucetWallet: new Wallet(
      '0xde43b282c2931fc41ca9e1486fedc2c45227a3b9b4115c89d37f6333c8816d89',
    ),
    voucherManagerWallet: new Wallet(
      '0x2c906d4022cace2b3ee6c8b596564c26c4dcadddf1e949b769bcb0ad75c40c33',
    ),
    voucherSubgraphURL:
      'http://localhost:8000/subgraphs/name/bellecour/iexec-voucher',
    debugWorkerpool: 'debug-v8-bellecour.main.pools.iexec.eth',
    debugWorkerpoolOwnerWallet: new Wallet(
      '0x800e01919eadf36f110f733decb1cc0f82e7941a748e89d7a3f76157f6654bb3',
    ),
    prodWorkerpool: 'prod-v8-bellecour.main.pools.iexec.eth',
    prodWorkerpoolOwnerWallet: new Wallet(
      '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc',
    ),
    provider: new JsonRpcProvider('http://localhost:8545', undefined, {
      pollingInterval: 100,
    }),
    defaults: {
      hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
      voucherHubAddress: '0x3137B6DF4f36D338b82260eDBB2E7bab034AFEda',
      ensRegistryAddress: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
      ensPublicResolverAddress: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
      isNative: true,
      useGas: false,
      name: 'bellecour',
    },
    isAnvil: true,
  },
};

Object.keys(TEST_CHAINS).forEach((chain) => {
  if (!TEST_CHAINS[chain].smsMap) {
    TEST_CHAINS[chain].smsMap = {
      gramine: TEST_CHAINS[chain].gramineSmsURL,
      scone: TEST_CHAINS[chain].sconeSmsURL,
    };
  }
});

export const getId = () => randomInt(0, 1000000);

export const getRandomWallet = () => {
  const { privateKey, publicKey, address } = Wallet.createRandom();
  return { privateKey, publicKey, address };
};

export const getRandomAddress = () => getRandomWallet().address;

export const getRandomBytes32 = () => hexlify(randomBytes(32));
export class InjectedProvider {
  constructor(rpcUrl, privateKey, { mockUserRejection, mockError } = {}) {
    this.provider = new JsonRpcProvider(rpcUrl, undefined, {
      pollingInterval: 100,
    }); // fast polling for tests
    this.signer = new Wallet(privateKey, this.provider);
    this.mockUserRejection = mockUserRejection;
    this.mockError = mockError;
  }

  async request(args) {
    const { method, params } = args;
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return Promise.resolve([this.signer.address]);
      case 'eth_chainId':
        return this.provider
          .getNetwork()
          .then((network) => network.chainId.toString());
      case 'eth_blockNumber':
        return this.provider.getBlockNumber();
      case 'personal_sign':
        if (this.mockError) return Promise.reject(Error('error'));
        if (this.mockUserRejection) return Promise.reject(Error('user denied'));
        return this.signer.signMessage(params[0]);
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        if (this.mockError) return Promise.reject(Error('error'));
        if (this.mockUserRejection) return Promise.reject(Error('user denied'));
        return (async () => {
          const typedData = JSON.parse(params[1]);
          const { EIP712Domain, ...types } = typedData.types;
          const { message, domain } = typedData;
          return this.signer.signTypedData(domain, types, message);
        })();
      case 'eth_call':
        return this.provider.call(params[0]);
      case 'eth_estimateGas':
        return this.provider.estimateGas(params[0]);
      case 'eth_sendTransaction':
        if (this.mockError) return Promise.reject(Error('error'));
        if (this.mockUserRejection) return Promise.reject(Error('user denied'));
        return (async () => {
          const { gas, ...gasStripped } = params[0];
          const transaction = await this.signer.sendTransaction(gasStripped);
          return transaction.hash;
        })();
      default:
        return Promise.reject(Error('not implemented'));
    }
  }
}

const faucetSendWeiToReachTargetBalance =
  (chain) =>
  async (address, targetWeiBalance, tryCount = 1) => {
    const currentBalance = await chain.provider.getBalance(address);
    const delta = BigInt(`${targetWeiBalance}`) - currentBalance;
    if (delta < 0n) {
      console.warn(
        `Faucet send Eth: aborted - current balance exceed target balance`,
      );
      return;
    }
    try {
      const tx = await chain.faucetWallet
        .connect(chain.provider)
        .sendTransaction({ to: address, value: delta });
      await tx.wait();
    } catch (e) {
      console.warn(`Faucet send Eth: error (try count ${tryCount}) - ${e}`);
      // retry as concurrent calls can lead to nonce collisions on the faucet wallet
      if (tryCount < 5) {
        await sleep(3000 * tryCount);
        await faucetSendWeiToReachTargetBalance(chain)(
          address,
          targetWeiBalance,
          tryCount + 1,
        );
      } else {
        throw new Error(
          `Failed to send Eth from faucet (tried ${tryCount} times)`,
        );
      }
    }
  };

export const setBalance = (chain) => async (address, targetWeiBalance) => {
  if (chain.isAnvil) {
    await fetch(chain.rpcURL, {
      method: 'POST',
      body: JSON.stringify({
        method: 'anvil_setBalance',
        params: [address, ethers.toBeHex(targetWeiBalance)],
        id: 1,
        jsonrpc: '2.0',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    await faucetSendWeiToReachTargetBalance(chain)(address, targetWeiBalance);
  }
};

const faucetSendNRlcToReachTargetBalance =
  (chain) =>
  async (address, nRlcTargetBalance, tryCount = 1) => {
    const iexec = new IExec(
      {
        ethProvider: getSignerFromPrivateKey(
          chain.rpcURL,
          chain.faucetWallet.privateKey,
        ),
      },
      { hubAddress: chain.hubAddress },
    );
    const { nRLC } = await iexec.wallet.checkBalances(address);
    const delta = BigInt(`${nRlcTargetBalance}`) - BigInt(`${nRLC}`);
    if (delta < 0n) {
      console.warn(
        `Faucet send RLC: aborted - current balance exceed target balance`,
      );
      return;
    }
    try {
      await iexec.wallet.sendRLC(`${delta}`, address);
    } catch (e) {
      console.warn(`Faucet send RLC: error (try count ${tryCount}) - ${e}`);
      // retry as concurrent calls can lead to nonce collisions on the faucet wallet
      if (tryCount < 5) {
        await sleep(3000 * tryCount);
        await faucetSendNRlcToReachTargetBalance(chain)(
          address,
          nRlcTargetBalance,
          tryCount + 1,
        );
      } else {
        throw new Error(
          `Failed to send RLC from faucet (tried ${tryCount} times)`,
        );
      }
    }
  };

export const setNRlcBalance = (chain) => async (address, nRlcTargetBalance) => {
  if (chain.isNative || chain.defaults?.isNative) {
    const weiAmount = BigInt(`${nRlcTargetBalance}`) * 10n ** 9n; // 1 nRLC is 10^9 wei
    await setBalance(chain)(address, weiAmount);
    return;
  }
  await faucetSendNRlcToReachTargetBalance(chain)(address, nRlcTargetBalance);
};

export const setStakedNRlcBalance =
  (chain) => async (address, nRlcTargetBalance) => {
    const sponsorWallet = Wallet.createRandom(chain.provider);
    const iexec = new IExec(
      {
        ethProvider: sponsorWallet,
      },
      { hubAddress: chain.hubAddress },
    );
    await setNRlcBalance(chain)(
      sponsorWallet.address,
      BigInt(nRlcTargetBalance),
    );
    const contractClient = await iexec.config.resolveContractsClient();
    const iexecContract = contractClient.getIExecContract();
    const tx = await iexecContract.depositFor(address, {
      value: BigInt(nRlcTargetBalance) * 10n ** 9n,
      gasPrice: 0, // TODO: wont work on non gasless chain
    });
    await tx.wait();
  };

export const initializeTask = (chain) => async (dealid, idx) => {
  const iexecContract = new Contract(
    chain.hubAddress || chain.defaults.hubAddress,
    [
      {
        constant: false,
        inputs: [
          {
            name: '_dealid',
            type: 'bytes32',
          },
          {
            name: 'idx',
            type: 'uint256',
          },
        ],
        name: 'initialize',
        outputs: [
          {
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    Wallet.createRandom(chain.provider), // random to avoid nonce collisions
  );
  const initTx = await iexecContract.initialize(dealid, idx);
  await initTx.wait();
};

export const adminCreateCategory =
  (chain) =>
  async (category, tryCount = 1) => {
    const iexec = new IExec(
      {
        ethProvider: getSignerFromPrivateKey(
          chain.rpcURL,
          chain.pocoAdminWallet.privateKey,
        ),
      },
      { hubAddress: chain.hubAddress },
    );
    let res;
    try {
      res = await iexec.hub.createCategory(category);
    } catch (e) {
      console.warn(
        `Admin create category: error (try count ${tryCount}) - ${e}`,
      );
      // retry as concurrent calls can lead to nonce collisions on the faucet wallet
      if (tryCount < 5) {
        await sleep(3000 * tryCount);
        res = await adminCreateCategory(chain)(category, tryCount + 1);
      } else {
        throw new Error(
          `Failed to create category with admin wallet (tried ${tryCount} times)`,
        );
      }
    }
    return res;
  };

export const createVoucherType =
  (chain) =>
  async ({ description = 'test', duration = 1000 } = {}) => {
    const voucherHubAddress =
      chain.voucherHubAddress || chain.defaults.voucherHubAddress;

    const voucherHubContract = new Contract(
      voucherHubAddress,
      voucherHubAbi,
      chain.provider,
    );
    const signer = chain.voucherManagerWallet.connect(chain.provider);

    const retryableCreateVoucherType = async (tryCount = 1) => {
      let id;
      try {
        const createVoucherTypeTxHash = await voucherHubContract
          .connect(signer)
          .createVoucherType(description, duration);
        const txReceipt = await createVoucherTypeTxHash.wait();
        id = getEventFromLogs('VoucherTypeCreated', txReceipt.logs, {
          strict: true,
        }).args.id;
      } catch (error) {
        console.warn(
          `Error creating voucher type (try count ${tryCount}):`,
          error,
        );
        if (tryCount < 5) {
          await sleep(3000 * tryCount);
          id = await retryableCreateVoucherType(tryCount + 1);
        } else {
          throw new Error(
            `Failed to create voucher after ${tryCount} attempts`,
          );
        }
      }
      return id;
    };
    return retryableCreateVoucherType(); // return voucherType id (bigint)
  };

// TODO: update createWorkerpoolorder() parameters when it is specified
export const createAndPublishWorkerpoolOrder =
  (chain) =>
  async ({
    workerpool,
    workerpoolOwnerWallet,
    requesterrestrict,
    volume = 1000,
    price = 1000,
  }) => {
    const { iexec } = getTestConfig(chain)({
      privateKey: workerpoolOwnerWallet.privateKey,
    });

    await setStakedNRlcBalance(chain)(
      workerpoolOwnerWallet.address,
      volume * price,
    );

    const workerpoolorder = await iexec.order.createWorkerpoolorder({
      workerpool,
      category: 0,
      requesterrestrict,
      volume,
      workerpoolprice: price,
      tag: ['tee', 'scone'],
    });

    await iexec.order
      .signWorkerpoolorder(workerpoolorder)
      .then((o) => iexec.order.publishWorkerpoolorder(o));
  };

export const createVoucher =
  (chain) =>
  async ({ owner, voucherType, value }) => {
    const voucherHubAddress =
      chain.voucherHubAddress || chain.defaults.voucherHubAddress;
    // deposit voucher value on VoucherHub with a random wallet
    await setStakedNRlcBalance(chain)(voucherHubAddress, value);

    const voucherHubContract = new Contract(
      voucherHubAddress,
      voucherHubAbi,
      chain.provider,
    );

    const signer = chain.voucherManagerWallet.connect(chain.provider);

    const retryableCreateVoucher = async (tryCount = 1) => {
      try {
        const createVoucherTx = await voucherHubContract
          .connect(signer)
          .createVoucher(owner, voucherType, value);
        await createVoucherTx.wait();
      } catch (error) {
        console.warn(`Error creating voucher (try count ${tryCount}):`, error);
        if (tryCount < 5) {
          await sleep(3000 * tryCount);
          await retryableCreateVoucher(tryCount + 1);
        } else {
          throw new Error(
            `Failed to create voucher after ${tryCount} attempts`,
          );
        }
      }
    };
    await retryableCreateVoucher();

    try {
      await createAndPublishWorkerpoolOrder(chain)({
        workerpool: chain.debugWorkerpool,
        workerpoolOwnerWallet: chain.debugWorkerpoolOwnerWallet,
        requesterrestrict: owner,
      });
      await createAndPublishWorkerpoolOrder(chain)({
        workerpool: chain.prodWorkerpool,
        workerpoolOwnerWallet: chain.prodWorkerpoolOwnerWallet,
        requesterrestrict: owner,
      });
    } catch (error) {
      console.error('Error publishing workerpoolorder:', error);
      throw error;
    }

    try {
      return await voucherHubContract.getVoucher(owner);
    } catch (error) {
      console.error('Error getting voucher:', error);
      throw error;
    }
  };

export const addVoucherEligibleAsset =
  (chain) => async (assetAddress, voucherTypeId) => {
    const voucherHubAddress =
      chain.voucherHubAddress || chain.defaults.voucherHubAddress;

    const voucherHubContract = new Contract(voucherHubAddress, voucherHubAbi);

    const signer = chain.voucherManagerWallet.connect(chain.provider);

    const retryableAddEligibleAsset = async (tryCount = 1) => {
      try {
        const tx = await voucherHubContract
          .connect(signer)
          .addEligibleAsset(voucherTypeId, assetAddress);
        await tx.wait();
      } catch (error) {
        console.warn(
          `Error adding eligible asset to voucher (try count ${tryCount}):`,
          error,
        );
        if (tryCount < 5) {
          await sleep(3000 * tryCount);
          await retryableAddEligibleAsset(tryCount + 1);
        } else {
          throw new Error(
            `Failed to add eligible asset to voucher after ${tryCount} attempts`,
          );
        }
      }
    };
    await retryableAddEligibleAsset();
  };
