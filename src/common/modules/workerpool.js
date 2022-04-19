const Debug = require('debug');
const {
  throwIfMissing,
  addressSchema,
  workerpoolApiUrlSchema,
} = require('../utils/validator');
const { lookupAddress } = require('../ens/resolution');
const { readTextRecord, setTextRecord } = require('../ens/text-record');

const debug = Debug('iexec:workerpool');

const WORKERPOOL_URL_TEXT_RECORD_KEY = 'iexec:workerpool-api:url';

const setWorkerpoolApiUrl = async (
  contracts = throwIfMissing(),
  workerpoolAddress,
  url,
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(workerpoolAddress);
    const vUrl = await workerpoolApiUrlSchema()
      .label('workerpool API url')
      .validate(url);
    const name = await lookupAddress(contracts, vAddress);
    if (!name) {
      throw Error(`No ENS name reverse resolution configured for ${vAddress}`);
    }
    const txHash = await setTextRecord(
      contracts,
      name,
      WORKERPOOL_URL_TEXT_RECORD_KEY,
      vUrl,
    );
    return txHash;
  } catch (e) {
    debug('setWorkerpoolApiUrl()', e);
    throw e;
  }
};

const getWorkerpoolApiUrl = async (
  contracts = throwIfMissing(),
  workerpoolAddress,
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .label('workerpool address')
      .validate(workerpoolAddress);
    const name = await lookupAddress(contracts, vAddress).catch(() => {
      /** return undefined */
    });
    if (!name) {
      return undefined;
    }
    const url = await readTextRecord(
      contracts,
      name,
      WORKERPOOL_URL_TEXT_RECORD_KEY,
    );
    const vUrl = await workerpoolApiUrlSchema()
      .required()
      .validate(url)
      .catch(() => {
        /** return undefined */
      });
    return vUrl;
  } catch (e) {
    debug('getWorkerpoolApiUrl()', e);
    throw e;
  }
};

module.exports = {
  setWorkerpoolApiUrl,
  getWorkerpoolApiUrl,
};
