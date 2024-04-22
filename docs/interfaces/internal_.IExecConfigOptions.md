[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / IExecConfigOptions

# Interface: IExecConfigOptions

[<internal>](../modules/internal_.md).IExecConfigOptions

## Table of contents

### Properties

- [bridgeAddress](internal_.IExecConfigOptions.md#bridgeaddress)
- [bridgedNetworkConf](internal_.IExecConfigOptions.md#bridgednetworkconf)
- [confirms](internal_.IExecConfigOptions.md#confirms)
- [defaultTeeFramework](internal_.IExecConfigOptions.md#defaultteeframework)
- [ensPublicResolverAddress](internal_.IExecConfigOptions.md#enspublicresolveraddress)
- [ensRegistryAddress](internal_.IExecConfigOptions.md#ensregistryaddress)
- [enterpriseSwapConf](internal_.IExecConfigOptions.md#enterpriseswapconf)
- [hubAddress](internal_.IExecConfigOptions.md#hubaddress)
- [iexecGatewayURL](internal_.IExecConfigOptions.md#iexecgatewayurl)
- [ipfsGatewayURL](internal_.IExecConfigOptions.md#ipfsgatewayurl)
- [isNative](internal_.IExecConfigOptions.md#isnative)
- [providerOptions](internal_.IExecConfigOptions.md#provideroptions)
- [resultProxyURL](internal_.IExecConfigOptions.md#resultproxyurl)
- [smsURL](internal_.IExecConfigOptions.md#smsurl)
- [useGas](internal_.IExecConfigOptions.md#usegas)

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

• `Optional` **defaultTeeFramework**: [`TeeFramework`](../modules.md#teeframework)

override the TEE framework to use when as default

___

### ensPublicResolverAddress

• `Optional` **ensPublicResolverAddress**: `string`

override the ENS public resolver contract address to target a custom instance

___

### ensRegistryAddress

• `Optional` **ensRegistryAddress**: `string`

override the ENS registry contract address to target a custom instance

___

### enterpriseSwapConf

• `Optional` **enterpriseSwapConf**: `Object`

override the enterprise configuration

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `hubAddress?` | `string` | IExec enterprise contract address |

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

### providerOptions

• `Optional` **providerOptions**: [`ProviderOptions`](ProviderOptions.md) \| [`AnyRecord`](../modules.md#anyrecord)

[ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options

___

### resultProxyURL

• `Optional` **resultProxyURL**: `string`

override the result proxy URL to target a custom instance

___

### smsURL

• `Optional` **smsURL**: `string` \| `Record`<[`TeeFramework`](../modules.md#teeframework), `string`\>

override the SMS URL to target a custom instance

___

### useGas

• `Optional` **useGas**: `boolean`

if false set the gasPrice to 0 (default true)
