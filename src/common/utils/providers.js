import { getDefaultProvider, JsonRpcProvider } from 'ethers';
import { getChainDefaults, getId } from './config.js';

export const getReadOnlyProvider = (
  host,
  { providers = {}, allowExperimentalNetworks = false } = {},
) => {
  let resolvedHost = host;

  const defaults = getChainDefaults(
    getId(host, { allowExperimentalNetworks }),
    {
      allowExperimentalNetworks,
    },
  );

  if (defaults && defaults.host) {
    resolvedHost = defaults.host;
  } else if (
    // host in host map, must be a RPC endpoint
    typeof resolvedHost !== 'string' ||
    !resolvedHost.startsWith('http')
  ) {
    throw new Error('Invalid provider host name or url');
  }

  // RPC endpoint
  if (resolvedHost.startsWith('http')) {
    return new JsonRpcProvider(resolvedHost, undefined, {
      pollingInterval: 1000, // override default 4s for faster tx confirms (TODO: default value per network + option)
    });
  }
  // API provider
  const { quorum, ...providersOptionsRest } = providers;
  // disable non configured providers when at least 1 is configured
  const apiProvidersList = [
    'alchemy',
    'ankr',
    'cloudflare',
    'etherscan',
    'infura',
    'pocket', // currently commented in ethers
    'chainstack',
    'quicknode',
  ];
  const nonConfiguredProviders = apiProvidersList.filter(
    (apiProvider) => !Object.keys(providersOptionsRest).includes(apiProvider),
  );
  return getDefaultProvider(resolvedHost, {
    quorum: quorum || 1,
    ...(nonConfiguredProviders.length < apiProvidersList.length &&
      Object.fromEntries(nonConfiguredProviders.map((name) => [name, '-']))),
    ...providersOptionsRest,
  });
};
