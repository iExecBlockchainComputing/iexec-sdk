[iexec](../README.md) / [Exports](../modules.md) / IExecConfig

# Class: IExecConfig

configuration for IExecModule

example:
```js
// create the configuration
const config = new IExecConfig({ ethProvider: window.ethereum });

// instanciate iExec SDK
const iexec = IExec.fromConfig(config);

// or instanciate IExecModules sharing the same configuration
const account = IExecAccountModule.fromConfig(config);
const wallet = IExecWalletModule.fromConfig(config);
```

## Table of contents

### Constructors

- [constructor](IExecConfig.md#constructor)

### Methods

- [resolveBridgeAddress](IExecConfig.md#resolvebridgeaddress)
- [resolveBridgedContractsClient](IExecConfig.md#resolvebridgedcontractsclient)
- [resolveChainId](IExecConfig.md#resolvechainid)
- [resolveContractsClient](IExecConfig.md#resolvecontractsclient)
- [resolveEnsPublicResolverAddress](IExecConfig.md#resolveenspublicresolveraddress)
- [resolveEnterpriseContractsClient](IExecConfig.md#resolveenterprisecontractsclient)
- [resolveIexecGatewayURL](IExecConfig.md#resolveiexecgatewayurl)
- [resolveIpfsGatewayURL](IExecConfig.md#resolveipfsgatewayurl)
- [resolveResultProxyURL](IExecConfig.md#resolveresultproxyurl)
- [resolveSmsURL](IExecConfig.md#resolvesmsurl)
- [resolveStandardContractsClient](IExecConfig.md#resolvestandardcontractsclient)

## Constructors

### constructor

• **new IExecConfig**(`args`, `options?`)

Create an IExecConfig instance consumable by IExecModules

example:

- using injected provider client side

```js
const config = new IExecConfig({ ethProvider: window.ethereum });
```

- using a private key server side

```js
const { getSignerFromPrivateKey } = require('iexec/utils');
const config = new IExecConfig({ ethProvider: getSignerFromPrivateKey('mainnet', privateKey) });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Defined in

[src/lib/IExecConfig.d.ts:133](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L133)

## Methods

### resolveBridgeAddress

▸ **resolveBridgeAddress**(): `Promise`<`string`\>

resolve the current bridge contract address

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:173](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L173)

___

### resolveBridgedContractsClient

▸ **resolveBridgedContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current bridged IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:145](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L145)

___

### resolveChainId

▸ **resolveChainId**(): `Promise`<`number`\>

resolve the current chainId

#### Returns

`Promise`<`number`\>

#### Defined in

[src/lib/IExecConfig.d.ts:137](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L137)

___

### resolveContractsClient

▸ **resolveContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:141](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L141)

___

### resolveEnsPublicResolverAddress

▸ **resolveEnsPublicResolverAddress**(): `Promise`<`string`\>

resolve the current ENS public resolver contract address

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:177](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L177)

___

### resolveEnterpriseContractsClient

▸ **resolveEnterpriseContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current enterprise IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:153](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L153)

___

### resolveIexecGatewayURL

▸ **resolveIexecGatewayURL**(): `Promise`<`string`\>

resolve the current IExec market URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:165](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L165)

___

### resolveIpfsGatewayURL

▸ **resolveIpfsGatewayURL**(): `Promise`<`string`\>

resolve the current IPFS gateway URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:169](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L169)

___

### resolveResultProxyURL

▸ **resolveResultProxyURL**(): `Promise`<`string`\>

resolve the current result proxy URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:161](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L161)

___

### resolveSmsURL

▸ **resolveSmsURL**(): `Promise`<`string`\>

resolve the current SMS URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:157](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L157)

___

### resolveStandardContractsClient

▸ **resolveStandardContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current standard IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:149](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecConfig.d.ts#L149)
