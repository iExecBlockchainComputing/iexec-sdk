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
  params: {
    type: 'DOCKER',
    envvars: 'XWDOCKERIMAGE=hello-world',
  },
  hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

const dataset = {
  owner: '0x0000000000000000000000000000000000000000',
  name: 'my-dataset',
  params: {
    arg1: 'value1',
  },
  hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

const workerpool = {
  owner: '0x0000000000000000000000000000000000000000',
  description: 'my-workerpool',
  subscriptionLockStakePolicy: '100',
  subscriptionMinimumStakePolicy: '100',
  subscriptionMinimumScorePolicy: '100',
};

const order = {
  apporder: {
    dapp: '0x0000000000000000000000000000000000000000',
    dappprice: '0',
    volume: '1',
    tag: '0',
    datarestrict: '0x0000000000000000000000000000000000000000',
    poolrestrict: '0x0000000000000000000000000000000000000000',
    userrestrict: '0x0000000000000000000000000000000000000000',
  },
  dataorder: {
    data: '0x0000000000000000000000000000000000000000',
    dataprice: '0',
    volume: '1',
    tag: '0',
    dapprestrict: '0x0000000000000000000000000000000000000000',
    poolrestrict: '0x0000000000000000000000000000000000000000',
    userrestrict: '0x0000000000000000000000000000000000000000',
  },
  poolorder: {
    pool: '0x0000000000000000000000000000000000000000',
    poolprice: '0',
    volume: '1',
    category: '1',
    trust: '100',
    tag: '0',
    dapprestrict: '0x0000000000000000000000000000000000000000',
    datarestrict: '0x0000000000000000000000000000000000000000',
    userrestrict: '0x0000000000000000000000000000000000000000',
  },
  userorder: {
    dapp: '0x0000000000000000000000000000000000000000',
    dappmaxprice: '0',
    data: '0x0000000000000000000000000000000000000000',
    datamaxprice: '0',
    pool: '0x0000000000000000000000000000000000000000',
    poolmaxprice: '0',
    volume: '1',
    category: '1',
    trust: '100',
    tag: '0',
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
      hub: '0xc4e4a08bf4c6fd11028b714038846006e27d7be8',
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
