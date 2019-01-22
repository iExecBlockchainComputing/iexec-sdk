const Debug = require('debug');
const colors = require('colors/safe');
const Ora = require('ora');
const inquirer = require('inquirer');
const prettyjson = require('prettyjson');

const debug = Debug('help');

const info = {
  waitMiners: () => 'waiting for transaction to be mined...',
  checkBalance: currency => `checking ${currency} balances...`,
  topUp: currency => `Run "iexec wallet get${currency}" to ask faucets for ${currency}`,
  userAborted: () => 'operation aborted by user.',
  logging: () => 'logging into iExec...',
  creating: obj => `creating ${obj}...`,
  placing: obj => `placing ${obj}...`,
  filling: obj => `filling ${obj}...`,
  cancelling: obj => `cancelling ${obj}...`,
  deploying: obj => `deploying ${obj}...`,
  showing: obj => `showing ${obj}...`,
  counting: obj => `counting ${obj}...`,
  depositing: () => 'making deposit...',
  watching: obj => `watching ${obj}...`,
  claiming: obj => `claiming ${obj}...`,
  deposited: amount => `deposited ${amount} nRLC to your iExec account`,
  withdrawing: () => 'making withdraw...',
  withdrawed: amount => `withdrawed ${amount} nRLC from your iExec account`,
  downloaded: path => `downloaded work result to file ${path}`,
  claimed: (amount, address) => `claimed ${amount} nRLC from work ${address}`,
  missingAddress: obj => `${obj} address not provided to CLI AND missing in deployed.json`,
  checking: obj => `checking ${obj}...`,
  tokenAndWalletDiffer: (tokenAddress, walletAddress) => `Your token address ${tokenAddress} and your wallet address ${walletAddress} differ, you should run "iexec account login" to sync them`,
  valid: obj => `${obj} is valid`,
  notValid: obj => `${obj} is NOT valid`,
  teeInit: () => 'created TEE folders tree structure',
  missingOrder: (orderName, optionName) => `Missing ${orderName}. You probably forgot to run "iexec order init --${optionName}"`,
  orderSigned: (orderName, fileName) => `${orderName} signed and saved in ${fileName}, you can share it: `,
};

const command = {
  show: () => 'show',
  deposit: () => 'deposit <amount>',
  withdraw: () => 'withdraw <amount>',
  fill: () => 'fill',
  cancel: () => 'cancel',
  sign: () => 'sign',
  publish: () => 'publish',
  unpublish: () => 'unpublish',
};

const desc = {
  raw: () => 'use raw output',
  hubAddress: () => 'interact with the iExec Hub at a custom smart contract address',
  chainName: () => 'chain name from "chains.json"',
  userAddress: () => 'custom user address',
  initObj: objName => `init a new ${objName}`,
  deployObj: objName => `deploy a new ${objName}`,
  placeObj: objName => `place a new ${objName}`,
  createObj: objName => `deploy a new ${objName}`,
  createWallet: () => 'create a new wallet',
  importWallet: () => 'import a wallet from an ethereum private key',
  fill: objName => `fill an ${objName} to execute a work`,
  cancel: objName => `cancel an ${objName}`,
  showObj: (objName, owner = 'user') => `show ${owner} ${objName} details`,
  countObj: (objName, owner = 'user') => `get ${owner} ${objName} count`,
  claimObj: objName => `claim a ${objName} that is not COMPLETED`,
  login: () => 'login into your iExec account',
  deposit: () => 'deposit RLC onto your iExec account',
  withdraw: () => 'withdraw RLC from your iExec account',
  getETH: () => 'apply for ETH from pre-registered faucets',
  getRLC: () => 'apply for nRLC from iExec faucet',
  sendETH: () => 'send ETH to an address',
  sendRLC: () => 'send nRLC to an address',
  sweep: () => 'send all ETH and RLC to an address',
  encryptWallet: () => 'encrypt wallet.json into encrypted-wallet.json (v3 format wallet)',
  decryptWallet: () => 'decrypt encrypted-wallet.json into wallet.json (clear format)',
  info: () => 'show iExec contracts addresses',
  validateRessource: () => 'validate an app/dataset/workerpool description before submitting it to the iExec registry',
  encryptedpush: () => 'encrypt work input data + upload it to file hosting service',
  decrypt: () => 'decrypt work result',
  teeInit: () => 'init the TEE folders tree structure',
  sign: () => 'sign orders from "iexec.json" and store them into "orders.json"',
  cancelOrder: objName => `cancel a signed ${objName}`,
  publish: objName => `publish a signed ${objName}`,
  unpublish: objName => `unpublish a signed ${objName}`,
};

const option = {
  raw: () => ['--raw', desc.raw()],
  chain: () => ['--chain <name>', desc.chainName()],
  hub: () => ['--hub <address>', desc.hubAddress()],
  user: () => ['--user <address>', desc.userAddress()],
  initAppOrder: () => ['--app', 'init an app sell order'],
  initDatasetOrder: () => ['--dataset', 'init a dataset sell order'],
  initWorkerpoolOrder: () => ['--workerpool', 'init a workerpool sell order'],
  initRequestOrder: () => ['--request', 'init a buy request order'],
  signAppOrder: () => ['--app', 'sign an selling apporder'],
  signDatasetOrder: () => ['--dataset', 'sign a selling datasetorder'],
  signWorkerpoolOrder: () => ['--workerpool', 'sign a selling workerpoolorder'],
  signRequestOrder: () => ['--request', 'sign a buying userorder'],
  cancelAppOrder: () => ['--app', 'cancel a signed apporder'],
  cancelDatasetOrder: () => ['--dataset', 'cancel a signed datasetorder'],
  cancelWorkerpoolOrder: () => [
    '--workerpool',
    'cancel a signed workerpoolorder',
  ],
  cancelRequestOrder: () => ['--request', 'cancel a signed userorder'],
  publishAppOrder: () => [
    '--app',
    'publish a signed apporder on iExec marketplace',
  ],
  publishDatasetOrder: () => [
    '--dataset',
    'publish a signed datasetorder on iExec marketplace',
  ],
  publishWorkerpoolOrder: () => [
    '--workerpool',
    'publish a signed workerpoolorder on iExec marketplace',
  ],
  publishRequestOrder: () => [
    '--request',
    'publish a signed requestorder on iExec marketplace',
  ],
  unpublishAppOrder: () => [
    '--app [orderHash]',
    'unpublish a signed apporder from iExec marketplace',
  ],
  unpublishDatasetOrder: () => [
    '--dataset [orderHash]',
    'unpublish a signed datasetorder from iExec marketplace',
  ],
  unpublishWorkerpoolOrder: () => [
    '--workerpool [orderHash]',
    'unpublish a signed workerpoolorder from iExec marketplace',
  ],
  unpublishRequestOrder: () => [
    '--request [orderHash]',
    'unpublish a signed requestorder from iExec marketplace',
  ],
  showAppOrder: () => ['--app [orderHash]', 'show an apporder'],
  showDatasetOrder: () => ['--dataset [orderHash]', 'show a datasetorder'],
  showWorkerpoolOrder: () => [
    '--workerpool [orderHash]',
    'show a workerpoolorder',
  ],
  showRequestOrder: () => ['--request [orderHash]', 'show a requestorder'],
  fillAppOrder: () => [
    '--app <orderHash>',
    'specify the app order from the marketplace to fill',
  ],
  fillDatasetOrder: () => [
    '--dataset <orderHash>',
    'specify the dataset order from the marketplace to fill',
  ],
  fillWorkerpoolOrder: () => [
    '--workerpool [orderHash>',
    'specify the wokerpool order from the marketplace to fill',
  ],
  fillRequestOrder: () => [
    '--request orderHash',
    'specify the requestorder from the marketplace to fill',
  ],
  auth: () => ['--auth <auth>', 'auth server name', 'https://auth.iex.ec'],
  to: () => ['--to <address>', 'receiver address'],
  token: () => ['--token <address>', 'custom erc20 token contract address'],
  forceCreate: () => [
    '--force',
    'force wallet creation even if old wallet exists',
  ],
  force: () => ['--force', 'force perform action without prompting user'],
  showPrivateKey: () => [
    '--show-private-key',
    'allow to display walletprivate key',
  ],
  watch: () => ['--watch', 'watch a work status changes'],
  download: () => [
    '--download [fileName]',
    'download a work result data to local filesystem, if completed',
  ],
  category: () => ['--category <id>', 'specify the work category'],
  workerpool: () => ['--workerpool <address>', 'filter by workerpool address'],
  appOrderbook: () => [
    '--app <address>',
    'show the best orders for specified app',
  ],
  datasetOrderbook: () => [
    '--dataset <address>',
    'show the best orders for specified dataset',
  ],
  password: () => [
    '--password <password>',
    'password used to encrypt the wallet',
  ],
  unencrypted: () => [
    '--unencrypted',
    'generate unsafe unencrypted wallet in working directory (--keystoredir option is ignored)',
  ],
  keystoredir: () => [
    '--keystoredir <path>',
    "specify the wallet directory <'global'|'local'|custom>",
  ],
  walletAddress: () => [
    '--wallet-address <walletAddress>',
    'specify the address of the wallet to use',
  ],
  walletFileName: () => [
    '--wallet-file <walletFileName>',
    'specify the name of the wallet file to use',
  ],
  scheduler: () => ['--scheduler <host>', 'scheduler host uri'],
  application: () => ['--application <name>', 'dockerhub app name'],
  secretManagementService: () => [
    '--secretManagementService <hostname>',
    'SCONE secret management service url or IP',
  ],
  remoteFileSystem: () => [
    '--remoteFileSystem <name>',
    'file hosting service name',
  ],
  keysFolderPath: () => [
    '--keysFolderPath <path>',
    'path of folder containing encrypt/decrypt keys',
  ],
  inputsFolderPath: () => [
    '--inputsFolderPath <path>',
    'path of folder containing encrypted input data',
  ],
  outputsFolderPath: () => [
    '--outputsFolderPath <path>',
    'path of folder containing encrypted work result',
  ],
  encryptedOutputsFolder: () => [
    '--encryptedOutputsFolder <path>',
    'path of folder containing decrypted work result',
  ],
};

const addGlobalOptions = (cli) => {
  cli.option(...option.raw());
};

const addWalletCreateOptions = (cli) => {
  cli.option(...option.password());
  cli.option(...option.unencrypted());
  cli.option(...option.keystoredir());
};

const addWalletLoadOptions = (cli) => {
  cli.option(...option.password());
  cli.option(...option.walletFileName());
  cli.option(...option.walletAddress());
  cli.option(...option.keystoredir());
};

const question = async (
  message,
  { error = 'operation aborted by user', strict = true } = {},
) => {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message,
    },
  ]);
  if (answer.ok) return true;
  if (strict) throw Error(error);
  return false;
};

const promptPassword = async (
  message,
  { error = 'operation aborted by user', strict = true } = {},
) => {
  const answer = await inquirer.prompt([
    {
      type: 'password',
      name: 'pw',
      message,
    },
  ]);
  if (answer.pw) return answer.pw;
  if (strict) throw Error(error);
  return promptPassword(message, { error, strict });
};

const promptConfirmedPassword = async (
  message,
  confirmation = 'Please confirm your password',
) => {
  const pw1 = await promptPassword(message, { strict: false });
  const pw2 = await promptPassword(confirmation, {
    error: 'Password missmatch',
  });
  if (pw1 === pw2) return pw1;
  throw Error('Password missmatch');
};

const prompt = {
  password: message => promptPassword(message),
  confimedPassword: (message, confirmation) => promptConfirmedPassword(message, confirmation),
  custom: question,
  create: file => question(`You don't have a ${file} yet, create one?`),
  overwrite: (file, options) => question(`${file} already exists, replace it with new one?`, options),
  transfer: (currency, amount, chainName, to, chainID) => question(
    `Do you want to send ${amount} ${chainName} ${currency} to ${to} [chainID: ${chainID}]`,
  ),
  fillOrder: (amount, orderID) => question(
    `Do you want to spend ${amount} nRLC to fill order with ID ${orderID} and submit your work`,
  ),
  placeOrder: (volume, category, value) => question(
    `Do you want to place a sell order for ${volume} work category ${category} at ${value} nRLC each`,
  ),
  cancelOrder: (orderName, order) => question(`Do you want to cancel the following ${orderName}? ${order}`),
  publishOrder: (orderName, order) => question(`Do you want to publish the following ${orderName}? ${order}`),
  signGeneratedOrder: (orderName, order) => question(
    `the following ${orderName} has been created, do you want to sign it and complete your purchase? ${order}`,
  ),
  limitedVolume: (available, ask) => question(
    `Your user order is valid for ${ask} work executions but other orders allow only ${available} work executions, do you want to continue?`,
  ),
  limitedStake: (totalCost, stake, payableVolume) => question(
    `total cost is ${totalCost} nRLC and you have ${stake} nRLC staked on your account. Your stake allows you to purchase ${payableVolume} work, do you want to continue?`,
  ),
  unpublishFromJsonFile: (orderName, order) => question(`Do you want to unpublish the following ${orderName}? ${order}`),
};

prompt.transferETH = (...args) => prompt.transfer('ETH', ...args);
prompt.transferRLC = (...args) => prompt.transfer('nRLC', ...args);
prompt.sweep = (...args) => prompt.transfer('ETH and RLC', 'all wallet', ...args);

const oraOptions = {
  color: 'yellow',
  // stream: process.stdout,
  // enabled: true,
  spinner: {
    interval: 80,
    frames: [
      '⢀⠀ ▶',
      '⡀⠀ ▶',
      '⠄⠀ ▶',
      '⢂⠀ ▶',
      '⡂⠀ ▶',
      '⠅⠀ ▶',
      '⢃⠀ ▶',
      '⡃⠀ ▶',
      '⠍⠀ ▶',
      '⢋⠀ ▶',
      '⡋⠀ ▶',
      '⠍⠁ ▶',
      '⢋⠁ ▶',
      '⡋⠁ ▶',
      '⠍⠉ ▶',
      '⠋⠉ ▶',
      '⠋⠉ ▶',
      '⠉⠙ ▶',
      '⠉⠙ ▶',
      '⠉⠩ ▶',
      '⠈⢙ ▶',
      '⠈⡙ ▶',
      '⢈⠩ ▶',
      '⡀⢙ ▶',
      '⠄⡙ ▶',
      '⢂⠩ ▶',
      '⡂⢘ ▶',
      '⠅⡘ ▶',
      '⢃⠨ ▶',
      '⡃⢐ ▶',
      '⠍⡐ ▶',
      '⢋⠠ ▶',
      '⡋⢀ ▶',
      '⠍⡁ ▶',
      '⢋⠁ ▶',
      '⡋⠁ ▶',
      '⠍⠉ ▶',
      '⠋⠉ ▶',
      '⠋⠉ ▶',
      '⠉⠙ ▶',
      '⠉⠙ ▶',
      '⠉⠩ ▶',
      '⠈⢙ ▶',
      '⠈⡙ ▶',
      '⠈⠩ ▶',
      '⠀⢙ ▶',
      '⠀⡙ ▶',
      '⠀⠩ ▶',
      '⠀⢘ ▶',
      '⠀⡘ ▶',
      '⠀⠨ ▶',
      '⠀⢐ ▶',
      '⠀⡐ ▶',
      '⠀⠠ ▶',
      '⠀⢀ ▶',
      '⠀⡀ ▶',
    ],
  },
};

const helpMessage = '\n  Links:\n\n    doc: https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-api\n    bugs: https://github.com/iExecBlockchainComputing/iexec-sdk/issues\n    help: https://slack.iex.ec\n';
const outputHelpMessage = () => console.log(helpMessage);
const helpCB = (mess) => {
  const newMessage = mess.concat(helpMessage);
  console.log(newMessage);
  process.exit(1);
};

const help = (cli, { checkNoArgs = true, checkWrongArgs = true } = {}) => {
  cli.on('--help', outputHelpMessage);
  cli.parse(process.argv);

  if (checkNoArgs && cli.args.length === 0) {
    console.log('');
    console.log(colors.red('  missing argument'));
    cli.help(helpCB);
  } else if (checkWrongArgs) {
    if (typeof cli.args[cli.args.length - 1] !== 'object') {
      debug('not an object');
      if (!cli._execs[cli.args[0]]) {
        console.log('');
        console.log(colors.red(`  unknown command "${cli.args[0]}"`));
        cli.help(helpCB);
      }
    }
  }
};

const Spinner = (cmd) => {
  // debug('Spinner use raw', !!(cmd && cmd.raw));
  if (cmd && cmd.raw) {
    const nothing = () => {};
    const succeed = (message, { raw = {} } = {}) => console.log(JSON.stringify(Object.assign({ ok: true }, raw)));
    const fail = (message, { raw = {} } = {}) => console.error(JSON.stringify(Object.assign({ ok: false }, raw)));
    return {
      start: nothing,
      stop: nothing,
      info: nothing,
      warn: nothing,
      succeed,
      fail,
    };
  }
  return Ora(oraOptions);
};

const computeWalletCreateOptions = async (cmd) => {
  const spinner = Spinner(cmd);
  try {
    let pw;
    if (cmd.password) {
      pw = cmd.password;
      spinner.warn(
        'option --password may be unsafe, make sure to know what you do',
      );
    } else if (!cmd.unencrypted) {
      pw = await prompt.confimedPassword(
        'Please choose a password for wallet encryption',
      );
    }
    if (!pw && !cmd.unencrypted) {
      throw Error('missing wallet password');
    }
    if (pw && cmd.unencrypted) {
      spinner.warn('option --unencrypted will be ingnored');
    }
    if (cmd.unencrypted) {
      spinner.warn(
        'using --unencrypted will generate unprotected unecrypted wallet, this is unsafe, make sure to know what you do',
      );
    }

    const global = (cmd.keystoredir && cmd.keystoredir === 'global') || !cmd.keystoredir;
    const local = (cmd.keystoredir && cmd.keystoredir === 'local') || false;
    const path = cmd.keystoredir
      && cmd.keystoredir !== 'local'
      && cmd.keystoredir !== 'global'
      ? cmd.keystoredir
      : false;

    return {
      walletOptions: {
        global,
        local,
        path,
        password: pw,
      },
    };
  } catch (error) {
    debug('computeWalletCreateOptions()', error);
    throw error;
  }
};

const computeWalletLoadOptions = (cmd) => {
  try {
    const global = (cmd.keystoredir && cmd.keystoredir === 'global') || !cmd.keystoredir;
    const local = (cmd.keystoredir && cmd.keystoredir === 'local') || false;
    const path = cmd.keystoredir
      && cmd.keystoredir !== 'local'
      && cmd.keystoredir !== 'global'
      ? cmd.keystoredir
      : false;
    const password = cmd.password || false;
    const walletFileName = cmd.walletFile || false;
    const walletAddress = cmd.walletAddress || false;
    return {
      walletOptions: {
        global,
        local,
        path,
        walletAddress,
        walletFileName,
        password,
      },
    };
  } catch (error) {
    debug('computeWalletLoadOptions()', error);
    throw error;
  }
};

const handleError = (error, cli, cmd) => {
  const spinner = Spinner(cmd);
  const lastArg = cli.args[cli.args.length - 1];
  const lastCommandName = typeof lastArg === 'object' ? lastArg._name : '';
  const commandName = cli._name
    .split('-')
    .join(' ')
    .concat(' ', lastCommandName);
  if (!cmd || !cmd.raw) {
    console.log('\n');
  }
  spinner.fail(`command "${commandName}" failed with ${error}`, {
    raw: {
      command: commandName,
      error: error.message,
    },
  });
  if (cmd && cmd.raw) {
    process.exit(1);
  } else {
    cli.help(helpCB);
  }
};

const lbb = (str = '') => `\n${str}`;
const lba = (str = '') => `${str}\n`;
const lb = str => lba(lbb(str));

const pretty = (obj, options) => lb(prettyjson.render(obj, options));

const prettyRPC = (rpcObj) => {
  const keys = Object.keys(rpcObj);
  const prettyObj = keys.reduce((accu, curr) => {
    if (Number.isNaN(parseInt(curr, 10))) {
      return Object.assign(accu, { [curr]: rpcObj[curr].toString() });
    }
    return accu;
  }, {});
  return pretty(prettyObj);
};

module.exports = {
  help,
  Spinner,
  handleError,
  info,
  command,
  desc,
  option,
  addGlobalOptions,
  addWalletCreateOptions,
  addWalletLoadOptions,
  computeWalletCreateOptions,
  computeWalletLoadOptions,
  prompt,
  pretty,
  prettyRPC,
  lbb,
  lba,
  lb,
};
