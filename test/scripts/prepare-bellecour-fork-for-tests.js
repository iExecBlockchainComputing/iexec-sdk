import {
  TARGET_POCO_ADMIN_WALLET,
  TARGET_FAUCET_WALLET,
  rpcURL,
  setBalance,
  getIExecHubOwnership,
} from './utils.js';

const main = async () => {
  console.log(`preparing bellecour-fork at ${rpcURL}`);

  await setBalance(TARGET_POCO_ADMIN_WALLET, 1000000n * 10n ** 18n);
  await getIExecHubOwnership(TARGET_POCO_ADMIN_WALLET);

  await setBalance(TARGET_FAUCET_WALLET, 1000000n * 10n ** 18n);
};

main();
