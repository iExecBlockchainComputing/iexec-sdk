const IExecModule = require('./IExecModule');
const order = require('../common/modules/order');
const {
  checkRequestRequirements,
} = require('../common/modules/request-helper');

class IExecOrderModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.createApporder = async (overwrite) =>
      order.createApporder(
        await this.config.resolveContractsClient(),
        overwrite,
      );
    this.createDatasetorder = async (overwrite) =>
      order.createDatasetorder(
        await this.config.resolveContractsClient(),
        overwrite,
      );
    this.createWorkerpoolorder = async (overwrite) =>
      order.createWorkerpoolorder(
        await this.config.resolveContractsClient(),
        overwrite,
      );
    this.createRequestorder = async (overwrite) =>
      order.createRequestorder(
        {
          contracts: await this.config.resolveContractsClient(),
          resultProxyURL: await this.config.resolveResultProxyURL(),
        },
        overwrite,
      );
    this.hashApporder = async (apporder) =>
      order.hashApporder(await this.config.resolveContractsClient(), apporder);
    this.hashDatasetorder = async (datasetorder) =>
      order.hashDatasetorder(
        await this.config.resolveContractsClient(),
        datasetorder,
      );
    this.hashWorkerpoolorder = async (workerpoolorder) =>
      order.hashWorkerpoolorder(
        await this.config.resolveContractsClient(),
        workerpoolorder,
      );
    this.hashRequestorder = async (requestorder) =>
      order.hashRequestorder(
        await this.config.resolveContractsClient(),
        requestorder,
      );
    this.signApporder = async (apporder) =>
      order.signApporder(await this.config.resolveContractsClient(), apporder);
    this.signDatasetorder = async (datasetorder) =>
      order.signDatasetorder(
        await this.config.resolveContractsClient(),
        datasetorder,
      );
    this.signWorkerpoolorder = async (workerpoolorder) =>
      order.signWorkerpoolorder(
        await this.config.resolveContractsClient(),
        workerpoolorder,
      );
    this.signRequestorder = async (
      requestorder,
      { checkRequest = true } = {},
    ) =>
      order.signRequestorder(
        await this.config.resolveContractsClient(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
                smsURL: await this.config.resolveSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
    this.cancelApporder = async (signedApporder) =>
      order.cancelApporder(
        await this.config.resolveContractsClient(),
        signedApporder,
      );
    this.cancelDatasetorder = async (signedDatasetorder) =>
      order.cancelDatasetorder(
        await this.config.resolveContractsClient(),
        signedDatasetorder,
      );
    this.cancelWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.cancelWorkerpoolorder(
        await this.config.resolveContractsClient(),
        signedWorkerpoolorder,
      );
    this.cancelRequestorder = async (signedRequestorder) =>
      order.cancelRequestorder(
        await this.config.resolveContractsClient(),
        signedRequestorder,
      );
    this.publishApporder = async (signedApporder) =>
      order.publishApporder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        signedApporder,
      );
    this.publishDatasetorder = async (signedDatasetorder) =>
      order.publishDatasetorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        signedDatasetorder,
      );
    this.publishWorkerpoolorder = async (signedWorkerpoolorder) =>
      order.publishWorkerpoolorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        signedWorkerpoolorder,
      );
    this.publishRequestorder = async (
      signedRequestorder,
      { checkRequest = true } = {},
    ) =>
      order.publishRequestorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
                smsURL: await this.config.resolveSmsURL(),
              },
              signedRequestorder,
            ).then(() => signedRequestorder)
          : signedRequestorder,
      );
    this.unpublishApporder = async (apporderHash) =>
      order.unpublishApporder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        apporderHash,
      );
    this.unpublishDatasetorder = async (datasetorderHash) =>
      order.unpublishDatasetorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetorderHash,
      );
    this.unpublishWorkerpoolorder = async (workerpoolorderHash) =>
      order.unpublishWorkerpoolorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        workerpoolorderHash,
      );
    this.unpublishRequestorder = async (requestorderHash) =>
      order.unpublishRequestorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        requestorderHash,
      );
    this.unpublishLastApporder = async (appAddress) =>
      order.unpublishLastApporder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        appAddress,
      );
    this.unpublishLastDatasetorder = async (datasetAddress) =>
      order.unpublishLastDatasetorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetAddress,
      );
    this.unpublishLastWorkerpoolorder = async (workerpoolAddress) =>
      order.unpublishLastWorkerpoolorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        workerpoolAddress,
      );
    this.unpublishLastRequestorder = async () =>
      order.unpublishLastRequestorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
      );
    this.unpublishAllApporders = async (appAddress) =>
      order.unpublishAllApporders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        appAddress,
      );
    this.unpublishAllDatasetorders = async (datasetAddress) =>
      order.unpublishAllDatasetorders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetAddress,
      );
    this.unpublishAllWorkerpoolorders = async (workerpoolAddress) =>
      order.unpublishAllWorkerpoolorders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        workerpoolAddress,
      );
    this.unpublishAllRequestorders = async () =>
      order.unpublishAllRequestorders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
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
        await this.config.resolveContractsClient(),
        apporder,
        datasetorder,
        workerpoolorder,
        checkRequest === true
          ? await checkRequestRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
                smsURL: await this.config.resolveSmsURL(),
              },
              requestorder,
            ).then(() => requestorder)
          : requestorder,
      );
  }
}

module.exports = IExecOrderModule;
