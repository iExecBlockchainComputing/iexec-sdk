const Debug = require('debug');
const {
  throwIfMissing,
  addressSchema,
  workerpoolApiUrlSchema,
} = require('../utils/validator');
const { lookupAddress } = require('../ens/resolution');
const { setTextRecord } = require('../ens/text-record');
const { WORKERPOOL_URL_TEXT_RECORD_KEY } = require('../utils/constant');

const debug = Debug('iexec:execution:workerpool');

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

module.exports = {
  setWorkerpoolApiUrl,
};
