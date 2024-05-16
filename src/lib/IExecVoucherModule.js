import IExecModule from './IExecModule.js';
import { fetchVoucherAddress } from '../common/voucher/voucherHub.js';

export default class IExecVoucherModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getVoucherAddress = async (owner) => {
      const contracts = await this.config.resolveContractsClient();
      const voucherHubAddress = await this.config.resolveVoucherHubAddress();

      return fetchVoucherAddress(contracts, voucherHubAddress, owner);
    };
  }
}
