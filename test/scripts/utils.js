import {
  Wallet,
  Contract,
  JsonRpcSigner,
  JsonRpcProvider,
  ContractFactory,
  formatEther,
  toBeHex,
} from 'ethers';
import { promises as fsPromises } from 'fs';
import path from 'path';

const { DRONE } = process.env;

const IEXEC_HUB_ADDRESS = '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f';
export const TARGET_POCO_ADMIN_WALLET =
  '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
export const TARGET_FAUCET_WALLET =
  '0xdFa2585C16cAf9c853086F36d2A37e9b8d1eab87';

export const rpcURL = DRONE
  ? 'http://bellecour-fork:8545'
  : 'http://127.0.0.1:8545';

export const provider = new JsonRpcProvider(rpcURL);

export const setBalance = async (address, weiAmount) => {
  fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setBalance',
      params: [address, toBeHex(weiAmount)],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const balance = await provider.getBalance(address);
  console.log(`${address} wallet balance is now ${formatEther(balance)} RLC`);
};

const impersonate = async (address) => {
  await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_impersonateAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(`impersonating ${address}`);
};

const stopImpersonate = async (address) => {
  await fetch(rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_stopImpersonatingAccount',
      params: [address],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(`stop impersonating ${address}`);
};

export const getIExecHubOwnership = async (targetOwner) => {
  const iexecContract = new Contract(
    IEXEC_HUB_ADDRESS,
    [
      {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
        constant: true,
      },
      {
        inputs: [
          { internalType: 'address', name: 'newOwner', type: 'address' },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    provider,
  );
  const iexecOwner = await iexecContract.owner();
  await impersonate(iexecOwner);
  const tx = await iexecContract
    .connect(new JsonRpcSigner(provider, iexecOwner))
    .transferOwnership(targetOwner, { gasPrice: 0 });
  await tx.wait();
  await stopImpersonate(iexecOwner);

  const newOwner = await iexecContract.owner();
  console.log(
    `IExecHub proxy at ${IEXEC_HUB_ADDRESS} is now owned by ${newOwner}`,
  );
};

export const deployContractFromArtifact = async (contractJson) => {
  if (!contractJson) {
    throw new Error('Artifact contract JSON is null, deployment aborted');
  }

  const wallet = TEST_CHAINS['bellecour-fork'].pocoAdminWallet.connect(
    TEST_CHAINS['bellecour-fork'].provider,
  );
  const contractFactory = new ContractFactory(
    contractJson.abi,
    contractJson.bytecode,
    wallet,
  );
  console.log(`Deploying ${contractJson.contractName}...`);

  try {
    const contract = await contractFactory.deploy();
    await contract.deploymentTransaction().wait();
    console.log(
      `${
        contractJson.contractName
      } deployed at: ${await contract.getAddress()}`,
    );
    return contract;
  } catch (error) {
    throw new Error(`Failed to deploy ${contractJson.contractName}:`, error);
  }
};

export const linkContractToProxy = async (
  proxy,
  contractAddress,
  contractFactory,
) => {
  const signatures = [];
  contractFactory.interface.forEachFunction((func, _) => {
    signatures.push(func.format());
  });

  // Join all signatures with semicolons
  const functionSignatures = signatures.join(';');

  const tx = await proxy
    .updateContract(
      contractAddress,
      functionSignatures,
      'Linking ' + contractAddress,
    )
    .catch((e) => {
      console.log(e);
      throw new Error(`Failed to link ${contractAddress}`, e);
    });
  await tx.wait();

  console.log(`Link ${contractAddress} to proxy`);
};

export const loadJsonFile = async (contractName, basePath) => {
  const filePath = path.resolve(basePath, `${contractName}.json`);

  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(
      `Failed to load and parse the JSON file for ${contractName}:`,
      error,
    );
    return null;
  }
};

export const TEST_CHAINS = {
  // autoseal chain with iExec token
  'custom-token-chain': {
    rpcURL: DRONE ? 'http://custom-token-chain:8545' : 'http://127.0.0.1:18545',
    chainId: '65535',
    hubAddress: '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca',
    enterpriseHubAddress: '0xb80C02d24791fA92fA8983f15390274698A75D23',
    ensRegistryAddress: '0xaf87b82B01E484f8859c980dE69eC8d09D30F22a',
    ensPublicResolverAddress: '0x464E9FC01C2970173B183D24B43A0FA07e6A072E',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    // TODO use another wallet
    faucetWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    provider: new JsonRpcProvider(
      DRONE ? 'http://custom-token-chain:8545' : 'http://127.0.0.1:18545',
    ),
    defaults: {
      isNative: false,
      useGas: true,
    },
    isAnvil: false,
  },
  'bellecour-fork': {
    rpcURL: DRONE ? 'http://bellecour-fork:8545' : 'http://127.0.0.1:8545',
    chainId: '134',
    sconeSmsURL: DRONE ? 'http://sms:13300' : 'http://127.0.0.1:13300',
    gramineSmsURL: DRONE
      ? 'http://sms-gramine:13300'
      : 'http://127.0.0.1:13309',
    iexecGatewayURL: DRONE ? 'http://market-api:3000' : 'http://127.0.0.1:3000',
    resultProxyURL: DRONE
      ? 'http://result-proxy:13200'
      : 'http://127.0.0.1:13200',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407',
    ),
    faucetWallet: new Wallet(
      '0xde43b282c2931fc41ca9e1486fedc2c45227a3b9b4115c89d37f6333c8816d89',
    ),
    provider: new JsonRpcProvider(
      DRONE ? 'http://bellecour-fork:8545' : 'http://127.0.0.1:8545',
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
