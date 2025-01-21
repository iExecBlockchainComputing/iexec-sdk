import IExecModule from './IExecModule.js';
import { getAddress } from '../common/wallet/address.js';
import { checkBalances } from '../common/wallet/balance.js';
import { sendETH, sendRLC, sweep } from '../common/wallet/send.js';
import {
  bridgeToMainchain,
  bridgeToSidechain,
  obsBridgeToMainchain,
  obsBridgeToSidechain,
} from '../common/wallet/bridge.js';

export default class IExecWalletModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getAddress = async () =>
      getAddress(await this.config.resolveContractsClient());
    this.checkBalances = async (address) =>
      checkBalances(await this.config.resolveContractsClient(), address);
    this.checkBridgedBalances = async (address) =>
      checkBalances(await this.config.resolveBridgedContractsClient(), address);
    this.sendETH = async (weiAmount, to) =>
      sendETH(await this.config.resolveContractsClient(), weiAmount, to);
    this.sendRLC = async (nRlcAmount, to) =>
      sendRLC(await this.config.resolveContractsClient(), nRlcAmount, to);
    this.sweep = async (to) =>
      sweep(await this.config.resolveContractsClient(), to);
    this.bridgeToSidechain = async (nRlcAmount) =>
      bridgeToSidechain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          sidechainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
    this.bridgeToMainchain = async (nRlcAmount) =>
      bridgeToMainchain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          mainchainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
    this.obsBridgeToSidechain = async (nRlcAmount) =>
      obsBridgeToSidechain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          sidechainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
    this.obsBridgeToMainchain = async (nRlcAmount) =>
      obsBridgeToMainchain(
        await this.config.resolveContractsClient(),
        await this.config.resolveBridgeAddress(),
        nRlcAmount,
        {
          bridgedContracts: await this.config.resolveBridgedContractsClient(),
          mainchainBridgeAddress: await this.config.resolveBridgeBackAddress(),
        },
      );
  }
}
