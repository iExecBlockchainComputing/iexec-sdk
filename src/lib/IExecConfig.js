import Debug from 'debug';
import { JsonRpcProvider, BrowserProvider } from 'ethers';
import IExecContractsClient from '../common/utils/IExecContractsClient.js';
import { ConfigurationError } from '../common/utils/errors.js';
import {
  EnhancedWallet,
  BrowserProviderSigner,
} from '../common/utils/signers.js';
import {
  getChainDefaults,
  isEnterpriseEnabled,
} from '../common/utils/config.js';
import { TEE_FRAMEWORKS } from '../common/utils/constant.js';
import { getReadOnlyProvider } from '../common/utils/providers.js';
import {
  smsUrlOrMapSchema,
  teeFrameworkSchema,
} from '../common/utils/validator.js';

const debug = Debug('iexec:IExecConfig');

export default class IExecConfig {
  constructor(
    { ethProvider, flavour = 'standard' } = {},
    {
      hubAddress,
      ensRegistryAddress,
      ensPublicResolverAddress,
      voucherHubAddress,
      isNative,
      useGas = true,
      confirms,
      bridgeAddress,
      bridgedNetworkConf = {},
      enterpriseSwapConf = {},
      smsURL,
      resultProxyURL,
      ipfsGatewayURL,
      iexecGatewayURL,
      pocoSubgraphURL,
      voucherSubgraphURL,
      defaultTeeFramework,
      providerOptions,
    } = {}
  ) {
    if (
      ethProvider === undefined ||
      ethProvider === null ||
      ethProvider === ''
    ) {
      throw new ConfigurationError('Missing ethProvider');
    }
    const isReadOnlyProvider =
      typeof ethProvider === 'string' || typeof ethProvider === 'number';
    const isEnhancedWalletProvider = ethProvider instanceof EnhancedWallet;

    let disposableProvider;
    try {
      if (isEnhancedWalletProvider) {
        disposableProvider = ethProvider.provider;
      } else if (isReadOnlyProvider) {
        disposableProvider = getReadOnlyProvider(ethProvider, {
          providers: providerOptions,
        });
      } else {
        try {
          disposableProvider = new BrowserProvider(ethProvider);
        } catch (err) {
          debug('BrowserProvider', err);
          throw Error('Unsupported provider');
        }
      }
    } catch (err) {
      throw new ConfigurationError(`Invalid ethProvider: ${err.message}`);
    }

    let vSmsUrlOrMap;
    try {
      vSmsUrlOrMap = smsUrlOrMapSchema().validateSync(smsURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid smsURL: ${err.message}`);
    }

    let vDefaultTeeFramework;
    try {
      vDefaultTeeFramework =
        teeFrameworkSchema().validateSync(defaultTeeFramework);
    } catch (err) {
      throw new ConfigurationError(
        `Invalid defaultTeeFramework: ${err.message}`
      );
    }

    const networkPromise = (async () => {
      const network = await disposableProvider.getNetwork().catch((err) => {
        throw Error(`Failed to detect network: ${err.message}`);
      });
      const { chainId, name } = network;
      const ensPlugin = network.getPlugin('org.ethers.plugins.network.Ens');
      const ensAddress = ensPlugin ? ensPlugin.address : undefined;
      return { chainId: Number(chainId), name, ensAddress };
    })();

    networkPromise.catch((err) => {
      debug('networkPromise', err);
    });

    const chainConfDefaultsPromise = (async () => {
      const { chainId } = await networkPromise;
      return getChainDefaults({ id: chainId, flavour });
    })();

    chainConfDefaultsPromise.catch((err) => {
      debug('chainConfDefaultsPromise', err);
    });

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
      if (isEnhancedWalletProvider) {
        if (ethProvider.provider instanceof JsonRpcProvider) {
          // case JsonRpcProvider
          signer = ethProvider.connect(
            new JsonRpcProvider(
              // eslint-disable-next-line no-underscore-dangle
              ethProvider.provider._getConnection().url,
              networkOverride
            )
          );
        } else {
          // case FallbackProvider can not override
          if (ensRegistryAddress) {
            console.warn(
              'IExec: ensRegistryAddress option is not supported when using a default provider'
            );
          }
          signer = ethProvider;
        }
        provider = signer.provider;
      } else if (isReadOnlyProvider) {
        provider = getReadOnlyProvider(ethProvider, {
          providers: providerOptions,
          network: networkOverride,
        });
      } else {
        const browserSigner = new BrowserProviderSigner(
          ethProvider,
          networkOverride
        );
        signer = browserSigner;
        provider = browserSigner.provider;
      }
      return { provider, signer };
    })();

    providerAndSignerPromise.catch((err) => {
      debug('providerAndSignerPromise', err);
    });

    const contractsPromise = (async () => {
      const { chainId } = await networkPromise;
      const { provider, signer } = await providerAndSignerPromise;
      try {
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
      } catch (err) {
        throw new ConfigurationError(
          `Failed to create contracts client: ${err.message}`
        );
      }
    })();

    contractsPromise.catch((err) => {
      debug('contractsPromise', err);
    });

    const enterpriseSwapContractsPromise = (async () => {
      const { chainId } = await networkPromise;
      const { provider, signer } = await providerAndSignerPromise;
      const hasEnterpriseConf =
        enterpriseSwapConf.hubAddress || isEnterpriseEnabled(chainId);
      if (!hasEnterpriseConf) {
        throw new ConfigurationError(
          `enterpriseSwapConf option not set and no default value for your chain ${chainId}`
        );
      }
      const enterpriseSwapFlavour =
        flavour === 'enterprise' ? 'standard' : 'enterprise';
      const enterpriseConf = {
        ...getChainDefaults({
          id: chainId,
          flavour: enterpriseSwapFlavour,
        }),
        ...enterpriseSwapConf,
      };
      try {
        return new IExecContractsClient({
          chainId,
          provider,
          signer,
          hubAddress: enterpriseConf.hubAddress,
          confirms,
          isNative: enterpriseConf.isNative,
          flavour: enterpriseSwapFlavour,
        });
      } catch (err) {
        throw new ConfigurationError(
          `Failed to create enterprise swap contracts client: ${err.message}`
        );
      }
    })();

    enterpriseSwapContractsPromise.catch((err) => {
      debug('enterpriseSwapContractsPromise', err);
    });

    const bridgedConfPromise = (async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const isBridged =
        Object.getOwnPropertyNames(bridgedNetworkConf).length > 0 ||
        chainConfDefaults.bridge;
      if (!isBridged) {
        throw new ConfigurationError(
          `bridgedNetworkConf option not set and no default value for your chain ${chainId}`
        );
      }
      const bridgedChainId =
        bridgedNetworkConf.chainId !== undefined
          ? bridgedNetworkConf.chainId
          : chainConfDefaults.bridge && chainConfDefaults.bridge.bridgedChainId;
      if (!bridgedChainId) {
        throw new ConfigurationError(
          `Missing chainId in bridgedNetworkConf and no default value for your chain ${chainId}`
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
        throw new ConfigurationError(
          `Missing rpcURL in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`
        );
      }
      const bridgedBridgeAddress =
        bridgedNetworkConf.bridgeAddress !== undefined
          ? bridgedNetworkConf.bridgeAddress
          : bridgedChainConfDefaults.bridge &&
            bridgedChainConfDefaults.bridge.contract;
      if (!bridgedBridgeAddress) {
        throw new ConfigurationError(
          `Missing bridgeAddress in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`
        );
      }
      const contracts = await contractsPromise;
      return {
        chainId: bridgedChainId,
        rpcURL: bridgedRpcUrl,
        isNative:
          flavour === 'standard' ? !contracts.isNative : contracts.isNative,
        hubAddress: bridgedNetworkConf.hubAddress,
        bridgeAddress: bridgedBridgeAddress,
        network: bridgedChainConfDefaults.network,
      };
    })();

    bridgedConfPromise.catch((err) => {
      debug('bridgedConfPromise', err);
    });

    const bridgedContractsPromise = (async () => {
      const bridgedConf = await bridgedConfPromise;
      try {
        return new IExecContractsClient({
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
      } catch (err) {
        throw new ConfigurationError(
          `Failed to create bridged contracts client: ${err.message}`
        );
      }
    })();
    bridgedContractsPromise.catch((err) => {
      debug('bridgedContractsPromise', err);
    });

    this.resolveChainId = async () => (await networkPromise).chainId;

    this.resolveContractsClient = async () => contractsPromise;

    this.resolveBridgedContractsClient = async () => bridgedContractsPromise;

    this.resolveStandardContractsClient = async () => {
      const contracts = await contractsPromise;
      if (contracts.flavour === 'standard') {
        return contracts;
      }
      return enterpriseSwapContractsPromise;
    };

    this.resolveEnterpriseContractsClient = async () => {
      const contracts = await contractsPromise;
      if (contracts.flavour === 'enterprise') {
        return contracts;
      }
      return enterpriseSwapContractsPromise;
    };

    this.resolveSmsURL = async ({
      teeFramework = vDefaultTeeFramework || TEE_FRAMEWORKS.SCONE,
    } = {}) => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const vTeeFramework = await teeFrameworkSchema()
        .label('teeFramework')
        .validate(teeFramework);
      const value =
        (typeof vSmsUrlOrMap === 'string' && vSmsUrlOrMap) ||
        (typeof vSmsUrlOrMap === 'object' && vSmsUrlOrMap[vTeeFramework]) ||
        (chainConfDefaults.sms && chainConfDefaults.sms[vTeeFramework]);
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `smsURL option not set and no default value for your chain ${chainId}`
      );
    };

    this.resolveResultProxyURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = resultProxyURL || chainConfDefaults.resultProxy;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `resultProxyURL option not set and no default value for your chain ${chainId}`
      );
    };

    this.resolveIexecGatewayURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = iexecGatewayURL || chainConfDefaults.iexecGateway;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `iexecGatewayURL option not set and no default value for your chain ${chainId}`
      );
    };

    this.resolveIpfsGatewayURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = ipfsGatewayURL || chainConfDefaults.ipfsGateway;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `ipfsGatewayURL option not set and no default value for your chain ${chainId}`
      );
    };

    this.resolvePocoSubgraphURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = pocoSubgraphURL || chainConfDefaults.pocoSubgraph;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `pocoSubgraphURL option not set and no default value for your chain ${chainId}`
      );
    };

    this.resolveVoucherSubgraphURL = async () => {
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = voucherSubgraphURL || chainConfDefaults.voucherSubgraph;
      if (value !== undefined) {
        return value;
      }
      return null;
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
      throw new ConfigurationError(
        `bridgeAddress option not set and no default value for your chain ${chainId}`
      );
    };

    this.resolveBridgeBackAddress = async () => {
      const bridgedChainConf = await bridgedConfPromise;
      return bridgedChainConf.bridgeAddress;
    };

    this.resolveEnsPublicResolverAddress = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value =
        ensPublicResolverAddress || chainConfDefaults.ensPublicResolver;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `ensPublicResolverAddress option not set and no default value for your chain ${chainId}`
      );
    };

    this.resolveVoucherHubAddress = async () => {
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = voucherHubAddress || chainConfDefaults.voucherHub;
      if (value !== undefined) {
        return value;
      }
      return null;
    };
  }
}
