import { getDefaultProvider, providers } from 'ethers';
import { getChainDefaults, getId } from './config';

export const getReadOnlyProvider = (host, options = {}) => {
  const providerOptions = options.providers || {};
  const networkOptions = options.network;
  let resolvedHost = host;

  const defaults = getChainDefaults({ id: getId(host) });

  if (defaults && defaults.host) {
    resolvedHost = defaults.host;
  } else if (
    // hot in host map, must be a RPC endpoint
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
  // if only one provider API key try the specific provider
  if (Object.keys(providersOptionsRest).length === 1) {
    const [providerName, apiKey] = Object.entries(providersOptionsRest)[0];
    switch (providerName) {
      case 'infura':
        return new providers.InfuraProvider(
          resolvedNetwork || resolvedHost,
          apiKey,
        );
      case 'alchemy':
        return new providers.AlchemyProvider(
          resolvedNetwork || resolvedHost,
          apiKey,
        );
      case 'etherscan':
        return new providers.EtherscanProvider(
          resolvedNetwork || resolvedHost,
          apiKey,
        );
      default:
        break;
    }
  }
  return getDefaultProvider(resolvedNetwork || resolvedHost, {
    quorum: quorum || 1,
    ...providersOptionsRest,
  });
};
