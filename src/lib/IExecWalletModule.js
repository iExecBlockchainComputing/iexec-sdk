const IExecModule = require('./IExecModule');
const wallet = require('../common/modules/wallet');

class IExecWalletModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getAddress = async () =>
      wallet.getAddress(await this.config.resolveContractsClient());
    this.checkBalances = async (address) =>
      wallet.checkBalances(await this.config.resolveContractsClient(), address);
    this.checkBridgedBalances = async (address) =>
      wallet.checkBalances(
        await this.config.resolveBridgedContractsClient(),
        address,
      );
    this.sendETH = async (weiAmount, to) =>
      wallet.sendETH(await this.config.resolveContractsClient(), weiAmount, to);
    this.sendRLC = async (nRlcAmount, to) =>
      wallet.sendRLC(
        await this.config.resolveContractsClient(),
        nRlcAmount,
        to,
      );
    this.sweep = async (to) =>
      wallet.sweep(await this.config.resolveContractsClient(), to);
    this.bridgeToSidechain = async (nRlcAmount) =>
      wallet.bridgeToSidechain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          sidechainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
    this.bridgeToMainchain = async (nRlcAmount) =>
      wallet.bridgeToMainchain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          mainchainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
    this.obsBridgeToSidechain = async (nRlcAmount) =>
      wallet.obsBridgeToSidechain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          sidechainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
    this.obsBridgeToMainchain = async (nRlcAmount) =>
      wallet.obsBridgeToMainchain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          mainchainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
    this.wrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.wrapEnterpriseRLC(
        await this.config.resolveStandardContractsClient(),
        await this.config.resolveEnterpriseContractsClient(),
        nRlcAmount,
      );
    this.unwrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.unwrapEnterpriseRLC(
        await this.config.resolveEnterpriseContractsClient(),
        nRlcAmount,
      );
  }
}

module.exports = IExecWalletModule;
