const IExecModule = require('./IExecModule');
const wallet = require('../common/modules/wallet');

class IExecWalletModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getAddress = async () =>
      wallet.getAddress(await this.config.getContracts());
    this.checkBalances = async (address) =>
      wallet.checkBalances(await this.config.getContracts(), address);
    this.checkBridgedBalances = async (address) =>
      wallet.checkBalances(await this.config.getBridgedContracts(), address);
    this.sendETH = async (weiAmount, to) =>
      wallet.sendETH(await this.config.getContracts(), weiAmount, to);
    this.sendRLC = async (nRlcAmount, to) =>
      wallet.sendRLC(await this.config.getContracts(), nRlcAmount, to);
    this.sweep = async (to) =>
      wallet.sweep(await this.config.getContracts(), to);
    this.bridgeToSidechain = async (nRlcAmount) =>
      wallet.bridgeToSidechain(
        await this.config.getContracts(),
        await this.config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.getBridgedContracts(),
          sidechainBridgeAddress: await this.config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.bridgeToMainchain = async (nRlcAmount) =>
      wallet.bridgeToMainchain(
        await this.config.getContracts(),
        await this.config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.getBridgedContracts(),
          mainchainBridgeAddress: await this.config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.obsBridgeToSidechain = async (nRlcAmount) =>
      wallet.obsBridgeToSidechain(
        await this.config.getContracts(),
        await this.config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.getBridgedContracts(),
          sidechainBridgeAddress: await this.config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.obsBridgeToMainchain = async (nRlcAmount) =>
      wallet.obsBridgeToMainchain(
        await this.config.getContracts(),
        await this.config.getBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.getBridgedContracts(),
          mainchainBridgeAddress: await this.config
            .getBridgedConf()
            .then((bridgedConf) => bridgedConf && bridgedConf.bridgeAddress),
        },
      );
    this.wrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.wrapEnterpriseRLC(
        await this.config.getStandardContracts(),
        await this.config.getEnterpriseContracts(),
        nRlcAmount,
      );
    this.unwrapEnterpriseRLC = async (nRlcAmount) =>
      wallet.unwrapEnterpriseRLC(
        await this.config.getEnterpriseContracts(),
        nRlcAmount,
      );
  }
}

module.exports = IExecWalletModule;
