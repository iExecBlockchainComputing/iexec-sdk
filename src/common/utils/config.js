import { Network, EnsPlugin } from 'ethers';
import { TEE_FRAMEWORKS } from './constant.js';

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

const networkMap = {
  134: {
    name: 'bellecour',
    chainId: 134,
    ensAddress: ensMap[134].registry,
  },
};

const hubMap = {
  standard: {},
  enterprise: {},
};

const smsMap = {
  standard: {
    134: {
      [TEE_FRAMEWORKS.SCONE]: 'https://sms.scone-prod.v8-bellecour.iex.ec',
      [TEE_FRAMEWORKS.GRAMINE]: 'https://sms.gramine.v8-bellecour.iex.ec',
    },
  },
  enterprise: {},
};

const resultProxyMap = {
  standard: {
    134: 'https://result.v8-bellecour.iex.ec',
  },
  enterprise: {},
};

const bridgeMap = {
  standard: {
    1: {
      contract: '0x4e55c9B8953AB1957ad0A59D413631A66798c6a2',
      bridgedChainId: '134',
    },
    134: {
      contract: '0x188A4376a1D818bF2434972Eb34eFd57102a19b7',
      bridgedChainId: '1',
    },
  },
  enterprise: {},
};

const enterpriseEnabledMap = {};

const ipfsGatewayMap = {
  standard: {
    134: 'https://ipfs-gateway.v8-bellecour.iex.ec',
  },
  enterprise: {},
};

const iexecGatewayMap = {
  standard: {
    134: 'https://api.market.v8-bellecour.iex.ec',
  },
  enterprise: {},
};

const idMap = {
  mainnet: 1,
  bellecour: 134,
};

export const getId = (idOrName) => idMap[idOrName] || idOrName;

export const getChainDefaults = ({ id, flavour }) => ({
  host: hostMap[id],
  hub: hubMap[flavour] && hubMap[flavour][id],
  sms: smsMap[flavour] && smsMap[flavour][id],
  ensRegistry: ensMap[id] && ensMap[id].registry,
  ensPublicResolver: ensMap[id] && ensMap[id].publicResolver,
  resultProxy: resultProxyMap[flavour] && resultProxyMap[flavour][id],
  ipfsGateway: ipfsGatewayMap[flavour] && ipfsGatewayMap[flavour][id],
  iexecGateway: iexecGatewayMap[flavour] && iexecGatewayMap[flavour][id],
  bridge: bridgeMap[flavour] && bridgeMap[flavour][id],
  flavour,
  network: networkMap[id],
});

export const isEnterpriseEnabled = (id) => !!enterpriseEnabledMap[id];

// register ethers unknown networks
const bellecourNetwork = new Network('bellecour', 134).attachPlugin(
  new EnsPlugin(ensMap[134].registry, 134),
);
Network.register(134, () => bellecourNetwork);
Network.register('bellecour', () => bellecourNetwork);
