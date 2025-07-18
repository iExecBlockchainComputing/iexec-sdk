import {
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  formatEther,
  keccak256,
  toBeHex,
} from 'ethers';

const IEXEC_HUB_ADDRESS = '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f';
const VOUCHER_HUB_ADDRESS = '0x3137B6DF4f36D338b82260eDBB2E7bab034AFEda';
const TARGET_POCO_ADMIN_WALLET = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const TARGET_FAUCET_WALLET = '0xdFa2585C16cAf9c853086F36d2A37e9b8d1eab87';
const TARGET_VOUCHER_MANAGER_WALLET =
  '0x44cA21A3c4efE9B1A0268e2e9B2547E7d9C8f19C';
const DEBUG_WORKERPOOL_OWNER_WALLET =
  '0x02D0e61355e963210d0DE382e6BA09781181bB94';
const PROD_WORKERPOOL_OWNER_WALLET =
  '0x1Ff6AfF580e8Ca738F76485E0914C2aCaDa7B462';
const DEBUG_WORKERPOOL = '0xdb214a4a444d176e22030be1ed89da1b029320f2'; // 'debug-v8-bellecour.main.pools.iexec.eth';
const PROD_WORKERPOOL = '0x0e7bc972c99187c191a17f3cae4a2711a4188c3f'; // 'prod-v8-bellecour.main.pools.iexec.eth';

const rpcURL = 'http://localhost:8545';

const provider = new JsonRpcProvider(rpcURL, undefined, {
  pollingInterval: 100, // fast polling for tests
});

const setBalance = async (address, weiAmount) => {
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

const getIExecHubOwnership = async (targetOwner) => {
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
  await iexecContract
    .connect(new JsonRpcSigner(provider, iexecOwner))
    .transferOwnership(targetOwner, { gasPrice: 0 })
    .then((tx) => tx.wait());
  await stopImpersonate(iexecOwner);

  const newOwner = await iexecContract.owner();
  console.log(
    `IExecHub proxy at ${IEXEC_HUB_ADDRESS} is now owned by ${newOwner}`,
  );
};

const getVoucherManagementRoles = async (targetManager) => {
  const voucherHubContract = new Contract(
    VOUCHER_HUB_ADDRESS,
    [
      {
        inputs: [],
        name: 'defaultAdmin',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: 'role',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
        ],
        name: 'grantRole',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: 'role',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
        ],
        name: 'hasRole',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    provider,
  );

  const defaultAdmin = await voucherHubContract.defaultAdmin();

  console.log('VoucherHub defaultAdmin:', defaultAdmin);

  await impersonate(defaultAdmin);

  const MINTER_ROLE = keccak256(Buffer.from('MINTER_ROLE'));

  const MANAGER_ROLE = keccak256(Buffer.from('MANAGER_ROLE'));

  await voucherHubContract
    .connect(new JsonRpcSigner(provider, defaultAdmin))
    .grantRole(MINTER_ROLE, targetManager, { gasPrice: 0 })
    .then((tx) => tx.wait());

  await voucherHubContract
    .connect(new JsonRpcSigner(provider, defaultAdmin))
    .grantRole(MANAGER_ROLE, targetManager, {
      gasPrice: 0,
    })
    .then((tx) => tx.wait());

  await stopImpersonate(defaultAdmin);

  console.log(
    `${targetManager} has role MINTER_ROLE: ${await voucherHubContract.hasRole(
      MINTER_ROLE,
      targetManager,
    )}`,
  );

  console.log(
    `${targetManager} has role MANAGER_ROLE: ${await voucherHubContract.hasRole(
      MANAGER_ROLE,
      targetManager,
    )}`,
  );
};

const getWorkerpoolOwnership = async (resourceAddress, targetOwner) => {
  const RESOURCE_ABI = [
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'registry',
      outputs: [
        {
          internalType: 'contract IRegistry',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];
  const RESOURCE_REGISTRY_ABI = [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      name: 'safeTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  const resourceContract = new Contract(
    resourceAddress,
    RESOURCE_ABI,
    provider,
  );

  const resourceOwner = await resourceContract.owner();
  const resourceRegistryAddress = await resourceContract.registry();
  const resourceRegistryContract = new Contract(
    resourceRegistryAddress,
    RESOURCE_REGISTRY_ABI,
    provider,
  );

  await impersonate(resourceOwner);
  await resourceRegistryContract
    .connect(new JsonRpcSigner(provider, resourceOwner))
    .safeTransferFrom(resourceOwner, targetOwner, resourceAddress, {
      gasPrice: 0,
    })
    .then((tx) => tx.wait());
  await stopImpersonate(resourceOwner);

  const newOwner = await resourceContract.owner();
  console.log(`Workerpool ${resourceAddress} is now owned by ${newOwner}`);
};

const main = async () => {
  console.log(`preparing bellecour-fork at ${rpcURL}`);

  // prepare PoCo
  await setBalance(TARGET_POCO_ADMIN_WALLET, 1000000n * 10n ** 18n);
  await getIExecHubOwnership(TARGET_POCO_ADMIN_WALLET);

  // prepare faucet wallet
  await setBalance(TARGET_FAUCET_WALLET, 1000000n * 10n ** 18n);

  // prepare Voucher
  await setBalance(TARGET_VOUCHER_MANAGER_WALLET, 1000000n * 10n ** 18n);
  await getVoucherManagementRoles(TARGET_VOUCHER_MANAGER_WALLET);

  // prepare workerpools
  await getWorkerpoolOwnership(DEBUG_WORKERPOOL, DEBUG_WORKERPOOL_OWNER_WALLET);
  await getWorkerpoolOwnership(PROD_WORKERPOOL, PROD_WORKERPOOL_OWNER_WALLET);
};

main();
