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

[src/lib/IExecConfig.d.ts:128](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L128)

## Methods

### resolveBridgeAddress

▸ **resolveBridgeAddress**(): `Promise`<`string`\>

resolve the current bridge contract address

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:168](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L168)

___

### resolveBridgedContractsClient

▸ **resolveBridgedContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current bridged IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:140](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L140)

___

### resolveChainId

▸ **resolveChainId**(): `Promise`<`number`\>

resolve the current chainId

#### Returns

`Promise`<`number`\>

#### Defined in

[src/lib/IExecConfig.d.ts:132](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L132)

___

### resolveContractsClient

▸ **resolveContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:136](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L136)

___

### resolveEnsPublicResolverAddress

▸ **resolveEnsPublicResolverAddress**(): `Promise`<`string`\>

resolve the current ENS public resolver contract address

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:172](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L172)

___

### resolveEnterpriseContractsClient

▸ **resolveEnterpriseContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current enterprise IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:148](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L148)

___

### resolveIexecGatewayURL

▸ **resolveIexecGatewayURL**(): `Promise`<`string`\>

resolve the current IExec market URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:160](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L160)

___

### resolveIpfsGatewayURL

▸ **resolveIpfsGatewayURL**(): `Promise`<`string`\>

resolve the current IPFS gateway URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:164](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L164)

___

### resolveResultProxyURL

▸ **resolveResultProxyURL**(): `Promise`<`string`\>

resolve the current result proxy URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:156](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L156)

___

### resolveSmsURL

▸ **resolveSmsURL**(): `Promise`<`string`\>

resolve the current SMS URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:152](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L152)

___

### resolveStandardContractsClient

▸ **resolveStandardContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current standard IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:144](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8e573c7/src/lib/IExecConfig.d.ts#L144)
