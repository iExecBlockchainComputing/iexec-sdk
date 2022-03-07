const IExecModule = require('./IExecModule');
const order = require('../common/modules/order');
const orderbook = require('../common/modules/orderbook');

class IExecOrderbookModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.fetchApporder = async (apporderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        order.APP_ORDER,
        await this.config.resolveChainId(),
        apporderHash,
      );
    this.fetchDatasetorder = async (datasetorderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        order.DATASET_ORDER,
        await this.config.resolveChainId(),
        datasetorderHash,
      );
    this.fetchWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await this.config.resolveChainId(),
        workerpoolorderHash,
      );
    this.fetchRequestorder = async (requestorderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        order.REQUEST_ORDER,
        await this.config.resolveChainId(),
        requestorderHash,
      );
    this.fetchAppOrderbook = async (appAddress, options = {}) =>
      orderbook.fetchAppOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        appAddress,
        options,
      );
    this.fetchDatasetOrderbook = async (datasetAddress, options = {}) =>
      orderbook.fetchDatasetOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetAddress,
        options,
      );
    this.fetchWorkerpoolOrderbook = async (options) =>
      orderbook.fetchWorkerpoolOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        options,
      );
    this.fetchRequestOrderbook = async (options) =>
      orderbook.fetchRequestOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        options,
      );
  }
}

module.exports = IExecOrderbookModule;
