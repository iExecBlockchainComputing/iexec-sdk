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
   * Create an IExecModule instance
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
   * iexec sdk version
   */
  version: string;
  /**
   * Create an IExecModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecModule;
}
