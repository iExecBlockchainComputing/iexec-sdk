const Debug = require('debug');
const fetch = require('node-fetch');
const querystring = require('querystring');

const debug = Debug('iexec:api');
const API_BASE_URL = 'https://auth.iex.ec/';
// const API_BASE_URL = 'http://localhost:3200/';

const makeBody = (verb, body) => {
  if (verb === 'GET') return {};
  return { body: JSON.stringify(body) };
};

const makeQueryString = (verb, body) => {
  debug(Object.keys(body).length);
  if (verb === 'GET' && Object.keys(body).length !== 0) return '?'.concat(querystring.stringify(body));
  return '';
};

const httpRequest = verb => async (endpoint, body = {}) => {
  const queryString = makeQueryString(verb, body);
  debug('queryString', queryString);
  const url = API_BASE_URL.concat(endpoint, queryString);
  debug('url', url);
  const response = await fetch(url, {
    method: verb,
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
    },
    ...makeBody(verb, body),
  });
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    const json = await response.json();
    if (json.ok) return json;
    if (json.error) throw new Error(json.error);
  } else {
    throw new Error('the http response is not of JSON type');
  }
  throw new Error('API call error');
};

module.exports = {
  get: httpRequest('GET'),
  post: httpRequest('POST'),
};
