#!/usr/bin/env node

const cli = require('commander');

const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  handleError,
  desc,
  option,
} = require('./cli-helper');

const init = cli.command('init');
addGlobalOptions(init);
init
  .option(...option.datasetKeystoredir())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .description(desc.teeInit())
  .action(async (cmd) => {
    handleError(
      Error(Error('"iexec tee init" is replaced by "iexec init"')),
      cli,
      cmd,
    );
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
    handleError(
      Error(
        '"iexec tee encrypt-dataset" is replaced by "iexec dataset encrypt"',
      ),
      cli,
      cmd,
    );
  });

const generateKeys = cli.command('generate-beneficiary-keys');
addGlobalOptions(generateKeys);
addWalletLoadOptions(generateKeys);
generateKeys
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .description(desc.generateKeys())
  .action(async (cmd) => {
    handleError(
      Error(
        '"iexec tee generate-beneficiary-keys" is replaced by "iexec result generate-key"',
      ),
      cli,
      cmd,
    );
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
    handleError(
      Error('"iexec tee decrypt-result" is replaced by "iexec result decrypt"'),
      cli,
      cmd,
    );
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
    handleError(
      Error(
        '"iexec tee push-secret" is replaced by "iexec dataset push-secret" or "iexec result push-secret"',
      ),
      cli,
      cmd,
    );
  });

const checkSecret = cli.command('check-secret [address]');
addGlobalOptions(checkSecret);
addWalletLoadOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .description(desc.checkSecret())
  .action(async (address, cmd) => {
    handleError(
      Error(
        '"iexec tee check-secret" is replaced by "iexec dataset check-secret" or "iexec result check-secret"',
      ),
      cli,
      cmd,
    );
  });

help(cli);
