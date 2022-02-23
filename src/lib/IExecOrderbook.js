const IExecModule = require('./IExecModule');
const order = require('../common/modules/order');
const orderbook = require('../common/modules/orderbook');

class IExecOrderbookModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.fetchApporder = async (apporderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.getIexecGatewayURL(),
        order.APP_ORDER,
        await this.config.getChainId(),
        apporderHash,
      );
    this.fetchDatasetorder = async (datasetorderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.getIexecGatewayURL(),
        order.DATASET_ORDER,
        await this.config.getChainId(),
        datasetorderHash,
      );
    this.fetchWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await this.config.getChainId(),
        workerpoolorderHash,
      );
    this.fetchRequestorder = async (requestorderHash) =>
      order.fetchPublishedOrderByHash(
        await this.config.getIexecGatewayURL(),
        order.REQUEST_ORDER,
        await this.config.getChainId(),
        requestorderHash,
      );
    this.fetchAppOrderbook = async (appAddress, options = {}) =>
      orderbook.fetchAppOrderbook(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        appAddress,
        options,
      );
    this.fetchDatasetOrderbook = async (datasetAddress, options = {}) =>
      orderbook.fetchDatasetOrderbook(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        datasetAddress,
        options,
      );
    this.fetchWorkerpoolOrderbook = async (options) =>
      orderbook.fetchWorkerpoolOrderbook(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        options,
      );
    this.fetchRequestOrderbook = async (options) =>
      orderbook.fetchRequestOrderbook(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        options,
      );
  }
}

module.exports = IExecOrderbookModule;
