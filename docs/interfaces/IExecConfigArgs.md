[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecConfigArgs

# Interface: IExecConfigArgs

## Properties

### ethProvider

> **ethProvider**: `string` \| `number` \| `AbstractSigner`\<`Provider` \| `null`\> \| `BrowserProvider` \| [`Eip1193Provider`](Eip1193Provider.md) \| `AbstractProvider`

A web3 Eth provider, a network name, a chain id or an ethers provider

read-only provider examples:
- `"mainnet"` or `1` or `"1"` for ethereum mainnet provider
- `"bellecour"` or `134` or `"134"` for iExec sidechain
- `"arbitrum-mainnet"` or `42161` or `"42161"` for arbitrum mainnet provider
- `"http://localhost:8545"` for local chain
- `new ethers.JsonRpcProvider("https://bellecour.iex.ec")` ethers provider connected to bellecour

signer provider examples:
- `window.ethereum` for browser injected wallet provider
- `utils.getSignerFromPrivateKey('bellecour', PRIVATE_KEY)` signer connected to bellecour
- `new ethers.Wallet(PRIVATE_KEY, new ethers.JsonRpcProvider("https://bellecour.iex.ec"))` ethers wallet connected to bellecour
