import IExecModule from './IExecModule.js';
import { checkBalance } from '../common/account/balance.js';
import { deposit, withdraw } from '../common/account/fund.js';
import {
  approve,
  checkAllowance,
  revokeApproval,
} from '../common/account/allowance.js';

export default class IExecAccountModule extends IExecModule {
  constructor(...args) {
    super(...args);
    this.checkBalance = async (address) =>
      checkBalance(await this.config.resolveContractsClient(), address);
    this.checkBridgedBalance = async (address) =>
      checkBalance(await this.config.resolveBridgedContractsClient(), address);
    this.deposit = async (nRlcAmount) =>
      deposit(await this.config.resolveContractsClient(), nRlcAmount);
    this.withdraw = async (nRlcAmount) =>
      withdraw(await this.config.resolveContractsClient(), nRlcAmount);
    this.approve = async (nRlcAmount, spenderAddress) =>
      approve(
        await this.config.resolveContractsClient(),
        nRlcAmount,
        spenderAddress,
      );
    this.checkAllowance = async (ownerAddress, spenderAddress) =>
      checkAllowance(
        await this.config.resolveContractsClient(),
        ownerAddress,
        spenderAddress,
      );
    this.revokeApproval = async (spenderAddress) =>
      revokeApproval(
        await this.config.resolveContractsClient(),
        spenderAddress,
      );
  }
}
