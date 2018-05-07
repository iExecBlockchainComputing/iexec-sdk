const wallet = require('./wallet');
const account = require('./account');
const hub = require('./hub');
const utils = require('./utils');

const sdk = {
  wallet,
  account,
  hub,
  utils,
};

module.exports = sdk;
