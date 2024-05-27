import IExecModule from './IExecModule.js';
import { fetchVoucherAddress } from '../common/voucher/voucherHub.js';
import { showUserVoucher } from '../common/voucher/voucher.js';

export default class IExecVoucherModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getVoucherAddress = async (owner) => {
      const contracts = await this.config.resolveContractsClient();
      const voucherHubAddress = await this.config.resolveVoucherHubAddress();

      return fetchVoucherAddress(contracts, voucherHubAddress, owner);
    };

    this.showUserVoucher = async (owner) => {
      const contracts = await this.config.resolveContractsClient();
      const voucherHubAddress = await this.config.resolveVoucherHubAddress();
      const voucherSubgraphURL = await this.config.resolveVoucherSubgraphURL();

      return showUserVoucher(
        contracts,
        voucherSubgraphURL,
        voucherHubAddress,
        owner,
      );
    };
  }
}
