import IExecModule from './IExecModule';
import IExecAccountModule from './IExecAccountModule';
import IExecAppModule from './IExecAppModule';
import IExecDatasetModule from './IExecDatasetModule';
import IExecDealModule from './IExecDealModule';
import IExecENSModule from './IExecENSModule';
import IExecHubModule from './IExecHubModule';
import IExecNetworkModule from './IExecNetworkModule';
import IExecOrderModule from './IExecOrderModule';
import IExecOrderbookModule from './IExecOrderbookModule';
import IExecResultModule from './IExecResultModule';
import IExecStorageModule from './IExecStorageModule';
import IExecTaskModule from './IExecTaskModule';
import IExecWalletModule from './IExecWalletModule';
import IExecWorkerpoolModule from './IExecWorkerpoolModule';

/**
 * module exposing all the iExec SDK modules
 */
export default class IExec extends IExecModule {
  account: IExecAccountModule;
  app: IExecAppModule;
  dataset: IExecDatasetModule;
  deal: IExecDealModule;
  ens: IExecENSModule;
  hub: IExecHubModule;
  network: IExecNetworkModule;
  order: IExecOrderModule;
  orderbook: IExecOrderbookModule;
  result: IExecResultModule;
  storage: IExecStorageModule;
  task: IExecTaskModule;
  wallet: IExecWalletModule;
  workerpool: IExecWorkerpoolModule;
}
