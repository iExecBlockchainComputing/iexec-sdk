const IExecConfig = require('./IExecConfig');
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
const { getSignerFromPrivateKey } = require('../common/utils/signers');

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
    const config = new IExecConfig(
      { ethProvider, flavour },
      {
        hubAddress,
        ensRegistryAddress,
        ensPublicResolverAddress,
        isNative,
        useGas,
        confirms,
        bridgeAddress,
        bridgedNetworkConf,
        enterpriseSwapConf,
        resultProxyURL,
        smsURL,
        ipfsGatewayURL,
        iexecGatewayURL,
      },
    );

    this.wallet = {};
    this.wallet.getAddress = async () =>
      wallet.getAddress(await config.getContracts());
    this.wallet.checkBalances = async (address) =>
      wallet.checkBalances(await config.getContracts(), address);
    this.wallet.checkBridgedBalances = async (address) =>
      wallet.checkBalances(await config.getBridgedContracts(), address);
    this.wallet.sendETH = async (weiAmount, to) =>
      wallet.sendETH(await config.getContracts(), weiAmount, to);
    this.wallet.sendRLC = async (nRlcAmount, to) =>
      wallet.sendRLC(await config.getContracts(), nRlcAmount, to);
    this.wallet.sweep = async (to) =>
      wallet.sweep(await config.getContracts(), to);
    this.wallet.bridgeToSidechain = async (nRlcAmount) =>
      wallet.bridgeToSidechain(
        await config.getContracts(),
        await config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await config.getBridgedContracts(),
          sidechainBridgeAddress: await config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.wallet.bridgeToMainchain = async (nRlcAmount) =>
      wallet.bridgeToMainchain(
        await config.getContracts(),
        await config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await config.getBridgedContracts(),
          mainchainBridgeAddress: await config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.wallet.obsBridgeToSidechain = async (nRlcAmount) =>
      wallet.obsBridgeToSidechain(
        await config.getContracts(),
        await config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await config.getBridgedContracts(),
          sidechainBridgeAddress: await config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.wallet.obsBridgeToMainchain = async (nRlcAmount) =>
      wallet.obsBridgeToMainchain(
        await config.getContracts(),
        await config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await config.getBridgedContracts(),
          mainchainBridgeAddress: await config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.wallet.wrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.wrapEnterpriseRLC(
        await config.getStandardContracts(),
        await config.getEnterpriseContracts(),
        nRlcAmount,
      );
    this.wallet.unwrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.unwrapEnterpriseRLC(
        await config.getEnterpriseContracts(),
        nRlcAmount,
      );
    this.account = {};
    this.account.checkBalance = async (address) =>
      account.checkBalance(await config.getContracts(), address);
    this.account.checkBridgedBalance = async (address) =>
      account.checkBalance(await config.getBridgedContracts(), address);
    this.account.deposit = async (nRlcAmount) =>
      account.deposit(await config.getContracts(), nRlcAmount);
    this.account.withdraw = async (nRlcAmount) =>
      account.withdraw(await config.getContracts(), nRlcAmount);
    this.app = {};
    this.app.deployApp = async (app) =>
      hub.deployApp(await config.getContracts(), app);
    this.app.showApp = async (address) =>
      hub.showApp(await config.getContracts(), address);
    this.app.showUserApp = async (index, userAddress) =>
      hub.showUserApp(await config.getContracts(), index, userAddress);
    this.app.countUserApps = async (address) =>
      hub.countUserApps(await config.getContracts(), address);
    this.dataset = {};
    this.dataset.generateEncryptionKey = () => generateAes256Key();
    this.dataset.encrypt = (datasetFile, encryptionKey) =>
      encryptAes256Cbc(datasetFile, encryptionKey);
    this.dataset.computeEncryptedFileChecksum = (encryptedFile) =>
      sha256Sum(encryptedFile);
    this.dataset.deployDataset = async (dataset) =>
      hub.deployDataset(await config.getContracts(), dataset);
    this.dataset.showDataset = async (address) =>
      hub.showDataset(await config.getContracts(), address);
    this.dataset.showUserDataset = async (index, userAddress) =>
      hub.showUserDataset(await config.getContracts(), index, userAddress);
    this.dataset.countUserDatasets = async (address) =>
      hub.countUserDatasets(await config.getContracts(), address);
    this.dataset.checkDatasetSecretExists = async (datasetAddress) =>
      secretMgtServ.checkWeb3SecretExists(
        await config.getContracts(),
        await config.getSmsURL(),
        datasetAddress,
      );
    this.dataset.pushDatasetSecret = async (datasetAddress, datasetSecret) =>
      secretMgtServ.pushWeb3Secret(
        await config.getContracts(),
        await config.getSmsURL(),
        datasetAddress,
        datasetSecret,
      );
    this.workerpool = {};
    this.workerpool.deployWorkerpool = async (workerpool) =>
      hub.deployWorkerpool(await config.getContracts(), workerpool);
    this.workerpool.showWorkerpool = async (address) =>
      hub.showWorkerpool(await config.getContracts(), address);
    this.workerpool.showUserWorkerpool = async (index, userAddress) =>
      hub.showUserWorkerpool(await config.getContracts(), index, userAddress);
    this.workerpool.countUserWorkerpools = async (address) =>
      hub.countUserWorkerpools(await config.getContracts(), address);
    this.hub = {};
    this.hub.createCategory = async (category) =>
      hub.createCategory(await config.getContracts(), category);
    this.hub.showCategory = async (index) =>
      hub.showCategory(await config.getContracts(), index);
    this.hub.countCategory = async () =>
      hub.countCategory(await config.getContracts());
    this.hub.getTimeoutRatio = async () =>
      hub.getTimeoutRatio(await config.getContracts());
    this.deal = {};
    this.deal.show = async (dealid) =>
      deal.show(await config.getContracts(), dealid);
    this.deal.obsDeal = async (dealid) =>
      iexecProcess.obsDeal(await config.getContracts(), dealid);
    this.deal.computeTaskId = (dealid, taskIdx) =>
      deal.computeTaskId(dealid, taskIdx);
    this.deal.fetchRequesterDeals = async (
      requesterAddress,
      { appAddress, datasetAddress, workerpoolAddress } = {},
    ) =>
      deal.fetchRequesterDeals(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        requesterAddress,
        {
          appAddress,
          datasetAddress,
          workerpoolAddress,
        },
      );
    this.deal.claim = async (dealid) =>
      deal.claim(await config.getContracts(), dealid);
    this.deal.fetchDealsByApporder = async (apporderHash) =>
      order.fetchDealsByOrderHash(
        await config.getIexecGatewayURL(),
        order.APP_ORDER,
        await config.getChainId(),
        apporderHash,
      );
    this.deal.fetchDealsByDatasetorder = async (datasetorderHash) =>
      order.fetchDealsByOrderHash(
        await config.getIexecGatewayURL(),
        order.DATASET_ORDER,
        await config.getChainId(),
        datasetorderHash,
      );
    this.deal.fetchDealsByWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchDealsByOrderHash(
        await config.getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await config.getChainId(),
        workerpoolorderHash,
      );
    this.deal.fetchDealsByRequestorder = async (requestorderHash) =>
      order.fetchDealsByOrderHash(
        await config.getIexecGatewayURL(),
        order.REQUEST_ORDER,
        await config.getChainId(),
        requestorderHash,
      );
    this.order = {};
    this.order.createApporder = async (overwrite) =>
      order.createApporder(await config.getContracts(), overwrite);
    this.order.createDatasetorder = async (overwrite) =>
      order.createDatasetorder(await config.getContracts(), overwrite);
    this.order.createWorkerpoolorder = async (overwrite) =>
      order.createWorkerpoolorder(await config.getContracts(), overwrite);
    this.order.createRequestorder = async (overwrite) =>
      order.createRequestorder(
        {
          contracts: await config.getContracts(),
          resultProxyURL: await config.getResultProxyURL(),
        },
        overwrite,
      );
    this.order.hashApporder = async (apporder) =>
      order.hashApporder(await config.getContracts(), apporder);
    this.order.hashDatasetorder = async (datasetorder) =>
      order.hashDatasetorder(await config.getContracts(), datasetorder);
    this.order.hashWorkerpoolorder = async (workerpoolorder) =>
      order.hashWorkerpoolorder(await config.getContracts(), workerpoolorder);
    this.order.hashRequestorder = async (requestorder) =>
      order.hashRequestorder(await config.getContracts(), requestorder);
    this.order.signApporder = async (apporder) =>
      order.signApporder(await config.getContracts(), apporder);
    this.order.signDatasetorder = async (datasetorder) =>
      order.signDatasetorder(await config.getContracts(), datasetorder);
    this.order.signWorkerpoolorder = async (workerpoolorder) =>
      order.signWorkerpoolorder(await config.getContracts(), workerpoolorder);
    this.order.signRequestorder = async (
      requestorder,
      { checkRequest = true } = {},
    ) =>
      order.signRequestorder(
        await config.getContracts(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await config.getContracts(),
                smsURL: await config.getSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
    this.order.cancelApporder = async (signedApporder) =>
      order.cancelApporder(await config.getContracts(), signedApporder);
    this.order.cancelDatasetorder = async (signedDatasetorder) =>
      order.cancelDatasetorder(await config.getContracts(), signedDatasetorder);
    this.order.cancelWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.cancelWorkerpoolorder(
        await config.getContracts(),
        signedWorkerpoolorder,
      );
    this.order.cancelRequestorder = async (signedRequestorder) =>
      order.cancelRequestorder(await config.getContracts(), signedRequestorder);
    this.order.publishApporder = async (signedApporder) =>
      order.publishApporder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        signedApporder,
      );
    this.order.publishDatasetorder = async (signedDatasetorder) =>
      order.publishDatasetorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        signedDatasetorder,
      );
    this.order.publishWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.publishWorkerpoolorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        signedWorkerpoolorder,
      );
    this.order.publishRequestorder = async (
      signedRequestorder,
      { checkRequest = true } = {},
    ) =>
      order.publishRequestorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await config.getContracts(),
                smsURL: await config.getSmsURL(),
              },
              signedRequestorder,
            ).then(() => signedRequestorder)
          : signedRequestorder,
      );
    this.order.unpublishApporder = async (apporderHash) =>
      order.unpublishApporder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        apporderHash,
      );
    this.order.unpublishDatasetorder = async (datasetorderHash) =>
      order.unpublishDatasetorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        datasetorderHash,
      );
    this.order.unpublishWorkerpoolorder = async (workerpoolorderHash) =>
      order.unpublishWorkerpoolorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        workerpoolorderHash,
      );
    this.order.unpublishRequestorder = async (requestorderHash) =>
      order.unpublishRequestorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        requestorderHash,
      );
    this.order.unpublishLastApporder = async (appAddress) =>
      order.unpublishLastApporder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        appAddress,
      );
    this.order.unpublishLastDatasetorder = async (datasetAddress) =>
      order.unpublishLastDatasetorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        datasetAddress,
      );
    this.order.unpublishLastWorkerpoolorder = async (workerpoolAddress) =>
      order.unpublishLastWorkerpoolorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.order.unpublishLastRequestorder = async () =>
      order.unpublishLastRequestorder(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
      );
    this.order.unpublishAllApporders = async (appAddress) =>
      order.unpublishAllApporders(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        appAddress,
      );
    this.order.unpublishAllDatasetorders = async (datasetAddress) =>
      order.unpublishAllDatasetorders(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        datasetAddress,
      );
    this.order.unpublishAllWorkerpoolorders = async (workerpoolAddress) =>
      order.unpublishAllWorkerpoolorders(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.order.unpublishAllRequestorders = async () =>
      order.unpublishAllRequestorders(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
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
        await config.getContracts(),
        apporder,
        datasetorder,
        workerpoolorder,
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await config.getContracts(),
                smsURL: await config.getSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
    this.orderbook = {};
    this.orderbook.fetchApporder = async (apporderHash) =>
      order.fetchPublishedOrderByHash(
        await config.getIexecGatewayURL(),
        order.APP_ORDER,
        await config.getChainId(),
        apporderHash,
      );
    this.orderbook.fetchDatasetorder = async (datasetorderHash) =>
      order.fetchPublishedOrderByHash(
        await config.getIexecGatewayURL(),
        order.DATASET_ORDER,
        await config.getChainId(),
        datasetorderHash,
      );
    this.orderbook.fetchWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchPublishedOrderByHash(
        await config.getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await config.getChainId(),
        workerpoolorderHash,
      );
    this.orderbook.fetchRequestorder = async (requestorderHash) =>
      order.fetchPublishedOrderByHash(
        await config.getIexecGatewayURL(),
        order.REQUEST_ORDER,
        await config.getChainId(),
        requestorderHash,
      );
    this.orderbook.fetchAppOrderbook = async (appAddress, options = {}) =>
      orderbook.fetchAppOrderbook(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        appAddress,
        options,
      );
    this.orderbook.fetchDatasetOrderbook = async (
      datasetAddress,
      options = {},
    ) =>
      orderbook.fetchDatasetOrderbook(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        datasetAddress,
        options,
      );
    this.orderbook.fetchWorkerpoolOrderbook = async (options) =>
      orderbook.fetchWorkerpoolOrderbook(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        options,
      );
    this.orderbook.fetchRequestOrderbook = async (options) =>
      orderbook.fetchRequestOrderbook(
        await config.getContracts(),
        await config.getIexecGatewayURL(),
        options,
      );
    this.task = {};
    this.task.show = async (taskid) =>
      task.show(await config.getContracts(), taskid);
    this.task.obsTask = async (taskid, { dealid } = {}) =>
      iexecProcess.obsTask(await config.getContracts(), taskid, { dealid });
    this.task.claim = async (taskid) =>
      task.claim(await config.getContracts(), taskid);
    this.task.fetchResults = async (taskid) =>
      iexecProcess.fetchTaskResults(await config.getContracts(), taskid, {
        ipfsGatewayURL: await config.getIpfsGatewayURL(),
      });
    this.result = {};
    this.result.checkResultEncryptionKeyExists = async (address) =>
      secretMgtServ.checkWeb2SecretExists(
        await config.getContracts(),
        await config.getSmsURL(),
        address,
        getResultEncryptionKeyName(),
      );
    this.result.pushResultEncryptionKey = async (
      publicKey,
      { forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await config.getContracts(),
        await config.getSmsURL(),
        getResultEncryptionKeyName(),
        publicKey,
        { forceUpdate },
      );
    this.storage = {};
    this.storage.defaultStorageLogin = async () =>
      resultProxyServ.login(
        await config.getContracts(),
        await config.getResultProxyURL(),
      );
    this.storage.checkStorageTokenExists = async (address, { provider } = {}) =>
      secretMgtServ.checkWeb2SecretExists(
        await config.getContracts(),
        await config.getSmsURL(),
        address,
        getStorageTokenKeyName(provider),
      );
    this.storage.pushStorageToken = async (
      token,
      { provider, forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await config.getContracts(),
        await config.getSmsURL(),
        getStorageTokenKeyName(provider),
        token,
        { forceUpdate },
      );
    this.ens = {};
    this.ens.getOwner = async (name) =>
      ens.getOwner(await config.getContracts(), name);
    this.ens.resolveName = async (name) =>
      ens.resolveName(await config.getContracts(), name);
    this.ens.lookupAddress = async (address) =>
      ens.lookupAddress(await config.getContracts(), address);
    this.ens.claimName = async (label, domain) =>
      ens.registerFifsEns(await config.getContracts(), label, domain);
    this.ens.obsConfigureResolution = async (name, address) =>
      ens.obsConfigureResolution(
        await config.getContracts(),
        await config.getEnsPublicResolverAddress(),
        name,
        address,
      );
    this.ens.configureResolution = async (name, address) =>
      ens.configureResolution(
        await config.getContracts(),
        await config.getEnsPublicResolverAddress(),
        name,
        address,
      );
    this.network = {};
    this.network.getNetwork = async () => {
      const contracts = await config.getContracts();
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
