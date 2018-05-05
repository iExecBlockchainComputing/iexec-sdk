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
} = require('./cli-helper');

const debug = Debug('iexec:iexec-account');
const objName = 'account';

cli
  .option(...option.chain())
  .option(...option.auth())
  .option(...option.hub())
  .option(...option.user())
  .option(...option.force());

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
      spinner.succeed(`You are logged into iExec. Login token saved into "${fileName}":\n${JSON.stringify(
        jwtForPrint,
        null,
        2,
      )}`);
    } catch (error) {
      handleError(error, objName, spinner);
    }
  });

// cli
//   .command('deposit <amount>')
//   .description(desc.deposit())
//   .action(amount =>
//     account.allow(cli.network, amount).catch(handleError('account')));
//
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
      spinner.succeed(`Account token:\n${JSON.stringify(jwtForPrint, null, 2)}\n`);

      spinner.start(info.checkBalance('iExec account'));
      const balancesRPC = await chain.contracts.checkBalance(userAddress, {
        hub: cli.hub,
      });
      debug('balancesRPC', balancesRPC);
      spinner.succeed(`Account balances:\n${JSON.stringify(balancesRPC, null, 2)}`);
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
