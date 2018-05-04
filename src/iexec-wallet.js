#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const rlcJSON = require('rlc-faucet-contract/build/contracts/RLC.json');
const wallet = require('./wallet');
const keystore = require('./keystore');
const { handleError, help, Spinner } = require('./cli-helper');
const { getRPCObjValue, getContractAddress } = require('./utils');
const { loadChains, loadChain } = require('./loader');

const debug = Debug('iexec:iexec-wallet');
const objName = 'wallet';

cli
  .option('--to <address>', 'receiver address')
  .option('--chain <name>', 'chain name', 'ropsten')
  .option('--token <address>', 'custom erc20 token contract address')
  .option('--force', 'force wallet creation even if old wallet exists', false);

cli
  .command('create')
  .description('create a local wallet')
  .action(async () => {
    const spinner = Spinner();
    try {
      const res = await keystore.createAndSave({ force: cli.force || false });
      spinner.succeed(`wallet save in "${res.fileName}":\n${JSON.stringify(
        res.wallet,
        null,
        2,
      )}`);
    } catch (error) {
      handleError(error, objName, spinner);
    }
  });

cli
  .command('getETH')
  .description('apply for ETH from pre-registered faucets')
  .action(async () => {
    try {
      const address = await keystore.loadAddress();
      await wallet.getETH(cli.chain, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('getRLC')
  .description('apply for nRLC from iexec faucet')
  .action(async () => {
    try {
      const address = await keystore.loadAddress();
      await wallet.getRLC(cli.chain, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sendETH <amount>')
  .description('send ETH to an address')
  .action(async (amount) => {
    try {
      const [address, chain] = await Promise.all([
        keystore.loadAddress(),
        loadChain(cli.chain),
      ]);
      await wallet.sendETH(chain, amount, cli.to, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sendRLC <amount>')
  .description('send nRLC to an address')
  .action(async (amount) => {
    try {
      const [address, chain] = await Promise.all([
        keystore.loadAddress(),
        loadChain(cli.chain),
      ]);
      await wallet.sendRLC(chain, amount, cli.to, cli.token, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sweep')
  .description('send all ETH and RLC to an address')
  .action(async () => {
    try {
      const [address, chain] = await Promise.all([
        keystore.loadAddress(),
        loadChain(cli.chain),
      ]);
      await wallet.sweep(chain, cli.to, cli.token, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show [address]')
  .description('show local wallet balances')
  .action(async (address) => {
    const spinner = Spinner();
    try {
      let userWallet = await keystore.load();
      if (address) userWallet = { address };

      spinner.info(`Wallet:\n${JSON.stringify(userWallet, null, 2)}\n`);
      spinner.start('checking ETH balances...');

      const chains = await loadChains();

      const ethBalances = await Promise.all(chains.names.map(name =>
        chains[name].ethjs
          .getBalance(userWallet.address)
          .then(balance => chains[name].EthJS.fromWei(balance, 'ether'))
          .catch((error) => {
            debug(error);
            return 0;
          })));

      const ethBalancesString = ethBalances.reduce(
        (accu, curr, index) =>
          accu.concat(`  [${chains[chains.names[index]].id}] ${
            chains.names[index]
          }: \t ${curr} ETH \t\t https://${
            chains.names[index]
          }.etherscan.io/address/${userWallet.address}\n`),
        '',
      );

      spinner.succeed(`ETH balances:\n\n${ethBalancesString}`);

      spinner.info('Run "iexec wallet getETH" to top up your ETH account\n');

      spinner.start('checking nRLC balances...');

      const rlcBalances = await Promise.all(chains.names.map((name) => {
        const rlcAddress =
            cli.token ||
            getContractAddress(rlcJSON, chains[name].id, { strict: false });
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
          accu.concat(`  [${chains[chains.names[index]].id}] ${
            chains.names[index]
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
