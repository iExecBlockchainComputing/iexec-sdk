import { Network } from 'ethers';
import { ConfigurationError } from './errors.js';

export const CHAIN_SPECIFIC_FEATURES = {
  COMPASS: 'iExec Compass',
  BULK_PROCESSING: 'Bulk processing',
};

const networkConfigs = [
  {
    id: 134,
    name: 'bellecour',
    hub: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
    host: 'https://bellecour.iex.ec',
    sms: 'https://sms.iex.ec',
    resultProxy: 'https://result.v8-bellecour.iex.ec',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    ipfsNode: 'https://ipfs-upload.v8-bellecour.iex.ec',
    iexecGateway: 'https://api.market.v8-bellecour.iex.ec',
    compass: undefined, // no compass
    pocoSubgraph: 'https://thegraph.iex.ec/subgraphs/name/bellecour/poco-v5',
    shouldRegisterNetwork: true,
    isExperimental: false,
    notImplemented: [
      CHAIN_SPECIFIC_FEATURES.COMPASS,
      CHAIN_SPECIFIC_FEATURES.BULK_PROCESSING,
    ],
  },
  {
    id: 1,
    name: 'mainnet',
    hub: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
    host: 'mainnet',
    sms: undefined, // no protocol running
    resultProxy: undefined, // no protocol running
    ipfsGateway: undefined, // no protocol running
    ipfsNode: undefined, // no protocol running
    iexecGateway: undefined, // no protocol running
    compass: undefined, // no protocol running
    pocoSubgraph: undefined, // no protocol running
    shouldRegisterNetwork: false,
    isExperimental: false,
    notImplemented: [
      CHAIN_SPECIFIC_FEATURES.COMPASS,
      CHAIN_SPECIFIC_FEATURES.BULK_PROCESSING,
    ],
  },
  {
    id: 421614,
    name: 'arbitrum-sepolia-testnet',
    hub: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
    host: 'https://sepolia-rollup.arbitrum.io/rpc',
    sms: 'https://sms.arbitrum-sepolia-testnet.iex.ec',
    resultProxy: undefined, // not exposed
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    iexecGateway: 'https://api-market.arbitrum-sepolia-testnet.iex.ec',
    compass: 'https://compass.arbitrum-sepolia-testnet.iex.ec',
    pocoSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/2GCj8gzLCihsiEDq8cYvC5nUgK6VfwZ6hm3Wj8A3kcxz',
    shouldRegisterNetwork: false,
    isExperimental: false,
    uploadBulkForThegraph: true,
    notImplemented: [],
  },
  {
    id: 42161,
    name: 'arbitrum-mainnet',
    hub: '0x098bFCb1E50ebcA0BaA92C12eA0c3F045A1aD9f0',
    host: 'https://arb1.arbitrum.io/rpc',
    sms: 'https://sms.arbitrum-mainnet.iex.ec',
    resultProxy: undefined, // not exposed
    ipfsGateway: 'https://ipfs-gateway.arbitrum-mainnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-mainnet.iex.ec',
    iexecGateway: 'https://api.market.arbitrum-mainnet.iex.ec',
    compass: 'https://compass.arbitrum-mainnet.iex.ec',
    pocoSubgraph:
      'https://thegraph.arbitrum.iex.ec/api/subgraphs/id/B1comLe9SANBLrjdnoNTJSubbeC7cY7EoNu6zD82HeKy',
    shouldRegisterNetwork: false,
    uploadBulkForThegraph: true,
    notImplemented: [],
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
    resultProxy,
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
    resultProxy,
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
  if (
    networkConfig?.notImplemented &&
    networkConfig.notImplemented.includes(featureName)
  ) {
    throw new ConfigurationError(
      `${featureName} is not available on network ${networkConfig.name}`,
    );
  }
};

// Register unknown networks for the ethers library
networkConfigs.forEach((networkConfig) => {
  if (
    networkConfig.shouldRegisterNetwork &&
    Network.from(networkConfig.id).name === 'unknown'
  ) {
    const network = new Network(networkConfig.name, networkConfig.id);
    Network.register(network.chainId, () => network);
    Network.register(network.name, () => network);
  }
});

export const THEGRAPH_IPFS_NODE = 'https://ipfs.thegraph.com';
export const THEGRAPH_IPFS_GATEWAY = THEGRAPH_IPFS_NODE;
