const wallet = require('./wallet');
const account = require('./account');
const hub = require('./hub');
const order = require('./order');
const orderbook = require('./orderbook');
const deal = require('./deal');
const task = require('./task');
const utils = require('./utils');

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
