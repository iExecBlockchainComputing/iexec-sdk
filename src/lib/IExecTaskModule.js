const IExecModule = require('./IExecModule');
const task = require('../common/modules/task');
const iexecProcess = require('../common/modules/iexecProcess');

class IExecTaskModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.show = async (taskid) =>
      task.show(await this.config.getContracts(), taskid);
    this.obsTask = async (taskid, { dealid } = {}) =>
      iexecProcess.obsTask(await this.config.getContracts(), taskid, {
        dealid,
      });
    this.claim = async (taskid) =>
      task.claim(await this.config.getContracts(), taskid);
    this.fetchResults = async (taskid) =>
      iexecProcess.fetchTaskResults(await this.config.getContracts(), taskid, {
        ipfsGatewayURL: await this.config.getIpfsGatewayURL(),
      });
  }
}

module.exports = IExecTaskModule;
