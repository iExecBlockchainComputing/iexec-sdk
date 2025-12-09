[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecConfigOptions

# Interface: IExecConfigOptions

## Properties

### allowExperimentalNetworks?

> `optional` **allowExperimentalNetworks**: `boolean`

if true allows using a provider connected to an experimental networks (default false)

⚠️ experimental networks are networks on which the iExec's stack is partially deployed, experimental networks can be subject to instabilities or discontinuity. Access is provided without warranties.

***

### bridgeAddress?

> `optional` **bridgeAddress**: `string`

override the bridge contract address to target a custom instance

***

### bridgedNetworkConf?

> `optional` **bridgedNetworkConf**: `object`

override the bridged network configuration

#### bridgeAddress?

> `optional` **bridgeAddress**: `string`

bridge contract address on bridged network

#### chainId?

> `optional` **chainId**: `string` \| `number`

bridged network chainId

#### hubAddress?

> `optional` **hubAddress**: `string`

IExec contract address on bridged network

#### rpcURL?

> `optional` **rpcURL**: `string`

bridged network node url

***

### compassURL?

> `optional` **compassURL**: `string`

**`Experimental`**

override the compass URL to target a custom instance

***

### confirms?

> `optional` **confirms**: `number`

number of block to wait for transactions confirmation (default 1)

***

### defaultTeeFramework?

> `optional` **defaultTeeFramework**: [`TeeFramework`](../type-aliases/TeeFramework.md)

override the TEE framework to use when as default

***

### ensPublicResolverAddress?

> `optional` **ensPublicResolverAddress**: `string`

override the ENS public resolver contract address to target a custom instance

***

### hubAddress?

> `optional` **hubAddress**: `string`

override the IExec contract address to target a custom instance

***

### iexecGatewayURL?

> `optional` **iexecGatewayURL**: `string`

override the IExec market URL to target a custom instance

***

### ipfsGatewayURL?

> `optional` **ipfsGatewayURL**: `string`

override the IPFS gateway URL to target a custom instance

***

### ipfsNodeURL?

> `optional` **ipfsNodeURL**: `string`

override the IPFS node URL to target a custom instance

***

### isNative?

> `optional` **isNative**: `boolean`

true if IExec contract use the chain native token (default false)

***

### pocoSubgraphURL?

> `optional` **pocoSubgraphURL**: `string`

override the PoCo subgraph URL to target a custom instance

***

### providerOptions?

> `optional` **providerOptions**: [`ProviderOptions`](ProviderOptions.md) \| [`AnyRecord`](../type-aliases/AnyRecord.md)

[ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options

***

### resultProxyURL?

> `optional` **resultProxyURL**: `string`

override the result proxy URL to target a custom instance

***

### smsURL?

> `optional` **smsURL**: `string` \| `Record`\<[`TeeFramework`](../type-aliases/TeeFramework.md), `string`\>

override the SMS URL to target a custom instance

***

### useGas?

> `optional` **useGas**: `boolean`

if false set the gasPrice to 0 (default true)

***

### voucherHubAddress?

> `optional` **voucherHubAddress**: `string`

override the VoucherHub contract address to target a custom instance

***

### voucherSubgraphURL?

> `optional` **voucherSubgraphURL**: `string`

override the voucher subgraph URL to target a custom instance
