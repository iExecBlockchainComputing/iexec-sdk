import IExecModule from './IExecModule.js';
import {
  checkStorageTokenExists,
  pushStorageToken,
} from '../common/execution/storage.js';

export default class IExecStorageModule extends IExecModule {
  constructor(...args) {
    super(...args);
    this.checkStorageTokenExists = async (address, provider) =>
      checkStorageTokenExists(
        { smsURL: await this.config.resolveSmsURL() },
        address,
        provider,
      );

    this.pushStorageToken = async (
      token,
      provider,
      { forceUpdate = false } = {},
    ) =>
      pushStorageToken(
        {
          smsURL: await this.config.resolveSmsURL(),
          contracts: await this.config.resolveContractsClient(),
        },
        token,
        provider,
        { forceUpdate },
      );
  }
}
