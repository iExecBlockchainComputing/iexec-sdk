const main = {
  description:
    'My iExec ressource description, must be at least 150 chars long in order to pass the validation checks. Describe to your users what your application does',
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
  name: 'my-app',
  multiaddr: '/dns4/hub.docker.com/tcp/443',
  mrenclave: '',
};

const dataset = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'my-dataset',
  multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
};

const workerpool = {
  owner: '0x0000000000000000000000000000000000000000',
  description: 'my-workerpool',
};

const order = {
  apporder: {
    app: '0x0000000000000000000000000000000000000000',
    appprice: '0',
    volume: '1',
    tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
    datasetrestrict: '0x0000000000000000000000000000000000000000',
    workerpoolrestrict: '0x0000000000000000000000000000000000000000',
    requesterrestrict: '0x0000000000000000000000000000000000000000',
  },
  datasetorder: {
    dataset: '0x0000000000000000000000000000000000000000',
    datasetprice: '0',
    volume: '1',
    tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
    apprestrict: '0x0000000000000000000000000000000000000000',
    workerpoolrestrict: '0x0000000000000000000000000000000000000000',
    requesterrestrict: '0x0000000000000000000000000000000000000000',
  },
  workerpoolorder: {
    workerpool: '0x0000000000000000000000000000000000000000',
    workerpoolprice: '0',
    volume: '1',
    category: '1',
    trust: '100',
    tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
    apprestrict: '0x0000000000000000000000000000000000000000',
    datasetrestrict: '0x0000000000000000000000000000000000000000',
    requesterrestrict: '0x0000000000000000000000000000000000000000',
  },
  requestorder: {
    app: '0x0000000000000000000000000000000000000000',
    appmaxprice: '0',
    dataset: '0x0000000000000000000000000000000000000000',
    datasetmaxprice: '0',
    workerpool: '0x0000000000000000000000000000000000000000',
    workerpoolmaxprice: '0',
    volume: '1',
    category: '1',
    trust: '100',
    tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
    beneficiary: '0x0000000000000000000000000000000000000000',
    callback: '0x0000000000000000000000000000000000000000',
    params: "{ cmdline: '--help' }",
  },
};

const category = {
  name: 'CAT1',
  description: 'new hub category',
  workClockTimeRef: '100',
};

const chains = {
  default: 'kovan',
  chains: {
    dev: {
      host: 'http://localhost:8545',
      id: '17',
      hub: '0x60E25C038D70A15364DAc11A042DB1dD7A2cccBC',
      scheduler: 'https://pool1api.iex.ec',
    },
    ropsten: {
      host: 'https://ropsten.infura.io/v3/b2fd33d1c9cc440ba84752c2a4cf949d',
      id: '3',
    },
    rinkeby: {
      host: 'https://rinkeby.infura.io/v3/b2fd33d1c9cc440ba84752c2a4cf949d',
      id: '4',
    },
    kovan: {
      host: 'https://kovan.infura.io/v3/b2fd33d1c9cc440ba84752c2a4cf949d',
      id: '42',
    },
    mainnet: {
      host: 'https://mainnet.infura.io/v3/b2fd33d1c9cc440ba84752c2a4cf949d',
      id: '1',
    },
  },
};

const createOrder = (orderName, overwrite = {}) => Object.assign({}, order[orderName], overwrite);
const overwriteObject = (obj, overwrite = {}) => Object.assign({}, obj, overwrite);

module.exports = {
  main,
  app,
  dataset,
  workerpool,
  category,
  chains,
  overwriteObject,
  createOrder,
};
