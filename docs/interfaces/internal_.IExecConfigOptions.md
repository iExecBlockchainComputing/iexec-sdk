[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / IExecConfigOptions

# Interface: IExecConfigOptions

[{internal}](../modules/internal_.md).IExecConfigOptions

## Table of contents

### Properties

- [bridgeAddress](internal_.IExecConfigOptions.md#bridgeaddress)
- [bridgedNetworkConf](internal_.IExecConfigOptions.md#bridgednetworkconf)
- [confirms](internal_.IExecConfigOptions.md#confirms)
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

#### Defined in

[src/lib/IExecConfig.d.ts:41](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L41)

___

### bridgedNetworkConf

• `Optional` **bridgedNetworkConf**: `Object`

override the bridged network configuration

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `bridgeAddress?` | `string` | bridge contract address on bridgde network |
| `chainId?` | `string` \| `number` | bridged network chainId |
| `hubAddress?` | `string` | IExec contract address on bridgde network |
| `rpcURL?` | `string` | bridged network node url |

#### Defined in

[src/lib/IExecConfig.d.ts:45](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L45)

___

### confirms

• `Optional` **confirms**: `boolean`

number of block to wait for transactions confirmation (default 1)

#### Defined in

[src/lib/IExecConfig.d.ts:91](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L91)

___

### ensPublicResolverAddress

• `Optional` **ensPublicResolverAddress**: `string`

override the ENS public resolver contract address to target a custom instance

#### Defined in

[src/lib/IExecConfig.d.ts:37](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L37)

___

### ensRegistryAddress

• `Optional` **ensRegistryAddress**: `string`

override the ENS registry contract address to target a custom instance

#### Defined in

[src/lib/IExecConfig.d.ts:33](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L33)

___

### enterpriseSwapConf

• `Optional` **enterpriseSwapConf**: `Object`

override the enterprise configuration

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `hubAddress?` | `string` | IExec enerprise contract address |

#### Defined in

[src/lib/IExecConfig.d.ts:66](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L66)

___

### hubAddress

• `Optional` **hubAddress**: `string`

override the IExec contract address to target a custom instance

#### Defined in

[src/lib/IExecConfig.d.ts:29](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L29)

___

### iexecGatewayURL

• `Optional` **iexecGatewayURL**: `string`

override the IExec market URL to target a custom instance

#### Defined in

[src/lib/IExecConfig.d.ts:87](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L87)

___

### ipfsGatewayURL

• `Optional` **ipfsGatewayURL**: `string`

override the IPFS gateway URL to target a custom instance

#### Defined in

[src/lib/IExecConfig.d.ts:83](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L83)

___

### isNative

• `Optional` **isNative**: `boolean`

true if IExec contract use the chain native token (default false)

#### Defined in

[src/lib/IExecConfig.d.ts:21](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L21)

___

### providerOptions

• **providerOptions**: [`ProviderOptions`](internal_.ProviderOptions.md)

[ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options

#### Defined in

[src/lib/IExecConfig.d.ts:95](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L95)

___

### resultProxyURL

• `Optional` **resultProxyURL**: `string`

override the result proxy URL to target a custom instance

#### Defined in

[src/lib/IExecConfig.d.ts:75](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L75)

___

### smsURL

• `Optional` **smsURL**: `string`

override the SMS URL to target a custom instance

#### Defined in

[src/lib/IExecConfig.d.ts:79](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L79)

___

### useGas

• `Optional` **useGas**: `boolean`

if false set the gasPrice to 0 (default true)

#### Defined in

[src/lib/IExecConfig.d.ts:25](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecConfig.d.ts#L25)
