const wallet = require('./wallet');
const account = require('./account');
const hub = require('./hub');
const order = require('./order');
const utils = require('./utils');

const sdk = {
  wallet,
  account,
  order,
  hub,
  utils,
};

module.exports = sdk;
