#!/usr/bin/env node

import { program as cli } from 'commander';
import { checkRequesterSecretExists } from '../../common/sms/check.js';
import { pushRequesterSecret } from '../../common/sms/push.js';
import {
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
  optionCreator,
} from '../utils/cli-helper.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { Keystore } from '../utils/keystore.js';

cli.name('iexec requester').usage('<command> [options]');

const pushSecret = cli.command('push-secret <secretName>');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.secretValue())
  .addOption(optionCreator.teeFramework())
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
      const sms = getSmsUrlFromChain(chain, {
        teeFramework: opts.teeFramework,
      });
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
  .addOption(optionCreator.teeFramework())
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
      const sms = getSmsUrlFromChain(chain, {
        teeFramework: opts.teeFramework,
      });
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
