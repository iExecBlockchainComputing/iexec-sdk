import IExecModule from './IExecModule.js';
import { show, obsTask, claim } from '../common/execution/task.js';
import { fetchTaskResults } from '../common/execution/result.js';

export default class IExecTaskModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.show = async (taskid) =>
      show(await this.config.resolveContractsClient(), taskid);
    this.obsTask = async (taskid, { dealid } = {}) =>
      obsTask(await this.config.resolveContractsClient(), taskid, {
        dealid,
      });
    this.claim = async (taskid) =>
      claim(await this.config.resolveContractsClient(), taskid);
    this.fetchResults = async (taskid) =>
      fetchTaskResults(await this.config.resolveContractsClient(), taskid, {
        ipfsGatewayURL: await this.config.resolveIpfsGatewayURL(),
      });
  }
}
