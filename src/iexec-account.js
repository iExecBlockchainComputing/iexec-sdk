#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const account = require('./account');
const keystore = require('./keystore');
const { saveAccountConf, loadAccountConf } = require('./fs');
const { loadChain } = require('./chains');
const { decodeJWTForPrint } = require('./utils');
const {
  help,
  handleError,
  option,
  desc,
  Spinner,
  info,
  command,
  prettyRPC,
  pretty,
} = require('./cli-helper');

const debug = Debug('iexec:iexec-account');
const objName = 'account';

cli
  .command('login')
  .option(...option.chain())
  .option(...option.force())
  .description(desc.login())
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [chain, { address }] = await Promise.all([
        loadChain(cmd.chain),
        keystore.load({ lowercase: true }),
      ]);
      const force = cmd.force || false;
      debug('force', force);
      const jwtoken = await account.auth(address, chain.iexec, chain.ethjs);

      const fileName = await saveAccountConf({ jwtoken }, { force });

      const jwtForPrint = decodeJWTForPrint(jwtoken);
      spinner.succeed(
        `You are logged into iExec. Login token saved into "${fileName}":${pretty(
          jwtForPrint,
        )}`,
      );
    } catch (error) {
      handleError(error, cli, spinner);
    }
  });

cli
  .command(command.deposit())
  .option(...option.chain())
  .description(desc.deposit())
  .action(async (amount, cmd) => {
    try {
      const chain = await loadChain(cmd.chain);
      debug('amount', amount);

      await account.deposit(chain.contracts, amount);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.withdraw())
  .option(...option.chain())
  .description(desc.withdraw())
  .action(async (amount, cmd) => {
    try {
      const chain = await loadChain(cmd.chain);
      debug('amount', amount);

      await account.withdraw(chain.contracts, amount);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('show [address]')
  .option(...option.chain())
  .description(desc.showObj('iExec', objName))
  .action(async (address, cmd) => {
    const spinner = Spinner();
    try {
      const [chain, userWallet, { jwtoken }] = await Promise.all([
        loadChain(cmd.chain),
        keystore.load(),
        loadAccountConf(),
      ]);
      const userAddress = address || userWallet.address;

      const jwtForPrint = decodeJWTForPrint(jwtoken);
      if (
        userWallet.address.toLowerCase() !== jwtForPrint.address.toLowerCase()
      ) {
        spinner.warn(
          info.tokenAndWalletDiffer(userWallet.address, jwtForPrint.address),
        );
      }
      spinner.info(`Account token:${pretty(jwtForPrint)}`);

      spinner.start(info.checkBalance('iExec account'));

      const balancesRPC = await account.checkBalance(
        chain.contracts,
        userAddress,
      );

      spinner.succeed(`Account balances:${prettyRPC(balancesRPC)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
