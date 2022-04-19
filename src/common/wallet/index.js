const address = require('./address');
const balance = require('./balance');
const bridge = require('./bridge');
const enterprise = require('./enterprise');
const faucet = require('./faucet');
const send = require('./send');

module.exports = {
  ...address,
  ...balance,
  ...bridge,
  ...enterprise,
  ...faucet,
  ...send,
};
