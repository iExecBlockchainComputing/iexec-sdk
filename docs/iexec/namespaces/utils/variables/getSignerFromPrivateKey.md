[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [utils](../README.md) / getSignerFromPrivateKey

# Variable: getSignerFromPrivateKey()

> `const` **getSignerFromPrivateKey**: (`host`, `privateKey`, `options?`) => [`EnhancedWallet`](../../../../classes/EnhancedWallet.md)

create a signer connected to the specified blockchain host from a private key

example:
```js
const ethProvider = getSignerFromPrivateKey('http://localhost:8545', '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407');
const iexec = new IExec({ ethProvider });
```

## Parameters

### host

`string`

### privateKey

`string`

### options?

#### allowExperimentalNetworks?

`boolean`

if true allows using a provider connected to an experimental networks (default false)

⚠️ experimental networks are networks on which the iExec's stack is partially deployed, experimental networks can be subject to instabilities or discontinuity. Access is provided without warranties.

#### gasPrice?

`bigint` \| `number` \| `string`

gas price override

#### getTransactionCount?

(`blockTag?`) => `Promise`\<`number`\>

nonce override

#### providers?

[`ProviderOptions`](../../../../interfaces/ProviderOptions.md)

providers options

## Returns

[`EnhancedWallet`](../../../../classes/EnhancedWallet.md)
