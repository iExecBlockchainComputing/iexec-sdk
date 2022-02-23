const IExecModule = require('./IExecModule');
const account = require('../common/modules/account');

class IExecAccountModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.checkBalance = async (address) =>
      account.checkBalance(await this.config.getContracts(), address);
    this.checkBridgedBalance = async (address) =>
      account.checkBalance(await this.config.getBridgedContracts(), address);
    this.deposit = async (nRlcAmount) =>
      account.deposit(await this.config.getContracts(), nRlcAmount);
    this.withdraw = async (nRlcAmount) =>
      account.withdraw(await this.config.getContracts(), nRlcAmount);
  }
}

module.exports = IExecAccountModule;
