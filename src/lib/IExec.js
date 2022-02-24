const IExecModule = require('./IExecModule');
const IExecAccountModule = require('./IExecAccountModule');
const IExecAppModule = require('./IExecAppModule');
const IExecDatasetModule = require('./IExecDatasetModule');
const IExecDealModule = require('./IExecDealModule');
const IExecENSModule = require('./IExecENSModule');
const IExecHubModule = require('./IExecHubModule');
const IExecNetworkModule = require('./IExecNetworkModule');
const IExecOrderModule = require('./IExecOrderModule');
const IExecOrderbookModule = require('./IExecOrderbookModule');
const IExecResultModule = require('./IExecResultModule');
const IExecStorageModule = require('./IExecStorageModule');
const IExecTaskModule = require('./IExecTaskModule');
const IExecWalletModule = require('./IExecWalletModule');
const IExecWorkerpoolModule = require('./IExecWorkerpoolModule');

class IExec extends IExecModule {
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
    this.storage = IExecStorageModule.fromConfig(this.config);
    this.ens = IExecENSModule.fromConfig(this.config);
    this.network = IExecNetworkModule.fromConfig(this.config);
  }
}

module.exports = IExec;
