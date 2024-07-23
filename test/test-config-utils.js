import { Wallet } from 'ethers';
import { IExec, utils } from '../src/lib/index.js';

export const getTestConfigOptions =
  (chain) =>
  ({ options = {} } = {}) => ({
    bridgeAddress: options.bridgeAddress ?? chain.bridgeAddress,
    bridgedNetworkConf: options.bridgedNetworkConf ?? chain.bridgedNetworkConf,
    confirms: options.confirms ?? chain.confirms,
    defaultTeeFramework:
      options.defaultTeeFramework ?? chain.defaultTeeFramework,
    ensPublicResolverAddress:
      options.ensPublicResolverAddress ?? chain.ensPublicResolverAddress,
    ensRegistryAddress: options.ensRegistryAddress ?? chain.ensRegistryAddress,
    enterpriseSwapConf: options.enterpriseSwapConf ?? chain.enterpriseSwapConf,
    hubAddress: options.hubAddress ?? chain.hubAddress,
    voucherHubAddress: options.voucherHubAddress ?? chain.voucherHubAddress,
    iexecGatewayURL: options.iexecGatewayURL ?? chain.iexecGatewayURL,
    ipfsGatewayURL: options.ipfsGatewayURL ?? chain.ipfsGatewayURL,
    pocoSubgraphURL: options.pocoSubgraphURL ?? chain.pocoSubgraphURL,
    voucherSubgraphURL: options.voucherSubgraphURL ?? chain.voucherSubgraphURL,
    isNative: options.isNative ?? chain.isNative,
    providerOptions: options.providerOptions ?? chain.providerOptions,
    resultProxyURL: options.resultProxyURL ?? chain.resultProxyURL,
    smsURL: options.smsURL ?? chain.smsMap,
    useGas: options.useGas ?? chain.useGas,
  });

export const getTestConfig =
  (chain) =>
  ({ privateKey, readOnly = false, options = {} } = {}) => {
    const configOptions = getTestConfigOptions(chain)({ options });
    if (readOnly) {
      return {
        iexec: new IExec({ ethProvider: chain.rpcURL }, configOptions),
      };
    }
    const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
    const ethProvider = utils.getSignerFromPrivateKey(
      chain.rpcURL,
      wallet.privateKey
    );
    return {
      iexec: new IExec({ ethProvider }, configOptions),
      wallet,
    };
  };
