#!/usr/bin/env node

const cli = require('commander');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
  info,
  pretty,
} = require('./cli-helper');
const { stringifyNestedBn } = require('./utils');
const { Keystore } = require('./keystore');
const { loadChain } = require('./chains.js');
const deal = require('./deal');

const objName = 'deal';

const show = cli.command('show <dealid>');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .description(desc.showObj(objName))
  .action(async (dealid, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      spinner.start(info.showing(objName));
      const dealResult = await deal.show(chain.contracts, dealid);
      const cleanDeal = stringifyNestedBn(dealResult);
      spinner.succeed(`Deal ${dealid} details: ${pretty(cleanDeal)}`, {
        raw: { deal: cleanDeal },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

// const claim = cli.command('claim <dealid>');
// addGlobalOptions(claim);
// addWalletLoadOptions(claim);
// claim
//   .option(...option.chain())
//   .description(desc.claimObj(objName))
//   .action(async (dealid, cmd) => {
//     const spinner = Spinner(cmd);
//     try {
//       const walletOptions = await computeWalletLoadOptions(cmd);
//       const keystore = Keystore(walletOptions);
//       const [chain, [address]] = await Promise.all([
//         loadChain(cmd.chain, keystore, { spinner }),
//         keystore.account(),
//       ]);
//       spinner.start(info.claiming(objName));
//       const txHash = await deal.claim(chain.contracts, dealid, address);
//       spinner.succeed(`${objName} successfully claimed`, { raw: { txHash } });
//     } catch (error) {
//       handleError(error, cli, cmd);
//     }
//   });

help(cli);
