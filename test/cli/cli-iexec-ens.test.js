// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEST_CHAINS, execAsync, runIExecCliRaw } from '../test-utils';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setRandomWallet,
} from './cli-test-utils';
import { bytes32Regex } from '../../src/common/utils/utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec ens', () => {
  let userWallet;
  let app;
  let dataset;
  let workerpool;

  beforeAll(async () => {
    await globalSetup('cli-iexec-ens');
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} app init`);
    await execAsync(`${iexecPath} dataset init`);
    await execAsync(`${iexecPath} workerpool init`);
    app = await execAsync(`${iexecPath} app deploy --raw`).then(
      (res) => JSON.parse(res).address,
    );
    dataset = await execAsync(`${iexecPath} dataset deploy --raw`).then(
      (res) => JSON.parse(res).address,
    );
    workerpool = await execAsync(`${iexecPath} workerpool deploy --raw`).then(
      (res) => JSON.parse(res).address,
    );
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('register', () => {
    test('iexec ens register <name> (for self)', async () => {
      const expectedEns = `${userWallet.address.toLowerCase()}.users.iexec.eth`;
      const res = await runIExecCliRaw(
        `${iexecPath} ens register ${userWallet.address.toLowerCase()}`,
      );
      expect(res.ok).toBe(true);
      expect(res.name).toBe(expectedEns);
      expect(res.address).toBe(userWallet.address);
      expect(res.registerTxHash).toMatch(bytes32Regex);
      expect(res.setResolverTxHash).toMatch(bytes32Regex);
      expect(res.setAddrTxHash).toMatch(bytes32Regex);
      expect(res.setNameTxHash).toMatch(bytes32Regex);

      const showAddressRes = await runIExecCliRaw(`${iexecPath} wallet show`);
      expect(showAddressRes.ens).toBe(expectedEns);

      const showEnsRes = await runIExecCliRaw(
        `${iexecPath} wallet show ${expectedEns}`,
      );
      expect(showEnsRes.ens).toBe(expectedEns);
    });

    test('iexec ens register <name> --for <app>', async () => {
      const expectedEns = `${app.toLowerCase()}.apps.iexec.eth`;
      const res = await runIExecCliRaw(
        `${iexecPath} ens register ${app.toLowerCase()} --for ${app}`,
      );
      expect(res.ok).toBe(true);
      expect(res.name).toBe(expectedEns);
      expect(res.address).toBe(app);
      expect(res.registerTxHash).toMatch(bytes32Regex);
      expect(res.setResolverTxHash).toMatch(bytes32Regex);
      expect(res.setAddrTxHash).toMatch(bytes32Regex);
      expect(res.setNameTxHash).toMatch(bytes32Regex);

      const showAddressRes = await runIExecCliRaw(
        `${iexecPath} app show ${app}`,
      );
      expect(showAddressRes.ens).toBe(expectedEns);

      const showEnsRes = await runIExecCliRaw(
        `${iexecPath} app show ${expectedEns}`,
      );
      expect(showEnsRes.address).toBe(app);
    });

    test('iexec ens register <name> --for <dataset>', async () => {
      const expectedEns = `${dataset.toLowerCase()}.datasets.iexec.eth`;
      const res = await runIExecCliRaw(
        `${iexecPath} ens register ${dataset.toLowerCase()} --for ${dataset} --raw`,
      );
      expect(res.ok).toBe(true);
      expect(res.name).toBe(expectedEns);
      expect(res.address).toBe(dataset);
      expect(res.registerTxHash).toMatch(bytes32Regex);
      expect(res.setResolverTxHash).toMatch(bytes32Regex);
      expect(res.setAddrTxHash).toMatch(bytes32Regex);
      expect(res.setNameTxHash).toMatch(bytes32Regex);
      const showAddressRes = await runIExecCliRaw(
        `${iexecPath} dataset show ${dataset}`,
      );
      expect(showAddressRes.ens).toBe(expectedEns);

      const showEnsRes = await runIExecCliRaw(
        `${iexecPath} dataset show ${expectedEns}`,
      );
      expect(showEnsRes.address).toBe(dataset);
    });

    test('iexec ens register <name> --for <workerpool>', async () => {
      const expectedEns = `${workerpool.toLowerCase()}.pools.iexec.eth`;
      const res = await runIExecCliRaw(
        `${iexecPath} ens register ${workerpool.toLowerCase()} --for ${workerpool} --raw`,
      );
      expect(res.ok).toBe(true);
      expect(res.name).toBe(expectedEns);
      expect(res.address).toBe(workerpool);
      expect(res.registerTxHash).toMatch(bytes32Regex);
      expect(res.setResolverTxHash).toMatch(bytes32Regex);
      expect(res.setAddrTxHash).toMatch(bytes32Regex);
      expect(res.setNameTxHash).toMatch(bytes32Regex);
      const showAddressRes = await runIExecCliRaw(
        `${iexecPath} workerpool show ${workerpool}`,
      );
      expect(showAddressRes.ens).toBe(expectedEns);

      const showEnsRes = await runIExecCliRaw(
        `${iexecPath} workerpool show ${expectedEns}`,
      );
      expect(showEnsRes.address).toBe(workerpool);
    });
  });
});
