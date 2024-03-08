import { execAsync } from '../test-utils';
import { globalSetup, globalTeardown } from './cli-test-utils';

const { DRONE } = process.env;
const iexecPath = DRONE ? 'iexec' : 'node ../../../src/cli/cmd/iexec.js';

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
