const Debug = require('debug');
const { getAddress } = require('./wallet');
const { getAuthorization, httpRequest } = require('../utils/api-utils');
const { throwIfMissing } = require('../utils/validator');

const debug = Debug('iexec:result-proxy');

const login = async (
  contracts = throwIfMissing(),
  resultProxyURL = throwIfMissing(),
) => {
  try {
    const userAddress = await getAddress(contracts);
    const authorization = await getAuthorization(
      resultProxyURL,
      '/results/challenge',
    )(contracts.chainId, userAddress, contracts.signer);
    const res = await httpRequest('POST')({
      api: resultProxyURL,
      endpoint: '/results/login',
      query: { chainId: contracts.chainId },
      body: authorization,
    }).catch((e) => {
      debug(e);
      throw Error(`Result Proxy at ${resultProxyURL} didn't answered`);
    });
    if (res.ok) {
      const token = await res.text();
      return token;
    }
    throw Error(`Result Proxy login failed: ${res.status} ${res.statusText}`);
  } catch (error) {
    debug('login()', error);
    throw error;
  }
};

module.exports = {
  login,
};
