import Debug from 'debug';
import querystring from 'query-string';
import { hashEIP712 } from './sig-utils.js';
import { wrapSignTypedData } from './errorWrappers.js';
import { ApiCallError } from './errors.js';

const debug = Debug('iexec:api-utils');

const makeBody = (method, body) => {
  if (method === 'POST' || method === 'PUT') {
    if (typeof body === 'object') {
      return { body: JSON.stringify(body) };
    }
    return { body };
  }
  return {};
};

const makeQueryString = (queryParams) => {
  if (Object.keys(queryParams).length !== 0) {
    return '?'.concat(querystring.stringify(queryParams));
  }
  return '';
};

const makeHeaders = (method, headers, body) => {
  const generatedHeaders = {};
  if (method === 'POST' || method === 'PUT') {
    generatedHeaders['Content-Type'] =
      typeof body === 'object' ? 'application/json' : 'text/plain';
  }
  return { headers: { ...generatedHeaders, ...headers } };
};

export const httpRequest =
  (method) =>
  async ({
    api,
    endpoint = '',
    query = {},
    body = {},
    headers = {},
    ApiCallErrorClass = ApiCallError,
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
    const baseURL = new URL(endpoint, api).href;
    const queryString = makeQueryString(query);
    const url = baseURL.concat(queryString);
    return fetch(url, {
      method,
      ...makeHeaders(method, headers, body),
      ...makeBody(method, body),
    })
      .catch((error) => {
        debug(`httpRequest() fetch:`, error);
        throw new ApiCallErrorClass(
          `Connection to ${baseURL} failed with a network error`,
          error,
        );
      })
      .then((response) => {
        if (response.status >= 500 && response.status <= 599) {
          throw new ApiCallErrorClass(
            `Server at ${baseURL} encountered an internal error`,
            Error(
              `Server internal error: ${response.status} ${response.statusText}`,
            ),
          );
        }
        return response;
      });
  };

const responseToJson = async (response) => {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    if (response.ok) {
      return response.json();
    }
    const errorMessage = await response
      .json()
      .then((json) => json && json.error)
      .catch(() => {});
    if (errorMessage) throw new Error(`API error: ${errorMessage}`);
    throw Error(`API error: ${response.status} ${response.statusText}`);
  }
  throw new Error('The http response is not of JSON type');
};

export const wrapPaginableRequest = (request) => async (args) => {
  const { pageIndex = 0 } = args.query;
  return request(args).then(({ nextPage, ...rest }) => ({
    ...rest,
    ...(nextPage && {
      more: () =>
        wrapPaginableRequest(request)({
          ...args,
          query: { ...args.query, pageIndex: pageIndex + 1 },
        }),
    }),
  }));
};

export const jsonApi = {
  get: (args) =>
    httpRequest('GET')({
      ...args,
      ...{ headers: { Accept: 'application/json', ...args.headers } },
    }).then(responseToJson),
  post: (args) =>
    httpRequest('POST')({
      ...args,
      ...{ headers: { Accept: 'application/json', ...args.headers } },
    }).then(responseToJson),
  put: (args) =>
    httpRequest('PUT')({
      ...args,
      ...{ headers: { Accept: 'application/json', ...args.headers } },
    }).then(responseToJson),
};

export const downloadZipApi = {
  get: (args) =>
    httpRequest('GET')({
      ...args,
      ...{ headers: { Accept: 'application/zip', ...args.headers } },
    }).then((response) => {
      if (!response.ok) {
        throw Error(
          `API error: ${response.status} ${
            response.statusText ? response.statusText : ''
          }`,
        );
      }
      return response;
    }),
};

export const getAuthorization = async ({
  api,
  endpoint,
  ApiCallErrorClass,
  chainId,
  address,
  signer,
}) => {
  const challenge = await jsonApi.get({
    api,
    endpoint,
    query: {
      chainId,
      address,
    },
    ApiCallErrorClass,
  });
  try {
    const typedData = challenge.data || challenge;
    const { domain, message } = typedData || {};
    const { EIP712Domain, ...types } = typedData.types || {};
    if (!domain || !types || !message) {
      throw Error('Unexpected challenge format');
    }
    const sign = await wrapSignTypedData(
      signer.signTypedData(domain, types, message),
    );
    const hash = hashEIP712(typedData);
    const separator = '_';
    return hash
      .concat(separator)
      .concat(sign)
      .concat(separator)
      .concat(address);
  } catch (error) {
    debug('getAuthorization()', error);
    throw Error(`Failed to get authorization: ${error}`);
  }
};
