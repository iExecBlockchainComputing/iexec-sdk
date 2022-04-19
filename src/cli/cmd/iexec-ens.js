#!/usr/bin/env node

// const Debug = require('debug');
const cli = require('commander');
const {
  getOwner,
  resolveName,
  lookupAddress,
  registerFifsEns,
  configureResolution,
} = require('../../common/ens');
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

const resolve = cli.command('resolve <name>');
addGlobalOptions(resolve);
resolve
  .option(...option.chain())
  .description('resolve an ENS name to an address')
  .action(async (name, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });

      spinner.start('Resolving ENS');
      const address = await resolveName(chain.contracts, name);
      spinner.succeed(
        address
          ? `ENS ${name} resolved to ${address}`
          : `No resolver configured for ${name}`,
        {
          raw: {
            address,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const lookup = cli.command('lookup <address>');
addGlobalOptions(lookup);
lookup
  .option(...option.chain())
  .description('lookup for the ENS name of an address')
  .action(async (address, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });

      spinner.start('Looking up for the ENS name');
      const name = await lookupAddress(chain.contracts, address);
      spinner.succeed(
        name
          ? `${address} is associated to ENS ${name}`
          : `No reverse resolution configured for ${address}`,
        {
          raw: {
            name,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const getEnsOwner = cli.command('get-owner <name>');
addGlobalOptions(getEnsOwner);
getEnsOwner
  .option(...option.chain())
  .description('find the the owner address of an ENS name')
  .action(async (name, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });

      spinner.start('Finding ENS name owner');
      const owner = await getOwner(chain.contracts, name);
      spinner.succeed(`ENS ${name} is owned by ${owner}`, {
        raw: {
          owner,
        },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const register = cli.command('register <label>');
addGlobalOptions(register);
addWalletLoadOptions(register);
register
  .option(...option.chain())
  .option(...option.force())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(
    '--domain <domain>',
    `use the specified ENS domain (default \`users.iexec.eth\`)
 - if the ENS name (label.domain) is not owned by the user, the domain must be controled by a FIFS registrar
 - if the ENS name (label.domain) is already owned by the user, the registration will be skipped`,
  )
  .option(
    '--for <address>',
    'register for an owned iExec app, dataset or workerpool',
  )
  .description(
    'register an ENS if needed and setup both ENS resolution and reverse resolution',
  )
  .action(async (label, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const { domain, force } = opts;
      const forAddress = opts.for; // workaround cannot destructure for
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const txOptions = await computeTxOptions(opts);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });

      const [walletAddress] = await keystore.accounts();
      const targetAddress = forAddress || walletAddress;

      if (!force) {
        const currentEns = await lookupAddress(chain.contracts, targetAddress);
        if (currentEns) {
          await prompt.custom(
            `An ENS (${currentEns}) is already configured for address ${targetAddress}, this configuration will be replaced, do you want to continue?`,
            { strict: true },
          );
        }
      }

      spinner.start('Registering ENS');
      const { registerTxHash, name } = await registerFifsEns(
        chain.contracts,
        label,
        domain,
      );
      spinner.info(
        registerTxHash
          ? `Registered new ENS ${name}`
          : `ENS ${name} already owned`,
      );

      spinner.start('Configuring ENS resolution');
      const {
        setResolverTxHash,
        setAddrTxHash,
        claimReverseTxHash,
        setNameTxHash,
      } = await configureResolution(
        chain.contracts,
        getPropertyFormChain(chain, 'ensPublicResolver'),
        name,
        targetAddress,
      );
      spinner.succeed(
        `ENS ${name} successfuly registered and configured for ${targetAddress}`,
        {
          raw: {
            name,
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
