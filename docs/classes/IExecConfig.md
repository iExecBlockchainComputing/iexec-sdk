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
- [resolveIexecGatewayURL](IExecConfig.md#resolveiexecgatewayurl)
- [resolveIpfsGatewayURL](IExecConfig.md#resolveipfsgatewayurl)
- [resolvePocoSubgraphURL](IExecConfig.md#resolvepocosubgraphurl)
- [resolveResultProxyURL](IExecConfig.md#resolveresultproxyurl)
- [resolveSmsURL](IExecConfig.md#resolvesmsurl)
- [resolveVoucherHubAddress](IExecConfig.md#resolvevoucherhubaddress)
- [resolveVoucherSubgraphURL](IExecConfig.md#resolvevouchersubgraphurl)

## Constructors

### constructor

• **new IExecConfig**(`args`, `options?`): [`IExecConfig`](IExecConfig.md)

Create an IExecConfig instance consumable by IExecModules

example:

- using injected provider client side

```js
const config = new IExecConfig({ ethProvider: window.ethereum });
```

- using a private key server side

```js
import { getSignerFromPrivateKey } from 'iexec/utils';
const config = new IExecConfig({ ethProvider: getSignerFromPrivateKey('mainnet', privateKey) });
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExecConfig`](IExecConfig.md)

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

### resolvePocoSubgraphURL

▸ **resolvePocoSubgraphURL**(): `Promise`<`string`\>

resolve the current PoCo subgraph URL

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
| `options.teeFramework?` | [`TeeFramework`](../modules.md#teeframework) |

#### Returns

`Promise`<`string`\>

___

### resolveVoucherHubAddress

▸ **resolveVoucherHubAddress**(): `Promise`<``null`` \| `string`\>

resolve the current VoucherHub contract address
returns `null` if not available

#### Returns

`Promise`<``null`` \| `string`\>

___

### resolveVoucherSubgraphURL

▸ **resolveVoucherSubgraphURL**(): `Promise`<``null`` \| `string`\>

resolve the current voucher subgraph URL
returns `null` if not available

#### Returns

`Promise`<``null`` \| `string`\>
