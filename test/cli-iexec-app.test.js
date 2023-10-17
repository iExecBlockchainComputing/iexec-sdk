// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEST_CHAINS, execAsync, getRandomAddress } from './test-utils';
import {
  globalSetup,
  globalTeardown,
  setAppUniqueName,
  setChain,
  setRichWallet,
} from './cli-test-utils';

console.log('Node version:', process.version);

const DEFAULT_TIMEOUT = 60000;
jest.setTimeout(DEFAULT_TIMEOUT);

const { DRONE } = process.env;
const iexecPath = DRONE ? 'iexec' : 'node ../../src/cli/cmd/iexec.js';

beforeAll(async () => {
  await globalSetup();
  // init the project
  await execAsync(`${iexecPath} init --skip-wallet --force`);
});

afterAll(async () => {
  await globalTeardown();
});

describe('[common]', () => {
  beforeAll(async () => {
    await setChain(TEST_CHAINS.token)();
    await setRichWallet(TEST_CHAINS.token)();
  });
  describe('iexec app', () => {
    describe('transfer', () => {
      beforeAll(async () => {
        // app init
        await execAsync(`${iexecPath} app init`);
      });
      test('transfers the app ownership to', async () => {
        await setAppUniqueName();
        const { address } = await execAsync(
          `${iexecPath} app deploy --raw`,
        ).then(JSON.parse);
        const receiverAddress = getRandomAddress();
        const res = await execAsync(
          `${iexecPath} app transfer ${address} --to ${receiverAddress} --force --raw`,
        ).then(JSON.parse);
        expect(res.ok).toBe(true);
        expect(res.address).toBe(address);
        expect(res.to).toBe(receiverAddress);
        expect(res.txHash).toBeDefined();
      });
    });
  });
});
