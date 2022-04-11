const IExecModule = require('./IExecModule');
const deal = require('../common/modules/deal');
const order = require('../common/modules/order');
const iexecProcess = require('../common/modules/iexecProcess');

class IExecDealModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.show = async (dealid) =>
      deal.show(await this.config.resolveContractsClient(), dealid);
    this.obsDeal = async (dealid) =>
      iexecProcess.obsDeal(await this.config.resolveContractsClient(), dealid);
    this.computeTaskId = (dealid, taskIdx) =>
      deal.computeTaskId(dealid, taskIdx);
    this.fetchRequesterDeals = async (
      requesterAddress,
      { appAddress, datasetAddress, workerpoolAddress } = {},
    ) =>
      deal.fetchRequesterDeals(
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
      deal.claim(await this.config.resolveContractsClient(), dealid);
    this.fetchDealsByApporder = async (apporderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        order.APP_ORDER,
        await this.config.resolveChainId(),
        apporderHash,
      );
    this.fetchDealsByDatasetorder = async (datasetorderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        order.DATASET_ORDER,
        await this.config.resolveChainId(),
        datasetorderHash,
      );
    this.fetchDealsByWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await this.config.resolveChainId(),
        workerpoolorderHash,
      );
    this.fetchDealsByRequestorder = async (requestorderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.resolveIexecGatewayURL(),
        order.REQUEST_ORDER,
        await this.config.resolveChainId(),
        requestorderHash,
      );
  }
}

module.exports = IExecDealModule;
