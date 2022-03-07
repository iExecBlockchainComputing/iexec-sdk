const IExecModule = require('./IExecModule');
const account = require('../common/modules/account');

class IExecAccountModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.checkBalance = async (address) =>
      account.checkBalance(await this.config.resolveContractsClient(), address);
    this.checkBridgedBalance = async (address) =>
      account.checkBalance(
        await this.config.resolveBridgedContractsClient(),
        address,
      );
    this.deposit = async (nRlcAmount) =>
      account.deposit(await this.config.resolveContractsClient(), nRlcAmount);
    this.withdraw = async (nRlcAmount) =>
      account.withdraw(await this.config.resolveContractsClient(), nRlcAmount);
  }
}

module.exports = IExecAccountModule;
