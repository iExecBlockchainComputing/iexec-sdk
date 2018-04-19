const handleError = anchorName => () => {
  console.log(`related documentation: https://github.com/iExecBlockchainComputing/iexec-sdk#${anchorName}`);
  process.exit(1);
};

module.exports = handleError;
