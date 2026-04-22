import { describe, test, expect } from '@jest/globals';
import { execAsync } from '../test-utils.js';
import {
  globalSetup,
  globalTeardown,
  loadJSONFile,
  saveJSONToFile,
} from './cli-test-utils.js';
import '../jest-setup.js';

const iexecPath = 'iexec';

beforeAll(async () => {
  await globalSetup('cli-common');
});

afterAll(async () => {
  await globalTeardown();
});

describe('cli common', () => {
  test('iexec', async () => {
    const out = await execAsync(`${iexecPath}`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf('Usage: iexec [command] [options]')).not.toBe(
      -1,
    );
  });
  test('invalid command', async () => {
    const out = await execAsync(`${iexecPath} test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf("error: unknown command 'test'")).not.toBe(-1);
    expect(out.message.indexOf('Usage: iexec [command] [options]')).not.toBe(
      -1,
    );
  });
  test('unknown option', async () => {
    const out = await execAsync(`${iexecPath} --test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf('Usage: iexec [command] [options]')).not.toBe(
      -1,
    );
  });
  test('missing subcommand', async () => {
    const out = await execAsync(`${iexecPath} app`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(
      out.message.indexOf('Usage: iexec app <command> [options]'),
    ).not.toBe(-1);
  });
  test('invalid subcommand', async () => {
    const out = await execAsync(`${iexecPath} app test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf("error: unknown command 'test'")).not.toBe(-1);
    expect(
      out.message.indexOf('Usage: iexec app <command> [options]'),
    ).not.toBe(-1);
  });
  test('subcommand unknown option', async () => {
    const out = await execAsync(`${iexecPath} app show --test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf("error: unknown option '--test'")).not.toBe(-1);
  });
});

describe('chain.json', () => {
  beforeAll(async () => {
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await loadJSONFile('chain.json').then((obj) => {
      const chainJson = {
        ...obj,
      };
      saveJSONToFile(chainJson, 'chain.json');
    });
  });

  test('chains arbitrum-mainnet and arbitrum-sepolia-testnet are available', async () => {
    const chainJson = await loadJSONFile('chain.json');
    expect(chainJson).toHaveProperty('chains');

    expect(chainJson.chains).toStrictEqual({
      'arbitrum-sepolia-testnet': {},
      'arbitrum-mainnet': {},
    });
  });

  test('default chain is arbitrum-sepolia-testnet', async () => {
    const chainJson = await loadJSONFile('chain.json');
    expect(chainJson).toBeDefined();
    expect(chainJson).toHaveProperty('default');
    expect(chainJson.default).toBe('arbitrum-sepolia-testnet');
  });
});
