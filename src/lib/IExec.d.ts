import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import IExecAccountModule from './IExecAccountModule.js';
import IExecAppModule from './IExecAppModule.js';
import IExecDatasetModule from './IExecDatasetModule.js';
import IExecDealModule from './IExecDealModule.js';
import IExecENSModule from './IExecENSModule.js';
import IExecHubModule from './IExecHubModule.js';
import IExecNetworkModule from './IExecNetworkModule.js';
import IExecOrderModule from './IExecOrderModule.js';
import IExecOrderbookModule from './IExecOrderbookModule.js';
import IExecResultModule from './IExecResultModule.js';
import IExecSecretsModule from './IExecSecretsModule.js';
import IExecStorageModule from './IExecStorageModule.js';
import IExecTaskModule from './IExecTaskModule.js';
import IExecWalletModule from './IExecWalletModule.js';
import IExecWorkerpoolModule from './IExecWorkerpoolModule.js';

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
   * secrets module
   */
  secrets: IExecSecretsModule;
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
