import { describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import {
  TEST_CHAINS,
  getId,
  getRandomAddress,
  SERVICE_UNREACHABLE_URL,
  SERVICE_HTTP_500_URL,
} from '../../test-utils.js';
import {
  deployRandomApp,
  getTestConfig,
  expectAsyncCustomError,
} from '../lib-test-utils.js';
import '../../jest-setup.js';
import { errors } from '../../../src/lib/index.js';

const { SmsCallError } = errors;

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('app', () => {
  describe('showApp()', () => {
    test('shows a deployed app', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = await getTestConfig(iexecTestChain)();
      const app = {
        owner: await iexec.wallet.getAddress(),
        name: `app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
        mrenclave: {
          framework: 'SCONE',
          version: 'v5',
          entrypoint: 'python /app/app.py',
          heapSize: 1073741824,
          fingerprint:
            'eca3ace86f1e8a5c47123c8fd271319e9eb25356803d36666dc620f30365c0c1',
        },
      };
      const { address } = await iexec.app.deployApp(app);
      const res = await readOnlyIExec.app.showApp(address);
      expect(res.objAddress).toBe(address);
      expect(res.app.owner).toBe(app.owner);
      expect(res.app.registry).toBeAddress();
      expect(res.app.appName).toBe(app.name);
      expect(res.app.appType).toBe(app.type);
      expect(res.app.appMultiaddr).toBe(app.multiaddr);
      expect(res.app.appChecksum).toBe(app.checksum);
      expect(res.app.appMREnclave).toBe(JSON.stringify(app.mrenclave));
    });

    test('fails if the app is not deployed', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const address = getRandomAddress();
      await expect(readOnlyIExec.app.showApp(address)).rejects.toThrow(
        new errors.ObjectNotFoundError('app', address, iexecTestChain.chainId),
      );
    });
  });

  describe('showUserApp()', () => {
    test('shows the user app', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec, wallet } = await getTestConfig(iexecTestChain)();
      const app = {
        owner: wallet.address,
        name: `app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
        mrenclave: {
          framework: 'SCONE',
          version: 'v5',
          entrypoint: 'python /app/app.py',
          heapSize: 1073741824,
          fingerprint:
            'eca3ace86f1e8a5c47123c8fd271319e9eb25356803d36666dc620f30365c0c1',
        },
      };
      const { address } = await iexec.app.deployApp(app);
      const res = await readOnlyIExec.app.showUserApp(0, wallet.address);
      expect(res.objAddress).toBe(address);
      expect(res.app.owner).toBe(app.owner);
      expect(res.app.registry).toBeAddress();
      expect(res.app.appName).toBe(app.name);
      expect(res.app.appType).toBe(app.type);
      expect(res.app.appMultiaddr).toBe(app.multiaddr);
      expect(res.app.appChecksum).toBe(app.checksum);
      expect(res.app.appMREnclave).toBe(JSON.stringify(app.mrenclave));
    });

    test('fails if the app is not deployed', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const address = getRandomAddress();
      await expect(readOnlyIExec.app.showUserApp(0, address)).rejects.toThrow(
        new Error('app not deployed'),
      );
    });
  });

  describe('countUserApps()', () => {
    test('counts user app', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec, wallet } = await getTestConfig(iexecTestChain)();
      const resBeforeDeploy = await readOnlyIExec.app.countUserApps(
        wallet.address,
      );
      await deployRandomApp(iexec);
      const res = await readOnlyIExec.app.countUserApps(wallet.address);
      expect(resBeforeDeploy).toBeInstanceOf(BN);
      expect(res).toBeInstanceOf(BN);
      expect(resBeforeDeploy.add(new BN(1)).eq(res)).toBe(true);
    });
  });

  describe('deployApp()', () => {
    test('require a signer', async () => {
      const { iexec } = await getTestConfig(iexecTestChain)({ readOnly: true });
      const app = {
        owner: getRandomAddress(),
        name: `app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      };
      await expect(iexec.app.deployApp(app)).rejects.toThrow(
        new Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('deploys an app', async () => {
      const { iexec } = await getTestConfig(iexecTestChain)();
      const app = {
        owner: getRandomAddress(),
        name: `app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      };
      const res = await iexec.app.deployApp(app);
      expect(res.txHash).toBeTxHash();
      expect(res.address).toBeAddress();
    });

    test('cannot deploy twice with the same params', async () => {
      const { iexec } = await getTestConfig(iexecTestChain)();
      const app = {
        owner: getRandomAddress(),
        name: `app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      };
      const deployed = await iexec.app.deployApp(app);
      await expect(iexec.app.deployApp(app)).rejects.toThrow(
        new Error(`App already deployed at address ${deployed.address}`),
      );
    });
  });

  describe('predictAppAddress()', () => {
    test('predicts the deployment address', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = await getTestConfig(iexecTestChain)();
      const app = {
        owner: getRandomAddress(),
        name: `app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      };
      const predictedAddress = await readOnlyIExec.app.predictAppAddress(app);
      await expect(
        readOnlyIExec.app.checkDeployedApp(predictedAddress),
      ).resolves.toBe(false);
      await iexec.app.deployApp(app);
      await expect(
        readOnlyIExec.app.checkDeployedApp(predictedAddress),
      ).resolves.toBe(true);
    });
  });

  describe('checkDeployedApp()', () => {
    test('checks an app is deployed', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = await getTestConfig(iexecTestChain)();
      const app = {
        owner: getRandomAddress(),
        name: `app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      };
      const predictedAddress = await readOnlyIExec.app.predictAppAddress(app);
      await expect(
        readOnlyIExec.app.checkDeployedApp(predictedAddress),
      ).resolves.toBe(false);
      await iexec.app.deployApp(app);
      await expect(
        readOnlyIExec.app.checkDeployedApp(predictedAddress),
      ).resolves.toBe(true);
    });
  });

  describe('transferApp()', () => {
    test('require a signer', async () => {
      const { iexec } = await getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(
        iexec.app.transferApp(getRandomAddress(), getRandomAddress()),
      ).rejects.toThrow(
        new Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('transfers the ownership', async () => {
      const receiverAddress = getRandomAddress();
      const { iexec: iexecAppOwner } = await getTestConfig(iexecTestChain)();
      const { iexec: iexecRandom } = await getTestConfig(iexecTestChain)();
      const { address } = await deployRandomApp(iexecAppOwner);
      await expect(
        iexecRandom.app.transferApp(getRandomAddress(), receiverAddress),
      ).rejects.toThrow(Error('Invalid app address'));
      await expect(
        iexecRandom.app.transferApp(address, receiverAddress),
      ).rejects.toThrow(Error('Only app owner can transfer app ownership'));
      const res = await iexecAppOwner.app.transferApp(address, receiverAddress);
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeTxHash();
      const { app } = await iexecRandom.app.showApp(address);
      expect(app.owner).toBe(receiverAddress);
    });
  });

  describe('checkAppSecretExists()', () => {
    let randomAppAddress;
    beforeAll(async () => {
      const { iexec } = await getTestConfig(iexecTestChain)();
      const { address } = await deployRandomApp(iexec);
      randomAppAddress = address;
    });

    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        readOnlyIExec.app.checkAppSecretExists(randomAppAddress),
        {
          constructor: SmsCallError,
          message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        readOnlyIExec.app.checkAppSecretExists(randomAppAddress),
        {
          constructor: SmsCallError,
          message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });

    test('checks an app secret exist on SMS', async () => {
      const { iexec: readOnlyIExec } = await getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = await getTestConfig(iexecTestChain)();
      const { address } = await deployRandomApp(iexec);
      await expect(
        readOnlyIExec.app.checkAppSecretExists(address),
      ).resolves.toBe(false);
      await iexec.app.pushAppSecret(address, 'foo');
      await expect(
        readOnlyIExec.app.checkAppSecretExists(address),
      ).resolves.toBe(true);
    });
  });

  describe('pushAppSecret()', () => {
    let randomAppAddress;
    let randomAppOwnerWallet;
    beforeAll(async () => {
      const { iexec, wallet } = await getTestConfig(iexecTestChain)();
      const { address } = await deployRandomApp(iexec);
      randomAppAddress = address;
      randomAppOwnerWallet = wallet;
    });

    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec } = await getTestConfig(iexecTestChain)({
        privateKey: randomAppOwnerWallet.privateKey,
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexec.app.pushAppSecret(randomAppAddress, 'foo'),
        {
          constructor: SmsCallError,
          message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec } = await getTestConfig(iexecTestChain)({
        privateKey: randomAppOwnerWallet.privateKey,
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexec.app.pushAppSecret(randomAppAddress, 'foo'),
        {
          constructor: SmsCallError,
          message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });

    test('only owner can push secret', async () => {
      const { iexec: iexecAppOwner } = await getTestConfig(iexecTestChain)();
      const { iexec: iexecRandom, wallet: randomWallet } =
        await getTestConfig(iexecTestChain)();
      const { address: appAddress } = await deployRandomApp(iexecAppOwner);
      // only owner can push secret
      await expect(
        iexecRandom.app.pushAppSecret(appAddress, 'foo'),
      ).rejects.toThrow(
        new Error(
          `Wallet ${randomWallet.address} is not allowed to set secret for ${appAddress}`,
        ),
      );
    });

    test('cannot update existing secret', async () => {
      const { iexec: iexecAppOwner } = await getTestConfig(iexecTestChain)();
      const { address: appAddress } = await deployRandomApp(iexecAppOwner);

      await expect(
        iexecAppOwner.app.pushAppSecret(appAddress, 'foo'),
      ).resolves.toBe(true);
      // can't update existing secret
      await expect(
        iexecAppOwner.app.pushAppSecret(appAddress, 'foo'),
      ).rejects.toThrow(
        new Error(
          `Secret already exists for ${appAddress} and can't be updated`,
        ),
      );
    });
  });
});
