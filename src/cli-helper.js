const Debug = require('debug');
const colors = require('colors/safe');
const Ora = require('ora');
const inquirer = require('inquirer');

const debug = Debug('help');

const info = {
  waitMiners: () => 'waiting for transaction to be mined...',
  checkBalance: currency => `checking ${currency} balances...`,
  topUp: currency =>
    `Run "iexec wallet get${currency}" to top up your ${currency} account`,
  userAborted: () => 'operation aborted by user.',
  logging: () => 'logging into iExec...',
};

const desc = {
  hubAddress: () =>
    'interact with the iExec Hub at a custom smart contract address',
  chainName: () => 'chain name from "chains.json"',
  userAddress: () => 'custom user address',
  createObj: objName => `create a new ${objName}`,
  showObj: (objName, owner = 'user') => `show ${owner} ${objName} details`,
  countObj: (objName, owner = 'user') => `get ${owner} ${objName} count`,
  login: () => 'login into your iexec account',
  deposit: () => 'deposit nRLC on your iexec account',
  getETH: () => 'apply for ETH from pre-registered faucets',
  getRLC: () => 'apply for nRLC from iExec faucet',
  sendETH: () => 'send ETH to an address',
  sendRLC: () => 'send nRLC to an address',
  sweep: () => 'send all ETH and RLC to an address',
};

const option = {
  chain: () => ['--chain <name>', desc.chainName(), 'ropsten'],
  hub: () => ['--hub <address>', desc.hubAddress()],
  user: () => ['--user <address>', desc.userAddress()],
  auth: () => ['--auth <auth>', 'auth server name', 'https://auth.iex.ec'],
  to: () => ['--to <address>', 'receiver address'],
  token: () => ['--token <address>', 'custom erc20 token contract address'],
  force: () => [
    '--force',
    'force wallet creation even if old wallet exists',
    false,
  ],
};

const question = async (message, error = 'operation aborted by user') => {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message,
    },
  ]);
  if (answer.ok) return true;
  throw Error(error);
};

const prompt = {
  create: file => question(`You don't have a ${file} yet, create one?`),
  overwrite: file =>
    question(`${file} already exists, replace it with new one?`),
};

const helpMessage = () => {
  console.log('');
  console.log('  Links:');
  console.log('');
  console.log('    doc: https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-api');
  console.log('    bugs: https://github.com/iExecBlockchainComputing/iexec-sdk/issues');
  console.log('    help: https://slack.iex.ec');
  console.log('');
};

const help = (cli, { checkNoArgs = true, checkWrongArgs = true } = {}) => {
  cli.on('--help', helpMessage);
  cli.parse(process.argv);

  if (checkNoArgs && cli.args.length === 0) {
    console.log('');
    console.log(colors.red('  missing argument'));
    cli.help();
  } else if (checkWrongArgs) {
    if (typeof cli.args[cli.args.length - 1] !== 'object') {
      debug('not an object');
      if (!cli._execs[cli.args[0]]) {
        console.log('');
        console.log(colors.red(`  unknown command "${cli.args[0]}"`));
        cli.help();
      }
    }
  }
};

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

const Spinner = () => Ora(oraOptions);

const handleError = (error, anchorName, spinner = Spinner()) => {
  spinner.fail(`command "iexec ${anchorName}" failed with ${error}`);
  console.log('');
  spinner.info(`iExec SDK doc: https://github.com/iExecBlockchainComputing/iexec-sdk#${anchorName}`);
  process.exit(1);
};

module.exports = {
  help,
  Spinner,
  handleError,
  info,
  desc,
  option,
  prompt,
};
