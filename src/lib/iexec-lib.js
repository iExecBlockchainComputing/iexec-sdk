const IExecContractsClient = require('iexec-contracts-js-client');
const { getDefaultProvider } = require('ethers');
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
    let ethersProvider;
    let ethersSigner;
    if (ethProvider instanceof EnhancedWallet) {
      ethersProvider = ethProvider.provider;
      ethersSigner = ethProvider;
    } else {
      const web3SignerProvider = new EnhancedWeb3Signer(ethProvider);
      ethersProvider = web3SignerProvider.provider;
      ethersSigner = web3SignerProvider;
    }

    let _chainId;
    const getChainId = async () => {
      if (_chainId === undefined) {
        const network = await ethersProvider.getNetwork();
        _chainId = `${network.chainId}`;
      }
      return _chainId;
    };

    let _contracts;
    const getContracts = async () => {
      const providerChainId = await getChainId();
      if (!_contracts) {
        _contracts = new IExecContractsClient({
          chainId: providerChainId,
          provider: ethersProvider,
          signer: ethersSigner,
          hubAddress,
          useGas,
          confirms,
          isNative,
          flavour,
        });
      }
      return _contracts;
    };

    let _chainConfDefaults;
    const getChainConfDefaults = async () => {
      if (!_chainConfDefaults) {
        const providerChainId = await getChainId();
        _chainConfDefaults = getChainDefaults({ id: providerChainId, flavour });
      }
      return _chainConfDefaults;
    };

    let _enterpriseSwapContracts;
    const getEnterpriseSwapContracts = async () => {
      if (!_enterpriseSwapContracts) {
        const providerChainId = await getChainId();
        let enterpriseConf;
        const hasEnterpriseConf =
          enterpriseSwapConf.hubAddress || isEnterpriseEnabled(providerChainId);
        const enterpriseSwapFlavour =
          flavour === 'enterprise' ? 'standard' : 'enterprise';
        if (hasEnterpriseConf) {
          const enterpriseSwapConfDefaults = getChainDefaults({
            id: providerChainId,
            flavour: enterpriseSwapFlavour,
          });
          enterpriseConf = {
            ...enterpriseSwapConfDefaults,
            ...enterpriseSwapConf,
          };
        }
        _enterpriseSwapContracts = hasEnterpriseConf
          ? new IExecContractsClient({
              chainId: providerChainId,
              provider: ethersProvider,
              signer: ethersSigner,
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
        const chainId = await getChainId();
        const chainConfDefaults = await getChainConfDefaults();
        const contracts = await getContracts();
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
        const chainConfDefaults = await getChainConfDefaults();
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
      const chainId = await getChainId();
      const chainConfDefaults = await getChainConfDefaults();
      const value = smsURL || chainConfDefaults.sms;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `smsURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getResultProxyURL = async () => {
      const chainId = await getChainId();
      const chainConfDefaults = await getChainConfDefaults();
      const value = resultProxyURL || chainConfDefaults.resultProxy;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `resultProxyURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getIexecGatewayURL = async () => {
      const chainId = await getChainId();
      const chainConfDefaults = await getChainConfDefaults();
      const value = iexecGatewayURL || chainConfDefaults.iexecGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `iexecGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getIpfsGatewayURL = async () => {
      const chainId = await getChainId();
      const chainConfDefaults = await getChainConfDefaults();
      const value = ipfsGatewayURL || chainConfDefaults.ipfsGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `ipfsGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getBridgeAddress = async () => {
      const chainId = await getChainId();
      const chainConfDefaults = await getChainConfDefaults();
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

    const getStandardContracts = async () => {
      const chainId = await getChainId();
      const contracts = await getContracts();
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
      const chainId = await getChainId();
      const contracts = await getContracts();
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
      wallet.getAddress(await getContracts());
    this.wallet.checkBalances = async (address) =>
      wallet.checkBalances(await getContracts(), address);
    this.wallet.checkBridgedBalances = async (address) =>
      wallet.checkBalances(await getBridgedContracts(), address);
    this.wallet.sendETH = async (weiAmount, to) =>
      wallet.sendETH(await getContracts(), weiAmount, to);
    this.wallet.sendRLC = async (nRlcAmount, to) =>
      wallet.sendRLC(await getContracts(), nRlcAmount, to);
    this.wallet.sweep = async (to) => wallet.sweep(await getContracts(), to);
    this.wallet.bridgeToSidechain = async (nRlcAmount) =>
      wallet.bridgeToSidechain(
        await getContracts(),
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
        await getContracts(),
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
      account.checkBalance(await getContracts(), address);
    this.account.checkBridgedBalance = async (address) =>
      account.checkBalance(await getBridgedContracts(), address);
    this.account.deposit = async (nRlcAmount) =>
      account.deposit(await getContracts(), nRlcAmount);
    this.account.withdraw = async (nRlcAmount) =>
      account.withdraw(await getContracts(), nRlcAmount);
    this.app = {};
    this.app.deployApp = async (app) =>
      hub.deployApp(await getContracts(), app);
    this.app.showApp = async (address) =>
      hub.showApp(await getContracts(), address);
    this.app.showUserApp = async (index, userAddress) =>
      hub.showUserApp(await getContracts(), index, userAddress);
    this.app.countUserApps = async (address) =>
      hub.countUserApps(await getContracts(), address);
    this.dataset = {};
    this.dataset.generateEncryptionKey = () => generateAes256Key();
    this.dataset.encrypt = (datasetFile, encryptionKey) =>
      encryptAes256Cbc(datasetFile, encryptionKey);
    this.dataset.computeEncryptedFileChecksum = (encryptedFile) =>
      sha256Sum(encryptedFile);
    this.dataset.deployDataset = async (dataset) =>
      hub.deployDataset(await getContracts(), dataset);
    this.dataset.showDataset = async (address) =>
      hub.showDataset(await getContracts(), address);
    this.dataset.showUserDataset = async (index, userAddress) =>
      hub.showUserDataset(await getContracts(), index, userAddress);
    this.dataset.countUserDatasets = async (address) =>
      hub.countUserDatasets(await getContracts(), address);
    this.dataset.checkDatasetSecretExists = async (datasetAddress) =>
      secretMgtServ.checkWeb3SecretExists(
        await getContracts(),
        await getSmsURL(),
        datasetAddress,
      );
    this.dataset.pushDatasetSecret = async (datasetAddress, datasetSecret) =>
      secretMgtServ.pushWeb3Secret(
        await getContracts(),
        await getSmsURL(),
        datasetAddress,
        datasetSecret,
      );
    this.workerpool = {};
    this.workerpool.deployWorkerpool = async (workerpool) =>
      hub.deployWorkerpool(await getContracts(), workerpool);
    this.workerpool.showWorkerpool = async (address) =>
      hub.showWorkerpool(await getContracts(), address);
    this.workerpool.showUserWorkerpool = async (index, userAddress) =>
      hub.showUserWorkerpool(await getContracts(), index, userAddress);
    this.workerpool.countUserWorkerpools = async (address) =>
      hub.countUserWorkerpools(await getContracts(), address);
    this.hub = {};
    this.hub.createCategory = async (category) =>
      hub.createCategory(await getContracts(), category);
    this.hub.showCategory = async (index) =>
      hub.showCategory(await getContracts(), index);
    this.hub.countCategory = async () =>
      hub.countCategory(await getContracts());
    this.hub.getTimeoutRatio = async () =>
      hub.getTimeoutRatio(await getContracts());
    this.deal = {};
    this.deal.show = async (dealid) => deal.show(await getContracts(), dealid);
    this.deal.obsDeal = async (dealid) =>
      iexecProcess.obsDeal(await getContracts(), dealid);
    this.deal.computeTaskId = (dealid, taskIdx) =>
      deal.computeTaskId(dealid, taskIdx);
    this.deal.fetchRequesterDeals = async (
      requesterAddress,
      { appAddress, datasetAddress, workerpoolAddress } = {},
    ) =>
      deal.fetchRequesterDeals(
        await getContracts(),
        await getIexecGatewayURL(),
        requesterAddress,
        {
          appAddress,
          datasetAddress,
          workerpoolAddress,
        },
      );
    this.deal.claim = async (dealid) =>
      deal.claim(await getContracts(), dealid);
    this.deal.fetchDealsByApporder = async (apporderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.APP_ORDER,
        await getChainId(),
        apporderHash,
      );
    this.deal.fetchDealsByDatasetorder = async (datasetorderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.DATASET_ORDER,
        await getChainId(),
        datasetorderHash,
      );
    this.deal.fetchDealsByWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await getChainId(),
        workerpoolorderHash,
      );
    this.deal.fetchDealsByRequestorder = async (requestorderHash) =>
      order.fetchDealsByOrderHash(
        await getIexecGatewayURL(),
        order.REQUEST_ORDER,
        await getChainId(),
        requestorderHash,
      );
    this.order = {};
    this.order.createApporder = async (overwrite) =>
      order.createApporder(await getContracts(), overwrite);
    this.order.createDatasetorder = async (overwrite) =>
      order.createDatasetorder(await getContracts(), overwrite);
    this.order.createWorkerpoolorder = async (overwrite) =>
      order.createWorkerpoolorder(await getContracts(), overwrite);
    this.order.createRequestorder = async (overwrite) =>
      order.createRequestorder(
        {
          contracts: await getContracts(),
          resultProxyURL: await getResultProxyURL(),
        },
        overwrite,
      );
    this.order.hashApporder = async (apporder) =>
      order.hashApporder(await getContracts(), apporder);
    this.order.hashDatasetorder = async (datasetorder) =>
      order.hashDatasetorder(await getContracts(), datasetorder);
    this.order.hashWorkerpoolorder = async (workerpoolorder) =>
      order.hashWorkerpoolorder(await getContracts(), workerpoolorder);
    this.order.hashRequestorder = async (requestorder) =>
      order.hashRequestorder(await getContracts(), requestorder);
    this.order.signApporder = async (apporder) =>
      order.signApporder(await getContracts(), apporder);
    this.order.signDatasetorder = async (datasetorder) =>
      order.signDatasetorder(await getContracts(), datasetorder);
    this.order.signWorkerpoolorder = async (workerpoolorder) =>
      order.signWorkerpoolorder(await getContracts(), workerpoolorder);
    this.order.signRequestorder = async (
      requestorder,
      { checkRequest = true } = {},
    ) =>
      order.signRequestorder(
        await getContracts(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await getContracts(),
                smsURL: await getSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
    this.order.cancelApporder = async (signedApporder) =>
      order.cancelApporder(await getContracts(), signedApporder);
    this.order.cancelDatasetorder = async (signedDatasetorder) =>
      order.cancelDatasetorder(await getContracts(), signedDatasetorder);
    this.order.cancelWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.cancelWorkerpoolorder(await getContracts(), signedWorkerpoolorder);
    this.order.cancelRequestorder = async (signedRequestorder) =>
      order.cancelRequestorder(await getContracts(), signedRequestorder);
    this.order.publishApporder = async (signedApporder) =>
      order.publishApporder(
        await getContracts(),
        await getIexecGatewayURL(),
        signedApporder,
      );
    this.order.publishDatasetorder = async (signedDatasetorder) =>
      order.publishDatasetorder(
        await getContracts(),
        await getIexecGatewayURL(),
        signedDatasetorder,
      );
    this.order.publishWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.publishWorkerpoolorder(
        await getContracts(),
        await getIexecGatewayURL(),
        signedWorkerpoolorder,
      );
    this.order.publishRequestorder = async (
      signedRequestorder,
      { checkRequest = true } = {},
    ) =>
      order.publishRequestorder(
        await getContracts(),
        await getIexecGatewayURL(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await getContracts(),
                smsURL: await getSmsURL(),
              },
              signedRequestorder,
            ).then(() => signedRequestorder)
          : signedRequestorder,
      );
    this.order.unpublishApporder = async (apporderHash) =>
      order.unpublishApporder(
        await getContracts(),
        await getIexecGatewayURL(),
        apporderHash,
      );
    this.order.unpublishDatasetorder = async (datasetorderHash) =>
      order.unpublishDatasetorder(
        await getContracts(),
        await getIexecGatewayURL(),
        datasetorderHash,
      );
    this.order.unpublishWorkerpoolorder = async (workerpoolorderHash) =>
      order.unpublishWorkerpoolorder(
        await getContracts(),
        await getIexecGatewayURL(),
        workerpoolorderHash,
      );
    this.order.unpublishRequestorder = async (requestorderHash) =>
      order.unpublishRequestorder(
        await getContracts(),
        await getIexecGatewayURL(),
        requestorderHash,
      );
    this.order.unpublishLastApporder = async (appAddress) =>
      order.unpublishLastApporder(
        await getContracts(),
        await getIexecGatewayURL(),
        appAddress,
      );
    this.order.unpublishLastDatasetorder = async (datasetAddress) =>
      order.unpublishLastDatasetorder(
        await getContracts(),
        await getIexecGatewayURL(),
        datasetAddress,
      );
    this.order.unpublishLastWorkerpoolorder = async (workerpoolAddress) =>
      order.unpublishLastWorkerpoolorder(
        await getContracts(),
        await getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.order.unpublishLastRequestorder = async () =>
      order.unpublishLastRequestorder(
        await getContracts(),
        await getIexecGatewayURL(),
      );
    this.order.unpublishAllApporders = async (appAddress) =>
      order.unpublishAllApporders(
        await getContracts(),
        await getIexecGatewayURL(),
        appAddress,
      );
    this.order.unpublishAllDatasetorders = async (datasetAddress) =>
      order.unpublishAllDatasetorders(
        await getContracts(),
        await getIexecGatewayURL(),
        datasetAddress,
      );
    this.order.unpublishAllWorkerpoolorders = async (workerpoolAddress) =>
      order.unpublishAllWorkerpoolorders(
        await getContracts(),
        await getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.order.unpublishAllRequestorders = async () =>
      order.unpublishAllRequestorders(
        await getContracts(),
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
        await getContracts(),
        apporder,
        datasetorder,
        workerpoolorder,
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await getContracts(),
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
        await getChainId(),
        apporderHash,
      );
    this.orderbook.fetchDatasetorder = async (datasetorderHash) =>
      order.fetchPublishedOrderByHash(
        await getIexecGatewayURL(),
        order.DATASET_ORDER,
        await getChainId(),
        datasetorderHash,
      );
    this.orderbook.fetchWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchPublishedOrderByHash(
        await getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await getChainId(),
        workerpoolorderHash,
      );
    this.orderbook.fetchRequestorder = async (requestorderHash) =>
      order.fetchPublishedOrderByHash(
        await getIexecGatewayURL(),
        order.REQUEST_ORDER,
        await getChainId(),
        requestorderHash,
      );
    this.orderbook.fetchAppOrderbook = async (appAddress, options = {}) =>
      orderbook.fetchAppOrderbook(
        await getContracts(),
        await getIexecGatewayURL(),
        appAddress,
        options,
      );
    this.orderbook.fetchDatasetOrderbook = async (
      datasetAddress,
      options = {},
    ) =>
      orderbook.fetchDatasetOrderbook(
        await getContracts(),
        await getIexecGatewayURL(),
        datasetAddress,
        options,
      );
    this.orderbook.fetchWorkerpoolOrderbook = async (options) =>
      orderbook.fetchWorkerpoolOrderbook(
        await getContracts(),
        await getIexecGatewayURL(),
        options,
      );
    this.orderbook.fetchRequestOrderbook = async (options) =>
      orderbook.fetchRequestOrderbook(
        await getContracts(),
        await getIexecGatewayURL(),
        options,
      );
    this.task = {};
    this.task.show = async (taskid) => task.show(await getContracts(), taskid);
    this.task.obsTask = async (taskid, { dealid } = {}) =>
      iexecProcess.obsTask(await getContracts(), taskid, { dealid });
    this.task.claim = async (taskid) =>
      task.claim(await getContracts(), taskid);
    this.task.fetchResults = async (taskid) =>
      iexecProcess.fetchTaskResults(await getContracts(), taskid, {
        ipfsGatewayURL: await getIpfsGatewayURL(),
      });
    this.result = {};
    this.result.checkResultEncryptionKeyExists = async (address) =>
      secretMgtServ.checkWeb2SecretExists(
        await getContracts(),
        await getSmsURL(),
        address,
        getResultEncryptionKeyName(),
      );
    this.result.pushResultEncryptionKey = async (
      publicKey,
      { forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await getContracts(),
        await getSmsURL(),
        getResultEncryptionKeyName(),
        publicKey,
        { forceUpdate },
      );
    this.storage = {};
    this.storage.defaultStorageLogin = async () =>
      resultProxyServ.login(await getContracts(), await getResultProxyURL());
    this.storage.checkStorageTokenExists = async (address, { provider } = {}) =>
      secretMgtServ.checkWeb2SecretExists(
        await getContracts(),
        await getSmsURL(),
        address,
        getStorageTokenKeyName(provider),
      );
    this.storage.pushStorageToken = async (
      token,
      { provider, forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await getContracts(),
        await getSmsURL(),
        getStorageTokenKeyName(provider),
        token,
        { forceUpdate },
      );
    this.network = {};
    this.network.getNetwork = async () => {
      const contracts = await getContracts();
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
