import { version } from '../common/generated/sdk/package.js';
import IExecConfig from './IExecConfig.js';

export default class IExecModule {
  constructor(...args) {
    if (!args[0]) {
      throw Error(`${this.constructor.name} requires at least one argument`);
    }
    if (args[0] instanceof IExecConfig) {
      [this.config] = args;
    } else {
      this.config = new IExecConfig(...args);
    }
    this.version = version;
  }

  static fromConfig(config) {
    if (!(config instanceof IExecConfig))
      throw Error('fromConfig requires an instance of IExecConfig');
    return new this.prototype.constructor(config);
  }
}
