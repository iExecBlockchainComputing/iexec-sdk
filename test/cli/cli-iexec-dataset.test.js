import { describe, test, expect } from '@jest/globals';
import {
  NULL_ADDRESS,
  NULL_BYTES32,
  TEST_CHAINS,
  execAsync,
  getRandomAddress,
} from '../test-utils.js';
import {
  setDatasetUniqueName,
  setChain,
  globalSetup,
  globalTeardown,
  runIExecCliRaw,
  setRandomWallet,
  iexecPath,
  checkExists,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec dataset', () => {
  let userWallet;
  let userFirstDeployedDatasetAddress;

  beforeAll(async () => {
    await globalSetup('cli-iexec-dataset');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const deployed = await runIExecCliRaw(`${iexecPath} dataset deploy`);
    userFirstDeployedDatasetAddress = deployed.address;
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('init', () => {
    test('iexec dataset init', async () => {
      const raw = await execAsync(`${iexecPath} dataset init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });

    test('--tee', async () => {
      const raw = await execAsync(`${iexecPath} dataset init --tee --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(await checkExists('.secrets/datasets/')).toBe(true);
      expect(await checkExists('.secrets/datasets/')).toBe(true);
      expect(await checkExists('datasets/encrypted/')).toBe(true);
    });

    test('--encrypted --original-dataset-dir ./out/originals  --encrypted-dataset-dir ./out/encrypted --dataset-keystoredir ./out/dataset-secrets', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset init --encrypted  --original-dataset-dir ./out/originals  --encrypted-dataset-dir ./out/encrypted --dataset-keystoredir ./out/dataset-secrets --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(await checkExists('out/dataset-secrets/')).toBe(true);
      expect(await checkExists('out/originals/')).toBe(true);
      expect(await checkExists('out/encrypted/')).toBe(true);
    });
  });

  describe('deploy', () => {
    test('iexec dataset deploy', async () => {
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBeDefined();
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');
    });
  });

  describe('show', () => {
    test('iexec dataset show (from deployed.json)', async () => {
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const { address } = await execAsync(
        `${iexecPath} dataset deploy --raw`,
      ).then(JSON.parse);
      const raw = await execAsync(`${iexecPath} dataset show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });

    test('iexec dataset show 0 (current user)', async () => {
      const raw = await execAsync(`${iexecPath} dataset show 0 --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedDatasetAddress);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });

    test('iexec dataset show [datasetAddress]', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset show ${userFirstDeployedDatasetAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedDatasetAddress);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });
  });

  describe('count', () => {
    test('iexec dataset count (current user)', async () => {
      const raw = await execAsync(`${iexecPath} dataset count --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).not.toBe('0');
    });

    test('iexec dataset count --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset count --user ${getRandomAddress()} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).toBe('0');
    });
  });

  describe('encrypt', () => {
    test('iexec dataset encrypt', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset encrypt --original-dataset-dir ../../inputs/originalDataset --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.encryptedDatasetFolderPath).toBeDefined();
      expect(res.secretPath).toBeDefined();
      expect(
        res.encryptedDatasetFolderPath.indexOf('/datasets/encrypted'),
      ).not.toBe(-1);
      expect(res.secretPath.indexOf('/.secrets/datasets')).not.toBe(-1);
      expect(res.encryptedFiles).toBeDefined();
      expect(res.encryptedFiles.length).toBe(2);
      expect(res.encryptedFiles[0].original).toBeDefined();
      expect(res.encryptedFiles[0].encrypted).toBeDefined();
      expect(res.encryptedFiles[0].key).toBeDefined();
      expect(res.encryptedFiles[0].checksum).toBeTxHash();
      expect(res.encryptedFiles[1].original).toBeDefined();
      expect(res.encryptedFiles[1].encrypted).toBeDefined();
      expect(res.encryptedFiles[1].key).toBeDefined();
      expect(res.encryptedFiles[1].checksum).toBeTxHash();
      expect(await checkExists('.secrets/datasets/dataset.key')).toBe(true);
      expect(await checkExists('.secrets/datasets/dataset.txt.key')).toBe(true);
      expect(await checkExists('.secrets/datasets/dataset.zip.key')).toBe(true);
      expect(await checkExists('datasets/encrypted/dataset.txt.enc')).toBe(
        true,
      );
      expect(await checkExists('datasets/encrypted/dataset.zip.enc')).toBe(
        true,
      );

      // decrypt with openssl
      const decryptedFilePath = 'out/decrypted';
      await expect(
        execAsync(
          `tail -c+17 "${res.encryptedFiles[0].encrypted}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(cat "${res.encryptedFiles[1].key}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${res.encryptedFiles[0].encrypted}" | xxd -p -c 16)`,
        ),
      ).rejects.toBeInstanceOf(Error);
      await expect(
        execAsync(
          `tail -c+17 "${res.encryptedFiles[0].encrypted}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(cat "${res.encryptedFiles[0].key}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${res.encryptedFiles[0].encrypted}" | xxd -p -c 16)`,
        ),
      ).resolves.toBeDefined();
      await expect(
        execAsync(
          `tail -c+17 "${res.encryptedFiles[1].encrypted}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(cat "${res.encryptedFiles[1].key}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${res.encryptedFiles[1].encrypted}" | xxd -p -c 16)`,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('push-secret / check-secret', () => {
    test('iexec dataset push-secret', async () => {
      await execAsync('mkdir -p .secrets/datasets/').catch(() => {});
      await execAsync('echo oops > ./.secrets/datasets/dataset.key');
      const randomAddress = getRandomAddress();
      const resPushNotAllowed = JSON.parse(
        await execAsync(
          `${iexecPath} dataset push-secret ${randomAddress} --raw`,
        ).catch((e) => e.message),
      );
      expect(resPushNotAllowed.ok).toBe(false);
      expect(resPushNotAllowed.error.message).toBe(
        `Wallet ${userWallet.address} is not allowed to set secret for ${randomAddress}`,
      );
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const { address } = JSON.parse(
        await execAsync(`${iexecPath} dataset deploy --raw`),
      );
      const resPush = JSON.parse(
        await execAsync(`${iexecPath} dataset push-secret --raw`),
      );
      expect(resPush.ok).toBe(true);
      const resAlreadyExists = JSON.parse(
        await execAsync(`${iexecPath} dataset push-secret --raw`).catch(
          (e) => e.message,
        ),
      );
      expect(resAlreadyExists.ok).toBe(false);
      expect(resAlreadyExists.error.message).toBe(
        `Secret already exists for ${address} and can't be updated`,
      );
    });

    test('iexec dataset check-secret', async () => {
      await execAsync('mkdir -p .secrets/datasets/').catch(() => {});
      await execAsync('echo oops > ./.secrets/datasets/dataset.key');
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      await execAsync(`${iexecPath} dataset deploy --raw`);
      const resMyDataset = JSON.parse(
        await execAsync(`${iexecPath} dataset check-secret --raw`),
      );
      expect(resMyDataset.ok).toBe(true);
      expect(resMyDataset.isSecretSet).toBe(false);
      await execAsync(`${iexecPath} dataset push-secret --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} dataset check-secret --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isSecretSet).toBe(true);
    });
  });

  describe('transfer', () => {
    beforeAll(async () => {
      // dataset init
      await execAsync(`${iexecPath} dataset init`);
    });
    test('transfers the dataset ownership to', async () => {
      await setDatasetUniqueName();
      const { address } = await execAsync(
        `${iexecPath} dataset deploy --raw`,
      ).then(JSON.parse);
      const receiverAddress = getRandomAddress();
      const res = await execAsync(
        `${iexecPath} dataset transfer ${address} --to ${receiverAddress} --force --raw`,
      ).then(JSON.parse);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeDefined();
    });
  });

  describe('publish', () => {
    test('from deployed', async () => {
      await setDatasetUniqueName();
      const { address } = await runIExecCliRaw(`${iexecPath} dataset deploy`);
      const res = await runIExecCliRaw(`${iexecPath} dataset publish --force`);
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --dataset ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.datasetorder.order).toEqual({
        dataset: address,
        datasetprice: 0,
        volume: 1000000,
        tag: NULL_BYTES32,
        apprestrict: NULL_ADDRESS,
        workerpoolrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.datasetorder.order.sign,
        salt: orderShowRes.datasetorder.order.salt,
      });
    });

    test('from dataset address with options', async () => {
      const appAddress = getRandomAddress();
      await expect(
        execAsync(
          `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --price 0.1 RLC --volume 100 --tag tee,scone --app-restrict ${appAddress} --force`,
        ),
      ).rejects.toThrow(
        `Dataset encryption key is not set for dataset ${userFirstDeployedDatasetAddress} in the SMS. Dataset decryption will fail.`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --price 0.1 RLC --volume 100 --app-restrict ${appAddress} --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --dataset ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.datasetorder.order).toEqual({
        dataset: userFirstDeployedDatasetAddress,
        datasetprice: 100000000,
        volume: 100,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        apprestrict: appAddress,
        workerpoolrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.datasetorder.order.sign,
        salt: orderShowRes.datasetorder.order.salt,
      });
    });
  });

  describe('unpublish', () => {
    test('latest from deployed', async () => {
      await setDatasetUniqueName();
      await runIExecCliRaw(`${iexecPath} dataset deploy`);
      await runIExecCliRaw(`${iexecPath} dataset publish --force`);
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} dataset publish --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} dataset unpublish --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toBe(lastOrderHash);
      await runIExecCliRaw(`${iexecPath} dataset unpublish --force`);
      const resErr = await runIExecCliRaw(
        `${iexecPath} dataset unpublish --force`,
      );
      expect(resErr.ok).toBe(false);
    });

    test('from dataset address --all', async () => {
      const { orderHash } = await runIExecCliRaw(
        `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --force`,
      );
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} dataset unpublish ${userFirstDeployedDatasetAddress} --all --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      const resErr = await runIExecCliRaw(
        `${iexecPath} dataset unpublish --all --force --raw`,
      );
      expect(resErr.ok).toBe(false);
    });
  });
});
