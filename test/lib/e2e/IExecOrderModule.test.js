// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import {
  ONE_ETH,
  ONE_RLC,
  deployAndGetApporder,
  deployAndGetDatasetorder,
  deployAndGetWorkerpoolorder,
  deployRandomApp,
  deployRandomDataset,
  deployRandomWorkerpool,
  expectAsyncCustomError,
  getMatchableRequestorder,
  getTestConfig,
} from '../lib-test-utils.js';
import {
  TEST_CHAINS,
  TEE_FRAMEWORKS,
  getRandomAddress,
  setNRlcBalance,
  NULL_ADDRESS,
  createVoucher,
  createVoucherType,
  addVoucherEligibleAsset,
  SERVICE_UNREACHABLE_URL,
  SERVICE_HTTP_500_URL,
  setBalance,
  SELECTED_CHAIN,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { errors } from '../../../src/lib/index.js';

const { MarketCallError, ConfigurationError } = errors;

const iexecTestChain = TEST_CHAINS[SELECTED_CHAIN];

const signRegex = /^(0x)([0-9a-f]{2}){65}$/;

describe('order', () => {
  describe('createApporder()', () => {
    test('creates a default apporder template', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const app = getRandomAddress();
      const order = await iexec.order.createApporder({
        app,
      });
      expect(order).toEqual({
        app,
        appprice: '0',
        datasetrestrict: '0x0000000000000000000000000000000000000000',
        requesterrestrict: '0x0000000000000000000000000000000000000000',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        volume: '1',
        workerpoolrestrict: '0x0000000000000000000000000000000000000000',
      });
    });

    test('override defaults', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const app = getRandomAddress();
      const datasetrestrict = getRandomAddress();
      const workerpoolrestrict = getRandomAddress();
      const requesterrestrict = getRandomAddress();
      const order = await iexec.order.createApporder({
        app,
        appprice: '1 RLC',
        datasetrestrict,
        workerpoolrestrict,
        requesterrestrict,
        tag: ['tee', 'scone'],
        volume: 100,
      });
      expect(order).toEqual({
        app,
        appprice: '1000000000',
        datasetrestrict,
        requesterrestrict,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        volume: '100',
        workerpoolrestrict,
      });
    });
  });

  describe('createDatasetorder()', () => {
    test('creates a default datasetorder template', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const dataset = getRandomAddress();
      const order = await iexec.order.createDatasetorder({
        dataset,
      });
      expect(order).toEqual({
        apprestrict: '0x0000000000000000000000000000000000000000',
        dataset,
        datasetprice: '0',
        requesterrestrict: '0x0000000000000000000000000000000000000000',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        volume: '1',
        workerpoolrestrict: '0x0000000000000000000000000000000000000000',
      });
    });

    test('override defaults', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const dataset = getRandomAddress();
      const apprestrict = getRandomAddress();
      const workerpoolrestrict = getRandomAddress();
      const requesterrestrict = getRandomAddress();
      const order = await iexec.order.createDatasetorder({
        dataset,
        datasetprice: '1 RLC',
        apprestrict,
        workerpoolrestrict,
        requesterrestrict,
        tag: ['tee', 'scone'],
        volume: 100,
      });
      expect(order).toEqual({
        dataset,
        datasetprice: '1000000000',
        apprestrict,
        requesterrestrict,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        volume: '100',
        workerpoolrestrict,
      });
    });
  });

  describe('createWorkerpoolorder()', () => {
    test('creates a default workerpoolorder template', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpool = getRandomAddress();
      const order = await iexec.order.createWorkerpoolorder({
        workerpool,
        category: 5,
      });
      expect(order).toEqual({
        apprestrict: '0x0000000000000000000000000000000000000000',
        category: '5',
        datasetrestrict: '0x0000000000000000000000000000000000000000',
        requesterrestrict: '0x0000000000000000000000000000000000000000',
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        volume: '1',
        workerpool,
        workerpoolprice: '0',
      });
    });

    test('override defaults', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpool = getRandomAddress();
      const apprestrict = getRandomAddress();
      const datasetrestrict = getRandomAddress();
      const requesterrestrict = getRandomAddress();
      const order = await iexec.order.createWorkerpoolorder({
        workerpool,
        workerpoolprice: '0.1 RLC',
        category: 5,
        apprestrict,
        datasetrestrict,
        requesterrestrict,
        tag: ['tee', 'scone'],
        trust: '10',
        volume: '100',
      });
      expect(order).toEqual({
        apprestrict,
        category: '5',
        datasetrestrict,
        requesterrestrict,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        trust: '10',
        volume: '100',
        workerpool,
        workerpoolprice: '100000000',
      });
    });
  });

  describe('createRequestorder()', () => {
    test('creates a default requestorder template', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const app = getRandomAddress();
      const order = await iexec.order.createRequestorder({
        app,
        category: 5,
      });
      expect(order).toEqual({
        app,
        appmaxprice: '0',
        beneficiary: wallet.address,
        callback: '0x0000000000000000000000000000000000000000',
        category: '5',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: {
          iexec_result_storage_provider: 'ipfs',
          iexec_result_storage_proxy:
            iexecTestChain.resultProxyURL ||
            iexecTestChain.defaults.resultProxyURL,
        },
        requester: wallet.address,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trust: '0',
        volume: '1',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '0',
      });
    });

    test('override defaults', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const app = getRandomAddress();
      const dataset = getRandomAddress();
      const workerpool = getRandomAddress();
      const callback = getRandomAddress();
      const order = await iexec.order.createRequestorder({
        app,
        category: 5,
        dataset,
        workerpool,
        callback,
        appmaxprice: '1 nRLC',
        datasetmaxprice: '100 nRLC',
        workerpoolmaxprice: '0.1 RLC',
        params: {
          iexec_result_storage_provider: 'dropbox',
          iexec_result_encryption: true,
        },
        tag: ['tee', 'scone'],
        trust: '100',
        volume: '5',
      });
      expect(order).toEqual({
        app,
        appmaxprice: '1',
        beneficiary: wallet.address,
        callback,
        category: '5',
        dataset,
        datasetmaxprice: '100',
        params: {
          iexec_result_storage_provider: 'dropbox',
          iexec_result_encryption: true,
        },
        requester: wallet.address,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        trust: '100',
        volume: '5',
        workerpool,
        workerpoolmaxprice: '100000000',
      });
    });

    test('with iexec_secrets', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const app = getRandomAddress();
      const order = await iexec.order.createRequestorder({
        app,
        category: 5,
        params: {
          iexec_secrets: {
            1: 'foo',
          },
        },
        tag: ['tee', 'scone'],
      });
      expect(order).toEqual({
        app,
        appmaxprice: '0',
        beneficiary: wallet.address,
        callback: '0x0000000000000000000000000000000000000000',
        category: '5',
        dataset: '0x0000000000000000000000000000000000000000',
        datasetmaxprice: '0',
        params: {
          iexec_secrets: {
            1: 'foo',
          },
          iexec_result_storage_provider: 'ipfs',
          iexec_result_storage_proxy:
            iexecTestChain.resultProxyURL ||
            iexecTestChain.defaults.resultProxyURL,
        },
        requester: wallet.address,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        trust: '0',
        volume: '1',
        workerpool: '0x0000000000000000000000000000000000000000',
        workerpoolmaxprice: '0',
      });
    });
  });

  describe('signApporder()', () => {
    test('signs the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomApp(iexec);
      const order = await iexec.order.createApporder({
        app: address,
      });

      const res = await iexec.order.signApporder(order);
      expect(res.salt).toBeTxHash();
      expect(res.sign).toMatch(signRegex);
      expect(res).toEqual({
        ...order,
        ...{ sign: res.sign, salt: res.salt },
      });
    });

    test('preflightCheck TEE framework', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomApp(iexec, {
        teeFramework: TEE_FRAMEWORKS.GRAMINE,
      });
      const order = await iexec.order.createApporder({
        app: address,
      });
      await expect(iexec.order.signApporder(order)).rejects.toThrow(
        Error('Tag mismatch the TEE framework specified by app'),
      );
      await expect(
        iexec.order.signApporder({ ...order, tag: ['tee', 'scone'] }),
      ).rejects.toThrow(
        Error('Tag mismatch the TEE framework specified by app'),
      );
      await expect(
        iexec.order.signApporder({ ...order, tag: ['tee', 'gramine'] }),
      ).resolves.toBeDefined();
    });

    test('preflightCheck fails with invalid tag', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const order = await iexec.order.createApporder({
        app: getRandomAddress(),
      });
      await expect(
        iexec.order.signApporder({ ...order, tag: ['tee'] }),
      ).rejects.toThrow(
        Error(
          "'tee' tag must be used with a tee framework ('scone'|'gramine')",
        ),
      );
      await expect(
        iexec.order.signApporder({ ...order, tag: ['scone'] }),
      ).rejects.toThrow(Error("'scone' tag must be used with 'tee' tag"));
      await expect(
        iexec.order.signApporder({ ...order, tag: ['gramine'] }),
      ).rejects.toThrow(Error("'gramine' tag must be used with 'tee' tag"));
      await expect(
        iexec.order.signApporder({
          ...order,
          tag: ['tee', 'scone', 'gramine'],
        }),
      ).rejects.toThrow(
        Error("tee framework tags are exclusive ('scone'|'gramine')"),
      );
    });
  });
});

describe('signDatasetorder()', () => {
  test('signs the order', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const { address } = await deployRandomDataset(iexec);
    const order = await iexec.order.createDatasetorder({
      dataset: address,
    });

    const res = await iexec.order.signDatasetorder(order, {
      preflightCheck: false,
    });
    expect(res.salt).toBeTxHash();
    expect(res.sign).toMatch(signRegex);
    expect(res).toEqual({
      ...order,
      ...{ sign: res.sign, salt: res.salt },
    });
  });

  test('preflightCheck dataset secret', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const { address } = await deployRandomDataset(iexec);
    const order = await iexec.order.createDatasetorder({
      dataset: address,
    });
    await expect(
      iexec.order.signDatasetorder({ ...order, tag: ['tee', 'scone'] }),
    ).rejects.toThrow(
      Error(
        `Dataset encryption key is not set for dataset ${address} in the SMS. Dataset decryption will fail.`,
      ),
    );
    await iexec.dataset.pushDatasetSecret(
      address,
      iexec.dataset.generateEncryptionKey(),
    );
    await expect(
      iexec.order.signDatasetorder({ ...order, tag: ['tee', 'scone'] }),
    ).resolves.toBeDefined();
    await expect(
      iexec.order.signDatasetorder({ ...order, tag: ['tee', 'gramine'] }),
    ).rejects.toThrow(
      Error(
        `Dataset encryption key is not set for dataset ${address} in the SMS. Dataset decryption will fail.`,
      ),
    );
  });

  test('preflightCheck fails with invalid tag', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await iexec.order.createDatasetorder({
      dataset: getRandomAddress(),
    });
    await expect(
      iexec.order.signDatasetorder({ ...order, tag: ['tee'] }),
    ).rejects.toThrow(
      Error("'tee' tag must be used with a tee framework ('scone'|'gramine')"),
    );
    await expect(
      iexec.order.signDatasetorder({ ...order, tag: ['scone'] }),
    ).rejects.toThrow(Error("'scone' tag must be used with 'tee' tag"));
    await expect(
      iexec.order.signDatasetorder({ ...order, tag: ['gramine'] }),
    ).rejects.toThrow(Error("'gramine' tag must be used with 'tee' tag"));
    await expect(
      iexec.order.signDatasetorder({
        ...order,
        tag: ['tee', 'scone', 'gramine'],
      }),
    ).rejects.toThrow(
      Error("tee framework tags are exclusive ('scone'|'gramine')"),
    );
  });
});

describe('signWorkerpoolorder()', () => {
  test('signs the order', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const { address } = await deployRandomWorkerpool(iexec);
    const order = await iexec.order.createWorkerpoolorder({
      workerpool: address,
      category: 5,
    });

    const res = await iexec.order.signWorkerpoolorder(order);
    expect(res.salt).toBeTxHash();
    expect(res.sign).toMatch(signRegex);
    expect(res).toEqual({
      ...order,
      ...{ sign: res.sign, salt: res.salt },
    });
  });
});

describe('signRequestorder()', () => {
  test('signs the order', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await iexec.order.createRequestorder({
      app: getRandomAddress(),
      category: 5,
    });

    const res = await iexec.order.signRequestorder(order, {
      preflightCheck: false,
    });
    expect(res.salt).toBeTxHash();
    expect(res.sign).toMatch(signRegex);
    expect(res).toEqual({
      ...order,
      ...{ params: JSON.stringify(order.params) },
      ...{ sign: res.sign, salt: res.salt },
    });
  });

  test('preflightCheck fails with invalid tag', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await iexec.order.createRequestorder({
      app: getRandomAddress(),
      category: 5,
    });
    await expect(
      iexec.order.signRequestorder({ ...order, tag: ['tee'] }),
    ).rejects.toThrow(
      Error("'tee' tag must be used with a tee framework ('scone'|'gramine')"),
    );
    await expect(
      iexec.order.signRequestorder({ ...order, tag: ['scone'] }),
    ).rejects.toThrow(Error("'scone' tag must be used with 'tee' tag"));
    await expect(
      iexec.order.signRequestorder({ ...order, tag: ['gramine'] }),
    ).rejects.toThrow(Error("'gramine' tag must be used with 'tee' tag"));
    await expect(
      iexec.order.signRequestorder({
        ...order,
        tag: ['tee', 'scone', 'gramine'],
      }),
    ).rejects.toThrow(
      Error("tee framework tags are exclusive ('scone'|'gramine')"),
    );
  });

  test('preflightCheck dropbox storage token exists', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await iexec.order.createRequestorder({
      app: getRandomAddress(),
      category: 5,
      tag: ['tee', 'scone'],
      params: {
        iexec_result_storage_provider: 'dropbox',
      },
    });

    await expect(iexec.order.signRequestorder(order)).rejects.toThrow(
      Error(
        'Requester storage token is not set for selected provider "dropbox". Result archive upload will fail.',
      ),
    );

    await iexec.storage.pushStorageToken('oops', { provider: 'dropbox' });
    const res = await iexec.order.signRequestorder(order);
    expect(res.salt).toBeTxHash();
    expect(res.sign).toMatch(signRegex);
    expect(res).toEqual({
      ...order,
      ...{ params: JSON.stringify(order.params) },
      ...{ sign: res.sign, salt: res.salt },
    });
  });

  test('preflightCheck result encryption exists', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await iexec.order.createRequestorder({
      app: getRandomAddress(),
      category: 5,
      params: { iexec_result_encryption: true },
    });
    await iexec.storage
      .defaultStorageLogin()
      .then(iexec.storage.pushStorageToken);
    await expect(iexec.order.signRequestorder(order)).rejects.toThrow(
      Error(
        'Beneficiary result encryption key is not set in the SMS. Result encryption will fail.',
      ),
    );
    await iexec.result.pushResultEncryptionKey('oops');
    const res = await iexec.order.signRequestorder(order);
    expect(res.salt).toBeTxHash();
    expect(res.sign).toMatch(signRegex);
    expect(res).toEqual({
      ...order,
      ...{ params: JSON.stringify(order.params) },
      ...{ sign: res.sign, salt: res.salt },
    });
  });

  test('preflightCheck checks dataset encryption key exists for tee datasets', async () => {
    const { iexec: iexecDatasetProvider } = getTestConfig(iexecTestChain)();
    const { iexec: iexecDatasetConsumer } = getTestConfig(iexecTestChain)();

    await iexecDatasetConsumer.storage
      .defaultStorageLogin()
      .then(iexecDatasetConsumer.storage.pushStorageToken);
    const { address: dataset } =
      await deployRandomDataset(iexecDatasetProvider);

    // non tee pass
    await expect(
      iexecDatasetConsumer.order
        .createRequestorder({
          app: getRandomAddress(),
          category: 5,
          dataset,
        })
        .then(iexecDatasetConsumer.order.signRequestorder),
    ).resolves.toBeDefined();

    // tee fail without secret
    await expect(
      iexecDatasetConsumer.order
        .createRequestorder({
          app: getRandomAddress(),
          category: 5,
          dataset,
          tag: ['tee', 'scone'],
        })
        .then(iexecDatasetConsumer.order.signRequestorder),
    ).rejects.toThrow(
      Error(
        `Dataset encryption key is not set for dataset ${dataset} in the SMS. Dataset decryption will fail.`,
      ),
    );

    // tee pass with secret
    await iexecDatasetProvider.dataset.pushDatasetSecret(
      dataset,
      iexecDatasetProvider.dataset.generateEncryptionKey(),
    );
    await expect(
      iexecDatasetConsumer.order
        .createRequestorder({
          app: getRandomAddress(),
          category: 5,
          dataset,
          tag: ['tee', 'scone'],
        })
        .then(iexecDatasetConsumer.order.signRequestorder),
    ).resolves.toBeDefined();
  });

  test('preflightCheck requester secrets exist', async () => {
    const { iexec, wallet } = getTestConfig(iexecTestChain)();
    await iexec.storage
      .defaultStorageLogin()
      .then(iexec.storage.pushStorageToken);

    // non requester secret pass
    await expect(
      iexec.order
        .createRequestorder({
          app: getRandomAddress(),
          category: 5,
          tag: ['tee', 'scone'],
        })
        .then(iexec.order.signRequestorder),
    ).resolves.toBeDefined();

    // unset secret fail
    await iexec.secrets.pushRequesterSecret('foo', 'secret');
    await expect(
      iexec.order
        .createRequestorder({
          app: getRandomAddress(),
          category: 5,
          tag: ['tee', 'scone'],
          params: {
            iexec_secrets: {
              1: 'foo',
              2: 'bar',
            },
          },
        })
        .then(iexec.order.signRequestorder),
    ).rejects.toThrow(
      Error(
        `Requester secret "bar" is not set for requester ${wallet.address} in the SMS. Requester secret provisioning will fail.`,
      ),
    );
    // set secrets pass
    await iexec.secrets.pushRequesterSecret('bar', 'secret');
    await expect(
      iexec.order
        .createRequestorder({
          app: getRandomAddress(),
          category: 5,
          tag: ['tee', 'scone'],
          params: {
            iexec_secrets: {
              1: 'foo',
              2: 'bar',
            },
          },
        })
        .then(iexec.order.signRequestorder),
    ).resolves.toBeDefined();
  });
});

describe('hashApporder()', () => {
  test('gives the order hash', async () => {
    const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
    const order = {
      app: '0x76fE91568d50C5fF9411223df5A0c50Ec5fa326A',
      appprice: 0,
      volume: 1000000,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000005',
      datasetrestrict: '0x0000000000000000000000000000000000000000',
      workerpoolrestrict: '0x0000000000000000000000000000000000000000',
      requesterrestrict: '0x0000000000000000000000000000000000000000',
      salt: '0xcadb4f169d98b940ae506dfc8ee7832e1ff36854aab92f89b7408257693207b3',
      sign: '0x5b84b81dd0450897568fa1afdb7969f92259c2f9003a1bed0da96e00c9891957233ad6a0e16101b4ab7b2bf4d4aa117b58bae5fa2bad46522ec62e16ff3c36fe1b',
    };
    const res = await iexec.order.hashApporder(order);
    expect(res).toBe(
      '0x210576e452027bc2430a32f6fae97bec8bd1f7bb7a96f59202d6947ec7d6de8f',
    );
  });
});

describe('hashDatasetorder()', () => {
  test('gives the order hash', async () => {
    const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
    const order = {
      dataset: '0x2Ad5773db1a705DB568fAd403cd247fee4808Fb8',
      datasetprice: 0,
      volume: 1,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
      apprestrict: '0x0000000000000000000000000000000000000000',
      workerpoolrestrict: '0x0000000000000000000000000000000000000000',
      requesterrestrict: '0x0000000000000000000000000000000000000000',
      salt: '0x48380ababf82c79128c1e3ebcba70ce94c6a3ff0ba4125358d1e0c0f871e29e7',
      sign: '0x4ce323a70464eb3b35aa90fcd1582e4733a57b16b0d6fb13ffa3189c2e970ffb399779d0c9d4a2d4b0a65adfc2037a7916a9a004148edcdf3dd1a9e12b3c1b0c1b',
    };
    const res = await iexec.order.hashDatasetorder(order);
    expect(res).toBe(
      '0x5831e4e2911c431236a3df6d82698fcb849da8c781d7c4e9eb75ed551e4d35d4',
    );
  });
});

describe('hashWorkerpoolorder()', () => {
  test('gives the order hash', async () => {
    const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
    const order = {
      workerpool: '0x9DEB16F7861123CE34AE755F48D30697eD066793',
      workerpoolprice: 0,
      volume: 4,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
      category: 3,
      trust: 1,
      apprestrict: '0x0000000000000000000000000000000000000000',
      datasetrestrict: '0x0000000000000000000000000000000000000000',
      requesterrestrict: '0x0000000000000000000000000000000000000000',
      salt: '0x0c8d51b480466c65b459e828ed8549cf4b15ba1abda0ef5d454964c23f3edf62',
      sign: '0xd8941d9974d6b6468a6dac46e88eb80a1575aedd5921d78e002483bf4faa72e319e4c128f9a7f927857c6039988ba456de8ec337078eb538b13488d2374c379e1c',
    };
    const res = await iexec.order.hashWorkerpoolorder(order);
    expect(res).toBe(
      '0x7b23e26344284e809d7809395467d611ba148ef83b2ff3854e03430311f3f8fa',
    );
  });
});

describe('hashRequestorder()', () => {
  test('gives the order hash', async () => {
    const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
    const order = {
      app: '0x33c791fE02eDDBfF3D3d37176737Eb3F488E150F',
      dataset: '0x69d4a400CFf9838985cD2950aafF28289afc6ad3',
      workerpool: '0x0000000000000000000000000000000000000000',
      params:
        '{"iexec_result_storage_provider":"ipfs","iexec_result_storage_proxy":"https://result.v8-bellecour.iex.ec","iexec_result_encryption":false,"iexec_args":"\\"0x4e64fb5fa96eb73ef37dacd416eb2bade0ea8f9e7efebe42abe9a062a9caede836ee4da1ec1a72264e1287e74fba7fdc76edce05729c4b2ecf6fb8970f13f8321b 22\\""}',
      appmaxprice: 0,
      datasetmaxprice: 0,
      workerpoolmaxprice: 0,
      volume: 1,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
      category: 0,
      trust: 0,
      requester: '0x4CF114732732c072D49a783e80C6Fe9fe8BA420a',
      beneficiary: '0x4CF114732732c072D49a783e80C6Fe9fe8BA420a',
      callback: '0x0000000000000000000000000000000000000000',
      salt: '0xef743ff11d68960e724362944b6cd22b59b88402a17f8a1ffabf8fb9be2f4008',
      sign: '0xdcd90a96f4c5cd05a0f907220e173a038e01e2a647bd9c8e04714be5dd4f986b0478cb69cf46b3cb3eb05ee74d2b91868bee4d96a89bc79ac8d8cccc96810bf21c',
    };
    const res = await iexec.order.hashRequestorder(order);
    expect(res).toBeTxHash();
    expect(res).toBe(
      '0x8096dd3852b29d6e86b03505ded47fbc96b0bacc9be097f11de3a747ee0e4283',
    );
  });
});

describe('cancelApporder()', () => {
  test('revokes the order', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await deployAndGetApporder(iexec);
    const res = await iexec.order.cancelApporder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toBeTxHash();
    await expect(iexec.order.cancelApporder(order)).rejects.toThrow(
      Error('apporder already canceled'),
    );
  });
});

describe('cancelDatasetorder()', () => {
  test('revokes the order', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await deployAndGetDatasetorder(iexec);
    const res = await iexec.order.cancelDatasetorder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toBeTxHash();
    await expect(iexec.order.cancelDatasetorder(order)).rejects.toThrow(
      Error('datasetorder already canceled'),
    );
  });
});

describe('cancelWorkerpoolorder()', () => {
  test('revokes the order', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await deployAndGetWorkerpoolorder(iexec);
    const res = await iexec.order.cancelWorkerpoolorder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toBeTxHash();
    await expect(iexec.order.cancelWorkerpoolorder(order)).rejects.toThrow(
      Error('workerpoolorder already canceled'),
    );
  });
});

describe('cancelRequestorder()', () => {
  test('revokes the order', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const order = await iexec.order
      .createRequestorder({
        app: getRandomAddress(),
        appmaxprice: 0,
        workerpoolmaxprice: 0,
        requester: await iexec.wallet.getAddress(),
        volume: 1,
        category: 1,
      })
      .then((o) => iexec.order.signRequestorder(o, { preflightCheck: false }));
    const res = await iexec.order.cancelRequestorder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toBeTxHash();
    await expect(iexec.order.cancelRequestorder(order)).rejects.toThrow(
      Error('requestorder already canceled'),
    );
  });
});

describe('publish...order()', () => {
  test("throw a MarketCallError when the Market API can't be reached", async () => {
    const { iexec } = getTestConfig(iexecTestChain)({
      options: {
        iexecGatewayURL: SERVICE_UNREACHABLE_URL,
      },
    });
    const requestorder = await iexec.order
      .createRequestorder({ app: getRandomAddress(), category: 0 })
      .then(iexec.order.signRequestorder);
    await expectAsyncCustomError(
      iexec.order.publishRequestorder(requestorder),
      {
        constructor: MarketCallError,
        message: `Market API error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
      },
    );
  });

  test('throw a MarketCallError when the Market API encounters an error', async () => {
    const { iexec } = getTestConfig(iexecTestChain)({
      options: {
        iexecGatewayURL: SERVICE_HTTP_500_URL,
      },
    });
    const requestorder = await iexec.order
      .createRequestorder({ app: getRandomAddress(), category: 0 })
      .then(iexec.order.signRequestorder);
    await expectAsyncCustomError(
      iexec.order.publishRequestorder(requestorder),
      {
        constructor: MarketCallError,
        message: `Market API error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
      },
    );
  });

  describe('publishApporder()', () => {
    test('publishes the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const orderHash = await iexec.order.publishApporder(apporder);
      expect(orderHash).toBeTxHash();
    });
  });

  describe('publishDatasetorder()', () => {
    test('publishes the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const orderHash = await iexec.order.publishDatasetorder(datasetorder);
      expect(orderHash).toBeTxHash();
    });

    test('preflightChecks dataset secret exists for tee tag', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const datasetorder = await deployAndGetDatasetorder(iexec, {
        tag: ['tee', 'scone'],
      });
      const datasetAddress = datasetorder.dataset;
      await expect(
        iexec.order.publishDatasetorder(datasetorder),
      ).rejects.toThrow(
        Error(
          `Dataset encryption key is not set for dataset ${datasetAddress} in the SMS. Dataset decryption will fail.`,
        ),
      );

      const orderHashSkipPreflight = await iexec.order.publishDatasetorder(
        await iexec.order.signDatasetorder(datasetorder, {
          preflightCheck: false,
        }),
        { preflightCheck: false },
      );
      expect(orderHashSkipPreflight).toBeTxHash();

      await iexec.dataset.pushDatasetSecret(datasetAddress, 'foo');

      const orderHashPreflight = await iexec.order.publishDatasetorder(
        await iexec.order.signDatasetorder(datasetorder, {
          preflightCheck: false,
        }),
      );
      expect(orderHashPreflight).toBeTxHash();
    });
  });

  describe('publishWorkerpoolorder()', () => {
    test('publishes the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const orderHash =
        await iexec.order.publishWorkerpoolorder(workerpoolorder);
      expect(orderHash).toBeTxHash();
    });
  });

  describe('publishRequestorder()', () => {
    test('publishes the order (skip preflightCheck)', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      await iexec.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          requester: await iexec.wallet.getAddress(),
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: NULL_ADDRESS,
          datasetmaxprice: 0,
          workerpool: NULL_ADDRESS,
          workerpoolmaxprice: 0,
          category: 1,
          trust: 0,
          volume: 1,
        })
        .then((o) =>
          iexec.order.signRequestorder(o, { preflightCheck: false }),
        );
      const orderHash = await iexec.order.publishRequestorder(requestorder, {
        preflightCheck: false,
      });
      expect(orderHash).toBeTxHash();
    });

    test('preflightCheck result encryption key', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { iexec: iexecAppDev } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexecAppDev, {
        teeFramework: TEE_FRAMEWORKS.SCONE,
        tag: ['tee', 'scone'],
      });
      await iexecAppDev.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          app: apporder.app,
          appmaxprice: apporder.appprice,
          category: 1,
          params: { iexec_result_encryption: true },
        })
        .then((o) =>
          iexec.order.signRequestorder(o, { preflightCheck: false }),
        );
      await expect(
        iexec.order.publishRequestorder(requestorder),
      ).rejects.toThrow(
        Error(
          'Beneficiary result encryption key is not set in the SMS. Result encryption will fail.',
        ),
      );
      await iexec.result.pushResultEncryptionKey(
        `-----BEGIN PUBLIC KEY-----
  MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA29Y2NYC08oFJ8GxPR3dK
  kI+Au+6keWHZ8CXs9f54WrXlNusNqqhOH7h4fQKaNHhptqSutmo6xYwmen4eUqe6
  72NnmTeBpexvlHj16uDqgVoySVMaYMSwexRr+n7BQ2NWYntYc3r0ZjBACK7NMyrb
  fp4W5UNGKDk3pq0ukPQQ8IGAUhZPPsncVpOSq65Ks1aI1vBSM6UzHCks582H1b0N
  qO40vWd0Zd/8Lb/iHW6NDJXGgM0K/gRYz5hG3w0q9BvwN4mhHX1+2PWtuImv7np7
  CWU5edVJYQ1E5mXARLVUzYLmDXM1nvckkLVAdGOvsXv8P60z+Q2zpIvK14+xm5Cf
  EpAA5gOT+IQwcSOxuBstKpS8TXBXGvG8wsgJkK2docS9C8CIQU1OkI0EW4N7ViSA
  hH2kM6sRIN3g8nmfiiSTu1YAynaMcXe0H/0zl8fXE1c3wi2X2S/SFwxMSwPG5yTB
  2qLo9x75C8WUZC+uUP6VZcQE9B93F7DLzhd6O1VisGHefPQ/dF6rRreRwGI+JzL9
  ROsm42L6N5HwSodD4x7Hil6nw2FdgK5/RkTRa47gtTTcSKFUAFB/YivDDBhyCqSx
  oSEDTczO+ZMeoYGNQwiFpetTB7E4zNfxofllEvMax3/VOFurRbwDlMavD0LPeRM6
  MUkxe2lT4YFowUo6JCUFlPcCAwEAAQ==
  -----END PUBLIC KEY-----`,
      );
      const orderHash = await iexec.order.publishRequestorder(requestorder);
      expect(orderHash).toBeTxHash();
    });

    test('preflightCheck dropbox token', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { iexec: iexecAppDev } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexecAppDev, {
        teeFramework: TEE_FRAMEWORKS.SCONE,
        tag: ['tee', 'scone'],
      });
      await iexecAppDev.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          app: apporder.app,
          appmaxprice: apporder.appprice,
          category: 1,
          params: { iexec_result_storage_provider: 'dropbox' },
          tag: ['tee', 'scone'],
        })
        .then((o) =>
          iexec.order.signRequestorder(o, { preflightCheck: false }),
        );
      await expect(
        iexec.order.publishRequestorder(requestorder),
      ).rejects.toThrow(
        Error(
          'Requester storage token is not set for selected provider "dropbox". Result archive upload will fail.',
        ),
      );
      await iexec.storage.pushStorageToken(`foo`, { provider: 'dropbox' });
      const orderHash = await iexec.order.publishRequestorder(requestorder);
      expect(orderHash).toBeTxHash();
    });
  });
});

describe('unpublish...order()', () => {
  test("throw a MarketCallError when the Market API can't be reached", async () => {
    const { iexec } = getTestConfig(iexecTestChain)({
      options: {
        iexecGatewayURL: SERVICE_UNREACHABLE_URL,
      },
    });
    await expectAsyncCustomError(iexec.order.unpublishAllRequestorders(), {
      constructor: MarketCallError,
      message: `Market API error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
    });
  });

  test('throw a MarketCallError when the Market API encounters an error', async () => {
    const { iexec } = getTestConfig(iexecTestChain)({
      options: {
        iexecGatewayURL: SERVICE_HTTP_500_URL,
      },
    });
    await expectAsyncCustomError(iexec.order.unpublishAllRequestorders(), {
      constructor: MarketCallError,
      message: `Market API error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
    });
  });

  describe('unpublishApporder()', () => {
    test('unpublish the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const orderHash = await iexec.order.publishApporder(apporder);
      const unpublishRes = await iexec.order.unpublishApporder(orderHash);
      expect(unpublishRes).toBe(orderHash);
      await expect(iexec.order.unpublishApporder(orderHash)).rejects.toThrow(
        Error(
          `API error: apporder with orderHash ${orderHash} is not published`,
        ),
      );
    });
  });

  describe('unpublishDatasetorder()', () => {
    test('unpublish the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const orderHash = await iexec.order.publishDatasetorder(datasetorder, {
        preflightCheck: false,
      });
      const unpublishRes = await iexec.order.unpublishDatasetorder(orderHash);
      expect(unpublishRes).toBe(orderHash);
      await expect(
        iexec.order.unpublishDatasetorder(orderHash),
      ).rejects.toThrow(
        Error(
          `API error: datasetorder with orderHash ${orderHash} is not published`,
        ),
      );
    });
  });

  describe('unpublishWorkerpoolorder()', () => {
    test('unpublish the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const orderHash =
        await iexec.order.publishWorkerpoolorder(workerpoolorder);
      const unpublishRes =
        await iexec.order.unpublishWorkerpoolorder(orderHash);
      expect(unpublishRes).toBe(orderHash);
      await expect(
        iexec.order.unpublishWorkerpoolorder(orderHash),
      ).rejects.toThrow(
        Error(
          `API error: workerpoolorder with orderHash ${orderHash} is not published`,
        ),
      );
    });
  });

  describe('unpublishRequestorder()', () => {
    test('unpublish the order', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      await iexec.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          requester: await iexec.wallet.getAddress(),
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: NULL_ADDRESS,
          datasetmaxprice: 0,
          workerpool: NULL_ADDRESS,
          workerpoolmaxprice: 0,
          category: 1,
          trust: 0,
          volume: 1,
        })
        .then((o) =>
          iexec.order.signRequestorder(o, { preflightCheck: false }),
        );
      const orderHash = await iexec.order.publishRequestorder(requestorder, {
        preflightCheck: false,
      });
      const unpublishRes = await iexec.order.unpublishRequestorder(orderHash);
      expect(unpublishRes).toBe(orderHash);
      await expect(
        iexec.order.unpublishRequestorder(orderHash),
      ).rejects.toThrow(
        Error(
          `API error: requestorder with orderHash ${orderHash} is not published`,
        ),
      );
    });
  });

  describe('unpublishLastApporder()', () => {
    test('unpublish the order', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const orderHash = await iexec.order.publishApporder(apporder);
      const lastApporder = await iexec.order.signApporder(apporder);
      const lastOrderHash = await iexec.order.publishApporder(lastApporder);
      const unpublishLastRes = await iexec.order.unpublishLastApporder(
        apporder.app,
      );
      expect(unpublishLastRes).toBe(lastOrderHash);
      const unpublishLast2Res = await iexec.order.unpublishLastApporder(
        apporder.app,
      );
      expect(unpublishLast2Res).toBe(orderHash);
      await expect(
        iexec.order.unpublishLastApporder(apporder.app),
      ).rejects.toThrow(
        Error(
          `API error: no open apporder published by signer ${wallet.address} for app ${apporder.app}`,
        ),
      );
    });
  });

  describe('unpublishLastDatasetorder()', () => {
    test('unpublish the order', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const orderHash = await iexec.order.publishDatasetorder(datasetorder, {
        preflightCheck: false,
      });
      const lastDatasetorder = await iexec.order.signDatasetorder(
        datasetorder,
        {
          preflightCheck: false,
        },
      );
      const lastOrderHash = await iexec.order.publishDatasetorder(
        lastDatasetorder,
        { preflightCheck: false },
      );
      const unpublishLastRes = await iexec.order.unpublishLastDatasetorder(
        datasetorder.dataset,
      );
      expect(unpublishLastRes).toBe(lastOrderHash);
      const unpublishLast2Res = await iexec.order.unpublishLastDatasetorder(
        datasetorder.dataset,
      );
      expect(unpublishLast2Res).toBe(orderHash);
      await expect(
        iexec.order.unpublishLastDatasetorder(datasetorder.dataset),
      ).rejects.toThrow(
        Error(
          `API error: no open datasetorder published by signer ${wallet.address} for dataset ${datasetorder.dataset}`,
        ),
      );
    });
  });

  describe('unpublishLastWorkerpoolorder()', () => {
    test('unpublish the order', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const orderHash =
        await iexec.order.publishWorkerpoolorder(workerpoolorder);
      const lastWorkerpoolorder =
        await iexec.order.signWorkerpoolorder(workerpoolorder);
      const lastOrderHash =
        await iexec.order.publishWorkerpoolorder(lastWorkerpoolorder);
      const unpublishLastRes = await iexec.order.unpublishLastWorkerpoolorder(
        workerpoolorder.workerpool,
      );
      expect(unpublishLastRes).toBe(lastOrderHash);
      const unpublishLast2Res = await iexec.order.unpublishLastWorkerpoolorder(
        workerpoolorder.workerpool,
      );
      expect(unpublishLast2Res).toBe(orderHash);
      await expect(
        iexec.order.unpublishLastWorkerpoolorder(workerpoolorder.workerpool),
      ).rejects.toThrow(
        Error(
          `API error: no open workerpoolorder published by signer ${wallet.address} for workerpool ${workerpoolorder.workerpool}`,
        ),
      );
    });
  });

  describe('unpublishLastRequestorder()', () => {
    test('unpublish the order', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      await iexec.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          requester: await iexec.wallet.getAddress(),
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: NULL_ADDRESS,
          datasetmaxprice: 0,
          workerpool: NULL_ADDRESS,
          workerpoolmaxprice: 0,
          category: 1,
          trust: 0,
          volume: 1,
        })
        .then((o) =>
          iexec.order.signRequestorder(o, { preflightCheck: false }),
        );
      const orderHash = await iexec.order.publishRequestorder(requestorder, {
        preflightCheck: false,
      });
      const lastRequestorder = await iexec.order.signRequestorder(
        requestorder,
        {
          preflightCheck: false,
        },
      );
      const lastOrderHash = await iexec.order.publishRequestorder(
        lastRequestorder,
        { preflightCheck: false },
      );
      const unpublishLastRes = await iexec.order.unpublishLastRequestorder(
        requestorder.requester,
      );
      expect(unpublishLastRes).toBe(lastOrderHash);
      const unpublishLast2Res = await iexec.order.unpublishLastRequestorder(
        requestorder.requester,
      );
      expect(unpublishLast2Res).toBe(orderHash);
      await expect(
        iexec.order.unpublishLastRequestorder(requestorder.requester),
      ).rejects.toThrow(
        Error(
          `API error: no open requestorder published by signer ${wallet.address} for requester ${requestorder.requester}`,
        ),
      );
    });
  });

  describe('unpublishAllApporders()', () => {
    test('unpublish all orders', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const orderHash = await iexec.order.publishApporder(apporder);
      const lastApporder = await iexec.order.signApporder(apporder);
      const lastOrderHash = await iexec.order.publishApporder(lastApporder);
      const unpublishAllRes = await iexec.order.unpublishAllApporders(
        apporder.app,
      );
      expect(unpublishAllRes).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      expect(unpublishAllRes.length).toBe(2);
      await expect(
        iexec.order.unpublishAllApporders(apporder.app),
      ).rejects.toThrow(
        Error(
          `API error: no open apporder published by signer ${wallet.address} for app ${apporder.app}`,
        ),
      );
    });
  });

  describe('unpublishAllDatasetorders()', () => {
    test('unpublish all orders', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const orderHash = await iexec.order.publishDatasetorder(datasetorder, {
        preflightCheck: false,
      });
      const lastDatasetorder = await iexec.order.signDatasetorder(
        datasetorder,
        {
          preflightCheck: false,
        },
      );
      const lastOrderHash = await iexec.order.publishDatasetorder(
        lastDatasetorder,
        { preflightCheck: false },
      );
      const unpublishAllRes = await iexec.order.unpublishAllDatasetorders(
        datasetorder.dataset,
      );
      expect(unpublishAllRes).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      expect(unpublishAllRes.length).toBe(2);
      await expect(
        iexec.order.unpublishAllDatasetorders(datasetorder.dataset),
      ).rejects.toThrow(
        Error(
          `API error: no open datasetorder published by signer ${wallet.address} for dataset ${datasetorder.dataset}`,
        ),
      );
    });
  });

  describe('unpublishAllWorkerpoolorders()', () => {
    test('unpublish all orders', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const orderHash =
        await iexec.order.publishWorkerpoolorder(workerpoolorder);
      const lastWorkerpoolorder =
        await iexec.order.signWorkerpoolorder(workerpoolorder);
      const lastOrderHash =
        await iexec.order.publishWorkerpoolorder(lastWorkerpoolorder);
      const unpublishAllRes = await iexec.order.unpublishAllWorkerpoolorders(
        workerpoolorder.workerpool,
      );
      expect(unpublishAllRes).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      expect(unpublishAllRes.length).toBe(2);
      await expect(
        iexec.order.unpublishAllWorkerpoolorders(workerpoolorder.workerpool),
      ).rejects.toThrow(
        Error(
          `API error: no open workerpoolorder published by signer ${wallet.address} for workerpool ${workerpoolorder.workerpool}`,
        ),
      );
    });
  });

  describe('unpublishAllRequestorders()', () => {
    test('unpublish all orders', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      await iexec.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          requester: await iexec.wallet.getAddress(),
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: NULL_ADDRESS,
          datasetmaxprice: 0,
          workerpool: NULL_ADDRESS,
          workerpoolmaxprice: 0,
          category: 1,
          trust: 0,
          volume: 1,
        })
        .then((o) =>
          iexec.order.signRequestorder(o, { preflightCheck: false }),
        );
      const orderHash = await iexec.order.publishRequestorder(requestorder, {
        preflightCheck: false,
      });
      const lastRequestorder = await iexec.order.signRequestorder(
        requestorder,
        {
          preflightCheck: false,
        },
      );
      const lastOrderHash = await iexec.order.publishRequestorder(
        lastRequestorder,
        { preflightCheck: false },
      );
      const unpublishAllRes = await iexec.order.unpublishAllRequestorders(
        requestorder.requester,
      );
      expect(unpublishAllRes).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      expect(unpublishAllRes.length).toBe(2);
      await expect(
        iexec.order.unpublishAllRequestorders(requestorder.requester),
      ).rejects.toThrow(
        Error(
          `API error: no open requestorder published by signer ${wallet.address} for requester ${requestorder.requester}`,
        ),
      );
    });
  });
});

describe('estimateMatchOrders()', () => {
  test('estimates the total cost', async () => {
    const noVoucherTestChain = TEST_CHAINS['custom-token-chain'];
    const options = {
      resultProxyURL: 'https://result-proxy.iex.ec',
      smsURL: 'https://sms.iex.ec',
    };
    const { iexec: iexecRequester } = getTestConfig(noVoucherTestChain)({
      options,
    });
    const { iexec: iexecResourcesProvider, wallet: providerWallet } =
      getTestConfig(noVoucherTestChain)({
        options,
      });

    await setBalance(noVoucherTestChain)(providerWallet.address, ONE_ETH);

    const apporder = await deployAndGetApporder(iexecResourcesProvider, {
      volume: 10,
      appprice: 5,
    });
    const datasetorder = await deployAndGetDatasetorder(
      iexecResourcesProvider,
      {
        volume: 7,
        datasetprice: 1,
      },
    );
    const workerpoolorder = await deployAndGetWorkerpoolorder(
      iexecResourcesProvider,
      { volume: 5, workerpoolprice: 1 },
    );
    const requestorder = await getMatchableRequestorder(iexecRequester, {
      apporder,
      datasetorder,
      workerpoolorder,
    });

    const res = await iexecRequester.order.estimateMatchOrders({
      apporder,
      datasetorder,
      workerpoolorder,
      requestorder,
    });
    expect(res.sponsored).toBeInstanceOf(BN);
    expect(res.sponsored).toEqual(new BN(0));
    expect(res.total).toBeInstanceOf(BN);
    expect(res.total).toEqual(new BN(35));
  });

  describe('with useVoucher', () => {
    let iexecProvider;
    let apporderTemplate;
    let datasetorderTemplate;
    let workerpoolorderTemplate;
    let voucherTypeId;
    let expectedTotal;

    beforeAll(async () => {
      const providerConfig = getTestConfig(iexecTestChain)();
      iexecProvider = providerConfig.iexec;
      apporderTemplate = await deployAndGetApporder(iexecProvider, {
        volume: 10,
        appprice: 5,
      });
      datasetorderTemplate = await deployAndGetDatasetorder(iexecProvider, {
        volume: 7,
        datasetprice: 1,
      });
      workerpoolorderTemplate = await deployAndGetWorkerpoolorder(
        iexecProvider,
        { volume: 5, workerpoolprice: 1 },
      );

      const matchableVolume = new BN(5); // min volume among orders
      expectedTotal = new BN(5 + 1 + 1).mul(matchableVolume); // volume * orders unit prices

      voucherTypeId = await createVoucherType(iexecTestChain)({
        description: 'test voucher type',
        duration: 60 * 60,
      });

      await addVoucherEligibleAsset(iexecTestChain)(
        apporderTemplate.app,
        voucherTypeId,
      );
      await addVoucherEligibleAsset(iexecTestChain)(
        datasetorderTemplate.dataset,
        voucherTypeId,
      );
      await addVoucherEligibleAsset(iexecTestChain)(
        workerpoolorderTemplate.workerpool,
        voucherTypeId,
      );
    });

    test('requires voucherHubAddress to be configured when useVoucher is true', async () => {
      const noVoucherTestChain = TEST_CHAINS['custom-token-chain'];
      const options = {
        resultProxyURL: 'https://result-proxy.iex.ec',
        smsURL: 'https://sms.iex.ec',
      };
      const { iexec: iexecRequester } = getTestConfig(noVoucherTestChain)({
        options,
      });
      const { iexec: iexecResourcesProvider, wallet: providerWallet } =
        getTestConfig(noVoucherTestChain)({
          options,
        });

      await setBalance(noVoucherTestChain)(providerWallet.address, ONE_ETH);

      const apporder = await deployAndGetApporder(iexecResourcesProvider, {
        volume: 10,
        appprice: 5,
      });
      const datasetorder = await deployAndGetDatasetorder(
        iexecResourcesProvider,
        {
          volume: 7,
          datasetprice: 1,
        },
      );
      const workerpoolorder = await deployAndGetWorkerpoolorder(
        iexecResourcesProvider,
        { volume: 5, workerpoolprice: 1 },
      );
      const requestorder = await getMatchableRequestorder(iexecRequester, {
        apporder,
        datasetorder,
        workerpoolorder,
      });

      await expect(
        iexecRequester.order.estimateMatchOrders(
          {
            apporder,
            datasetorder,
            workerpoolorder,
            requestorder,
          },
          { useVoucher: true },
        ),
      ).rejects.toThrow(
        new ConfigurationError(
          `voucherHubAddress option not set and no default value for your chain ${noVoucherTestChain.chainId}`,
        ),
      );
      // estimate match orders without useVoucher should pass
      const res = await iexecRequester.order.estimateMatchOrders(
        {
          apporder,
          datasetorder,
          workerpoolorder,
          requestorder,
        },
        { useVoucher: false },
      );
      expect(res.sponsored).toBeInstanceOf(BN);
      expect(res.sponsored).toEqual(new BN(0));
      expect(res.total).toBeInstanceOf(BN);
      expect(res.total).toEqual(new BN(35));
    });

    test('should have sponsored amount as 0 when useVoucher is false', async () => {
      const { iexec: iexecRequester, wallet: requesterWallet } =
        getTestConfig(iexecTestChain)();

      const requestorderTemplate = await getMatchableRequestorder(
        iexecRequester,
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
        },
      );

      await createVoucher(iexecTestChain)({
        owner: await requesterWallet.getAddress(),
        voucherType: voucherTypeId,
        value: 100,
      });

      const res = await iexecRequester.order.estimateMatchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      });

      expect(res.sponsored).toBeInstanceOf(BN);
      expect(res.sponsored).toEqual(new BN(0));
      expect(res.total).toBeInstanceOf(BN);
      expect(res.total).toEqual(expectedTotal);
    });

    test('should return total cost and sponsored amount when using voucher', async () => {
      const { iexec: iexecRequester, wallet: requesterWallet } =
        getTestConfig(iexecTestChain)();

      const requestorderTemplate = await getMatchableRequestorder(
        iexecRequester,
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
        },
      );

      await createVoucher(iexecTestChain)({
        owner: await requesterWallet.getAddress(),
        voucherType: voucherTypeId,
        value: 1000,
      });

      const res = await iexecRequester.order.estimateMatchOrders(
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
          requestorder: requestorderTemplate,
        },
        { useVoucher: true },
      );
      expect(res.sponsored).toBeInstanceOf(BN);
      expect(res.sponsored).toEqual(expectedTotal);
      expect(res.total).toBeInstanceOf(BN);
      expect(res.total).toEqual(expectedTotal);
    });

    test('should return sponsored amount equal to voucher balance when voucher value is less than total cost', async () => {
      const { iexec: iexecRequester, wallet: requesterWallet } =
        getTestConfig(iexecTestChain)();

      const requestorderTemplate = await getMatchableRequestorder(
        iexecRequester,
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
        },
      );

      await createVoucher(iexecTestChain)({
        owner: await requesterWallet.getAddress(),
        voucherType: voucherTypeId,
        value: 10,
      });
      const voucherInfo = await iexecRequester.voucher.showUserVoucher(
        requesterWallet.address,
      );

      const res = await iexecRequester.order.estimateMatchOrders(
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
          requestorder: requestorderTemplate,
        },
        { useVoucher: true },
      );
      expect(res.sponsored).toBeInstanceOf(BN);
      expect(res.sponsored).toEqual(new BN(voucherInfo.balance));
      expect(res.total).toBeInstanceOf(BN);
      expect(res.total).toEqual(expectedTotal);
    });

    test('should have sponsored amount as 0 when voucher expired', async () => {
      const { iexec: iexecRequester, wallet: requesterWallet } =
        getTestConfig(iexecTestChain)();

      const requestorderTemplate = await getMatchableRequestorder(
        iexecRequester,
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
        },
      );
      const voucherType = await createVoucherType(iexecTestChain)({
        description: 'test voucher type',
        duration: 1,
      });
      await createVoucher(iexecTestChain)({
        owner: await requesterWallet.getAddress(),
        voucherType,
        value: 100,
      });

      const res = await iexecRequester.order.estimateMatchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      });
      expect(res.sponsored).toBeInstanceOf(BN);
      expect(res.sponsored).toEqual(new BN(0));
      expect(res.total).toBeInstanceOf(BN);
      expect(res.total).toEqual(expectedTotal);
    });
  });

  describe('matchOrders()', () => {
    test('order.matchOrders() all tests (split TODO)', async () => {
      const { iexec: iexecBroker } = getTestConfig(iexecTestChain)();
      const { iexec: iexecPoolManager, wallet: poolManagerWallet } =
        getTestConfig(iexecTestChain)();
      const { iexec: iexecRequester, wallet: requesterWallet } =
        getTestConfig(iexecTestChain)();
      const { iexec: iexecAppProvider } = getTestConfig(iexecTestChain)();
      const { iexec: iexecDatasetProvider } = getTestConfig(iexecTestChain)();

      await setNRlcBalance(iexecTestChain)(
        requesterWallet.address,
        10n * ONE_RLC,
      );
      await setNRlcBalance(iexecTestChain)(
        poolManagerWallet.address,
        10n * ONE_RLC,
      );

      const apporderTemplate = await deployAndGetApporder(iexecAppProvider);
      const datasetorderTemplate =
        await deployAndGetDatasetorder(iexecDatasetProvider);
      const workerpoolorderTemplate =
        await deployAndGetWorkerpoolorder(iexecPoolManager);
      const requestorderTemplate = await getMatchableRequestorder(
        iexecRequester,
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
        },
      );

      // resource not deployed
      const fakeAddress = getRandomAddress();
      const apporderNotDeployed = { ...apporderTemplate, app: fakeAddress };
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderNotDeployed,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error(`No app deployed at address ${fakeAddress}`));
      const datasetorderNotDeployed = {
        ...datasetorderTemplate,
        dataset: fakeAddress,
      };
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderNotDeployed,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error(`No dataset deployed at address ${fakeAddress}`));
      const workerpoolorderNotDeployed = {
        ...workerpoolorderTemplate,
        workerpool: fakeAddress,
      };
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderNotDeployed,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(`No workerpool deployed at address ${fakeAddress}`),
      );
      // invalid sign
      const apporderInvalidSign = {
        ...apporderTemplate,
        sign: '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
      };
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderInvalidSign,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('apporder invalid sign'));
      const datasetorderInvalidSign = {
        ...datasetorderTemplate,
        sign: '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
      };
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderInvalidSign,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('datasetorder invalid sign'));
      const workerpoolorderInvalidSign = {
        ...workerpoolorderTemplate,
        sign: '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
      };
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderInvalidSign,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('workerpoolorder invalid sign'));
      const requestorderInvalidSign = {
        ...requestorderTemplate,
        sign: '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
      };
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderInvalidSign,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('requestorder invalid sign'));

      // address mismatch
      const apporderAddressMismatch =
        await deployAndGetApporder(iexecAppProvider);
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderAddressMismatch,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `app address mismatch between requestorder (${requestorderTemplate.app}) and apporder (${apporderAddressMismatch.app})`,
        ),
      );
      const datasetorderAddressMismatch =
        await deployAndGetDatasetorder(iexecDatasetProvider);
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderAddressMismatch,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `dataset address mismatch between requestorder (${requestorderTemplate.dataset}) and datasetorder (${datasetorderAddressMismatch.dataset})`,
        ),
      );
      const workerpoolorderAddressMismatch =
        await deployAndGetWorkerpoolorder(iexecPoolManager);
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderAddressMismatch,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `workerpool address mismatch between requestorder (${requestorderTemplate.workerpool}) and workerpoolorder (${workerpoolorderAddressMismatch.workerpool})`,
        ),
      );
      // category check
      const workerpoolorderCategoryMismatch =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          category: 2,
        });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderCategoryMismatch,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `category mismatch between requestorder (${requestorderTemplate.category}) and workerpoolorder (${workerpoolorderCategoryMismatch.category})`,
        ),
      );
      // trust check
      const workerpoolorderTrustZero =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          trust: 0,
        });
      const requestorderTrustTooHigh =
        await iexecRequester.order.signRequestorder(
          {
            ...requestorderTemplate,
            trust: 2,
          },
          { preflightCheck: false },
        );
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTrustZero,
            requestorder: requestorderTrustTooHigh,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `workerpoolorder trust is too low (expected ${requestorderTrustTooHigh.trust}, got ${workerpoolorderTrustZero.trust})`,
        ),
      );

      // workerpool tag check
      const requestorderTagTeeGpu = await iexecRequester.order.signRequestorder(
        {
          ...requestorderTemplate,
          tag: ['tee', 'scone', 'gpu'],
        },
        { preflightCheck: false },
      );
      const workerpoolorderTagGpu =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          tag: ['gpu'],
        });
      const workerpoolorderTagTee =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          tag: ['tee', 'scone'],
        });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTagGpu,
            requestorder: requestorderTagTeeGpu,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('Missing tags [tee,scone] in workerpoolorder'));
      const apporderTagGpu = await iexecAppProvider.order.signApporder({
        ...apporderTemplate,
        tag: ['gpu'],
      });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTagGpu,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTagTee,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('Missing tags [gpu] in workerpoolorder'));
      const datasetorderTagTeeGpu =
        await iexecDatasetProvider.order.signDatasetorder(
          {
            ...datasetorderTemplate,
            tag: ['gpu', 'tee', 'scone'],
          },
          { preflightCheck: false },
        );
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTagTeeGpu,
            workerpoolorder: workerpoolorderTagTee,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('Missing tags [gpu] in workerpoolorder'));
      // app tag check
      const datasetorderTagTee =
        await iexecDatasetProvider.order.signDatasetorder(
          {
            ...datasetorderTemplate,
            tag: ['tee', 'scone'],
          },
          { preflightCheck: false },
        );
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTagTee,
            workerpoolorder: workerpoolorderTagTee,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('Missing tag [tee] in apporder'));
      // price check
      const apporderTooExpensive = await iexecAppProvider.order.signApporder({
        ...apporderTemplate,
        appprice: 1,
      });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTooExpensive,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `appmaxprice too low (expected ${apporderTooExpensive.appprice}, got ${requestorderTemplate.appmaxprice})`,
        ),
      );

      const datasetorderTooExpensive =
        await iexecDatasetProvider.order.signDatasetorder(
          {
            ...datasetorderTemplate,
            datasetprice: 1,
          },
          { preflightCheck: false },
        );
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTooExpensive,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `datasetmaxprice too low (expected ${datasetorderTooExpensive.datasetprice}, got ${requestorderTemplate.datasetmaxprice})`,
        ),
      );

      const workerpoolorderTooExpensive =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          workerpoolprice: 1,
        });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTooExpensive,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          `workerpoolmaxprice too low (expected ${workerpoolorderTooExpensive.workerpoolprice}, got ${requestorderTemplate.workerpoolmaxprice})`,
        ),
      );
      // volumes checks
      const apporderCanceled = await iexecAppProvider.order
        .signApporder(apporderTemplate, { preflightCheck: false })
        .then(async (order) => {
          await iexecAppProvider.order.cancelApporder(order);
          return order;
        });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderCanceled,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('apporder is fully consumed'));

      const datasetorderCanceled = await iexecDatasetProvider.order
        .signDatasetorder(datasetorderTemplate, { preflightCheck: false })
        .then(async (order) => {
          await iexecDatasetProvider.order.cancelDatasetorder(order);
          return order;
        });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderCanceled,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('datasetorder is fully consumed'));

      const workerpoolorderCanceled = await iexecPoolManager.order
        .signWorkerpoolorder(workerpoolorderTemplate)
        .then(async (order) => {
          await iexecPoolManager.order.cancelWorkerpoolorder(order);
          return order;
        });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderCanceled,
            requestorder: requestorderTemplate,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('workerpoolorder is fully consumed'));
      const requestorderCanceled = await iexecRequester.order
        .signRequestorder(requestorderTemplate, { preflightCheck: false })
        .then(async (order) => {
          await iexecRequester.order.cancelRequestorder(order);
          return order;
        });
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporderTemplate,
            datasetorder: datasetorderTemplate,
            workerpoolorder: workerpoolorderTemplate,
            requestorder: requestorderCanceled,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(Error('requestorder is fully consumed'));

      // requester account stake check
      const balance = await iexecRequester.account.checkBalance(
        await iexecRequester.wallet.getAddress(),
      );
      await iexecRequester.account.withdraw(balance.stake).catch(() => {});
      await iexecRequester.account.deposit(5);

      const apporder3nRlc = await iexecAppProvider.order.signApporder(
        {
          ...apporderTemplate,
          appprice: 3,
        },
        { preflightCheck: false },
      );
      const datasetorder2nRlc =
        await iexecDatasetProvider.order.signDatasetorder(
          {
            ...datasetorderTemplate,
            datasetprice: 2,
          },
          { preflightCheck: false },
        );
      const workerpoolorder1nRlc =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          workerpoolprice: 1,
        });
      const requestorder300nRlc = await iexecRequester.order.signRequestorder(
        {
          ...requestorderTemplate,
          appmaxprice: 100,
          datasetmaxprice: 100,
          workerpoolmaxprice: 100,
        },
        { preflightCheck: false },
      );
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporder3nRlc,
            datasetorder: datasetorder2nRlc,
            workerpoolorder: workerpoolorder1nRlc,
            requestorder: requestorder300nRlc,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          "Cost per task (6) is greater than requester account stake (5). Orders can't be matched. If you are the requester, you should deposit to top up your account",
        ),
      );

      const apporder0nRlc = await iexecAppProvider.order.signApporder(
        {
          ...apporderTemplate,
          appprice: 0,
          volume: 1000,
        },
        { preflightCheck: false },
      );
      const datasetorder0nRlc =
        await iexecDatasetProvider.order.signDatasetorder(
          {
            ...datasetorderTemplate,
            datasetprice: 0,
            volume: 1000,
          },
          { preflightCheck: false },
        );
      const workerpoolorder2nRlc =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          workerpoolprice: 2,
          volume: 1000,
        });
      const requestorder6nRlc = await iexecRequester.order.signRequestorder(
        {
          ...requestorderTemplate,
          workerpoolmaxprice: 2,
          volume: 3,
        },
        { preflightCheck: false },
      );
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporder0nRlc,
            datasetorder: datasetorder0nRlc,
            workerpoolorder: workerpoolorder2nRlc,
            requestorder: requestorder6nRlc,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          "Total cost for 3 tasks (6) is greater than requester account stake (5). Orders can't be matched. If you are the requester, you should deposit to top up your account or reduce your requestorder volume",
        ),
      );
      // workerpool owner stake check
      const workerpoolorder7nRlc =
        await iexecPoolManager.order.signWorkerpoolorder({
          ...workerpoolorderTemplate,
          workerpoolprice: 7,
        });
      await iexecRequester.account.deposit(10);
      const poolManagerBalance = await iexecPoolManager.account.checkBalance(
        await iexecPoolManager.wallet.getAddress(),
      );
      await iexecPoolManager.account
        .withdraw(poolManagerBalance.stake)
        .catch(() => {});

      await iexecPoolManager.account.deposit(1);
      await expect(
        iexecBroker.order.matchOrders(
          {
            apporder: apporder3nRlc,
            datasetorder: datasetorder2nRlc,
            workerpoolorder: workerpoolorder7nRlc,
            requestorder: requestorder300nRlc,
          },
          { preflightCheck: false },
        ),
      ).rejects.toThrow(
        Error(
          "workerpool required stake (2) is greater than workerpool owner's account stake (1). Orders can't be matched. If you are the workerpool owner, you should deposit to top up your account",
        ),
      );
      // standard case
      const res = await iexecBroker.order.matchOrders(
        {
          apporder: apporderTemplate,
          datasetorder: datasetorderTemplate,
          workerpoolorder: workerpoolorderTemplate,
          requestorder: requestorderTemplate,
        },
        { preflightCheck: false },
      );
      expect(res.txHash).toBeTxHash();
      expect(res.volume).toBeInstanceOf(BN);
      expect(res.volume.eq(new BN(1))).toBe(true);
      expect(res.dealid).toBeTxHash();
    });

    test('preflightChecks', async () => {
      const { iexec: iexecRequester } = getTestConfig(iexecTestChain)();
      const { iexec: iexecResourcesProvider } = getTestConfig(iexecTestChain)();

      const apporder = await deployAndGetApporder(iexecResourcesProvider);
      const datasetorder = await deployAndGetDatasetorder(
        iexecResourcesProvider,
      );
      const workerpoolorder = await deployAndGetWorkerpoolorder(
        iexecResourcesProvider,
      );
      const requestorder = await getMatchableRequestorder(iexecRequester, {
        apporder,
        datasetorder,
        workerpoolorder,
      });

      const teeApporder = await deployAndGetApporder(iexecResourcesProvider, {
        teeFramework: TEE_FRAMEWORKS.SCONE,
        tag: ['tee', 'scone'],
      });
      const teeDatasetorder = await deployAndGetDatasetorder(
        iexecResourcesProvider,
        { tag: ['tee', 'scone'] },
      );
      const teeWorkerpoolorder = await deployAndGetWorkerpoolorder(
        iexecResourcesProvider,
        {
          tag: ['tee', 'scone'],
        },
      );
      const res = await iexecRequester.order.matchOrders({
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
      expect(res.txHash).toBeTxHash();
      expect(res.volume).toBeInstanceOf(BN);
      expect(res.volume.eq(new BN(1))).toBe(true);
      expect(res.dealid).toBeTxHash();

      // trigger app check
      await expect(
        iexecRequester.order.matchOrders({
          apporder,
          datasetorder,
          workerpoolorder: teeWorkerpoolorder,
          requestorder: await getMatchableRequestorder(iexecRequester, {
            apporder,
            datasetorder,
            workerpoolorder: teeWorkerpoolorder,
          }).then((o) =>
            iexecRequester.order.signRequestorder(
              { ...o, tag: ['tee', 'scone'] },
              { preflightCheck: false },
            ),
          ),
        }),
      ).rejects.toThrow(
        Error('Tag mismatch the TEE framework specified by app'),
      );

      // trigger dataset check
      await expect(
        iexecRequester.order.matchOrders({
          apporder: teeApporder,
          datasetorder: teeDatasetorder,
          workerpoolorder: teeWorkerpoolorder,
          requestorder: await getMatchableRequestorder(iexecRequester, {
            apporder: teeApporder,
            datasetorder: teeDatasetorder,
            workerpoolorder: teeWorkerpoolorder,
          }),
        }),
      ).rejects.toThrow('Dataset encryption key is not set for dataset ');
    });

    describe('useVoucher option', () => {
      test('should throw error if no voucher available for the requester', async () => {
        const { iexec: iexecRequester, wallet: requesterWallet } =
          getTestConfig(iexecTestChain)();
        const { iexec: iexecResourcesProvider } =
          getTestConfig(iexecTestChain)();

        const apporder = await deployAndGetApporder(iexecResourcesProvider, {
          volume: 10,
          appprice: 5,
        });
        const datasetorder = await deployAndGetDatasetorder(
          iexecResourcesProvider,
          {
            volume: 7,
            datasetprice: 1,
          },
        );
        const workerpoolorder = await deployAndGetWorkerpoolorder(
          iexecResourcesProvider,
          { volume: 5, workerpoolprice: 1 },
        );
        const requestorder = await getMatchableRequestorder(iexecRequester, {
          apporder,
          datasetorder,
          workerpoolorder,
        });

        await expect(
          iexecRequester.order.matchOrders(
            {
              apporder,
              datasetorder,
              workerpoolorder,
              requestorder,
            },
            { useVoucher: true },
          ),
        ).rejects.toThrow(
          Error(
            `No voucher available for the requester ${requesterWallet.address}`,
          ),
        );
      });

      test('requires voucherHubAddress to be configured when useVoucher is true', async () => {
        const noVoucherTestChain = TEST_CHAINS['custom-token-chain'];
        const options = {
          resultProxyURL: 'https://result-proxy.iex.ec',
          smsURL: 'https://sms.iex.ec',
        };
        const { iexec: iexecRequester, wallet: requesterWallet } =
          getTestConfig(noVoucherTestChain)({
            options,
          });
        const { iexec: iexecResourcesProvider, wallet: providerWallet } =
          getTestConfig(noVoucherTestChain)({
            options,
          });

        await setBalance(noVoucherTestChain)(requesterWallet.address, ONE_ETH);
        await setBalance(noVoucherTestChain)(providerWallet.address, ONE_ETH);

        const apporder = await deployAndGetApporder(iexecResourcesProvider, {
          volume: 10,
          appprice: 5,
        });
        const datasetorder = await deployAndGetDatasetorder(
          iexecResourcesProvider,
          {
            volume: 7,
            datasetprice: 1,
          },
        );
        const workerpoolorder = await deployAndGetWorkerpoolorder(
          iexecResourcesProvider,
          { volume: 5, workerpoolprice: 1 },
        );
        const requestorder = await getMatchableRequestorder(iexecRequester, {
          apporder,
          datasetorder,
          workerpoolorder,
        });

        await setNRlcBalance(noVoucherTestChain)(requesterWallet.address, 100);
        await iexecRequester.account.deposit(100);
        await expect(
          iexecRequester.order.matchOrders(
            {
              apporder,
              datasetorder,
              workerpoolorder,
              requestorder,
            },
            { useVoucher: true },
          ),
        ).rejects.toThrow(
          new ConfigurationError(
            `voucherHubAddress option not set and no default value for your chain ${noVoucherTestChain.chainId}`,
          ),
        );
        // match orders without useVoucher should pass
        const res = await iexecRequester.order.matchOrders(
          {
            apporder,
            datasetorder,
            workerpoolorder,
            requestorder,
          },
          { useVoucher: false },
        );
        expect(res.txHash).toBeTxHash();
        expect(res.volume).toBeInstanceOf(BN);
        expect(res.volume.eq(new BN(5))).toBe(true);
        expect(res.dealid).toBeTxHash();
      });

      test('should throw error for insufficient voucher allowance', async () => {
        const { iexec: iexecRequester, wallet: requesterWallet } =
          getTestConfig(iexecTestChain)();
        const { iexec: iexecResourcesProvider } =
          getTestConfig(iexecTestChain)();

        const apporder = await deployAndGetApporder(iexecResourcesProvider, {
          volume: 10,
          appprice: 5,
        });
        const datasetorder = await deployAndGetDatasetorder(
          iexecResourcesProvider,
          {
            volume: 7,
            datasetprice: 1,
          },
        );
        const workerpoolorder = await deployAndGetWorkerpoolorder(
          iexecResourcesProvider,
          { volume: 5, workerpoolprice: 1 },
        );
        const requestorder = await getMatchableRequestorder(iexecRequester, {
          apporder,
          datasetorder,
          workerpoolorder,
        });
        const voucherTypeId = await createVoucherType(iexecTestChain)({
          description: 'test voucher type',
          duration: 42,
        });
        await addVoucherEligibleAsset(iexecTestChain)(
          datasetorder.dataset,
          voucherTypeId,
        );
        await addVoucherEligibleAsset(iexecTestChain)(
          workerpoolorder.workerpool,
          voucherTypeId,
        );
        const voucherAddress = await createVoucher(iexecTestChain)({
          owner: await requesterWallet.getAddress(),
          voucherType: voucherTypeId,
          value: 1000,
        });
        const allowance = await iexecRequester.account.checkAllowance(
          requestorder.requester,
          voucherAddress,
        );
        const { total, sponsored } =
          await iexecRequester.order.estimateMatchOrders(
            { apporder, datasetorder, workerpoolorder, requestorder },
            { preflightCheck: true, useVoucher: true },
          );

        const requiredAmount = total.sub(sponsored);
        const missingAmount = requiredAmount.sub(allowance);

        await expect(
          iexecRequester.order.matchOrders(
            {
              apporder,
              datasetorder,
              workerpoolorder,
              requestorder,
            },
            { useVoucher: true },
          ),
        ).rejects.toThrow(
          Error(
            `Orders can't be matched. Please approve an additional ${missingAmount} for voucher usage.`,
          ),
        );
      });

      test('should match orders with voucher when user deposits to cover the missing amount', async () => {
        const { iexec: iexecRequester, wallet: requesterWallet } =
          getTestConfig(iexecTestChain)();
        const { iexec: iexecResourcesProvider } =
          getTestConfig(iexecTestChain)();

        const apporder = await deployAndGetApporder(iexecResourcesProvider, {
          volume: 10,
          appprice: 5,
        });
        const datasetorder = await deployAndGetDatasetorder(
          iexecResourcesProvider,
          {
            volume: 7,
            datasetprice: 1,
          },
        );
        const workerpoolorder = await deployAndGetWorkerpoolorder(
          iexecResourcesProvider,
          { volume: 5, workerpoolprice: 1 },
        );
        const requestorder = await getMatchableRequestorder(iexecRequester, {
          apporder,
          datasetorder,
          workerpoolorder,
        });
        const voucherTypeId = await createVoucherType(iexecTestChain)({
          description: 'test voucher type',
          duration: 42,
        });
        await addVoucherEligibleAsset(iexecTestChain)(
          datasetorder.dataset,
          voucherTypeId,
        );
        await addVoucherEligibleAsset(iexecTestChain)(
          workerpoolorder.workerpool,
          voucherTypeId,
        );

        const voucherAddress = await createVoucher(iexecTestChain)({
          owner: await requesterWallet.getAddress(),
          voucherType: voucherTypeId,
          value: 1000,
        });
        await setNRlcBalance(iexecTestChain)(requesterWallet.address, 30);
        await iexecRequester.account.deposit(30);
        await iexecRequester.account.approve(25, voucherAddress);
        const res = await iexecRequester.order.matchOrders(
          {
            apporder,
            datasetorder,
            workerpoolorder,
            requestorder,
          },
          { useVoucher: true },
        );
        expect(res.txHash).toBeTxHash();
        expect(res.volume).toBeInstanceOf(BN);
        expect(res.volume.eq(new BN(5))).toBe(true);
        expect(res.dealid).toBeTxHash();
      });
    });
  });
});
