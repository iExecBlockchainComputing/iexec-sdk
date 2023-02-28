const { paramsKeyName } = require('../../common/utils/params-utils');

const main = {
  description:
    'My iExec ressource description, must be at least 150 chars long in order to pass the validation checks. Describe your application, dataset or workerpool to your users',
  license: 'MIT',
  author: '?',
  social: {
    website: '?',
    github: '?',
  },
  logo: 'logo.png',
};

const app = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'python-hello-world',
  type: 'DOCKER',
  multiaddr: 'iexechub/python-hello-world:7.0.5',
  checksum:
    '0xaea3f77f09567fa0da20b86d9b7dac3ef958b7d4751a37cfa7cd7851f57ac191',
};

const teeApp = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'tee-python-hello-world',
  type: 'DOCKER',
  multiaddr: 'iexechub/python-hello-world:7.0.5-sconify-5.3.15-v8-production',
  checksum:
    '0x14013dea6c0c8e1bd95b549a5bdc97383f45beeecf874d9c61cd34f21159364e',
  mrenclave: {
    provider: 'SCONE',
    version: 'v5',
    entrypoint: 'python /app/app.py',
    heapSize: 1073741824,
    fingerprint:
      '9be0cccb597e038e9445f4c418c8f8335257a94d7331ba01ee52c43285e38aeb',
  },
};

const buyConf = {
  params: {
    [paramsKeyName.IEXEC_ARGS]: '',
  },
  tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
  trust: '0',
  callback: '0x0000000000000000000000000000000000000000',
};

const dataset = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'my-dataset',
  multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
  checksum:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
};

const compatibleDapp = {
  name: 'Recomanded-dapp-for-MyDataset',
  addresses: {
    5: '0x0000000000000000000000000000000000000000',
  },
  buyConf,
};

const dapps = [compatibleDapp];

const workerpool = {
  owner: '0x0000000000000000000000000000000000000000',
  description: 'my-workerpool',
};

const order = {
  apporder: {
    app: '0x0000000000000000000000000000000000000000',
    appprice: '0',
    volume: '1000000',
    tag: [],
    datasetrestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
    workerpoolrestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
    requesterrestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
  },
  datasetorder: {
    dataset: '0x0000000000000000000000000000000000000000',
    datasetprice: '0',
    volume: '1000000',
    tag: [], // todo remove from default
    apprestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
    workerpoolrestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
    requesterrestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
  },
  workerpoolorder: {
    workerpool: '0x0000000000000000000000000000000000000000',
    workerpoolprice: '0',
    volume: '1',
    category: '0',
    trust: '0',
    tag: [], // todo remove from default
    apprestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
    datasetrestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
    requesterrestrict: '0x0000000000000000000000000000000000000000', // todo remove from default
  },
  requestorder: {
    app: '0x0000000000000000000000000000000000000000',
    appmaxprice: '0',
    dataset: '0x0000000000000000000000000000000000000000',
    datasetmaxprice: '0',
    workerpool: '0x0000000000000000000000000000000000000000',
    workerpoolmaxprice: '0',
    volume: '1',
    category: '0',
    trust: '0', // todo remove from default
    tag: [], // todo remove from default
    beneficiary: '0x0000000000000000000000000000000000000000', // todo remove from default
    callback: '0x0000000000000000000000000000000000000000', // todo remove from default
    params: {
      [paramsKeyName.IEXEC_ARGS]: '',
      [paramsKeyName.IEXEC_INPUT_FILES]: [],
      [paramsKeyName.IEXEC_RESULT_ENCRYPTION]: false, // todo remove from default
    },
  },
};

const category = {
  name: 'XXL',
  description: 'new hub category',
  workClockTimeRef: '100',
};

const chains = {
  default: 'viviani',
  chains: {
    // dev: {
    //   host: 'http://localhost:8545',
    //   id: '65535',
    //   sms: 'http://localhost:5000',
    //   resultProxy: 'http://localhost:8089',
    //   ipfsGateway: 'http://localhost:8080',
    //   flavour: 'standard',
    //   hub: '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca',
    //   enterprise: {
    //     enterpriseSwapChainName: 'dev-enterprise',
    //   },
    // },
    // 'dev-enterprise': {
    //   host: 'http://localhost:8545',
    //   id: '65535',
    //   sms: 'http://localhost:5000',
    //   resultProxy: 'http://localhost:8089',
    //   ipfsGateway: 'http://localhost:8080',
    //   flavour: 'enterprise',
    //   hub: '0xb80C02d24791fA92fA8983f15390274698A75D23',
    //   enterprise: {
    //     enterpriseSwapChainName: 'dev',
    //   },
    // },
    goerli: {},
    viviani: {},
    mainnet: {},
    bellecour: {},
    enterprise: {},
    'enterprise-testnet': {},
  },
};

const createOrder = (orderName, overwrite = {}) => ({
  ...order[orderName],
  ...overwrite,
});
const overwriteObject = (obj, overwrite = {}) => ({ ...obj, ...overwrite });

module.exports = {
  main,
  app,
  teeApp,
  dataset,
  workerpool,
  category,
  buyConf,
  dapps,
  chains,
  overwriteObject,
  createOrder,
};
