#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
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
  prompt,
  lba,
  pretty,
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
      spinner.succeed(`wallet saved in "${res.fileName}":\n${pretty(res.wallet)}`);
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
        await prompt.transferETH(amount, cli.chain, cli.to, chain.id);
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
        await prompt.transferRLC(amount, cli.chain, cli.to, chain.id);
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

      if (!cli.force) {
        await prompt.sweep(cli.chain, cli.to, chain.id);
      }

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
      const [userWallet, chains] = await Promise.all([
        keystore.load(),
        loadChains(),
      ]);
      if (address) userWallet.address = address;

      spinner.info(`Wallet:${pretty(userWallet)}`);

      spinner.start(info.checkBalance('ETH'));
      const ethBalances = await Promise.all(chains.names.map(name =>
        chains[name].ethjs
          .getBalance(userWallet.address)
          .then(balance => chains[name].EthJS.fromWei(balance, 'ether'))
          .catch((error) => {
            debug(error);
            return 0;
          })));

      const ethBalancesStrObj = ethBalances.reduce(
        (accu, curr, index) =>
          Object.assign(accu, {
            [`[${chains[chains.names[index]].id}] ${
              chains.names[index]
            }`]: curr.toString().concat(' ETH'),
          }),
        {},
      );

      spinner.succeed(`ETH balances:${pretty(ethBalancesStrObj)}`);

      spinner.info(lba(info.topUp('ETH')));

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

      const rlcBalancesObjStr = rlcBalances.reduce(
        (accu, curr, index) =>
          Object.assign(accu, {
            [`[${chains[chains.names[index]].id}] ${
              chains.names[index]
            }`]: curr.toString().concat(' nRLC'),
          }),
        {},
      );
      spinner.succeed(`nRLC balances:${pretty(rlcBalancesObjStr)}`);

      spinner.info(lba(info.topUp('RLC')));
    } catch (error) {
      handleError(error, 'wallet', spinner);
    }
  });

help(cli);
