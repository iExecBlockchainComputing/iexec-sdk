// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import {
  TEST_CHAINS,
  NULL_ADDRESS,
  NULL_BYTES32,
  execAsync,
  getRandomAddress,
  txHashRegex,
} from '../test-utils';
import {
  setWorkerpoolUniqueDescription,
  setChain,
  globalSetup,
  globalTeardown,
  runIExecCliRaw,
  setRandomWallet,
  iexecPath,
} from './cli-test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec workerpool', () => {
  let userWallet;
  let userFirstDeployedWorkerpoolAddress;

  beforeAll(async () => {
    await globalSetup('cli-iexec-workerpool');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} workerpool init`);
    const deployed = await execAsync(
      `${iexecPath} workerpool deploy --raw`,
    ).then(JSON.parse);
    userFirstDeployedWorkerpoolAddress = deployed.address;
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('init', () => {
    test('iexec workerpool init', async () => {
      const raw = await execAsync(`${iexecPath} workerpool init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });
  });

  describe('deploy', () => {
    test('iexec workerpool deploy', async () => {
      await setWorkerpoolUniqueDescription();
      const raw = await execAsync(`${iexecPath} workerpool deploy --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBeDefined();
      expect(res.txHash).toBeDefined();
      await testChain.provider.getTransaction(res.txHash).then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });
    });
  });

  describe('set-api-url', () => {
    test('iexec workerpool set-api-url', async () => {
      await execAsync(
        `${iexecPath} ens register ${userFirstDeployedWorkerpoolAddress.toLowerCase()} --for ${userFirstDeployedWorkerpoolAddress}`,
      );
      const raw = await execAsync(
        `${iexecPath} workerpool set-api-url https://my-workerpool.com ${userFirstDeployedWorkerpoolAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpoolAddress);
      expect(res.url).toBe('https://my-workerpool.com');
      expect(res.txHash).toMatch(txHashRegex);
      await testChain.provider.getTransaction(res.txHash).then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });

      const showRes = await runIExecCliRaw(
        `${iexecPath} workerpool show ${userFirstDeployedWorkerpoolAddress}`,
      );
      expect(showRes.apiUrl).toBe('https://my-workerpool.com');
    });

    test('iexec workerpool set-api-url (fail no ENS)', async () => {
      await setWorkerpoolUniqueDescription();
      const { address } = await runIExecCliRaw(
        `${iexecPath} workerpool deploy`,
      );
      const raw = await execAsync(
        `${iexecPath} workerpool set-api-url https://my-workerpool.com --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.name).toBe('Error');
      expect(res.error.message).toBe(
        `Missing ENS for workerpool ${address}. You probably forgot to run "iexec ens register <name> --for ${address}"`,
      );
    });
  });

  describe('show', () => {
    test('iexec workerpool show 0 (current user)', async () => {
      const raw = await execAsync(`${iexecPath} workerpool show 0 --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpoolAddress);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });

    test('iexec workerpool show [workerpoolAddress]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool show ${userFirstDeployedWorkerpoolAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpoolAddress);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });

    test('iexec workerpool show 0 --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool show 0 --user ${userWallet.address} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpoolAddress);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });
  });

  describe('count', () => {
    test('iexec workerpool count (current user)', async () => {
      const raw = await execAsync(`${iexecPath} workerpool count --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).not.toBe('0');
    });

    test('iexec workerpool count --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool count --user ${getRandomAddress()} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).toBe('0');
    });
  });

  describe('transfer', () => {
    test('transfers the workerpool ownership to', async () => {
      await setWorkerpoolUniqueDescription();
      const { address } = await execAsync(
        `${iexecPath} workerpool deploy --raw`,
      ).then(JSON.parse);
      const receiverAddress = getRandomAddress();
      const res = await execAsync(
        `${iexecPath} workerpool transfer ${address} --to ${receiverAddress} --force --raw`,
      ).then(JSON.parse);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeDefined();
      await testChain.provider.getTransaction(res.txHash).then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });
    });
  });

  describe('publish', () => {
    test('from deployed', async () => {
      await setWorkerpoolUniqueDescription();
      const { address } = await runIExecCliRaw(
        `${iexecPath} workerpool deploy`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool publish --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --workerpool ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.workerpoolorder.order).toEqual({
        workerpool: address,
        workerpoolprice: 0,
        volume: 1,
        tag: NULL_BYTES32,
        trust: 0,
        category: 0,
        apprestrict: NULL_ADDRESS,
        datasetrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.workerpoolorder.order.sign,
        salt: orderShowRes.workerpoolorder.order.salt,
      });
    });

    test('from workerpool address with options', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool publish ${userFirstDeployedWorkerpoolAddress} --price 0.000000002 RLC --volume 5 --tag tee,scone --trust 20 --category 1 --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --workerpool ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.workerpoolorder.order).toEqual({
        workerpool: userFirstDeployedWorkerpoolAddress,
        workerpoolprice: 2,
        volume: 5,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        trust: 20,
        category: 1,
        apprestrict: NULL_ADDRESS,
        datasetrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.workerpoolorder.order.sign,
        salt: orderShowRes.workerpoolorder.order.salt,
      });
    });
  });

  describe('unpublish', () => {
    test('latest from deployed', async () => {
      await setWorkerpoolUniqueDescription();
      await runIExecCliRaw(`${iexecPath} workerpool deploy`);
      await runIExecCliRaw(`${iexecPath} workerpool publish --force`);
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} workerpool publish --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toBe(lastOrderHash);
      await runIExecCliRaw(`${iexecPath} workerpool unpublish --force`);
      const resErr = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish --force`,
      );
      expect(resErr.ok).toBe(false);
    });

    test('from workerpool address --all', async () => {
      const { orderHash } = await runIExecCliRaw(
        `${iexecPath} workerpool publish ${userFirstDeployedWorkerpoolAddress} --force`,
      );
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} workerpool publish ${userFirstDeployedWorkerpoolAddress} --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish ${userFirstDeployedWorkerpoolAddress} --all --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      const resErr = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish --all --force --raw`,
      );
      expect(resErr.ok).toBe(false);
    });
  });
});
