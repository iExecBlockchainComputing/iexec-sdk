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

[src/lib/IExecConfig.d.ts:127](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L127)

## Methods

### resolveBridgeAddress

▸ **resolveBridgeAddress**(): `Promise`<`string`\>

resolve the current bridge contract address

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:167](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L167)

___

### resolveBridgedContractsClient

▸ **resolveBridgedContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current bridged IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:139](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L139)

___

### resolveChainId

▸ **resolveChainId**(): `Promise`<`number`\>

resolve the current chainId

#### Returns

`Promise`<`number`\>

#### Defined in

[src/lib/IExecConfig.d.ts:131](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L131)

___

### resolveContractsClient

▸ **resolveContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:135](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L135)

___

### resolveEnsPublicResolverAddress

▸ **resolveEnsPublicResolverAddress**(): `Promise`<`string`\>

resolve the current ENS public resolver contract address

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:171](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L171)

___

### resolveEnterpriseContractsClient

▸ **resolveEnterpriseContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current enterprise IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:147](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L147)

___

### resolveIexecGatewayURL

▸ **resolveIexecGatewayURL**(): `Promise`<`string`\>

resolve the current IExec market URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:159](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L159)

___

### resolveIpfsGatewayURL

▸ **resolveIpfsGatewayURL**(): `Promise`<`string`\>

resolve the current IPFS gateway URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:163](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L163)

___

### resolveResultProxyURL

▸ **resolveResultProxyURL**(): `Promise`<`string`\>

resolve the current result proxy URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:155](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L155)

___

### resolveSmsURL

▸ **resolveSmsURL**(): `Promise`<`string`\>

resolve the current SMS URL

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecConfig.d.ts:151](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L151)

___

### resolveStandardContractsClient

▸ **resolveStandardContractsClient**(): `Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

resolve the current standard IExecContractsClient

#### Returns

`Promise`<[`IExecContractsClient`](internal_.IExecContractsClient.md)\>

#### Defined in

[src/lib/IExecConfig.d.ts:143](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecConfig.d.ts#L143)
