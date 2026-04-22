import { randomInt } from 'crypto';
import { exec } from 'child_process';
import {
  Wallet,
  JsonRpcProvider,
  Contract,
  hexlify,
  randomBytes,
  keccak256,
  AbiCoder,
  toBeHex,
} from 'ethers';
import { IExec } from '../src/lib/index.js';
import { getSignerFromPrivateKey } from '../src/lib/utils.js';

export {
  TEE_FRAMEWORKS,
  NULL_ADDRESS,
  NULL_BYTES,
  NULL_BYTES32,
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

export const SERVICE_HTTP_500_URL = 'http://localhost:5500';

export const SERVICE_UNREACHABLE_URL = 'http://unreachable:80';

export const TEST_CHAINS = {
  'arbitrum-sepolia-fork': {
    rpcURL: 'http://localhost:8545',
    chainId: '421614',
    smsURL: 'http://localhost:13350',
    iexecGatewayURL: 'http://localhost:3050',
    ipfsNodeURL: 'http://localhost:5001',
    ipfsGatewayURL: 'http://localhost:8080',
    compassURL: 'http://localhost:8069',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    provider: new JsonRpcProvider('http://localhost:8545', undefined, {
      pollingInterval: 100,
    }),
    defaults: {
      hubAddress: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
      name: 'arbitrum-sepolia',
    },
    defaultInitBalance: 1n * 10n ** 18n, // 1 ETH for gas
  },
  'unknown-chain': {
    rpcURL: 'http://localhost:8565',
    chainId: '421615',
    hubAddress: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
    name: 'unknown-chain',
    provider: new JsonRpcProvider('http://localhost:8565', undefined, {
      pollingInterval: 100,
    }),
    defaultInitBalance: 1n * 10n ** 18n, // 1 ETH for gas
  },
};

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

const anvilSetBalance = (chain) => async (address, targetWeiBalance) => {
  await fetch(chain.rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setBalance',
      params: [address, toBeHex(targetWeiBalance)],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const anvilSetNRlcTokenBalance =
  (chain) => async (address, targetNRlcBalance) => {
    const rlcAddress = await new Contract(
      chain.hubAddress ?? chain.defaults.hubAddress,
      [
        {
          inputs: [],
          name: 'token',
          outputs: [{ internalType: 'address', name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      chain.provider,
    ).token();

    /** [rlc-multichain](https://github.com/iExecBlockchainComputing/rlc-multichain/tree/v0.1.0) is an openzeppelin ERC20Upgradeable contract
     *
     * ERC20Upgradeable contract use a specific storage slot, which is:
     * ```
     * // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ERC20")) - 1)) & ~bytes32(uint256(0xff))
     * bytes32 private constant ERC20StorageLocation = 0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00;
     * ```
     * sources: https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/v5.3.0/contracts/token/ERC20/ERC20Upgradeable.sol#L43-L44
     */
    const erc20StorageLocation =
      '0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace00';

    const balanceSlot = keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256'],
        [address, erc20StorageLocation],
      ),
    );

    await fetch(chain.rpcURL, {
      method: 'POST',
      body: JSON.stringify({
        method: 'anvil_setStorageAt',
        params: [
          rlcAddress,
          balanceSlot,
          toBeHex(BigInt(targetNRlcBalance), 32),
        ],
        id: 1,
        jsonrpc: '2.0',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

export const setBalance = (chain) => async (address, targetWeiBalance) => {
  await anvilSetBalance(chain)(address, targetWeiBalance);
};

export const setNRlcBalance = (chain) => async (address, nRlcTargetBalance) => {
  await anvilSetNRlcTokenBalance(chain)(address, nRlcTargetBalance);
};

export const initializeTask = (chain) => async (dealid, idx) => {
  const wallet = Wallet.createRandom(chain.provider);
  await setBalance(chain)(wallet.address, 1n * 10n ** 18n); // fund wallet to pay for initialization
  const iexecContract = new Contract(
    chain.hubAddress ?? chain.defaults.hubAddress,
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
    wallet,
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
      { hubAddress: chain.hubAddress ?? chain.defaults.hubAddress },
    );
    let res;
    try {
      res = await iexec.hub.createCategory(category);
    } catch (e) {
      console.warn(
        `Admin create category: error (try count ${tryCount}) - ${e}`,
      );
      // retry as concurrent calls can lead to nonce collisions on the admin wallet
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
