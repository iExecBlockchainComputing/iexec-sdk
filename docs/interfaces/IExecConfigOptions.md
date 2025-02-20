[iexec](../README.md) / [Exports](../modules.md) / IExecConfigOptions

# Interface: IExecConfigOptions

## Table of contents

### Properties

- [bridgeAddress](IExecConfigOptions.md#bridgeaddress)
- [bridgedNetworkConf](IExecConfigOptions.md#bridgednetworkconf)
- [confirms](IExecConfigOptions.md#confirms)
- [defaultTeeFramework](IExecConfigOptions.md#defaultteeframework)
- [ensPublicResolverAddress](IExecConfigOptions.md#enspublicresolveraddress)
- [hubAddress](IExecConfigOptions.md#hubaddress)
- [iexecGatewayURL](IExecConfigOptions.md#iexecgatewayurl)
- [ipfsGatewayURL](IExecConfigOptions.md#ipfsgatewayurl)
- [isNative](IExecConfigOptions.md#isnative)
- [pocoSubgraphURL](IExecConfigOptions.md#pocosubgraphurl)
- [providerOptions](IExecConfigOptions.md#provideroptions)
- [resultProxyURL](IExecConfigOptions.md#resultproxyurl)
- [smsURL](IExecConfigOptions.md#smsurl)
- [useGas](IExecConfigOptions.md#usegas)
- [voucherHubAddress](IExecConfigOptions.md#voucherhubaddress)
- [voucherSubgraphURL](IExecConfigOptions.md#vouchersubgraphurl)

## Properties

### bridgeAddress

• `Optional` **bridgeAddress**: `string`

override the bridge contract address to target a custom instance

___

### bridgedNetworkConf

• `Optional` **bridgedNetworkConf**: `Object`

override the bridged network configuration

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `bridgeAddress?` | `string` | bridge contract address on bridged network |
| `chainId?` | `string` \| `number` | bridged network chainId |
| `hubAddress?` | `string` | IExec contract address on bridged network |
| `rpcURL?` | `string` | bridged network node url |

___

### confirms

• `Optional` **confirms**: `number`

number of block to wait for transactions confirmation (default 1)

___

### defaultTeeFramework

• `Optional` **defaultTeeFramework**: ``"scone"``

override the TEE framework to use when as default

___

### ensPublicResolverAddress

• `Optional` **ensPublicResolverAddress**: `string`

override the ENS public resolver contract address to target a custom instance

___

### hubAddress

• `Optional` **hubAddress**: `string`

override the IExec contract address to target a custom instance

___

### iexecGatewayURL

• `Optional` **iexecGatewayURL**: `string`

override the IExec market URL to target a custom instance

___

### ipfsGatewayURL

• `Optional` **ipfsGatewayURL**: `string`

override the IPFS gateway URL to target a custom instance

___

### isNative

• `Optional` **isNative**: `boolean`

true if IExec contract use the chain native token (default false)

___

### pocoSubgraphURL

• `Optional` **pocoSubgraphURL**: `string`

override the PoCo subgraph URL to target a custom instance

___

### providerOptions

• `Optional` **providerOptions**: [`ProviderOptions`](ProviderOptions.md) \| [`AnyRecord`](../modules.md#anyrecord)

[ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options

___

### resultProxyURL

• `Optional` **resultProxyURL**: `string`

override the result proxy URL to target a custom instance

___

### smsURL

• `Optional` **smsURL**: `string` \| `Record`<``"scone"``, `string`\>

override the SMS URL to target a custom instance

___

### useGas

• `Optional` **useGas**: `boolean`

if false set the gasPrice to 0 (default true)

___

### voucherHubAddress

• `Optional` **voucherHubAddress**: `string`

override the VoucherHub contract address to target a custom instance

___

### voucherSubgraphURL

• `Optional` **voucherSubgraphURL**: `string`

override the voucher subgraph URL to target a custom instance
