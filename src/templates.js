const main = {
  description: 'My iExec ressource description',
  license: 'MIT',
  author: '?',
  social: {
    website: '?',
    github: '?',
  },
  logo: 'logo.png',
};

const app = {
  name: 'my-dapp',
  price: 1,
  params: {
    type: 'DOCKER',
    envvars: 'XWDOCKERIMAGE=hello-world',
  },
};

const dataset = {
  name: 'my-dataset',
  price: 2,
  params: {
    arg1: 'value1',
  },
};

const workerPool = {
  description: 'my-workerpool',
  subscriptionLockStakePolicy: 100,
  subscriptionMinimumStakePolicy: 100,
  subscriptionMinimumScorePolicy: 100,
};

const category = {
  name: 'CAT1',
  description: 'new hub category',
  workClockTimeRef: 100,
};

const chains = {
  chains: {
    dev: {
      host: 'http://localhost:8545',
      id: '1337',
      server: 'https://localhost:443',
      hub: '0xc4e4a08bf4c6fd11028b714038846006e27d7be8',
    },
    ropsten: {
      host: 'https://ropsten.infura.io/berv5GTB5cSdOJPPnqOq',
      id: '3',
      server: 'https://testxw.iex.ec:443',
    },
    rinkeby: {
      host: 'https://rinkeby.infura.io/berv5GTB5cSdOJPPnqOq',
      id: '4',
      server: 'https://testxw.iex.ec:443',
    },
    kovan: {
      host: 'https://kovan.infura.io/berv5GTB5cSdOJPPnqOq',
      id: '42',
      server: 'https://testxw.iex.ec:443',
    },
    mainnet: {
      host: 'https://mainnet.infura.io/berv5GTB5cSdOJPPnqOq ',
      id: '1',
      server: 'https://mainxw.iex.ec:443',
    },
  },
};

module.exports = {
  main,
  app,
  dataset,
  workerPool,
  category,
  chains,
};
