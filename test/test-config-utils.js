import { Wallet, JsonRpcProvider } from 'ethers';
import { IExec } from '../src/lib/index.js';
import { setBalance } from './test-utils.js';

export const getTestConfigOptions =
  (chain) =>
  ({ options = {} } = {}) => ({
    bridgeAddress: options.bridgeAddress ?? chain.bridgeAddress,
    bridgedNetworkConf: options.bridgedNetworkConf ?? chain.bridgedNetworkConf,
    confirms: options.confirms ?? chain.confirms,
    ensPublicResolverAddress:
      options.ensPublicResolverAddress ?? chain.ensPublicResolverAddress,
    ensRegistryAddress: options.ensRegistryAddress ?? chain.ensRegistryAddress,
    hubAddress: options.hubAddress ?? chain.hubAddress,
    iexecGatewayURL: options.iexecGatewayURL ?? chain.iexecGatewayURL,
    ipfsNodeURL: options.ipfsNodeURL ?? chain.ipfsNodeURL,
    ipfsGatewayURL: options.ipfsGatewayURL ?? chain.ipfsGatewayURL,
    pocoSubgraphURL: options.pocoSubgraphURL ?? chain.pocoSubgraphURL,
    isNative: options.isNative ?? chain.isNative,
    providerOptions: options.providerOptions ?? chain.providerOptions,
    resultProxyURL: options.resultProxyURL ?? chain.resultProxyURL,
    compassURL: options.compassURL ?? chain.compassURL,
    smsURL: options.smsURL ?? chain.smsURL,
    useGas: options.useGas ?? chain.useGas,
  });

export const getTestConfig =
  (
    /**
     * Target test blockchain configuration.
     */
    chain,
  ) =>
  async ({
    /**
     * The private key to use for the wallet, if not provided a random wallet will be created unless `readOnly` is set to true.
     * If `readOnly` is true, this parameter is ignored.
     * @type {string}
     */
    privateKey,
    /**
     * Whether the IExec instance should be read-only (no transactions will be sent).
     * Defaults to false.
     * @type {boolean}
     */
    readOnly = false,
    /**
     * The balance to set for the wallet.
     * If not provided, defaults to the chain's default initial balance or 0n.
     * @type {bigint}
     */
    balance = chain.defaultInitBalance || 0n,
    /**
     * IExec configuration options.
     * @type {Object}
     */
    options = {},
  } = {}) => {
    const configOptions = getTestConfigOptions(chain)({ options });
    if (readOnly) {
      return {
        iexec: new IExec({ ethProvider: chain.rpcURL }, configOptions),
      };
    }
    const provider = new JsonRpcProvider(chain.rpcURL, undefined, {
      pollingInterval: 1000,
    });
    const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
    // fund wallet if needed
    if (balance > 0n) {
      await setBalance(chain)(await wallet.getAddress(), balance);
    }
    const ethProvider = new Wallet(wallet.privateKey, provider);
    return {
      iexec: new IExec({ ethProvider }, configOptions),
      wallet,
    };
  };
