import IExecModule from './IExecModule.js';
import {
  show,
  computeTaskId,
  fetchDealsByOrderHash,
  fetchRequesterDeals,
  claim,
  obsDeal,
} from '../common/execution/deal.js';
import {
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
} from '../common/utils/constant.js';

export default class IExecDealModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.show = async (dealid) =>
      show(await this.config.resolveContractsClient(), dealid);
    this.obsDeal = async (dealid) =>
      obsDeal(await this.config.resolveContractsClient(), dealid);
    this.computeTaskId = (dealid, taskIdx) => computeTaskId(dealid, taskIdx);
    this.fetchRequesterDeals = async (
      requesterAddress,
      { appAddress, datasetAddress, workerpoolAddress } = {},
    ) =>
      fetchRequesterDeals(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        requesterAddress,
        {
          appAddress,
          datasetAddress,
          workerpoolAddress,
        },
      );
    this.claim = async (dealid) =>
      claim(await this.config.resolveContractsClient(), dealid);
    this.fetchDealsByApporder = async (apporderHash) =>
      fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        APP_ORDER,
        await this.config.resolveChainId(),
        apporderHash,
      );
    this.fetchDealsByDatasetorder = async (datasetorderHash) =>
      fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        DATASET_ORDER,
        await this.config.resolveChainId(),
        datasetorderHash,
      );
    this.fetchDealsByWorkerpoolorder = async (workerpoolorderHash) =>
      fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        WORKERPOOL_ORDER,
        await this.config.resolveChainId(),
        workerpoolorderHash,
      );
    this.fetchDealsByRequestorder = async (requestorderHash) =>
      fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        REQUEST_ORDER,
        await this.config.resolveChainId(),
        requestorderHash,
      );
  }
}
