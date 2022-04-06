import IExecConfig from './IExecConfig';
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
  /**
   * account module
   */
  account: IExecAccountModule;
  /**
   * app module
   */
  app: IExecAppModule;
  /**
   * dataset module
   */
  dataset: IExecDatasetModule;
  /**
   * deal module
   */
  deal: IExecDealModule;
  /**
   * ens module
   */
  ens: IExecENSModule;
  /**
   * hub module
   */
  hub: IExecHubModule;
  /**
   * network module
   */
  network: IExecNetworkModule;
  /**
   * order module
   */
  order: IExecOrderModule;
  /**
   * orderbook module
   */
  orderbook: IExecOrderbookModule;
  /**
   * result module
   */
  result: IExecResultModule;
  /**
   * storage module
   */
  storage: IExecStorageModule;
  /**
   * task module
   */
  task: IExecTaskModule;
  /**
   * wallet module
   */
  wallet: IExecWalletModule;
  /**
   * workerpool module
   */
  workerpool: IExecWorkerpoolModule;
  /**
   * Create an IExec instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExec;
}
