const Debug = require('debug');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const createIEXECClient = require('iexec-server-js-client');
const account = require('./account');
const utils = require('./utils');
const oraOptions = require('./oraOptions');

const debug = Debug('iexec:apps');

const deploy = async (chainName, cliAppName) => {
  const spinner = ora(oraOptions);
  try {
    debug('cliAppName', cliAppName);
    const chainID = utils.truffleConfig.networks[chainName].network_id;
    const appName = cliAppName || utils.iexecConfig.name;
    const chain = utils.getChains()[chainName];
    debug('chain.server', chain.server);
    const iexec = createIEXECClient({ server: chain.server });

    debug('appName', appName);
    const { jwtoken } = await account.load();
    debug('jwtoken', jwtoken);

    spinner.start('sending app to iExec server...');

    const { networks } = await utils.loadContractDesc();

    if (!(chainID in networks) || !networks[chainID].address) throw new Error(`Missing dapp address for ${chainName}. Need to "iexec migrate" before sending app`);

    const contractAddress = networks[chainID].address;
    debug('contractAddress', contractAddress);
    await iexec.getCookieByJWT(jwtoken);

    const appExtraFields = {};

    if (!('app' in utils.iexecConfig) || utils.iexecConfig.app.type === 'DEPLOYABLE') {
      debug('type === DEPLOYABLE');
      const appPath = path.join(process.cwd(), 'apps', appName);
      debug('appPath', appPath);
      const data = fs.readFileSync(appPath);
      const { size } = fs.statSync(appPath);
      const dataUID = await iexec.registerData(data, size, utils.iexecConfig.data);
      const { os, cpu } = utils.iexecConfig.data;
      const appBinFieldName = iexec.getAppBinaryFieldName(os, cpu);
      appExtraFields[appBinFieldName] = iexec.uid2uri(dataUID);
    }

    await iexec.registerApp(Object.assign(
      appExtraFields,
      { name: contractAddress },
      utils.iexecConfig.app || {},
    ));

    spinner.succeed(`App deployed on iExec offchain platform. Only callable through ${chainName} dapp at: ${contractAddress}\n`);
  } catch (error) {
    spinner.fail(`deploy() failed with ${error}`);
    throw error;
  }
};

const uploadData = async (chainName, dataPath) => {
  const spinner = ora(oraOptions);
  try {
    debug('dataPath', dataPath);
    const chain = utils.getChains()[chainName];
    debug('chain.server', chain.server);
    const iexec = createIEXECClient({ server: chain.server });

    const { jwtoken } = await account.load();
    debug('jwtoken', jwtoken);

    spinner.start('uploading data to iExec server...');

    await iexec.getCookieByJWT(jwtoken);
    const data = fs.readFileSync(dataPath);
    const { size } = fs.statSync(dataPath);
    const dataUID = await iexec.registerData(
      data,
      size,
      utils.iexecConfig.data,
    );
    const dataURI = iexec.uid2uri(dataUID);

    spinner.succeed(`Data uploaded on iExec offchain platform, available at ${dataURI}\n`);
  } catch (error) {
    spinner.fail(`deploy() failed with ${error}`);
    throw error;
  }
};

module.exports = {
  deploy,
  uploadData,
};
