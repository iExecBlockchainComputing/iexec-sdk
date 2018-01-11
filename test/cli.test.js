const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const Promise = require('bluebird');

const execAsync = Promise.promisify(exec);
// const TX_HASH = '0x86dafcaeab83a0505baf36482cf2ded310fd6d2b46912d6ef6fadfbce7d3d30a';

test('iexec init', () => expect(execAsync('iexec init.js')).resolves.not.toBe(1), 10000);

test('iexec wallet create', () => {
  process.chdir('iexec-init');
  return expect(execAsync('iexec wallet create')).resolves.not.toBe(1);
});

test('iexec account login', () => expect(execAsync('iexec account login')).resolves.not.toBe(1));

test('iexec account show', () => expect(execAsync('iexec account show')).resolves.not.toBe(1));

test('iexec compile', () => expect(execAsync('iexec compile')).resolves.not.toBe(1), 20000);

// test('iexec result <txHash>', () => expect(execAsync(`iexec result ${TX_HASH}`)).resolves.not.toBe(1), 10000);

afterAll(() => fs.remove(path.join('.', 'iexec-init')));
