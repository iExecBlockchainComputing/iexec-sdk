export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecConfig, {
  IExecConfigArgs,
  IExecConfigOptions,
} from './IExecConfig.js';

/**
 * module base
 */
export default class IExecModule {
  /**
   * Create an IExecModule instance using an IExecConfig like
   */
  constructor(
    configOrArgs: IExecConfig | IExecConfigArgs,
    options?: IExecConfigOptions,
  );
  /**
   * current IExecConfig
   */
  config: IExecConfig;
  /**
   * Create an IExecModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecModule;
}
