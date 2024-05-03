// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { join } from 'path';
import { BN } from 'bn.js';
import fsExtra from 'fs-extra';
import { deployRandomDataset, getTestConfig } from '../lib-test-utils.js';
import {
  TEST_CHAINS,
  TEE_FRAMEWORKS,
  execAsync,
  getId,
  getRandomAddress,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { errors } from '../../../src/lib/index.js';

const { readFile, ensureDir, writeFile } = fsExtra;

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('dataset', () => {
  describe('showDataset()', () => {
    test('shows a deployed dataset', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const dataset = {
        owner: await iexec.wallet.getAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      const { address } = await iexec.dataset.deployDataset(dataset);

      const res = await readOnlyIExec.dataset.showDataset(address);
      expect(res.objAddress).toBe(address);
      expect(res.dataset.owner).toBe(dataset.owner);
      expect(res.dataset.registry).toBeAddress();
      expect(res.dataset.datasetName).toBe(dataset.name);
      expect(res.dataset.datasetMultiaddr).toBe(dataset.multiaddr);
      expect(res.dataset.datasetChecksum).toBe(dataset.checksum);
    });

    test('fails if the dataset is not deployed', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const address = getRandomAddress();
      await expect(readOnlyIExec.dataset.showDataset(address)).rejects.toThrow(
        new errors.ObjectNotFoundError(
          'dataset',
          address,
          iexecTestChain.chainId,
        ),
      );
    });
  });

  describe('showUserDataset()', () => {
    test('shows the user dataset', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const dataset = {
        owner: wallet.address,
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      const { address } = await iexec.dataset.deployDataset(dataset);
      const res = await readOnlyIExec.dataset.showUserDataset(
        0,
        wallet.address,
      );
      expect(res.objAddress).toBe(address);
      expect(res.dataset.owner).toBe(dataset.owner);
      expect(res.dataset.registry).toBeAddress();
      expect(res.dataset.datasetName).toBe(dataset.name);
      expect(res.dataset.datasetMultiaddr).toBe(dataset.multiaddr);
      expect(res.dataset.datasetChecksum).toBe(dataset.checksum);
    });

    test('fails if the dataset is not deployed', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const address = getRandomAddress();
      await expect(
        readOnlyIExec.dataset.showUserDataset(0, address),
      ).rejects.toThrow(Error('dataset not deployed'));
    });
  });

  describe('countUserDatasets()', () => {
    test('counts user datasets', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const resBeforeDeploy = await readOnlyIExec.dataset.countUserDatasets(
        wallet.address,
      );
      await deployRandomDataset(iexec);
      const res = await readOnlyIExec.dataset.countUserDatasets(wallet.address);
      expect(resBeforeDeploy).toBeInstanceOf(BN);
      expect(res).toBeInstanceOf(BN);
      expect(resBeforeDeploy.add(new BN(1)).eq(res)).toBe(true);
    });
  });

  describe('deployDataset()', () => {
    test('require a signer', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const dataset = {
        owner: getRandomAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      await expect(iexec.dataset.deployDataset(dataset)).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('deploys a dataset', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const dataset = {
        owner: await iexec.wallet.getAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      const res = await iexec.dataset.deployDataset(dataset);
      expect(res.txHash).toBeTxHash();
      expect(res.address).toBeAddress();
    });

    test('cannot deploy twice with the same params', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const dataset = {
        owner: await iexec.wallet.getAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      const deployed = await iexec.dataset.deployDataset(dataset);
      await expect(iexec.dataset.deployDataset(dataset)).rejects.toThrow(
        Error(`Dataset already deployed at address ${deployed.address}`),
      );
    });
  });

  describe('predictDatasetAddress()', () => {
    test('predicts the deployment address', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const dataset = {
        owner: getRandomAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      const predictedAddress =
        await readOnlyIExec.dataset.predictDatasetAddress(dataset);
      await expect(
        readOnlyIExec.dataset.checkDeployedDataset(predictedAddress),
      ).resolves.toBe(false);
      await iexec.dataset.deployDataset(dataset);
      await expect(
        readOnlyIExec.dataset.checkDeployedDataset(predictedAddress),
      ).resolves.toBe(true);
    });
  });

  describe('checkDeployedDataset()', () => {
    test('checks a dataset is deployed', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const dataset = {
        owner: getRandomAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      const predictedAddress =
        await readOnlyIExec.dataset.predictDatasetAddress(dataset);
      await expect(
        readOnlyIExec.dataset.checkDeployedDataset(predictedAddress),
      ).resolves.toBe(false);
      await iexec.dataset.deployDataset(dataset);
      await expect(
        readOnlyIExec.dataset.checkDeployedDataset(predictedAddress),
      ).resolves.toBe(true);
    });
  });

  describe('transferDataset()', () => {
    test('require a signer', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(
        iexec.dataset.transferDataset(getRandomAddress(), getRandomAddress()),
      ).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('transfers the ownership', async () => {
      const receiverAddress = getRandomAddress();
      const { iexec: iexecDatasetOwner } = getTestConfig(iexecTestChain)();
      const { iexec: iexecRandom } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomDataset(iexecDatasetOwner);
      await expect(
        iexecRandom.dataset.transferDataset(
          getRandomAddress(),
          receiverAddress,
        ),
      ).rejects.toThrow(Error('Invalid dataset address'));
      await expect(
        iexecRandom.dataset.transferDataset(address, receiverAddress),
      ).rejects.toThrow(
        Error('Only dataset owner can transfer dataset ownership'),
      );
      const res = await iexecDatasetOwner.dataset.transferDataset(
        address,
        receiverAddress,
      );
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeTxHash();
      const { dataset } = await iexecRandom.dataset.showDataset(address);
      expect(dataset.owner).toBe(receiverAddress);
    });
  });

  describe('generateEncryptionKey()', () => {
    const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
      readOnly: true,
    });
    const key = readOnlyIExec.dataset.generateEncryptionKey();
    expect(typeof key).toBe('string');
    expect(Buffer.from(key, 'base64').length).toBe(32);
  });

  describe('encrypt()', () => {
    test('encrypts the input', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const key = iexec.dataset.generateEncryptionKey();
      const encryptedBytes = await iexec.dataset.encrypt(
        await readFile('test/inputs/files/text.zip'),
        key,
      );
      expect(encryptedBytes).toBeInstanceOf(Buffer);
      expect(encryptedBytes.length).toBe(224);

      // decrypt with openssl
      const outDirPath = join(
        process.cwd(),
        'test/tests-working-dir/lib/IExecDatasetModule',
      );
      await ensureDir(outDirPath).then(() =>
        writeFile(join(outDirPath, 'dataset.enc'), encryptedBytes),
      );
      const encryptedFilePath = join(outDirPath, 'dataset.enc');
      const decryptedFilePath = join(outDirPath, 'decrypted.zip');
      await expect(
        execAsync(
          `tail -c+17 "${encryptedFilePath}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(echo "${iexec.dataset.generateEncryptionKey()}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${encryptedFilePath}" | xxd -p -c 16)`,
        ),
      ).rejects.toBeInstanceOf(Error);
      await expect(
        execAsync(
          `tail -c+17 "${encryptedFilePath}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(echo "${key}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${encryptedFilePath}" | xxd -p -c 16)`,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('computeEncryptedFileChecksum()', () => {
    test('does the sha256sum of the input', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const key = iexec.dataset.generateEncryptionKey();
      const fileBytes = await readFile(
        join(process.cwd(), 'test/inputs/files/text.zip'),
      );

      const originalFileChecksum =
        await iexec.dataset.computeEncryptedFileChecksum(fileBytes);
      expect(originalFileChecksum).toBe(
        '0x43836bca5914a130343c143d8146a4a75690fc08445fd391a2c6cf9b48694515',
      );

      const encryptedFileBytes = await iexec.dataset.encrypt(fileBytes, key);
      const encryptedFileChecksum =
        await iexec.dataset.computeEncryptedFileChecksum(encryptedFileBytes);
      expect(encryptedFileChecksum).toBeTxHash();
    });
  });

  describe('checkDatasetSecretExists()', () => {
    test('checks a dataset secret exist on default TEE framework SMS', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomDataset(iexec);
      await expect(
        readOnlyIExec.dataset.checkDatasetSecretExists(address),
      ).resolves.toBe(false);
      await iexec.dataset.pushDatasetSecret(address, 'foo');
      await expect(
        readOnlyIExec.dataset.checkDatasetSecretExists(address),
      ).resolves.toBe(true);
      await expect(
        readOnlyIExec.dataset.checkDatasetSecretExists(address, {
          teeFramework: TEE_FRAMEWORKS.SCONE,
        }),
      ).resolves.toBe(true);
    });

    test('allows teeFramework override', async () => {
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomDataset(iexec);
      await iexec.dataset.pushDatasetSecret(address, 'foo', {
        teeFramework: TEE_FRAMEWORKS.GRAMINE,
      });
      await expect(
        readOnlyIExec.dataset.checkDatasetSecretExists(address, {
          teeFramework: TEE_FRAMEWORKS.GRAMINE,
        }),
      ).resolves.toBe(true);
      await expect(
        readOnlyIExec.dataset.checkDatasetSecretExists(address, {
          teeFramework: TEE_FRAMEWORKS.SCONE,
        }),
      ).resolves.toBe(false);
      // validate teeFramework
      await expect(
        readOnlyIExec.dataset.checkDatasetSecretExists(getRandomAddress(), {
          teeFramework: 'foo',
        }),
      ).rejects.toThrow(Error('teeFramework is not a valid TEE framework'));
    });
  });

  describe('pushDatasetSecret()', () => {
    test('only owner can push secret', async () => {
      const { iexec: iexecDatasetOwner } = getTestConfig(iexecTestChain)();
      const { iexec: iexecRandom, wallet: randomWallet } =
        getTestConfig(iexecTestChain)();
      const { address: datasetAddress } =
        await deployRandomDataset(iexecDatasetOwner);
      // only owner can push secret
      await expect(
        iexecRandom.dataset.pushDatasetSecret(datasetAddress, 'foo'),
      ).rejects.toThrow(
        Error(
          `Wallet ${randomWallet.address} is not allowed to set secret for ${datasetAddress}`,
        ),
      );
    });

    test('use the default TEE framework SMS', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address: datasetAddress } = await deployRandomDataset(iexec, {
        teeFramework: TEE_FRAMEWORKS.GRAMINE,
      });
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'foo'),
      ).resolves.toBe(true);
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'foo', {
          teeFramework: TEE_FRAMEWORKS.SCONE,
        }),
      ).rejects.toThrow(
        Error(
          `Secret already exists for ${datasetAddress} and can't be updated`,
        ),
      );
    });

    test('cannot update existing secret', async () => {
      const { iexec: iexecDatasetOwner } = getTestConfig(iexecTestChain)();
      const { address: datasetAddress } =
        await deployRandomDataset(iexecDatasetOwner);

      await expect(
        iexecDatasetOwner.dataset.pushDatasetSecret(datasetAddress, 'foo'),
      ).resolves.toBe(true);
      // can't update existing secret
      await expect(
        iexecDatasetOwner.dataset.pushDatasetSecret(datasetAddress, 'foo'),
      ).rejects.toThrow(
        Error(
          `Secret already exists for ${datasetAddress} and can't be updated`,
        ),
      );
    });

    test('allow teeFramework override', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address: datasetAddress } = await deployRandomDataset(iexec);
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'foo'),
      ).resolves.toBe(true);
      await expect(
        iexec.dataset.checkDatasetSecretExists(datasetAddress, {
          teeFramework: TEE_FRAMEWORKS.GRAMINE,
        }),
      ).resolves.toBe(false);
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'foo', {
          teeFramework: TEE_FRAMEWORKS.GRAMINE,
        }),
      ).resolves.toBe(true);
      await expect(
        iexec.dataset.checkDatasetSecretExists(datasetAddress, {
          teeFramework: TEE_FRAMEWORKS.GRAMINE,
        }),
      ).resolves.toBe(true);

      // validate teeFramework
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'foo', {
          teeFramework: 'foo',
        }),
      ).rejects.toThrow(Error('teeFramework is not a valid TEE framework'));
    });
  });
});
