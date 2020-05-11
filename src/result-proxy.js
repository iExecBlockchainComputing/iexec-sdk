const Debug = require('debug');
const qs = require('query-string');
const { getAddress } = require('./wallet');
const { getAuthorization, throwIfMissing, httpCall } = require('./utils');

const debug = Debug('iexec:result-proxy');

const login = async (
  contracts = throwIfMissing(),
  resultProxyURL = throwIfMissing(),
) => {
  try {
    const userAddress = await getAddress(contracts);
    const authorization = await getAuthorization(
      contracts.chainId,
      userAddress,
      contracts.jsonRpcProvider,
      { apiURL: resultProxyURL, challengeEndpoint: '/results/challenge' },
    );
    debug(authorization);
    const res = await httpCall('POST')(
      `${resultProxyURL}/results/login?${qs.stringify({
        chainId: contracts.chainId,
      })}`,
      authorization,
    ).catch((e) => {
      debug(e);
      throw Error(`result proxy at ${resultProxyURL} didn't answered`);
    });
    if (res.ok) {
      const token = await res.text();
      return token;
    }
    throw Error(`result proxy login failed: ${res.status} ${res.statusText}`);
  } catch (error) {
    debug('login()', error);
    throw error;
  }
};

module.exports = {
  login,
};
