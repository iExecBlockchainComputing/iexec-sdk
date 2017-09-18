const Debug = require('debug');
const Promise = require('bluebird');

const debug = Debug('iexec:utils');
const FETCH_INTERVAL = 1000;
const TIMEOUT = 60 * 1000;
const sleep = ms => new Promise(res => setTimeout(res, ms));

const waitFor = async (fn, hash) => {
  let counter = 0;
  try {
    const txReceipt = await fn(hash);
    if (counter < TIMEOUT && txReceipt === null) {
      await sleep(FETCH_INTERVAL);
      counter += FETCH_INTERVAL;
      return waitFor(fn, hash);
    } else if (counter > TIMEOUT) {
      throw Error('TIMEOUT: Transaction still not included in a Block');
    }
    return txReceipt;
  } catch (error) {
    debug('waitFor()', error);
    throw error;
  }
};

module.exports = {
  waitFor,
};
