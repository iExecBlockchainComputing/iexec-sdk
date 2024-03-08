// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { gt } from 'semver';
import { Wallet, Contract } from 'ethers';
import BN from 'bn.js';
import {
  TEST_CHAINS,
  execAsync,
  getId,
  getRandomAddress,
  getRandomWallet,
} from '../test-utils';
import { bytes32Regex } from '../../src/common/utils/utils';
import { TEE_FRAMEWORKS } from '../../src/common/utils/constant';
import {
  checkExists,
  editApporder,
  editDatasetorder,
  editRequestorder,
  editWorkerpoolorder,
  globalSetup,
  globalTeardown,
  loadJSONFile,
  removeWallet,
  saveJSONToFile,
  setAppUniqueName,
  setChain,
  setChainsPocoAdminWallet,
  setChainsRichWallet,
  setDatasetUniqueName,
  setDeployedJson,
  setRandomWallet,
  setWallet,
  setWorkerpoolUniqueDescription,
} from './cli-test-utils';

console.log('Node version:', process.version);

const DEFAULT_TIMEOUT = 120000;

jest.setTimeout(DEFAULT_TIMEOUT);

// CONFIG
const { DRONE, INFURA_PROJECT_ID } = process.env;
const iexecPath = DRONE ? 'iexec' : 'node ../../../src/cli/cmd/iexec.js';

// public chains
console.log('using env INFURA_PROJECT_ID', !!INFURA_PROJECT_ID);
const mainnetHost = INFURA_PROJECT_ID
  ? `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
  : 'mainnet';

const testChain = TEST_CHAINS['bellecour-fork'];

const PRIVATE_KEY = testChain.richWallet.privateKey;
const PUBLIC_KEY = testChain.richWallet.publicKey;
const ADDRESS = testChain.richWallet.address;

const poorWallet = getRandomWallet();
const poorWallet2 = getRandomWallet();

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const networkId = `${testChain.chainId}`;
const hubAddress = testChain.hubAddress || testChain.defaults.hubAddress;

const expectedGasPrice = '0';

console.log('TEST_CHAIN', testChain);

// UTILS

const pocoAdminWallet = new Wallet(
  testChain.pocoAdminWallet.privateKey,
  testChain.provider,
);

const setRichWallet = setChainsRichWallet(testChain);
const setPocoAdminWallet = setChainsPocoAdminWallet(testChain);

const setPoorWallet1 = () => setWallet(poorWallet.privateKey);

const setTestChain = (options) => setChain(testChain)(options);

// TESTS
beforeAll(async () => {
  await globalSetup('cli');
});

afterAll(async () => {
  await globalTeardown();
});

describe('iexec', () => {
  let sidechainApp;
  let sidechainDataset;
  let sidechainWorkerpool;
  let sidechainNoDurationCatid;
  let sidechainDealid;
  let sidechainTaskid;
  let sidechainDealidNoDuration;
  let sidechainTaskidNoDuration;

  beforeAll(async () => {
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setTestChain();
    await setRichWallet();
  });

  afterAll(async () => {
    await execAsync('rm wallet.json').catch(() => {});
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm deployed.json').catch(() => {});
    await execAsync('rm orders.json').catch(() => {});
  });

  // WORKERPOOL

  // CATEGORY

  // ORDER

  // DEAL

  // send-ether
  test('iexec wallet send-ether', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-ether 1 --to ${poorWallet.address} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(poorWallet.address);
    expect(res.amount).toBe('1000000000000000000');
    expect(res.txHash).toBeDefined();
    const tx = await testChain.provider.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  test('iexec wallet send-ether', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-ether 1 gwei --to ${poorWallet.address} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(poorWallet.address);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).toBeDefined();
    const tx = await testChain.provider.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  // send-RLC
  test('iexec wallet send-RLC 0.5', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-RLC 0.5 --to ${poorWallet.address} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(poorWallet.address);
    expect(res.amount).toBe('500000000');
    expect(res.txHash).toBeDefined();
    const tx = await testChain.provider.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  test('iexec wallet send-RLC 1000000000 nRLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-RLC 1000000000 nRLC --to ${poorWallet.address} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(poorWallet.address);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).toBeDefined();
    const tx = await testChain.provider.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  test('iexec wallet sweep', async () => {
    await setPoorWallet1();
    const raw = await execAsync(
      `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(poorWallet.address);
    expect(res.to).toBe(ADDRESS);
    expect(res.sendERC20TxHash).toBeDefined();
    expect(res.sendNativeTxHash).toBeDefined();
    expect(res.errors).toBeUndefined();
  });

  test('[common] app secret', async () => {
    await setTestChain();
    await setRichWallet();
    await execAsync(`${iexecPath} app init --tee-framework gramine --raw`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );

    // anyone can check-secret
    await removeWallet();
    const checkNotPushed = JSON.parse(
      await execAsync(`${iexecPath} app check-secret ${address} --raw`),
    );
    expect(checkNotPushed.ok).toBe(true);
    expect(checkNotPushed.isSecretSet).toBe(false);
    // only owner can push
    await setPoorWallet1();
    const pushUnauthorized = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret  ${address} --secret-value foo --raw`,
      ).catch((err) => err.message),
    );
    expect(pushUnauthorized.ok).toBe(false);
    await setRichWallet();
    const pushAuthorized = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret  ${address} --secret-value foo --raw`,
      ),
    );
    expect(pushAuthorized.ok).toBe(true);
    // cannot update app secret
    const pushUpdate = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret ${address} --secret-value bar --raw`,
      ).catch((err) => err.message),
    );
    expect(pushUpdate.ok).toBe(false);
    // check pushed
    await removeWallet();
    const checkPushed = JSON.parse(
      await execAsync(`${iexecPath} app check-secret ${address} --raw`),
    );
    expect(checkPushed.ok).toBe(true);
    expect(checkPushed.isSecretSet).toBe(true);
    // check secret TEE framework validation
    await expect(
      execAsync(
        `${iexecPath} app check-secret ${address} --tee-framework foo --raw`,
      ),
    ).rejects.toThrow();
    // check secret TEE framework override
    const checkOtherFramework = JSON.parse(
      await execAsync(
        `${iexecPath} app check-secret ${address} --tee-framework ${TEE_FRAMEWORKS.SCONE} --raw`,
      ),
    );
    expect(checkOtherFramework.ok).toBe(true);
    expect(checkOtherFramework.isSecretSet).toBe(false);
    // push secret TEE framework override
    await setRichWallet();
    const pushOtherFrameworkAuthorized = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret  ${address} --secret-value foo --tee-framework ${TEE_FRAMEWORKS.SCONE} --raw`,
      ),
    );
    expect(pushOtherFrameworkAuthorized.ok).toBe(true);
    const checkOtherFrameworkPushed = JSON.parse(
      await execAsync(
        `${iexecPath} app check-secret ${address} --tee-framework ${TEE_FRAMEWORKS.SCONE} --raw`,
      ),
    );
    expect(checkOtherFrameworkPushed.ok).toBe(true);
    expect(checkOtherFrameworkPushed.isSecretSet).toBe(true);
  });

  test('[common] iexec app publish (from deployed)', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );
    const raw = await execAsync(`${iexecPath} app publish --force --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(`${iexecPath} order show --app ${res.orderHash} --raw`),
    );
    expect(orderShowRes.apporder.order).toEqual({
      app: address,
      appprice: 0,
      volume: 1000000,
      tag: NULL_BYTES32,
      datasetrestrict: NULL_ADDRESS,
      workerpoolrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.apporder.order.sign,
      salt: orderShowRes.apporder.order.salt,
    });
  });

  test('iexec app publish [address] with options', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );
    await expect(
      execAsync(
        `${iexecPath} app publish ${address} --price 0.1 RLC --volume 100 --tag tee,scone --force --raw`,
      ),
    ).rejects.toThrow('Tag mismatch the TEE framework specified by app');
    const raw = await execAsync(
      `${iexecPath} app publish ${address} --price 0.1 RLC --volume 100 --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(`${iexecPath} order show --app ${res.orderHash} --raw`),
    );
    expect(orderShowRes.apporder.order).toEqual({
      app: address,
      appprice: 100000000,
      volume: 100,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
      datasetrestrict: NULL_ADDRESS,
      workerpoolrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.apporder.order.sign,
      salt: orderShowRes.apporder.order.salt,
    });
  });

  test('[common] iexec app unpublish (from deployed)', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    await execAsync(`${iexecPath} app deploy --raw`);
    await execAsync(`${iexecPath} app publish --force --raw`);
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} app publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(`${iexecPath} app unpublish --force --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toBe(lastOrderHash);
    await execAsync(`${iexecPath} app unpublish --force --raw`);
    const rawErr = await execAsync(
      `${iexecPath} app unpublish --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec app unpublish [address] --all', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );
    const { orderHash } = JSON.parse(
      await execAsync(`${iexecPath} app publish --force --raw`),
    );
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} app publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} app unpublish ${address} --all --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toEqual(
      expect.arrayContaining([orderHash, lastOrderHash]),
    );
    const rawErr = await execAsync(
      `${iexecPath} app unpublish --all --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec dataset publish (from deployed)', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} dataset deploy --raw`),
    );
    const raw = await execAsync(`${iexecPath} dataset publish --force --raw`);
    const res = JSON.parse(raw);
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

  test('iexec dataset publish [address] with options', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} dataset deploy --raw`),
    );
    await expect(
      execAsync(
        `${iexecPath} dataset publish ${address} --price 0.1 RLC --volume 100 --tag tee,scone --app-restrict ${poorWallet.address} --force --raw`,
      ),
    ).rejects.toThrow(
      `Dataset encryption key is not set for dataset ${address} in the SMS. Dataset decryption will fail.`,
    );
    const raw = await execAsync(
      `${iexecPath} dataset publish ${address} --price 0.1 RLC --volume 100 --app-restrict ${poorWallet.address} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(
        `${iexecPath} order show --dataset ${res.orderHash} --raw`,
      ),
    );
    expect(orderShowRes.datasetorder.order).toEqual({
      dataset: address,
      datasetprice: 100000000,
      volume: 100,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
      apprestrict: poorWallet.address,
      workerpoolrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.datasetorder.order.sign,
      salt: orderShowRes.datasetorder.order.salt,
    });
  });

  test('[common] iexec dataset unpublish (from deployed)', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    await execAsync(`${iexecPath} dataset deploy --raw`);
    await execAsync(`${iexecPath} dataset publish --force --raw`);
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} dataset publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(`${iexecPath} dataset unpublish --force --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toBe(lastOrderHash);
    await execAsync(`${iexecPath} dataset unpublish --force --raw`);
    const rawErr = await execAsync(
      `${iexecPath} dataset unpublish --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec dataset unpublish [address] --all', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} dataset deploy --raw`),
    );
    const { orderHash } = JSON.parse(
      await execAsync(`${iexecPath} dataset publish --force --raw`),
    );
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} dataset publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} dataset unpublish ${address} --all --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toEqual(
      expect.arrayContaining([orderHash, lastOrderHash]),
    );
    const rawErr = await execAsync(
      `${iexecPath} dataset unpublish --all --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec workerpool publish (from deployed)', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} workerpool deploy --raw`),
    );
    const raw = await execAsync(
      `${iexecPath} workerpool publish --force --raw`,
    );
    const res = JSON.parse(raw);
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

  test('iexec workerpool publish [address] with options', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} account deposit 10`);
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} workerpool deploy --raw`),
    );
    const raw = await execAsync(
      `${iexecPath} workerpool publish ${address} --price 0.000000002 RLC --volume 5 --tag tee,scone --trust 20 --category 1 --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(
        `${iexecPath} order show --workerpool ${res.orderHash} --raw`,
      ),
    );
    expect(orderShowRes.workerpoolorder.order).toEqual({
      workerpool: address,
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

  test('[common] iexec workerpool unpublish (from deployed)', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    await execAsync(`${iexecPath} workerpool deploy --raw`);
    await execAsync(`${iexecPath} workerpool publish --force --raw`);
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} workerpool publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} workerpool unpublish --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toBe(lastOrderHash);
    await execAsync(`${iexecPath} workerpool unpublish --force --raw`);
    const rawErr = await execAsync(
      `${iexecPath} workerpool unpublish --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec workerpool unpublish [address] --all', async () => {
    await setRichWallet();
    await setTestChain();
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} workerpool deploy --raw`),
    );
    const { orderHash } = JSON.parse(
      await execAsync(`${iexecPath} workerpool publish --force --raw`),
    );
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} workerpool publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} workerpool unpublish ${address} --all --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toEqual(
      expect.arrayContaining([orderHash, lastOrderHash]),
    );
    const rawErr = await execAsync(
      `${iexecPath} workerpool unpublish --all --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  // REQUESTER
  test('[common] requester secret', async () => {
    await setTestChain();
    const { privateKey, address } = await setWallet();
    // check own
    const checkOwnNotPushed = JSON.parse(
      await execAsync(`${iexecPath} requester check-secret foo --raw`),
    );
    expect(checkOwnNotPushed.ok).toBe(true);
    expect(checkOwnNotPushed.name).toBe('foo');
    expect(checkOwnNotPushed.isSet).toBe(false);

    // push
    const push = JSON.parse(
      await execAsync(
        `${iexecPath} requester push-secret foo --secret-value FOO --raw`,
      ),
    );
    expect(push.ok).toBe(true);
    expect(push.name).toBe('foo');
    expect(push.isPushed).toBe(true);
    // cannot update requester secret
    const pushUpdate = JSON.parse(
      await execAsync(
        `${iexecPath} requester push-secret foo --secret-value FOOD --raw`,
      ).catch((err) => err.message),
    );
    expect(pushUpdate.ok).toBe(false);

    // check own pushed
    const checkOwnPushed = JSON.parse(
      await execAsync(`${iexecPath} requester check-secret foo --raw`),
    );
    expect(checkOwnPushed.ok).toBe(true);
    expect(checkOwnPushed.name).toBe('foo');
    expect(checkOwnPushed.isSet).toBe(true);

    // anyone can check-secret
    await removeWallet();
    const checkPushed = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret foo ${address} --raw`,
      ),
    );
    expect(checkPushed.ok).toBe(true);
    expect(checkPushed.name).toBe('foo');
    expect(checkPushed.isSet).toBe(true);

    const checkNotPushed = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret FOO ${address} --raw`,
      ),
    );
    expect(checkNotPushed.ok).toBe(true);
    expect(checkNotPushed.name).toBe('FOO');
    expect(checkNotPushed.isSet).toBe(false);

    // check secret TEE framework validation
    await expect(
      execAsync(
        `${iexecPath} requester check-secret foo ${address} --tee-framework tee --raw`,
      ),
    ).rejects.toThrow();

    // check secret TEE framework override
    const checkOtherFramework = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret foo ${address} --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
      ),
    );
    expect(checkOtherFramework.ok).toBe(true);
    expect(checkOtherFramework.name).toBe('foo');
    expect(checkOtherFramework.isSet).toBe(false);

    // push secret TEE framework override
    await setWallet(privateKey);
    const pushOtherFramework = JSON.parse(
      await execAsync(
        `${iexecPath} requester push-secret foo --secret-value foo --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
      ),
    );
    expect(pushOtherFramework.ok).toBe(true);
    const checkOtherFrameworkPushed = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret foo ${address} --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
      ),
    );
    expect(checkOtherFrameworkPushed.ok).toBe(true);
    expect(checkOtherFrameworkPushed.name).toBe('foo');
    expect(checkOtherFrameworkPushed.isSet).toBe(true);
  });
});

describe('[Common]', () => {
  afterAll(async () => {
    await execAsync('rm wallet.json').catch(() => {});
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm deployed.json').catch(() => {});
    await execAsync('rm results.zip').catch(() => {});
    await execAsync('rm -rf datasets').catch(() => {});
    await execAsync('rm -rf .secrets').catch(() => {});
  });

  // init

  describe('[wallet]', () => {
    let importedWalletName;
    let localWalletFileName;
    const ensLabel = `ens-${getId()}`;

    beforeAll(async () => {
      await execAsync('rm wallet.json').catch(() => {});
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTestChain();
    });

    afterAll(async () => {
      await execAsync('rm -rf out/keystore').catch(() => {});
      await execAsync('rm wallet.json').catch(() => {});
      if (localWalletFileName)
        await execAsync(`rm ${localWalletFileName}`).catch(() => {});
    });

    test('iexec wallet import', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet import ${PRIVATE_KEY} --password test --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(ADDRESS);
      expect(res.fileName).toBeDefined();
      const importedWalletFileName = res.fileName;
      importedWalletName =
        importedWalletFileName.split('/')[
          importedWalletFileName.split('/').length - 1
        ];
    });

    test('iexec wallet create', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet create --password test --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.fileName).toBeDefined();
    });

    test('iexec wallet show --wallet-address <address>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBeUndefined();
      expect(res.wallet.privateKey).toBeUndefined();
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    });

    test('iexec ens register <name>', async () => {
      const raw = await execAsync(
        `${iexecPath} ens register ${ensLabel} --force --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.name).toBe(`${ensLabel}.users.iexec.eth`);
      expect(res.address).toBe(ADDRESS);
      expect(res.registerTxHash).toMatch(bytes32Regex);
      expect(res.setResolverTxHash).toMatch(bytes32Regex);
      expect(res.setAddrTxHash).toMatch(bytes32Regex);
      expect(res.setNameTxHash).toMatch(bytes32Regex);
    });

    test('iexec wallet show --show-private-key --wallet-address <address>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBe(PUBLIC_KEY);
      expect(res.wallet.privateKey).toBe(PRIVATE_KEY);
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.ens).toBe(`${ensLabel}.users.iexec.eth`);
    });

    test('iexec wallet show --wallet-file <fileName>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-file ${importedWalletName} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBeUndefined();
      expect(res.wallet.privateKey).toBeUndefined();
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    });

    test('iexec wallet show --show-private-key --wallet-address <address> (wrong password)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password fail --wallet-address ${ADDRESS} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('incorrect password');
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    });

    test('iexec wallet show --wallet-address <address> (missing wallet file)', async () => {
      const raw = await execAsync(
        `${iexecPath}  wallet show --wallet-address ${poorWallet.address} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        'Failed to load wallet address from keystore: Wallet file not found',
      );
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    });

    // keystoredir custom
    test('iexec wallet import --keystoredir [path]', async () => {
      await execAsync('rm -rf out/keystore && mkdir out/keystore').catch(
        () => {},
      );
      const raw = await execAsync(
        `${iexecPath}  wallet import ${poorWallet.privateKey} --password customPath --keystoredir ./out/keystore --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(poorWallet.address);
      expect(res.fileName.indexOf('out/keystore/')).not.toBe(-1);
    });

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password customPath --keystoredir ./out/keystore --wallet-address ${poorWallet.address} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(poorWallet.address);
    });

    // keystoredir local
    test('iexec wallet import --keystoredir local', async () => {
      await execAsync('rm -rf out/keystore && mkdir out/keystore').catch(
        () => {},
      );
      const raw = await execAsync(
        `${iexecPath} wallet import ${poorWallet2.privateKey} --password 'my local pass phrase' --keystoredir local --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(poorWallet2.address);
      expect(res.fileName.indexOf('/')).toBe(-1);
      localWalletFileName = res.fileName;
    });

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password 'my local pass phrase' --keystoredir local --wallet-address ${poorWallet2.address} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(poorWallet2.address);
    });

    // unencrypted
    test('iexec wallet import --unencrypted', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} wallet import ${poorWallet.privateKey} --unencrypted --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.privateKey).toBe(poorWallet.privateKey);
      expect(res.wallet.address).toBe(poorWallet.address);
      expect(res.address).toBe(poorWallet.address);
      expect(res.fileName.indexOf('/')).toBe(-1);
      expect(await checkExists('wallet.json')).toBe(true);
    });

    test('iexec wallet show (unencrypted wallet.json)', async () => {
      const raw = await execAsync(`${iexecPath} wallet show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(poorWallet.address);
    });

    test('iexec wallet show [address]', async () => {
      const raw = await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.ether).not.toBe('0');
      expect(res.balance.nRLC).not.toBe('0');
      expect(res.wallet).toBeUndefined();
    });
  });

  describe('[keystore]', () => {
    test('no wallet in keystore, use default address on call', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --keystoredir ./null --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    });

    test('no wallet in keystore, fail on send', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} account withdraw 0 ${ADDRESS} --keystoredir ./null --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        "ENOENT: no such file or directory, scandir 'null'",
      );
      expect(res.error.name).toBe('Error');
    });
  });

  describe('[tx option]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTestChain();
      await setRichWallet();
    });
    test('tx --gas-price 1000000001', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 1000000001 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('1000000001');
    });
    test.skip('tx --gas-price 0', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 0 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');
    });
    test('tx --gas-price 1.1 gwei', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 1.1 gwei --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('1100000000');
    });
    test('tx --gas-price -1 (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price -1 --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('-1 is not a valid amount');
    });
    test('tx --gas-price 0.1 wei (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 0.1 wei --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('0.1 wei is not a valid amount');
    });
    test('tx --gas-price 1 ethereum (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 1 ethereum --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('1 ethereum is not a valid amount');
    });
  });

  describe('[dataset encryption]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTestChain();
      await setRichWallet();
    });

    test('iexec dataset init --tee', async () => {
      const raw = await execAsync(`${iexecPath} dataset init --tee --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(await checkExists('.secrets/datasets/')).toBe(true);
      expect(await checkExists('.secrets/datasets/')).toBe(true);
      expect(await checkExists('datasets/encrypted/')).toBe(true);
    });

    test('iexec dataset init --encrypted  --original-dataset-dir ./out/originals  --encrypted-dataset-dir ./out/encrypted --dataset-keystoredir ./out/dataset-secrets', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset init --encrypted  --original-dataset-dir ./out/originals  --encrypted-dataset-dir ./out/encrypted --dataset-keystoredir ./out/dataset-secrets --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(await checkExists('out/dataset-secrets/')).toBe(true);
      expect(await checkExists('out/originals/')).toBe(true);
      expect(await checkExists('out/encrypted/')).toBe(true);
    });

    test('iexec dataset encrypt', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset encrypt --original-dataset-dir inputs/originalDataset --force --raw`,
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
      expect(res.encryptedFiles[0].checksum).toMatch(bytes32Regex);
      expect(res.encryptedFiles[1].original).toBeDefined();
      expect(res.encryptedFiles[1].encrypted).toBeDefined();
      expect(res.encryptedFiles[1].key).toBeDefined();
      expect(res.encryptedFiles[1].checksum).toMatch(bytes32Regex);
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

    test('iexec dataset push-secret', async () => {
      await setRichWallet();
      await setTestChain();
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
        `Wallet ${ADDRESS} is not allowed to set secret for ${randomAddress}`,
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
      // new dataset to push secret on another TEE framework
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const { address: address2 } = JSON.parse(
        await execAsync(`${iexecPath} dataset deploy --raw`),
      );
      await expect(
        execAsync(
          `${iexecPath} dataset push-secret ${address2} --tee-framework foo --raw`,
        ),
      ).rejects.toThrow();
      const resPush2 = JSON.parse(
        await execAsync(
          `${iexecPath} dataset push-secret ${address2} --tee-framework gramine --raw`,
        ),
      );
      expect(resPush2.ok).toBe(true);
      const resAlreadyExists2 = JSON.parse(
        await execAsync(
          `${iexecPath} dataset push-secret ${address2} --tee-framework gramine --raw`,
        ).catch((e) => e.message),
      );
      expect(resAlreadyExists2.ok).toBe(false);
    });

    test('iexec dataset check-secret', async () => {
      await setRichWallet();
      await setTestChain();
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
      const rawRandomDataset = await execAsync(
        `${iexecPath} dataset check-secret ${getRandomAddress()} --raw`,
      );
      const resRandomDataset = JSON.parse(rawRandomDataset);
      expect(resRandomDataset.ok).toBe(true);
      expect(resRandomDataset.isSecretSet).toBe(false);

      // testing on gramine dataset

      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      await execAsync(`${iexecPath} dataset deploy --raw`);
      const resMyDataset2 = JSON.parse(
        await execAsync(`${iexecPath} dataset check-secret --raw`),
      );
      expect(resMyDataset2.ok).toBe(true);
      expect(resMyDataset2.isSecretSet).toBe(false);

      await execAsync(
        `${iexecPath} dataset push-secret --tee-framework gramine --raw`,
      );
      const rawWrongTee = await execAsync(
        `${iexecPath} dataset check-secret --raw`,
      );
      const resWrongTee = JSON.parse(rawWrongTee);
      expect(resWrongTee.ok).toBe(true);
      expect(resWrongTee.isSecretSet).toBe(false);

      const rawGoodTee = await execAsync(
        `${iexecPath} dataset check-secret --tee-framework gramine --raw`,
      );
      const resGoodTee = JSON.parse(rawGoodTee);
      expect(resGoodTee.ok).toBe(true);
      expect(resGoodTee.isSecretSet).toBe(true);

      const rawRandomDataset2 = await execAsync(
        `${iexecPath} dataset check-secret ${getRandomAddress()} --raw`,
      );
      const resRandomDataset2 = JSON.parse(rawRandomDataset2);
      expect(resRandomDataset2.ok).toBe(true);
      expect(resRandomDataset2.isSecretSet).toBe(false);

      await expect(
        execAsync(
          `${iexecPath} dataset check-secret ${getRandomAddress()} --tee-framework foo --raw`,
        ),
      ).rejects.toThrow();
    });
  });

  describe('[result]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTestChain();
    });
    if (gt('v10.12.0', process.version)) {
      test('iexec result generate-encryption-keypair (node version < v10.12.0)', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-encryption-keypair --force --raw`,
        ).catch((e) => e.message);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(false);
        expect(res.secretPath).toBeUndefined();
        expect(res.privateKeyFile).toBeUndefined();
        expect(res.publicKeyFile).toBeUndefined();
        expect(res.error.name).toBe('Error');
        expect(
          res.error.message.indexOf(
            'Minimum node version to use this command is v10.12.0, found v',
          ),
        ).not.toBe(-1);
      });
      test('iexec result generate-keys (v4 legacy name) (node version < v10.12.0)', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-keys --force --raw`,
        ).catch((e) => e.message);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(false);
        expect(res.secretPath).toBeUndefined();
        expect(res.privateKeyFile).toBeUndefined();
        expect(res.publicKeyFile).toBeUndefined();
        expect(res.error.name).toBe('Error');
        expect(
          res.error.message.indexOf(
            'Minimum node version to use this command is v10.12.0, found v',
          ),
        ).not.toBe(-1);
      });
    } else {
      test('iexec result generate-encryption-keypair', async () => {
        await setRichWallet();
        const raw = await execAsync(
          `${iexecPath} result generate-encryption-keypair --force --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.secretPath).toBeDefined();
        expect(res.secretPath.indexOf('.secrets/beneficiary')).not.toBe(-1);
        expect(res.privateKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
        );
        expect(res.publicKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key.pub',
        );
      });

      test('iexec result generate-keys (v4 legacy name)', async () => {
        await setRichWallet();
        const raw = await execAsync(
          `${iexecPath} result generate-keys --force --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.secretPath).toBeDefined();
        expect(res.secretPath.indexOf('.secrets/beneficiary')).not.toBe(-1);
        expect(res.privateKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
        );
        expect(res.publicKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key.pub',
        );
      });
    }

    test('iexec result push-encryption-key', async () => {
      await setTestChain();
      const { address } = await setWallet();
      await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
      await execAsync(
        `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
      );
      const raw = await execAsync(
        `${iexecPath} result push-encryption-key --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isPushed).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} result push-encryption-key --raw`,
      ).catch((e) => e.message);
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(false);
      const rawAlreadyExistsForTeeFramework = await execAsync(
        `${iexecPath} result push-encryption-key --tee-framework scone --raw`,
      ).catch((e) => e.message);
      const resAlreadyExistsForTeeFramework = JSON.parse(
        rawAlreadyExistsForTeeFramework,
      );
      expect(resAlreadyExistsForTeeFramework.ok).toBe(false);
      const resNotExistsForTeeFramework = JSON.parse(
        await execAsync(
          `${iexecPath} result push-encryption-key --tee-framework gramine --raw`,
        ),
      );
      expect(resNotExistsForTeeFramework.ok).toBe(true);
      expect(resNotExistsForTeeFramework.isPushed).toBe(true);
      expect(resNotExistsForTeeFramework.isUpdated).toBe(false);
    });

    test('iexec result push-encryption-key --force-update', async () => {
      await setTestChain();
      const { address } = await setWallet();
      await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
      await execAsync(
        `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
      );
      const raw = await execAsync(
        `${iexecPath} result push-encryption-key --force-update --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isPushed).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} result push-encryption-key --force-update --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isPushed).toBe(true);
      expect(resAlreadyExists.isUpdated).toBe(true);
    });

    test('iexec result push-secret (v4 legacy name)', async () => {
      await setTestChain();
      const { address } = await setRandomWallet();
      await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
      await execAsync(
        `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
      );
      const raw = await execAsync(`${iexecPath} result push-secret --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
    });

    test('iexec result check-encryption-key', async () => {
      await setTestChain();
      const { privateKey, address } = getRandomWallet();
      const rawUserKey = await execAsync(
        `${iexecPath} result check-encryption-key ${address} --raw`,
      );
      const resUserKey = JSON.parse(rawUserKey);
      expect(resUserKey.ok).toBe(true);
      expect(resUserKey.isEncryptionKeySet).toBe(false);
      await setWallet(privateKey);
      await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
      await execAsync(
        `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
      );
      const rawMyKey = await execAsync(
        `${iexecPath} result check-encryption-key --raw`,
      );
      const resMyKey = JSON.parse(rawMyKey);
      expect(resMyKey.ok).toBe(true);
      expect(resMyKey.isEncryptionKeySet).toBe(false);
      await execAsync(`${iexecPath} result push-encryption-key --raw`);
      const rawExists = await execAsync(
        `${iexecPath} result check-encryption-key --raw`,
      );
      const resExists = JSON.parse(rawExists);
      expect(resExists.ok).toBe(true);
      expect(resExists.isEncryptionKeySet).toBe(true);

      const rawExistsOnTeeFramework = await execAsync(
        `${iexecPath} result check-encryption-key --tee-framework scone --raw`,
      );
      const resExistsOnTeeFramework = JSON.parse(rawExistsOnTeeFramework);
      expect(resExistsOnTeeFramework.ok).toBe(true);
      expect(resExistsOnTeeFramework.isEncryptionKeySet).toBe(true);

      const rawNotExistsOnTeeFramework = await execAsync(
        `${iexecPath} result check-encryption-key --tee-framework gramine --raw`,
      );
      const resNotExistsOnTeeFramework = JSON.parse(rawNotExistsOnTeeFramework);
      expect(resNotExistsOnTeeFramework.ok).toBe(true);
      expect(resNotExistsOnTeeFramework.isEncryptionKeySet).toBe(false);
    });

    test('iexec result check-secret (v4 legacy name)', async () => {
      await setTestChain();
      const { privateKey, publicKey, address } = getRandomWallet();
      const rawUserKey = await execAsync(
        `${iexecPath} result check-secret ${address} --raw`,
      );
      const resUserKey = JSON.parse(rawUserKey);
      expect(resUserKey.ok).toBe(true);
      expect(resUserKey.isEncryptionKeySet).toBe(false);
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
      await execAsync(
        `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
      );
      const rawMyKey = await execAsync(
        `${iexecPath} result check-secret --raw`,
      );
      const resMyKey = JSON.parse(rawMyKey);
      expect(resMyKey.ok).toBe(true);
      expect(resMyKey.isEncryptionKeySet).toBe(false);
      await execAsync(`${iexecPath} result push-encryption-key --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} result check-secret --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isEncryptionKeySet).toBe(true);
    });

    test('iexec result decrypt --force (wrong beneficiary key)', async () => {
      await setRichWallet();
      await execAsync('mkdir .secrets').catch(() => {});
      await execAsync('mkdir .secrets/beneficiary').catch(() => {});
      await execAsync(
        'cp ./inputs/beneficiaryKeys/unexpected_0x7bd4783FDCAD405A28052a0d1f11236A741da593_key ./.secrets/beneficiary/0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
      );
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --force --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.resultsPath).toBeUndefined();
      expect(res.error).toBeDefined();
      expect(
        res.error.message.indexOf('Failed to decrypt results key'),
      ).not.toBe(-1);
      expect(res.error.name).toBe('Error');
    });

    test('iexec result decrypt --beneficiary-keystoredir <path>', async () => {
      await setRichWallet();
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --wallet-address ${ADDRESS} --beneficiary-keystoredir inputs/beneficiaryKeys/ --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).toBeDefined();
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });

    test('iexec result decrypt --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => {
      await setRichWallet();
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ --beneficiary-key-file 0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB_key --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).toBeDefined();
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });
  });

  describe('[storage]', () => {
    beforeAll(async () => {
      await setTestChain();
    });

    test('iexec storage init', async () => {
      await setRandomWallet();
      const raw = await execAsync(`${iexecPath} storage init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage init --raw`,
      ).catch((e) => e.message);
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(false);
      expect(resAlreadyExists.error.message).toBe(
        'default storage is already initialized, use --force-update option to update your storage token',
      );
      const rawInitWithTeeFramework = await execAsync(
        `${iexecPath} storage init --tee-framework gramine --raw`,
      );
      const resInitWithTeeFramework = JSON.parse(rawInitWithTeeFramework);
      expect(resInitWithTeeFramework.ok).toBe(true);
      expect(resInitWithTeeFramework.isInitialized).toBe(true);
      expect(resInitWithTeeFramework.isUpdated).toBe(false);
    });

    test('iexec storage init --force-update', async () => {
      await setRandomWallet();
      const raw = await execAsync(
        `${iexecPath} storage init --force-update --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage init --force-update --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(true);
      expect(resAlreadyExists.isUpdated).toBe(true);
    });

    test('iexec storage init dropbox', async () => {
      await setRandomWallet();
      const raw = await execAsync(
        `${iexecPath} storage init dropbox --token oops --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage init dropbox --token oops --raw`,
      ).catch((e) => e.message);
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(false);
      expect(resAlreadyExists.error.message).toBe(
        'dropbox storage is already initialized, use --force-update option to update your storage token',
      );
    });

    test('iexec storage init unsupported', async () => {
      await setRandomWallet();
      const raw = await execAsync(
        `${iexecPath} storage init unsupported --token oops --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('"unsupported" not supported');
    });

    test('iexec storage check', async () => {
      await setRandomWallet();
      const raw = await execAsync(`${iexecPath} storage check --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(false);
      await execAsync(`${iexecPath} storage init --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage check --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(true);
      const rawWithTeeFramework = await execAsync(
        `${iexecPath} storage check --tee-framework gramine --raw`,
      );
      const resWithTeeFramework = JSON.parse(rawWithTeeFramework);
      expect(resWithTeeFramework.ok).toBe(true);
      expect(resWithTeeFramework.isInitialized).toBe(false);
    });

    test('iexec storage check --user', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      const randomAddress = getRandomAddress();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(
        `${iexecPath} storage check --user ${randomAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(false);
      await execAsync(`${iexecPath} storage init --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage check --user ${randomAddress} --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(false);
    });

    test('iexec storage check dropbox', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(`${iexecPath} storage check dropbox --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(false);
      await execAsync(`${iexecPath} storage init dropbox --token oops --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage check dropbox --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(true);
    });

    test('iexec storage check unsupported', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(
        `${iexecPath} storage check unsupported --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('"unsupported" not supported');
    });
  });

  describe('[registry]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await execAsync('rm deployed.json').catch(() => {});
      await execAsync('rm logo.png').catch(() => {});
    });

    test('iexec registry validate app (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate app --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate dataset (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate dataset --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate workerpool (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate workerpool --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate app', async () => {
      await execAsync('cp ./inputs/validator/iexec-app.json iexec.json');
      await execAsync('cp ./inputs/validator/deployed-app.json deployed.json');
      await execAsync('cp ./inputs/validator/logo.png logo.png');
      const raw = await execAsync(`${iexecPath} registry validate app --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
      expect(res.fail).toBeUndefined();
    });

    test('iexec registry validate app (tee app)', async () => {
      await execAsync('cp ./inputs/validator/iexec-app-tee.json iexec.json');
      await execAsync('cp ./inputs/validator/deployed-app.json deployed.json');
      await execAsync('cp ./inputs/validator/logo.png logo.png');
      const raw = await execAsync(`${iexecPath} registry validate app --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
      expect(res.fail).toBeUndefined();
    });

    test('iexec registry validate dataset', async () => {
      await execAsync('cp ./inputs/validator/iexec-dataset.json iexec.json');
      await execAsync(
        'cp ./inputs/validator/deployed-dataset.json deployed.json',
      );
      await execAsync('cp ./inputs/validator/logo.png logo.png');
      const raw = await execAsync(
        `${iexecPath} registry validate dataset --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
      expect(res.fail).toBeUndefined();
    });

    test('iexec registry validate workerpool', async () => {
      await execAsync('cp ./inputs/validator/iexec-workerpool.json iexec.json');
      await execAsync(
        'cp ./inputs/validator/deployed-workerpool.json deployed.json',
      );
      await execAsync('cp ./inputs/validator/logo.png logo.png');
      const raw = await execAsync(
        `${iexecPath} registry validate workerpool --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
      expect(res.fail).toBeUndefined();
    });
  });

  describe('[chain.json]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await loadJSONFile('chain.json').then((obj) => {
        const chainJson = {
          ...obj,
          chains: {
            ...obj.chains,
            mainnet: {
              ...(obj.chains && obj.chains.mainnet),
              host: mainnetHost,
            },
          },
        };
        saveJSONToFile(chainJson, 'chain.json');
      });
    });

    test('no "native" overwrites in templates', async () => {
      const { chains } = await loadJSONFile('chain.json');
      expect(chains.mainnet.native).toBeUndefined();
      expect(chains.bellecour.native).toBeUndefined();
    });

    test('mainnet is not native', async () => {
      const raw = await execAsync(`${iexecPath} info --chain mainnet --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.useNative).toBe(false);
    });

    test('bellecour is native', async () => {
      const raw = await execAsync(
        `${iexecPath} info ${ADDRESS} --chain bellecour --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.useNative).toBe(true);
    });

    test.skip(
      'providers config',
      async () => {
        const chainJsonDefault = await loadJSONFile('chain.json');
        const alchemyFailQuorumFail = {
          alchemy: 'FAIL',
          quorum: 3,
        };
        const alchemyFailQuorumPass = {
          alchemy: 'FAIL',
          quorum: 2,
        };
        const infuraFailQuorumFail = {
          infura: 'FAIL',
          quorum: 3,
        };
        const infuraFailQuorumPass = {
          infura: 'FAIL',
          quorum: 2,
        };
        const etherscanFailQuorumFail = {
          etherscan: 'FAIL',
          quorum: 3,
        };
        const etherscanFailQuorumPass = {
          etherscan: 'FAIL',
          quorum: 2,
        };

        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: alchemyFailQuorumFail,
          },
          'chain.json',
        );
        await expect(
          execAsync(
            `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
          ),
        ).rejects.toThrow();
        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: alchemyFailQuorumPass,
          },
          'chain.json',
        );
        await expect(
          execAsync(
            `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
          ),
        ).resolves.toBeDefined();

        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: etherscanFailQuorumFail,
          },
          'chain.json',
        );
        await expect(
          execAsync(
            `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
          ),
        ).rejects.toThrow();
        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: etherscanFailQuorumPass,
          },
          'chain.json',
        );
        await expect(
          execAsync(
            `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
          ),
        ).resolves.toBeDefined();

        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: infuraFailQuorumFail,
          },
          'chain.json',
        );
        await expect(
          execAsync(
            `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
          ),
        ).rejects.toThrow();
        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: infuraFailQuorumPass,
          },
          'chain.json',
        );
        await expect(
          execAsync(
            `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
          ),
        ).resolves.toBeDefined();
      },
      DEFAULT_TIMEOUT * 2,
    );
  });
});
