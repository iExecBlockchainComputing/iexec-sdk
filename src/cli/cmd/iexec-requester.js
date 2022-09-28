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
  prompt,
  Spinner,
  getSmsUrlFromChain,
} = require('../utils/cli-helper');
const { loadChain, connectKeystore } = require('../utils/chains');
const { Keystore } = require('../utils/keystore');

// const debug = Debug('iexec:iexec-requester');

cli.name('iexec requester').usage('<command> [options]');

const pushSecret = cli.command('push-secret <secretName>');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.secretValue())
  .description(desc.pushRequesterSecret())
  .action(async (secretName, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(Object.assign(walletOptions));
      const [chain, address] = await Promise.all([
        loadChain(opts.chain, {
          spinner,
        }),
        keystore.accounts(),
      ]);
      await connectKeystore(chain, keystore);
      const { contracts } = chain;
      const sms = getSmsUrlFromChain(chain);

      spinner.info(`Secret "${secretName}" for address ${address}`);
      const secretValue =
        opts.secretValue ||
        (await prompt.password(`Paste your secret`, {
          useMask: true,
        }));

      const { isPushed } = await pushRequesterSecret(
        contracts,
        sms,
        secretName,
        secretValue,
      );
      if (isPushed) {
        spinner.succeed(`Secret "${secretName}" successfully pushed`, {
          raw: { isPushed, name: secretName },
        });
      } else {
        throw Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const checkSecret = cli.command('check-secret <secretName> [requesterAddress]');
addGlobalOptions(checkSecret);
addWalletLoadOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .description(desc.checkSecret())
  .action(async (secretName, requesterAddress, opts) => {
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
      let address;
      if (requesterAddress) {
        address = requesterAddress;
      } else {
        [address] = await keystore.accounts();
        spinner.info(
          `Checking secret "${secretName}" exists for wallet ${address}`,
        );
      }
      const { contracts } = chain;
      const sms = getSmsUrlFromChain(chain);
      const secretExists = await checkRequesterSecretExists(
        contracts,
        sms,
        address,
        secretName,
      );
      if (secretExists) {
        spinner.succeed(`Secret "${secretName}" found for address ${address}`, {
          raw: { isSet: true, name: secretName },
        });
      } else {
        spinner.succeed(
          `No secret "${secretName}" found for address ${address}`,
          {
            raw: { isSet: false, name: secretName },
          },
        );
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
