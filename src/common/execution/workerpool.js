import Debug from 'debug';
import {
  throwIfMissing,
  addressSchema,
  workerpoolApiUrlSchema,
} from '../utils/validator';
import { lookupAddress } from '../ens/resolution';
import { setTextRecord } from '../ens/text-record';
import { WORKERPOOL_URL_TEXT_RECORD_KEY } from '../utils/constant';

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
