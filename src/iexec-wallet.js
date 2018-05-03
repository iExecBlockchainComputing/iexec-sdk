#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const rlcJSON = require('rlc-faucet-contract/build/contracts/RLC.json');
const wallet = require('./wallet');
const keystore = require('./keystore');
const { handleError, help, Spinner } = require('./cli-helper');
const {
  getChains,
  truffleConfig,
  getRPCObjValue,
  getContractAddress,
} = require('./utils');

const debug = Debug('iexec:iexec-wallet');

cli
  .option('--to <address>', 'receiver address')
  .option('--chain <name>', 'chain name', 'ropsten')
  .option('--token <address>', 'erc20 token contract address');

cli
  .command('create')
  .description('create a local wallet')
  .action(() =>
    wallet.create().catch((e) => {
      debug(e);
      handleError(e, 'wallet');
    }));

cli
  .command('getETH')
  .description('apply for ETH from pre-registered faucets')
  .action(() => wallet.getETH(cli.chain).catch(handleError('wallet')));

cli
  .command('getRLC')
  .description('apply for nRLC from iexec faucet')
  .action(() => wallet.getRLC(cli.chain).catch(handleError('wallet')));

cli
  .command('sendETH <amount>')
  .description('send ETH to an address')
  .action(amount => wallet.sendETH(cli.chain, amount, cli.to));

cli
  .command('sendRLC <amount>')
  .description('send nRLC to an address')
  .action(amount => wallet.sendRLC(cli.chain, amount, cli.to, cli.token));

cli
  .command('sweep')
  .description('send all ETH and RLC to an address')
  .action(() => wallet.sweep(cli.chain, cli.to, cli.token));

cli
  .command('show [address]')
  .description('show local wallet balances')
  .action(async (address) => {
    const spinner = Spinner();
    try {
      let userWallet = await keystore.load();
      if (address) userWallet = { address };

      spinner.info(`Wallet:\n${JSON.stringify(userWallet, null, 2)}\n`);
      spinner.start('Checking ETH balances...');

      const chains = getChains();

      const networkNames = Object.keys(truffleConfig.networks);
      const ethBalances = await Promise.all(networkNames.map(name =>
        chains[name].ethjs
          .getBalance(userWallet.address)
          .then(balance => chains[name].EthJS.fromWei(balance, 'ether'))
          .catch((error) => {
            debug(error);
            return 0;
          })));

      const ethBalancesString = ethBalances.reduce(
        (accu, curr, index) =>
          accu.concat(`  [${chains[networkNames[index]].id}] ${
            networkNames[index]
          }: \t ${curr} ETH \t\t https://${
            networkNames[index]
          }.etherscan.io/address/${userWallet.address}\n`),
        '',
      );

      spinner.succeed(`ETH balances:\n\n${ethBalancesString}`);

      spinner.info('Run "iexec wallet getETH" to top up your ETH account\n');

      spinner.start('Checking nRLC balances...');

      const rlcBalances = await Promise.all(networkNames.map((name) => {
        const rlcAddress =
            cli.token || getContractAddress(rlcJSON, chains[name].id);
        const rlcContract = chains[name].ethjs
          .contract(rlcJSON.abi)
          .at(rlcAddress);
        return rlcContract
          .balanceOf(userWallet.address)
          .then(e => getRPCObjValue(e))
          .catch((error) => {
            debug(error);
            return 0;
          });
      }));

      const rlcBalancesString = rlcBalances.reduce(
        (accu, curr, index) =>
          accu.concat(`  [${chains[networkNames[index]].id}] ${
            networkNames[index]
          }: \t ${curr} nRLC\n`),
        '',
      );
      spinner.succeed(`nRLC balances:\n\n${rlcBalancesString}`);

      spinner.info('Run "iexec wallet getRLC" to top up your nRLC account\n');
    } catch (error) {
      handleError(error, 'wallet', spinner);
    }
  });

help(cli);
