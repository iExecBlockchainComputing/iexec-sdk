#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const account = require('./account');
const keystore = require('./keystore');
const { saveAccountConf, loadAccountConf } = require('./fs');
const { loadChain } = require('./chains');
const { decodeJWTForPrint, strigifyNestedBn } = require('./utils');
const {
  help,
  addGlobalOptions,
  handleError,
  option,
  desc,
  Spinner,
  info,
  command,
  pretty,
} = require('./cli-helper');

const debug = Debug('iexec:iexec-account');
const objName = 'account';

const login = cli.command('login');
addGlobalOptions(login);
login
  .option(...option.chain())
  .option(...option.force())
  .description(desc.login())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const [chain, { address }] = await Promise.all([
        loadChain(cmd.chain, spinner),
        keystore.load({ lowercase: true }),
      ]);
      const force = cmd.force || cmd.raw || false;
      debug('force', force);
      spinner.start(info.logging());
      const jwtoken = await account.auth(address, chain.iexec, chain.ethjs);
      spinner.stop();

      const fileName = await saveAccountConf({ jwtoken }, { force });

      const jwtForPrint = decodeJWTForPrint(jwtoken);
      spinner.succeed(
        `You are logged into iExec. Login token saved into "${fileName}":${pretty(
          jwtForPrint,
        )}`,
        { raw: { jwt: jwtoken, info: jwtForPrint } },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const deposit = cli.command(command.deposit());
addGlobalOptions(deposit);
deposit
  .option(...option.chain())
  .description(desc.deposit())
  .action(async (amount, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, spinner);
      debug('amount', amount);
      spinner.start(info.depositing());
      const depositedeAmount = await account.deposit(chain.contracts, amount);
      spinner.succeed(info.deposited(depositedeAmount), {
        raw: { amount: depositedeAmount },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const withdraw = cli.command(command.withdraw());
addGlobalOptions(withdraw);
withdraw
  .option(...option.chain())
  .description(desc.withdraw())
  .action(async (amount, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, spinner);
      debug('amount', amount);
      spinner.start(info.withdrawing());
      const withdrawedAmount = await account.withdraw(chain.contracts, amount);
      spinner.succeed(info.withdrawed(amount), {
        raw: { amount: withdrawedAmount },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const show = cli.command('show [address]');
addGlobalOptions(show);
show
  .option(...option.chain())
  .description(desc.showObj('iExec', objName))
  .action(async (address, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const [chain, userWallet, { jwtoken }] = await Promise.all([
        loadChain(cmd.chain, spinner),
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
      const balances = await account.checkBalance(chain.contracts, userAddress);
      const cleanBalance = strigifyNestedBn(balances);
      spinner.succeed(`Account balances:${pretty(cleanBalance)}`, {
        raw: { balance: cleanBalance },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
