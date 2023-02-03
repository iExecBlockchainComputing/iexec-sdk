import IExecModule from './IExecModule';

export default class IExecNetworkModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getNetwork = async () => {
      const contracts = await this.config.resolveContractsClient();
      return { chainId: contracts.chainId, isNative: contracts.isNative };
    };
  }
}
