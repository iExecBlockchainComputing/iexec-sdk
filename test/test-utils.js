import { exec } from 'child_process';
import { Wallet, JsonRpcProvider, ethers, Contract } from 'ethers';
import { IExec } from '../src/lib';
import { getSignerFromPrivateKey } from '../src/lib/utils';

export {
  TEE_FRAMEWORKS,
  NULL_ADDRESS,
  NULL_BYTES,
  NULL_BYTES32,
} from '../src/common/utils/constant';
export { sleep } from '../src/common/utils/utils';

export const execAsync = (cmd) =>
  new Promise((res, rej) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        rej(Error(stdout + stderr));
      }
      res(stdout + stderr);
    });
  });

const { DRONE } = process.env;

export const { INFURA_PROJECT_ID, ETHERSCAN_API_KEY, ALCHEMY_API_KEY } =
  process.env;

console.log('using env INFURA_PROJECT_ID', !!INFURA_PROJECT_ID);
console.log('using env ETHERSCAN_API_KEY', !!ETHERSCAN_API_KEY);
console.log('using env ALCHEMY_API_KEY', !!ALCHEMY_API_KEY);

export const TEST_CHAINS = {
  // autoseal chain with iExec token
  'custom-token-chain': {
    rpcURL: DRONE ? 'http://custom-token-chain:8545' : 'http://localhost:18545',
    chainId: '65535',
    hubAddress: '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca',
    enterpriseHubAddress: '0xb80C02d24791fA92fA8983f15390274698A75D23',
    ensRegistryAddress: '0xaf87b82B01E484f8859c980dE69eC8d09D30F22a',
    ensPublicResolverAddress: '0x464E9FC01C2970173B183D24B43A0FA07e6A072E',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    richWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    provider: new JsonRpcProvider(
      DRONE ? 'http://custom-token-chain:8545' : 'http://localhost:18545',
    ),
    defaults: {
      isNative: false,
      useGas: true,
    },
    isAnvil: false,
  },
  'bellecour-fork': {
    rpcURL: DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545',
    chainId: '134',
    sconeSmsURL: DRONE ? 'http://sms:13300' : 'http://localhost:13300',
    gramineSmsURL: DRONE
      ? 'http://sms-gramine:13300'
      : 'http://localhost:13309',
    iexecGatewayURL: DRONE ? 'http://market-api:3000' : 'http://localhost:3000',
    resultProxyURL: DRONE
      ? 'http://result-proxy:13200'
      : 'http://localhost:13200',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    richWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    provider: new JsonRpcProvider(
      DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545',
    ),
    defaults: {
      hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
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

let sequenceId = Date.now();
export const getId = () => {
  sequenceId += 1;
  return sequenceId;
};

export const getRandomWallet = () => {
  const { privateKey, publicKey, address } = Wallet.createRandom();
  return { privateKey, publicKey, address };
};

export const getRandomAddress = () => getRandomWallet().address;

export class InjectedProvider {
  constructor(rpcUrl, privateKey) {
    this.signer = new Wallet(privateKey, new JsonRpcProvider(rpcUrl));
  }

  async request(args) {
    const { method, params } = args;
    let rpcPromise;
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        rpcPromise = Promise.resolve([this.signer.address]);
        break;
      case 'eth_chainId':
        rpcPromise = this.signer.provider
          .getNetwork()
          .then((network) => network.chainId.toString());
        break;
      case 'personal_sign':
        rpcPromise = this.signer.signMessage(params[0]);
        break;
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        rpcPromise = (async () => {
          const typedData = JSON.parse(params[1]);
          const { EIP712Domain, ...types } = typedData.types;
          const { message, domain } = typedData;
          return this.signer.signTypedData(domain, types, message);
        })();
        break;
      case 'eth_call':
        rpcPromise = this.provider.call(params[0]);
        break;
      case 'eth_sendTransaction':
        rpcPromise = (async () => {
          const { gas, ...gasStripped } = params[0];
          const transaction = await this.signer.sendTransaction(gasStripped);
          return transaction.hash;
        })();
        break;
      default:
        rpcPromise = Promise.reject(Error('not implemented'));
        break;
    }
    return rpcPromise;
  }
}

export const setBalance = (chain) => async (address, weiAmount) => {
  if (chain.isAnvil) {
    await fetch(chain.rpcURL, {
      method: 'POST',
      body: JSON.stringify({
        method: 'anvil_setBalance',
        params: [address, ethers.toBeHex(weiAmount)],
        id: 1,
        jsonrpc: '2.0',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    const currentBalance = await chain.provider.getBalance(address);
    const delta = BigInt(`${weiAmount}`) - currentBalance;
    if (delta < 0n) {
      console.warn(
        `setBalance: aborted - current balance exceed target balance`,
      );
      return;
    }
    const tx = await chain.richWallet
      .connect(chain.provider)
      .sendTransaction({ to: address, value: delta });
    await tx.wait();
  }
};

export const setNRlcBalance = (chain) => async (address, nRlcAmount) => {
  if (chain.isNative || chain.defaults?.isNative) {
    const weiAmount = BigInt(`${nRlcAmount}`) * 10n ** 9n; // 1 nRLC is 10^9 wei
    await setBalance(chain)(address, weiAmount);
    return;
  }
  const iexec = new IExec(
    {
      ethProvider: getSignerFromPrivateKey(
        chain.rpcURL,
        chain.richWallet.privateKey,
      ),
    },
    { hubAddress: chain.hubAddress },
  );
  const { nRLC } = await iexec.wallet.checkBalances(address);
  const delta = BigInt(`${nRlcAmount}`) - BigInt(`${nRLC}`);
  if (delta < 0n) {
    console.warn(
      `setNRlcBalance: aborted - current balance exceed target balance`,
    );
    return;
  }
  await iexec.wallet.sendRLC(`${delta}`, address);
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
    Wallet.createRandom(chain.provider),
  );
  const initTx = await iexecContract.initialize(dealid, idx);
  await initTx.wait();
};
