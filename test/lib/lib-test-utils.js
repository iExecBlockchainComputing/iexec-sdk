import { Wallet } from 'ethers';
import { IExec } from '../../src/lib';
import { getSignerFromPrivateKey } from '../../src/lib/utils';
import { getRandomWallet } from '../test-utils';

export const getTestConfig =
  (chain) =>
  ({ privateKey, readOnly = false, options = {} } = {}) => {
    const configOptions = {
      bridgeAddress: options.bridgeAddress ?? chain.bridgeAddress,
      bridgedNetworkConf:
        options.bridgedNetworkConf ?? chain.bridgedNetworkConf,
      confirms: options.confirms ?? chain.confirms,
      defaultTeeFramework:
        options.defaultTeeFramework ?? chain.defaultTeeFramework,
      ensPublicResolverAddress:
        options.ensPublicResolverAddress ?? chain.ensPublicResolverAddress,
      ensRegistryAddress:
        options.ensRegistryAddress ?? chain.ensRegistryAddress,
      enterpriseSwapConf:
        options.enterpriseSwapConf ?? chain.enterpriseSwapConf,
      hubAddress: options.hubAddress ?? chain.hubAddress,
      iexecGatewayURL: options.iexecGatewayURL ?? chain.iexecGatewayURL,
      ipfsGatewayURL: options.ipfsGatewayURL ?? chain.ipfsGatewayURL,
      isNative: options.isNative ?? chain.isNative,
      providerOptions: options.providerOptions ?? chain.providerOptions,
      resultProxyURL: options.resultProxyURL ?? chain.resultProxyURL,
      smsURL: options.smsURL ?? chain.smsURL,
      useGas: options.useGas ?? chain.useGas,
    };

    if (readOnly) {
      return {
        iexec: new IExec({ ethProvider: chain.rpcURL }, configOptions),
      };
    }

    const wallet = privateKey ? new Wallet(privateKey) : getRandomWallet();
    const ethProvider = getSignerFromPrivateKey(
      chain.rpcURL,
      wallet.privateKey,
    );
    return {
      iexec: new IExec({ ethProvider }, configOptions),
      wallet,
    };
  };

export const ONE_ETH = 10n ** 18n;

export const ONE_RLC = 10n ** 9n;

export const ONE_GWEI = 10n ** 9n;
