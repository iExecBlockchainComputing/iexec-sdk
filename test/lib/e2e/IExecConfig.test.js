// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  JsonRpcProvider,
  FallbackProvider,
  AlchemyProvider,
  InfuraProvider,
  EtherscanProvider,
  CloudflareProvider,
  BrowserProvider,
  Wallet,
  HDNodeWallet,
} from 'ethers';
import {
  ALCHEMY_API_KEY,
  ETHERSCAN_API_KEY,
  INFURA_PROJECT_ID,
  InjectedProvider,
  TEST_CHAINS,
  TEE_FRAMEWORKS,
  getRandomAddress,
  getRandomWallet,
  DEFAULT_PROVIDER_OPTIONS,
} from '../../test-utils.js';
import '../../jest-setup.js';

import { utils, IExecConfig, errors } from '../../../src/lib/index.js';
import IExecContractsClient from '../../../src/common/utils/IExecContractsClient.js';
import { getChainDefaults } from '../../../src/common/utils/config.js';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];
const unknownTestChain = TEST_CHAINS['custom-token-chain'];

describe('[IExecConfig]', () => {
  describe('constructor', () => {
    describe('throw Missing ethProvider', () => {
      test('IExecConfig()', () => {
        const createConfig = () => new IExecConfig();
        expect(createConfig).toThrow(Error('Missing ethProvider'));
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      test('IExecConfig({})', () => {
        const createConfig = () => new IExecConfig({});
        expect(createConfig).toThrow(Error('Missing ethProvider'));
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      test('IExecConfig({ ethProvider: null })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: null });
        expect(createConfig).toThrow(Error('Missing ethProvider'));
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      test("IExecConfig({ ethProvider: '' })", () => {
        const createConfig = () => new IExecConfig({ ethProvider: '' });
        expect(createConfig).toThrow(Error('Missing ethProvider'));
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
    });

    describe('throw Invalid option smsURL', () => {
      test('IExecConfig({ ethProvider }, { smsURL: { foo: "https://foo.com" } })', () => {
        const createConfig = () =>
          new IExecConfig(
            { ethProvider: 'bellecour' },
            { smsURL: { foo: 'https://foo.com' } },
          );
        expect(createConfig).toThrow(
          Error('Invalid smsURL: this field has unspecified keys: foo'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
    });

    describe('throw Invalid option defaultTeeFramework', () => {
      test('IExecConfig({ ethProvider }, { defaultTeeFramework: "foo" })', () => {
        const createConfig = () =>
          new IExecConfig(
            { ethProvider: 'bellecour' },
            { defaultTeeFramework: 'foo' },
          );
        expect(createConfig).toThrow(
          Error(
            'Invalid defaultTeeFramework: this is not a valid TEE framework',
          ),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
    });

    describe('read-only ethProvider from network name', () => {
      test('IExecConfig({ ethProvider: "mainnet" })', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: DEFAULT_PROVIDER_OPTIONS,
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e');
      });
      test('IExecConfig({ ethProvider: "bellecour" })', async () => {
        const config = new IExecConfig({ ethProvider: 'bellecour' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134n);
        expect(network.name).toBe('bellecour');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x5f5B93fca68c9C79318d1F3868A354EE67D8c006');
      });
      test('throw with unsupported chains - IExecConfig({ ethProvider: "kovan" })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: 'kovan' });
        expect(createConfig).toThrow(
          Error('Invalid ethProvider: Invalid provider host name or url'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      describe('allowExperimentalNetworks', () => {
        test('throw with experimental chains when allowExperimentalNetworks is not enabled', () => {
          const createConfig = () =>
            new IExecConfig({ ethProvider: 'arbitrum-sepolia-testnet' });
          expect(createConfig).toThrow(
            Error('Invalid ethProvider: Invalid provider host name or url'),
          );
          expect(createConfig).toThrow(errors.ConfigurationError);
        });
        test('allows experimental chains when allowExperimentalNetworks is enabled', async () => {
          const config = new IExecConfig(
            { ethProvider: 'arbitrum-sepolia-testnet' },
            { allowExperimentalNetworks: true },
          );
          const { provider, signer, chainId } =
            await config.resolveContractsClient();
          expect(signer).toBeUndefined();
          expect(provider).toBeDefined();
          expect(provider).toBeInstanceOf(JsonRpcProvider);
          expect(chainId).toBe('421614');
          const network = await provider.getNetwork();
          expect(network.chainId).toBe(421614n);
          expect(network.name).toBe('arbitrum-sepolia');
        });
      });
    });

    describe('read-only ethProvider from network chainId', () => {
      test('IExecConfig({ ethProvider: "1" })', async () => {
        const config = new IExecConfig(
          { ethProvider: '1' },
          {
            providerOptions: DEFAULT_PROVIDER_OPTIONS,
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e');
      });
      test('IExecConfig({ ethProvider: "134" })', async () => {
        const config = new IExecConfig({ ethProvider: '134' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134n);
        expect(network.name).toBe('bellecour');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x5f5B93fca68c9C79318d1F3868A354EE67D8c006');
      });
      test('IExecConfig({ ethProvider: 1 })', async () => {
        const config = new IExecConfig(
          { ethProvider: 1 },
          {
            providerOptions: DEFAULT_PROVIDER_OPTIONS,
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e');
      });
      test('IExecConfig({ ethProvider: 134 })', async () => {
        const config = new IExecConfig({ ethProvider: 134 });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134n);
        expect(network.name).toBe('bellecour');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x5f5B93fca68c9C79318d1F3868A354EE67D8c006');
      });
      test('throw with unsupported chains - IExecConfig({ ethProvider: 42 })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: 42 });
        expect(createConfig).toThrow(
          Error('Invalid ethProvider: Invalid provider host name or url'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      test('throw with unsupported chains - IExecConfig({ ethProvider: "42" })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: '42' });
        expect(createConfig).toThrow(
          Error('Invalid ethProvider: Invalid provider host name or url'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      describe('allowExperimentalNetworks', () => {
        test('throw with experimental chains when allowExperimentalNetworks is not enabled', () => {
          const createConfig = () => new IExecConfig({ ethProvider: 421614 });
          expect(createConfig).toThrow(
            Error('Invalid ethProvider: Invalid provider host name or url'),
          );
          expect(createConfig).toThrow(errors.ConfigurationError);
        });
        test('allows experimental chains when allowExperimentalNetworks is enabled', async () => {
          const config = new IExecConfig(
            { ethProvider: 421614 },
            { allowExperimentalNetworks: true },
          );
          const { provider, signer, chainId } =
            await config.resolveContractsClient();
          expect(signer).toBeUndefined();
          expect(provider).toBeDefined();
          expect(provider).toBeInstanceOf(JsonRpcProvider);
          expect(chainId).toBe('421614');
          const network = await provider.getNetwork();
          expect(network.chainId).toBe(421614n);
          expect(network.name).toBe('arbitrum-sepolia');
        });
      });
    });

    describe('read-only ethProvider with API keys', () => {
      test('IExecConfig({ ethProvider: "mainnet" }, { providerOptions : { infura, alchemy, quorum: 1 }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: {
              alchemy: ALCHEMY_API_KEY,
              infura: INFURA_PROJECT_ID,
              quorum: 1,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "mainnet" }, { providerOptions : { infura }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: {
              infura: INFURA_PROJECT_ID,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(InfuraProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "mainnet" }, { providerOptions : { alchemy }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: {
              alchemy: ALCHEMY_API_KEY,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(AlchemyProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "mainnet" }, { providerOptions : { etherscan }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: {
              etherscan: ETHERSCAN_API_KEY,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(EtherscanProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "mainnet" }, { providerOptions : { cloudflare, infura, etherscan, alchemy }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: {
              cloudflare: true,
              infura: INFURA_PROJECT_ID,
              alchemy: ALCHEMY_API_KEY,
              etherscan: ETHERSCAN_API_KEY,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(provider.providerConfigs.length).toBe(4);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
    });

    describe('read-only ethProvider from node url', () => {
      test('IExecConfig({ ethProvider: "http://localhost:8545" }, { hubAddress })', async () => {
        const config = new IExecConfig(
          { ethProvider: unknownTestChain.rpcURL },
          { hubAddress: unknownTestChain.hubAddress },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(unknownTestChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(unknownTestChain.chainId));
        expect(network.name).toBe('unknown');
        expect(network.getPlugin('org.ethers.plugins.network.Ens')).toBe(null);
      });
      test('IExecConfig({ ethProvider: "https://bellecour.iex.ec" }) - autodetect known network', async () => {
        const config = new IExecConfig({
          ethProvider: 'https://bellecour.iex.ec',
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134n);
        expect(network.name).toBe('bellecour');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x5f5B93fca68c9C79318d1F3868A354EE67D8c006');
      });
      describe('allowExperimentalNetworks', () => {
        const experimentalNetworkRpcUrl = getChainDefaults(421614, {
          allowExperimentalNetworks: true,
        }).host;

        test('fail resolving config with experimental chains when allowExperimentalNetworks is not enabled', async () => {
          const config = new IExecConfig({
            ethProvider: experimentalNetworkRpcUrl,
          });

          await expect(config.resolveContractsClient()).rejects.toThrow(
            Error(
              'Failed to create contracts client: Missing iExec contract default address for chain 421614',
            ),
          );
        });
        test('allows experimental chains when allowExperimentalNetworks is enabled', async () => {
          const config = new IExecConfig(
            { ethProvider: experimentalNetworkRpcUrl },
            { allowExperimentalNetworks: true },
          );
          const { provider, signer, chainId } =
            await config.resolveContractsClient();
          expect(signer).toBeUndefined();
          expect(provider).toBeDefined();
          expect(provider).toBeInstanceOf(JsonRpcProvider);
          expect(chainId).toBe('421614');
          const network = await provider.getNetwork();
          expect(network.chainId).toBe(421614n);
          expect(network.name).toBe('arbitrum-sepolia');
        });
      });
    });

    describe('signer provider from private key', () => {
      test('getSignerFromPrivateKey()', async () => {
        const wallet = getRandomWallet();
        const config = new IExecConfig({
          ethProvider: utils.getSignerFromPrivateKey(
            iexecTestChain.rpcURL,
            wallet.privateKey,
          ),
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(iexecTestChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(iexecTestChain.chainId));
        expect(network.name).toBe(iexecTestChain.defaults.name);
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe(iexecTestChain.defaults.ensRegistryAddress);
      });

      test('getSignerFromPrivateKey() with network fallback', async () => {
        const wallet = getRandomWallet();
        const config = new IExecConfig({
          ethProvider: utils.getSignerFromPrivateKey(
            'mainnet',
            wallet.privateKey,
            {
              providers: DEFAULT_PROVIDER_OPTIONS,
            },
          ),
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e');
      });
    });

    describe('web3 provider', () => {
      test('InjectedProvider', async () => {
        const injectedProvider = new InjectedProvider(
          iexecTestChain.rpcURL,
          getRandomWallet().privateKey,
        );
        const config = new IExecConfig({
          ethProvider: injectedProvider,
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(BrowserProvider);
        expect(chainId).toBe(iexecTestChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(iexecTestChain.chainId));
        expect(network.name).toBe(iexecTestChain.defaults.name);
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe(iexecTestChain.defaults.ensRegistryAddress);
      });
      describe('allowExperimentalNetworks', () => {
        const experimentalNetworkRpcUrl = getChainDefaults(421614, {
          allowExperimentalNetworks: true,
        }).host;

        test('fail resolving config with experimental chains when allowExperimentalNetworks is not enabled', async () => {
          const injectedProvider = new InjectedProvider(
            experimentalNetworkRpcUrl,
            getRandomWallet().privateKey,
          );
          const config = new IExecConfig({
            ethProvider: injectedProvider,
          });

          await expect(config.resolveContractsClient()).rejects.toThrow(
            Error(
              'Failed to create contracts client: Missing iExec contract default address for chain 421614',
            ),
          );
        });
        test('allows experimental chains when allowExperimentalNetworks is enabled', async () => {
          const injectedProvider = new InjectedProvider(
            experimentalNetworkRpcUrl,
            getRandomWallet().privateKey,
          );
          const config = new IExecConfig(
            { ethProvider: injectedProvider },
            { allowExperimentalNetworks: true },
          );
          const { provider, signer, chainId } =
            await config.resolveContractsClient();
          expect(signer).toBeDefined();
          expect(provider).toBeDefined();
          expect(provider).toBeInstanceOf(BrowserProvider);
          expect(chainId).toBe('421614');
          const network = await provider.getNetwork();
          expect(network.chainId).toBe(421614n);
          expect(network.name).toBe('arbitrum-sepolia');
        });
      });
    });

    describe('ethers AbstractProvider', () => {
      test('JsonRpcProvider', async () => {
        const ethersProvider = new JsonRpcProvider(iexecTestChain.rpcURL);
        const config = new IExecConfig({
          ethProvider: ethersProvider,
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(iexecTestChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(iexecTestChain.chainId));
        expect(network.name).toBe(iexecTestChain.defaults.name);
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe(iexecTestChain.defaults.ensRegistryAddress);
      });

      test('JsonRpcProvider with custom network (including ens)', async () => {
        const ethersProvider = new JsonRpcProvider(unknownTestChain.rpcURL, {
          chainId: parseInt(unknownTestChain.chainId, 10),
          name: 'test',
          ensAddress: unknownTestChain.ensRegistryAddress,
        });
        const config = new IExecConfig(
          {
            ethProvider: ethersProvider,
          },
          {
            hubAddress: unknownTestChain.hubAddress,
            ensRegistryAddress: unknownTestChain.ensRegistryAddress,
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(unknownTestChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(unknownTestChain.chainId));
        expect(network.name).toBe('test');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe(unknownTestChain.ensRegistryAddress);
      });
    });

    describe('ethers AbstractSigner', () => {
      test('throw if no provider is connected', async () => {
        const ethersSigner = Wallet.createRandom();
        const createConfig = () =>
          new IExecConfig({ ethProvider: ethersSigner });
        expect(createConfig).toThrow(
          Error('Missing provider for ethProvider signer'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });

      test('Wallet with provider', async () => {
        const ethersSigner = Wallet.createRandom(
          new JsonRpcProvider(iexecTestChain.rpcURL),
        );
        const config = new IExecConfig({
          ethProvider: ethersSigner,
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(signer).toBeInstanceOf(HDNodeWallet);
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(iexecTestChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(iexecTestChain.chainId));
        expect(network.name).toBe(iexecTestChain.defaults.name);
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBe(iexecTestChain.defaults.ensRegistryAddress);
      });
    });

    describe('bridged chain provider', () => {
      test('IExecConfig({ ethProvider: "bellecour" })', async () => {
        const config = new IExecConfig(
          { ethProvider: 'bellecour' },
          {
            providerOptions: DEFAULT_PROVIDER_OPTIONS,
          },
        );
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
      test('bridged contract IExecConfig({ ethProvider: "bellecour" }, { providerOptions : { infura }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'bellecour' },
          {
            providerOptions: {
              cloudflare: true,
              infura: INFURA_PROJECT_ID,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(FallbackProvider);
        expect(provider.providerConfigs.length).toBe(2);
        expect(provider.providerConfigs[0].provider).toBeInstanceOf(
          CloudflareProvider,
        );
        expect(provider.providerConfigs[1].provider).toBeInstanceOf(
          InfuraProvider,
        );
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1n);
        expect(network.name).toBe('mainnet');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "mainnet" })', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: DEFAULT_PROVIDER_OPTIONS,
          },
        );
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134n);
        expect(network.name).toBe('bellecour');
        expect(
          network.getPlugin('org.ethers.plugins.network.Ens').address,
        ).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "http://localhost:8545" }, { hubAddress, bridgedNetworkConf })', async () => {
        const config = new IExecConfig(
          { ethProvider: iexecTestChain.rpcURL },
          {
            bridgedNetworkConf: {
              rpcURL: unknownTestChain.rpcURL,
              chainId: unknownTestChain.chainId,
              hubAddress: unknownTestChain.hubAddress,
              bridgeAddress: utils.NULL_ADDRESS,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(unknownTestChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(unknownTestChain.chainId));
        expect(network.name).toBe('unknown');
        expect(network.getPlugin('org.ethers.plugins.network.Ens')).toBe(null);
      });
    });
  });

  describe('resolveChainId()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: iexecTestChain.rpcURL,
      });
      await expect(config.resolveChainId()).resolves.toBe(
        parseInt(iexecTestChain.chainId, 10),
      );
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      await expect(config.resolveChainId()).rejects.toThrow(
        'Failed to detect network:',
      );
      await expect(config.resolveChainId()).rejects.toThrow(Error);
    });
  });

  describe('resolveContractsClient()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.chainId).toBe('134');
      expect(contracts.isNative).toBe(true);
    });
    test('success with hubAddress on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        { hubAddress: unknownTestChain.hubAddress },
      );
      const promise = config.resolveContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.chainId).toBe(unknownTestChain.chainId);
      expect(contracts.isNative).toBe(false);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `Failed to create contracts client: Missing iExec contract default address for chain ${unknownTestChain.chainId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveContractsClient();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveBridgedContractsClient()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveBridgedContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.chainId).toBe('1');
      expect(contracts.isNative).toBe(false);
    });
    test('success with bridgedNetworkConf on custom chain', async () => {
      const homeChain = unknownTestChain;
      const bridgedChain = unknownTestChain;
      const config = new IExecConfig(
        {
          ethProvider: homeChain.rpcURL,
        },
        {
          hubAddress: homeChain.rpcURL,
          bridgedNetworkConf: {
            chainId: bridgedChain.chainId,
            rpcURL: bridgedChain.rpcURL,
            hubAddress: bridgedChain.hubAddress,
            bridgeAddress: utils.NULL_ADDRESS,
          },
        },
      );
      const promise = config.resolveBridgedContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.chainId).toBe(bridgedChain.chainId);
      expect(contracts.isNative).toBe(true);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveBridgedContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `bridgedNetworkConf option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveBridgedContractsClient();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveSmsURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveSmsURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success default resolves to scone', async () => {
      const defaultSms = await new IExecConfig({
        ethProvider: 'bellecour',
      }).resolveSmsURL();
      const sconeSmsUrl = await new IExecConfig({
        ethProvider: 'bellecour',
      }).resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.SCONE });
      const gramineSmsUrl = await new IExecConfig({
        ethProvider: 'bellecour',
      }).resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.GRAMINE });
      expect(defaultSms).toBe(sconeSmsUrl);
      expect(defaultSms).not.toBe(gramineSmsUrl);
    });
    test('success override defaultTeeFramework', async () => {
      const defaultSms = await new IExecConfig({
        ethProvider: 'bellecour',
      }).resolveSmsURL();
      const defaultSmsTeeFrameworkOverride = await new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { defaultTeeFramework: TEE_FRAMEWORKS.GRAMINE },
      ).resolveSmsURL();
      const gramineSms = await new IExecConfig({
        ethProvider: 'bellecour',
      }).resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.GRAMINE });
      expect(defaultSmsTeeFrameworkOverride).toBe(gramineSms);
      expect(defaultSmsTeeFrameworkOverride).not.toBe(defaultSms);
    });
    test('success smsURL object override per teeFramework', async () => {
      const smsMap = {
        scone: 'http://foo.io',
        gramine: 'http://bar.io',
      };
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { smsURL: smsMap },
      );
      await expect(
        config.resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.SCONE }),
      ).resolves.toBe(smsMap.scone);
      await expect(
        config.resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.GRAMINE }),
      ).resolves.toBe(smsMap.gramine);
    });
    test('success smsURL object override only one teeFramework', async () => {
      const sconeDefaultSms = await new IExecConfig({
        ethProvider: 'bellecour',
      }).resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.SCONE });
      const smsMap = {
        gramine: 'http://bar.io',
      };
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { smsURL: smsMap },
      );
      await expect(
        config.resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.SCONE }),
      ).resolves.toBe(sconeDefaultSms);
      await expect(
        config.resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.GRAMINE }),
      ).resolves.toBe(smsMap.gramine);
    });
    test('success smsURL string override all teeFramework', async () => {
      const smsOverride = 'http://sms-override.iex.ec';
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { smsURL: smsOverride },
      );
      await expect(config.resolveSmsURL()).resolves.toBe(smsOverride);
      await expect(
        config.resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.SCONE }),
      ).resolves.toBe(smsOverride);
      await expect(
        config.resolveSmsURL({ teeFramework: TEE_FRAMEWORKS.GRAMINE }),
      ).resolves.toBe(smsOverride);
    });
    test('success with smsURL string on custom chain', async () => {
      const smsOverride = 'http://sms-override.iex.ec';
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        { smsURL: smsOverride },
      );
      const promise = config.resolveSmsURL();
      await expect(promise).resolves.toBe(smsOverride);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveSmsURL();
      await expect(promise).rejects.toThrow(
        Error(
          `smsURL option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveSmsURL();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
    test('throw with invalid TEE framework', async () => {
      const config = new IExecConfig({
        ethProvider: iexecTestChain.rpcURL,
      });
      const promise = config.resolveSmsURL({ teeFramework: 'foo' });
      await expect(promise).rejects.toThrow(
        Error(`teeFramework is not a valid TEE framework`),
      );
      await expect(promise).rejects.toThrow(errors.ValidationError);
    });
  });

  describe('resolveResultProxyURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveResultProxyURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success resultProxyURL override', async () => {
      const resultProxyOverride = 'http://rp-override.iex.ec';
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { resultProxyURL: resultProxyOverride },
      );
      const promise = config.resolveResultProxyURL();
      await expect(promise).resolves.toBe(resultProxyOverride);
    });
    test('success with resultProxyURL on custom chain', async () => {
      const resultProxyOverride = 'http://rp-override.iex.ec';
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        { resultProxyURL: resultProxyOverride },
      );
      const promise = config.resolveResultProxyURL();
      await expect(promise).resolves.toBe(resultProxyOverride);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveResultProxyURL();
      await expect(promise).rejects.toThrow(
        Error(
          `resultProxyURL option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveResultProxyURL();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveIexecGatewayURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveIexecGatewayURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success when configured on custom chain', async () => {
      const marketOverride = 'https://api.market-override.iex.ec';
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        { iexecGatewayURL: marketOverride },
      );
      const promise = config.resolveIexecGatewayURL();
      await expect(promise).resolves.toBe(marketOverride);
    });
    test('success iexecGatewayURL override', async () => {
      const marketOverride = 'https://api.market-override.iex.ec';
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { iexecGatewayURL: marketOverride },
      );
      const promise = config.resolveIexecGatewayURL();
      await expect(promise).resolves.toBe(marketOverride);
    });
    test('throw when not configured on custom chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveIexecGatewayURL();
      await expect(promise).rejects.toThrow(
        `iexecGatewayURL option not set and no default value for your chain ${unknownTestChain.chainId}`,
      );
      await expect(promise).rejects.toThrow(Error);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveIexecGatewayURL();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveIpfsGatewayURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveIpfsGatewayURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success when configured on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        { ipfsGatewayURL: 'https://custom-ipfs.iex.ec' },
      );
      const promise = config.resolveIpfsGatewayURL();
      await expect(promise).resolves.toBe('https://custom-ipfs.iex.ec');
    });
    test('success ipfsGatewayURL override', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { ipfsGatewayURL: 'https://custom-ipfs.iex.ec' },
      );
      const promise = config.resolveIpfsGatewayURL();
      await expect(promise).resolves.toBe('https://custom-ipfs.iex.ec');
    });
    test('throw when not configured on custom chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveIpfsGatewayURL();
      await expect(promise).rejects.toThrow(
        `ipfsGatewayURL option not set and no default value for your chain ${unknownTestChain.chainId}`,
      );
      await expect(promise).rejects.toThrow(Error);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveIpfsGatewayURL();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolvePocoSubgraphURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolvePocoSubgraphURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success when configured on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        { pocoSubgraphURL: 'https://custom-subgraph.iex.ec/subgraph/name' },
      );
      const promise = config.resolvePocoSubgraphURL();
      await expect(promise).resolves.toBe(
        'https://custom-subgraph.iex.ec/subgraph/name',
      );
    });
    test('success pocoSubgraphURL override', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { pocoSubgraphURL: 'https://custom-subgraph.iex.ec/subgraph/name' },
      );
      const promise = config.resolvePocoSubgraphURL();
      await expect(promise).resolves.toBe(
        'https://custom-subgraph.iex.ec/subgraph/name',
      );
    });
    test('throw when not configured on custom chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolvePocoSubgraphURL();
      await expect(promise).rejects.toThrow(
        `pocoSubgraphURL option not set and no default value for your chain ${unknownTestChain.chainId}`,
      );
      await expect(promise).rejects.toThrow(Error);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolvePocoSubgraphURL();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveVoucherSubgraphURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveVoucherSubgraphURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success when configured on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        { voucherSubgraphURL: 'https://custom-subgraph.iex.ec/subgraph/name' },
      );
      const promise = config.resolveVoucherSubgraphURL();
      await expect(promise).resolves.toBe(
        'https://custom-subgraph.iex.ec/subgraph/name',
      );
    });
    test('success voucherSubgraphURL override', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { voucherSubgraphURL: 'https://custom-subgraph.iex.ec/subgraph/name' },
      );
      const promise = config.resolveVoucherSubgraphURL();
      await expect(promise).resolves.toBe(
        'https://custom-subgraph.iex.ec/subgraph/name',
      );
    });
    test('returns null when not configured on custom chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const res = await config.resolveVoucherSubgraphURL();
      expect(res).toBe(null);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveVoucherSubgraphURL();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveBridgeAddress()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveBridgeAddress();
      const address = await promise;
      expect(typeof address).toBe('string');
      expect(address.length).toBe(42);
    });
    test('success bridgeAddress override', async () => {
      const bridgeAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { bridgeAddress: bridgeAddressOverride },
      );
      const promise = config.resolveBridgeAddress();
      await expect(promise).resolves.toBe(bridgeAddressOverride);
    });
    test('success with bridgeAddress on custom chain', async () => {
      const bridgeAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { bridgeAddress: bridgeAddressOverride },
      );
      const promise = config.resolveBridgeAddress();
      await expect(promise).resolves.toBe(bridgeAddressOverride);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveBridgeAddress();
      await expect(promise).rejects.toThrow(
        Error(
          `bridgeAddress option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveBridgeAddress();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveBridgeBackAddress()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveBridgeBackAddress();
      const address = await promise;
      expect(typeof address).toBe('string');
      expect(address.length).toBe(42);
    });
    test('success bridgeAddress override', async () => {
      const bridgeAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          bridgedNetworkConf: {
            bridgeAddress: bridgeAddressOverride,
          },
        },
      );
      const promise = config.resolveBridgeBackAddress();
      await expect(promise).resolves.toBe(bridgeAddressOverride);
    });
    test('success with bridgeAddress on custom chain', async () => {
      const bridgeAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          bridgedNetworkConf: {
            bridgeAddress: bridgeAddressOverride,
          },
        },
      );
      const promise = config.resolveBridgeBackAddress();
      await expect(promise).resolves.toBe(bridgeAddressOverride);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveBridgeBackAddress();
      await expect(promise).rejects.toThrow(
        Error(
          `bridgedNetworkConf option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveBridgeBackAddress();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveEnsPublicResolverAddress()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveEnsPublicResolverAddress();
      const address = await promise;
      expect(typeof address).toBe('string');
      expect(address.length).toBe(42);
    });
    test('success ensPublicResolverAddress override', async () => {
      const ensPublicResolverAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          ensPublicResolverAddress: ensPublicResolverAddressOverride,
        },
      );
      const promise = config.resolveEnsPublicResolverAddress();
      await expect(promise).resolves.toBe(ensPublicResolverAddressOverride);
    });
    test('success with ensPublicResolverAddress on custom chain', async () => {
      const ensPublicResolverAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        {
          ensPublicResolverAddress: ensPublicResolverAddressOverride,
        },
      );
      const promise = config.resolveEnsPublicResolverAddress();
      await expect(promise).resolves.toBe(ensPublicResolverAddressOverride);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveEnsPublicResolverAddress();
      await expect(promise).rejects.toThrow(
        Error(
          `ensPublicResolverAddress option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveEnsPublicResolverAddress();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveVoucherHubAddress()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveVoucherHubAddress();
      const address = await promise;
      expect(typeof address).toBe('string');
      expect(address.length).toBe(42);
    });
    test('success voucherHubAddress override', async () => {
      const voucherHubAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          voucherHubAddress: voucherHubAddressOverride,
        },
      );
      const promise = config.resolveVoucherHubAddress();
      await expect(promise).resolves.toBe(voucherHubAddressOverride);
    });
    test('success with voucherHubAddress on custom chain', async () => {
      const voucherHubAddressOverride = getRandomAddress();
      const config = new IExecConfig(
        {
          ethProvider: unknownTestChain.rpcURL,
        },
        {
          voucherHubAddress: voucherHubAddressOverride,
        },
      );
      const promise = config.resolveVoucherHubAddress();
      await expect(promise).resolves.toBe(voucherHubAddressOverride);
    });
    test('returns null on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const res = await config.resolveVoucherHubAddress();
      expect(res).toBe(null);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveVoucherHubAddress();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });
});
