const { Spinner } = require('./utils');

const handleError = (error, anchorName, spinner = Spinner()) => {
  spinner.fail(`command "iexec ${anchorName}" failed with ${error}`);
  console.log('');
  spinner.info(`iExec SDK doc: https://github.com/iExecBlockchainComputing/iexec-sdk#${anchorName}`);
  process.exit(1);
};

module.exports = handleError;
