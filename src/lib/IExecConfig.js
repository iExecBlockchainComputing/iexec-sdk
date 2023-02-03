import Debug from 'debug';
import { providers } from 'ethers';
import IExecContractsClient from '../common/utils/IExecContractsClient.js';
import { ConfigurationError } from '../common/utils/errors.js';
import { EnhancedWallet, EnhancedWeb3Signer } from '../common/utils/signers.js';
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
      defaultTeeFramework,
      providerOptions,
    } = {},
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
          disposableProvider = new providers.Web3Provider(ethProvider);
        } catch (err) {
          debug('Web3Provider', err);
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
        `Invalid defaultTeeFramework: ${err.message}`,
      );
    }

    const networkPromise = (async () => {
      const { chainId, name, ensAddress } = await disposableProvider
        .getNetwork()
        .catch((err) => {
          throw Error(`Failed to detect network: ${err.message}`);
        });
      return { chainId, name, ensAddress };
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
              'IExec: ensRegistryAddress option is not supported when using a default provider',
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
        const web3SignerProvider = new EnhancedWeb3Signer(
          ethProvider,
          networkOverride,
        );
        signer = web3SignerProvider;
        provider = signer.provider;
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
          `Failed to create contracts client: ${err.message}`,
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
          `enterpriseSwapConf option not set and no default value for your chain ${chainId}`,
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
          `Failed to create enterprise swap contracts client: ${err.message}`,
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
          `bridgedNetworkConf option not set and no default value for your chain ${chainId}`,
        );
      }
      const bridgedChainId =
        bridgedNetworkConf.chainId !== undefined
          ? bridgedNetworkConf.chainId
          : chainConfDefaults.bridge && chainConfDefaults.bridge.bridgedChainId;
      if (!bridgedChainId) {
        throw new ConfigurationError(
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
        throw new ConfigurationError(
          `Missing rpcURL in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
        );
      }
      const bridgedBridgeAddress =
        bridgedNetworkConf.bridgeAddress !== undefined
          ? bridgedNetworkConf.bridgeAddress
          : bridgedChainConfDefaults.bridge &&
            bridgedChainConfDefaults.bridge.contract;
      if (!bridgedBridgeAddress) {
        throw new ConfigurationError(
          `Missing bridgeAddress in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
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
          `Failed to create bridged contracts client: ${err.message}`,
        );
      }
    })();
    bridgedContractsPromise.catch((err) => {
      debug('bridgedContractsPromise', err);
    });

    this.resolveChainId = async () => (await networkPromise).chainId;

    this.resolveContractsClient = async () => {
      const contracts = await contractsPromise;
      return contracts;
    };

    this.resolveBridgedContractsClient = async () => {
      const bridgedContracts = await bridgedContractsPromise;
      return bridgedContracts;
    };

    this.resolveStandardContractsClient = async () => {
      const contracts = await contractsPromise;
      if (contracts.flavour === 'standard') {
        return contracts;
      }
      const enterpriseSwapContracts = await enterpriseSwapContractsPromise;
      return enterpriseSwapContracts;
    };

    this.resolveEnterpriseContractsClient = async () => {
      const contracts = await contractsPromise;
      if (contracts.flavour === 'enterprise') {
        return contracts;
      }
      const enterpriseSwapContracts = await enterpriseSwapContractsPromise;
      return enterpriseSwapContracts;
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
      throw new ConfigurationError(
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
      throw new ConfigurationError(
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
      throw new ConfigurationError(
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
      throw new ConfigurationError(
        `bridgeAddress option not set and no default value for your chain ${chainId}`,
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
        `ensPublicResolverAddress option not set and no default value for your chain ${chainId}`,
      );
    };
  }
}
