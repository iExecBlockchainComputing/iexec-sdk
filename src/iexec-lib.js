const wallet = require('./wallet');
const account = require('./account');
const hub = require('./hub');
const order = require('./order');
const orderbook = require('./orderbook');
const deal = require('./deal');
const utils = require('./utils');

const sdk = {
  wallet,
  account,
  order,
  orderbook,
  deal,
  hub,
  utils,
};

module.exports = sdk;
