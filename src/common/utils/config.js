import { Network, EnsPlugin } from 'ethers';
import { TEE_FRAMEWORKS } from './constant.js';
import { address as voucherHubBellecourAddress } from '../generated/@iexec/voucher-contracts/deployments/bellecour/VoucherHubERC1967Proxy.js';
import { networks as iexecProxyNetworks } from '../generated/@iexec/poco/ERC1538Proxy.js';

const networkConfigs = [
  {
    id: 134,
    name: 'bellecour',
    hub: iexecProxyNetworks[134].address,
    host: 'https://bellecour.iex.ec',
    ensRegistry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
    ensPublicResolver: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
    sms: {
      [TEE_FRAMEWORKS.SCONE]: 'https://sms.iex.ec',
      [TEE_FRAMEWORKS.GRAMINE]: 'https://sms.gramine.v8-bellecour.iex.ec',
    },
    resultProxy: 'https://result.v8-bellecour.iex.ec',
    ipfsGateway: 'https://ipfs-gateway.v8-bellecour.iex.ec',
    iexecGateway: 'https://api.market.v8-bellecour.iex.ec',
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
  },
  {
    id: 1,
    name: 'mainnet',
    hub: iexecProxyNetworks[1].address,
    host: 'mainnet',
    ensRegistry: undefined, // use ethers default
    ensPublicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    sms: undefined, // no protocol running
    resultProxy: undefined, // no protocol running
    ipfsGateway: undefined, // no protocol running
    iexecGateway: undefined, // no protocol running
    pocoSubgraph: undefined, // no protocol running
    voucherHub: undefined, // no voucher
    voucherSubgraph: undefined, // no voucher
    bridge: {
      contract: '0x4e55c9B8953AB1957ad0A59D413631A66798c6a2',
      bridgedChainId: '134',
    },
    shouldRegisterNetwork: false,
    isExperimental: false,
  },
  {
    id: 421614,
    name: 'arbitrum-sepolia-testnet',
    hub: '0x14B465079537655E1662F012e99EBa3863c8B9E0',
    host: 'https://sepolia-rollup.arbitrum.io/rpc',
    ensRegistry: undefined, // TODO: not supported
    ensPublicResolver: undefined, // TODO: not supported
    sms: {
      [TEE_FRAMEWORKS.SCONE]: 'https://sms.arbitrum-sepolia-testnet.iex.ec',
    },
    resultProxy: undefined, // not exposed
    ipfsGateway: 'https://ipfs-gateway.arbitrum-sepolia-testnet.iex.ec',
    iexecGateway: 'https://api-market.arbitrum-sepolia-testnet.iex.ec',
    pocoSubgraph:
      'https://thegraph.arbitrum-sepolia-testnet.iex.ec/api/subgraphs/id/2GCj8gzLCihsiEDq8cYvC5nUgK6VfwZ6hm3Wj8A3kcxz',
    voucherHub: undefined, // no voucher
    voucherSubgraph: undefined, // no voucher
    bridge: {}, // no bridge
    shouldRegisterNetwork: false,
    isExperimental: true,
  },
];

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
    pocoSubgraph,
    voucherHub,
    voucherSubgraph,
    bridge,
  };
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
