const handleError = (error, anchorName, spinner) => {
  spinner.fail(`command "iexec ${anchorName}" failed with ${error}`);
  console.log('');
  console.log(`   iExec SDK doc: https://github.com/iExecBlockchainComputing/iexec-sdk#${anchorName}`);
  process.exit(1);
};

module.exports = handleError;
