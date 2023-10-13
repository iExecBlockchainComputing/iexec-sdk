import { exec } from 'child_process';
import { Wallet, JsonRpcProvider } from 'ethers';

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

export const TEST_CHAINS = {
  // // template
  // 'chainName': {
  //   rpcURL: 'http://___',
  //   chainId: '1',
  //   sconeSmsURL: 'http://___',
  //   gramineSmsURL: 'http://___',
  //   marketURL: 'http://___',
  //   resultProxyURL: 'http://___',
  //   hubAddress: '0x___',
  //   enterpriseHubAddress: '0x___',
  //   ensRegistryAddress: '0x___',
  //   ensPublicResolverAddress: '0x___',
  //   richWallet: '0x___',
  // },

  // autoseal chain with iExec token
  token: {
    rpcURL: DRONE ? 'http://token-chain:8545' : 'http://localhost:8545',
    chainId: '65535',
    sconeSmsURL: DRONE
      ? 'http://token-sms-scone:13300'
      : 'http://localhost:13301',
    gramineSmsURL: DRONE
      ? 'http://token-sms-gramine:13300'
      : 'http://localhost:13302',
    marketURL: undefined, // no market connected
    resultProxyURL: DRONE
      ? 'http://token-result-proxy:13200'
      : 'http://localhost:13200',
    hubAddress: '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca',
    enterpriseHubAddress: '0xb80C02d24791fA92fA8983f15390274698A75D23',
    ensRegistryAddress: '0xaf87b82B01E484f8859c980dE69eC8d09D30F22a',
    ensPublicResolverAddress: '0x464E9FC01C2970173B183D24B43A0FA07e6A072E',
    richWallet:
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
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
