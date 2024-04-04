import { Wallet } from 'ethers';
import {
  NULL_ADDRESS,
  TEE_FRAMEWORKS,
  getId,
  getRandomWallet,
  sleep,
} from '../test-utils';
import { IExec, utils } from '../../src/lib';

const { getSignerFromPrivateKey } = utils;

export const ONE_ETH = 10n ** 18n;

export const ONE_RLC = 10n ** 9n;

export const ONE_GWEI = 10n ** 9n;

export const getTestConfigOptions =
  (chain) =>
  ({ options = {} } = {}) => ({
    bridgeAddress: options.bridgeAddress ?? chain.bridgeAddress,
    bridgedNetworkConf: options.bridgedNetworkConf ?? chain.bridgedNetworkConf,
    confirms: options.confirms ?? chain.confirms,
    defaultTeeFramework:
      options.defaultTeeFramework ?? chain.defaultTeeFramework,
    ensPublicResolverAddress:
      options.ensPublicResolverAddress ?? chain.ensPublicResolverAddress,
    ensRegistryAddress: options.ensRegistryAddress ?? chain.ensRegistryAddress,
    enterpriseSwapConf: options.enterpriseSwapConf ?? chain.enterpriseSwapConf,
    hubAddress: options.hubAddress ?? chain.hubAddress,
    iexecGatewayURL: options.iexecGatewayURL ?? chain.iexecGatewayURL,
    ipfsGatewayURL: options.ipfsGatewayURL ?? chain.ipfsGatewayURL,
    isNative: options.isNative ?? chain.isNative,
    providerOptions: options.providerOptions ?? chain.providerOptions,
    resultProxyURL: options.resultProxyURL ?? chain.resultProxyURL,
    smsURL: options.smsURL ?? chain.smsMap,
    useGas: options.useGas ?? chain.useGas,
  });

export const getTestConfig =
  (chain) =>
  ({ privateKey, readOnly = false, options = {} } = {}) => {
    const configOptions = getTestConfigOptions(chain)({ options });
    if (readOnly) {
      return {
        iexec: new IExec({ ethProvider: chain.rpcURL }, configOptions),
      };
    }
    const wallet = privateKey ? new Wallet(privateKey) : getRandomWallet();
    const ethProvider = getSignerFromPrivateKey(
      chain.rpcURL,
      wallet.privateKey,
    );
    return {
      iexec: new IExec({ ethProvider }, configOptions),
      wallet,
    };
  };

export const deployRandomApp = async (iexec, { owner, teeFramework } = {}) =>
  iexec.app.deployApp({
    owner: owner || (await iexec.wallet.getAddress()),
    name: `app${getId()}`,
    type: 'DOCKER',
    multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
    checksum:
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    mrenclave: teeFramework && {
      framework: teeFramework,
      version: 'v1',
      fingerprint: 'fingerprint',
      ...(teeFramework.toLowerCase() === TEE_FRAMEWORKS.SCONE && {
        entrypoint: 'entrypoint.sh',
        heapSize: 4096,
      }),
    },
  });

export const deployRandomDataset = async (iexec, { owner } = {}) =>
  iexec.dataset.deployDataset({
    owner: owner || (await iexec.wallet.getAddress()),
    name: `dataset${getId()}`,
    multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
    checksum:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
  });

export const deployRandomWorkerpool = async (iexec, { owner } = {}) =>
  iexec.workerpool.deployWorkerpool({
    owner: owner || (await iexec.wallet.getAddress()),
    description: `workerpool${getId()}`,
  });

export const deployAndGetApporder = async (
  iexec,
  {
    teeFramework,
    appprice = 0,
    volume = 1,
    datasetrestrict,
    workerpoolrestrict,
    requesterrestrict,
    tag,
  } = {},
) => {
  const appDeployRes = await deployRandomApp(iexec, { teeFramework });
  const app = appDeployRes.address;
  return iexec.order
    .createApporder({
      app,
      appprice,
      volume,
      tag,
      datasetrestrict,
      workerpoolrestrict,
      requesterrestrict,
    })
    .then((order) =>
      iexec.order.signApporder(order, { preflightCheck: false }),
    );
};

export const deployAndGetDatasetorder = async (
  iexec,
  {
    datasetprice = 0,
    volume = 1,
    apprestrict,
    workerpoolrestrict,
    requesterrestrict,
    tag,
  } = {},
) => {
  const datasetDeployRes = await deployRandomDataset(iexec);
  const dataset = datasetDeployRes.address;
  return iexec.order
    .createDatasetorder({
      dataset,
      datasetprice,
      volume,
      tag,
      apprestrict,
      workerpoolrestrict,
      requesterrestrict,
    })
    .then((order) =>
      iexec.order.signDatasetorder(order, { preflightCheck: false }),
    );
};

export const deployAndGetWorkerpoolorder = async (
  iexec,
  {
    category = 0,
    workerpoolprice = 0,
    volume = 1,
    trust,
    apprestrict,
    datasetrestrict,
    requesterrestrict,
    tag,
  } = {},
) => {
  const workerpoolDeployRes = await deployRandomWorkerpool(iexec);
  const workerpool = workerpoolDeployRes.address;
  return iexec.order
    .createWorkerpoolorder({
      workerpool,
      workerpoolprice,
      volume,
      category,
      trust,
      tag,
      apprestrict,
      datasetrestrict,
      requesterrestrict,
    })
    .then(iexec.order.signWorkerpoolorder);
};

export const getMatchableRequestorder = async (
  iexec,
  { apporder, datasetorder, workerpoolorder } = {},
) => {
  const address = await iexec.wallet.getAddress();
  return iexec.order
    .createRequestorder({
      requester: address,
      app: apporder.app,
      appmaxprice: apporder.appprice,
      dataset: datasetorder ? datasetorder.dataset : NULL_ADDRESS,
      datasetmaxprice: datasetorder ? datasetorder.datasetprice : 0,
      workerpool: workerpoolorder.workerpool,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      category: workerpoolorder.category,
      trust: workerpoolorder.trust,
      volume: workerpoolorder.volume,
    })
    .then((o) => iexec.order.signRequestorder(o, { preflightCheck: false }));
};

export const runObservableSubscribe = (observable) => {
  let unsubscribe;
  const messages = [];
  let completed = false;
  let unsubscribed = false;
  let error;

  const obsPromise = new Promise((resolve) => {
    const unsub = observable.subscribe({
      next: (message) => {
        messages.push(message);
      },
      error: (err) => {
        error = err;
        resolve();
      },
      complete: () => {
        completed = true;
        resolve();
      },
    });
    unsubscribe = (resolveAfter = 5000) => {
      unsub();
      unsubscribed = true;
      sleep(resolveAfter).then(resolve);
    };
  });

  const wait = async () => {
    await obsPromise;
    return {
      messages,
      completed,
      unsubscribed,
      error,
    };
  };

  return {
    unsubscribe,
    wait,
  };
};
