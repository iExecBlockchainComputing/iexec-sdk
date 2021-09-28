#!/usr/bin/env node

// const Debug = require('debug');
const cli = require('commander');
const ensModule = require('../../common/modules/ens');
const {
  finalizeCli,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  checkUpdate,
  handleError,
  option,
  Spinner,
  getPropertyFormChain,
  prompt,
} = require('../utils/cli-helper');
const { Keystore } = require('../utils/keystore');
const { loadChain, connectKeystore } = require('../utils/chains');

// const debug = Debug('iexec:iexec-ens');

cli.name('iexec ens').usage('<command> [options]');

const register = cli.command('register <label>');
addGlobalOptions(register);
addWalletLoadOptions(register);
register
  .option(...option.chain())
  .option(...option.force())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(
    '--domain <ensDomain>',
    'register on the specified domain, this domain must be controled by a FIFS registrar (default domain `users.iexec.eth`)',
  )
  .option('--for-address <address>', 'register for an owned iExec resource')
  .description(
    'Register an ENS from a FIFS registrar and setup ENS resolution and reverse resolution',
  )
  .action(async (label, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const { domain, forAddress, force } = opts;
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const txOptions = await computeTxOptions(opts);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });

      const [walletAddress] = await keystore.accounts();
      const targetAddress = forAddress || walletAddress;

      if (!force) {
        const currentEns = await ensModule.lookupAddress(
          chain.contracts,
          targetAddress,
        );
        if (currentEns) {
          await prompt.custom(
            `An ENS (${currentEns}) is already configured for address ${targetAddress}, this configuration will be replaced, do you want to continue?`,
            { strict: true },
          );
        }
      }

      spinner.start('Registering ENS');
      const { registerTxHash, registeredName } =
        await ensModule.registerFifsEns(chain.contracts, label, domain);

      spinner.start('Configuring ENS resolution');
      const {
        setResolverTxHash,
        setAddrTxHash,
        claimReverseTxHash,
        setNameTxHash,
      } = await ensModule.setupEnsResolution(
        chain.contracts,
        getPropertyFormChain(chain, 'ensPublicResolver'),
        registeredName,
        targetAddress,
      );
      spinner.succeed(
        `ENS ${registeredName} successfuly registered and configured for ${targetAddress}`,
        {
          raw: {
            registeredName,
            address: targetAddress,
            registerTxHash,
            setResolverTxHash,
            setAddrTxHash,
            claimReverseTxHash,
            setNameTxHash,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
