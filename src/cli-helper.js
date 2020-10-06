const Debug = require('debug');
const Ora = require('ora');
const inquirer = require('inquirer');
const prettyjson = require('prettyjson');
const BN = require('bn.js');
const path = require('path');
const { spawn } = require('child_process');
const checkForUpdate = require('update-check');
const isDocker = require('is-docker');
const { weiAmountSchema } = require('./validator');
const { storageProviders } = require('./params-utils');
const packageJSON = require('../package.json');

const debug = Debug('help');

const listOfChoices = (arrayOfChoices, init = '') => arrayOfChoices.reduce(
  (acc, curr) => (acc ? `${acc}|"${curr}"` : `"${curr}"`),
  init,
);

const info = {
  missingConfFile: fileName => `Missing "${fileName}" file, did you forget to run "iexec init"?`,
  checkBalance: currency => `Checking ${currency} balances...`,
  userAborted: () => 'Operation aborted by user.',
  creating: obj => `Creating ${obj}...`,
  filling: obj => `Filling ${obj}...`,
  cancelling: obj => `Cancelling ${obj}...`,
  deploying: obj => `Deploying ${obj}...`,
  showing: obj => `Showing ${obj}...`,
  counting: obj => `Counting ${obj}...`,
  depositing: () => 'Making deposit...',
  checkingSwapRate: () => 'Checking swap rate...',
  claiming: obj => `Claiming ${obj}...`,
  deposited: amount => `Deposited ${amount} RLC to your iExec account`,
  withdrawing: () => 'Making withdraw...',
  withdrawn: amount => `${amount} RLC withdrawn from your iExec account`,
  downloading: () => 'Downloading result',
  decrypting: () => 'Decrypting result',
  downloaded: filePath => `Downloaded task result to file ${filePath}`,
  missingAddress: obj => `${obj} address not provided to CLI AND missing in "deployed.json"`,
  checking: obj => `Checking ${obj}...`,
  missingOrder: (orderName, optionName) => `Missing ${orderName}. You probably forgot to run "iexec order init --${optionName}"`,
  missingOrdersFile: fileName => `Missing ${fileName}. You probably forgot to run "iexec order sign"`,
  orderSigned: (orderName, fileName) => `${orderName} signed and saved in ${fileName}, you can share it: `,
};

const desc = {
  raw: () => 'use raw output',
  chainName: () => 'chain name from "chain.json"',
  userAddress: () => 'custom user address',
  initObj: objName => `init a new ${objName}`,
  deployObj: objName => `deploy a new ${objName}`,
  createObj: objName => `deploy a new ${objName}`,
  publishObj: objName => `publish a ${objName}order on the marketplace to make the ${objName} publicly available (use options to set custom usage restriction)`,
  unpublishObj: objName => `unpublish last published ${objName}order for from the marketplace`,
  createWallet: () => 'create a new wallet',
  importWallet: () => 'import a wallet from an ethereum private key',
  fill: objName => `fill an ${objName} to execute a work`,
  cancel: objName => `cancel an ${objName}`,
  showObj: (objName, owner = 'user') => `show ${owner} ${objName} details`,
  countObj: (objName, owner = 'user') => `get ${owner} ${objName} count`,
  claimObj: objName => `claim a ${objName} that is not COMPLETED`,
  deposit: () => 'deposit RLC onto your iExec account (default unit nRLC)',
  withdraw: () => 'withdraw RLC from your iExec account (default unit nRLC)',
  getETH: () => 'apply for test ether from pre-registered faucets',
  getRLC: () => 'apply for test RLC from iExec faucet',
  sendETH: () => 'send ether to an address (default unit ether)',
  sendRLC: () => 'send RLC to an address (default unit nRLC)',
  sweep: () => 'send all ether and RLC to an address',
  info: () => 'show iExec contracts addresses',
  validateRessource: () => 'validate an app/dataset/workerpool description before submitting it to the iExec registry',
  decrypt: () => 'decrypt work result',
  sign: () => 'sign orders from "iexec.json" and store them into "orders.json"',
  cancelOrder: objName => `cancel a signed ${objName}`,
  publish: objName => `publish a signed ${objName}`,
  unpublish: objName => `unpublish a signed ${objName}`,
  pushDatasetSecret: () => 'push the dataset secret to the secret management service (default push the last secret genarated, use --secret-path <secretPath> to overwrite)',
  pushResultKey: () => 'push the public encryption key to the secret management service',
  checkSecret: () => 'check if a secret exists in the secret management service',
  encryptDataset: () => 'generate a key and encrypt the datasets files from "./datasets/original"',
  generateKeys: () => 'generate a beneficiary key pair to encrypt and decrypt the results',
  decryptResults: () => 'decrypt encrypted results with beneficary key',
  bridgeToSidechain: () => 'send RLC from the mainchain to the sidechain (default unit nRLC)',
  bridgeToMainchain: () => 'send RLC from the sidechain to the mainchain (default unit nRLC)',
  appRun: () => 'run an iExec application at market price (default run last deployed app)',
  requestRun: () => 'request an iExec application execution at limit price',
  initStorage: () => 'initialize the remote storage',
  checkStorage: () => 'check if the remote storage is initialized',
};

const option = {
  quiet: () => ['--quiet', 'stop prompting updates'],
  raw: () => ['--raw', desc.raw()],
  chain: () => ['--chain <name>', desc.chainName()],
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
  unpublishAllOrders: () => ['--all', 'unpublish all orders'],
  showAppOrder: () => ['--app [orderHash]', 'show an apporder'],
  showDatasetOrder: () => ['--dataset [orderHash]', 'show a datasetorder'],
  showWorkerpoolOrder: () => [
    '--workerpool [orderHash]',
    'show a workerpoolorder',
  ],
  showRequestOrder: () => ['--request [orderHash]', 'show a requestorder'],
  showOrderDeals: () => ['--deals', 'show the deals produced by the order'],
  fillAppOrder: () => [
    '--app <orderHash>',
    'specify the app order from the marketplace to fill',
  ],
  fillDatasetOrder: () => [
    '--dataset <orderHash>',
    'specify the dataset order from the marketplace to fill',
  ],
  fillWorkerpoolOrder: () => [
    '--workerpool <orderHash>',
    'specify the wokerpool order from the marketplace to fill',
  ],
  fillRequestOrder: () => [
    '--request <orderHash>',
    'specify the requestorder from the marketplace to fill',
  ],
  fillRequestParams: () => [
    '--params <json>',
    'specify the params of the request, existing request order will be ignored\n* usage: --params \'{"iexec_args":"dostuff","iexec_input_files":["https://example.com/file.zip"]}\'',
  ],
  appRunWatch: () => ['--watch', 'watch execution status changes'],
  to: () => ['--to <address>', 'receiver address'],
  skipWallet: () => ['--skip-wallet', 'skip creating a new wallet'],
  forceCreate: () => [
    '--force',
    'force wallet creation even if old wallet exists',
  ],
  force: () => ['--force', 'force perform action without prompting user'],
  showPrivateKey: () => [
    '--show-private-key',
    'allow displaying walletprivate key',
  ],
  watch: () => ['--watch', 'watch execution status changes'],
  download: () => [
    '--download [fileName]',
    'download a task result data to local filesystem, if completed',
  ],
  decrypt: () => ['--decrypt', 'decrypt an encrypted result'],
  category: () => ['--category <id>', 'specify the work category'],
  orderbookWorkerpool: () => [
    '--workerpool <address>',
    'filter by workerpool address',
  ],
  orderbookRequester: () => [
    '--requester <address>',
    'filter by requester address',
  ],
  orderbookApp: () => ['--app <address>', 'filter by app address'],
  orderbookDataset: () => ['--dataset <address>', 'filter by dataset address'],
  requiredTag: () => [
    '--require-tag <tag>',
    'specify minimum required tags\n* usage: --require-tag tag1,tag2',
  ],
  maxTag: () => [
    '--max-tag <tag>',
    'specify maximun tags (exclude not listed tags)\n* usage: --max-tag tag1,tag2',
  ],
  tag: () => ['--tag <tag>', 'specify exact tags\n* usage: --tag tag1,tag2'],
  password: () => [
    '--password <password>',
    'password used to encrypt the wallet (unsafe)',
  ],
  unencrypted: () => [
    '--unencrypted',
    'generate unsafe unencrypted wallet in working directory (--keystoredir option is ignored)',
  ],
  keystoredir: () => [
    '--keystoredir <path>',
    `specify the wallet directory <${listOfChoices([
      'global',
      'local',
    ])}|custom>`,
  ],
  walletAddress: () => [
    '--wallet-address <walletAddress>',
    'specify the address of the wallet to use',
  ],
  walletFileName: () => [
    '--wallet-file <walletFileName>',
    'specify the name of the wallet file to use',
  ],
  secretPath: () => [
    '--secret-path <secretPath>',
    'push the secret from a file',
  ],
  datasetKeystoredir: () => [
    '--dataset-keystoredir <path>',
    'specify dataset TEE key directory',
  ],
  beneficiaryKeystoredir: () => [
    '--beneficiary-keystoredir <path>',
    'specify beneficiary TEE keys directory',
  ],
  beneficiaryKeyFile: () => [
    '--beneficiary-key-file <fileName>',
    'specify beneficiary TEE key file to use',
  ],
  initDatasetFolders: () => [
    '--encrypted',
    'init datasets folder tree for dataset encryption',
  ],
  encryptedDatasetDir: () => [
    '--encrypted-dataset-dir <path>',
    'specify the encrypted dataset directory',
  ],
  originalDatasetDir: () => [
    '--original-dataset-dir <path>',
    'specify the original dataset directory',
  ],
  datasetEncryptionAlgorithm: () => [
    '--algorithm <algorithm>',
    `specify the encryption algorithm to use <${listOfChoices([
      // 'aes-256-cbc',
      'scone',
    ])}>`,
  ],
  txGasPrice: () => [
    '--gas-price <amount unit...>',
    'set custom gas price for transactions (default unit wei)',
  ],
  forceUpdateSecret: () => ['--force-update', 'update if already exists'],
  storageToken: () => [
    '--token <token>',
    'storage provider authorization token (unsafe)',
  ],
  skipRequestCheck: () => [
    '--skip-request-check',
    'skip request validity checks, this may result in task execution fail',
  ],
};

const orderOption = {
  app: ({ allowDeployed = true } = {}) => [
    `--app <${
      allowDeployed ? listOfChoices(['deployed'], 'address') : 'address'
    }>`,
    `app address${
      allowDeployed
        ? ', use "deployed" to use last deployed from "deployed.json"'
        : ''
    }`,
  ],
  dataset: ({ allowDeployed = true } = {}) => [
    `--dataset <${
      allowDeployed ? listOfChoices(['deployed'], 'address') : 'address'
    }>`,
    `dataset address${
      allowDeployed
        ? ', use "deployed" to use last deployed from "deployed.json"'
        : ''
    }`,
  ],
  workerpool: ({ allowDeployed = true } = {}) => [
    `--workerpool <${
      allowDeployed ? listOfChoices(['deployed'], 'address') : 'address'
    }>`,
    `workerpool address${
      allowDeployed
        ? ', use "deployed" to use last deployed from "deployed.json"'
        : ''
    }`,
  ],
  price: () => [
    '--price <amount unit...>',
    'price per task (default unit nRLC)',
  ],
  appprice: () => [
    '--app-price <amount unit...>',
    'app price per task (default unit nRLC)',
  ],
  datasetprice: () => [
    '--dataset-price <amount unit...>',
    'dataset price per task (default unit nRLC)',
  ],
  workerpoolprice: () => [
    '--workerpool-price <amount unit...>',
    'workerpool price per task (default unit nRLC)',
  ],
  volume: () => ['--volume <volume>', 'number of run'],
  tag: () => ['--tag <tag>', 'specify tags\n* usage: --tag tag1,tag2'],
  category: () => ['--category <id>', 'id of the task category'],
  trust: () => ['--trust <integer>', 'trust level'],
  apprestrict: () => [
    '--app-restrict <address>',
    'restrict usage to specific app',
  ],
  datasetrestrict: () => [
    '--dataset-restrict <address>',
    'restrict usage to specific dataset',
  ],
  workerpoolrestrict: () => [
    '--workerpool-restrict <address>',
    'restrict usage to specific workerpool',
  ],
  requesterrestrict: () => [
    '--requester-restrict <address>',
    'restrict usage to specific requester',
  ],
  beneficiary: () => [
    '--beneficiary <address>',
    'specify the beneficiary of the request (default user address)',
  ],
  callback: () => [
    '--callback <address>',
    'specify the callback address of the request',
  ],
  params: () => [
    '--params <json>',
    'specify the params of the request\n* usage: --params \'{"iexec_args":"dostuff","iexec_input_files":["https://example.com/file.zip"]}\'',
  ],
  requestArgs: () => [
    '--args <string>',
    'specify the arguments to pass to the app',
  ],
  requestInputFiles: () => [
    '--input-files <fileUrl>',
    'specify the URL of input files to be used by the app\n* usage: --input-files https://example.com/foo.txt,https://example.com/bar.zip',
  ],
  requestEncryptResult: () => [
    '--encrypt-result',
    'encrypt the result archive with the beneficiary public key',
  ],
  requestStorageProvider: () => [
    `--storage-provider <${listOfChoices(storageProviders())}>`,
    'specify the storage to use to store the result archive',
  ],
};

const addGlobalOptions = (cli) => {
  cli.option(...option.raw());
  cli.option(...option.quiet());
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
  { error = info.userAborted(), rejectDefault = false, strict = true } = {},
) => {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message,
      default: !rejectDefault,
    },
  ]);
  if (answer.ok) return true;
  if (strict) throw Error(error);
  return false;
};

const promptPassword = async (
  message,
  { error = info.userAborted(), strict = true, useMask = false } = {},
) => {
  const answer = await inquirer.prompt([
    {
      type: 'password',
      name: 'pw',
      message,
      mask: useMask ? '*' : undefined,
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
  password: (message, options) => promptPassword(message, options),
  confimedPassword: (message, confirmation) => promptConfirmedPassword(message, confirmation),
  custom: question,
  create: file => question(`You don't have a ${file} yet, create one?`),
  overwrite: (file, options) => question(`"${file}" already exists, replace it with new one?`, options),
  dirNotEmpty: (dir, options) => question(
    `Directory ${dir} is not empty, continue and replace content?`,
    options,
  ),
  fileExists: (filePath, options) => question(`File ${filePath} already exists, continue and replace?`, options),
  transfer: (currency, amount, chainName, to, chainId) => question(
    `Do you want to send ${amount} ${chainName} ${currency} to ${to} [chainId: ${chainId}]`,
  ),
  cancelOrder: (orderName, order) => question(`Do you want to cancel the following ${orderName}? ${order}`),
  publishOrder: (orderName, order) => question(`Do you want to publish the following ${orderName}? ${order}`),
  unpublishOrder: (objName, address, all) => question(
    `Do you want to unpublish ${
      all ? 'all your' : 'your last'
    } ${objName}order${all ? 's' : ''} for ${objName} ${address}?`,
  ),
  signGeneratedOrder: (orderName, order) => question(
    `the following ${orderName} has been created, do you want to sign it and complete your purchase? ${order}`,
  ),
  limitedVolume: (available, ask) => question(
    `Your user order is valid for ${ask} work executions but other orders allow only ${available} work executions, do you want to continue?`,
  ),
  unpublishFromJsonFile: (orderName, order) => question(`Do you want to unpublish the following ${orderName}? ${order}`),
};

prompt.transferETH = (...args) => prompt.transfer('ether', ...args);
prompt.transferRLC = (...args) => prompt.transfer('RLC', ...args);
prompt.sweep = currencies => (...args) => prompt.transfer(currencies, 'all wallet', ...args);

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

const helpMessage = '\nLinks:\n  doc: https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-cli-api\n  bugs: https://github.com/iExecBlockchainComputing/iexec-sdk/issues\n  help: https://slack.iex.ec\n';
const outputHelpMessage = () => console.log(helpMessage);

const help = (cli) => {
  cli.on('--help', outputHelpMessage);
  cli.parse();
};

const Spinner = (opts) => {
  if (opts && opts.raw) {
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

const checkUpdate = async (opts) => {
  if (opts && !opts.quiet && !opts.raw) {
    const NODEJS_UPGRADE_CMD = 'npm -g i iexec';
    const DOCKER_UPGRADE_CMD = 'docker pull iexechub/iexec-sdk';
    const update = await checkForUpdate(packageJSON, { interval: 10 }).catch(
      debug,
    );
    if (update) {
      const upgradeCMD = isDocker() ? DOCKER_UPGRADE_CMD : NODEJS_UPGRADE_CMD;
      const spin = Spinner(opts);
      spin.info(
        `iExec SDK update available ${packageJSON.version} →  ${update.latest}, Run "${upgradeCMD}" to update ("--quiet" or "--raw" disable update notification)\n`,
      );
    }
  }
};

const computeWalletCreateOptions = async (opts) => {
  const spinner = Spinner(opts);
  try {
    let pw;
    if (opts.password) {
      pw = opts.password;
      spinner.warn(
        'Option --password may be unsafe, make sure to know what you do',
      );
    } else if (!opts.unencrypted) {
      pw = await prompt.confimedPassword(
        'Please choose a password for wallet encryption',
      );
    }
    if (!pw && !opts.unencrypted) {
      throw Error('Missing wallet password');
    }
    if (pw && opts.unencrypted) {
      spinner.warn('Option --unencrypted will be ingnored');
    }
    if (opts.unencrypted) {
      spinner.warn(
        'Using --unencrypted will generate unprotected unencrypted wallet, this is unsafe, make sure to know what you do',
      );
    }

    const global = (opts.keystoredir && opts.keystoredir === 'global') || !opts.keystoredir;
    const local = (opts.keystoredir && opts.keystoredir === 'local') || false;
    const keystorePath = opts.keystoredir
      && opts.keystoredir !== 'local'
      && opts.keystoredir !== 'global'
      ? opts.keystoredir
      : false;

    return {
      walletOptions: {
        global,
        local,
        path: keystorePath,
        password: pw,
      },
    };
  } catch (error) {
    debug('computeWalletCreateOptions()', error);
    throw error;
  }
};

const computeWalletLoadOptions = (opts) => {
  try {
    const global = (opts && opts.keystoredir && opts.keystoredir === 'global')
      || !opts
      || !opts.keystoredir;
    const local = (opts && opts.keystoredir && opts.keystoredir === 'local') || false;
    const keystorePath = opts
      && opts.keystoredir
      && opts.keystoredir !== 'local'
      && opts.keystoredir !== 'global'
      ? opts.keystoredir
      : false;
    const password = (opts && opts.password) || false;
    const walletFileName = (opts && opts.walletFile) || false;
    const walletAddress = (opts && opts.walletAddress) || false;
    return {
      walletOptions: {
        global,
        local,
        path: keystorePath,
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

const secretsFolderName = '.secrets';
const datasetSecretsFolderName = 'datasets';
const beneficiarySecretsFolderName = 'beneficiary';
const datasetsFolderName = 'datasets';
const originalDatasetFolderName = 'original';
const encryptedDatasetFolderName = 'encrypted';

const createEncFolderPaths = (opts = {}) => {
  const absolutePath = relativeOrAbsolutePath => (path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(process.cwd(), relativeOrAbsolutePath));

  const datasetSecretsFolderPath = opts.datasetKeystoredir
    ? absolutePath(opts.datasetKeystoredir)
    : path.join(process.cwd(), secretsFolderName, datasetSecretsFolderName);
  const beneficiarySecretsFolderPath = opts.beneficiaryKeystoredir
    ? absolutePath(opts.beneficiaryKeystoredir)
    : path.join(process.cwd(), secretsFolderName, beneficiarySecretsFolderName);
  const originalDatasetFolderPath = opts.originalDatasetDir
    ? absolutePath(opts.originalDatasetDir)
    : path.join(process.cwd(), datasetsFolderName, originalDatasetFolderName);
  const encryptedDatasetFolderPath = opts.encryptedDatasetDir
    ? absolutePath(opts.encryptedDatasetDir)
    : path.join(process.cwd(), datasetsFolderName, encryptedDatasetFolderName);

  const paths = {
    datasetSecretsFolderPath,
    beneficiarySecretsFolderPath,
    originalDatasetFolderPath,
    encryptedDatasetFolderPath,
  };
  debug('paths', paths);
  return paths;
};

const DEFAULT_ENCRYPTED_RESULTS_NAME = 'encryptedResults.zip';
const DEFAULT_DECRYPTED_RESULTS_NAME = 'results.zip';
const publicKeyName = address => `${address}_key.pub`;
const privateKeyName = address => `${address}_key`;

const computeTxOptions = async (opts) => {
  let gasPrice;
  if (opts.gasPrice) {
    debug('opts.gasPrice', opts.gasPrice);
    const bnGasPrice = new BN(
      await weiAmountSchema({ defaultUnit: 'wei' }).validate(opts.gasPrice),
    );
    gasPrice = '0x'.concat(bnGasPrice.toString('hex'));
  }
  debug('gasPrice', gasPrice);
  return Object.assign({}, { gasPrice });
};

const getPropertyFormChain = (chain, property, { strict = true } = {}) => {
  const value = chain[property];
  if (value === undefined && strict) throw Error(`Missing ${property} in "chain.json" for chain ${chain.id}`);
  return value;
};

const handleError = (error, cli, opts) => {
  debug('error', error);
  const spinner = Spinner(opts);
  const lastCommandName = cli.rawArgs[2] || '';
  const commandName = cli._name
    .split('-')
    .join(' ')
    .concat(' ', lastCommandName);
  if (!opts || !opts.raw) {
    console.log('\n');
  }
  spinner.fail(`Command "${commandName}" failed with ${error}`, {
    raw: {
      command: commandName,
      error: { name: error.name, message: error.message },
    },
  });
  process.exit(1);
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

const isEthAddress = (address, { strict = false } = {}) => {
  const isHexString = typeof address === 'string' && address.substr(0, 2) === '0x';
  const isAddress = isHexString && address.length === 42;
  if (!isAddress && strict) {
    throw Error(`Address ${address} is not a valid Ethereum address`);
  }
  return isAddress;
};

const isBytes32 = (str, { strict = false } = {}) => {
  if (
    typeof str !== 'string'
    || str.length !== 66
    || str.substr(0, 2) !== '0x'
  ) {
    if (strict) throw new Error(`${str} is not a valid Bytes32 HexString`);
    return false;
  }
  return true;
};

const renderTasksStatus = (tasksStatusMap) => {
  const tasksArray = Object.values(tasksStatusMap);
  const runningTasksArray = tasksArray.filter(
    task => task.status !== 3 && !task.taskTimedOut,
  );
  const completedTasksArray = tasksArray.filter(task => task.status === 3);
  const timedoutTasksArray = tasksArray.filter(task => task.taskTimedOut);
  const completedMsg = `${completedTasksArray.length}/${tasksArray.length} tasks completed\n`;
  const failedMsg = timedoutTasksArray.length > 0
    ? `${timedoutTasksArray.length}/${tasksArray.length} tasks failed\n`
    : '';
  const statusMsg = runningTasksArray.length > 0
    ? `${runningTasksArray.length}/${
      tasksArray.length
    } tasks running:${pretty(
      runningTasksArray.map(
        ({ idx, taskid, statusName }) => `Task idx ${idx} (${taskid}) status ${statusName}`,
      ),
    )}`
    : '';
  return `${completedMsg}${failedMsg}${statusMsg}`;
};

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

module.exports = {
  help,
  checkUpdate,
  Spinner,
  handleError,
  info,
  desc,
  option,
  orderOption,
  getPropertyFormChain,
  addGlobalOptions,
  addWalletCreateOptions,
  addWalletLoadOptions,
  computeWalletCreateOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  createEncFolderPaths,
  DEFAULT_ENCRYPTED_RESULTS_NAME,
  DEFAULT_DECRYPTED_RESULTS_NAME,
  publicKeyName,
  privateKeyName,
  prompt,
  pretty,
  prettyRPC,
  isEthAddress,
  isBytes32,
  lbb,
  lba,
  lb,
  spawnAsync,
  renderTasksStatus,
};
