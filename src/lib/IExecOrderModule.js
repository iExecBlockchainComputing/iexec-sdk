const IExecModule = require('./IExecModule');
const order = require('../common/modules/order');
const {
  checkRequestRequirements,
} = require('../common/modules/request-helper');

class IExecOrderModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.createApporder = async (overwrite) =>
      order.createApporder(await this.config.getContracts(), overwrite);
    this.createDatasetorder = async (overwrite) =>
      order.createDatasetorder(await this.config.getContracts(), overwrite);
    this.createWorkerpoolorder = async (overwrite) =>
      order.createWorkerpoolorder(await this.config.getContracts(), overwrite);
    this.createRequestorder = async (overwrite) =>
      order.createRequestorder(
        {
          contracts: await this.config.getContracts(),
          resultProxyURL: await this.config.getResultProxyURL(),
        },
        overwrite,
      );
    this.hashApporder = async (apporder) =>
      order.hashApporder(await this.config.getContracts(), apporder);
    this.hashDatasetorder = async (datasetorder) =>
      order.hashDatasetorder(await this.config.getContracts(), datasetorder);
    this.hashWorkerpoolorder = async (workerpoolorder) =>
      order.hashWorkerpoolorder(
        await this.config.getContracts(),
        workerpoolorder,
      );
    this.hashRequestorder = async (requestorder) =>
      order.hashRequestorder(await this.config.getContracts(), requestorder);
    this.signApporder = async (apporder) =>
      order.signApporder(await this.config.getContracts(), apporder);
    this.signDatasetorder = async (datasetorder) =>
      order.signDatasetorder(await this.config.getContracts(), datasetorder);
    this.signWorkerpoolorder = async (workerpoolorder) =>
      order.signWorkerpoolorder(
        await this.config.getContracts(),
        workerpoolorder,
      );
    this.signRequestorder = async (
      requestorder,
      { checkRequest = true } = {},
    ) =>
      order.signRequestorder(
        await this.config.getContracts(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await this.config.getContracts(),
                smsURL: await this.config.getSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
    this.cancelApporder = async (signedApporder) =>
      order.cancelApporder(await this.config.getContracts(), signedApporder);
    this.cancelDatasetorder = async (signedDatasetorder) =>
      order.cancelDatasetorder(
        await this.config.getContracts(),
        signedDatasetorder,
      );
    this.cancelWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.cancelWorkerpoolorder(
        await this.config.getContracts(),
        signedWorkerpoolorder,
      );
    this.cancelRequestorder = async (signedRequestorder) =>
      order.cancelRequestorder(
        await this.config.getContracts(),
        signedRequestorder,
      );
    this.publishApporder = async (signedApporder) =>
      order.publishApporder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        signedApporder,
      );
    this.publishDatasetorder = async (signedDatasetorder) =>
      order.publishDatasetorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        signedDatasetorder,
      );
    this.publishWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.publishWorkerpoolorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        signedWorkerpoolorder,
      );
    this.publishRequestorder = async (
      signedRequestorder,
      { checkRequest = true } = {},
    ) =>
      order.publishRequestorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await this.config.getContracts(),
                smsURL: await this.config.getSmsURL(),
              },
              signedRequestorder,
            ).then(() => signedRequestorder)
          : signedRequestorder,
      );
    this.unpublishApporder = async (apporderHash) =>
      order.unpublishApporder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        apporderHash,
      );
    this.unpublishDatasetorder = async (datasetorderHash) =>
      order.unpublishDatasetorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        datasetorderHash,
      );
    this.unpublishWorkerpoolorder = async (workerpoolorderHash) =>
      order.unpublishWorkerpoolorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        workerpoolorderHash,
      );
    this.unpublishRequestorder = async (requestorderHash) =>
      order.unpublishRequestorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        requestorderHash,
      );
    this.unpublishLastApporder = async (appAddress) =>
      order.unpublishLastApporder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        appAddress,
      );
    this.unpublishLastDatasetorder = async (datasetAddress) =>
      order.unpublishLastDatasetorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        datasetAddress,
      );
    this.unpublishLastWorkerpoolorder = async (workerpoolAddress) =>
      order.unpublishLastWorkerpoolorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.unpublishLastRequestorder = async () =>
      order.unpublishLastRequestorder(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
      );
    this.unpublishAllApporders = async (appAddress) =>
      order.unpublishAllApporders(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        appAddress,
      );
    this.unpublishAllDatasetorders = async (datasetAddress) =>
      order.unpublishAllDatasetorders(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        datasetAddress,
      );
    this.unpublishAllWorkerpoolorders = async (workerpoolAddress) =>
      order.unpublishAllWorkerpoolorders(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
        workerpoolAddress,
      );
    this.unpublishAllRequestorders = async () =>
      order.unpublishAllRequestorders(
        await this.config.getContracts(),
        await this.config.getIexecGatewayURL(),
      );
    this.matchOrders = async (
      {
        apporder,
        datasetorder = order.NULL_DATASETORDER,
        workerpoolorder,
        requestorder,
      },
      { checkRequest = true } = {},
    ) =>
      order.matchOrders(
        await this.config.getContracts(),
        apporder,
        datasetorder,
        workerpoolorder,
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await this.config.getContracts(),
                smsURL: await this.config.getSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
  }
}

module.exports = IExecOrderModule;
