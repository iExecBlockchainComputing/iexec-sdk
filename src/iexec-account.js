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
  .option(...option.chain())
  .option(...option.auth())
  .option(...option.hub())
  .option(...option.user())
  .option(...option.force())
  .option(...option.token());

cli
  .command('login')
  .description(desc.login())
  .action(async () => {
    const spinner = Spinner();
    try {
      const [chain, { address }] = await Promise.all([
        loadChain(cli.chain),
        keystore.load({ lowercase: true }),
      ]);

      const jwtoken = await account.auth(address, chain.iexec, chain.ethjs);

      const fileName = await saveAccountConf(
        { jwtoken },
        { force: cli.force || false },
      );

      const jwtForPrint = decodeJWTForPrint(jwtoken);
      spinner.succeed(`You are logged into iExec. Login token saved into "${fileName}":${pretty(jwtForPrint)}`);
    } catch (error) {
      handleError(error, objName, spinner);
    }
  });

cli
  .command(command.deposit())
  .description(desc.deposit())
  .action(async (amount) => {
    try {
      const chain = await loadChain(cli.chain);
      debug('amount', amount);

      await account.deposit(chain.contracts, amount, {
        hub: cli.hub,
        token: cli.token,
      });
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show [address]')
  .description(desc.showObj('iExec', objName))
  .action(async (address) => {
    const spinner = Spinner();
    try {
      const [chain, userWallet, { jwtoken }] = await Promise.all([
        loadChain(cli.chain),
        keystore.load(),
        loadAccountConf(),
      ]);
      const userAddress = address || userWallet.address;

      const jwtForPrint = decodeJWTForPrint(jwtoken);
      if (
        userWallet.address.toLowerCase() !== jwtForPrint.address.toLowerCase()
      ) {
        spinner.warn(`Your token address ${jwtForPrint.address} and your wallet address ${
          userWallet.address
        } differ, you should run "iexec login" to sync them\n`);
      }
      spinner.succeed(`Account token:${pretty(jwtForPrint)}`);

      spinner.start(info.checkBalance('iExec account'));
      const balancesRPC = await chain.contracts
        .getHubContract({
          at: cli.hub,
        })
        .checkBalance(userAddress);

      spinner.succeed(`Account balances:${prettyRPC(balancesRPC)}`);
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
