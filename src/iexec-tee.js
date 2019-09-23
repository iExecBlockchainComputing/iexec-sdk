#!/usr/bin/env node

const Debug = require('debug');
const JSZip = require('jszip');
const cli = require('commander');
const semver = require('semver');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const {
  createCipheriv,
  createDecipheriv,
  generateKeyPair,
  privateDecrypt,
  randomBytes,
  pbkdf2,
} = require('crypto');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
  info,
  prompt,
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const tee = require('./tee.js');
const { isEmptyDir, saveTextToFile, zipDirectory } = require('./fs');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-tee');

const teeFolderName = 'tee';
const secretsFolderName = '.tee-secrets';
const datasetSecretsFolderName = 'dataset';
const beneficiarySecretsFolderName = 'beneficiary';
const originalDatasetFolderName = 'original-dataset';
const encryptedDatasetFolderName = 'encrypted-dataset';
const DEFAULT_ENCRYPTED_RESULTS_NAME = 'encryptedResults.zip';
const DEFAULT_DECRYPTED_RESULTS_NAME = 'results.zip';
const publicKeyName = address => `${address}_key.pub`;
const privateKeyName = address => `${address}_key`;

const SCONE_IMAGE = 'iexechub/tee_data_encrypter';

const spawnAsync = (bin, args, options = { spinner: Spinner() }) => new Promise((resolve, reject) => {
  debug('spawnAsync bin', bin);
  debug('spawnAsync args', args);
  let errorMessage = '';
  const proc = args ? spawn(bin, args) : spawn(bin);

  proc.stdout.on('data', (data) => {
    const inlineData = data.toString().replace(/(\r\n|\n|\r)/gm, ' ');
    debug('spawnAsync stdout', inlineData);
    if (!options.quiet) options.spinner.info(inlineData);
  });
  proc.stderr.on('data', (data) => {
    const inlineData = data.toString().replace(/(\r\n|\n|\r)/gm, ' ');
    debug('spawnAsync stderr', inlineData);
    if (!options.quiet) options.spinner.info(inlineData);
    errorMessage = errorMessage.concat(inlineData, '\n');
  });
  proc.on('close', (code) => {
    debug('spawnAsync close', code);
    if (code !== 0) reject(errorMessage || 'process errored');
    resolve();
  });
  proc.on('exit', (code) => {
    debug('spawnAsync exit', code);
    if (code !== 0) reject(errorMessage || 'process errored');
    resolve();
  });
  proc.on('error', () => {
    debug('spawnAsync error');
    reject(errorMessage || 'process errored');
  });
});

const streamToBuffer = stream => new Promise((resolve, reject) => {
  const buffers = [];
  stream.on('error', reject);
  stream.on('data', data => buffers.push(data));
  stream.on('end', () => resolve(Buffer.concat(buffers)));
});

const extractFileFromZip = (jszip, file, destination) => new Promise((resolve, reject) => {
  try {
    jszip
      .file(file)
      .nodeStream()
      .pipe(fs.createWriteStream(destination))
      .on('finish', () => {
        resolve();
      });
  } catch (error) {
    reject(error);
  }
});

const decipherAES = (secret, iv) => createDecipheriv('aes-256-cbc', secret, iv);

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

const createTEEPaths = (cmd = {}) => {
  const absolutePath = relativeOrAbsolutePath => (path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(process.cwd(), relativeOrAbsolutePath));

  const datasetSecretsFolderPath = cmd.datasetKeystoredir
    ? absolutePath(cmd.datasetKeystoredir)
    : path.join(process.cwd(), secretsFolderName, datasetSecretsFolderName);
  const beneficiarySecretsFolderPath = cmd.beneficiaryKeystoredir
    ? absolutePath(cmd.beneficiaryKeystoredir)
    : path.join(process.cwd(), secretsFolderName, beneficiarySecretsFolderName);
  const originalDatasetFolderPath = cmd.originalDatasetDir
    ? absolutePath(cmd.originalDatasetDir)
    : path.join(process.cwd(), teeFolderName, originalDatasetFolderName);
  const encryptedDatasetFolderPath = cmd.encryptedDatasetDir
    ? absolutePath(cmd.encryptedDatasetDir)
    : path.join(process.cwd(), teeFolderName, encryptedDatasetFolderName);

  const paths = {
    datasetSecretsFolderPath,
    beneficiarySecretsFolderPath,
    originalDatasetFolderPath,
    encryptedDatasetFolderPath,
  };
  debug('paths', paths);
  return paths;
};

const init = cli.command('init');
addGlobalOptions(init);
init
  .option(...option.datasetKeystoredir())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .description(desc.teeInit())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      spinner.start('creating TEE folder tree structure');
      const {
        datasetSecretsFolderPath,
        beneficiarySecretsFolderPath,
        originalDatasetFolderPath,
        encryptedDatasetFolderPath,
      } = createTEEPaths();
      await Promise.all([
        fs.ensureDir(datasetSecretsFolderPath),
        fs.ensureDir(beneficiarySecretsFolderPath),
        fs.ensureDir(originalDatasetFolderPath),
        fs.ensureDir(encryptedDatasetFolderPath),
      ]);
      spinner.succeed(info.teeInit());
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const encryptDataset = cli.command('encrypt-dataset');
addGlobalOptions(encryptDataset);
encryptDataset
  .option(...option.force())
  .option(...option.datasetKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .option(...option.datasetEncryptionAlgorithm())
  .description(desc.encryptDataset())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const {
        datasetSecretsFolderPath,
        originalDatasetFolderPath,
        encryptedDatasetFolderPath,
      } = createTEEPaths(cmd);

      const isDatasetFolderEmpty = await isEmptyDir(originalDatasetFolderPath);
      if (isDatasetFolderEmpty) {
        throw Error(
          `Input folder "${originalDatasetFolderPath}" is empty, nothing to encrypt`,
        );
      }
      const datasetFiles = await fs.readdir(originalDatasetFolderPath);
      debug('datasetFiles', datasetFiles);

      if (!cmd.algorithm || cmd.algorithm === 'aes-256-cbc') {
        spinner.info('Using default encryption aes-256-cbc');
        const encryptDatasetFile = async (datasetFileName) => {
          spinner.info(`Encrypting ${datasetFileName}`);
          const password = await generateOpensslSafePassword();
          debug('password', password);

          await saveTextToFile(
            `${datasetFileName}.secret`,
            password.toString('base64').concat('\n'),
            { fileDir: datasetSecretsFolderPath, force: cmd.force },
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
              datasetSecretsFolderPath,
              `${datasetFileName}.enc`,
            )}`,
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
              { force: cmd.force },
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
      } else if (cmd.algorithm === 'scone') {
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
          throw Error(`Failled to pull docker image ${SCONE_IMAGE}`);
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
              force: cmd.force,
            });
            spinner.info(
              `Generated secret for ${folder} in ${sconeSecretPath}`,
            );
            await zipDirectory(path.join(encryptedDatasetFolderPath, folder), {
              force: true,
            });
            spinner.info(
              `Generated encrypted file for ${folder} in ${path.join(
                datasetSecretsFolderPath,
                `${folder}.zip`,
              )}`,
            );
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
          if (stats.isDirectory()) {
            folderName = filesNames[index];
            await encryptDatasetFolder(folderName);
          } else if (stats.isFile()) {
            const safeFolderName = 'dataset_'.concat(
              filesNames[index].replace(/[^\w\s.-_]/gi, ''),
            );
            spinner.info(
              `Wrapping single file ${
                filesNames[index]
              } into folder ${safeFolderName}`,
            );
            await fs.mkdir(
              path.join(originalDatasetFolderPath, safeFolderName),
            );
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
            spinner.info(`Removing folder ${safeFolderName}`);
            await fs.unlink(
              path.join(
                originalDatasetFolderPath,
                safeFolderName,
                filesNames[index],
              ),
            );
            await fs.rmdir(
              path.join(originalDatasetFolderPath, safeFolderName),
            );
          } else {
            throw Error('Datasets should be files or directories');
          }
          await recursiveEncryptDatasets(filesNames, index + 1);
        };
        await recursiveEncryptDatasets(datasetFiles);
      } else {
        throw Error(
          `Unsuported option ${option.datasetEncryptionAlgorithm()[0]} ${
            cmd.algorithm
          }`,
        );
      }

      spinner.succeed(
        `Encrypted datasets stored in "${encryptedDatasetFolderPath}", you can publish the encrypted files.\nDatasets keys stored in "${datasetSecretsFolderPath}", make sure to backup them.\nOnce you deploy an encrypted dataset run "iexec tee push-secret --dataset <datasetAddress> --secret-path <datasetKeyPath>" to securely share the dataset key with the workers.`,
        {
          raw: {
            encryptedDatasetFolderPath,
            secretPath: datasetSecretsFolderPath,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const generateKeys = cli.command('generate-beneficiary-keys');
addGlobalOptions(generateKeys);
addWalletLoadOptions(generateKeys);
generateKeys
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .description(desc.generateKeys())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const nodeMinVersion = 'v10.12.0';
      if (semver.gt(nodeMinVersion, process.version)) {
        throw Error(
          `Minimum node version to use this command is ${nodeMinVersion}, found ${
            process.version
          }`,
        );
      }
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const [address] = await keystore.accounts();

      const { beneficiarySecretsFolderPath } = createTEEPaths(cmd);

      spinner.info(`Generate beneficiary keys for wallet address ${address}`);
      spinner.start('Generating new beneficiary keys');

      const { privateKey, publicKey } = await new Promise((resolve, reject) => {
        generateKeyPair(
          'rsa',
          {
            modulusLength: 4096,
            publicKeyEncoding: {
              type: 'spki',
              format: 'pem',
            },
            privateKeyEncoding: {
              type: 'pkcs8',
              format: 'pem',
            },
          },
          (err, pub, pri) => {
            if (err) reject(err);
            else {
              resolve({
                privateKey: pri,
                publicKey: pub,
              });
            }
          },
        );
      });
      spinner.stop();
      const priKeyFileName = privateKeyName(address);
      const pubKeyFileName = publicKeyName(address);
      await saveTextToFile(priKeyFileName, privateKey, {
        force: cmd.force,
        fileDir: beneficiarySecretsFolderPath,
      });
      await saveTextToFile(pubKeyFileName, publicKey, {
        force: cmd.force,
        fileDir: beneficiarySecretsFolderPath,
      });

      spinner.succeed(
        `Beneficiary keys pair "${priKeyFileName}" and "${pubKeyFileName}" generated in "${beneficiarySecretsFolderPath}", make sure to backup this key pair\nRun "iexec tee push-secret --beneficiary" to securely share your public key for result encryption`,
        {
          raw: {
            secretPath: beneficiarySecretsFolderPath,
            privateKeyFile: priKeyFileName,
            publicKeyFile: pubKeyFileName,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const decryptResults = cli.command('decrypt-results [encryptedResultsPath]');
addGlobalOptions(decryptResults);
addWalletLoadOptions(decryptResults);
decryptResults
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.beneficiaryKeyFile())
  .description(desc.decryptResults())
  .action(async (encryptedResultsPath, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const { beneficiarySecretsFolderPath } = createTEEPaths(cmd);

      const inputFile = encryptedResultsPath
        || path.join(process.cwd(), DEFAULT_ENCRYPTED_RESULTS_NAME);
      const outputFile = cmd.decryptedResultsPath
        || path.join(process.cwd(), DEFAULT_DECRYPTED_RESULTS_NAME);

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );

      let beneficiaryKeyPath;
      if (cmd.beneficiaryKeyFile) {
        beneficiaryKeyPath = path.join(
          beneficiarySecretsFolderPath,
          cmd.beneficiaryKeyFile,
        );
      } else {
        const [address] = await keystore.accounts();
        spinner.info(`Using beneficiary key for wallet ${address}`);
        beneficiaryKeyPath = path.join(
          beneficiarySecretsFolderPath,
          privateKeyName(address),
        );
      }

      const rootFolder = 'iexec_out';
      const encKeyFile = 'encrypted_key';
      const encResultsFile = 'result.zip.aes';

      let zip;
      try {
        zip = await new JSZip().loadAsync(fs.readFile(inputFile));
      } catch (error) {
        debug(error);
        throw Error(
          `Failed to load encrypted results zip file from "${inputFile}"`,
        );
      }

      let encryptedResultsKeyArrayBuffer;
      try {
        encryptedResultsKeyArrayBuffer = await zip
          .file(`${rootFolder}/${encKeyFile}`)
          .async('arraybuffer');
      } catch (error) {
        throw Error(`Missing ${encKeyFile} file in "${inputFile}"`);
      }
      const encryptedResultsKeyBuffer = Buffer.from(
        encryptedResultsKeyArrayBuffer,
        'ArrayBuffer',
      );

      let beneficiaryKey;
      try {
        beneficiaryKey = await fs.readFile(beneficiaryKeyPath, 'utf8');
      } catch (error) {
        debug(error);
        throw Error(
          `Failed to load beneficiary key from "${beneficiaryKeyPath}"`,
        );
      }

      spinner.start('Decrypting results key');
      let resultsKey;
      try {
        resultsKey = privateDecrypt(beneficiaryKey, encryptedResultsKeyBuffer);
      } catch (error) {
        debug(error);
        throw Error(
          `Failed to decrypt results key with "${beneficiaryKeyPath}"`,
        );
      }
      debug('resultsKey', resultsKey);

      const cleanFile = async (filePath) => {
        try {
          await fs.remove(filePath);
        } catch (e) {
          debug('cleanFile', filePath, e);
        }
      };

      spinner.stop();
      const outputExists = await fs.exists(outputFile);
      if (outputExists && !cmd.force) await prompt.fileExists(outputFile);
      spinner.start('Decrypting results');
      const tempResultsPath = path.join(process.cwd(), 'encryptedTemp');
      try {
        await extractFileFromZip(
          zip,
          `${rootFolder}/${encResultsFile}`,
          tempResultsPath,
        );
        const ivStream = fs.createReadStream(tempResultsPath, {
          start: 0,
          end: 15,
        });
        const iv = await streamToBuffer(ivStream);
        debug('iv', iv);

        await new Promise((resolve, reject) => {
          const out = fs.createWriteStream(outputFile);
          out.on('close', () => resolve());
          const encryptedResultsStream = fs.createReadStream(tempResultsPath, {
            start: 16,
          });
          encryptedResultsStream
            .on('error', e => reject(new Error(`Read error: ${e}`)))
            .pipe(decipherAES(resultsKey, iv))
            .on('error', e => reject(new Error(`Decipher error: ${e}`)))
            .pipe(out)
            .on('error', e => reject(new Error(`Write error: ${e}`)));
        });
        await cleanFile(tempResultsPath);
      } catch (error) {
        debug(error);
        await Promise.all([cleanFile(tempResultsPath), cleanFile(outputFile)]);
        throw Error('Failed to decrypt results with decrypted results key');
      }

      spinner.succeed(`Results successfully decrypted in ${outputFile}`, {
        raw: {
          resultsPath: outputFile,
        },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const pushSecret = cli.command('push-secret');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.pushBeneficiarySecret())
  .option(...option.pushDatasetSecret())
  .option(...option.secretPath())
  .description(desc.pushSecret())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      debug('dataset', cmd.dataset);
      if (cmd.beneficary && cmd.dataset) {
        throw Error(
          `Only one option is allowed (${option.pushBeneficiarySecret()[0]} | ${
            option.pushDatasetSecret()[0]
          })`,
        );
      }

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(Object.assign(walletOptions));
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });

      const { contracts, sms } = chain;
      if (!sms) throw Error(`Missing sms in "chain.json" for chain ${chain.id}`);

      const { address } = await keystore.load();
      debug('address', address);

      const resourceAddress = cmd.dataset || address;
      debug('resourceAddress', resourceAddress);

      let secretFilePath;
      if (cmd.secretPath) {
        secretFilePath = cmd.secretPath;
      } else {
        let defaultSecretPath;
        const {
          datasetSecretsFolderPath,
          beneficiarySecretsFolderPath,
        } = createTEEPaths();
        const secretFileName = 'keytag';
        if (cmd.dataset) {
          defaultSecretPath = path.join(
            datasetSecretsFolderPath,
            secretFileName,
          );
        } else {
          defaultSecretPath = path.join(
            beneficiarySecretsFolderPath,
            publicKeyName(address),
          );
        }
        secretFilePath = defaultSecretPath;
      }

      const secretToPush = (await fs.readFile(secretFilePath, 'utf8')).trim();
      debug('secretToPush', secretToPush);

      const res = await tee.pushSecret(
        contracts,
        sms,
        address,
        resourceAddress,
        secretToPush,
      );
      if (res.hash) {
        spinner.succeed(`Secret successfully pushed (hash: ${res.hash})`, {
          raw: res,
        });
      } else {
        throw Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const checkSecret = cli.command('check-secret [address]');
addGlobalOptions(checkSecret);
addWalletLoadOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .description(desc.checkSecret())
  .action(async (address, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });
      let keyAddress;
      if (address) {
        keyAddress = address;
      } else {
        [keyAddress] = await keystore.accounts();
        spinner.info(`Checking secret for wallet ${keyAddress}`);
      }

      const { sms } = chain;
      if (!sms) throw Error(`Missing sms in chain.json for chain ${chain.id}`);
      const res = await tee.checkSecret(sms, keyAddress);
      if (res.hash) {
        spinner.succeed(
          `Secret found for address ${keyAddress} (hash: ${res.hash})`,
          {
            raw: Object.assign(res, { isKnownAddress: true }),
          },
        );
      } else {
        spinner.succeed(`No secret found for address ${keyAddress}`, {
          raw: Object.assign(res, { isKnownAddress: false }),
        });
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
