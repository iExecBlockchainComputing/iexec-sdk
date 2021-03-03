const IExecContractsClient = require('iexec-contracts-js-client');
const { getDefaultProvider } = require('ethers');
const wallet = require('./wallet');
const account = require('./account');
const hub = require('./hub');
const order = require('./order');
const orderbook = require('./orderbook');
const deal = require('./deal');
const task = require('./task');
const secretMgtServ = require('./sms');
const {
  getStorageTokenKeyName,
  getResultEncryptionKeyName,
} = require('./secrets-utils');
const resultProxyServ = require('./result-proxy');
const iexecProcess = require('./iexecProcess');
const { checkRequestRequirements } = require('./request-helper');
const errors = require('./errors');
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
} = require('./utils');
const { generateAes256Key, encryptAes256Cbc } = require('./encryption-utils');
const {
  EnhancedWallet,
  EnhancedWeb3Signer,
  getSignerFromPrivateKey,
} = require('./signers');
const { getChainDefaults, isEnterpriseEnabled } = require('./config');

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
    { ethProvider, chainId, flavour = 'standard' },
    {
      hubAddress,
      isNative,
      useGas = true,
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

    const contracts = new IExecContractsClient({
      chainId,
      provider: ethersProvider,
      signer: ethersSigner,
      hubAddress,
      useGas,
      isNative,
      flavour,
    });

    const chainConfDefaults = getChainDefaults({ id: chainId, flavour });

    let enterpriseConf;
    const hasEnterpriseConf = enterpriseSwapConf.hubAddress || isEnterpriseEnabled(chainId);
    const enterpriseSwapFlavour = flavour === 'enterprise' ? 'standard' : 'enterprise';
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
    const enterpriseSwapContracts = hasEnterpriseConf
      ? new IExecContractsClient({
        chainId,
        provider: ethersProvider,
        signer: ethersSigner,
        hubAddress: enterpriseConf.hubAddress,
        isNative: enterpriseConf.isNative,
        flavour: enterpriseSwapFlavour,
      })
      : undefined;

    let bridgedConf;
    const isBridged = Object.getOwnPropertyNames(bridgedNetworkConf).length > 0
      || chainConfDefaults.bridge;
    if (isBridged) {
      const bridgedChainId = bridgedNetworkConf.chainId !== undefined
        ? bridgedNetworkConf.chainId
        : chainConfDefaults.bridge && chainConfDefaults.bridge.bridgedChainId;
      if (!bridgedChainId) {
        throw new errors.ValidationError(
          `Missing chainId in bridgedNetworkConf and no default value for your chain ${chainId}`,
        );
      }
      const bridgedChainConfDefaults = getChainDefaults({
        id: bridgedChainId,
        flavour,
      });
      bridgedConf = {
        chainId: bridgedChainId,
        rpcURL:
          bridgedNetworkConf.rpcURL !== undefined
            ? bridgedNetworkConf.rpcURL
            : bridgedChainConfDefaults.host,
        isNative:
          flavour === 'standard' ? !contracts.isNative : contracts.isNative,
        hubAddress: bridgedNetworkConf.hubAddress,
        bridgeAddress:
          bridgedNetworkConf.bridgeAddress !== undefined
            ? bridgedNetworkConf.bridgeAddress
            : bridgedChainConfDefaults.bridge
              && bridgedChainConfDefaults.bridge.contract,
      };
      if (!bridgedConf.rpcURL) {
        throw new errors.ValidationError(
          `Missing rpcURL in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
        );
      }
      if (!bridgedConf.bridgeAddress) {
        throw new errors.ValidationError(
          `Missing bridgeAddress in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
        );
      }
    }

    const bridgedContracts = isBridged
      ? new IExecContractsClient({
        chainId: bridgedConf.chainId,
        provider: getDefaultProvider(bridgedConf.rpcURL),
        hubAddress: bridgedConf.hubAddress,
        isNative: bridgedConf.isNative,
        flavour,
      })
      : undefined;

    const getSmsURL = () => {
      const value = smsURL || chainConfDefaults.sms;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `smsURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getResultProxyURL = () => {
      const value = resultProxyURL || chainConfDefaults.resultProxy;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `resultProxyURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getIexecGatewayURL = () => {
      const value = iexecGatewayURL || chainConfDefaults.iexecGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `iexecGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getIpfsGatewayURL = () => {
      const value = ipfsGatewayURL || chainConfDefaults.ipfsGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `ipfsGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getBridgeAddress = () => {
      const value = bridgeAddress
        || (chainConfDefaults.bridge && chainConfDefaults.bridge.contract);
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `bridgeAddress option not set and no default value for your chain ${chainId}`,
      );
    };

    const getStandardContracts = () => {
      if (contracts.flavour === 'standard') {
        return contracts;
      }
      if (
        enterpriseSwapContracts
        && enterpriseSwapContracts.flavour === 'standard'
      ) {
        return enterpriseSwapContracts;
      }
      throw Error(
        `enterpriseSwapConf option not set and no default value for your chain ${chainId}`,
      );
    };

    const getEnterpriseContracts = () => {
      if (contracts.flavour === 'enterprise') {
        return contracts;
      }
      if (
        enterpriseSwapContracts
        && enterpriseSwapContracts.flavour === 'enterprise'
      ) {
        return enterpriseSwapContracts;
      }
      throw Error(
        `enterpriseSwapConf option not set and no default value for your chain ${chainId}`,
      );
    };

    this.wallet = {};
    this.wallet.getAddress = () => wallet.getAddress(contracts);
    this.wallet.checkBalances = (address) => wallet.checkBalances(contracts, address);
    this.wallet.checkBridgedBalances = (address) => wallet.checkBalances(bridgedContracts, address);
    this.wallet.sendETH = (weiAmount, to) => wallet.sendETH(contracts, weiAmount, to);
    this.wallet.sendRLC = (nRlcAmount, to) => wallet.sendRLC(contracts, nRlcAmount, to);
    this.wallet.sweep = (to) => wallet.sweep(contracts, to);
    this.wallet.bridgeToSidechain = (nRlcAmount) => wallet.bridgeToSidechain(contracts, getBridgeAddress(), nRlcAmount, {
      bridgedContracts,
      sidechainBridgeAddress: bridgedConf && bridgedConf.bridgeAddress,
    });
    this.wallet.bridgeToMainchain = (nRlcAmount) => wallet.bridgeToMainchain(contracts, getBridgeAddress(), nRlcAmount, {
      bridgedContracts,
      mainchainBridgeAddress: bridgedConf && bridgedConf.bridgeAddress,
    });
    this.wallet.wrapEnterpriseRLC = (nRlcAmount) => wallet.wrapEnterpriseRLC(
      getStandardContracts(),
      getEnterpriseContracts(),
      nRlcAmount,
    );
    this.wallet.unwrapEnterpriseRLC = (nRlcAmount) => wallet.unwrapEnterpriseRLC(getEnterpriseContracts(), nRlcAmount);
    this.account = {};
    this.account.checkBalance = (address) => account.checkBalance(contracts, address);
    this.account.checkBridgedBalance = (address) => account.checkBalance(bridgedContracts, address);
    this.account.deposit = (nRlcAmount) => account.deposit(contracts, nRlcAmount);
    this.account.withdraw = (nRlcAmount) => account.withdraw(contracts, nRlcAmount);
    this.app = {};
    this.app.deployApp = (app) => hub.deployApp(contracts, app);
    this.app.showApp = (address) => hub.showApp(contracts, address);
    this.app.showUserApp = (index, userAddress) => hub.showUserApp(contracts, index, userAddress);
    this.app.countUserApps = (address) => hub.countUserApps(contracts, address);
    this.dataset = {};
    this.dataset.generateEncryptionKey = () => generateAes256Key();
    this.dataset.encrypt = (datasetFile, encryptionKey) => encryptAes256Cbc(datasetFile, encryptionKey);
    this.dataset.deployDataset = (dataset) => hub.deployDataset(contracts, dataset);
    this.dataset.showDataset = (address) => hub.showDataset(contracts, address);
    this.dataset.showUserDataset = (index, userAddress) => hub.showUserDataset(contracts, index, userAddress);
    this.dataset.countUserDatasets = (address) => hub.countUserDatasets(contracts, address);
    this.dataset.checkDatasetSecretExists = (datasetAddress) => secretMgtServ.checkWeb3SecretExists(
      contracts,
      getSmsURL(),
      datasetAddress,
    );
    this.dataset.pushDatasetSecret = (datasetAddress, datasetSecret) => secretMgtServ.pushWeb3Secret(
      contracts,
      getSmsURL(),
      datasetAddress,
      datasetSecret,
    );
    this.workerpool = {};
    this.workerpool.deployWorkerpool = (workerpool) => hub.deployWorkerpool(contracts, workerpool);
    this.workerpool.showWorkerpool = (address) => hub.showWorkerpool(contracts, address);
    this.workerpool.showUserWorkerpool = (index, userAddress) => hub.showUserWorkerpool(contracts, index, userAddress);
    this.workerpool.countUserWorkerpools = (address) => hub.countUserWorkerpools(contracts, address);
    this.hub = {};
    this.hub.createCategory = (category) => hub.createCategory(contracts, category);
    this.hub.showCategory = (index) => hub.showCategory(contracts, index);
    this.hub.countCategory = () => hub.countCategory(contracts);
    this.hub.getTimeoutRatio = () => hub.getTimeoutRatio(contracts);
    this.deal = {};
    this.deal.show = (dealid) => deal.show(contracts, dealid);
    this.deal.obsDeal = (dealid) => iexecProcess.obsDeal(contracts, dealid);
    this.deal.computeTaskId = (dealid, taskIdx) => deal.computeTaskId(dealid, taskIdx);
    this.deal.fetchRequesterDeals = (
      requesterAddress,
      { appAddress, datasetAddress, workerpoolAddress } = {},
    ) => deal.fetchRequesterDeals(
      contracts,
      getIexecGatewayURL(),
      requesterAddress,
      {
        appAddress,
        datasetAddress,
        workerpoolAddress,
      },
    );
    this.deal.claim = (dealid) => deal.claim(contracts, dealid);
    this.deal.fetchDealsByApporder = (apporderHash) => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.APP_ORDER,
      contracts.chainId,
      apporderHash,
    );
    this.deal.fetchDealsByDatasetorder = (datasetorderHash) => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.DATASET_ORDER,
      contracts.chainId,
      datasetorderHash,
    );
    this.deal.fetchDealsByWorkerpoolorder = (workerpoolorderHash) => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.WORKERPOOL_ORDER,
      contracts.chainId,
      workerpoolorderHash,
    );
    this.deal.fetchDealsByRequestorder = (requestorderHash) => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.REQUEST_ORDER,
      contracts.chainId,
      requestorderHash,
    );
    this.order = {};
    this.order.createApporder = (overwrite) => order.createApporder(contracts, overwrite);
    this.order.createDatasetorder = (overwrite) => order.createDatasetorder(contracts, overwrite);
    this.order.createWorkerpoolorder = (overwrite) => order.createWorkerpoolorder(contracts, overwrite);
    this.order.createRequestorder = (overwrite) => order.createRequestorder(
      { contracts, resultProxyURL: getResultProxyURL() },
      overwrite,
    );
    this.order.hashApporder = (apporder) => order.hashApporder(contracts, apporder);
    this.order.hashDatasetorder = (datasetorder) => order.hashDatasetorder(contracts, datasetorder);
    this.order.hashWorkerpoolorder = (workerpoolorder) => order.hashWorkerpoolorder(contracts, workerpoolorder);
    this.order.hashRequestorder = (requestorder) => order.hashRequestorder(contracts, requestorder);
    this.order.signApporder = (apporder) => order.signApporder(contracts, apporder);
    this.order.signDatasetorder = (datasetorder) => order.signDatasetorder(contracts, datasetorder);
    this.order.signWorkerpoolorder = (workerpoolorder) => order.signWorkerpoolorder(contracts, workerpoolorder);
    this.order.signRequestorder = async (
      requestorder,
      { checkRequest = true } = {},
    ) => order.signRequestorder(
      contracts,
      checkRequest === true
        ? await checkRequestRequirements(
          {
            contracts,
            smsURL: getSmsURL(),
          },
          requestorder,
        ).then(() => requestorder)
        : requestorder,
    );
    this.order.cancelApporder = (signedApporder) => order.cancelApporder(contracts, signedApporder);
    this.order.cancelDatasetorder = (signedDatasetorder) => order.cancelDatasetorder(contracts, signedDatasetorder);
    this.order.cancelWorkerpoolorder = (signedWorkerpoolorder) => order.cancelWorkerpoolorder(contracts, signedWorkerpoolorder);
    this.order.cancelRequestorder = (signedRequestorder) => order.cancelRequestorder(contracts, signedRequestorder);
    this.order.publishApporder = (signedApporder) => order.publishApporder(contracts, getIexecGatewayURL(), signedApporder);
    this.order.publishDatasetorder = (signedDatasetorder) => order.publishDatasetorder(
      contracts,
      getIexecGatewayURL(),
      signedDatasetorder,
    );
    this.order.publishWorkerpoolorder = (signedWorkerpoolorder) => order.publishWorkerpoolorder(
      contracts,
      getIexecGatewayURL(),
      signedWorkerpoolorder,
    );
    this.order.publishRequestorder = async (
      signedRequestorder,
      { checkRequest = true } = {},
    ) => order.publishRequestorder(
      contracts,
      getIexecGatewayURL(),
      checkRequest === true
        ? await checkRequestRequirements(
          {
            contracts,
            smsURL: getSmsURL(),
          },
          signedRequestorder,
        ).then(() => signedRequestorder)
        : signedRequestorder,
    );
    this.order.unpublishApporder = (apporderHash) => order.unpublishApporder(contracts, getIexecGatewayURL(), apporderHash);
    this.order.unpublishDatasetorder = (datasetorderHash) => order.unpublishDatasetorder(
      contracts,
      getIexecGatewayURL(),
      datasetorderHash,
    );
    this.order.unpublishWorkerpoolorder = (workerpoolorderHash) => order.unpublishWorkerpoolorder(
      contracts,
      getIexecGatewayURL(),
      workerpoolorderHash,
    );
    this.order.unpublishRequestorder = (requestorderHash) => order.unpublishRequestorder(
      contracts,
      getIexecGatewayURL(),
      requestorderHash,
    );
    this.order.unpublishLastApporder = (appAddress) => order.unpublishLastApporder(contracts, getIexecGatewayURL(), appAddress);
    this.order.unpublishLastDatasetorder = (datasetAddress) => order.unpublishLastDatasetorder(
      contracts,
      getIexecGatewayURL(),
      datasetAddress,
    );
    this.order.unpublishLastWorkerpoolorder = (workerpoolAddress) => order.unpublishLastWorkerpoolorder(
      contracts,
      getIexecGatewayURL(),
      workerpoolAddress,
    );
    this.order.unpublishLastRequestorder = () => order.unpublishLastRequestorder(contracts, getIexecGatewayURL());
    this.order.unpublishAllApporders = (appAddress) => order.unpublishAllApporders(contracts, getIexecGatewayURL(), appAddress);
    this.order.unpublishAllDatasetorders = (datasetAddress) => order.unpublishAllDatasetorders(
      contracts,
      getIexecGatewayURL(),
      datasetAddress,
    );
    this.order.unpublishAllWorkerpoolorders = (workerpoolAddress) => order.unpublishAllWorkerpoolorders(
      contracts,
      getIexecGatewayURL(),
      workerpoolAddress,
    );
    this.order.unpublishAllRequestorders = () => order.unpublishAllRequestorders(contracts, getIexecGatewayURL());
    this.order.matchOrders = async (
      {
        apporder,
        datasetorder = order.NULL_DATASETORDER,
        workerpoolorder,
        requestorder,
      },
      { checkRequest = true } = {},
    ) => order.matchOrders(
      contracts,
      apporder,
      datasetorder,
      workerpoolorder,
      checkRequest === true
        ? await checkRequestRequirements(
          {
            contracts,
            smsURL: getSmsURL(),
          },
          requestorder,
        ).then(() => requestorder)
        : requestorder,
    );
    this.orderbook = {};
    this.orderbook.fetchApporder = (apporderHash) => order.fetchPublishedOrderByHash(
      getIexecGatewayURL(),
      order.APP_ORDER,
      contracts.chainId,
      apporderHash,
    );
    this.orderbook.fetchDatasetorder = (datasetorderHash) => order.fetchPublishedOrderByHash(
      getIexecGatewayURL(),
      order.DATASET_ORDER,
      contracts.chainId,
      datasetorderHash,
    );
    this.orderbook.fetchWorkerpoolorder = (workerpoolorderHash) => order.fetchPublishedOrderByHash(
      getIexecGatewayURL(),
      order.WORKERPOOL_ORDER,
      contracts.chainId,
      workerpoolorderHash,
    );
    this.orderbook.fetchRequestorder = (requestorderHash) => order.fetchPublishedOrderByHash(
      getIexecGatewayURL(),
      order.REQUEST_ORDER,
      contracts.chainId,
      requestorderHash,
    );
    this.orderbook.fetchAppOrderbook = (appAddress, options = {}) => orderbook.fetchAppOrderbook(
      contracts,
      getIexecGatewayURL(),
      appAddress,
      options,
    );
    this.orderbook.fetchDatasetOrderbook = (datasetAddress, options = {}) => orderbook.fetchDatasetOrderbook(
      contracts,
      getIexecGatewayURL(),
      datasetAddress,
      options,
    );
    this.orderbook.fetchWorkerpoolOrderbook = (...args) => {
      let options;
      if (args[0] !== undefined && typeof args[0] !== 'object') {
        console.warn(
          '[iexec] orderbook.fetchWorkerpoolOrderbook(category, options) is deprecated, use category as an option of orderbook.fetchWorkerpoolOrderbook(options)',
        );
        options = args[1] || {};
        [options.category] = args;
      } else {
        [options] = args;
      }
      if (options.workerpoolAddress) {
        console.warn(
          '[iexec] orderbook.fetchWorkerpoolOrderbook(options) workerpoolAddress option is deprecated, use workerpool',
        );
        options.workerpool = options.workerpoolAddress;
      }
      if (options.signerAddress) {
        console.warn(
          '[iexec] orderbook.fetchWorkerpoolOrderbook(options) signerAddress option is deprecated, use workerpoolOwner',
        );
        options.signerAddress = options.workerpoolOwner;
      }
      return orderbook.fetchWorkerpoolOrderbook(
        contracts,
        getIexecGatewayURL(),
        options,
      );
    };
    this.orderbook.fetchRequestOrderbook = (...args) => {
      let options;
      if (args[0] !== undefined && typeof args[0] !== 'object') {
        console.warn(
          '[iexec] orderbook.fetchRequestOrderbook(category, options) is deprecated, use category as an option of orderbook.fetchRequestOrderbook(options)',
        );
        options = args[1] || {};
        [options.category] = args;
      } else {
        [options] = args;
      }
      if (options.requesterAddress) {
        console.warn(
          '[iexec] orderbook.fetchRequestOrderbook(options) requesterAddress option is deprecated, use requester',
        );
        options.requester = options.requesterAddress;
      }
      if (options.beneficiaryAddress) {
        console.warn(
          '[iexec] orderbook.fetchRequestOrderbook(options) beneficiaryAddress option is deprecated, use beneficiary',
        );
        options.beneficiary = options.beneficiaryAddress;
      }
      return orderbook.fetchRequestOrderbook(
        contracts,
        getIexecGatewayURL(),
        options,
      );
    };
    this.task = {};
    this.task.show = (taskid) => task.show(contracts, taskid);
    this.task.obsTask = (taskid, { dealid } = {}) => iexecProcess.obsTask(contracts, taskid, { dealid });
    this.task.claim = (taskid) => task.claim(contracts, taskid);
    this.task.fetchResults = (taskid) => iexecProcess.fetchTaskResults(contracts, taskid, {
      ipfsGatewayURL: getIpfsGatewayURL(),
    });
    this.task.waitForTaskStatusChange = (taskid, initialStatus) => {
      console.warn(
        '[iexec] task.waitForTaskStatusChange(taskid, initialStatus) is deprecated, please use task.obsTask(taskid, { dealid })',
      );
      return task.waitForTaskStatusChange(contracts, taskid, initialStatus);
    };
    this.result = {};
    this.result.checkResultEncryptionKeyExists = (address) => secretMgtServ.checkWeb2SecretExists(
      contracts,
      getSmsURL(),
      address,
      getResultEncryptionKeyName(),
    );
    this.result.pushResultEncryptionKey = (
      publicKey,
      { forceUpdate = false } = {},
    ) => secretMgtServ.pushWeb2Secret(
      contracts,
      getSmsURL(),
      getResultEncryptionKeyName(),
      publicKey,
      { forceUpdate },
    );
    this.storage = {};
    this.storage.defaultStorageLogin = () => resultProxyServ.login(contracts, getResultProxyURL());
    this.storage.checkStorageTokenExists = (address, { provider } = {}) => secretMgtServ.checkWeb2SecretExists(
      contracts,
      getSmsURL(),
      address,
      getStorageTokenKeyName(provider),
    );
    this.storage.pushStorageToken = (
      token,
      { provider, forceUpdate = false } = {},
    ) => secretMgtServ.pushWeb2Secret(
      contracts,
      getSmsURL(),
      getStorageTokenKeyName(provider),
      token,
      { forceUpdate },
    );
    this.network = {};
    this.network.id = contracts.chainId;
    this.network.isSidechain = contracts.isNative;
  }
}

const sdk = {
  IExec,
  errors,
  utils,
};

module.exports = sdk;
