const wallet = require('./wallet');
const account = require('./account');
const hub = require('./hub');
const order = require('./order');
const orderbook = require('./orderbook');
const deal = require('./deal');
const task = require('./task');
const {
  NULL_ADDRESS,
  NULL_BYTES32,
  getSalt,
  checksummedAddress,
  isEthAddress,
  isBytes32,
} = require('./utils');

const utils = {
  NULL_ADDRESS,
  NULL_BYTES32,
  getSalt,
  isEthAddress,
  isBytes32,
  checksummedAddress,
};

const sdk = {
  wallet,
  account,
  order,
  orderbook,
  deal,
  task,
  hub,
  utils,
};

module.exports = sdk;
