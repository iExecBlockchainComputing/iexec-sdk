const Debug = require('debug');
const fetch = require('cross-fetch');
const qs = require('query-string');
const { hashEIP712 } = require('./sig-utils');
const { wrapSignTypedDataV3 } = require('./errorWrappers');

const debug = Debug('iexec:api-utils');

const IEXEC_GATEWAY_URL = 'https://gateway.iex.ec';

const makeBody = (method, body) => {
  if (method === 'POST' || method === 'PUT') {
    if (typeof body === 'object') {
      return { body: JSON.stringify(body) };
    }
    return { body };
  }
  return {};
};

const makeQueryString = (method, queryParams) => {
  if (Object.keys(queryParams).length !== 0) {
    return '?'.concat(qs.stringify(queryParams));
  }
  return '';
};

const makeHeaders = (method, headers, body) => {
  const generatedHeaders = {};
  if (method === 'POST' || method === 'PUT') {
    generatedHeaders['Content-Type'] = typeof body === 'object' ? 'application/json' : 'text/plain';
  }
  return { headers: { ...generatedHeaders, ...headers } };
};

const httpRequest = method => async ({
  api,
  endpoint,
  query = {},
  body = {},
  headers = {},
}) => {
  debug(
    'httpRequest()',
    '\nmethod',
    method,
    '\napi',
    api,
    '\nendpoint',
    endpoint,
    '\nquery',
    query,
    '\nbody',
    body,
    '\nheaders',
    headers,
  );
  const baseURL = api;
  const queryString = makeQueryString(method, query);
  const url = baseURL.concat(endpoint, queryString);
  debug('makeBody()', makeBody(method, body));
  const response = await fetch(url, {
    method,
    ...makeHeaders(method, headers, body),
    ...makeBody(method, body),
  });
  return response;
};

const checkResponseOk = (response) => {
  if (!response.ok) {
    throw Error(
      `API call error: ${response.status} ${
        response.statusText ? response.statusText : ''
      }`,
    );
  }
  return response;
};

const responseToJson = async (response) => {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    const json = await response.json();
    if (json.error) throw new Error(`API error: ${json.error}`);
    if (response.status === 200 && json) return json;
  }
  throw new Error('The http response is not of JSON type');
};

const jsonApi = {
  get: args => httpRequest('GET')({
    ...args,
    ...{ headers: { Accept: 'application/json', ...args.headers } },
  }).then(responseToJson),
  post: args => httpRequest('POST')({
    ...args,
    ...{ headers: { Accept: 'application/json', ...args.headers } },
  }).then(responseToJson),
};

const downloadApi = {
  get: args => httpRequest('GET')({
    ...args,
    ...{ headers: { Accept: 'application/zip', ...args.headers } },
  }).then(checkResponseOk),
  post: args => httpRequest('POST')({
    ...args,
    ...{ headers: { Accept: 'application/zip', ...args.headers } },
  }).then(checkResponseOk),
};

const signTypedDatav3 = async (eth, address, typedData) => {
  const signTDv3 = td => eth.send('eth_signTypedData_v3', [address, JSON.stringify(td)]);
  const sign = await wrapSignTypedDataV3(signTDv3(typedData));
  return sign;
};

const getAuthorization = (api, endpoint = '/challenge') => async (
  chainId,
  address,
  ethProvider,
) => {
  try {
    const challenge = await jsonApi.get({
      api,
      endpoint,
      query: {
        chainId,
        address,
      },
    });
    const typedData = challenge.data || challenge;
    const sign = await signTypedDatav3(ethProvider, address, typedData);
    const hash = hashEIP712(typedData);
    const separator = '_';
    const authorization = hash
      .concat(separator)
      .concat(sign)
      .concat(separator)
      .concat(address);
    return authorization;
  } catch (error) {
    debug('getAuthorization()', error);
    throw Error('Failed to get authorization');
  }
};

module.exports = {
  httpRequest,
  jsonApi,
  downloadApi,
  getAuthorization,
  IEXEC_GATEWAY_URL,
};
