#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const inquirer = require('inquirer');
const rlcJSON = require('rlc-faucet-contract/build/contracts/RLC.json');
const wallet = require('./wallet');
const keystore = require('./keystore');
const {
  handleError,
  help,
  Spinner,
  option,
  desc,
  info,
} = require('./cli-helper');
const { getRPCObjValue, getContractAddress } = require('./utils');
const { loadChains, loadChain } = require('./chains.js');

const debug = Debug('iexec:iexec-wallet');
const objName = 'wallet';

cli
  .option(...option.to())
  .option(...option.chain())
  .option(...option.token())
  .option(...option.force());

cli
  .command('create')
  .description(desc.createObj(objName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const res = await keystore.createAndSave({ force: cli.force || false });
      spinner.succeed(`wallet saved in "${res.fileName}":\n${JSON.stringify(
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
  .description(desc.getETH())
  .action(async () => {
    try {
      const { address } = await keystore.load();
      await wallet.getETH(cli.chain, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('getRLC')
  .description(desc.getRLC())
  .action(async () => {
    try {
      const { address } = await keystore.load();
      await wallet.getRLC(cli.chain, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sendETH <amount>')
  .description(desc.sendETH())
  .action(async (amount) => {
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cli.chain),
      ]);

      if (!cli.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'transfer',
            message: `Do you want to send ${amount} ${chain.name} ETH to ${
              cli.to
            } [chainID: ${chain.id}]`,
          },
        ]);
        if (!answers.transfer) throw Error(info.userAborted());
      }

      await wallet.sendETH(chain, amount, cli.to, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sendRLC <amount>')
  .description(desc.sendRLC())
  .action(async (amount) => {
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cli.chain),
      ]);

      if (!cli.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'transfer',
            message: `Do you want to send ${amount} ${chain.name} nRLC to ${
              cli.to
            } [chainID: ${chain.id}]`,
          },
        ]);
        if (!answers.transfer) throw Error('Transfer aborted by user.');
      }

      await wallet.sendRLC(chain, amount, cli.to, cli.token, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sweep')
  .description(desc.sweep())
  .action(async () => {
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cli.chain),
      ]);
      await wallet.sweep(chain, cli.to, cli.token, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show [address]')
  .description(desc.showObj(objName, 'address'))
  .action(async (address) => {
    const spinner = Spinner();
    try {
      let userWallet = await keystore.load();
      if (address) userWallet = { address };

      spinner.info(`Wallet:\n${JSON.stringify(userWallet, null, 2)}\n`);
      spinner.start(info.checkBalance('ETH'));

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

      spinner.info(info.topUp('ETH'));

      spinner.start(info.checkBalance('nRLC'));

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

      spinner.info(info.topUp('RLC'));
    } catch (error) {
      handleError(error, 'wallet', spinner);
    }
  });

help(cli);
