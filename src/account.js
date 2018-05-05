const Debug = require('debug');
const { Spinner, info } = require('./cli-helper');

const debug = Debug('iexec:account');

const auth = async (address, iexec, eth) => {
  const spinner = Spinner();
  spinner.start(info.logging());

  const { message } = await iexec.getTypedMessage();
  debug('message', message);
  const msgJSON = JSON.stringify(message);

  const signature = await eth.signTypedData(message, address);
  debug('signature', signature);

  const { jwtoken } = await iexec.getJWTBySignature(
    msgJSON,
    address,
    signature,
  );
  debug('jwtoken', jwtoken);
  spinner.stop();
  return jwtoken;
};

module.exports = {
  auth,
};
