#!/usr/bin/env node

const cli = require('commander');
const Debug = require('debug');
const {
  checkDeployedWorkerpool,
  deployWorkerpool,
  countUserWorkerpools,
  showWorkerpool,
  showUserWorkerpool,
} = require('../../common/modules/hub');
const {
  createWorkerpoolorder,
  signWorkerpoolorder,
  publishWorkerpoolorder,
  unpublishLastWorkerpoolorder,
  unpublishAllWorkerpoolorders,
} = require('../../common/modules/order');
const { NULL_ADDRESS, stringifyNestedBn } = require('../../common/utils/utils');
const {
  finalizeCli,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  handleError,
  checkUpdate,
  desc,
  option,
  orderOption,
  Spinner,
  pretty,
  info,
  prompt,
  getPropertyFormChain,
  isEthAddress,
} = require('../utils/cli-helper');
const {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
} = require('../utils/fs');
const { Keystore } = require('../utils/keystore');
const { loadChain, connectKeystore } = require('../utils/chains');

const debug = Debug('iexec:iexec-workerpool');

const objName = 'workerpool';

cli
  .name('iexec workerpool')
  .usage('<command> [options]')
  .storeOptionsAsProperties(false);

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);
init.description(desc.initObj(objName)).action(async (opts, cmd) => {
  await checkUpdate(opts);
  const spinner = Spinner(opts);
  try {
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore({ ...walletOptions, isSigner: false });
    const [address] = await keystore.accounts();
    const { saved, fileName } = await initObj(objName, {
      overwrite: { owner: address },
    });
    spinner.succeed(
      `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
        saved,
      )}`,
      { raw: { workerpool: saved } },
    );
  } catch (error) {
    handleError(error, cli, opts);
  }
});

const deploy = cli.command('deploy');
addGlobalOptions(deploy);
addWalletLoadOptions(deploy);
deploy
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.deployObj(objName))
  .action(async (opts, cmd) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, iexecConf] = await Promise.all([
        loadChain(opts.chain, { txOptions, spinner }),
        loadIExecConf(),
      ]);
      if (!iexecConf[objName]) {
        throw Error(
          `Missing ${objName} in "iexec.json". Did you forget to run "iexec ${objName} init"?`,
        );
      }
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.deploying(objName));
      const { address, txHash } = await deployWorkerpool(
        chain.contracts,
        iexecConf[objName],
      );
      spinner.succeed(`Deployed new ${objName} at address ${address}`, {
        raw: { address, txHash },
      });
      await saveDeployedObj(objName, chain.id, address);
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const show = cli.command('show [addressOrIndex]');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.user())
  .description(desc.showObj(objName))
  .action(async (cliAddressOrIndex, opts, cmd) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore({ ...walletOptions, isSigner: false });
    try {
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const addressOrIndex = cliAddressOrIndex
        || (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));

      const isAddress = isEthAddress(addressOrIndex, { strict: false });
      const userAddress = opts.user || (address !== NULL_ADDRESS && address);
      if (!isAddress && !userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);

      if (!addressOrIndex) throw Error(info.missingAddress(objName));

      spinner.start(info.showing(objName));
      let res;
      if (isAddress) {
        res = await showWorkerpool(chain.contracts, addressOrIndex);
      } else {
        res = await showUserWorkerpool(
          chain.contracts,
          addressOrIndex,
          userAddress,
        );
      }
      const { workerpool, objAddress } = res;
      const cleanObj = stringifyNestedBn(workerpool);
      spinner.succeed(`Workerpool ${objAddress} details:${pretty(cleanObj)}`, {
        raw: { address: objAddress, workerpool: cleanObj },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const count = cli.command('count');
addGlobalOptions(count);
addWalletLoadOptions(count);
count
  .option(...option.chain())
  .option(...option.user())
  .description(desc.countObj(objName))
  .action(async (opts, cmd) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore({ ...walletOptions, isSigner: false });
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);

      const userAddress = opts.user || (address !== NULL_ADDRESS && address);
      if (!userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);

      spinner.start(info.counting(objName));
      const objCountBN = await countUserWorkerpools(
        chain.contracts,
        userAddress,
      );
      spinner.succeed(
        `User ${userAddress} has a total of ${objCountBN} ${objName}`,
        { raw: { count: objCountBN.toString() } },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const publish = cli.command('publish [workerpoolAddress]');
addGlobalOptions(publish);
addWalletLoadOptions(publish);
publish
  .description(desc.publishObj(objName))
  .option(...option.chain())
  .option(...option.force())
  .option(...orderOption.category())
  .option(...orderOption.price())
  .option(...orderOption.volume())
  .option(...orderOption.tag())
  .option(...orderOption.trust())
  .option(...orderOption.apprestrict())
  .option(...orderOption.datasetrestrict())
  .option(...orderOption.requesterrestrict())
  .action(async (objAddress, opts, cmd) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const useDeployedObj = !objAddress;
      const address = objAddress
        || (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!address) {
        throw Error(
          `Missing ${objName}Address and no ${objName} found in "deployed.json" for chain ${chain.id}`,
        );
      }
      debug('useDeployedObj', useDeployedObj, 'address', address);
      if (useDeployedObj) {
        spinner.info(
          `No ${objName} specified, using last ${objName} deployed from "deployed.json"`,
        );
      }
      spinner.info(`Creating ${objName}order for ${objName} ${address}`);
      if (!(await checkDeployedWorkerpool(chain.contracts, address))) {
        throw Error(`No ${objName} deployed at address ${address}`);
      }
      const overrides = {
        workerpool: address,
        workerpoolprice: opts.price,
        volume: opts.volume,
        tag: opts.tag,
        category: opts.category || '0',
        trust: opts.trust,
        apprestrict: opts.appRestrict,
        datasetrestrict: opts.datasetRestrict,
        requesterrestrict: opts.requesterRestrict,
      };
      const orderToSign = await createWorkerpoolorder(
        chain.contracts,
        overrides,
      );
      if (!opts.force) {
        await prompt.publishOrder(`${objName}order`, pretty(orderToSign));
      }
      await connectKeystore(chain, keystore);
      const signedOrder = await signWorkerpoolorder(
        chain.contracts,
        orderToSign,
      );
      const orderHash = await publishWorkerpoolorder(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        signedOrder,
      );
      spinner.succeed(
        `Successfully published ${objName}order with orderHash ${orderHash}\nRun "iexec orderbook ${objName} ${address}" to show published ${objName}orders`,
        {
          raw: {
            orderHash,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const unpublish = cli.command('unpublish [workerpoolAddress]');
addGlobalOptions(unpublish);
addWalletLoadOptions(unpublish);
unpublish
  .description(desc.unpublishObj(objName))
  .option(...option.chain())
  .option(...option.force())
  .option(...option.unpublishAllOrders())
  .action(async (objAddress, opts, cmd) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const useDeployedObj = !objAddress;
      const address = objAddress
        || (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!address) {
        throw Error(
          `Missing ${objName}Address and no ${objName} found in "deployed.json" for chain ${chain.id}`,
        );
      }
      debug('useDeployedObj', useDeployedObj, 'address', address);
      if (useDeployedObj) {
        spinner.info(
          `No ${objName} specified, using last ${objName} deployed from "deployed.json"`,
        );
      }
      const all = !!opts.all;
      if (!opts.force) {
        await prompt.unpublishOrder(objName, address, all);
      }
      await connectKeystore(chain, keystore);
      const unpublished = all
        ? await unpublishAllWorkerpoolorders(
          chain.contracts,
          getPropertyFormChain(chain, 'iexecGateway'),
          address,
        )
        : await unpublishLastWorkerpoolorder(
          chain.contracts,
          getPropertyFormChain(chain, 'iexecGateway'),
          address,
        );
      spinner.succeed(
        `Successfully unpublished ${all ? 'all' : 'last'} ${objName}order${
          all ? 's' : ''
        }`,
        {
          raw: {
            unpublished,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
