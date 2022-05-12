#!/usr/bin/env node

// const Debug = require('debug');
const cli = require('commander');
const { checkRequesterSecretExists } = require('../../common/sms/check');
const { pushRequesterSecret } = require('../../common/sms/push');
const {
  finalizeCli,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
  getPropertyFormChain,
} = require('../utils/cli-helper');
const { loadChain, connectKeystore } = require('../utils/chains');
const { Keystore } = require('../utils/keystore');

// const debug = Debug('iexec:iexec-requester');

cli.name('iexec requester').usage('<command> [options]');

const pushSecret = cli.command('push-secret <name> <value>');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.secretPath())
  .description(desc.pushResultKey())
  .action(async (name, value, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(Object.assign(walletOptions));
      const [chain] = await Promise.all([
        loadChain(opts.chain, {
          spinner,
        }),
        keystore.accounts(),
      ]);
      await connectKeystore(chain, keystore);
      const { contracts } = chain;
      const sms = getPropertyFormChain(chain, 'sms');

      const { isPushed } = await pushRequesterSecret(
        contracts,
        sms,
        name,
        value,
      );
      if (isPushed) {
        spinner.succeed(`Secret "${name}" successfully pushed`, {
          raw: { isPushed, name },
        });
      } else {
        throw Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const checkSecret = cli.command('check-secret <name> [address]');
addGlobalOptions(checkSecret);
addWalletLoadOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .description(desc.checkSecret())
  .action(async (name, address, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const chain = await loadChain(opts.chain, {
        spinner,
      });
      let keyAddress;
      if (address) {
        keyAddress = address;
      } else {
        [keyAddress] = await keystore.accounts();
        spinner.info(
          `Checking secret "${name}" exists for wallet ${keyAddress}`,
        );
      }
      const { contracts } = chain;
      const sms = getPropertyFormChain(chain, 'sms');
      const secretExists = await checkRequesterSecretExists(
        contracts,
        sms,
        keyAddress,
        name,
      );
      if (secretExists) {
        spinner.succeed(`Secret "${name}" found for address ${keyAddress}`, {
          raw: { isSet: true, name },
        });
      } else {
        spinner.succeed(`No secret "${name}" found for address ${keyAddress}`, {
          raw: { isSet: false, name },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
