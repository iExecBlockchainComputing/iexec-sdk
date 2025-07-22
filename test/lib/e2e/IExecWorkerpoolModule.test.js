// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
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
import { errors, IExec } from '../../../src/lib/index.js';

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
      expect(res.workerpool.registry).toBeAddress();
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
      expect(res.workerpool.registry).toBeAddress();
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
      expect(res.txHash).toBeTxHash();
      expect(res.address).toBeAddress();
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
      expect(res.txHash).toBeTxHash();
      const { workerpool } =
        await iexecRandom.workerpool.showWorkerpool(address);
      expect(workerpool.owner).toBe(receiverAddress);
    });
  });

  describe('getWorkerpoolApiUrl()', () => {
    describe('on networks with ENS', () => {
      test('resolves the url against ENS', async () => {
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

    describe('on networks relying on compass', () => {
      test('resolves the url against Compass', async () => {
        // TODO include compass in stack instead of using arbitrum-sepolia-testnet
        const readOnlyIExec = new IExec(
          { ethProvider: 'arbitrum-sepolia-testnet' },
          { allowExperimentalNetworks: true },
        );
        const apiUrl = await readOnlyIExec.workerpool.getWorkerpoolApiUrl(
          '0x39C3CdD91A7F1c4Ed59108a9da4E79dE9A1C1b59',
        );
        expect(typeof apiUrl).toBe('string');
        expect(apiUrl.startsWith('https://')).toBe(true);
      });

      test('fails with CompassCallError if Compass is not available', async () => {
        const iexecCompassNotFound = new IExec(
          { ethProvider: 'arbitrum-sepolia-testnet' },
          {
            allowExperimentalNetworks: true,
            compassURL: SERVICE_UNREACHABLE_URL,
          },
        );
        await expect(
          iexecCompassNotFound.workerpool.getWorkerpoolApiUrl(
            getRandomAddress(),
          ),
        ).rejects.toThrow(
          new errors.CompassCallError(
            `Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
          ),
        );

        const iexecCompassInternalError = new IExec(
          { ethProvider: 'arbitrum-sepolia-testnet' },
          { allowExperimentalNetworks: true, compassURL: SERVICE_HTTP_500_URL },
        );
        await expect(
          iexecCompassInternalError.workerpool.getWorkerpoolApiUrl(
            getRandomAddress(),
          ),
        ).rejects.toThrow(
          new errors.CompassCallError(
            `Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
            Error('Server internal error: 500 Internal Server Error'),
          ),
        );
      });
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
      expect(res).toBeTxHash();
    });
  });
});
