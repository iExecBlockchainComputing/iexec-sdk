import { describe, test, expect } from '@jest/globals';
import { JsonRpcProvider, BrowserProvider, Wallet, HDNodeWallet } from 'ethers';
import {
  InjectedProvider,
  TEST_CHAINS,
  getRandomWallet,
} from '../../test-utils.js';
import '../../jest-setup.js';

import { utils, IExecConfig, errors } from '../../../src/lib/index.js';
import IExecContractsClient from '../../../src/common/utils/IExecContractsClient.js';
import { getChainDefaults } from '../../../src/common/utils/config.js';

const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];
const unknownTestChain = TEST_CHAINS['unknown-chain'];

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
      test('IExecConfig({ ethProvider }, { smsURL: { } })', () => {
        const createConfig = () =>
          new IExecConfig({ ethProvider: 'arbitrum-mainnet' }, { smsURL: {} });
        expect(createConfig).toThrow(
          new Error(
            'Invalid smsURL: this must be a `string` type, but the final value was: `{}`.',
          ),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
    });

    describe('read-only ethProvider from network name', () => {
      test('IExecConfig({ ethProvider: "arbitrum-mainnet" })', async () => {
        const config = new IExecConfig({ ethProvider: 'arbitrum-mainnet' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('42161');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(42161n);
        expect(network.name).toBe('arbitrum');
      });
      test('throw with unsupported chains - IExecConfig({ ethProvider: "kovan" })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: 'kovan' });
        expect(createConfig).toThrow(
          new Error('Invalid ethProvider: Invalid provider host name or url'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      // skipped because no experimental networks are currently defined
      describe.skip('allowExperimentalNetworks', () => {
        test('throw with experimental chains when allowExperimentalNetworks is not enabled', () => {
          const createConfig = () =>
            new IExecConfig({ ethProvider: 'arbitrum-sepolia-testnet' });
          expect(createConfig).toThrow(
            new Error('Invalid ethProvider: Invalid provider host name or url'),
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
      test('IExecConfig({ ethProvider: "42161" })', async () => {
        const config = new IExecConfig({ ethProvider: '42161' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('42161');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(42161n);
        expect(network.name).toBe('arbitrum');
      });
      test('IExecConfig({ ethProvider: "421614" })', async () => {
        const config = new IExecConfig({ ethProvider: '421614' });
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
      test('IExecConfig({ ethProvider: 42161 })', async () => {
        const config = new IExecConfig({ ethProvider: 42161 });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('42161');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(42161n);
        expect(network.name).toBe('arbitrum');
      });
      test('throw with unsupported chains - IExecConfig({ ethProvider: 42 })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: 42 });
        expect(createConfig).toThrow(
          new Error('Invalid ethProvider: Invalid provider host name or url'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      test('throw with unsupported chains - IExecConfig({ ethProvider: "42" })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: '42' });
        expect(createConfig).toThrow(
          new Error('Invalid ethProvider: Invalid provider host name or url'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
      // skipped because no experimental networks are currently defined
      describe.skip('allowExperimentalNetworks', () => {
        test('throw with experimental chains when allowExperimentalNetworks is not enabled', () => {
          const createConfig = () => new IExecConfig({ ethProvider: 421614 });
          expect(createConfig).toThrow(
            new Error('Invalid ethProvider: Invalid provider host name or url'),
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
      });
      test('IExecConfig({ ethProvider: "https://sepolia-rollup.arbitrum.io/rpc" }) - autodetect known network', async () => {
        const config = new IExecConfig({
          ethProvider: 'https://sepolia-rollup.arbitrum.io/rpc',
        });
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
      // skipped because no experimental networks are currently defined
      describe.skip('allowExperimentalNetworks', () => {
        const experimentalNetworkRpcUrl = getChainDefaults(421614, {
          allowExperimentalNetworks: true,
        }).host;

        test('fail resolving config with experimental chains when allowExperimentalNetworks is not enabled', async () => {
          const config = new IExecConfig({
            ethProvider: experimentalNetworkRpcUrl,
          });

          await expect(config.resolveContractsClient()).rejects.toThrow(
            new Error(
              'hubAddress option not set and no default value for your chain 421614',
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
            testChain.rpcURL,
            wallet.privateKey,
          ),
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(testChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(testChain.chainId));
        expect(network.name).toBe(testChain.defaults.name);
      });

      test('getSignerFromPrivateKey() with network name', async () => {
        const wallet = getRandomWallet();
        const config = new IExecConfig({
          ethProvider: utils.getSignerFromPrivateKey(
            'arbitrum-mainnet',
            wallet.privateKey,
          ),
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe('42161');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(42161n);
        expect(network.name).toBe('arbitrum');
      });
    });

    describe('web3 provider', () => {
      test('InjectedProvider', async () => {
        const injectedProvider = new InjectedProvider(
          testChain.rpcURL,
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
        expect(chainId).toBe(testChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(testChain.chainId));
        expect(network.name).toBe(testChain.defaults.name);
      });
      // skipped because no experimental networks are currently defined
      describe.skip('allowExperimentalNetworks', () => {
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
            new Error(
              'hubAddress option not set and no default value for your chain 421614',
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
        const ethersProvider = new JsonRpcProvider(testChain.rpcURL);
        const config = new IExecConfig({
          ethProvider: ethersProvider,
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(JsonRpcProvider);
        expect(chainId).toBe(testChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(testChain.chainId));
        expect(network.name).toBe(testChain.defaults.name);
      });
    });

    describe('ethers AbstractSigner', () => {
      test('throw if no provider is connected', async () => {
        const ethersSigner = Wallet.createRandom();
        const createConfig = () =>
          new IExecConfig({ ethProvider: ethersSigner });
        expect(createConfig).toThrow(
          new Error('Missing provider for ethProvider signer'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });

      test('Wallet with provider', async () => {
        const ethersSigner = Wallet.createRandom(
          new JsonRpcProvider(testChain.rpcURL),
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
        expect(chainId).toBe(testChain.chainId);
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(BigInt(testChain.chainId));
        expect(network.name).toBe(testChain.defaults.name);
      });
    });
  });

  describe('resolveChainId()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: testChain.rpcURL,
      });
      await expect(config.resolveChainId()).resolves.toBe(
        parseInt(testChain.chainId, 10),
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
        ethProvider: 'arbitrum-sepolia-testnet',
      });
      const promise = config.resolveContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.chainId).toBe('421614');
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
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: unknownTestChain.rpcURL,
      });
      const promise = config.resolveContractsClient();
      await expect(promise).rejects.toThrow(
        new Error(
          `hubAddress option not set and no default value for your chain ${unknownTestChain.chainId}`,
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

  describe('resolveSmsURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'arbitrum-sepolia-testnet',
      });
      const promise = config.resolveSmsURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success smsURL override default URL', async () => {
      const smsOverride = 'http://sms-override.iex.ec';
      const config = new IExecConfig(
        {
          ethProvider: 'arbitrum-sepolia-testnet',
        },
        { smsURL: smsOverride },
      );
      await expect(config.resolveSmsURL()).resolves.toBe(smsOverride);
    });
    test('success smsURL sets the URL on custom chain', async () => {
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
        new Error(
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
  });

  describe('resolveIexecGatewayURL()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'arbitrum-sepolia-testnet',
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
          ethProvider: 'arbitrum-sepolia-testnet',
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
        ethProvider: 'arbitrum-sepolia-testnet',
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
          ethProvider: 'arbitrum-sepolia-testnet',
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
        ethProvider: 'arbitrum-sepolia-testnet',
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
          ethProvider: 'arbitrum-sepolia-testnet',
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
});
