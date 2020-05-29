const createIExecContracts = require('iexec-contracts-js-client');
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
const { getSignerFromPrivateKey } = require('./sig-utils');
const { IEXEC_GATEWAY_URL } = require('./api-utils');

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
    { ethProvider, chainId },
    {
      hubAddress,
      isNative,
      bridgeAddress,
      bridgedNetworkConf,
      resultProxyURL,
      smsURL,
      iexecGatewayURL,
    } = {},
  ) {
    const contracts = createIExecContracts({
      ethProvider,
      chainId,
      hubAddress,
      isNative,
    });
    let bridgedContracts;
    if (bridgedNetworkConf) {
      const bridgedChainId = bridgedNetworkConf.chainId;
      if (!chainId) {
        throw new errors.ValidationError(
          'Missing chainId in bridgedNetworkConf',
        );
      }
      const bridgedHubAddress = bridgedNetworkConf.hubAddress;
      const bridgedRpcURL = bridgedNetworkConf.rpcURL;
      if (!bridgedRpcURL) {
        throw new errors.ValidationError(
          'Missing RpcURL in bridgedNetworkConf',
        );
      }
      const bridgedBridgeAddress = bridgedNetworkConf.bridgeAddress;
      if (!bridgedBridgeAddress) {
        throw new errors.ValidationError(
          'Missing bridgeAddress in bridgedNetworkConf',
        );
      }
      const bridgedIsNative = !contracts.isNative;
      const bridgedProvider = bridgedRpcURL;
      bridgedContracts = createIExecContracts({
        chainId: bridgedChainId,
        isNative: bridgedIsNative,
        hubAddress: bridgedHubAddress,
        ethProvider: bridgedProvider,
      });
    }

    const getSmsURL = () => {
      if (smsURL) {
        return smsURL;
      }
      throw Error(
        `smsURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getResultProxyURL = () => {
      if (resultProxyURL) {
        return resultProxyURL;
      }
      throw Error(
        `resultProxyURL option not set and no default value for your chain ${chainId}`,
      );
    };

    const getIexecGatewayURL = () => {
      if (iexecGatewayURL) {
        return iexecGatewayURL;
      }
      return IEXEC_GATEWAY_URL;
    };

    this.wallet = {};
    this.wallet.getAddress = () => wallet.getAddress(contracts);
    this.wallet.checkBalances = address => wallet.checkBalances(contracts, address);
    this.wallet.checkBridgedBalances = address => wallet.checkBalances(bridgedContracts, address);
    this.wallet.sendETH = (weiAmount, to) => wallet.sendETH(contracts, weiAmount, to);
    this.wallet.sendRLC = (nRlcAmount, to) => wallet.sendRLC(contracts, nRlcAmount, to);
    this.wallet.sweep = to => wallet.sweep(contracts, to);
    this.wallet.bridgeToSidechain = nRlcAmount => wallet.bridgeToSidechain(contracts, bridgeAddress, nRlcAmount, {
      bridgedContracts,
      sidechainBridgeAddress:
          bridgedNetworkConf && bridgedNetworkConf.bridgeAddress,
    });
    this.wallet.bridgeToMainchain = nRlcAmount => wallet.bridgeToMainchain(contracts, bridgeAddress, nRlcAmount, {
      bridgedContracts,
      mainchainBridgeAddress:
          bridgedNetworkConf && bridgedNetworkConf.bridgeAddress,
    });
    this.account = {};
    this.account.checkBalance = address => account.checkBalance(contracts, address);
    this.account.checkBridgedBalance = address => account.checkBalance(bridgedContracts, address);
    this.account.deposit = nRlcAmount => account.deposit(contracts, nRlcAmount);
    this.account.withdraw = nRlcAmount => account.withdraw(contracts, nRlcAmount);
    this.app = {};
    this.app.deployApp = app => hub.deployApp(contracts, app);
    this.app.showApp = address => hub.showApp(contracts, address);
    this.app.showUserApp = (index, userAddress) => hub.showUserApp(contracts, index, userAddress);
    this.app.countUserApps = address => hub.countUserApps(contracts, address);
    this.dataset = {};
    this.dataset.deployDataset = dataset => hub.deployDataset(contracts, dataset);
    this.dataset.showDataset = address => hub.showDataset(contracts, address);
    this.dataset.showUserDataset = (index, userAddress) => hub.showUserDataset(contracts, index, userAddress);
    this.dataset.countUserDatasets = address => hub.countUserDatasets(contracts, address);
    this.dataset.checkDatasetSecretExists = datasetAddress => secretMgtServ.checkWeb3SecretExists(
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
    this.workerpool.deployWorkerpool = workerpool => hub.deployWorkerpool(contracts, workerpool);
    this.workerpool.showWorkerpool = address => hub.showWorkerpool(contracts, address);
    this.workerpool.showUserWorkerpool = (index, userAddress) => hub.showUserWorkerpool(contracts, index, userAddress);
    this.workerpool.countUserWorkerpools = address => hub.countUserWorkerpools(contracts, address);
    this.hub = {};
    this.hub.createCategory = category => hub.createCategory(contracts, category);
    this.hub.showCategory = index => hub.showCategory(contracts, index);
    this.hub.countCategory = () => hub.countCategory(contracts);
    this.hub.getTimeoutRatio = () => hub.getTimeoutRatio(contracts);
    this.deal = {};
    this.deal.show = dealid => deal.show(contracts, dealid);
    this.deal.obsDeal = dealid => iexecProcess.obsDeal(contracts, dealid);
    this.deal.computeTaskId = (dealid, taskIdx) => deal.computeTaskId(dealid, taskIdx);
    this.deal.fetchRequesterDeals = (
      requesterAddress,
      {
        appAddress, datasetAddress, workerpoolAddress, beforeTimestamp,
      } = {},
    ) => deal.fetchRequesterDeals(
      contracts,
      getIexecGatewayURL(),
      requesterAddress,
      {
        appAddress,
        datasetAddress,
        workerpoolAddress,
        beforeTimestamp,
      },
    );
    this.deal.claim = dealid => deal.claim(contracts, dealid);
    this.deal.fetchDealsByApporder = apporderHash => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.APP_ORDER,
      contracts.chainId,
      apporderHash,
    );
    this.deal.fetchDealsByDatasetorder = datasetorderHash => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.DATASET_ORDER,
      contracts.chainId,
      datasetorderHash,
    );
    this.deal.fetchDealsByWorkerpoolorder = workerpoolorderHash => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.WORKERPOOL_ORDER,
      contracts.chainId,
      workerpoolorderHash,
    );
    this.deal.fetchDealsByRequestorder = requestorderHash => order.fetchDealsByOrderHash(
      getIexecGatewayURL(),
      order.REQUEST_ORDER,
      contracts.chainId,
      requestorderHash,
    );
    this.order = {};
    this.order.createApporder = overwrite => order.createApporder(contracts, overwrite);
    this.order.createDatasetorder = overwrite => order.createDatasetorder(contracts, overwrite);
    this.order.createWorkerpoolorder = overwrite => order.createWorkerpoolorder(contracts, overwrite);
    this.order.createRequestorder = overwrite => order.createRequestorder(
      { contracts, resultProxyURL: getResultProxyURL() },
      overwrite,
    );
    this.order.hashApporder = apporder => order.hashApporder(contracts, apporder);
    this.order.hashDatasetorder = datasetorder => order.hashDatasetorder(contracts, datasetorder);
    this.order.hashWorkerpoolorder = workerpoolorder => order.hashWorkerpoolorder(contracts, workerpoolorder);
    this.order.hashRequestorder = requestorder => order.hashRequestorder(contracts, requestorder);
    this.order.signApporder = apporder => order.signApporder(contracts, apporder);
    this.order.signDatasetorder = datasetorder => order.signDatasetorder(contracts, datasetorder);
    this.order.signWorkerpoolorder = workerpoolorder => order.signWorkerpoolorder(contracts, workerpoolorder);
    this.order.signRequestorder = async (
      requestorder,
      { checkRequest = false } = {},
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
    this.order.cancelApporder = signedApporder => order.cancelApporder(contracts, signedApporder);
    this.order.cancelDatasetorder = signedDatasetorder => order.cancelDatasetorder(contracts, signedDatasetorder);
    this.order.cancelWorkerpoolorder = signedWorkerpoolorder => order.cancelWorkerpoolorder(contracts, signedWorkerpoolorder);
    this.order.cancelRequestorder = signedRequestorder => order.cancelRequestorder(contracts, signedRequestorder);
    this.order.publishApporder = signedApporder => order.publishApporder(contracts, getIexecGatewayURL(), signedApporder);
    this.order.publishDatasetorder = signedDatasetorder => order.publishDatasetorder(
      contracts,
      getIexecGatewayURL(),
      signedDatasetorder,
    );
    this.order.publishWorkerpoolorder = signedWorkerpoolorder => order.publishWorkerpoolorder(
      contracts,
      getIexecGatewayURL(),
      signedWorkerpoolorder,
    );
    this.order.publishRequestorder = signedRequestorder => order.publishRequestorder(
      contracts,
      getIexecGatewayURL(),
      signedRequestorder,
    );
    this.order.unpublishApporder = apporderHash => order.unpublishApporder(contracts, getIexecGatewayURL(), apporderHash);
    this.order.unpublishDatasetorder = datasetorderHash => order.unpublishDatasetorder(
      contracts,
      getIexecGatewayURL(),
      datasetorderHash,
    );
    this.order.unpublishWorkerpoolorder = workerpoolorderHash => order.unpublishWorkerpoolorder(
      contracts,
      getIexecGatewayURL(),
      workerpoolorderHash,
    );
    this.order.unpublishRequestorder = requestorderHash => order.unpublishRequestorder(
      contracts,
      getIexecGatewayURL(),
      requestorderHash,
    );
    this.order.matchOrders = async (
      {
        apporder,
        datasetorder = order.NULL_DATASETORDER,
        workerpoolorder,
        requestorder,
      },
      { checkRequest = false } = {},
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
    this.orderbook.fetchApporder = apporderHash => order.fetchPublishedOrderByHash(
      getIexecGatewayURL(),
      order.APP_ORDER,
      contracts.chainId,
      apporderHash,
    );
    this.orderbook.fetchDatasetorder = datasetorderHash => order.fetchPublishedOrderByHash(
      getIexecGatewayURL(),
      order.DATASET_ORDER,
      contracts.chainId,
      datasetorderHash,
    );
    this.orderbook.fetchWorkerpoolorder = workerpoolorderHash => order.fetchPublishedOrderByHash(
      getIexecGatewayURL(),
      order.WORKERPOOL_ORDER,
      contracts.chainId,
      workerpoolorderHash,
    );
    this.orderbook.fetchRequestorder = requestorderHash => order.fetchPublishedOrderByHash(
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
    this.orderbook.fetchWorkerpoolOrderbook = (category, options = {}) => orderbook.fetchWorkerpoolOrderbook(
      contracts,
      getIexecGatewayURL(),
      category,
      options,
    );
    this.orderbook.fetchRequestOrderbook = (category, options = {}) => orderbook.fetchRequestOrderbook(
      contracts,
      getIexecGatewayURL(),
      category,
      options,
    );
    this.task = {};
    this.task.show = taskid => task.show(contracts, taskid);
    this.task.obsTask = (taskid, { dealid } = {}) => iexecProcess.obsTask(contracts, taskid, { dealid });
    this.task.claim = taskid => task.claim(contracts, taskid);
    this.task.fetchResults = (taskid, { ipfsGatewayURL } = {}) => iexecProcess.fetchTaskResults(contracts, taskid, { ipfsGatewayURL });
    this.task.waitForTaskStatusChange = (taskid, initialStatus) => {
      console.warn(
        '[iexec] task.waitForTaskStatusChange(taskid, initialStatus) is deprecated, please use task.obsTask(taskid, { dealid })',
      );
      return task.waitForTaskStatusChange(contracts, taskid, initialStatus);
    };
    this.result = {};
    this.result.checkResultEncryptionKeyExists = address => secretMgtServ.checkWeb2SecretExists(
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
