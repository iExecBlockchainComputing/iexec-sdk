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

const sellLimitOrder = {
  category: 1,
  value: 1,
  workerpool: '0x597fa45586a1f4879605c0b8c04c4100a918ee0d',
  volume: 1,
};

const buyMarketOrder = {
  app: '0x88f29bef874957012ed55fd4968c296c9e4ec69e',
  dataset: '0xcc4859eadf58b1507a6dc0c031715c8089ec03aa',
  params: '{"cmdline":"--help"}',
};

const defaultOrder = {
  sell: sellLimitOrder,
  buy: buyMarketOrder,
};

const createOrder = (side) => {
  if (side === 'buy') return buyMarketOrder;
  return sellLimitOrder;
};

module.exports = {
  main,
  app,
  dataset,
  workerPool,
  category,
  chains,
  defaultOrder,
  createOrder,
};
