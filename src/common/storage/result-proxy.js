import Debug from 'debug';
import { getAddress } from '../wallet/address.js';
import { getAuthorization, httpRequest } from '../utils/api-utils.js';
import { throwIfMissing } from '../utils/validator.js';
import { checkSigner } from '../utils/utils.js';
import { ResultProxyCallError } from '../utils/errors.js';

const debug = Debug('iexec:storage:result-proxy');

export const login = async (
  contracts = throwIfMissing(),
  resultProxyURL = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const userAddress = await getAddress(contracts);
    const authorization = await getAuthorization({
      api: resultProxyURL,
      endpoint: '/results/challenge',
      chainId: contracts.chainId,
      address: userAddress,
      signer: contracts.signer,
      ApiCallErrorClass: ResultProxyCallError,
    });
    const res = await httpRequest('POST')({
      api: resultProxyURL,
      endpoint: '/results/login',
      query: { chainId: contracts.chainId },
      body: authorization,
      ApiCallErrorClass: ResultProxyCallError,
    });
    if (res.ok) {
      return await res.text();
    }
    throw new Error(
      `Result Proxy login failed: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('login()', error);
    throw error;
  }
};
