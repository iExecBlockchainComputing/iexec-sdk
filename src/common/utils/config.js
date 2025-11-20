import { EnsPlugin, Network } from 'ethers';
import { address as voucherHubBellecourAddress } from '../generated/@iexec/voucher-contracts/deployments/bellecour/VoucherHubERC1967Proxy.js';
import { TEE_FRAMEWORKS } from './constant.js';
import { ConfigurationError } from './errors.js';

export const CHAIN_SPECIFIC_FEATURES = {
  ENS: 'ENS',
  WORKERPOOL_API_URL_REGISTRATION: 'Workerpool API Registration',
  VOUCHER: 'iExec Voucher',
  COMPASS: 'iExec Compass',
  XRLC_BRIDGE: 'iExec xRLC Bridge',
  BULK_PROCESSING: 'Bulk processing',
};

const networkConfigs = [
  {
    id: 134,
    name: 'bellecour',
    hub: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
    host: 'https://bellecour.iex.ec',
    ensRegistry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
    ensPublicResolver: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
    sms: {
      [TEE_FRAMEWORKS.SCONE]: 'https://sms.iex.ec',
      [TEE_FRAMEWORKS.GRAMINE]: 'https://sms.gramine.v8-bellecour.iex.ec',
    },
    resultProxy: 'https://result.v8-bellecour.iex.ec',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    ipfsNode: 'https://ipfs-upload.v8-bellecour.iex.ec',
    iexecGateway: 'https://api.market.v8-bellecour.iex.ec',
    compass: undefined, // no compass using ENS
    pocoSubgraph: 'https://thegraph.iex.ec/subgraphs/name/bellecour/poco-v5',
    voucherHub: voucherHubBellecourAddress,
    voucherSubgraph:
      'https://thegraph.iex.ec/subgraphs/name/bellecour/iexec-voucher',
    bridge: {
      contract: '0x188A4376a1D818bF2434972Eb34eFd57102a19b7',
      bridgedChainId: '1',
    },
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
    ensRegistry: undefined, // use ethers default
    ensPublicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    sms: undefined, // no protocol running
    resultProxy: undefined, // no protocol running
    ipfsGateway: undefined, // no protocol running
    ipfsNode: undefined, // no protocol running
    iexecGateway: undefined, // no protocol running
    compass: undefined, // no protocol running
    pocoSubgraph: undefined, // no protocol running
    voucherHub: undefined, // no voucher
    voucherSubgraph: undefined, // no voucher
    bridge: {
      contract: '0x4e55c9B8953AB1957ad0A59D413631A66798c6a2',
      bridgedChainId: '134',
    },
    shouldRegisterNetwork: false,
    isExperimental: false,
    notImplemented: [
      CHAIN_SPECIFIC_FEATURES.COMPASS,
      CHAIN_SPECIFIC_FEATURES.VOUCHER,
      CHAIN_SPECIFIC_FEATURES.BULK_PROCESSING,
    ],
  },
  {
    id: 421614,
    name: 'arbitrum-sepolia-testnet',
    hub: '0xB2157BF2fAb286b2A4170E3491Ac39770111Da3E',
    host: 'https://sepolia-rollup.arbitrum.io/rpc',
    ensRegistry: undefined, // not supported
    ensPublicResolver: undefined, // not supported
    sms: {
      [TEE_FRAMEWORKS.SCONE]: 'https://sms.arbitrum-sepolia-testnet.iex.ec',
    },
    resultProxy: undefined, // not exposed
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-sepolia-testnet.iex.ec',
    iexecGateway: 'https://api-market.arbitrum-sepolia-testnet.iex.ec',
    compass: 'https://compass.arbitrum-sepolia-testnet.iex.ec',
    pocoSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/2GCj8gzLCihsiEDq8cYvC5nUgK6VfwZ6hm3Wj8A3kcxz',
    voucherHub: undefined, // no voucher
    voucherSubgraph: undefined, // no voucher
    bridge: {}, // no bridge
    shouldRegisterNetwork: false,
    isExperimental: false,
    uploadBulkForThegraph: true,
    notImplemented: [
      CHAIN_SPECIFIC_FEATURES.ENS,
      CHAIN_SPECIFIC_FEATURES.WORKERPOOL_API_URL_REGISTRATION,
      CHAIN_SPECIFIC_FEATURES.VOUCHER,
      CHAIN_SPECIFIC_FEATURES.XRLC_BRIDGE,
    ],
  },
  {
    id: 42161,
    name: 'arbitrum-mainnet',
    hub: '0x098bFCb1E50ebcA0BaA92C12eA0c3F045A1aD9f0',
    host: 'https://arb1.arbitrum.io/rpc',
    ensRegistry: undefined, // not supported
    ensPublicResolver: undefined, // not supported
    sms: {
      [TEE_FRAMEWORKS.SCONE]: 'https://sms.arbitrum-mainnet.iex.ec',
    },
    resultProxy: undefined, // not exposed
    ipfsGateway: 'https://ipfs-gateway.arbitrum-mainnet.iex.ec',
    ipfsNode: 'https://ipfs-upload.arbitrum-mainnet.iex.ec',
    iexecGateway: 'https://api.market.arbitrum-mainnet.iex.ec',
    compass: 'https://compass.arbitrum-mainnet.iex.ec',
    pocoSubgraph:
      'https://thegraph.arbitrum.iex.ec/api/subgraphs/id/B1comLe9SANBLrjdnoNTJSubbeC7cY7EoNu6zD82HeKy',
    voucherHub: undefined, // no voucher
    voucherSubgraph: undefined, // no voucher
    bridge: {}, // no bridge
    shouldRegisterNetwork: false,
    uploadBulkForThegraph: true,
    notImplemented: [
      CHAIN_SPECIFIC_FEATURES.ENS,
      CHAIN_SPECIFIC_FEATURES.WORKERPOOL_API_URL_REGISTRATION,
      CHAIN_SPECIFIC_FEATURES.VOUCHER,
      CHAIN_SPECIFIC_FEATURES.XRLC_BRIDGE,
    ],
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
    ensRegistry,
    ensPublicResolver,
    hub,
    sms,
    resultProxy,
    iexecGateway,
    ipfsGateway,
    ipfsNode,
    compass,
    pocoSubgraph,
    voucherHub,
    voucherSubgraph,
    bridge,
  } =
    networkConfigs
      .filter(
        ({ isExperimental }) => allowExperimentalNetworks || !isExperimental,
      )
      .find((networkConfig) => `${id}` === `${networkConfig.id}`) || {};

  return {
    name,
    host,
    ensRegistry,
    ensPublicResolver,
    hub,
    sms,
    resultProxy,
    iexecGateway,
    ipfsGateway,
    ipfsNode,
    compass,
    pocoSubgraph,
    voucherHub,
    voucherSubgraph,
    bridge,
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

// Register unknown networks and their ENS settings for the ethers library
networkConfigs.forEach((networkConfig) => {
  if (
    networkConfig.shouldRegisterNetwork &&
    Network.from(networkConfig.id).name === 'unknown' &&
    networkConfig.ensRegistry
  ) {
    const network = new Network(
      networkConfig.name,
      networkConfig.id,
    ).attachPlugin(new EnsPlugin(networkConfig.ensRegistry, networkConfig.id));
    Network.register(network.chainId, () => network);
    Network.register(network.name, () => network);
  }
});

export const THEGRAPH_IPFS_NODE = 'https://ipfs.thegraph.com';
export const THEGRAPH_IPFS_GATEWAY = THEGRAPH_IPFS_NODE;
