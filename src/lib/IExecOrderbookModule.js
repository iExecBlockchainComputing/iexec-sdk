import IExecModule from './IExecModule.js';
import { fetchPublishedOrderByHash } from '../common/market/marketplace.js';
import {
  fetchAppOrderbook,
  fetchDatasetOrderbook,
  fetchRequestOrderbook,
  fetchWorkerpoolOrderbook,
} from '../common/market/orderbook.js';
import {
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
} from '../common/utils/constant.js';

export default class IExecOrderbookModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.fetchApporder = async (apporderHash) =>
      fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        APP_ORDER,
        await this.config.resolveChainId(),
        apporderHash
      );
    this.fetchDatasetorder = async (datasetorderHash) =>
      fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        DATASET_ORDER,
        await this.config.resolveChainId(),
        datasetorderHash
      );
    this.fetchWorkerpoolorder = async (workerpoolorderHash) =>
      fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        WORKERPOOL_ORDER,
        await this.config.resolveChainId(),
        workerpoolorderHash
      );
    this.fetchRequestorder = async (requestorderHash) =>
      fetchPublishedOrderByHash(
        await this.config.resolveIexecGatewayURL(),
        REQUEST_ORDER,
        await this.config.resolveChainId(),
        requestorderHash
      );
    this.fetchAppOrderbook = async (appAddress, options = {}) =>
      fetchAppOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        appAddress,
        options
      );
    this.fetchDatasetOrderbook = async (datasetAddress, options = {}) =>
      fetchDatasetOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetAddress,
        options
      );
    this.fetchWorkerpoolOrderbook = async (options) =>
      fetchWorkerpoolOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        options
      );
    this.fetchRequestOrderbook = async (options) =>
      fetchRequestOrderbook(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        options
      );
  }
}
