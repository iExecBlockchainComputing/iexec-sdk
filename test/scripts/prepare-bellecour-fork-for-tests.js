import {
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  formatEther,
  keccak256,
  toBeHex,
} from 'ethers';

import { VOUCHER_HUB_ADDRESS } from '../bellecour-fork/voucher-config.js'; // TODO: change with deployment address once voucher is deployed on bellecour

const { DRONE } = process.env;

const IEXEC_HUB_ADDRESS = '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f';
const TARGET_POCO_ADMIN_WALLET = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const TARGET_FAUCET_WALLET = '0xdFa2585C16cAf9c853086F36d2A37e9b8d1eab87';
const TARGET_VOUCHER_MANAGER_WALLET =
  '0x44cA21A3c4efE9B1A0268e2e9B2547E7d9C8f19C';

const rpcURL = DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545';

const provider = new JsonRpcProvider(rpcURL);

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

  const VOUCHER_MANAGER_ROLE = keccak256(Buffer.from('VOUCHER_MANAGER_ROLE'));

  const ASSET_ELIGIBILITY_MANAGER_ROLE = keccak256(
    Buffer.from('ASSET_ELIGIBILITY_MANAGER_ROLE'),
  );

  await voucherHubContract
    .connect(new JsonRpcSigner(provider, defaultAdmin))
    .grantRole(VOUCHER_MANAGER_ROLE, targetManager, { gasPrice: 0 })
    .then((tx) => tx.wait());

  await voucherHubContract
    .connect(new JsonRpcSigner(provider, defaultAdmin))
    .grantRole(ASSET_ELIGIBILITY_MANAGER_ROLE, targetManager, {
      gasPrice: 0,
    })
    .then((tx) => tx.wait());

  await stopImpersonate(defaultAdmin);

  console.log(
    `${targetManager} has role VOUCHER_MANAGER_ROLE: ${await voucherHubContract.hasRole(
      ASSET_ELIGIBILITY_MANAGER_ROLE,
      targetManager,
    )}`,
  );

  console.log(
    `${targetManager} has role ASSET_ELIGIBILITY_MANAGER_ROLE: ${await voucherHubContract.hasRole(
      ASSET_ELIGIBILITY_MANAGER_ROLE,
      targetManager,
    )}`,
  );
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
};

main();
