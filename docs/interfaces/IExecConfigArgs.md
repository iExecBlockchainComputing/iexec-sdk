[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecConfigArgs

# Interface: IExecConfigArgs

## Properties

### ethProvider

> **ethProvider**: `string` \| `number` \| `AbstractSigner`\<`Provider` \| `null`\> \| `BrowserProvider` \| [`Eip1193Provider`](Eip1193Provider.md) \| `AbstractProvider`

A web3 Eth provider, a network name, a chain id or an ethers provider

read-only provider examples:
- `"arbitrum-sepolia-testnet"` or `421614` or `"421614"` for arbitrum sepolia testnet provider
- `"arbitrum-mainnet"` or `42161` or `"42161"` for arbitrum mainnet provider
- `"http://localhost:8545"` for local chain
- `new ethers.JsonRpcProvider("https://<rpc-provider>")` ethers provider connected to your RPC provider

signer provider examples:
- `window.ethereum` for browser injected wallet provider
- `utils.getSignerFromPrivateKey('arbitrum-sepolia-testnet', PRIVATE_KEY)` signer connected to arbitrum sepolia testnet using a private key
- `new ethers.Wallet(PRIVATE_KEY, new ethers.JsonRpcProvider("https://<rpc-provider>"))` ethers wallet connected to a specific network
