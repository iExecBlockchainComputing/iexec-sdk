const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const Promise = require('bluebird');

const execAsync = Promise.promisify(exec);
// const TX_HASH = '0x86dafcaeab83a0505baf36482cf2ded310fd6d2b46912d6ef6fadfbce7d3d30a';

test('iexec init', () => expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec-init.js')).resolves.not.toBe(1), 10000);

test('iexec wallet create', () => {
  process.chdir('iexec-init');
  return expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec-wallet.js create')).resolves.not.toBe(1);
});

test('iexec account login', () => expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec-account.js login')).resolves.not.toBe(1));

test('iexec account show', () => expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec-account.js show')).resolves.not.toBe(1));

test('iexec compile', () => expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec-compile.js')).resolves.not.toBe(1), 20000);

// test('iexec result <txHash>', () => expect(execAsync(`node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec-result.js ${TX_HASH}`)).resolves.not.toBe(1), 10000);

afterAll(() => fs.remove(path.join('.', 'iexec-init')));
