import IExecModule from './IExecModule.js';
import {
  deployWorkerpool,
  showWorkerpool,
  showUserWorkerpool,
  countUserWorkerpools,
  predictWorkerpoolAddress,
  checkDeployedWorkerpool,
  transferWorkerpool,
} from '../common/protocol/registries.js';
import { setWorkerpoolApiUrl } from '../common/execution/workerpool.js';
import { getWorkerpoolApiUrl } from '../common/execution/debug.js';

export default class IExecWorkerpoolModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.deployWorkerpool = async (workerpool) =>
      deployWorkerpool(await this.config.resolveContractsClient(), workerpool);
    this.showWorkerpool = async (address) =>
      showWorkerpool(await this.config.resolveContractsClient(), address);
    this.showUserWorkerpool = async (index, userAddress) =>
      showUserWorkerpool(
        await this.config.resolveContractsClient(),
        index,
        userAddress,
      );
    this.countUserWorkerpools = async (address) =>
      countUserWorkerpools(await this.config.resolveContractsClient(), address);
    this.setWorkerpoolApiUrl = async (workerpoolAddress, url) =>
      setWorkerpoolApiUrl(
        await this.config.resolveContractsClient(),
        workerpoolAddress,
        url,
      );
    this.getWorkerpoolApiUrl = async (workerpoolAddress) =>
      getWorkerpoolApiUrl(
        await this.config.resolveContractsClient(),
        workerpoolAddress,
      );
    this.predictWorkerpoolAddress = async (workerpool) =>
      predictWorkerpoolAddress(
        await this.config.resolveContractsClient(),
        workerpool,
      );
    this.checkDeployedWorkerpool = async (address) =>
      checkDeployedWorkerpool(
        await this.config.resolveContractsClient(),
        address,
      );
    this.transferWorkerpool = async (address, to) =>
      transferWorkerpool(
        await this.config.resolveContractsClient(),
        address,
        to,
      );
  }
}
