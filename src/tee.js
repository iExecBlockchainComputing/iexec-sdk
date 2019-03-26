const Debug = require('debug');
const { throwIfMissing, http } = require('./utils');

const debug = Debug('iexec:tee');

const secretEndpoit = address => `/secret/${address}`;

const pushSecret = async (
  contracts = throwIfMissing(),
  smsUrl = throwIfMissing(),
  signerAddress = throwIfMissing(),
  resourceAddress = throwIfMissing(),
  secret = throwIfMissing(),
) => {
  try {
    const signMessage = data => new Promise((resolve, reject) => {
      contracts.ethProvider.sendAsync(
        {
          method: 'personal_sign',
          params: [signerAddress, data],
        },
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        },
      );
    });
    const sign = await signMessage(secret);
    const res = await http.post(
      secretEndpoit(resourceAddress),
      { secret, sign },
      {},
      smsUrl,
    );
    return res;
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
    const res = await http.get(secretEndpoit(resourceAddress), {}, {}, smsUrl);
    return res;
  } catch (error) {
    debug('checkSecret()', error);
    throw error;
  }
};

module.exports = {
  pushSecret,
  checkSecret,
};
