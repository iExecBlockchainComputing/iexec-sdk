import Debug from 'debug';
import { getAddress } from '../wallet/address.js';
import { getAuthorization, httpRequest } from '../utils/api-utils.js';
import { throwIfMissing } from '../utils/validator.js';
import { checkSigner } from '../utils/utils.js';

const debug = Debug('iexec:storage:result-proxy');

export const login = async (
  contracts = throwIfMissing(),
  resultProxyURL = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
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
