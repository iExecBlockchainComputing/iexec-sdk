// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEST_CHAINS, execAsync, getRandomAddress } from './test-utils';
import {
  setDatasetUniqueName,
  setChain,
  setRichWallet,
  globalSetup,
  globalTeardown,
} from './cli-test-utils';

console.log('Node version:', process.version);

const DEFAULT_TIMEOUT = 120000;
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
  describe('iexec dataset', () => {
    describe('transfer', () => {
      beforeAll(async () => {
        // dataset init
        await execAsync(`${iexecPath} dataset init`);
      });
      test('transfers the dataset ownership to', async () => {
        await setDatasetUniqueName();
        const { address } = await execAsync(
          `${iexecPath} dataset deploy --raw`,
        ).then(JSON.parse);
        const receiverAddress = getRandomAddress();
        const res = await execAsync(
          `${iexecPath} dataset transfer ${address} --to ${receiverAddress} --force --raw`,
        ).then(JSON.parse);
        expect(res.ok).toBe(true);
        expect(res.address).toBe(address);
        expect(res.to).toBe(receiverAddress);
        expect(res.txHash).toBeDefined();
      });
    });
  });
});
