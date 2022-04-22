const IExecModule = require('./IExecModule');
const {
  show,
  computeTaskId,
  fetchDealsByOrderHash,
  fetchRequesterDeals,
  claim,
} = require('../common/modules/deal');
const { obsDeal } = require('../common/modules/iexecProcess');
const {
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
} = require('../common/utils/constant');

class IExecDealModule extends IExecModule {
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

module.exports = IExecDealModule;
