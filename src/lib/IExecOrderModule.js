import IExecModule from './IExecModule.js';
import {
  createApporder,
  createDatasetorder,
  createRequestorder,
  createWorkerpoolorder,
  signApporder,
  signDatasetorder,
  signRequestorder,
  signWorkerpoolorder,
  hashApporder,
  hashDatasetorder,
  hashRequestorder,
  hashWorkerpoolorder,
  cancelApporder,
  cancelDatasetorder,
  cancelRequestorder,
  cancelWorkerpoolorder,
  matchOrders,
  estimateMatchOrders,
} from '../common/market/order.js';
import {
  publishApporder,
  publishDatasetorder,
  publishRequestorder,
  publishWorkerpoolorder,
  unpublishAllApporders,
  unpublishAllDatasetorders,
  unpublishAllRequestorders,
  unpublishAllWorkerpoolorders,
  unpublishApporder,
  unpublishDatasetorder,
  unpublishLastApporder,
  unpublishLastDatasetorder,
  unpublishLastRequestorder,
  unpublishLastWorkerpoolorder,
  unpublishRequestorder,
  unpublishWorkerpoolorder,
} from '../common/market/marketplace.js';
import {
  checkRequestRequirements,
  checkAppRequirements,
  checkDatasetRequirements,
  prepareDatasetBulk,
} from '../common/execution/order-helper.js';
import { NULL_DATASETORDER } from '../common/utils/constant.js';
import {
  requestorderSchema,
  apporderSchema,
  datasetorderSchema,
} from '../common/utils/validator.js';
import { sumTags } from '../common/utils/utils.js';
import { shouldUploadBulkForThegraph } from '../common/utils/config.js';

export default class IExecOrderModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.createApporder = async (overwrite) =>
      createApporder(await this.config.resolveContractsClient(), overwrite);
    this.createDatasetorder = async (overwrite) =>
      createDatasetorder(await this.config.resolveContractsClient(), overwrite);
    this.createWorkerpoolorder = async (overwrite) =>
      createWorkerpoolorder(
        await this.config.resolveContractsClient(),
        overwrite,
      );
    this.createRequestorder = async (overwrite) =>
      createRequestorder(
        {
          contracts: await this.config.resolveContractsClient(),
        },
        overwrite,
      );
    this.hashApporder = async (apporder) =>
      hashApporder(await this.config.resolveContractsClient(), apporder);
    this.hashDatasetorder = async (datasetorder) =>
      hashDatasetorder(
        await this.config.resolveContractsClient(),
        datasetorder,
      );
    this.hashWorkerpoolorder = async (workerpoolorder) =>
      hashWorkerpoolorder(
        await this.config.resolveContractsClient(),
        workerpoolorder,
      );
    this.hashRequestorder = async (requestorder) =>
      hashRequestorder(
        await this.config.resolveContractsClient(),
        requestorder,
      );
    this.signApporder = async (apporder, { preflightCheck = true } = {}) =>
      signApporder(
        await this.config.resolveContractsClient(),
        preflightCheck === true
          ? await checkAppRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
              },
              apporder,
            ).then(() => apporder)
          : apporder,
      );
    this.signDatasetorder = async (
      datasetorder,
      { preflightCheck = true } = {},
    ) =>
      signDatasetorder(
        await this.config.resolveContractsClient(),
        preflightCheck === true
          ? await checkDatasetRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
                smsURL: await this.config.resolveSmsURL(),
              },
              datasetorder,
            ).then(() => datasetorder)
          : datasetorder,
      );
    this.signWorkerpoolorder = async (workerpoolorder) =>
      signWorkerpoolorder(
        await this.config.resolveContractsClient(),
        workerpoolorder,
      );
    this.signRequestorder = async (
      requestorder,
      { preflightCheck = true } = {},
    ) =>
      signRequestorder(
        await this.config.resolveContractsClient(),
        preflightCheck === true
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
      cancelApporder(
        await this.config.resolveContractsClient(),
        signedApporder,
      );
    this.cancelDatasetorder = async (signedDatasetorder) =>
      cancelDatasetorder(
        await this.config.resolveContractsClient(),
        signedDatasetorder,
      );
    this.cancelWorkerpoolorder = async (signedWorkerpoolorder) =>
      cancelWorkerpoolorder(
        await this.config.resolveContractsClient(),
        signedWorkerpoolorder,
      );
    this.cancelRequestorder = async (signedRequestorder) =>
      cancelRequestorder(
        await this.config.resolveContractsClient(),
        signedRequestorder,
      );
    this.publishApporder = async (
      signedApporder,
      { preflightCheck = true } = {},
    ) =>
      publishApporder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        preflightCheck === true
          ? await checkAppRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
              },
              signedApporder,
            ).then(() => signedApporder)
          : signedApporder,
      );
    this.publishDatasetorder = async (
      signedDatasetorder,
      { preflightCheck = true } = {},
    ) =>
      publishDatasetorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        preflightCheck === true
          ? await checkDatasetRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
                smsURL: await this.config.resolveSmsURL(),
              },
              signedDatasetorder,
            ).then(() => signedDatasetorder)
          : signedDatasetorder,
      );
    this.publishWorkerpoolorder = async (signedWorkerpoolorder) =>
      publishWorkerpoolorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        signedWorkerpoolorder,
      );
    this.publishRequestorder = async (
      signedRequestorder,
      { preflightCheck = true } = {},
    ) =>
      publishRequestorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        preflightCheck === true
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
      unpublishApporder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        apporderHash,
      );
    this.unpublishDatasetorder = async (datasetorderHash) =>
      unpublishDatasetorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetorderHash,
      );
    this.unpublishWorkerpoolorder = async (workerpoolorderHash) =>
      unpublishWorkerpoolorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        workerpoolorderHash,
      );
    this.unpublishRequestorder = async (requestorderHash) =>
      unpublishRequestorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        requestorderHash,
      );
    this.unpublishLastApporder = async (appAddress) =>
      unpublishLastApporder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        appAddress,
      );
    this.unpublishLastDatasetorder = async (datasetAddress) =>
      unpublishLastDatasetorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetAddress,
      );
    this.unpublishLastWorkerpoolorder = async (workerpoolAddress) =>
      unpublishLastWorkerpoolorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        workerpoolAddress,
      );
    this.unpublishLastRequestorder = async () =>
      unpublishLastRequestorder(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
      );
    this.unpublishAllApporders = async (appAddress) =>
      unpublishAllApporders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        appAddress,
      );
    this.unpublishAllDatasetorders = async (datasetAddress) =>
      unpublishAllDatasetorders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        datasetAddress,
      );
    this.unpublishAllWorkerpoolorders = async (workerpoolAddress) =>
      unpublishAllWorkerpoolorders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
        workerpoolAddress,
      );
    this.unpublishAllRequestorders = async () =>
      unpublishAllRequestorders(
        await this.config.resolveContractsClient(),
        await this.config.resolveIexecGatewayURL(),
      );
    this.matchOrders = async (
      {
        apporder,
        datasetorder = NULL_DATASETORDER,
        workerpoolorder,
        requestorder,
      },
      { preflightCheck = true } = {},
    ) => {
      const contracts = await this.config.resolveContractsClient();
      if (preflightCheck === true) {
        const resolvedTag = sumTags([
          (
            await requestorderSchema()
              .label('requestorder')
              .validate(requestorder)
          ).tag,
          (await apporderSchema().label('apporder').validate(apporder)).tag,
          (
            await datasetorderSchema()
              .label('datasetorder')
              .validate(datasetorder)
          ).tag,
        ]);
        return matchOrders({
          contracts,
          apporder: await checkAppRequirements(
            {
              contracts,
            },
            apporder,
            { tagOverride: resolvedTag },
          ).then(() => apporder),
          datasetorder: await checkDatasetRequirements(
            {
              contracts,
              smsURL: await this.config.resolveSmsURL(),
            },
            datasetorder,
            { tagOverride: resolvedTag },
          ).then(() => datasetorder),
          workerpoolorder,
          requestorder: await checkRequestRequirements(
            {
              contracts,
              smsURL: await this.config.resolveSmsURL(),
            },
            requestorder,
          ).then(() => requestorder),
        });
      }
      return matchOrders({
        contracts,
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
    };
    this.estimateMatchOrders = async ({
      apporder,
      datasetorder,
      workerpoolorder,
      requestorder,
    }) => {
      const contracts = await this.config.resolveContractsClient();
      return estimateMatchOrders({
        contracts,
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
    };
    this.prepareDatasetBulk = async (
      datasetorders,
      { maxDatasetPerTask, thegraphUpload } = {},
    ) => {
      return prepareDatasetBulk({
        ipfsNode: await this.config.resolveIpfsNodeURL(),
        ipfsGateway: await this.config.resolveIpfsGatewayURL(),
        contracts: await this.config.resolveContractsClient(),
        datasetorders,
        maxDatasetPerTask,
        thegraphUpload:
          thegraphUpload !== undefined
            ? thegraphUpload
            : shouldUploadBulkForThegraph(await this.config.resolveChainId()),
      });
    };
  }
}
