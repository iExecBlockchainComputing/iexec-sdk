const Debug = require('debug');
const colors = require('colors/safe');
const Ora = require('ora');
const inquirer = require('inquirer');
const prettyjson = require('prettyjson');

const debug = Debug('help');

const info = {
  waitMiners: () => 'waiting for transaction to be mined...',
  checkBalance: currency => `checking ${currency} balances...`,
  topUp: currency =>
    `Run "iexec wallet get${currency}" to ask faucets for ${currency}`,
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
  deposited: amount => `deposited ${amount} nRLC to your iExec account`,
  withdrawing: () => 'making withdraw...',
  withdrawed: amount => `withdrawed ${amount} nRLC from your iExec account`,
};

const command = {
  show: () => 'show',
  deposit: () => 'deposit <amount>',
  withdraw: () => 'withdraw <amount>',
  fill: () => 'fill <orderID>',
  cancel: () => 'cancel <orderID>',
};

const desc = {
  hubAddress: () =>
    'interact with the iExec Hub at a custom smart contract address',
  chainName: () => 'chain name from "chains.json"',
  userAddress: () => 'custom user address',
  initObj: objName => `init a new ${objName}`,
  deployObj: objName => `deploy a new ${objName}`,
  placeObj: objName => `place a new ${objName}`,
  createObj: objName => `deploy a new ${objName}`,
  fill: objName => `fill an ${objName} to execute a work`,
  cancel: objName => `cancel an ${objName}`,
  showObj: (objName, owner = 'user') => `show ${owner} ${objName} details`,
  countObj: (objName, owner = 'user') => `get ${owner} ${objName} count`,
  login: () => 'login into your iExec account',
  deposit: () => 'deposit RLC onto your iExec account',
  withdraw: () => 'withdraw RLC from your iExec account',
  getETH: () => 'apply for ETH from pre-registered faucets',
  getRLC: () => 'apply for nRLC from iExec faucet',
  sendETH: () => 'send ETH to an address',
  sendRLC: () => 'send nRLC to an address',
  sweep: () => 'send all ETH and RLC to an address',
};

const option = {
  chain: () => ['--chain <name>', desc.chainName()],
  hub: () => ['--hub <address>', desc.hubAddress()],
  user: () => ['--user <address>', desc.userAddress()],
  buy: () => ['--buy', 'init a buy order'],
  sell: () => ['--sell', 'init a sell order'],
  auth: () => ['--auth <auth>', 'auth server name', 'https://auth.iex.ec'],
  to: () => ['--to <address>', 'receiver address'],
  token: () => ['--token <address>', 'custom erc20 token contract address'],
  force: () => ['--force', 'force wallet creation even if old wallet exists'],
};

const question = async (
  message,
  { error = 'operation aborted by user', strict = true },
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

const prompt = {
  custom: question,
  create: file => question(`You don't have a ${file} yet, create one?`),
  overwrite: (file, options) =>
    question(`${file} already exists, replace it with new one?`, options),
  transfer: (currency, amount, chainName, to, chainID) =>
    question(`Do you want to send ${amount} ${chainName} ${currency} to ${to} [chainID: ${chainID}]`),
};

prompt.transferETH = (...args) => prompt.transfer('ETH', ...args);
prompt.transferRLC = (...args) => prompt.transfer('nRLC', ...args);
prompt.sweep = (...args) =>
  prompt.transfer('ETH and RLC', 'all wallet', ...args);

const oraOptions = {
  color: 'yellow',
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

const helpMessage =
  '\n  Links:\n\n    doc: https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-api\n    bugs: https://github.com/iExecBlockchainComputing/iexec-sdk/issues\n    help: https://slack.iex.ec\n';
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

const Spinner = () => Ora(oraOptions);

const handleError = (error, cli, spinner = Spinner()) => {
  const lastArg = cli.args[cli.args.length - 1];
  const lastCommandName = typeof lastArg === 'object' ? lastArg._name : '';
  const commandName = cli._name
    .split('-')
    .join(' ')
    .concat(' ', lastCommandName);
  console.log('\n');
  spinner.fail(`command "${commandName}" failed with ${error}`);
  cli.help(helpCB);
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
  prompt,
  pretty,
  prettyRPC,
  lbb,
  lba,
  lb,
};
