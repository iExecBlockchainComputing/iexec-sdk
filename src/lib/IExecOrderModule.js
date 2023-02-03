import IExecModule from './IExecModule';
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
} from '../common/market/order';
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
} from '../common/market/marketplace';
import {
  checkRequestRequirements,
  resolveTeeFrameworkFromTag,
  checkAppRequirements,
  checkDatasetRequirements,
} from '../common/execution/order-helper';
import { NULL_DATASETORDER } from '../common/utils/constant';
import {
  requestorderSchema,
  apporderSchema,
  datasetorderSchema,
} from '../common/utils/validator';
import { sumTags } from '../common/utils/utils';

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
          resultProxyURL: await this.config.resolveResultProxyURL(),
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
                smsURL: await this.config.resolveSmsURL({
                  teeFramework: await resolveTeeFrameworkFromTag(
                    (
                      await datasetorderSchema().validate(datasetorder)
                    ).tag,
                  ),
                }),
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
                smsURL: await this.config.resolveSmsURL({
                  teeFramework: await resolveTeeFrameworkFromTag(
                    (
                      await requestorderSchema().validate(requestorder)
                    ).tag,
                  ),
                }),
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
                smsURL: await this.config.resolveSmsURL({
                  teeFramework: await resolveTeeFrameworkFromTag(
                    (
                      await datasetorderSchema().validate(signedDatasetorder)
                    ).tag,
                  ),
                }),
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
          ? await await checkRequestRequirements(
              {
                contracts: await this.config.resolveContractsClient(),
                smsURL: await this.config.resolveSmsURL({
                  teeFramework: await resolveTeeFrameworkFromTag(
                    (
                      await requestorderSchema().validate(signedRequestorder)
                    ).tag,
                  ),
                }),
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
        return matchOrders(
          await this.config.resolveContractsClient(),
          await checkAppRequirements(
            {
              contracts: await this.config.resolveContractsClient(),
            },
            apporder,
            { tagOverride: resolvedTag },
          ).then(() => apporder),
          await checkDatasetRequirements(
            {
              contracts: await this.config.resolveContractsClient(),
              smsURL: await this.config.resolveSmsURL({
                teeFramework: await resolveTeeFrameworkFromTag(resolvedTag),
              }),
            },
            datasetorder,
            { tagOverride: resolvedTag },
          ).then(() => datasetorder),
          workerpoolorder,
          await checkRequestRequirements(
            {
              contracts: await this.config.resolveContractsClient(),
              smsURL: await this.config.resolveSmsURL({
                teeFramework: await resolveTeeFrameworkFromTag(resolvedTag),
              }),
            },
            requestorder,
          ).then(() => requestorder),
        );
      }
      return matchOrders(
        await this.config.resolveContractsClient(),
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      );
    };
  }
}
