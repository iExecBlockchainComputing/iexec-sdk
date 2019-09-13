const Debug = require('debug');
const { http } = require('./utils');
const { getAddress } = require('./wallet');
const { addressSchema, stringSchema, throwIfMissing } = require('./validator');
const { wrapPersonalSign } = require('./errorWrappers');

const debug = Debug('iexec:tee');

const secretEndpoit = address => `/secret/${address}`;
const secretPrefix = 'iexec_sms_secret:';

const pushSecret = async (
  contracts = throwIfMissing(),
  smsUrl = throwIfMissing(),
  resourceAddress = throwIfMissing(),
  secret = throwIfMissing(),
) => {
  try {
    const vResourceAddress = await addressSchema().validate(resourceAddress);
    const vSignerAddress = await getAddress(contracts);
    await stringSchema().validate(secret, { strict: true });

    const personnalSign = data => new Promise((resolve, reject) => {
      contracts.ethProvider.sendAsync(
        {
          method: 'personal_sign',
          params: [vSignerAddress, data],
        },
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
    const sign = await wrapPersonalSign(
      personnalSign(secretPrefix.concat(secret)),
    );
    const res = await http.post(
      secretEndpoit(vResourceAddress),
      { secret, sign },
      {},
      smsUrl,
    );
    if (res.ok) {
      return res.data;
    }
    throw Error(`SMS answered with error: ${res.errorMessage}`);
  } catch (error) {
    debug('pushSecret()', error);
    throw error;
  }
};

const checkSecret = async (
  smsUrl = throwIfMissing(),
  resourceAddress = throwIfMissing(),
) => {
  try {
    const vResourceAddress = await addressSchema().validate(resourceAddress);
    const res = await http.get(secretEndpoit(vResourceAddress), {}, {}, smsUrl);
    if (res.ok) {
      return res.data;
    }
    throw Error(`SMS answered with error: ${res.errorMessage}`);
  } catch (error) {
    debug('checkSecret()', error);
    throw error;
  }
};

module.exports = {
  pushSecret,
  checkSecret,
};
