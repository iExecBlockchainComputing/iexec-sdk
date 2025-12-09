[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecConfig

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

## Constructors

### Constructor

> **new IExecConfig**(`args`, `options?`): `IExecConfig`

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

##### args

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecConfig`

## Methods

### resolveBridgeAddress()

> **resolveBridgeAddress**(): `Promise`\<`string`\>

resolve the current bridge contract address

#### Returns

`Promise`\<`string`\>

***

### resolveBridgeBackAddress()

> **resolveBridgeBackAddress**(): `Promise`\<`string`\>

resolve the bridge contract address on bridged chain

#### Returns

`Promise`\<`string`\>

***

### resolveBridgedContractsClient()

> **resolveBridgedContractsClient**(): `Promise`\<[`IExecContractsClient`](../-internal-/classes/IExecContractsClient.md)\>

resolve the current bridged IExecContractsClient

#### Returns

`Promise`\<[`IExecContractsClient`](../-internal-/classes/IExecContractsClient.md)\>

***

### resolveChainId()

> **resolveChainId**(): `Promise`\<`number`\>

resolve the current chainId

#### Returns

`Promise`\<`number`\>

***

### resolveCompassURL()

> **resolveCompassURL**(): `Promise`\<`string` \| `undefined`\>

**`Experimental`**

resolve the current Compass URL

#### Returns

`Promise`\<`string` \| `undefined`\>

***

### resolveContractsClient()

> **resolveContractsClient**(): `Promise`\<[`IExecContractsClient`](../-internal-/classes/IExecContractsClient.md)\>

resolve the current IExecContractsClient

#### Returns

`Promise`\<[`IExecContractsClient`](../-internal-/classes/IExecContractsClient.md)\>

***

### resolveEnsPublicResolverAddress()

> **resolveEnsPublicResolverAddress**(): `Promise`\<`string`\>

resolve the current ENS public resolver contract address

#### Returns

`Promise`\<`string`\>

***

### resolveIexecGatewayURL()

> **resolveIexecGatewayURL**(): `Promise`\<`string`\>

resolve the current IExec market URL

#### Returns

`Promise`\<`string`\>

***

### resolveIpfsGatewayURL()

> **resolveIpfsGatewayURL**(): `Promise`\<`string`\>

resolve the current IPFS gateway URL

#### Returns

`Promise`\<`string`\>

***

### resolveIpfsNodeURL()

> **resolveIpfsNodeURL**(): `Promise`\<`string`\>

resolve the current IPFS node URL

#### Returns

`Promise`\<`string`\>

***

### resolvePocoSubgraphURL()

> **resolvePocoSubgraphURL**(): `Promise`\<`string`\>

resolve the current PoCo subgraph URL

#### Returns

`Promise`\<`string`\>

***

### resolveResultProxyURL()

> **resolveResultProxyURL**(): `Promise`\<`string`\>

resolve the current result proxy URL

#### Returns

`Promise`\<`string`\>

***

### resolveSmsURL()

> **resolveSmsURL**(`options?`): `Promise`\<`string`\>

resolve the current SMS URL

#### Parameters

##### options?

###### teeFramework?

[`TeeFramework`](../type-aliases/TeeFramework.md)

#### Returns

`Promise`\<`string`\>
