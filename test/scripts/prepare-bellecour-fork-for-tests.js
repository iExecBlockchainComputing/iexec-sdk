import {
  Contract,
  JsonRpcProvider,
  JsonRpcSigner,
  formatEther,
  toBeHex,
} from 'ethers';

const TARGET_POCO_ADMIN_WALLET = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';

const provider = (rpcUrl) =>
  new JsonRpcProvider(rpcUrl, undefined, {
    pollingInterval: 100, // fast polling for tests
  });

const setBalance = (rpcUrl) => async (address, weiAmount) => {
  await fetch(rpcUrl, {
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
  const balance = await provider(rpcUrl).getBalance(address);
  console.log(`${address} wallet balance is now ${formatEther(balance)}`);
};

const impersonate = (rpcUrl) => async (address) => {
  await fetch(rpcUrl, {
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

const stopImpersonate = (rpcUrl) => async (address) => {
  await fetch(rpcUrl, {
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

const getIExecHubOwnership =
  (rpcUrl, legacyTx = false) =>
  async (hubAddress, targetOwner) => {
    const iexecContract = new Contract(
      hubAddress,
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
      provider(rpcUrl),
    );
    const iexecOwner = await iexecContract.owner();
    setBalance(rpcUrl)(iexecOwner, 1n * 10n ** 18n); // give some ETH to the owner to be able to send the transaction
    await impersonate(rpcUrl)(iexecOwner);
    await iexecContract
      .connect(new JsonRpcSigner(provider(rpcUrl), iexecOwner))
      .transferOwnership(targetOwner, legacyTx ? { gasPrice: 0 } : {})
      .then((tx) => tx.wait());
    await stopImpersonate(rpcUrl)(iexecOwner);

    const newOwner = await iexecContract.owner();
    console.log(`IExecHub proxy at ${hubAddress} is now owned by ${newOwner}`);
  };

const main = async () => {
  // prepare PoCo
  const bellecourForkRpcUrl = 'http://localhost:8545';
  console.log(`preparing bellecour-fork at ${bellecourForkRpcUrl}`);
  await setBalance(bellecourForkRpcUrl)(
    TARGET_POCO_ADMIN_WALLET,
    1000000n * 10n ** 18n,
  );
  await getIExecHubOwnership(bellecourForkRpcUrl, true)(
    '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
    TARGET_POCO_ADMIN_WALLET,
  );

  const arbitrumSepoliaForkRpcUrl = 'http://localhost:8555';
  console.log(
    `preparing arbitrum-sepolia-fork at ${arbitrumSepoliaForkRpcUrl}`,
  );

  // prepare PoCo
  await setBalance(arbitrumSepoliaForkRpcUrl)(
    TARGET_POCO_ADMIN_WALLET,
    1000000n * 10n ** 18n,
  );
  await getIExecHubOwnership(arbitrumSepoliaForkRpcUrl)(
    '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
    TARGET_POCO_ADMIN_WALLET,
  );
};

main();
