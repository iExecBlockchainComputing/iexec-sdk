const IExecModule = require('./IExecModule');
const task = require('../common/execution/task');
const iexecProcess = require('../common/execution/iexecProcess');

class IExecTaskModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.show = async (taskid) =>
      task.show(await this.config.resolveContractsClient(), taskid);
    this.obsTask = async (taskid, { dealid } = {}) =>
      iexecProcess.obsTask(await this.config.resolveContractsClient(), taskid, {
        dealid,
      });
    this.claim = async (taskid) =>
      task.claim(await this.config.resolveContractsClient(), taskid);
    this.fetchResults = async (taskid) =>
      iexecProcess.fetchTaskResults(
        await this.config.resolveContractsClient(),
        taskid,
        {
          ipfsGatewayURL: await this.config.resolveIpfsGatewayURL(),
        },
      );
  }
}

module.exports = IExecTaskModule;
