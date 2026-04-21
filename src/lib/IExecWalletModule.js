import IExecModule from './IExecModule.js';
import { getAddress } from '../common/wallet/address.js';
import { checkBalances } from '../common/wallet/balance.js';
import { sendETH, sendRLC, sweep } from '../common/wallet/send.js';

export default class IExecWalletModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getAddress = async () =>
      getAddress(await this.config.resolveContractsClient());
    this.checkBalances = async (address) =>
      checkBalances(await this.config.resolveContractsClient(), address);
    this.sendETH = async (weiAmount, to) =>
      sendETH(await this.config.resolveContractsClient(), weiAmount, to);
    this.sendRLC = async (nRlcAmount, to) =>
      sendRLC(await this.config.resolveContractsClient(), nRlcAmount, to);
    this.sweep = async (to) =>
      sweep(await this.config.resolveContractsClient(), to);
  }
}
