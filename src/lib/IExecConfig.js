const { providers } = require('ethers');
const IExecContractsClient = require('../common/utils/IExecContractsClient');
const errors = require('../common/utils/errors');
const {
  EnhancedWallet,
  EnhancedWeb3Signer,
} = require('../common/utils/signers');
const {
  getChainDefaults,
  isEnterpriseEnabled,
} = require('../common/utils/config');
const { getReadOnlyProvider } = require('../common/utils/providers');

class IExecConfig {
  constructor(
    { ethProvider, flavour = 'standard' },
    {
      hubAddress,
      ensRegistryAddress,
      ensPublicResolverAddress,
      isNative,
      useGas = true,
      confirms,
      bridgeAddress,
      bridgedNetworkConf = {},
      enterpriseSwapConf = {},
      resultProxyURL,
      smsURL,
      ipfsGatewayURL,
      iexecGatewayURL,
      providerOptions,
    } = {},
  ) {
    const isEnhancedWallet = ethProvider instanceof EnhancedWallet;
    const isNetworkish = typeof ethProvider === 'string';

    const networkPromise = (async () => {
      let disposableProvider;
      if (isEnhancedWallet) {
        disposableProvider = ethProvider.provider;
      } else if (isNetworkish) {
        disposableProvider = getReadOnlyProvider(ethProvider, {
          providers: providerOptions,
        });
      } else {
        disposableProvider = new providers.Web3Provider(ethProvider);
      }
      const { chainId, name, ensAddress } =
        await disposableProvider.getNetwork();
      return { chainId, name, ensAddress };
    })();

    const chainConfDefaultsPromise = (async () => {
      const { chainId } = await networkPromise;
      return getChainDefaults({ id: chainId, flavour });
    })();

    const providerAndSignerPromise = (async () => {
      let provider;
      let signer;
      const network = await networkPromise;
      const chainDefaults = await chainConfDefaultsPromise;
      const networkOverride = {
        ...network,
        ...chainDefaults.network,
        ...(ensRegistryAddress && { ensAddress: ensRegistryAddress }),
      };
      if (isEnhancedWallet) {
        if (
          ethProvider.provider &&
          ethProvider.provider.connection &&
          ethProvider.provider.connection.url
        ) {
          // case JsonRpcProvider
          signer = ethProvider.connect(
            new providers.JsonRpcProvider(
              ethProvider.provider.connection.url,
              networkOverride,
            ),
          );
        } else {
          // case FallbackProvider can not override
          if (ensRegistryAddress) {
            console.warn(
              'IExec: ensRegistyAddress option is not supported when using a default provider',
            );
          }
          signer = ethProvider;
        }
        provider = signer.provider;
      } else if (isNetworkish) {
        provider = getReadOnlyProvider(ethProvider, {
          providers: providerOptions,
          network: networkOverride,
        });
      } else {
        const web3SignerProvider = new EnhancedWeb3Signer(
          ethProvider,
          networkOverride,
        );
        signer = web3SignerProvider;
        provider = signer.provider;
      }
      return { provider, signer };
    })();

    const contractsPromise = (async () => {
      const { chainId } = await networkPromise;
      const { provider, signer } = await providerAndSignerPromise;
      return new IExecContractsClient({
        chainId,
        provider,
        signer,
        hubAddress,
        useGas,
        confirms,
        isNative,
        flavour,
      });
    })();

    this.resolveChainId = async () => (await networkPromise).chainId;

    this.resolveContractsClient = async () => {
      const contracts = await contractsPromise;
      return contracts;
    };

    let _enterpriseSwapContracts;
    const resolveEnterpriseSwapContracts = async () => {
      if (!_enterpriseSwapContracts) {
        const { chainId } = await networkPromise;
        const { provider, signer } = await providerAndSignerPromise;
        let enterpriseConf;
        const hasEnterpriseConf =
          enterpriseSwapConf.hubAddress || isEnterpriseEnabled(chainId);
        const enterpriseSwapFlavour =
          flavour === 'enterprise' ? 'standard' : 'enterprise';
        if (hasEnterpriseConf) {
          const enterpriseSwapConfDefaults = getChainDefaults({
            id: chainId,
            flavour: enterpriseSwapFlavour,
          });
          enterpriseConf = {
            ...enterpriseSwapConfDefaults,
            ...enterpriseSwapConf,
          };
        }
        _enterpriseSwapContracts = hasEnterpriseConf
          ? new IExecContractsClient({
              chainId,
              provider,
              signer,
              hubAddress: enterpriseConf.hubAddress,
              confirms,
              isNative: enterpriseConf.isNative,
              flavour: enterpriseSwapFlavour,
            })
          : undefined;
      }
      return _enterpriseSwapContracts;
    };

    let _bridgedConf;
    const resolveBridgedConf = async () => {
      if (!_bridgedConf) {
        const { chainId } = await networkPromise;
        const chainConfDefaults = await chainConfDefaultsPromise;
        const contracts = await contractsPromise;
        const isBridged =
          Object.getOwnPropertyNames(bridgedNetworkConf).length > 0 ||
          chainConfDefaults.bridge;

        if (isBridged) {
          const bridgedChainId =
            bridgedNetworkConf.chainId !== undefined
              ? bridgedNetworkConf.chainId
              : chainConfDefaults.bridge &&
                chainConfDefaults.bridge.bridgedChainId;
          if (!bridgedChainId) {
            throw new errors.ConfigurationError(
              `Missing chainId in bridgedNetworkConf and no default value for your chain ${chainId}`,
            );
          }
          const bridgedChainConfDefaults = getChainDefaults({
            id: bridgedChainId,
            flavour,
          });
          const bridgedRpcUrl =
            bridgedNetworkConf.rpcURL !== undefined
              ? bridgedNetworkConf.rpcURL
              : bridgedChainConfDefaults.host;
          if (!bridgedRpcUrl) {
            throw new errors.ConfigurationError(
              `Missing rpcURL in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
            );
          }
          const bridgedBridgeAddress =
            bridgedNetworkConf.bridgeAddress !== undefined
              ? bridgedNetworkConf.bridgeAddress
              : bridgedChainConfDefaults.bridge &&
                bridgedChainConfDefaults.bridge.contract;
          if (!bridgedBridgeAddress) {
            throw new errors.ConfigurationError(
              `Missing bridgeAddress in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
            );
          }
          _bridgedConf = {
            chainId: bridgedChainId,
            rpcURL: bridgedRpcUrl,
            isNative:
              flavour === 'standard' ? !contracts.isNative : contracts.isNative,
            hubAddress: bridgedNetworkConf.hubAddress,
            bridgeAddress: bridgedBridgeAddress,
            network: bridgedChainConfDefaults.network,
          };
        }
      }
      return _bridgedConf;
    };

    let _bridgedContracts;
    this.resolveBridgedContractsClient = async () => {
      if (!_bridgedContracts) {
        const chainConfDefaults = await chainConfDefaultsPromise;
        const isBridged =
          Object.getOwnPropertyNames(bridgedNetworkConf).length > 0 ||
          chainConfDefaults.bridge;
        if (isBridged) {
          const bridgedConf = await resolveBridgedConf();
          _bridgedContracts = new IExecContractsClient({
            chainId: bridgedConf.chainId,
            provider: getReadOnlyProvider(bridgedConf.rpcURL, {
              providers: providerOptions,
              network: bridgedConf.network,
            }),
            hubAddress: bridgedConf.hubAddress,
            confirms,
            isNative: bridgedConf.isNative,
            flavour,
          });
        }
      }
      return _bridgedContracts;
    };

    this.resolveSmsURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = smsURL || chainConfDefaults.sms;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `smsURL option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveResultProxyURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = resultProxyURL || chainConfDefaults.resultProxy;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `resultProxyURL option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveIexecGatewayURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = iexecGatewayURL || chainConfDefaults.iexecGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `iexecGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveIpfsGatewayURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = ipfsGatewayURL || chainConfDefaults.ipfsGateway;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `ipfsGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveBridgeAddress = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value =
        bridgeAddress ||
        (chainConfDefaults.bridge && chainConfDefaults.bridge.contract);
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `bridgeAddress option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveBridgeBackAddress = async () => {
      const brigedChainConf = await resolveBridgedConf();
      return brigedChainConf.bridgeAddress;
    };

    this.resolveEnsPublicResolverAddress = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value =
        ensPublicResolverAddress || chainConfDefaults.ensPublicResolver;
      if (value !== undefined) {
        return value;
      }
      throw Error(
        `ensPublicResolverAddress option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveStandardContractsClient = async () => {
      const { chainId } = await networkPromise;
      const contracts = await contractsPromise;
      if (contracts.flavour === 'standard') {
        return contracts;
      }
      const enterpriseSwapContracts = await resolveEnterpriseSwapContracts();
      if (
        enterpriseSwapContracts &&
        enterpriseSwapContracts.flavour === 'standard'
      ) {
        return enterpriseSwapContracts;
      }
      throw Error(
        `enterpriseSwapConf option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveEnterpriseContractsClient = async () => {
      const { chainId } = await networkPromise;
      const contracts = await contractsPromise;
      if (contracts.flavour === 'enterprise') {
        return contracts;
      }
      const enterpriseSwapContracts = await resolveEnterpriseSwapContracts();
      if (
        enterpriseSwapContracts &&
        enterpriseSwapContracts.flavour === 'enterprise'
      ) {
        return enterpriseSwapContracts;
      }
      throw Error(
        `enterpriseSwapConf option not set and no default value for your chain ${chainId}`,
      );
    };
  }
}

module.exports = IExecConfig;
