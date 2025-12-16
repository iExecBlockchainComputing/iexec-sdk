import Debug from 'debug';
import { BrowserProvider, AbstractProvider, AbstractSigner } from 'ethers';
import IExecContractsClient from '../common/utils/IExecContractsClient.js';
import { ConfigurationError } from '../common/utils/errors.js';
import { getChainDefaults } from '../common/utils/config.js';
import { getReadOnlyProvider } from '../common/utils/providers.js';
import { BrowserProviderSignerAdapter } from '../common/utils/signers.js';
import { basicUrlSchema } from '../common/utils/validator.js';

const debug = Debug('iexec:IExecConfig');

export default class IExecConfig {
  constructor(
    { ethProvider } = {},
    {
      hubAddress,
      ensPublicResolverAddress,
      isNative,
      useGas = true,
      confirms,
      bridgeAddress,
      bridgedNetworkConf = {},
      smsURL,
      resultProxyURL,
      ipfsGatewayURL,
      ipfsNodeURL,
      iexecGatewayURL,
      compassURL,
      pocoSubgraphURL,
      providerOptions,
      allowExperimentalNetworks = false,
    } = {},
  ) {
    if (
      ethProvider === undefined ||
      ethProvider === null ||
      ethProvider === ''
    ) {
      throw new ConfigurationError('Missing ethProvider');
    }

    /**
     * JSON RPC provider, API providers, Browser provider (polling option)
     */
    const isEthersAbstractProvider = ethProvider instanceof AbstractProvider;
    /**
     * Browser provider is abstract signer with getSigner
     */
    const isEthersBrowserProvider = ethProvider instanceof BrowserProvider;
    /**
     *  Wallet, JSON RPC signer may have a provider
     */
    const isEthersAbstractSigner = ethProvider instanceof AbstractSigner;
    /**
     *  Wallet, JSON RPC signer with a provider
     */
    const isEthersAbstractSignerWithProvider =
      isEthersAbstractSigner && ethProvider.provider;
    if (isEthersAbstractSigner && !isEthersAbstractSignerWithProvider) {
      throw new ConfigurationError('Missing provider for ethProvider signer');
    }

    /**
     * RPC url, chain name/id
     */
    const isRpcUrlProvider =
      typeof ethProvider === 'string' || typeof ethProvider === 'number';

    let provider;
    let signer;
    try {
      if (isRpcUrlProvider) {
        provider = getReadOnlyProvider(ethProvider, {
          providers: providerOptions,
          allowExperimentalNetworks,
        });
      } else if (isEthersAbstractSignerWithProvider) {
        provider = ethProvider.provider;
        signer = ethProvider;
      } else if (isEthersAbstractProvider) {
        provider = ethProvider;
        if (isEthersBrowserProvider) {
          signer = new BrowserProviderSignerAdapter(ethProvider);
        }
      } else {
        try {
          provider = new BrowserProvider(ethProvider);
          signer = new BrowserProviderSignerAdapter(provider);
        } catch (err) {
          debug('BrowserProvider', err);
          throw new Error('Unsupported provider');
        }
      }
    } catch (err) {
      throw new ConfigurationError(`Invalid ethProvider: ${err.message}`);
    }
    let vSmsUrl;
    try {
      vSmsUrl = basicUrlSchema().validateSync(smsURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid smsURL: ${err.message}`);
    }

    let vIexecGatewayURL;
    try {
      vIexecGatewayURL = basicUrlSchema().validateSync(iexecGatewayURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid iexecGatewayURL: ${err.message}`);
    }

    let vIpfsGatewayURL;
    try {
      vIpfsGatewayURL = basicUrlSchema().validateSync(ipfsGatewayURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid ipfsGatewayURL: ${err.message}`);
    }

    let vIpfsNodeURL;
    try {
      vIpfsNodeURL = basicUrlSchema().validateSync(ipfsNodeURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid ipfsNodeURL: ${err.message}`);
    }

    let vPocoSubgraphURL;
    try {
      vPocoSubgraphURL = basicUrlSchema().validateSync(pocoSubgraphURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid pocoSubgraphURL: ${err.message}`);
    }

    let vResultProxyURL;
    try {
      vResultProxyURL = basicUrlSchema().validateSync(resultProxyURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid resultProxyURL: ${err.message}`);
    }

    let vCompassURL;
    try {
      vCompassURL = basicUrlSchema().validateSync(compassURL);
    } catch (err) {
      throw new ConfigurationError(`Invalid compassURL: ${err.message}`);
    }

    const networkPromise = (async () => {
      const network = await provider.getNetwork().catch((err) => {
        throw new Error(`Failed to detect network: ${err.message}`);
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
      return getChainDefaults(chainId, {
        allowExperimentalNetworks,
      });
    })();

    chainConfDefaultsPromise.catch((err) => {
      debug('chainConfDefaultsPromise', err);
    });

    const contractsPromise = (async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const resolvedHubAddress = hubAddress || chainConfDefaults.hub;
      if (!resolvedHubAddress) {
        throw new ConfigurationError(
          `hubAddress option not set and no default value for your chain ${chainId}`,
        );
      }
      try {
        return new IExecContractsClient({
          chainId,
          provider,
          signer,
          hubAddress: resolvedHubAddress,
          useGas,
          confirms,
          isNative,
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
        bridgedNetworkConf.chainId ?? chainConfDefaults.bridge?.bridgedChainId;
      if (!bridgedChainId) {
        throw new ConfigurationError(
          `Missing chainId in bridgedNetworkConf and no default value for your chain ${chainId}`,
        );
      }
      const bridgedChainConfDefaults = getChainDefaults(bridgedChainId, {
        allowExperimentalNetworks,
      });
      const bridgedRpcUrl =
        bridgedNetworkConf.rpcURL ?? bridgedChainConfDefaults.host;
      if (!bridgedRpcUrl) {
        throw new ConfigurationError(
          `Missing rpcURL in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
        );
      }
      const bridgedBridgeAddress =
        bridgedNetworkConf.bridgeAddress ??
        bridgedChainConfDefaults.bridge?.contract;
      if (!bridgedBridgeAddress) {
        throw new ConfigurationError(
          `Missing bridgeAddress in bridgedNetworkConf and no default value for bridged chain ${bridgedChainId}`,
        );
      }
      const bridgedHubAddress =
        bridgedNetworkConf.hubAddress ?? bridgedChainConfDefaults.hub;
      const contracts = await contractsPromise;
      return {
        chainId: bridgedChainId,
        rpcURL: bridgedRpcUrl,
        isNative: !contracts.isNative,
        hubAddress: bridgedHubAddress,
        bridgeAddress: bridgedBridgeAddress,
      };
    })();

    bridgedConfPromise.catch((err) => {
      debug('bridgedConfPromise', err);
    });

    const bridgedContractsPromise = (async () => {
      const bridgedConf = await bridgedConfPromise;
      const { hubAddress, chainId, isNative, rpcURL } = bridgedConf;
      if (!hubAddress) {
        throw new ConfigurationError(
          `Missing hubAddress in bridgedNetworkConf and no default value for bridged chain ${chainId}`,
        );
      }
      try {
        return new IExecContractsClient({
          chainId,
          provider: getReadOnlyProvider(rpcURL, {
            providers: providerOptions,
            allowExperimentalNetworks,
          }),
          hubAddress,
          confirms,
          isNative,
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

    this.resolveContractsClient = async () => contractsPromise;

    this.resolveBridgedContractsClient = async () => bridgedContractsPromise;

    this.resolveSmsURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = vSmsUrl || chainConfDefaults.sms;
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
      const value = vResultProxyURL || chainConfDefaults.resultProxy;
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
      const value = vIexecGatewayURL || chainConfDefaults.iexecGateway;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `iexecGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveCompassURL = async () => {
      const chainConfDefaults = await chainConfDefaultsPromise;
      return vCompassURL || chainConfDefaults.compass;
    };

    this.resolveIpfsGatewayURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = vIpfsGatewayURL || chainConfDefaults.ipfsGateway;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `ipfsGatewayURL option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolveIpfsNodeURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = vIpfsNodeURL || chainConfDefaults.ipfsNode;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `ipfsNodeURL option not set and no default value for your chain ${chainId}`,
      );
    };

    this.resolvePocoSubgraphURL = async () => {
      const { chainId } = await networkPromise;
      const chainConfDefaults = await chainConfDefaultsPromise;
      const value = vPocoSubgraphURL || chainConfDefaults.pocoSubgraph;
      if (value !== undefined) {
        return value;
      }
      throw new ConfigurationError(
        `pocoSubgraphURL option not set and no default value for your chain ${chainId}`,
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
