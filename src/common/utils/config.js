import { Network, EnsPlugin } from 'ethers';
import { TEE_FRAMEWORKS } from './constant.js';
import { address as voucherHubBellecourAddress } from '../generated/@iexec/voucher-contracts/deployments/bellecour/VoucherHubERC1967Proxy.js';

const hostMap = {
  1: 'mainnet',
  134: 'https://bellecour.iex.ec',
};

const ensMap = {
  1: {
    // registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
  },
  134: {
    registry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
    publicResolver: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
  },
};

const voucherHubMap = {
  134: voucherHubBellecourAddress,
};

const networkMap = {
  134: {
    name: 'bellecour',
    chainId: 134,
    ensAddress: ensMap[134].registry,
  },
};

const hubMap = {};

const smsMap = {
  134: {
    [TEE_FRAMEWORKS.SCONE]: 'https://sms.iex.ec',
  },
};

const resultProxyMap = {
  134: 'https://result.v8-bellecour.iex.ec',
};

const bridgeMap = {
  1: {
    contract: '0x4e55c9B8953AB1957ad0A59D413631A66798c6a2',
    bridgedChainId: '134',
  },
  134: {
    contract: '0x188A4376a1D818bF2434972Eb34eFd57102a19b7',
    bridgedChainId: '1',
  },
};

const ipfsGatewayMap = {
  134: 'https://ipfs-gateway.v8-bellecour.iex.ec',
};

const iexecGatewayMap = {
  134: 'https://api.market.v8-bellecour.iex.ec',
};

const pocoSubgraphMap = {
  134: 'https://thegraph.bellecour.iex.ec/subgraphs/name/bellecour/poco-v5',
};

const voucherSubgraphMap = {
  134: 'https://thegraph.bellecour.iex.ec/subgraphs/name/bellecour/iexec-voucher',
};

const idMap = {
  mainnet: 1,
  bellecour: 134,
};

export const getId = (idOrName) => idMap[idOrName] || idOrName;

export const getChainDefaults = ({ id }) => ({
  host: hostMap[id],
  hub: hubMap[id],
  sms: smsMap[id],
  ensPublicResolver: ensMap[id] && ensMap[id].publicResolver,
  voucherHub: voucherHubMap[id],
  resultProxy: resultProxyMap[id],
  ipfsGateway: ipfsGatewayMap[id],
  iexecGateway: iexecGatewayMap[id],
  pocoSubgraph: pocoSubgraphMap[id],
  voucherSubgraph: voucherSubgraphMap[id],
  bridge: bridgeMap[id],
});

// register ethers unknown networks
if (Network.from(134).name === 'unknown') {
  const bellecourNetwork = new Network(networkMap[134].name, 134).attachPlugin(
    new EnsPlugin(ensMap[134].registry, 134),
  );
  Network.register(bellecourNetwork.chainId, () => bellecourNetwork);
  Network.register(bellecourNetwork.name, () => bellecourNetwork);
}
