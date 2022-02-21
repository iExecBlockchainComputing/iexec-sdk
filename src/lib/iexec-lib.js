const { getDefaultProvider, providers } = require('ethers');
const IExecContractsClient = require('../common/utils/contracts');
const wallet = require('../common/modules/wallet');
const account = require('../common/modules/account');
const hub = require('../common/modules/hub');
const order = require('../common/modules/order');
const orderbook = require('../common/modules/orderbook');
const deal = require('../common/modules/deal');
const task = require('../common/modules/task');
const iexecProcess = require('../common/modules/iexecProcess');
const secretMgtServ = require('../common/modules/sms');
const resultProxyServ = require('../common/modules/result-proxy');
const ens = require('../common/modules/ens');
const {
  checkRequestRequirements,
} = require('../common/modules/request-helper');
const {
  getStorageTokenKeyName,
  getResultEncryptionKeyName,
} = require('../common/utils/secrets-utils');
const errors = require('../common/utils/errors');
const {
  BN,
  NULL_ADDRESS,
  NULL_BYTES32,
  parseEth,
  parseRLC,
  formatEth,
  formatRLC,
  encodeTag,
  decodeTag,
  sumTags,
  decryptResult,
} = require('../common/utils/utils');
const {
  generateAes256Key,
  encryptAes256Cbc,
  sha256Sum,
} = require('../common/utils/encryption-utils');
const {
  EnhancedWallet,
  EnhancedWeb3Signer,
  getSignerFromPrivateKey,
} = require('../common/utils/signers');
const {
  getChainDefaults,
  isEnterpriseEnabled,
} = require('../common/utils/config');

const utils = {
  BN,
  NULL_ADDRESS,
  NULL_BYTES32,
  parseEth,
  parseRLC,
  formatEth,
  formatRLC,
  encodeTag,
  decodeTag,
  sumTags,
  getSignerFromPrivateKey,
  decryptResult,
};

class IExec {
  constructor(
    { ethProvider, flavour = 'standard' },
    {
      hubAddress,
      ensRegistryAddress,
      ensPublicResolverAddress,
      isNative,
      useGas = true,
      confirms,
      bridgeAddress,
      bridgedNetworkConf = {},
      enterpriseSwapConf = {},
      resultProxyURL,
      smsURL,
      ipfsGatewayURL,
      iexecGatewayURL,
    } = {},
  ) {
    const isEnhancedWallet = ethProvider instanceof EnhancedWallet;

    const networkPromise = (async () => {
      let disposableProvider;
      if (isEnhancedWallet) {
        disposableProvider = ethProvider.provider;
      } else {
        disposableProvider = new providers.Web3Provider(ethProvider);
      }
      const { chainId, name, ensAddress } =
        await disposableProvider.getNetwork();
      return { chainId, name, ensAddress };
    })();

    const chainConfDefaultsPromise = (async () => {
      const { chainId } = await networkPromise;
      return getChainDefaults({ id: chainId, flavour });
    })();

    const signerProviderPromise = (async () => {
      let provider;
      let signer;
      const network = await networkPromise;
      const { ensRegistry } = await chainConfDefaultsPromise;
      const networkOverride = {
        ...network,
        ...(ensRegistry && { ensAddress: ensRegistry }),
        ...(ensRegistryAddress && { ensAddress: ensRegistryAddress }),
      };
      if (isEnhancedWallet) {
        if (
          ethProvider.provider &&
          ethProvider.provider.connection &&
          ethProvider.provider.connection.url
        ) {
          // case JsonRpcProvider
          signer = ethProvider.connect(
            new providers.JsonRpcProvider(
              ethProvider.provider.connection.url,
              networkOverride,
            ),
          );
        } else {
          // case FallbackProvider can not override
          if (ensRegistryAddress) {
            console.warn(
              'IExec: ensRegistyAddress option is not supported when using a default provider',
            );
          }
          signer = ethProvider;
        }
        provider = signer.provider;
      } else {
        const web3SignerProvider = new EnhancedWeb3Signer(
          ethProvider,
          networkOverride,
        );
        signer = web3SignerProvider;
        provider = signer.provider;
      }
      return { provider, signer };
    })();

    const contractsPromise = (async () => {
      const { chainId } = await networkPromise;
      const { provider, signer } = await signerProviderPromise;
      return new IExecContractsClient({
        chainId,
        provider,
        signer,
        hubAddress,
        useGas,
        confirms,
        isNative,
        flavour,
      });
    })();

    let _enterpriseSwapContracts;
    const getEnterpriseSwapContracts = async () => {
      if (!_enterpriseSwapContracts) {
        const { chainId } = await networkPromise;
        const { provider, signer } = await signerProviderPromise;
        let enterpriseConf;
        const hasEnterpriseConf =
          enterpriseSwapConf.hubAddress || isEnterpriseEnabled(chainId);
        const enterpriseSwapFlavour =
          flavour === 'enterprise' ? 'standard' : 'enterprise';
        if (hasEnterpriseConf) {
          const enterpriseSwapConfDefaults = getChainDefaults({
            id: chainId,
            flavour: enterpriseSwapFlavour,
          });
          enterpriseConf = {
            ...enterpriseSwapConfDefaults,
            ...enterpriseSwapConf,
          };
        }
        _enterpriseSwapContracts = hasEnterpriseConf
          ? new IExecContractsClient({
              chainId,
              provider,
              signer,
              hubAddress: enterpriseConf.hubAddress,
              confirms,
              isNative: enterpriseConf.isNative,
              flavour: enterpriseSwapFlavour,
            })
          : undefined;
      }
      return _enterpriseSwapContracts;
    };

    let _bridgedConf;
    const getBridgedConf = async () => {
      if (!_bridgedConf) {
        const { chainId } = await networkPromise;
        const chainConfDefaults = await chainConfDefaultsPromise;
        const contracts = await contractsPromise;
        const isBridged =
          Object.getOwnPropertyNames(bridgedNetworkConf).length > 0 ||
          chainConfDefaults.bridge;

        if (isBridged) {
          const bridgedChainId =
            bridgedNetworkConf.chainId !== undefined
              ? bridgedNetworkConf.chainId
              : chainConfDefaults.bridge &&
                chainConfDefaults.bridge.bridgedChainId;
          if (!bridgedChainId) {
            throw new errors.ConfigurationError(
              `Missing chainId in bridgedNetworkConf and no default value for your chain ${chainId}`,
            );
          }
          const bridgedChainConfDefaults = getChainDefaults({
            id: bridgedChainId,
            flavour,
          });
          const bridgedRpcUrl =
            bridgedNetworkConf.rpcURL !== undefined
              ? bridgedNetworkConf.rpcURL
              : bridgedChainConfDefaults.host;
          if (!bridgedRpcUrl) {
            throw new errors.ConfigurationError(
              `Missing rpcURL in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
            );
          }
          const bridgedBridgeAddress =
            bridgedNetworkConf.bridgeAddress !== undefined
              ? bridgedNetworkConf.bridgeAddress
              : bridgedChainConfDefaults.bridge &&
                bridgedChainConfDefaults.bridge.contract;
          if (!bridgedBridgeAddress) {
            throw new errors.ConfigurationError(
              `Missing bridgeAddress in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
            );
          }
          _bridgedConf = {
            chainId: bridgedChainId,
            rpcURL: bridgedRpcUrl,
            isNative:
              flavour === 'standard' ? !contracts.isNative : contracts.isNative,
            hubAddress: bridgedNetworkConf.hubAddress,
            bridgeAddress: bridgedBridgeAddress,
          };
        }
      }
      return _bridgedConf;
    };

    let _bridgedContracts;
    const getBridgedContracts = async () => {
      if (!_bridgedContracts) {
        const chainConfDefaults = await chainConfDefaultsPromise;
        const isBridged =
          Object.getOwnPropertyNames(bridgedNetworkConf).length > 0 ||
          chainConfDefaults.bridge;
        if (isBridged) {
          const bridgedConf = await getBridgedConf();
          _bridgedContracts = new IExecContractsClient({
            chainId: bridgedConf.chainId,
            provider: getDefaultProvider(bridgedConf.rpcURL),
            hubAddress: bridgedConf.hubAddress,
            confirms,
            isNative: bridgedConf.isNative,
            flavour,
          });
        }
      }
      return _bridgedContracts;
    };

    const getSmsURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = smsURL || chainConfDefaults.sms;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `smsURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getResultProxyURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = resultProxyURL || chainConfDefaults.resultProxy;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `resultProxyURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getIexecGatewayURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = iexecGatewayURL || chainConfDefaults.iexecGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `iexecGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getIpfsGatewayURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = ipfsGatewayURL || chainConfDefaults.ipfsGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `ipfsGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getBridgeAddress = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value =
        bridgeAddress ||
        (chainConfDefaults.bridge && chainConfDefaults.bridge.contract);
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `bridgeAddress option not set and no default value for your chain ${chainId}`,
      );
    };

    const getEnsPublicResolverAddress = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value =
        ensPublicResolverAddress || chainConfDefaults.ensPublicResolver;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `ensPublicResolverAddress option not set and no default value for your chain ${chainId}`,
      );
    };

    const getStandardContracts = async () => {
      const { chainId } = await networkPromise;
      const contracts = await contractsPromise;
      if (contracts.flavour === 'standard') {
        return contracts;
      }
      const enterpriseSwapContracts = await getEnterpriseSwapContracts();
      if (
        enterpriseSwapContracts &&
        enterpriseSwapContracts.flavour === 'standard'
      ) {
        return enterpriseSwapContracts;
      }
      throw Error(
        `enterpriseSwapConf option not set and no default value for your chain ${chainId}`,
      );
    };

    const getEnterpriseContracts = async () => {
      const { chainId } = await networkPromise;
      const contracts = await contractsPromise;
      if (contracts.flavour === 'enterprise') {
        return contracts;
      }
      const enterpriseSwapContracts = await getEnterpriseSwapContracts();
      if (
        enterpriseSwapContracts &&
        enterpriseSwapContracts.flavour === 'enterprise'
      ) {
        return enterpriseSwapContracts;
      }
      throw Error(
        `enterpriseSwapConf option not set and no default value for your chain ${chainId}`,
      );
    };

    this.wallet = {};
    this.wallet.getAddress = async () =>
      wallet.getAddress(await contractsPromise);
    this.wallet.checkBalances = async (address) =>
      wallet.checkBalances(await contractsPromise, address);
    this.wallet.checkBridgedBalances = async (address) =>
      wallet.checkBalances(await getBridgedContracts(), address);
    this.wallet.sendETH = async (weiAmount, to) =>
      wallet.sendETH(await contractsPromise, weiAmount, to);
    this.wallet.sendRLC = async (nRlcAmount, to) =>
      wallet.sendRLC(await contractsPromise, nRlcAmount, to);
    this.wallet.sweep = async (to) => wallet.sweep(await contractsPromise, to);
    this.wallet.bridgeToSidechain = async (nRlcAmount) =>
      wallet.bridgeToSidechain(
        await contractsPromise,
        await getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await getBridgedContracts(),
          sidechainBridgeAddress: await getBridgedConf().then(
            (bridgedConf) => bridgedConf && bridgedConf.bridgeAddress,
          ),
        },
      );
    this.wallet.bridgeToMainchain = async (nRlcAmount) =>
      wallet.bridgeToMainchain(
        await contractsPromise,
        await getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await getBridgedContracts(),
          mainchainBridgeAddress: await getBridgedConf().then(
            (bridgedConf) => bridgedConf && bridgedConf.bridgeAddress,
          ),
        },
      );
    this.wallet.obsBridgeToSidechain = async (nRlcAmount) =>
      wallet.obsBridgeToSidechain(
        await contractsPromise,
        await getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await getBridgedContracts(),
          sidechainBridgeAddress: await getBridgedConf().then(
            (bridgedConf) => bridgedConf && bridgedConf.bridgeAddress,
          ),
        },
      );
    this.wallet.obsBridgeToMainchain = async (nRlcAmount) =>
      wallet.obsBridgeToMainchain(
        await contractsPromise,
        await getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await getBridgedContracts(),
          mainchainBridgeAddress: await getBridgedConf().then(
            (bridgedConf) => bridgedConf && bridgedConf.bridgeAddress,
          ),
        },
      );
    this.wallet.wrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.wrapEnterpriseRLC(
        await getStandardContracts(),
        await getEnterpriseContracts(),
        nRlcAmount,
      );
    this.wallet.unwrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.unwrapEnterpriseRLC(await getEnterpriseContracts(), nRlcAmount);
    this.account = {};
    this.account.checkBalance = async (address) =>
      account.checkBalance(await contractsPromise, address);
    this.account.checkBridgedBalance = async (address) =>
      account.checkBalance(await getBridgedContracts(), address);
    this.account.deposit = async (nRlcAmount) =>
      account.deposit(await contractsPromise, nRlcAmount);
    this.account.withdraw = async (nRlcAmount) =>
      account.withdraw(await contractsPromise, nRlcAmount);
    this.app = {};
    this.app.deployApp = async (app) =>
      hub.deployApp(await contractsPromise, app);
    this.app.showApp = async (address) =>
      hub.showApp(await contractsPromise, address);
    this.app.showUserApp = async (index, userAddress) =>
      hub.showUserApp(await contractsPromise, index, userAddress);
    this.app.countUserApps = async (address) =>
      hub.countUserApps(await contractsPromise, address);
    this.dataset = {};
    this.dataset.generateEncryptionKey = () => generateAes256Key();
    this.dataset.encrypt = (datasetFile, encryptionKey) =>
      encryptAes256Cbc(datasetFile, encryptionKey);
    this.dataset.computeEncryptedFileChecksum = (encryptedFile) =>
      sha256Sum(encryptedFile);
    this.dataset.deployDataset = async (dataset) =>
      hub.deployDataset(await contractsPromise, dataset);
    this.dataset.showDataset = async (address) =>
      hub.showDataset(await contractsPromise, address);
    this.dataset.showUserDataset = async (index, userAddress) =>
      hub.showUserDataset(await contractsPromise, index, userAddress);
    this.dataset.countUserDatasets = async (address) =>
      hub.countUserDatasets(await contractsPromise, address);
    this.dataset.checkDatasetSecretExists = async (datasetAddress) =>
      secretMgtServ.checkWeb3SecretExists(
        await contractsPromise,
        await getSmsURL(),
        datasetAddress,
      );
    this.dataset.pushDatasetSecret = async (datasetAddress, datasetSecret) =>
      secretMgtServ.pushWeb3Secret(
        await contractsPromise,
        await getSmsURL(),
        datasetAddress,
        datasetSecret,
      );
    this.workerpool = {};
    this.workerpool.deployWorkerpool = async (workerpool) =>
      hub.deployWorkerpool(await contractsPromise, workerpool);
    this.workerpool.showWorkerpool = async (address) =>
      hub.showWorkerpool(await contractsPromise, address);
    this.workerpool.showUserWorkerpool = async (index, userAddress) =>
      hub.showUserWorkerpool(await contractsPromise, index, userAddress);
    this.workerpool.countUserWorkerpools = async (address) =>
      hub.countUserWorkerpools(await contractsPromise, address);
    this.hub = {};
    this.hub.createCategory = async (category) =>
      hub.createCategory(await contractsPromise, category);
    this.hub.showCategory = async (index) =>
      hub.showCategory(await contractsPromise, index);
    this.hub.countCategory = async () =>
      hub.countCategory(await contractsPromise);
    this.hub.getTimeoutRatio = async () =>
      hub.getTimeoutRatio(await contractsPromise);
    this.deal = {};
    this.deal.show = async (dealid) =>
      deal.show(await contractsPromise, dealid);
    this.deal.obsDeal = async (dealid) =>
      iexecProcess.obsDeal(await contractsPromise, dealid);
    this.deal.computeTaskId = (dealid, taskIdx) =>
      deal.computeTaskId(dealid, taskIdx);
    this.deal.fetchRequesterDeals = async (
      requesterAddress,
      { appAddress, datasetAddress, workerpoolAddress } = {},
    ) =>
      deal.fetchRequesterDeals(
        await contractsPromise,
        await getIexecGatewayURL(),
        requesterAddress,
        {
          appAddress,
          datasetAddress,
          workerpoolAddress,
        },
      );
    this.deal.claim = async (dealid) =>
      deal.claim(await contractsPromise, dealid);
    this.deal.fetchDealsByApporder = async (apporderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.APP_ORDER,
        (await networkPromise).chainId,
        apporderHash,
      );
    this.deal.fetchDealsByDatasetorder = async (datasetorderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.DATASET_ORDER,
        (await networkPromise).chainId,
        datasetorderHash,
      );
    this.deal.fetchDealsByWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        (await networkPromise).chainId,
        workerpoolorderHash,
      );
    this.deal.fetchDealsByRequestorder = async (requestorderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.REQUEST_ORDER,
        (await networkPromise).chainId,
        requestorderHash,
      );
    this.order = {};
    this.order.createApporder = async (overwrite) =>
      order.createApporder(await contractsPromise, overwrite);
    this.order.createDatasetorder = async (overwrite) =>
      order.createDatasetorder(await contractsPromise, overwrite);
    this.order.createWorkerpoolorder = async (overwrite) =>
      order.createWorkerpoolorder(await contractsPromise, overwrite);
    this.order.createRequestorder = async (overwrite) =>
      order.createRequestorder(
        {
          contracts: await contractsPromise,
          resultProxyURL: await getResultProxyURL(),
        },
        overwrite,
      );
    this.order.hashApporder = async (apporder) =>
      order.hashApporder(await contractsPromise, apporder);
    this.order.hashDatasetorder = async (datasetorder) =>
      order.hashDatasetorder(await contractsPromise, datasetorder);
    this.order.hashWorkerpoolorder = async (workerpoolorder) =>
      order.hashWorkerpoolorder(await contractsPromise, workerpoolorder);
    this.order.hashRequestorder = async (requestorder) =>
      order.hashRequestorder(await contractsPromise, requestorder);
    this.order.signApporder = async (apporder) =>
      order.signApporder(await contractsPromise, apporder);
    this.order.signDatasetorder = async (datasetorder) =>
      order.signDatasetorder(await contractsPromise, datasetorder);
    this.order.signWorkerpoolorder = async (workerpoolorder) =>
      order.signWorkerpoolorder(await contractsPromise, workerpoolorder);
    this.order.signRequestorder = async (
      requestorder,
      { checkRequest = true } = {},
    ) =>
      order.signRequestorder(
        await contractsPromise,
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await contractsPromise,
                smsURL: await getSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
    this.order.cancelApporder = async (signedApporder) =>
      order.cancelApporder(await contractsPromise, signedApporder);
    this.order.cancelDatasetorder = async (signedDatasetorder) =>
      order.cancelDatasetorder(await contractsPromise, signedDatasetorder);
    this.order.cancelWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.cancelWorkerpoolorder(
        await contractsPromise,
        signedWorkerpoolorder,
      );
    this.order.cancelRequestorder = async (signedRequestorder) =>
      order.cancelRequestorder(await contractsPromise, signedRequestorder);
    this.order.publishApporder = async (signedApporder) =>
      order.publishApporder(
        await contractsPromise,
        await getIexecGatewayURL(),
        signedApporder,
      );
    this.order.publishDatasetorder = async (signedDatasetorder) =>
      order.publishDatasetorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        signedDatasetorder,
      );
    this.order.publishWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.publishWorkerpoolorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        signedWorkerpoolorder,
      );
    this.order.publishRequestorder = async (
      signedRequestorder,
      { checkRequest = true } = {},
    ) =>
      order.publishRequestorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await contractsPromise,
                smsURL: await getSmsURL(),
              },
              signedRequestorder,
            ).then(() => signedRequestorder)
          : signedRequestorder,
      );
    this.order.unpublishApporder = async (apporderHash) =>
      order.unpublishApporder(
        await contractsPromise,
        await getIexecGatewayURL(),
        apporderHash,
      );
    this.order.unpublishDatasetorder = async (datasetorderHash) =>
      order.unpublishDatasetorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        datasetorderHash,
      );
    this.order.unpublishWorkerpoolorder = async (workerpoolorderHash) =>
      order.unpublishWorkerpoolorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        workerpoolorderHash,
      );
    this.order.unpublishRequestorder = async (requestorderHash) =>
      order.unpublishRequestorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        requestorderHash,
      );
    this.order.unpublishLastApporder = async (appAddress) =>
      order.unpublishLastApporder(
        await contractsPromise,
        await getIexecGatewayURL(),
        appAddress,
      );
    this.order.unpublishLastDatasetorder = async (datasetAddress) =>
      order.unpublishLastDatasetorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        datasetAddress,
      );
    this.order.unpublishLastWorkerpoolorder = async (workerpoolAddress) =>
      order.unpublishLastWorkerpoolorder(
        await contractsPromise,
        await getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.order.unpublishLastRequestorder = async () =>
      order.unpublishLastRequestorder(
        await contractsPromise,
        await getIexecGatewayURL(),
      );
    this.order.unpublishAllApporders = async (appAddress) =>
      order.unpublishAllApporders(
        await contractsPromise,
        await getIexecGatewayURL(),
        appAddress,
      );
    this.order.unpublishAllDatasetorders = async (datasetAddress) =>
      order.unpublishAllDatasetorders(
        await contractsPromise,
        await getIexecGatewayURL(),
        datasetAddress,
      );
    this.order.unpublishAllWorkerpoolorders = async (workerpoolAddress) =>
      order.unpublishAllWorkerpoolorders(
        await contractsPromise,
        await getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.order.unpublishAllRequestorders = async () =>
      order.unpublishAllRequestorders(
        await contractsPromise,
        await getIexecGatewayURL(),
      );
    this.order.matchOrders = async (
      {
        apporder,
        datasetorder = order.NULL_DATASETORDER,
        workerpoolorder,
        requestorder,
      },
      { checkRequest = true } = {},
    ) =>
      order.matchOrders(
        await contractsPromise,
        apporder,
        datasetorder,
        workerpoolorder,
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await contractsPromise,
                smsURL: await getSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
    this.orderbook = {};
    this.orderbook.fetchApporder = async (apporderHash) =>
      order.fetchPublishedOrderByHash(
        await getIexecGatewayURL(),
        order.APP_ORDER,
        (await networkPromise).chainId,
        apporderHash,
      );
    this.orderbook.fetchDatasetorder = async (datasetorderHash) =>
      order.fetchPublishedOrderByHash(
        await getIexecGatewayURL(),
        order.DATASET_ORDER,
        (await networkPromise).chainId,
        datasetorderHash,
      );
    this.orderbook.fetchWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchPublishedOrderByHash(
        await getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        (await networkPromise).chainId,
        workerpoolorderHash,
      );
    this.orderbook.fetchRequestorder = async (requestorderHash) =>
      order.fetchPublishedOrderByHash(
        await getIexecGatewayURL(),
        order.REQUEST_ORDER,
        (await networkPromise).chainId,
        requestorderHash,
      );
    this.orderbook.fetchAppOrderbook = async (appAddress, options = {}) =>
      orderbook.fetchAppOrderbook(
        await contractsPromise,
        await getIexecGatewayURL(),
        appAddress,
        options,
      );
    this.orderbook.fetchDatasetOrderbook = async (
      datasetAddress,
      options = {},
    ) =>
      orderbook.fetchDatasetOrderbook(
        await contractsPromise,
        await getIexecGatewayURL(),
        datasetAddress,
        options,
      );
    this.orderbook.fetchWorkerpoolOrderbook = async (options) =>
      orderbook.fetchWorkerpoolOrderbook(
        await contractsPromise,
        await getIexecGatewayURL(),
        options,
      );
    this.orderbook.fetchRequestOrderbook = async (options) =>
      orderbook.fetchRequestOrderbook(
        await contractsPromise,
        await getIexecGatewayURL(),
        options,
      );
    this.task = {};
    this.task.show = async (taskid) =>
      task.show(await contractsPromise, taskid);
    this.task.obsTask = async (taskid, { dealid } = {}) =>
      iexecProcess.obsTask(await contractsPromise, taskid, { dealid });
    this.task.claim = async (taskid) =>
      task.claim(await contractsPromise, taskid);
    this.task.fetchResults = async (taskid) =>
      iexecProcess.fetchTaskResults(await contractsPromise, taskid, {
        ipfsGatewayURL: await getIpfsGatewayURL(),
      });
    this.result = {};
    this.result.checkResultEncryptionKeyExists = async (address) =>
      secretMgtServ.checkWeb2SecretExists(
        await contractsPromise,
        await getSmsURL(),
        address,
        getResultEncryptionKeyName(),
      );
    this.result.pushResultEncryptionKey = async (
      publicKey,
      { forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await contractsPromise,
        await getSmsURL(),
        getResultEncryptionKeyName(),
        publicKey,
        { forceUpdate },
      );
    this.storage = {};
    this.storage.defaultStorageLogin = async () =>
      resultProxyServ.login(await contractsPromise, await getResultProxyURL());
    this.storage.checkStorageTokenExists = async (address, { provider } = {}) =>
      secretMgtServ.checkWeb2SecretExists(
        await contractsPromise,
        await getSmsURL(),
        address,
        getStorageTokenKeyName(provider),
      );
    this.storage.pushStorageToken = async (
      token,
      { provider, forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await contractsPromise,
        await getSmsURL(),
        getStorageTokenKeyName(provider),
        token,
        { forceUpdate },
      );
    this.ens = {};
    this.ens.getOwner = async (name) =>
      ens.getOwner(await contractsPromise, name);
    this.ens.resolveName = async (name) =>
      ens.resolveName(await contractsPromise, name);
    this.ens.lookupAddress = async (address) =>
      ens.lookupAddress(await contractsPromise, address);
    this.ens.claimName = async (label, domain) =>
      ens.registerFifsEns(await contractsPromise, label, domain);
    this.ens.obsConfigureResolution = async (name, address) =>
      ens.obsConfigureResolution(
        await contractsPromise,
        await getEnsPublicResolverAddress(),
        name,
        address,
      );
    this.ens.configureResolution = async (name, address) =>
      ens.configureResolution(
        await contractsPromise,
        await getEnsPublicResolverAddress(),
        name,
        address,
      );
    this.network = {};
    this.network.getNetwork = async () => {
      const contracts = await contractsPromise;
      return { chainId: contracts.chainId, isNative: contracts.isNative };
    };
  }
}

const sdk = {
  IExec,
  errors,
  utils,
};

module.exports = sdk;
