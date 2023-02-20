import Debug from 'debug';
import {
  throwIfMissing,
  addressSchema,
  workerpoolApiUrlSchema,
} from '../utils/validator.js';
import { lookupAddress } from '../ens/resolution.js';
import { setTextRecord } from '../ens/text-record.js';
import { WORKERPOOL_URL_TEXT_RECORD_KEY } from '../utils/constant.js';

const debug = Debug('iexec:execution:workerpool');

export const setWorkerpoolApiUrl = async (
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
    return await setTextRecord(
      contracts,
      name,
      WORKERPOOL_URL_TEXT_RECORD_KEY,
      vUrl,
    );
  } catch (e) {
    debug('setWorkerpoolApiUrl()', e);
    throw e;
  }
};
