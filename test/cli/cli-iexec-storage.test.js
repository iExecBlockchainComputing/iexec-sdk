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

const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];

describe('iexec storage', () => {
  beforeAll(async () => {
    await globalSetup('cli-iexec-storage');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
  });

  beforeEach(async () => {
    await setRandomWallet(testChain)();
  });

  afterAll(async () => {
    await globalTeardown();
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

  test('iexec storage init dropbox --force-update', async () => {
    const raw = await execAsync(
      `${iexecPath} storage init dropbox --token oops --force-update --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(true);
    expect(res.isUpdated).toBe(false);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage init dropbox --token oops --force-update --raw`,
    );
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(true);
    expect(resAlreadyExists.isInitialized).toBe(true);
    expect(resAlreadyExists.isUpdated).toBe(true);
  });

  test('iexec storage init ipfs - authentication not supported', async () => {
    const raw = await execAsync(
      `${iexecPath} storage init ipfs --token oops --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe(
      'Storage provider "ipfs" does not support authentication tokens',
    );
  });

  test('iexec storage init - unsupported provider', async () => {
    const raw = await execAsync(
      `${iexecPath} storage init unsupported --token oops --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe(
      '"unsupported" is not a valid storage provider, use one of the supported providers (dropbox, ipfs)',
    );
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

  test('iexec storage check ipfs - authentication not supported', async () => {
    const raw = await execAsync(`${iexecPath} storage check ipfs --raw`).catch(
      (e) => e.message,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe(
      'Storage provider "ipfs" does not support authentication tokens',
    );
  });

  test('iexec storage check - unsupported provider', async () => {
    const raw = await execAsync(
      `${iexecPath} storage check unsupported --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe(
      '"unsupported" is not a valid storage provider, use one of the supported providers (dropbox, ipfs)',
    );
  });

  test('iexec storage check dropbox --user', async () => {
    const randomAddress = getRandomAddress();
    const raw = await execAsync(
      `${iexecPath} storage check dropbox --user ${randomAddress} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.isInitialized).toBe(false);
    await execAsync(`${iexecPath} storage init dropbox --token oops --raw`);
    const rawAlreadyExists = await execAsync(
      `${iexecPath} storage check dropbox --user ${randomAddress} --raw`,
    );
    const resAlreadyExists = JSON.parse(rawAlreadyExists);
    expect(resAlreadyExists.ok).toBe(true);
    expect(resAlreadyExists.isInitialized).toBe(false);
  });
});
