const IExecModule = require('./IExecModule');
const deal = require('../common/modules/deal');
const order = require('../common/modules/order');
const iexecProcess = require('../common/modules/iexecProcess');

class IExecDealModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.show = async (dealid) =>
      deal.show(await this.config.getContracts(), dealid);
    this.obsDeal = async (dealid) =>
      iexecProcess.obsDeal(await this.config.getContracts(), dealid);
    this.computeTaskId = (dealid, taskIdx) =>
      deal.computeTaskId(dealid, taskIdx);
    this.fetchRequesterDeals = async (
      requesterAddress,
      { appAddress, datasetAddress, workerpoolAddress } = {},
    ) =>
      deal.fetchRequesterDeals(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        requesterAddress,
        {
          appAddress,
          datasetAddress,
          workerpoolAddress,
        },
      );
    this.claim = async (dealid) =>
      deal.claim(await this.config.getContracts(), dealid);
    this.fetchDealsByApporder = async (apporderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.getIexecGatewayURL(),
        order.APP_ORDER,
        await this.config.getChainId(),
        apporderHash,
      );
    this.fetchDealsByDatasetorder = async (datasetorderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.getIexecGatewayURL(),
        order.DATASET_ORDER,
        await this.config.getChainId(),
        datasetorderHash,
      );
    this.fetchDealsByWorkerpoolorder = async (workerpoolorderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.getIexecGatewayURL(),
        order.WORKERPOOL_ORDER,
        await this.config.getChainId(),
        workerpoolorderHash,
      );
    this.fetchDealsByRequestorder = async (requestorderHash) =>
      order.fetchDealsByOrderHash(
        await this.config.getIexecGatewayURL(),
        order.REQUEST_ORDER,
        await this.config.getChainId(),
        requestorderHash,
      );
  }
}

module.exports = IExecDealModule;
