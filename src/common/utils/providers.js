import { getDefaultProvider, providers } from 'ethers';
import { getChainDefaults, getId } from './config.js';

export const getReadOnlyProvider = (host, options = {}) => {
  const providerOptions = options.providers || {};
  const networkOptions = options.network;
  let resolvedHost = host;

  const defaults = getChainDefaults({ id: getId(host) });

  if (defaults && defaults.host) {
    resolvedHost = defaults.host;
  } else if (
    // host in host map, must be a RPC endpoint
    typeof resolvedHost !== 'string' ||
    !resolvedHost.startsWith('http')
  ) {
    throw Error('Invalid provider host name or url');
  }

  let resolvedNetwork = networkOptions;
  if (!resolvedNetwork && defaults && defaults.network) {
    resolvedNetwork = defaults.network;
  }
  // RPC endpoint
  if (resolvedHost.startsWith('http')) {
    return new providers.JsonRpcProvider(resolvedHost, resolvedNetwork);
  }
  // API provider
  const { quorum, ...providersOptionsRest } = providerOptions;
  // disable non configured providers when at least 1 is configured
  const apiProvidersList = ['etherscan', 'infura', 'alchemy', 'pocket', 'ankr'];
  const nonConfiguredProviders = apiProvidersList.filter(
    (apiProvider) => !Object.keys(providersOptionsRest).includes(apiProvider),
  );
  return getDefaultProvider(resolvedNetwork || resolvedHost, {
    quorum: quorum || 1,
    ...(nonConfiguredProviders.length < apiProvidersList.length &&
      Object.fromEntries(nonConfiguredProviders.map((name) => [name, '-']))),
    ...providersOptionsRest,
  });
};
