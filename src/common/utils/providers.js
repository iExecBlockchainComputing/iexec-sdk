import { JsonRpcProvider } from 'ethers';
import { getChainDefaults, getId } from './config.js';

export const getReadOnlyProvider = (
  host,
  { allowExperimentalNetworks = false } = {},
) => {
  let resolvedHost =
    getChainDefaults(getId(host, { allowExperimentalNetworks }), {
      allowExperimentalNetworks,
    })?.host || host;

  if (typeof resolvedHost === 'string' && resolvedHost.startsWith('http')) {
    return new JsonRpcProvider(resolvedHost, undefined, {
      pollingInterval: 1000, // override default 4s for faster tx confirms (TODO: default value per network + option)
    });
  } else {
    throw new Error('Invalid provider host name or url');
  }
};
