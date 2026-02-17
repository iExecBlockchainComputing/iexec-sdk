import { IEXEC_REQUEST_PARAMS } from '../../common/utils/constant.js';

export const main = {
  description:
    'My iExec resource description, must be at least 150 chars long in order to pass the validation checks. Describe your application, dataset or workerpool to your users',
  license: 'MIT',
  author: '?',
  social: {
    website: '?',
    github: '?',
  },
  logo: 'logo.png',
};

export const app = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'hello-world',
  type: 'DOCKER',
  multiaddr: 'iexechub/python-hello-world:8.0.4',
  checksum:
    '0xb0b664b7a6d249f81c067a9262b1763144eeb3ca63e553567f71673442ce9e84',
};

export const sconeTeeApp = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'hello-world-scone',
  type: 'DOCKER',
  multiaddr:
    'docker.io/iexechub/python-hello-world:8.0.0-sconify-5.9.1-v15-production',
  checksum:
    '0x15de77fd7ac448028884256b3ab376e7d4560e9ef6acf0594ea0b3c031d5d395',
  mrenclave: {
    framework: 'SCONE',
    version: 'v5.9',
    entrypoint: 'python /app/app.py',
    heapSize: 1073741824,
    fingerprint:
      '2d4b9efd066d0bb058b8da79bf8551be7d244779bc41d03a12201a4004779609',
  },
};

export const gramineTeeApp = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'hello-world-gramine',
  type: 'DOCKER',
  multiaddr: 'iexechub/tee-python-hello-world:8.0.3-gramine',
  checksum:
    '0x8e13b1592bff2e1651225b1533282ed2e1939ce173c9f0c2c39ed02a4963401f',
  mrenclave: {
    framework: 'GRAMINE',
    version: 'v0',
    fingerprint:
      'c879351b3640a21331c4d931d3e32bfbb8373b502966f9c639538666b2cf3641',
  },
};

export const buyConf = {
  params: {
    [IEXEC_REQUEST_PARAMS.IEXEC_ARGS]: '',
  },
  tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
  trust: '0',
  callback: '0x0000000000000000000000000000000000000000',
};

export const dataset = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'my-dataset',
  multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
  checksum:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
};

export const compatibleDapp = {
  name: 'Recommended-dapp-for-MyDataset',
  addresses: {
    5: '0x0000000000000000000000000000000000000000',
  },
  buyConf,
};

export const dapps = [compatibleDapp];

export const workerpool = {
  owner: '0x0000000000000000000000000000000000000000',
  description: 'my-workerpool',
};

export const order = {
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
      [IEXEC_REQUEST_PARAMS.IEXEC_ARGS]: '',
      [IEXEC_REQUEST_PARAMS.IEXEC_INPUT_FILES]: [],
      [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_ENCRYPTION]: false, // todo remove from default
    },
  },
};

export const category = {
  name: 'XXL',
  description: 'new hub category',
  workClockTimeRef: '100',
};

export const chains = {
  default: 'bellecour',
  chains: {
    mainnet: {},
    bellecour: {},
    'arbitrum-mainnet': {},
  },
};

export const createOrder = (orderName, overwrite = {}) => ({
  ...order[orderName],
  ...overwrite,
});
export const overwriteObject = (obj, overwrite = {}) => ({
  ...obj,
  ...overwrite,
});

export default {
  app,
  dataset,
  workerpool,
  category,
};
