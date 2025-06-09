import { Network, EnsPlugin } from 'ethers';
import { TEE_FRAMEWORKS } from './constant.js';
import { address as voucherHubBellecourAddress } from '../generated/@iexec/voucher-contracts/deployments/bellecour/VoucherHubERC1967Proxy.js';

const networkConfigs = [
  {
    id: 134,
    name: 'bellecour',
    hub: undefined, // use default
    host: 'https://bellecour.iex.ec',
    ensRegistry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006', // use ethers default '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
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
    hub: undefined, // use default
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
];

export const getId = (idOrName) =>
  networkConfigs.find(
    ({ id, name }) => idOrName === name || `${idOrName}` === `${id}`,
  )?.id;

export const getChainDefaults = ({ id, allowExperimental = false }) => {
  const {
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
        ({ isExperimental }) => allowExperimental || isExperimental === false,
      )
      .find((networkConfig) => `${id}` === `${networkConfig.id}`) || {};

  return {
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

// register ethers unknown networks
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
