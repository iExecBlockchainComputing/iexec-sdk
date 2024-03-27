// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test } from '@jest/globals';
import { BN } from 'bn.js';
import { deployRandomWorkerpool, getTestConfig } from '../lib-test-utils';
import {
  TEST_CHAINS,
  addressRegex,
  getId,
  getRandomAddress,
  txHashRegex,
} from '../../test-utils';
import { errors } from '../../../src/lib';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('workerpool', () => {
  describe('showWorkerpool()', () => {
    test('shows a deployed workerpool', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpool = {
        owner: await iexec.wallet.getAddress(),
        description: `workerpool${getId()}`,
      };
      const { address } = await iexec.workerpool.deployWorkerpool(workerpool);

      const res = await readOnlyIExec.workerpool.showWorkerpool(address);
      expect(res.objAddress).toBe(address);
      expect(res.workerpool.owner).toBe(workerpool.owner);
      expect(res.workerpool.registry).toMatch(addressRegex);
      expect(res.workerpool.schedulerRewardRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerStakeRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerpoolDescription).toBe(workerpool.description);
    });

    test('fails if the workerpool is not deployed', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const address = getRandomAddress();
      await expect(
        readOnlyIExec.workerpool.showWorkerpool(address),
      ).rejects.toThrow(
        new errors.ObjectNotFoundError(
          'workerpool',
          address,
          iexecTestChain.chainId,
        ),
      );
    });
  });

  describe('showUserWorkerpool()', () => {
    test('shows the user workerpool', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const workerpool = {
        owner: wallet.address,
        description: `workerpool${getId()}`,
      };
      const { address } = await iexec.workerpool.deployWorkerpool(workerpool);
      const res = await readOnlyIExec.workerpool.showUserWorkerpool(
        0,
        wallet.address,
      );
      expect(res.objAddress).toBe(address);
      expect(res.workerpool.owner).toBe(workerpool.owner);
      expect(res.workerpool.registry).toMatch(addressRegex);
      expect(res.workerpool.schedulerRewardRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerStakeRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerpoolDescription).toBe(workerpool.description);
    });

    test('fails if the workerpool is not deployed', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const address = getRandomAddress();
      await expect(
        readOnlyIExec.workerpool.showUserWorkerpool(0, address),
      ).rejects.toThrow(Error('workerpool not deployed'));
    });
  });

  describe('countUserWorkerpools()', () => {
    test('counts user workerpools', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const resBeforeDeploy =
        await readOnlyIExec.workerpool.countUserWorkerpools(wallet.address);
      await deployRandomWorkerpool(iexec);
      const res = await readOnlyIExec.workerpool.countUserWorkerpools(
        wallet.address,
      );
      expect(resBeforeDeploy).toBeInstanceOf(BN);
      expect(res).toBeInstanceOf(BN);
      expect(resBeforeDeploy.add(new BN(1)).eq(res)).toBe(true);
    });
  });

  describe('deployWorkerpool()', () => {
    test('require a signer', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const workerpool = {
        owner: getRandomAddress(),
        description: `workerpool${getId()}`,
      };
      await expect(
        iexec.workerpool.deployWorkerpool(workerpool),
      ).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('deploys a workerpool', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpool = {
        owner: await iexec.wallet.getAddress(),
        description: `workerpool${getId()}`,
      };
      const res = await iexec.workerpool.deployWorkerpool(workerpool);
      expect(res.txHash).toMatch(txHashRegex);
      expect(res.address).toMatch(addressRegex);
    });

    test('cannot deploy twice with the same params', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpool = {
        owner: await iexec.wallet.getAddress(),
        description: `workerpool${getId()}`,
      };
      const deployed = await iexec.workerpool.deployWorkerpool(workerpool);
      await expect(
        iexec.workerpool.deployWorkerpool(workerpool),
      ).rejects.toThrow(
        Error(`Workerpool already deployed at address ${deployed.address}`),
      );
    });
  });

  describe('predictWorkerpoolAddress()', () => {
    test('predicts the deployment address', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpool = {
        owner: getRandomAddress(),
        description: `workerpool${getId()}`,
      };
      const predictedAddress =
        await readOnlyIExec.workerpool.predictWorkerpoolAddress(workerpool);
      await expect(
        readOnlyIExec.workerpool.checkDeployedWorkerpool(predictedAddress),
      ).resolves.toBe(false);
      await iexec.workerpool.deployWorkerpool(workerpool);
      await expect(
        readOnlyIExec.workerpool.checkDeployedWorkerpool(predictedAddress),
      ).resolves.toBe(true);
    });
  });

  describe('checkDeployedWorkerpool()', () => {
    test('checks a workerpool is deployed', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpool = {
        owner: getRandomAddress(),
        description: `workerpool${getId()}`,
      };
      const predictedAddress =
        await readOnlyIExec.workerpool.predictWorkerpoolAddress(workerpool);
      await expect(
        readOnlyIExec.workerpool.checkDeployedWorkerpool(predictedAddress),
      ).resolves.toBe(false);
      await iexec.workerpool.deployWorkerpool(workerpool);
      await expect(
        readOnlyIExec.workerpool.checkDeployedWorkerpool(predictedAddress),
      ).resolves.toBe(true);
    });
  });

  describe('transferWorkerpool()', () => {
    test('require a signer', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(
        iexec.workerpool.transferWorkerpool(
          getRandomAddress(),
          getRandomAddress(),
        ),
      ).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('transfers the ownership', async () => {
      const receiverAddress = getRandomAddress();
      const { iexec: iexecWorkerpoolOwner } = getTestConfig(iexecTestChain)();
      const { iexec: iexecRandom } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomWorkerpool(iexecWorkerpoolOwner);
      await expect(
        iexecRandom.workerpool.transferWorkerpool(
          getRandomAddress(),
          receiverAddress,
        ),
      ).rejects.toThrow(Error('Invalid workerpool address'));
      await expect(
        iexecRandom.workerpool.transferWorkerpool(address, receiverAddress),
      ).rejects.toThrow(
        Error('Only workerpool owner can transfer workerpool ownership'),
      );
      const res = await iexecWorkerpoolOwner.workerpool.transferWorkerpool(
        address,
        receiverAddress,
      );
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toMatch(txHashRegex);
      const { workerpool } =
        await iexecRandom.workerpool.showWorkerpool(address);
      expect(workerpool.owner).toBe(receiverAddress);
    });
  });

  describe('getWorkerpoolApiUrl()', () => {
    test('resolves the url', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomWorkerpool(iexec);
      const resNoApiUrl =
        await readOnlyIExec.workerpool.getWorkerpoolApiUrl(address);
      expect(resNoApiUrl).toBe(undefined);
      const label = address.toLowerCase();
      const domain = 'pools.iexec.eth';
      const name = `${label}.${domain}`;
      await iexec.ens.claimName(label, domain);
      await iexec.ens.configureResolution(name, address);
      const apiUrl = 'https://my-workerpool.com';
      await iexec.workerpool.setWorkerpoolApiUrl(address, apiUrl);
      const resConfigured =
        await readOnlyIExec.workerpool.getWorkerpoolApiUrl(address);
      expect(resConfigured).toBe(apiUrl);
    });
  });

  describe('setWorkerpoolApiUrl()', () => {
    test('require a configured ens name for the workerpool', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomWorkerpool(iexec);
      await expect(
        iexec.workerpool.setWorkerpoolApiUrl(
          address,
          'https://my-workerpool.com',
        ),
      ).rejects.toThrow(
        Error(`No ENS name reverse resolution configured for ${address}`),
      );
    });

    test('sets the workerpool api url', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomWorkerpool(iexec);
      const label = address.toLowerCase();
      const domain = 'pools.iexec.eth';
      const name = `${label}.${domain}`;
      await iexec.ens.claimName(label, domain);
      await iexec.ens.configureResolution(name, address);
      const res = await iexec.workerpool.setWorkerpoolApiUrl(
        address,
        'https://my-workerpool.com',
      );
      expect(res).toMatch(txHashRegex);
    });
  });
});
