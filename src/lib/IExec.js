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
import IExecSecretsModule from './IExecSecretsModule';
import IExecStorageModule from './IExecStorageModule';
import IExecTaskModule from './IExecTaskModule';
import IExecWalletModule from './IExecWalletModule';
import IExecWorkerpoolModule from './IExecWorkerpoolModule';

export default class IExec extends IExecModule {
  constructor(...args) {
    super(...args);

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
