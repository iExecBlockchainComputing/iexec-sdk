const ethers = require('ethers');
const Eth = require('web3-eth');

const { utils, IExecConfig, errors } = require('../src/lib');
const { NULL_ADDRESS } = require('../src/common/utils/utils');
const IExecContractsClient = require('../src/common/utils/IExecContractsClient');

console.log('Node version:', process.version);

// CONFIG
const { DRONE, INFURA_PROJECT_ID, ETHERSCAN_API_KEY, ALCHEMY_API_KEY } =
  process.env;
// public chains
console.log('using env INFURA_PROJECT_ID', !!INFURA_PROJECT_ID);
console.log('using env ETHERSCAN_API_KEY', !!ETHERSCAN_API_KEY);
console.log('using env ALCHEMY_API_KEY', !!ALCHEMY_API_KEY);

// 1 block / tx
const tokenChainUrl = DRONE
  ? 'http://token-chain:8545'
  : 'http://localhost:8545';
const nativeChainUrl = DRONE
  ? 'http://native-chain:8545'
  : 'http://localhost:18545';
// secret management service
const smsURL = DRONE ? 'http://token-sms:13300' : 'http://localhost:13300';
// result proxy
const resultProxyURL = DRONE
  ? 'http://token-result-proxy:13200'
  : 'http://localhost:13200';
// marketplace
const iexecGatewayURL = DRONE
  ? 'http://token-gateway:3000'
  : 'http://localhost:13000';

const networkId = 65535;
const hubAddress = '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca';
const enterpriseHubAddress = '0xb80C02d24791fA92fA8983f15390274698A75D23';
const nativeHubAddress = '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca';
const ensRegistryAddress = '0xaf87b82B01E484f8859c980dE69eC8d09D30F22a';
const ensPublicResolverAddress = '0x464E9FC01C2970173B183D24B43A0FA07e6A072E';

const PRIVATE_KEY =
  '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407';

// TESTS
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

    describe('throw Invalid ethProvider', () => {
      test('IExecConfig({ ethProvider: {} })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: {} });
        expect(createConfig).toThrow(
          Error('Invalid ethProvider: Unsupported provider'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
    });

    describe('read-only ethProvider from network name', () => {
      test('IExecConfig({ ethProvider: "mainnet" })', async () => {
        const config = new IExecConfig({ ethProvider: 'mainnet' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "goerli" })', async () => {
        const config = new IExecConfig({ ethProvider: 'goerli' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('5');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(5);
        expect(network.name).toBe('goerli');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "bellecour" })', async () => {
        const config = new IExecConfig({ ethProvider: 'bellecour' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134);
        expect(network.name).toBe('bellecour');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "viviani" })', async () => {
        const config = new IExecConfig({ ethProvider: 'viviani' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('133');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(133);
        expect(network.name).toBe('viviani');
        expect(network.ensAddress).toBeDefined();
      });
      test('throw with unsupported chains - IExecConfig({ ethProvider: "kovan" })', () => {
        const createConfig = () => new IExecConfig({ ethProvider: 'kovan' });
        expect(createConfig).toThrow(
          Error('Invalid ethProvider: Invalid provider host name or url'),
        );
        expect(createConfig).toThrow(errors.ConfigurationError);
      });
    });

    describe('read-only ethProvider from network chainId', () => {
      test('IExecConfig({ ethProvider: "1" })', async () => {
        const config = new IExecConfig({ ethProvider: '1' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "5" })', async () => {
        const config = new IExecConfig({ ethProvider: '5' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('5');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(5);
        expect(network.name).toBe('goerli');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "134" })', async () => {
        const config = new IExecConfig({ ethProvider: '134' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134);
        expect(network.name).toBe('bellecour');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "133" })', async () => {
        const config = new IExecConfig({ ethProvider: '133' });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('133');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(133);
        expect(network.name).toBe('viviani');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: 1 })', async () => {
        const config = new IExecConfig({ ethProvider: 1 });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: 5 })', async () => {
        const config = new IExecConfig({ ethProvider: 5 });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('5');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(5);
        expect(network.name).toBe('goerli');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: 134 })', async () => {
        const config = new IExecConfig({ ethProvider: 134 });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134);
        expect(network.name).toBe('bellecour');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: 133 })', async () => {
        const config = new IExecConfig({ ethProvider: 133 });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('133');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(133);
        expect(network.name).toBe('viviani');
        expect(network.ensAddress).toBeDefined();
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
    });

    describe('read-only ethProvider with API keys', () => {
      test('IExecConfig({ ethProvider: "mainnet" }, { providerOptions : { infura, quorum: 1 }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: {
              infura: INFURA_PROJECT_ID,
              quorum: 1,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.InfuraProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
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
        expect(provider).toBeInstanceOf(ethers.providers.InfuraProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
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
        expect(provider).toBeInstanceOf(ethers.providers.AlchemyProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
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
        expect(provider).toBeInstanceOf(ethers.providers.EtherscanProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "mainnet" }, { providerOptions : { infura, etherscan, alchemy }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'mainnet' },
          {
            providerOptions: {
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
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
      });
    });

    describe('read-only ethProvider from node url', () => {
      test('IExecConfig({ ethProvider: "http://localhost:8545" }, { hubAddress })', async () => {
        const config = new IExecConfig(
          { ethProvider: tokenChainUrl },
          { hubAddress },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('65535');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(65535);
        expect(network.name).toBe('unknown');
        expect(network.ensAddress).toBeUndefined();
      });
      test('IExecConfig({ ethProvider: "https://bellecour.iex.ec" }) - autodetect known network', async () => {
        const config = new IExecConfig({
          ethProvider: 'https://bellecour.iex.ec',
        });
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134);
        expect(network.name).toBe('bellecour');
        expect(network.ensAddress).toBeDefined();
      });
    });

    describe('read-only ethProvider with ens override', () => {
      test('IExecConfig({ ethProvider: "http://localhost:8545" }, { hubAddress, ensRegistryAddress })', async () => {
        const config = new IExecConfig(
          { ethProvider: tokenChainUrl },
          { hubAddress, ensRegistryAddress },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('65535');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(65535);
        expect(network.name).toBe('unknown');
        expect(network.ensAddress).toBe(ensRegistryAddress);
      });
    });

    describe('signer provider from private key', () => {
      test('getSignerFromPrivateKey()', async () => {
        const config = new IExecConfig(
          {
            ethProvider: utils.getSignerFromPrivateKey(
              tokenChainUrl,
              PRIVATE_KEY,
            ),
          },
          { hubAddress, ensRegistryAddress },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('65535');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(65535);
        expect(network.name).toBe('unknown');
        expect(network.ensAddress).toBe(ensRegistryAddress);
      });

      test('getSignerFromPrivateKey() with network fallback', async () => {
        const config = new IExecConfig(
          {
            ethProvider: utils.getSignerFromPrivateKey('mainnet', PRIVATE_KEY, {
              providers: {
                infura: INFURA_PROJECT_ID,
                alchemy: ALCHEMY_API_KEY,
                etherscan: ETHERSCAN_API_KEY,
              },
            }),
          },
          { hubAddress, ensRegistryAddress },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBe(
          '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        );
      });
    });

    describe('web3 provider', () => {
      test('getSignerFromPrivateKey()', async () => {
        const eth = new Eth(tokenChainUrl);
        const config = new IExecConfig(
          {
            ethProvider: eth.currentProvider,
          },
          { hubAddress, ensRegistryAddress },
        );
        const { provider, signer, chainId } =
          await config.resolveContractsClient();
        expect(signer).toBeDefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('65535');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(65535);
        expect(network.name).toBe('unknown');
        expect(network.ensAddress).toBe(ensRegistryAddress);
      });
    });

    describe('bridged chain provider', () => {
      test('IExecConfig({ ethProvider: "bellecour" })', async () => {
        const config = new IExecConfig({ ethProvider: 'bellecour' });
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.FallbackProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
      });
      test('bridged contract IExecConfig({ ethProvider: "bellecour" }, { providerOptions : { infura }})', async () => {
        const config = new IExecConfig(
          { ethProvider: 'bellecour' },
          {
            providerOptions: {
              infura: INFURA_PROJECT_ID,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.InfuraProvider);
        expect(chainId).toBe('1');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(1);
        expect(network.name).toBe('homestead');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "mainnet" })', async () => {
        const config = new IExecConfig({ ethProvider: 'mainnet' });
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('134');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(134);
        expect(network.name).toBe('bellecour');
        expect(network.ensAddress).toBeDefined();
      });
      test('IExecConfig({ ethProvider: "http://localhost:8545" }, { hubAddress, bridgedNetworkConf })', async () => {
        const config = new IExecConfig(
          { ethProvider: tokenChainUrl },
          {
            hubAddress,
            bridgedNetworkConf: {
              rpcURL: tokenChainUrl,
              chainId: '65535',
              hubAddress,
              bridgeAddress: NULL_ADDRESS,
            },
          },
        );
        const { provider, signer, chainId } =
          await config.resolveBridgedContractsClient();
        expect(signer).toBeUndefined();
        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(chainId).toBe('65535');
        const network = await provider.getNetwork();
        expect(network.chainId).toBe(65535);
        expect(network.name).toBe('unknown');
        expect(network.ensAddress).toBeUndefined();
      });
    });
  });

  describe('resolveChainId()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      await expect(config.resolveChainId()).resolves.toBe(networkId);
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
          ethProvider: tokenChainUrl,
        },
        { hubAddress },
      );
      const promise = config.resolveContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.chainId).toBe(`${networkId}`);
      expect(contracts.isNative).toBe(false);
    });
    test('throw on unkwown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `Failed to create contracts client: Missing iExec contract default address for chain ${networkId}`,
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
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
        },
        {
          hubAddress,
          bridgedNetworkConf: {
            chainId: networkId,
            rpcURL: nativeChainUrl,
            hubAddress: nativeHubAddress,
            bridgeAddress: utils.NULL_ADDRESS,
          },
        },
      );
      const promise = config.resolveBridgedContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.chainId).toBe(`${networkId}`);
      expect(contracts.isNative).toBe(true);
    });
    test('throw on unkwown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveBridgedContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `bridgedNetworkConf option not set and no default value for your chain ${networkId}`,
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

  describe('resolveStandardContractsClient()', () => {
    test('success', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveStandardContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.hubAddress).toBe(
        '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
      );
      expect(contracts.flavour).toBe('standard');
    });
    test('success on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
        },
        { hubAddress },
      );
      const promise = config.resolveStandardContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.hubAddress).toBe(hubAddress);
      expect(contracts.flavour).toBe('standard');
    });
    test('success with enterpriseSwapConf on custom entreprise chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
          flavour: 'enterprise',
        },
        {
          hubAddress: enterpriseHubAddress,
          enterpriseSwapConf: {
            hubAddress,
          },
        },
      );
      const promise = config.resolveStandardContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.hubAddress).toBe(hubAddress);
      expect(contracts.flavour).toBe('standard');
    });
    test('throw on unkwown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveStandardContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `Failed to create contracts client: Missing iExec contract default address for chain ${networkId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on unkwown enterprise chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
          flavour: 'enterprise',
        },
        {
          hubAddress: enterpriseHubAddress,
        },
      );
      const promise = config.resolveStandardContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `enterpriseSwapConf option not set and no default value for your chain ${networkId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveStandardContractsClient();
      await expect(promise).rejects.toThrow('Failed to detect network:');
      await expect(promise).rejects.toThrow(Error);
    });
  });

  describe('resolveEnterpriseContractsClient()', () => {
    test('success', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'mainnet',
        },
        {
          providerOptions: {
            infura: INFURA_PROJECT_ID,
            alchemy: ALCHEMY_API_KEY,
            etherscan: ETHERSCAN_API_KEY,
          },
        },
      );
      const promise = config.resolveEnterpriseContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.hubAddress).toBe(
        '0x0bf375A6238359CE14987C2285B8B099eE8e8709',
      );
      expect(contracts.flavour).toBe('enterprise');
    });
    test('success on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
          flavour: 'enterprise',
        },
        {
          hubAddress: enterpriseHubAddress,
        },
      );
      const promise = config.resolveEnterpriseContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.hubAddress).toBe(enterpriseHubAddress);
      expect(contracts.flavour).toBe('enterprise');
    });
    test('success with enterpriseSwapConf on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
        },
        {
          hubAddress,
          enterpriseSwapConf: {
            hubAddress: enterpriseHubAddress,
          },
        },
      );
      const promise = config.resolveEnterpriseContractsClient();
      await expect(promise).resolves.toBeInstanceOf(IExecContractsClient);
      const contracts = await promise;
      expect(contracts.hubAddress).toBe(enterpriseHubAddress);
      expect(contracts.flavour).toBe('enterprise');
    });
    test('throw on unsupported chain', async () => {
      const config = new IExecConfig({
        ethProvider: 'bellecour',
      });
      const promise = config.resolveEnterpriseContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `enterpriseSwapConf option not set and no default value for your chain 134`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on unkwown chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
        },
        {
          hubAddress,
        },
      );
      const promise = config.resolveEnterpriseContractsClient();
      await expect(promise).rejects.toThrow(
        Error(
          `enterpriseSwapConf option not set and no default value for your chain ${networkId}`,
        ),
      );
      await expect(promise).rejects.toThrow(errors.ConfigurationError);
    });
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveEnterpriseContractsClient();
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
    test('success smsURL override', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { smsURL },
      );
      const promise = config.resolveSmsURL();
      await expect(promise).resolves.toBe(smsURL);
    });
    test('success with smsURL on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
        },
        { smsURL },
      );
      const promise = config.resolveSmsURL();
      await expect(promise).resolves.toBe(smsURL);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveSmsURL();
      await expect(promise).rejects.toThrow(
        Error(
          `smsURL option not set and no default value for your chain ${networkId}`,
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
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { resultProxyURL },
      );
      const promise = config.resolveResultProxyURL();
      await expect(promise).resolves.toBe(resultProxyURL);
    });
    test('success with resultProxyURL on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: tokenChainUrl,
        },
        { resultProxyURL },
      );
      const promise = config.resolveResultProxyURL();
      await expect(promise).resolves.toBe(resultProxyURL);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveResultProxyURL();
      await expect(promise).rejects.toThrow(
        Error(
          `resultProxyURL option not set and no default value for your chain ${networkId}`,
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
    test('success on custom chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveIexecGatewayURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
    });
    test('success iexecGatewayURL override', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { iexecGatewayURL },
      );
      const promise = config.resolveIexecGatewayURL();
      await expect(promise).resolves.toBe(iexecGatewayURL);
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
    test('success on custom chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveIpfsGatewayURL();
      const url = await promise;
      expect(typeof url).toBe('string');
      expect(url.length > 0).toBe(true);
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
    test('throw on network error', async () => {
      const config = new IExecConfig({
        ethProvider: 'http://localhost:8888',
      });
      const promise = config.resolveIpfsGatewayURL();
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
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { bridgeAddress: utils.NULL_ADDRESS },
      );
      const promise = config.resolveBridgeAddress();
      await expect(promise).resolves.toBe(utils.NULL_ADDRESS);
    });
    test('success with bridgeAddress on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        { bridgeAddress: utils.NULL_ADDRESS },
      );
      const promise = config.resolveBridgeAddress();
      await expect(promise).resolves.toBe(utils.NULL_ADDRESS);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveBridgeAddress();
      await expect(promise).rejects.toThrow(
        Error(
          `bridgeAddress option not set and no default value for your chain ${networkId}`,
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
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          bridgedNetworkConf: {
            bridgeAddress: utils.NULL_ADDRESS,
          },
        },
      );
      const promise = config.resolveBridgeBackAddress();
      await expect(promise).resolves.toBe(utils.NULL_ADDRESS);
    });
    test('success with bridgeAddress on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          bridgedNetworkConf: {
            bridgeAddress: utils.NULL_ADDRESS,
          },
        },
      );
      const promise = config.resolveBridgeBackAddress();
      await expect(promise).resolves.toBe(utils.NULL_ADDRESS);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveBridgeBackAddress();
      await expect(promise).rejects.toThrow(
        Error(
          `bridgedNetworkConf option not set and no default value for your chain ${networkId}`,
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
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          ensPublicResolverAddress,
        },
      );
      const promise = config.resolveEnsPublicResolverAddress();
      await expect(promise).resolves.toBe(ensPublicResolverAddress);
    });
    test('success with ensPublicResolverAddress on custom chain', async () => {
      const config = new IExecConfig(
        {
          ethProvider: 'bellecour',
        },
        {
          ensPublicResolverAddress,
        },
      );
      const promise = config.resolveEnsPublicResolverAddress();
      await expect(promise).resolves.toBe(ensPublicResolverAddress);
    });
    test('throw on unknown chain', async () => {
      const config = new IExecConfig({
        ethProvider: tokenChainUrl,
      });
      const promise = config.resolveEnsPublicResolverAddress();
      await expect(promise).rejects.toThrow(
        Error(
          `ensPublicResolverAddress option not set and no default value for your chain ${networkId}`,
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
});
