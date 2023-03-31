const hostMap = {
  1: 'mainnet',
  5: 'goerli',
  133: 'https://viviani.iex.ec',
  134: 'https://bellecour.iex.ec',
};

const ensMap = {
  1: {
    // registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
  },
  5: {
    // registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4B1488B7a6B320d2D721406204aBc3eeAa9AD329',
  },
  133: {
    registry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
    publicResolver: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
  },
  134: {
    registry: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
    publicResolver: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
  },
};

const networkMap = {
  133: {
    name: 'viviani',
    chainId: 133,
    ensAddress: ensMap[133].registry,
  },
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
    1: 'https://v7.sms.mainnet.iex.ec',
    5: 'https://v7.sms.goerli.iex.ec',
    133: 'https://v7.sms.viviani.iex.ec',
    134: 'https://v7.sms.bellecour.iex.ec',
  },
  enterprise: {
    1: 'https://v7.sms-enterprise.mainnet.iex.ec',
    5: 'https://v7.sms-enterprise.goerli.iex.ec',
  },
};

const resultProxyMap = {
  standard: {
    1: 'https://v7.result.mainnet.iex.ec',
    5: 'https://v7.result.goerli.iex.ec',
    133: 'https://v7.result.viviani.iex.ec',
    134: 'https://v7.result.bellecour.iex.ec',
  },
  enterprise: {
    1: 'https://v7.result-enterprise.mainnet.iex.ec',
    5: 'https://v7.result-enterprise.goerli.iex.ec',
  },
};

const bridgeMap = {
  standard: {
    1: {
      contract: '0x4e55c9B8953AB1957ad0A59D413631A66798c6a2',
      bridgedChainId: '134',
    },
    5: {
      contract: '0x1e32aFA55854B6c015D284E3ccA9aA5a463A1418',
      bridgedChainId: '133',
    },
    133: {
      contract: '0x63CBf84596d0Dc13fCE1d8FA4470dc208390998a',
      bridgedChainId: '5',
    },
    134: {
      contract: '0x188A4376a1D818bF2434972Eb34eFd57102a19b7',
      bridgedChainId: '1',
    },
  },
  enterprise: {},
};

const enterpriseEnabledMap = {
  1: true,
  5: true,
};

const ipfsGatewayMap = {};

const iexecGatewayMap = {
  standard: {
    default: 'https://v7.api.market.iex.ec',
  },
  enterprise: {
    default: 'https://v7.api-enterprise.market.iex.ec',
  },
};

const idMap = {
  mainnet: 1,
  goerli: 5,
  viviani: 133,
  bellecour: 134,
};

const getId = (idOrName) => idMap[idOrName] || idOrName;

const getChainDefaults = ({ id, flavour }) => ({
  host: hostMap[id],
  hub: hubMap[flavour] && hubMap[flavour][id],
  sms: smsMap[flavour] && smsMap[flavour][id],
  ensRegistry: ensMap[id] && ensMap[id].registry,
  ensPublicResolver: ensMap[id] && ensMap[id].publicResolver,
  resultProxy: resultProxyMap[flavour] && resultProxyMap[flavour][id],
  ipfsGateway:
    (ipfsGatewayMap[flavour] &&
      (ipfsGatewayMap[flavour][id] || ipfsGatewayMap[flavour].default)) ||
    'https://v7.ipfs.iex.ec',
  iexecGateway:
    (iexecGatewayMap[flavour] &&
      (iexecGatewayMap[flavour][id] || iexecGatewayMap[flavour].default)) ||
    'https://v7.api.market.iex.ec',
  bridge: bridgeMap[flavour] && bridgeMap[flavour][id],
  flavour,
  network: networkMap[id],
});

const isEnterpriseEnabled = (id) => !!enterpriseEnabledMap[id];

module.exports = {
  getId,
  getChainDefaults,
  isEnterpriseEnabled,
};
