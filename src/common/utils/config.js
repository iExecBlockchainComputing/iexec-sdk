import { ConfigurationError } from './errors.js';

export const CHAIN_SPECIFIC_FEATURES = {};

const networkConfigs = [
  {
    id: 421614,
    name: 'arbitrum-sepolia-testnet',
    hub: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
    host: 'https://sepolia-rollup.arbitrum.io/rpc',
    sms: 'https://sms.arbitrum-sepolia-testnet.iex.ec',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    iexecGateway: 'https://api-market.arbitrum-sepolia-testnet.iex.ec',
    compass: 'https://compass.arbitrum-sepolia-testnet.iex.ec',
    pocoSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/2GCj8gzLCihsiEDq8cYvC5nUgK6VfwZ6hm3Wj8A3kcxz',
    isExperimental: false,
    uploadBulkForThegraph: true,
  },
  {
    id: 42161,
    name: 'arbitrum-mainnet',
    hub: '0x098bFCb1E50ebcA0BaA92C12eA0c3F045A1aD9f0',
    host: 'https://arb1.arbitrum.io/rpc',
    sms: 'https://sms.arbitrum-mainnet.iex.ec',
    ipfsGateway: 'https://ipfs-gateway.arbitrum-mainnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-mainnet.iex.ec',
    iexecGateway: 'https://api.market.arbitrum-mainnet.iex.ec',
    compass: 'https://compass.arbitrum-mainnet.iex.ec',
    pocoSubgraph:
      'https://thegraph.arbitrum.iex.ec/api/subgraphs/id/B1comLe9SANBLrjdnoNTJSubbeC7cY7EoNu6zD82HeKy',
    isExperimental: false,
    uploadBulkForThegraph: true,
  },
];

const getConfig = (chainId) =>
  networkConfigs.find(
    (networkConfig) => `${networkConfig.id}` === `${chainId}`,
  );

export const getId = (idOrName, { allowExperimentalNetworks = false } = {}) =>
  networkConfigs
    .filter(
      ({ isExperimental }) => allowExperimentalNetworks || !isExperimental,
    )
    .find(({ id, name }) => idOrName === name || `${idOrName}` === `${id}`)?.id;

export const getChainDefaults = (
  id,
  { allowExperimentalNetworks = false } = {},
) => {
  const {
    name,
    host,
    hub,
    sms,
    iexecGateway,
    ipfsGateway,
    ipfsNode,
    compass,
    pocoSubgraph,
  } =
    networkConfigs
      .filter(
        ({ isExperimental }) => allowExperimentalNetworks || !isExperimental,
      )
      .find((networkConfig) => `${id}` === `${networkConfig.id}`) || {};

  return {
    name,
    host,
    hub,
    sms,
    iexecGateway,
    ipfsGateway,
    ipfsNode,
    compass,
    pocoSubgraph,
  };
};

export const shouldUploadBulkForThegraph = (chainId) =>
  getConfig(chainId)?.uploadBulkForThegraph || false;

export const checkImplementedOnChain = (chainId, featureName) => {
  const networkConfig = getConfig(chainId);
  if (networkConfig?.notImplemented?.includes(featureName)) {
    throw new ConfigurationError(
      `${featureName} is not available on network ${networkConfig.name}`,
    );
  }
};

export const THEGRAPH_IPFS_NODE = 'https://ipfs.thegraph.com';
export const THEGRAPH_IPFS_GATEWAY = THEGRAPH_IPFS_NODE;
