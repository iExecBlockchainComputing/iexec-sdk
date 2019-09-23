#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const fs = require('fs-extra');
const sizeOf = require('image-size');
const path = require('path');
const {
  validateDapp,
  validateDataset,
  validateWorkerpool,
  validateDeployedConf,
} = require('iexec-schema-validator');
const {
  help,
  addGlobalOptions,
  checkUpdate,
  handleError,
  desc,
  Spinner,
  info,
} = require('./cli-helper');
const {
  loadDeployedConf,
  loadIExecConf,
  IEXEC_FILE_NAME,
  DEPLOYED_FILE_NAME,
} = require('./fs');

const debug = Debug('iexec:iexec-registry');

const LOGO_SIDE = 180;
const repo = 'https://github.com/iExecBlockchainComputing/';
const objectNames = ['app', 'workerpool', 'dataset'];
const objectMap = {
  app: {
    name: 'app',
    validate: validateDapp,
    registry: repo.concat('iexec-dapps-registry'),
  },
  dataset: {
    name: 'dataset',
    validate: validateDataset,
    registry: repo.concat('iexec-datasets-registry'),
  },
  workerpool: {
    name: 'workerpool',
    validate: validateWorkerpool,
    registry: repo.concat('iexec-pools-registry'),
  },
};

const validate = cli.command('validate <object>');
addGlobalOptions(validate);
validate.description(desc.validateRessource()).action(async (object, cmd) => {
  await checkUpdate(cmd);
  const spinner = Spinner(cmd);
  try {
    if (!objectNames.includes(object)) {
      throw Error(
        `unknown object "${object}". Must be one of [${objectNames}]`,
      );
    }

    const objectName = objectMap[object].name;
    debug('object', object);
    debug('objectMap[object]', objectMap[object]);

    // validate iexec.json
    const iexecConf = await loadIExecConf();
    try {
      objectMap[object].validate(iexecConf);

      spinner.succeed(info.valid(IEXEC_FILE_NAME));
    } catch (confError) {
      spinner.fail(info.notValid(IEXEC_FILE_NAME));
      throw confError;
    }

    // validate logo file
    try {
      const logoPath = path.join(process.cwd(), iexecConf.logo);
      let logoFile;
      try {
        logoFile = await fs.readFile(logoPath);
      } catch (logoError) {
        if (logoError.code === 'ENOENT') {
          throw new Error(`missing "${iexecConf.logo}" logo image file`);
        }
        throw logoError;
      }
      const logoSize = sizeOf(logoFile);
      debug('logoSize', logoSize);
      if (!(logoSize.width === LOGO_SIDE && logoSize.height === LOGO_SIDE)) {
        throw Error(
          `${
            iexecConf.logo
          } dimensions should be ${LOGO_SIDE}px by ${LOGO_SIDE}px, NOT ${
            logoSize.width
          } by ${logoSize.height}`,
        );
      }

      const logoExt = path.extname(iexecConf.logo).substr(1);
      if (!(logoSize.type === logoExt)) {
        throw Error(`extension mismatch: ${logoSize.type} =/= ${logoExt}`);
      }
      spinner.succeed(info.valid(iexecConf.logo));
    } catch (logoErr) {
      spinner.fail(info.notValid(iexecConf.logo));
      throw logoErr;
    }

    // validate deployed.json
    try {
      const deployedObj = await loadDeployedConf();
      validateDeployedConf(deployedObj);

      if (!(objectName in deployedObj)) {
        throw Error(
          `missing ${objectName} field. You should run "iexec ${object} deploy"`,
        );
      }
      spinner.succeed(info.valid(DEPLOYED_FILE_NAME));
    } catch (confError) {
      spinner.fail(info.notValid(DEPLOYED_FILE_NAME));
      throw confError;
    }

    console.log('\n');
    spinner.succeed(
      `${object} description is valid. You can now submit it to the ${object} registry: ${
        objectMap[object].registry
      }`,
    );
  } catch (error) {
    handleError(error, cli, cmd);
  }
});

help(cli);
