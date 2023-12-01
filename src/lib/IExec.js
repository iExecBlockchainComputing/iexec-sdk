import { version } from '../common/generated/sdk/package.js';
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

export default class IExec extends IExecModule {
  constructor(...args) {
    super(...args);

    this.version = version;
    this.wallet = IExecWalletModule.fromConfig(this.config);
    this.account = IExecAccountModule.fromConfig(this.config);
    this.app = IExecAppModule.fromConfig(this.config);
    this.dataset = IExecDatasetModule.fromConfig(this.config);
    this.workerpool = IExecWorkerpoolModule.fromConfig(this.config);
    this.hub = IExecHubModule.fromConfig(this.config);
    this.deal = IExecDealModule.fromConfig(this.config);
    this.order = IExecOrderModule.fromConfig(this.config);
    this.orderbook = IExecOrderbookModule.fromConfig(this.config);
    this.task = IExecTaskModule.fromConfig(this.config);
    this.result = IExecResultModule.fromConfig(this.config);
    this.secrets = IExecSecretsModule.fromConfig(this.config);
    this.storage = IExecStorageModule.fromConfig(this.config);
    this.ens = IExecENSModule.fromConfig(this.config);
    this.network = IExecNetworkModule.fromConfig(this.config);
  }
}
