#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const fs = require('fs-extra');
const { object, array, string } = require('yup');
const sizeOf = require('image-size');
const path = require('path');
const {
  help,
  addGlobalOptions,
  checkUpdate,
  handleError,
  desc,
  Spinner,
  pretty,
} = require('./cli-helper');
const {
  loadDeployedConf,
  loadIExecConf,
  IEXEC_FILE_NAME,
  DEPLOYED_FILE_NAME,
} = require('./fs');
const { paramsKeyName } = require('./params-utils');
const {
  chainIdSchema,
  addressSchema,
  bytes32Schema,
  appTypeSchema,
  uint256Schema,
} = require('./validator');

const debug = Debug('iexec:iexec-registry');

const addressListSchema = () => object().test(async (value) => {
  await Promise.all(
    Object.entries({ ...value }).map(async ([chainId, address]) => {
      await chainIdSchema().validate(chainId);
      await addressSchema().validate(address);
    }),
  );
  return true;
});

const baseSchema = () => object({
  type: string(),
  description: string()
    .min(150)
    .max(2000)
    .required(),
  logo: string().required(),
  social: object({
    website: string(),
    github: string(),
  }).required(),
  repo: string(),
});

const buyConfSchema = () => object({
  params: object({
    [paramsKeyName.IEXEC_ARGS]: string(),
  })
    .required()
    .noUnknown()
    .strict(),
  trust: uint256Schema(),
  tag: bytes32Schema(),
  callback: addressSchema(),
});

const dappSchema = () => object().shape({
  license: string().required(),
  author: string().required(),
  app: object({
    owner: addressSchema().required(),
    name: string().required(),
    type: appTypeSchema().required(),
    multiaddr: string().required(),
    checksum: bytes32Schema().required(),
    mrenclave: string(),
  }).required(),
  buyConf: buyConfSchema().required(),
});

const datasetCompatibleDappSchema = () => object({
  name: string().required(),
  addresses: addressListSchema().required(),
  buyConf: buyConfSchema(),
});

const datasetSchema = () => baseSchema()
  .shape({
    license: string().required(),
    author: string().required(),
    categories: string(),
    dataset: object({
      owner: addressSchema().required(),
      name: string().required(),
      multiaddr: string().required(),
      checksum: bytes32Schema().required(),
    }).required(),
    dapps: array().of(datasetCompatibleDappSchema()),
  })
  .noUnknown()
  .strict();

const workerpoolSchema = () => baseSchema()
  .shape({
    workerpool: object({
      owner: addressSchema().required(),
      description: string().required(),
    }).required(),
  })
  .noUnknown()
  .strict();

cli.name('iexec registry').usage('<command> [options]');

const LOGO_SIDE = 180;
const repo = 'https://github.com/iExecBlockchainComputing/';
const objectNames = ['app', 'workerpool', 'dataset'];
const objectMap = {
  app: {
    name: 'app',
    validationSchema: dappSchema,
    registry: repo.concat('iexec-dapps-registry'),
  },
  dataset: {
    name: 'dataset',
    validationSchema: datasetSchema,
    registry: repo.concat('iexec-datasets-registry'),
  },
  workerpool: {
    name: 'workerpool',
    validationSchema: workerpoolSchema,
    registry: repo.concat('iexec-pools-registry'),
  },
};

const validate = cli.command('validate <object>');
addGlobalOptions(validate);
validate.description(desc.validateRessource()).action(async (objName, cmd) => {
  await checkUpdate(cmd);
  const spinner = Spinner(cmd);
  try {
    if (!objectNames.includes(objName)) {
      throw Error(
        `Unknown object "${objName}". Must be one of [${objectNames}]`,
      );
    }
    const objectName = objectMap[objName].name;
    // validate iexec.json
    const iexecConf = await loadIExecConf();
    const validated = [];
    const failed = [];
    try {
      await objectMap[objName]
        .validationSchema()
        .validate(iexecConf, { strict: true });
      validated.push(IEXEC_FILE_NAME);
    } catch (confError) {
      failed.push(`${IEXEC_FILE_NAME}: ${confError.message}`);
    }
    // validate logo file
    const logoPath = path.join(process.cwd(), iexecConf.logo);
    let logoFile;
    try {
      logoFile = await fs.readFile(logoPath);
      const logoSize = sizeOf(logoFile);
      debug('logoSize', logoSize);
      if (!(logoSize.width === LOGO_SIDE && logoSize.height === LOGO_SIDE)) {
        throw Error(
          `${iexecConf.logo} dimensions should be ${LOGO_SIDE}px by ${LOGO_SIDE}px, NOT ${logoSize.width} by ${logoSize.height}`,
        );
      }
      const logoExt = path.extname(iexecConf.logo).substr(1);
      if (!(logoSize.type === logoExt)) {
        throw Error(`Extension mismatch: ${logoSize.type} =/= ${logoExt}`);
      }
      validated.push(iexecConf.logo);
    } catch (logoError) {
      const errorMessage = logoError.code === 'ENOENT'
        ? `Missing "${iexecConf.logo}" logo image file`
        : logoError.message;
      failed.push(`${iexecConf.logo}: ${errorMessage}`);
    }

    // validate deployed.json
    try {
      const deployedObj = await loadDeployedConf();
      if (!(objectName in deployedObj)) {
        throw Error(
          `Missing ${objectName} field. You should run "iexec ${objName} deploy"`,
        );
      }
      validated.push(DEPLOYED_FILE_NAME);
    } catch (confError) {
      failed.push(`${DEPLOYED_FILE_NAME}: ${confError.message}`);
    }
    if (failed.length === 0) {
      spinner.succeed(
        `${objName} description is valid. You can now submit it to the ${objName} registry: ${objectMap[objName].registry}`,
        {
          raw: { validated },
        },
      );
    } else {
      spinner.fail(`Invalid files: ${pretty(failed)}`, {
        raw: Object.assign({}, { validated }, { fail: failed }),
      });
    }
  } catch (error) {
    handleError(error, cli, cmd);
  }
});

help(cli);
