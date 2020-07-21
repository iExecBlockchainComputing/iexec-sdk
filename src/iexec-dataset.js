#!/usr/bin/env node

const cli = require('commander');
// const { Buffer } = require('buffer');
const Debug = require('debug');
const fs = require('fs-extra');
const path = require('path');
// const { randomBytes, createCipheriv, pbkdf2 } = require('crypto');
const {
  help,
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
  spawnAsync,
  getPropertyFormChain,
} = require('./cli-helper');
const {
  checkDeployedDataset,
  deployDataset,
  countUserDatasets,
  showDataset,
  showUserDataset,
} = require('./hub');
const {
  createDatasetorder,
  signDatasetorder,
  publishDatasetorder,
} = require('./order');
const {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
  isEmptyDir,
  zipDirectory,
  saveTextToFile,
} = require('./fs');
const { Keystore } = require('./keystore');
const secretMgtServ = require('./sms');
const { loadChain, connectKeystore } = require('./chains');
const { NULL_ADDRESS } = require('./utils');

const debug = Debug('iexec:iexec-dataset');

const objName = 'dataset';

cli
  .name('iexec dataset')
  .usage('<command> [options]')
  .storeOptionsAsProperties(false);

const defaultSecretName = 'dataset.secret';

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);

init
  .option(...option.initDatasetFolders())
  .option(...option.datasetKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .description(desc.initObj(objName))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(
        Object.assign({}, walletOptions, { isSigner: false }),
      );
      const [address] = await keystore.accounts();
      const { saved, fileName } = await initObj(objName, {
        overwrite: { owner: address },
      });
      if (opts.encrypted) {
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
  .description(desc.deployObj(objName))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, iexecConf] = await Promise.all([
        loadChain(opts.chain, { spinner }),
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
  .action(async (cliAddressOrIndex, cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore(
      Object.assign({}, walletOptions, { isSigner: false }),
    );
    try {
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const addressOrIndex = cliAddressOrIndex
        || (await loadDeployedObj(objName).then(
          deployedObj => deployedObj && deployedObj[chain.id],
        ));

      const isAddress = isEthAddress(addressOrIndex, { strict: false });
      const userAddress = opts.user || (address !== NULL_ADDRESS && address);
      if (!isAddress && !userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);

      if (!addressOrIndex) throw Error(info.missingAddress(objName));

      spinner.start(info.showing(objName));

      let res;
      if (isAddress) {
        res = await showDataset(chain.contracts, addressOrIndex);
      } else {
        res = await showUserDataset(
          chain.contracts,
          addressOrIndex,
          userAddress,
        );
      }
      const { dataset, objAddress } = res;
      spinner.succeed(`Dataset ${objAddress} details:${pretty(dataset)}`, {
        raw: { address: objAddress, dataset },
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
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(
        Object.assign({}, walletOptions, { isSigner: false }),
      );
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);

      const userAddress = opts.user || (address !== NULL_ADDRESS && address);
      if (!userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);

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
  .option(...option.datasetEncryptionAlgorithm())
  .description(desc.encryptDataset())
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);

    const SCONE_IMAGE = 'iexechub/tee_data_encrypter';

    /**
    const derivateKey = (password, salt) => new Promise((resolve, reject) => {
      pbkdf2(password, salt, 10000, 48, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        else {
          resolve({
            key: derivedKey.slice(0, 32),
            iv: derivedKey.slice(32, 48),
          });
        }
      });
    });

    const generatePassword = () => new Promise((resolve, reject) => randomBytes(32, (err, buff) => {
      if (err) reject(err);
      else resolve(buff);
    }));

    const generateOpensslSafePassword = async () => {
      const password = await generatePassword();
      if (
        password.indexOf(Buffer.from('0a', 'hex')) !== -1
        || password.indexOf(Buffer.from('00', 'hex')) !== -1
      ) return generateOpensslSafePassword();
      return password;
    };

    const generateSalt = () => new Promise((resolve, reject) => randomBytes(8, (err, buff) => {
      if (err) reject(err);
      else resolve(buff);
    }));

    const encAes256cbcPbkdf2 = async (password, salt) => {
      // based on Openssl 1.1.1 enc -aes-256-cbc -pbkdf2
      const { key, iv } = await derivateKey(password, salt);
      return createCipheriv('aes-256-cbc', key, iv);
    };
    */

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
      const datasetFiles = await fs.readdir(originalDatasetFolderPath);
      debug('datasetFiles', datasetFiles);

      if (!opts.algorithm || opts.algorithm === 'aes-256-cbc') {
        throw Error('Only option "--algorithm scone" is supported');
        /**
        spinner.info('Using default encryption aes-256-cbc');
        const encryptDatasetFile = async (datasetFileName) => {
          spinner.info(`Encrypting ${datasetFileName}`);
          const password = await generateOpensslSafePassword();
          debug('password', password);

          await saveTextToFile(
            `${datasetFileName}.secret`,
            password.toString('base64').concat('\n'),
            { fileDir: datasetSecretsFolderPath, force: opts.force },
          );
          spinner.info(
            `Generated secret for ${datasetFileName} in ${path.join(
              datasetSecretsFolderPath,
              `${datasetFileName}.secret`,
            )}`,
          );

          await new Promise(async (resolve, reject) => {
            const out = fs.createWriteStream(
              path.join(encryptedDatasetFolderPath, `${datasetFileName}.enc`),
            );
            out.on('close', () => resolve());

            const salt = await generateSalt();
            debug('salt', salt);
            const saltText = Buffer.concat([Buffer.from('Salted__'), salt]);

            const datasetPath = path.join(
              originalDatasetFolderPath,
              `${datasetFileName}`,
            );
            const originalDatasetStream = fs.createReadStream(datasetPath);

            out.write(saltText);
            originalDatasetStream
              .on('error', e => reject(new Error(`Read error: ${e}`)))
              .pipe(await encAes256cbcPbkdf2(password, salt))
              .on('error', e => reject(new Error(`Cipher error: ${e}`)))
              .pipe(out)
              .on('error', e => reject(new Error(`Write error: ${e}`)));
          });
          spinner.info(
            `Generated encrypted file for ${datasetFileName} in ${path.join(
              encryptedDatasetFolderPath,
              `${datasetFileName}.enc`,
            )}`,
          );
          // replace default secret
          await saveTextToFile(
            defaultSecretName,
            password.toString('base64').concat('\n'),
            { fileDir: datasetSecretsFolderPath, force: true },
          );
        };

        const recursiveEncryptDatasets = async (filesNames, index = 0) => {
          if (index >= filesNames.length) return;
          const stats = await fs.lstat(
            path.join(originalDatasetFolderPath, filesNames[index]),
          );
          if (stats.isDirectory()) {
            spinner.info(`Creating zip file from folder ${filesNames[index]}`);
            const { zipName, zipPath } = await zipDirectory(
              path.join(originalDatasetFolderPath, filesNames[index]),
              { force: opts.force },
            );
            await encryptDatasetFile(zipName);
            await fs.unlink(zipPath);
          } else if (stats.isFile()) {
            await encryptDatasetFile(filesNames[index]);
          } else {
            throw Error('Datasets should be files or directories');
          }
          await recursiveEncryptDatasets(filesNames, index + 1);
        };
        await recursiveEncryptDatasets(datasetFiles);
        */
      } else if (opts.algorithm === 'scone') {
        spinner.info('Using SCONE');
        try {
          await spawnAsync('docker', ['--version'], { spinner, quiet: true });
        } catch (error) {
          debug('test docker --version', error);
          throw Error('This command requires docker');
        }
        try {
          await spawnAsync('docker', ['pull', SCONE_IMAGE], {
            spinner,
            quiet: true,
          });
        } catch (error) {
          debug('docker pull', error);
          throw Error(`Failed to pull docker image ${SCONE_IMAGE}`);
        }

        const encryptDatasetFolder = async (folder) => {
          const cleanTemp = async () => {
            try {
              await spawnAsync('docker', [
                'run',
                '--rm',
                '-v',
                `${encryptedDatasetFolderPath}:/encrypted`,
                '-v',
                `${datasetSecretsFolderPath}:/conf`,
                SCONE_IMAGE,
                'rm',
                '/conf/keytag',
                '&&',
                'rm',
                '-rf',
                `/encrypted/${folder}`,
              ]);
            } catch (error) {
              debug('encryptDatasetFolder cleanTemp', error);
            }
          };
          try {
            spinner.info(`Encrypting ${folder} with SCONE`);
            await spawnAsync(
              'docker',
              [
                'run',
                '--rm',
                '-v',
                `${originalDatasetFolderPath}/${folder}:/data`,
                '-v',
                `${encryptedDatasetFolderPath}/${folder}:/data_SGX_ready`,
                '-v',
                `${datasetSecretsFolderPath}:/conf`,
                SCONE_IMAGE,
                'sh',
                'create_data_fspf.sh',
              ],
              { spinner, quiet: true },
            );
            const sconeSecretPath = path.join(
              datasetSecretsFolderPath,
              `${folder}.scone.secret`,
            );

            const secret = await fs.readFile(
              path.join(datasetSecretsFolderPath, 'keytag'),
            );
            await saveTextToFile(`${folder}.scone.secret`, secret, {
              fileDir: datasetSecretsFolderPath,
              force: opts.force,
            });
            spinner.info(
              `Generated secret for ${folder} in ${sconeSecretPath}`,
            );
            await zipDirectory(path.join(encryptedDatasetFolderPath, folder), {
              force: true,
            });
            spinner.info(
              `Generated encrypted file for ${folder} in ${path.join(
                encryptedDatasetFolderPath,
                `${folder}.zip`,
              )}`,
            );
            // replace default secret
            await saveTextToFile(defaultSecretName, secret, {
              fileDir: datasetSecretsFolderPath,
              force: true,
            });
            await cleanTemp();
          } catch (error) {
            await cleanTemp();
            throw error;
          }
        };

        const recursiveEncryptDatasets = async (filesNames, index = 0) => {
          if (index >= filesNames.length) return;
          let folderName;
          const stats = await fs.lstat(
            path.join(originalDatasetFolderPath, filesNames[index]),
          );
          if (stats.isDirectory() || stats.isFile()) {
            const safeFolderName = 'dataset_'.concat(
              filesNames[index].replace(/[^\w\s.-_]/gi, ''),
            );
            spinner.info(
              `Wrapping dataset ${filesNames[index]} into folder ${safeFolderName}`,
            );
            await fs.mkdir(
              path.join(originalDatasetFolderPath, safeFolderName),
            );
            let encryptError;
            try {
              await fs.copy(
                path.join(originalDatasetFolderPath, filesNames[index]),
                path.join(
                  originalDatasetFolderPath,
                  safeFolderName,
                  filesNames[index],
                ),
              );
              folderName = safeFolderName;
              await encryptDatasetFolder(folderName);
            } catch (e) {
              encryptError = e;
            }
            spinner.info(`Removing wrapping folder ${safeFolderName}`);
            await fs
              .remove(path.join(originalDatasetFolderPath, safeFolderName))
              .catch(e => debug('remove error', e));
            debug('encryptError', encryptError);
            if (encryptError) {
              throw encryptError;
            }
          } else {
            throw Error('Datasets should be files or directories');
          }
          await recursiveEncryptDatasets(filesNames, index + 1);
        };
        await recursiveEncryptDatasets(datasetFiles);
      } else {
        throw Error(
          `Unsuported option ${option.datasetEncryptionAlgorithm()[0]} ${
            opts.algorithm
          }`,
        );
      }

      spinner.succeed(
        `Encrypted datasets stored in "${encryptedDatasetFolderPath}", you can publish the encrypted files.\nDatasets keys stored in "${datasetSecretsFolderPath}", make sure to backup them.\nOnce you deploy an encrypted dataset run "iexec dataset push-secret [datasetAddress]" to securely share the dataset key with the workers.`,
        {
          raw: {
            encryptedDatasetFolderPath,
            secretPath: datasetSecretsFolderPath,
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
  .description(desc.pushDatasetSecret())
  .action(async (objAddress, cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(Object.assign(walletOptions));
      const chain = await loadChain(opts.chain, { spinner });
      const { contracts } = chain;
      const sms = getPropertyFormChain(chain, 'sms');
      const [address] = await keystore.accounts();
      debug('address', address);
      const resourceAddress = objAddress
        || (await loadDeployedObj(objName).then(
          deployedObj => deployedObj && deployedObj[chain.id],
        ));
      debug('resourceAddress', resourceAddress);
      if (!resourceAddress) {
        throw Error(
          'Missing datasetAddress argument and no dataset found in "deployed.json"',
        );
      }

      let secretFilePath;
      if (opts.secretPath) {
        secretFilePath = opts.secretPath;
      } else {
        const { datasetSecretsFolderPath } = createEncFolderPaths();
        secretFilePath = path.join(datasetSecretsFolderPath, defaultSecretName);
        spinner.info(
          `No --secret-path <path> option, using default ${secretFilePath}`,
        );
      }

      const secretToPush = (await fs.readFile(secretFilePath, 'utf8')).trim();
      debug('secretToPush', secretToPush);

      await connectKeystore(chain, keystore);
      const isPushed = await secretMgtServ.pushWeb3Secret(
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
addWalletLoadOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .description(desc.checkSecret())
  .action(async (objAddress, cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const resourceAddress = objAddress
        || (await loadDeployedObj(objName).then(
          deployedObj => deployedObj && deployedObj[chain.id],
        ));
      if (!resourceAddress) {
        throw Error(
          'Missing datasetAddress argument and no dataset found in "deployed.json"',
        );
      }
      spinner.info(`Checking secret for address ${resourceAddress}`);
      const sms = getPropertyFormChain(chain, 'sms');
      const secretIsSet = await secretMgtServ.checkWeb3SecretExists(
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
  // .option(...orderOption.workerpoolrestrict()) // not allowed by iExec marketplace
  // .option(...orderOption.requesterrestrict()) // not allowed by iExec marketplace
  .action(async (objAddress, cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const txOptions = computeTxOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const useDeployedObj = !objAddress;
      const address = objAddress
        || (await loadDeployedObj(objName).then(
          deployedObj => deployedObj && deployedObj[chain.id],
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
      if (!opts.force) {
        await prompt.publishOrder(`${objName}order`, pretty(orderToSign));
      }
      await connectKeystore(chain, keystore, { txOptions });
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

help(cli);
