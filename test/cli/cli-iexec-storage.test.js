// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { TEST_CHAINS, execAsync, getRandomAddress } from '../test-utils.js';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setRandomWallet,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec storage', () => {
  beforeAll(async () => {
    await globalSetup('cli-iexec-storage');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
  });

  beforeEach(async () => {
    await setRandomWallet();
  });

  afterAll(async () => {
    await globalTeardown();
  });

  test('iexec storage init', async () => {
    const raw = await execAsync(`${iexecPath} storage init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(true);
    expect(res.isUpdated).toBe(false);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage init --raw`,
    ).catch((e) => e.message);
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(false);
    expect(resAlreadyExists.error.message).toBe(
      'default storage is already initialized, use --force-update option to update your storage token',
    );
    const rawInitWithTeeFramework = await execAsync(
      `${iexecPath} storage init --tee-framework gramine --raw`,
    );
    const resInitWithTeeFramework = JSON.parse(rawInitWithTeeFramework);
    expect(resInitWithTeeFramework.ok).toBe(true);
    expect(resInitWithTeeFramework.isInitialized).toBe(true);
    expect(resInitWithTeeFramework.isUpdated).toBe(false);
  });

  test('iexec storage init --force-update', async () => {
    const raw = await execAsync(
      `${iexecPath} storage init --force-update --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(true);
    expect(res.isUpdated).toBe(false);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage init --force-update --raw`,
    );
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(true);
    expect(resAlreadyExists.isInitialized).toBe(true);
    expect(resAlreadyExists.isUpdated).toBe(true);
  });

  test('iexec storage init dropbox', async () => {
    const raw = await execAsync(
      `${iexecPath} storage init dropbox --token oops --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(true);
    expect(res.isUpdated).toBe(false);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage init dropbox --token oops --raw`,
    ).catch((e) => e.message);
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(false);
    expect(resAlreadyExists.error.message).toBe(
      'dropbox storage is already initialized, use --force-update option to update your storage token',
    );
  });

  test('iexec storage init unsupported', async () => {
    const raw = await execAsync(
      `${iexecPath} storage init unsupported --token oops --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe('"unsupported" not supported');
  });

  test('iexec storage check', async () => {
    const raw = await execAsync(`${iexecPath} storage check --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(false);
    await execAsync(`${iexecPath} storage init --raw`);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage check --raw`,
    );
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(true);
    expect(resAlreadyExists.isInitialized).toBe(true);
    const rawWithTeeFramework = await execAsync(
      `${iexecPath} storage check --tee-framework gramine --raw`,
    );
    const resWithTeeFramework = JSON.parse(rawWithTeeFramework);
    expect(resWithTeeFramework.ok).toBe(true);
    expect(resWithTeeFramework.isInitialized).toBe(false);
  });

  test('iexec storage check --user', async () => {
    const randomAddress = getRandomAddress();
    const raw = await execAsync(
      `${iexecPath} storage check --user ${randomAddress} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(false);
    await execAsync(`${iexecPath} storage init --raw`);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage check --user ${randomAddress} --raw`,
    );
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(true);
    expect(resAlreadyExists.isInitialized).toBe(false);
  });

  test('iexec storage check dropbox', async () => {
    const raw = await execAsync(`${iexecPath} storage check dropbox --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(false);
    await execAsync(`${iexecPath} storage init dropbox --token oops --raw`);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage check dropbox --raw`,
    );
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(true);
    expect(resAlreadyExists.isInitialized).toBe(true);
  });

  test('iexec storage check unsupported', async () => {
    const raw = await execAsync(
      `${iexecPath} storage check unsupported --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe('"unsupported" not supported');
  });
});
