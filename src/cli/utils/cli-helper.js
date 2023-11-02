import Debug from 'debug';
import { Option } from 'commander';
import Ora from 'ora';
import inquirer from 'inquirer';
import { render } from 'prettyjson';
import { isAbsolute, join } from 'path';
import checkForUpdate from 'update-check';
import isDocker from 'is-docker';
import {
  weiAmountSchema,
  positiveStrictIntSchema,
} from '../../common/utils/validator.js';
import {
  TEE_FRAMEWORKS,
  STORAGE_PROVIDERS,
} from '../../common/utils/constant.js';
import packageJSON, { version } from '../../common/generated/sdk/package.js';

const debug = Debug('help');

export const finalizeCli = (cli) => {
  if (process.env.GENERATE_DOC) {
    const processOptions = (options) =>
      options.map((o) => ({
        flags: o.flags,
        description: o.description,
      }));
    const getUsage = (cmd) => {
      const OPTIONS = '[options]';
      const usage = cmd.usage();
      if (!usage.includes(OPTIONS)) {
        return usage;
      }
      return `${usage.replace(OPTIONS, '').trim()} ${OPTIONS}`.trim();
    };
    console.log(
      JSON.stringify({
        name: cli.name(),
        description: cli.description() || undefined,
        usage: getUsage(cli),
        options: processOptions(cli.options),
        subCommands: cli.commands.map((x) => ({
          name: x.name(),
          alias: x.alias(),
          description: x.description() || undefined,
          usage: getUsage(x),
          options: processOptions(x.options),
        })),
      }),
    );
    process.exit(0);
  }

  cli.showHelpAfterError();
  cli.addHelpText(
    'afterAll',
    '\nLinks:\n  doc: https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-cli-api\n  bugs: https://github.com/iExecBlockchainComputing/iexec-sdk/issues\n',
  );
  cli.parse();
};

const listOfChoices = (arrayOfChoices, init = '') =>
  arrayOfChoices.reduce(
    (acc, curr) => (acc ? `${acc}|"${curr}"` : `"${curr}"`),
    init,
  );

export const info = {
  missingConfFile: (fileName) =>
    `Missing "${fileName}" file, did you forget to run "iexec init"?`,
  checkBalance: (currency) => `Checking ${currency} balances...`,
  userAborted: () => 'Operation aborted by user.',
  creating: (obj) => `Creating ${obj}...`,
  filling: (obj) => `Filling ${obj}...`,
  cancelling: (obj) => `Cancelling ${obj}...`,
  deploying: (obj) => `Deploying ${obj}...`,
  showing: (obj) => `Showing ${obj}...`,
  counting: (obj) => `Counting ${obj}...`,
  depositing: () => 'Making deposit...',
  checkingSwapRate: () => 'Checking swap rate...',
  claiming: (obj) => `Claiming ${obj}...`,
  deposited: (amount) => `Deposited ${amount} RLC to your iExec account`,
  withdrawing: () => 'Making withdraw...',
  withdrawn: (amount) => `${amount} RLC withdrawn from your iExec account`,
  downloading: () => 'Downloading result',
  decrypting: () => 'Decrypting result',
  downloaded: (filePath) => `Downloaded task result to file ${filePath}`,
  missingAddressOrDeployed: (objName, chainId) =>
    `Missing ${objName}Address and no ${objName} found in "deployed.json" for chain ${chainId}`,
  missingEnsForObjectAtAddress: (objName, address) =>
    `Missing ENS for ${objName} ${address}. You probably forgot to run "iexec ens register <name> --for ${address}"`,
  checking: (obj) => `Checking ${obj}...`,
  missingOrder: (orderName, optionName) =>
    `Missing ${orderName}. You probably forgot to run "iexec order init --${optionName}"`,
  missingOrdersFile: (fileName) =>
    `Missing ${fileName}. You probably forgot to run "iexec order sign"`,
  orderSigned: (orderName, fileName) =>
    `${orderName} signed and saved in ${fileName}, you can share it: `,
};

export const desc = {
  raw: () => 'use raw output',
  chainName: () => 'chain name from "chain.json"',
  userAddress: () => 'custom user address',
  initObj: (objName) => `init a new ${objName}`,
  deployObj: (objName) => `deploy a new ${objName}`,
  createObj: (objName) => `create a new ${objName}`,
  publishObj: (objName) =>
    `publish a ${objName}order on the marketplace to make the ${objName} publicly available (use options to set custom usage restriction)`,
  unpublishObj: (objName) =>
    `unpublish last published ${objName}order for from the marketplace`,
  createWallet: () => 'create a new wallet',
  importWallet: () => 'import a wallet from an ethereum private key',
  fill: (objName) => `fill an ${objName} to execute a work`,
  cancel: (objName) => `cancel an ${objName}`,
  showObj: (objName, owner = 'user') => `show ${owner} ${objName} details`,
  countObj: (objName, owner = 'user') => `get ${owner} ${objName} count`,
  claimObj: (objName) => `claim a ${objName} that is not COMPLETED`,
  deposit: () => 'deposit RLC onto your iExec account (default unit nRLC)',
  withdraw: () => 'withdraw RLC from your iExec account (default unit nRLC)',
  sendETH: () => 'send ether to an address (default unit ether)',
  sendRLC: () => 'send RLC to an address (default unit RLC)',
  sendNRLC: () =>
    '[DEPRECATED see send-RLC] send RLC to an address (WARNING! default unit nRLC)',
  sweep: () => 'send all ether and RLC to an address',
  info: () => 'show iExec contracts addresses',
  validateResource: () =>
    'validate an app/dataset/workerpool description before submitting it to the iExec registry',
  decrypt: () => 'decrypt work result',
  sign: () => 'sign orders from "iexec.json" and store them into "orders.json"',
  cancelOrder: (objName) => `cancel a signed ${objName}`,
  publish: (objName) => `publish a signed ${objName}`,
  unpublish: (objName) => `unpublish a signed ${objName}`,
  transferObj: (objName) =>
    `transfer the ownership of the ${objName} to an address`,
  pushDatasetSecret: () =>
    'push the dataset secret to the secret management service (default push the last secret generated, use --secret-path <secretPath> to overwrite)',
  pushResultKey: () =>
    'push the public encryption key to the secret management service',
  pushRequesterSecret: () =>
    'push a requester named secret to the secret management service',
  checkSecret: () =>
    'check if a secret exists in the secret management service',
  encryptDataset: () =>
    "for each file in the original dataset directory, generate a key, create an encrypted copy of the file in the encrypted dataset directory and compute the encrypted file's checksum",
  generateKeys: () =>
    'generate a beneficiary key pair to encrypt and decrypt the results',
  decryptResults: () => 'decrypt encrypted results with beneficiary key',
  bridgeToSidechain: () =>
    'send RLC from the mainchain to the sidechain (default unit nRLC)',
  bridgeToMainchain: () =>
    'send RLC from the sidechain to the mainchain (default unit nRLC)',
  wrapEnterpriseRLC: () =>
    'swap RLC for the same amount of eRLC (default unit nRLC) - the wallet must be authorized to interact with eRLC',
  unwrapEnterpriseRLC: () =>
    'swap eRLC for the same amount of RLC (default unit neRLC) - the wallet must be authorized to interact with eRLC',
  appRun: () =>
    'run an iExec application at market price (default run last deployed app)',
  requestRun: () => 'request an iExec application execution at limit price',
  initStorage: () => 'initialize the remote storage',
  checkStorage: () => 'check if the remote storage is initialized',
  debugTask: () => `show task debug information`,
};

export const option = {
  quiet: () => ['--quiet', 'stop prompting updates'],
  raw: () => ['--raw', desc.raw()],
  chain: () => ['--chain <name>', desc.chainName()],
  user: () => ['--user <address>', desc.userAddress()],
  initTee: () => ['--tee', 'use the Trusted Execution Environment template'],
  initAppOrder: () => ['--app', 'init an app sell order'],
  initDatasetOrder: () => ['--dataset', 'init a dataset sell order'],
  initWorkerpoolOrder: () => ['--workerpool', 'init a workerpool sell order'],
  initRequestOrder: () => ['--request', 'init a buy request order'],
  signAppOrder: () => ['--app', 'sign an selling apporder'],
  signDatasetOrder: () => ['--dataset', 'sign a selling datasetorder'],
  signWorkerpoolOrder: () => ['--workerpool', 'sign a selling workerpoolorder'],
  signRequestOrder: () => ['--request', 'sign a buying requestorder'],
  cancelAppOrder: () => ['--app', 'cancel a signed apporder'],
  cancelDatasetOrder: () => ['--dataset', 'cancel a signed datasetorder'],
  cancelWorkerpoolOrder: () => [
    '--workerpool',
    'cancel a signed workerpoolorder',
  ],
  cancelRequestOrder: () => ['--request', 'cancel a signed requestorder'],
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
    'specify the workerpool order from the marketplace to fill',
  ],
  fillRequestOrder: () => [
    '--request <orderHash>',
    'specify the requestorder from the marketplace to fill',
  ],
  fillRequestParams: () => [
    '--params <json>',
    'specify the params of the request, existing request order will be ignored\n* usage: --params \'{"iexec_args":"do stuff","iexec_input_files":["https://example.com/file.zip"]}\'',
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
    'allow displaying wallet private key',
  ],
  watch: () => ['--watch', 'watch execution status changes'],
  download: () => [
    '--download [fileName]',
    'download a task result data to local filesystem, if completed',
  ],
  decrypt: () => ['--decrypt', 'decrypt an encrypted result'],
  category: () => ['--category <id>', 'specify the work category'],
  filterAppSpecific: () => ['--app <address>', 'filter by app'],
  filterDatasetSpecific: () => ['--dataset <address>', 'filter by dataset'],
  filterBeneficiarySpecific: () => [
    '--beneficiary <address>',
    'filter by beneficiary',
  ],
  includeAppSpecific: () => [
    '--app <address>',
    'include private orders for specified app',
  ],
  includeDatasetSpecific: () => [
    '--dataset <address>',
    'include private orders for specified dataset',
  ],
  includeWorkerpoolSpecific: () => [
    '--workerpool <address>',
    'include private orders for specified workerpool',
  ],
  includeRequesterSpecific: () => [
    '--requester <address>',
    'include private orders for specified requester',
  ],
  requiredTag: () => [
    '--require-tag <tag>',
    'specify minimum required tags\n* usage: --require-tag tag1,tag2',
  ],
  maxTag: () => [
    '--max-tag <tag>',
    'specify maximum tags (exclude not listed tags)\n* usage: --max-tag tag1,tag2',
  ],
  tag: () => ['--tag <tag>', 'specify exact tags\n* usage: --tag tag1,tag2'],
  minVolume: () => ['--min-volume <integer>', 'specify minimum volume'],
  minTrust: () => ['--min-trust <integer>', 'specify minimum trust'],
  maxTrust: () => ['--max-trust <integer>', 'specify maximum trust'],
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
  txGasPrice: () => [
    '--gas-price <amount unit...>',
    'set custom gas price for transactions (default unit wei)',
  ],
  txConfirms: () => [
    '--confirms <blockCount>',
    'set custom block count to wait for transactions confirmation (default 1 block)',
  ],
  forceUpdateSecret: () => ['--force-update', 'update if already exists'],
  storageToken: () => [
    '--token <token>',
    'storage provider authorization token (unsafe)',
  ],
  secretValue: () => ['--secret-value <secretValue>', 'secret value (unsafe)'],
  skipPreflightCheck: () => [
    '--skip-preflight-check',
    'skip preflight check, this may result in task execution fail',
  ],
};

export const optionCreator = {
  teeFramework: () =>
    new Option(
      `--tee-framework <name>`,
      'specify the TEE framework to use',
    ).choices(Object.values(TEE_FRAMEWORKS)),
};

export const orderOption = {
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
    'specify the params of the request\n* usage: --params \'{"iexec_args":"do stuff","iexec_input_files":["https://example.com/file.zip"]}\'',
  ],
  requestArgs: () => [
    '--args <string>',
    'specify the arguments to pass to the app',
  ],
  requestSecrets: () => [
    '--secret <secretMapping...>',
    'specify the requester secrets mappings (<appSecretKey>=<requesterSecretName>) to use in the app (only available for TEE tasks, use with --tag tee)\n* usage: \n  * [command] [args] --secret 1=login 2=password\n  * [command] [args] --secret 1=login --secret 2=password\n  * [command] --secret 1=login --secret 2=password -- [args]\n* please note that this option is variadic, any number of mappings can be passed, use `--` to stop the list\n',
  ],
  requestInputFiles: () => [
    '--input-files <fileUrl>',
    'specify the URL of input files to be used by the app\n* usage: --input-files https://example.com/foo.txt,https://example.com/bar.zip',
  ],
  requestEncryptResult: () => [
    '--encrypt-result',
    'encrypt the result archive with the beneficiary public key (only available for TEE tasks, use with --tag tee)',
  ],
  requestStorageProvider: () => [
    `--storage-provider <${listOfChoices(Object.values(STORAGE_PROVIDERS))}>`,
    'specify the storage to use to store the result archive',
  ],
};

export const addGlobalOptions = (cli) => {
  cli.option(...option.raw());
  cli.option(...option.quiet());
};

export const addWalletCreateOptions = (cli) => {
  cli.option(...option.password());
  cli.option(...option.unencrypted());
  cli.option(...option.keystoredir());
};

export const addWalletLoadOptions = (cli) => {
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
    error: 'Password mismatch',
  });
  if (pw1 === pw2) return pw1;
  throw Error('Password mismatch');
};

export const prompt = {
  password: (message, options) => promptPassword(message, options),
  confirmedPassword: (message, confirmation) =>
    promptConfirmedPassword(message, confirmation),
  custom: question,
  create: (file) => question(`You don't have a ${file} yet, create one?`),
  overwrite: (file, options) =>
    question(`"${file}" already exists, replace it with new one?`, options),
  dirNotEmpty: (dir, options) =>
    question(
      `Directory ${dir} is not empty, continue and replace content?`,
      options,
    ),
  fileExists: (filePath, options) =>
    question(`File ${filePath} already exists, continue and replace?`, options),
  transfer: (currency, amount, chainName, to, chainId) =>
    question(
      `Do you want to send ${amount} ${chainName} ${currency} to ${to} [chainId: ${chainId}]`,
    ),
  transferObj: (objName, objAddress, to, chainId) =>
    question(
      `Do you want to transfer the ownership of the ${objName} ${objAddress} to ${to} [chainId: ${chainId}]`,
    ),
  wrap: (amount, chainId) =>
    question(
      `Do you want to swap ${amount} RLC for eRLC (1 RLC = 1 eRLC) [chainId: ${chainId}]`,
    ),
  unwrap: (amount, chainId) =>
    question(
      `Do you want to swap ${amount} eRLC for RLC (1 eRLC = 1 RLC) [chainId: ${chainId}]`,
    ),
  cancelOrder: (orderName, order) =>
    question(`Do you want to cancel the following ${orderName}? ${order}`),
  publishOrder: (orderName, order) =>
    question(`Do you want to publish the following ${orderName}? ${order}`),
  unpublishOrder: (objName, address, all) =>
    question(
      `Do you want to unpublish ${
        all ? 'all your' : 'your last'
      } ${objName}order${all ? 's' : ''} for ${objName} ${address}?`,
    ),
  signGeneratedOrder: (orderName, order) =>
    question(
      `the following ${orderName} has been created, do you want to sign it and complete your purchase? ${order}`,
    ),
  limitedVolume: (available, ask) =>
    question(
      `Your user order is valid for ${ask} work executions but other orders allow only ${available} work executions, do you want to continue?`,
    ),
  unpublishFromJsonFile: (orderName, order) =>
    question(`Do you want to unpublish the following ${orderName}? ${order}`),
  more: () => question('Show more?', { rejectDefault: true, strict: false }),
};

prompt.transferETH = (...args) => prompt.transfer('ether', ...args);
prompt.transferRLC = (...args) => prompt.transfer('RLC', ...args);
prompt.sweep =
  (currencies) =>
  (...args) =>
    prompt.transfer(currencies, 'all wallet', ...args);

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

export const Spinner = (opts) => {
  if (opts && opts.raw) {
    const nothing = () => {};
    const succeed = (message, { raw = {} } = {}) =>
      console.log(JSON.stringify({ ok: true, ...raw }));
    const fail = (message, { raw = {} } = {}) =>
      console.error(JSON.stringify({ ok: false, ...raw }));
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

export const checkUpdate = async (opts) => {
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
        `iExec SDK update available ${version} →  ${update.latest}, Run "${upgradeCMD}" to update ("--quiet" or "--raw" disable update notification)\n`,
      );
    }
  }
};

export const computeWalletCreateOptions = async (opts) => {
  const spinner = Spinner(opts);
  try {
    let pw;
    if (opts.password) {
      pw = opts.password;
      spinner.warn(
        'Option --password may be unsafe, make sure to know what you do',
      );
    } else if (!opts.unencrypted) {
      pw = await prompt.confirmedPassword(
        'Please choose a password for wallet encryption',
      );
    }
    if (!pw && !opts.unencrypted) {
      throw Error('Missing wallet password');
    }
    if (pw && opts.unencrypted) {
      spinner.warn('Option --unencrypted will be ignored');
    }
    if (opts.unencrypted) {
      spinner.warn(
        'Using --unencrypted will generate unprotected unencrypted wallet, this is unsafe, make sure to know what you do',
      );
    }

    const global =
      (opts.keystoredir && opts.keystoredir === 'global') || !opts.keystoredir;
    const local = (opts.keystoredir && opts.keystoredir === 'local') || false;
    const keystorePath =
      opts.keystoredir &&
      opts.keystoredir !== 'local' &&
      opts.keystoredir !== 'global'
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

export const computeWalletLoadOptions = (opts) => {
  try {
    const global =
      (opts && opts.keystoredir && opts.keystoredir === 'global') ||
      !opts ||
      !opts.keystoredir;
    const local =
      (opts && opts.keystoredir && opts.keystoredir === 'local') || false;
    const keystorePath =
      opts &&
      opts.keystoredir &&
      opts.keystoredir !== 'local' &&
      opts.keystoredir !== 'global'
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

export const createEncFolderPaths = (opts = {}) => {
  const absolutePath = (relativeOrAbsolutePath) =>
    isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : join(process.cwd(), relativeOrAbsolutePath);

  const datasetSecretsFolderPath = opts.datasetKeystoredir
    ? absolutePath(opts.datasetKeystoredir)
    : join(process.cwd(), secretsFolderName, datasetSecretsFolderName);
  const beneficiarySecretsFolderPath = opts.beneficiaryKeystoredir
    ? absolutePath(opts.beneficiaryKeystoredir)
    : join(process.cwd(), secretsFolderName, beneficiarySecretsFolderName);
  const originalDatasetFolderPath = opts.originalDatasetDir
    ? absolutePath(opts.originalDatasetDir)
    : join(process.cwd(), datasetsFolderName, originalDatasetFolderName);
  const encryptedDatasetFolderPath = opts.encryptedDatasetDir
    ? absolutePath(opts.encryptedDatasetDir)
    : join(process.cwd(), datasetsFolderName, encryptedDatasetFolderName);

  const paths = {
    datasetSecretsFolderPath,
    beneficiarySecretsFolderPath,
    originalDatasetFolderPath,
    encryptedDatasetFolderPath,
  };
  debug('paths', paths);
  return paths;
};

export const DEFAULT_ENCRYPTED_RESULTS_NAME = 'encryptedResults.zip';
export const DEFAULT_DECRYPTED_RESULTS_NAME = 'results.zip';
export const publicKeyName = (address) => `${address}_key.pub`;
export const privateKeyName = (address) => `${address}_key`;

export const computeTxOptions = async (opts) => {
  let gasPrice;
  let confirms;
  if (opts.gasPrice) {
    debug('opts.gasPrice', opts.gasPrice);
    const stringGasPrice = await weiAmountSchema({ defaultUnit: 'wei' })
      .label('gas-price')
      .validate(opts.gasPrice);
    gasPrice = BigInt(stringGasPrice);
  }
  debug('gasPrice', gasPrice);
  if (opts.confirms !== undefined) {
    debug('opts.confirms', opts.confirms);
    confirms = await positiveStrictIntSchema()
      .label('confirms')
      .validate(opts.confirms, {
        message: 'invalid confirms',
      });
  }
  debug('confirms', confirms);
  return { gasPrice, confirms };
};

export const getPropertyFormChain = (
  chain,
  property,
  { strict = true } = {},
) => {
  const value = chain[property];
  if (value === undefined && strict)
    throw Error(`Missing ${property} in "chain.json" for chain ${chain.id}`);
  return value;
};

export const getDefaultTeeFrameworkFromChain = (chain) =>
  getPropertyFormChain(chain, 'defaultTeeFramework', { strict: false }) ||
  TEE_FRAMEWORKS.SCONE;

export const getSmsUrlFromChain = (
  chain,
  { teeFramework, strict = true } = {},
) => {
  const selectedTeeFramework =
    teeFramework || getDefaultTeeFrameworkFromChain(chain);
  let smsUrl;
  const smsUrlOrMap = getPropertyFormChain(chain, 'sms', { strict });
  if (typeof smsUrlOrMap === 'string') {
    smsUrl = smsUrlOrMap;
  } else if (
    typeof smsUrlOrMap === 'object' &&
    smsUrlOrMap[selectedTeeFramework]
  ) {
    smsUrl = smsUrlOrMap[selectedTeeFramework];
  }
  if (smsUrl === undefined && strict)
    throw Error(
      `Missing sms for tee framework ${selectedTeeFramework} in "chain.json" for chain ${chain.id}`,
    );
  return smsUrl;
};

export const handleError = (error, cli, opts) => {
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

export const lbb = (str = '') => `\n${str}`;
export const lba = (str = '') => `${str}\n`;
export const lb = (str) => lba(lbb(str));

export const pretty = (obj, options) => lb(render(obj, options));

export const prettyRPC = (rpcObj) => {
  const keys = Object.keys(rpcObj);
  const prettyObj = keys.reduce((acc, curr) => {
    if (Number.isNaN(parseInt(curr, 10))) {
      return Object.assign(acc, { [curr]: rpcObj[curr].toString() });
    }
    return acc;
  }, {});
  return pretty(prettyObj);
};

export const isEthAddress = (address, { strict = false } = {}) => {
  const isHexString =
    typeof address === 'string' && address.substr(0, 2) === '0x';
  const isEns =
    typeof address === 'string' &&
    address.substring(address.length - 4) === '.eth';
  const isAddress = isEns || (isHexString && address.length === 42);
  if (!isAddress && strict) {
    throw Error(`Address ${address} is not a valid Ethereum address`);
  }
  return isAddress;
};

export const isBytes32 = (str, { strict = false } = {}) => {
  if (
    typeof str !== 'string' ||
    str.length !== 66 ||
    str.substring(0, 2) !== '0x'
  ) {
    if (strict) throw new Error(`${str} is not a valid Bytes32 HexString`);
    return false;
  }
  return true;
};

export const displayPaginableRequest = async (
  {
    request,
    processResponse = (res) => res,
    fetchMessage = 'Fetching data',
    emptyResultsMessage,
    createResultsMessage = (callResults, initialResultsCount, totalCount) => {
      const totalDisplay = totalCount ? ` of ${totalCount}` : '';
      return `Results (${initialResultsCount + 1} to ${
        initialResultsCount + callResults.length
      }${totalDisplay}):\n${pretty(callResults)}`;
    },
    spinner,
    raw = false,
  },
  { results = [], count } = {},
) => {
  spinner.start(fetchMessage);
  const res = await request;
  const totalCount = count || res.count;
  spinner.stop();
  const callResults = processResponse(res);
  if (callResults.length > 0) {
    spinner.info(createResultsMessage(callResults, results.length, totalCount));
    results.push(...callResults);
    if (res.more && typeof res.more === 'function') {
      const more =
        // auto paginate get up to 100 results
        (raw && results.length <= 80) ||
        // promt
        (!raw && (await prompt.more()));
      if (more) {
        return displayPaginableRequest(
          {
            request: res.more(),
            processResponse,
            createResultsMessage,
            spinner,
            raw,
          },
          { results, count },
        );
      }
      return { results, count: totalCount };
    }
  }
  if (results.length === 0 && emptyResultsMessage) {
    spinner.info(emptyResultsMessage);
  }
  return { results, count: totalCount };
};

export const renderTasksStatus = (
  tasksStatusMap,
  { detailed = false } = {},
) => {
  const tasksArray = Object.values(tasksStatusMap);
  const runningTasksArray = tasksArray.filter(
    (task) => task.status !== 3 && !task.taskTimedOut,
  );
  const completedTasksArray = tasksArray.filter((task) => task.status === 3);
  const timedoutTasksArray = tasksArray.filter((task) => task.taskTimedOut);
  const completedMsg =
    completedTasksArray.length > 0
      ? `${completedTasksArray.length}/${tasksArray.length} tasks completed${
          detailed
            ? `:${pretty(
                completedTasksArray.map(
                  ({ idx, taskid }) => `Task idx ${idx} (${taskid})`,
                ),
              )}`
            : '\n'
        }`
      : '';
  const failedMsg =
    timedoutTasksArray.length > 0
      ? `${timedoutTasksArray.length}/${tasksArray.length} tasks failed${
          detailed
            ? `:${pretty(
                timedoutTasksArray.map(
                  ({ idx, taskid }) => `Task idx ${idx} (${taskid})`,
                ),
              )}`
            : '\n'
        }`
      : '';
  const statusMsg =
    runningTasksArray.length > 0
      ? `${runningTasksArray.length}/${
          tasksArray.length
        } tasks running:${pretty(
          runningTasksArray.map(
            ({ idx, taskid, statusName }) =>
              `Task idx ${idx} (${taskid}) status ${statusName}`,
          ),
        )}`
      : '';
  return `${completedMsg}${failedMsg}${statusMsg}`;
};
