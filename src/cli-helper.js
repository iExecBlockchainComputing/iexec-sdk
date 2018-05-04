const Debug = require('debug');
const colors = require('colors/safe');
const Ora = require('ora');

const debug = Debug('help');

const info = {
  waitMiners: () => 'waiting for transaction to be mined...',
  hubAddress: () =>
    'interact with the iExec Hub at a custom smart contract address',
  chainName: () => 'chain name from "chains.json", ex: ropsten',
  userAddress: () => 'custom user address',
  createObj: objName => `create a new ${objName}`,
  showObj: (objName, owner = 'user') => `show ${owner} ${objName} details`,
  countObj: (objName, owner = 'user') => `get ${owner} ${objName} count`,
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
};
