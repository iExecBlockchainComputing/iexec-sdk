#!/usr/bin/env node

const cli = require('commander');
const Debug = require('debug');
const fs = require('fs-extra');
const path = require('path');
const {
  checkDeployedDataset,
  deployDataset,
  countUserDatasets,
  showDataset,
  showUserDataset,
} = require('../../common/protocol/registries');
const {
  createDatasetorder,
  signDatasetorder,
} = require('../../common/market/order');
const {
  publishDatasetorder,
  unpublishLastDatasetorder,
  unpublishAllDatasetorders,
} = require('../../common/market/marketplace');
const { checkWeb3SecretExists } = require('../../common/sms/check');
const { pushWeb3Secret } = require('../../common/sms/push');
const { NULL_ADDRESS, DATASET } = require('../../common/utils/constant');
const {
  generateAes256Key,
  encryptAes256Cbc,
  sha256Sum,
} = require('../../common/utils/encryption-utils');
const {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
  isEmptyDir,
  saveToFile,
  saveTextToFile,
} = require('../utils/fs');
const { Keystore } = require('../utils/keystore');
const { loadChain, connectKeystore } = require('../utils/chains');
const {
  finalizeCli,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  createEncFolderPaths,
  checkUpdate,
  handleError,
  desc,
  option,
  orderOption,
  Spinner,
  pretty,
  info,
  prompt,
  isEthAddress,
  getPropertyFormChain,
  getSmsUrlFromChain,
  optionCreator,
} = require('../utils/cli-helper');
const { lookupAddress } = require('../../common/ens/resolution');
const { ConfigurationError } = require('../../common/utils/errors');
const {
  checkDatasetRequirements,
  resolveTeeFrameworkFromTag,
} = require('../../common/execution/order-helper');

const debug = Debug('iexec:iexec-dataset');

const objName = DATASET;

cli
  .name('iexec dataset')
  .usage('<command> [options]')
  .storeOptionsAsProperties(false);

const defaultKeyFileName = 'dataset.key';

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);
init
  .option(...option.initDatasetFolders())
  .option(...option.initTee())
  .option(...option.datasetKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .description(desc.initObj(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore({ ...walletOptions, isSigner: false });
      const [address] = await keystore.accounts();
      const { saved, fileName } = await initObj(objName, {
        overwrite: { owner: address },
      });
      if (opts.encrypted || opts.tee) {
        const {
          datasetSecretsFolderPath,
          originalDatasetFolderPath,
          encryptedDatasetFolderPath,
        } = createEncFolderPaths(opts);
        await Promise.all([
          fs.ensureDir(datasetSecretsFolderPath),
          fs.ensureDir(originalDatasetFolderPath),
          fs.ensureDir(encryptedDatasetFolderPath),
        ]);
        spinner.info('Created dataset folder tree for encryption');
      }
      spinner.succeed(
        `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
          saved,
        )}`,
        { raw: { dataset: saved } },
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
  .action(async (opts) => {
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
      const { address, txHash } = await deployDataset(
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
  .action(async (cliAddressOrIndex, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore({ ...walletOptions, isSigner: false });
    try {
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const addressOrIndex =
        cliAddressOrIndex ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));

      const isAddress = isEthAddress(addressOrIndex, { strict: false });
      const userAddress = opts.user || (address !== NULL_ADDRESS && address);
      if (!isAddress && !userAddress)
        throw Error(`Missing option ${option.user()[0]} or wallet`);

      if (!addressOrIndex) throw Error(info.missingAddress(objName));

      spinner.start(info.showing(objName));

      let res;
      let ens;
      if (isAddress) {
        [res, ens] = await Promise.all([
          showDataset(chain.contracts, addressOrIndex),
          lookupAddress(chain.contracts, addressOrIndex).catch((e) => {
            if (e instanceof ConfigurationError) {
              /** no ENS */
            } else {
              throw e;
            }
          }),
        ]);
      } else {
        res = await showUserDataset(
          chain.contracts,
          addressOrIndex,
          userAddress,
        );
        ens = await lookupAddress(chain.contracts, res.objAddress).catch(
          (e) => {
            if (e instanceof ConfigurationError) {
              /** no ENS */
            } else {
              throw e;
            }
          },
        );
      }
      const { dataset, objAddress } = res;
      spinner.succeed(
        `Dataset ${objAddress} details:${pretty({
          ...(ens && { ENS: ens }),
          ...dataset,
        })}`,
        {
          raw: { address: objAddress, ens, dataset },
        },
      );
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
  .action(async (opts) => {
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
      if (!userAddress)
        throw Error(`Missing option ${option.user()[0]} or wallet`);

      spinner.start(info.counting(objName));
      const objCountBN = await countUserDatasets(chain.contracts, userAddress);
      spinner.succeed(
        `User ${userAddress} has a total of ${objCountBN} ${objName}`,
        { raw: { count: objCountBN.toString() } },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const encryptDataset = cli.command('encrypt');
addGlobalOptions(encryptDataset);
encryptDataset
  .option(...option.force())
  .option(...option.datasetKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .description(desc.encryptDataset())
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);

    try {
      const {
        datasetSecretsFolderPath,
        originalDatasetFolderPath,
        encryptedDatasetFolderPath,
      } = createEncFolderPaths(opts);

      const [eDSF, eODF, eEDF] = await Promise.all([
        fs.pathExists(datasetSecretsFolderPath),
        fs.pathExists(originalDatasetFolderPath),
        fs.pathExists(encryptedDatasetFolderPath),
      ]);

      if (!eDSF || !eODF || !eEDF) {
        throw Error(
          'Folders for dataset encryption are missing, did you forget to run "iexec dataset init --encrypted"?',
        );
      }

      const isDatasetFolderEmpty = await isEmptyDir(originalDatasetFolderPath);
      if (isDatasetFolderEmpty) {
        throw Error(
          `Input folder "${originalDatasetFolderPath}" is empty, nothing to encrypt`,
        );
      }

      const encryptDatasetFile = async (datasetFileName) => {
        spinner.info(`Encrypting ${datasetFileName}`);
        const key = generateAes256Key();

        const originalFilePath = path.join(
          originalDatasetFolderPath,
          datasetFileName,
        );
        const fileBuffer = await fs.readFile(originalFilePath);
        const encryptedFileBuffer = await encryptAes256Cbc(fileBuffer, key);
        const encryptedFileChecksum = await sha256Sum(encryptedFileBuffer);

        const keyFilePath = await saveTextToFile(
          `${datasetFileName}.key`,
          key,
          {
            fileDir: datasetSecretsFolderPath,
            force: opts.force,
          },
        );
        await saveTextToFile(`${defaultKeyFileName}`, key, {
          fileDir: datasetSecretsFolderPath,
          force: opts.force,
        });
        spinner.info(
          `Generated dataset encryption key for ${datasetFileName} in ${keyFilePath}`,
        );

        const encryptedFilePath = await saveToFile(
          `${datasetFileName}.enc`,
          encryptedFileBuffer,
          {
            fileDir: encryptedDatasetFolderPath,
            force: opts.force,
          },
        );
        spinner.info(
          `Generated encrypted dataset for ${datasetFileName} in ${encryptedFilePath}`,
        );
        spinner.info(`Dataset checksum is ${encryptedFileChecksum}\n`);

        return {
          original: originalFilePath,
          encrypted: encryptedFilePath,
          key: keyFilePath,
          checksum: encryptedFileChecksum,
        };
      };

      const recursiveEncryptDatasets = async (
        filesNames,
        index = 0,
        encryptedFiles = [],
      ) => {
        if (index >= filesNames.length) return encryptedFiles;
        const stats = await fs.lstat(
          path.join(originalDatasetFolderPath, filesNames[index]),
        );
        if (!stats.isFile()) {
          spinner.info(
            `Datasets must be single file, skipping ${filesNames[index]}\n`,
          );
        } else {
          const paths = await encryptDatasetFile(filesNames[index]);
          encryptedFiles.push(paths);
        }
        return recursiveEncryptDatasets(filesNames, index + 1, encryptedFiles);
      };

      const datasetFiles = await fs.readdir(originalDatasetFolderPath);
      debug('datasetFiles', datasetFiles);
      const encrypted = await recursiveEncryptDatasets(datasetFiles);

      spinner.succeed(
        `Encrypted datasets stored in "${encryptedDatasetFolderPath}", you can publish the encrypted files.\nDatasets keys stored in "${datasetSecretsFolderPath}", make sure to backup them.\nOnce you deploy an encrypted dataset run "iexec dataset push-secret [datasetAddress]" to securely share the dataset key with the workers.`,
        {
          raw: {
            encryptedDatasetFolderPath,
            secretPath: datasetSecretsFolderPath,
            encryptedFiles: encrypted,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const pushSecret = cli.command('push-secret [datasetAddress]');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.secretPath())
  .addOption(optionCreator.teeFramework())
  .description(desc.pushDatasetSecret())
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(Object.assign(walletOptions));
      const chain = await loadChain(opts.chain, { spinner });
      const { contracts } = chain;
      const sms = getSmsUrlFromChain(chain, {
        teeFramework: opts.teeFramework,
      });
      const [address] = await keystore.accounts();
      debug('address', address);
      const resourceAddress =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!resourceAddress) {
        throw Error(
          'Missing datasetAddress argument and no dataset found in "deployed.json"',
        );
      }
      spinner.info(`Dataset ${resourceAddress}`);

      let secretFilePath;
      if (opts.secretPath) {
        secretFilePath = opts.secretPath;
      } else {
        const { datasetSecretsFolderPath } = createEncFolderPaths();
        secretFilePath = path.join(
          datasetSecretsFolderPath,
          defaultKeyFileName,
        );
        spinner.info(
          `No --secret-path <path> option, using default ${secretFilePath}`,
        );
      }

      const secretToPush = (await fs.readFile(secretFilePath, 'utf8')).trim();
      debug('secretToPush', secretToPush);

      await connectKeystore(chain, keystore);
      const isPushed = await pushWeb3Secret(
        contracts,
        sms,
        resourceAddress,
        secretToPush,
      );
      if (isPushed) {
        spinner.succeed('Secret successfully pushed', {
          raw: {},
        });
      } else {
        throw Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const checkSecret = cli.command('check-secret [datasetAddress]');
addGlobalOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .addOption(optionCreator.teeFramework())
  .description(desc.checkSecret())
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const resourceAddress =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!resourceAddress) {
        throw Error(
          'Missing datasetAddress argument and no dataset found in "deployed.json"',
        );
      }
      spinner.info(`Checking secret for address ${resourceAddress}`);
      const sms = getSmsUrlFromChain(chain, {
        teeFramework: opts.teeFramework,
      });
      const secretIsSet = await checkWeb3SecretExists(
        chain.contracts,
        sms,
        resourceAddress,
      );
      if (secretIsSet) {
        spinner.succeed(`Secret found for dataset ${resourceAddress}`, {
          raw: { isSecretSet: true },
        });
      } else {
        spinner.succeed(`No secret found for dataset ${resourceAddress}`, {
          raw: { isSecretSet: false },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const publish = cli.command('publish [datasetAddress]');
addGlobalOptions(publish);
addWalletLoadOptions(publish);
publish
  .description(desc.publishObj(objName))
  .option(...option.chain())
  .option(...option.force())
  .option(...orderOption.price())
  .option(...orderOption.volume())
  .option(...orderOption.tag())
  .option(...orderOption.apprestrict())
  .option(...orderOption.workerpoolrestrict())
  .option(...orderOption.requesterrestrict())
  .option(...option.skipPreflightCheck())
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const useDeployedObj = !objAddress;
      const address =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!address) {
        throw Error(info.missingAddressOrDeployed(objName, chain.id));
      }
      debug('useDeployedObj', useDeployedObj, 'address', address);
      if (useDeployedObj) {
        spinner.info(
          `No ${objName} specified, using last ${objName} deployed from "deployed.json"`,
        );
      }
      spinner.info(`Creating ${objName}order for ${objName} ${address}`);
      if (!(await checkDeployedDataset(chain.contracts, address))) {
        throw Error(`No ${objName} deployed at address ${address}`);
      }
      const overrides = {
        dataset: address,
        datasetprice: opts.price,
        volume: opts.volume || '1000000',
        tag: opts.tag,
        apprestrict: opts.appRestrict,
        workerpoolrestrict: opts.workerpoolRestrict,
        requesterrestrict: opts.requesterRestrict,
      };
      const orderToSign = await createDatasetorder(chain.contracts, overrides);
      if (!opts.skipPreflightCheck) {
        const sms = getSmsUrlFromChain(chain, {
          teeFramework: await resolveTeeFrameworkFromTag(orderToSign.tag),
        });
        await checkDatasetRequirements(
          { contracts: chain.contracts, smsURL: sms },
          orderToSign,
        );
      }
      if (!opts.force) {
        await prompt.publishOrder(`${objName}order`, pretty(orderToSign));
      }
      await connectKeystore(chain, keystore);
      const signedOrder = await signDatasetorder(chain.contracts, orderToSign);
      const orderHash = await publishDatasetorder(
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

const unpublish = cli.command('unpublish [datasetAddress]');
addGlobalOptions(unpublish);
addWalletLoadOptions(unpublish);
unpublish
  .description(desc.unpublishObj(objName))
  .option(...option.chain())
  .option(...option.force())
  .option(...option.unpublishAllOrders())
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const useDeployedObj = !objAddress;
      const address =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!address) {
        throw Error(info.missingAddressOrDeployed(objName, chain.id));
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
        ? await unpublishAllDatasetorders(
            chain.contracts,
            getPropertyFormChain(chain, 'iexecGateway'),
            address,
          )
        : await unpublishLastDatasetorder(
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
