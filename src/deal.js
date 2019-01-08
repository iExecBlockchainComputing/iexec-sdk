const Debug = require('debug');
const { http, isBytes32 } = require('./utils');

const debug = Debug('iexec:deal');
const objName = 'deal';

const show = async (contracts, dealid) => {
  try {
    if (!isBytes32(dealid, { strict: false })) throw Error('invalid dealid');
    const { chainID } = contracts;
    const body = { chainID, dealid };
    const { deal } = await http.post('deal', body);
    return deal;
  } catch (error) {
    debug('show()', error);
    throw error;
  }
};

const claim = async (contracts, dealid, userAddress) => {
  try {
    throw new Error('Not implemented');
  } catch (error) {
    debug('claim()', error);
    throw error;
  }
};

module.exports = {
  show,
  claim,
};
