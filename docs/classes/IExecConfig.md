[iexec](../README.md) / [Exports](../modules.md) / IExecConfig

# Class: IExecConfig

configuration for IExecModule

example:
```js
// create the configuration
const config = new IExecConfig({ ethProvider: window.ethereum });

// instantiate iExec SDK
const iexec = IExec.fromConfig(config);

// or instantiate IExecModules sharing the same configuration
const account = IExecAccountModule.fromConfig(config);
const wallet = IExecWalletModule.fromConfig(config);
```

## Table of contents

### Constructors

- [constructor](IExecConfig.md#constructor)

### Methods

- [resolveBridgeAddress](IExecConfig.md#resolvebridgeaddress)
- [resolveBridgeBackAddress](IExecConfig.md#resolvebridgebackaddress)
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

## Methods

### resolveBridgeAddress

▸ **resolveBridgeAddress**(): `Promise`<`string`\>

resolve the current bridge contract address

#### Returns

`Promise`<`string`\>

___

### resolveBridgeBackAddress

▸ **resolveBridgeBackAddress**(): `Promise`<`string`\>

resolve the bridge contract address on bridged chain

#### Returns

`Promise`<`string`\>

___

### resolveBridgedContractsClient

▸ **resolveBridgedContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current bridged IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

___

### resolveChainId

▸ **resolveChainId**(): `Promise`<`number`\>

resolve the current chainId

#### Returns

`Promise`<`number`\>

___

### resolveContractsClient

▸ **resolveContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

___

### resolveEnsPublicResolverAddress

▸ **resolveEnsPublicResolverAddress**(): `Promise`<`string`\>

resolve the current ENS public resolver contract address

#### Returns

`Promise`<`string`\>

___

### resolveEnterpriseContractsClient

▸ **resolveEnterpriseContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current enterprise IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

___

### resolveIexecGatewayURL

▸ **resolveIexecGatewayURL**(): `Promise`<`string`\>

resolve the current IExec market URL

#### Returns

`Promise`<`string`\>

___

### resolveIpfsGatewayURL

▸ **resolveIpfsGatewayURL**(): `Promise`<`string`\>

resolve the current IPFS gateway URL

#### Returns

`Promise`<`string`\>

___

### resolveResultProxyURL

▸ **resolveResultProxyURL**(): `Promise`<`string`\>

resolve the current result proxy URL

#### Returns

`Promise`<`string`\>

___

### resolveSmsURL

▸ **resolveSmsURL**(`options?`): `Promise`<`string`\>

resolve the current SMS URL

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `Object` |
| `options.teeFramework?` | ``"scone"`` \| ``"gramine"`` |

#### Returns

`Promise`<`string`\>

___

### resolveStandardContractsClient

▸ **resolveStandardContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current standard IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>
