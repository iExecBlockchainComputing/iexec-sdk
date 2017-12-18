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
    const appPath = path.join(process.cwd(), 'apps', appName);
    debug('appPath', appPath);

    spinner.start('sending app to iExec server...');

    const { networks } = await utils.loadContractDesc();

    if (!(chainID in networks) || !networks[chainID].address) throw new Error(`Missing dapp address for ${chainName}. Need to "iexec migrate" before sending app`);

    const contractAddress = networks[chainID].address;
    debug('contractAddress', contractAddress);
    await iexec.getCookieByJWT(jwtoken);
    const data = fs.readFileSync(appPath);
    const { size } = fs.statSync(appPath);
    await iexec.registerApp(
      data,
      size,
      utils.iexecConfig.data,
      Object.assign({ name: contractAddress }, utils.iexecConfig.app || {}),
    );

    spinner.succeed(`App deployed on iExec offchain platform. Only callable through ${chainName} dapp at: ${contractAddress}\n`);
  } catch (error) {
    spinner.fail(`deploy() failed with ${error}`);
    throw error;
  }
};

module.exports = {
  deploy,
};
