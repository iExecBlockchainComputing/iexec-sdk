const IExecModule = require('./IExecModule');

class IExecNetworkModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getNetwork = async () => {
      const contracts = await this.config.resolveContractsClient();
      return { chainId: contracts.chainId, isNative: contracts.isNative };
    };
  }
}

module.exports = IExecNetworkModule;
