import { describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import { deployRandomWorkerpool, getTestConfig } from '../lib-test-utils.js';
import {
  SERVICE_HTTP_500_URL,
  SERVICE_UNREACHABLE_URL,
  TEST_CHAINS,
  getId,
  getRandomAddress,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { errors } from '../../../src/lib/index.js';

const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];

describe('workerpool', () => {
  describe('showWorkerpool()', () => {
    test('shows a deployed workerpool', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const { iexec } = await getTestConfig(testChain)();
      const workerpool = {
        owner: await iexec.wallet.getAddress(),
        description: `workerpool${getId()}`,
      };
      const { address } = await iexec.workerpool.deployWorkerpool(workerpool);

      const res = await readOnlyIExec.workerpool.showWorkerpool(address);
      expect(res.objAddress).toBe(address);
      expect(res.workerpool.owner).toBe(workerpool.owner);
      expect(res.workerpool.registry).toBeAddress();
      expect(res.workerpool.schedulerRewardRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerStakeRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerpoolDescription).toBe(workerpool.description);
    });

    test('fails if the workerpool is not deployed', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const address = getRandomAddress();
      await expect(
        readOnlyIExec.workerpool.showWorkerpool(address),
      ).rejects.toThrow(
        new errors.ObjectNotFoundError(
          'workerpool',
          address,
          testChain.chainId,
        ),
      );
    });
  });

  describe('showUserWorkerpool()', () => {
    test('shows the user workerpool', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const { iexec, wallet } = await getTestConfig(testChain)();
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
      expect(res.workerpool.registry).toBeAddress();
      expect(res.workerpool.schedulerRewardRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerStakeRatioPolicy).toBeInstanceOf(BN);
      expect(res.workerpool.workerpoolDescription).toBe(workerpool.description);
    });

    test('fails if the workerpool is not deployed', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
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
      const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const { iexec, wallet } = await getTestConfig(testChain)();
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
      const { iexec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const workerpool = {
        owner: getRandomAddress(),
        description: `workerpool${getId()}`,
      };
      await expect(
        iexec.workerpool.deployWorkerpool(workerpool),
      ).rejects.toThrow(
        new Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('deploys a workerpool', async () => {
      const { iexec } = await getTestConfig(testChain)();
      const workerpool = {
        owner: await iexec.wallet.getAddress(),
        description: `workerpool${getId()}`,
      };
      const res = await iexec.workerpool.deployWorkerpool(workerpool);
      expect(res.txHash).toBeTxHash();
      expect(res.address).toBeAddress();
    });

    test('cannot deploy twice with the same params', async () => {
      const { iexec } = await getTestConfig(testChain)();
      const workerpool = {
        owner: await iexec.wallet.getAddress(),
        description: `workerpool${getId()}`,
      };
      const deployed = await iexec.workerpool.deployWorkerpool(workerpool);
      await expect(
        iexec.workerpool.deployWorkerpool(workerpool),
      ).rejects.toThrow(
        new Error(`Workerpool already deployed at address ${deployed.address}`),
      );
    });
  });

  describe('predictWorkerpoolAddress()', () => {
    test('predicts the deployment address', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const { iexec } = await getTestConfig(testChain)();
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
      const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const { iexec } = await getTestConfig(testChain)();
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
      const { iexec } = await getTestConfig(testChain)({ readOnly: true });
      await expect(
        iexec.workerpool.transferWorkerpool(
          getRandomAddress(),
          getRandomAddress(),
        ),
      ).rejects.toThrow(
        new Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('transfers the ownership', async () => {
      const receiverAddress = getRandomAddress();
      const { iexec: iexecWorkerpoolOwner } = await getTestConfig(testChain)();
      const { iexec: iexecRandom } = await getTestConfig(testChain)();
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
        new Error('Only workerpool owner can transfer workerpool ownership'),
      );
      const res = await iexecWorkerpoolOwner.workerpool.transferWorkerpool(
        address,
        receiverAddress,
      );
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeTxHash();
      const { workerpool } =
        await iexecRandom.workerpool.showWorkerpool(address);
      expect(workerpool.owner).toBe(receiverAddress);
    });
  });

  describe('getWorkerpoolApiUrl()', () => {
    describe('on networks with ENS', () => {
      test('resolves the url against ENS', async () => {
        const { iexec: readOnlyIExec } = await getTestConfig(testChain)({
          readOnly: true,
        });
        const { iexec } = await getTestConfig(testChain)();
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

    describe('on networks relying on compass', () => {
      const noEnsTestChain = TEST_CHAINS['arbitrum-sepolia-fork'];

      test('resolves the url against Compass', async () => {
        const { iexec: readOnlyIExec } = await getTestConfig(noEnsTestChain)();
        const apiUrl = await readOnlyIExec.workerpool.getWorkerpoolApiUrl(
          '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
        );
        expect(typeof apiUrl).toBe('string');
        expect(apiUrl.startsWith('https://')).toBe(true);
      });

      test('throw if the workerpool does not exist in Compass', async () => {
        const { iexec: readOnlyIExec } = await getTestConfig(noEnsTestChain)();
        const address = getRandomAddress();
        await expect(
          readOnlyIExec.workerpool.getWorkerpoolApiUrl(address),
        ).rejects.toThrow(
          new Error(
            `API error: Workerpool with address '${address}' not found in chain '${noEnsTestChain.chainId}'`,
          ),
        );
      });

      test('fails with CompassCallError if Compass is not available', async () => {
        const { iexec: iexecCompassNotFound } = await getTestConfig(
          noEnsTestChain,
        )({
          options: {
            compassURL: SERVICE_UNREACHABLE_URL,
          },
        });
        await expect(
          iexecCompassNotFound.workerpool.getWorkerpoolApiUrl(
            getRandomAddress(),
          ),
        ).rejects.toThrow(
          new errors.CompassCallError(
            `Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
          ),
        );

        const { iexec: iexecCompassInternalError } = await getTestConfig(
          noEnsTestChain,
        )({
          options: {
            compassURL: SERVICE_HTTP_500_URL,
          },
        });
        await expect(
          iexecCompassInternalError.workerpool.getWorkerpoolApiUrl(
            getRandomAddress(),
          ),
        ).rejects.toThrow(
          new errors.CompassCallError(
            `Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
            new Error('Server internal error: 500 Internal Server Error'),
          ),
        );
      });
    });
  });

  describe('setWorkerpoolApiUrl()', () => {
    test('require a configured ens name for the workerpool', async () => {
      const { iexec } = await getTestConfig(testChain)();
      const { address } = await deployRandomWorkerpool(iexec);
      await expect(
        iexec.workerpool.setWorkerpoolApiUrl(
          address,
          'https://my-workerpool.com',
        ),
      ).rejects.toThrow(
        new Error(`No ENS name reverse resolution configured for ${address}`),
      );
    });

    test('sets the workerpool api url', async () => {
      const { iexec } = await getTestConfig(testChain)();
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
      expect(res).toBeTxHash();
    });
  });
});
