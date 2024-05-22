[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / IExecVoucherModule

# Class: IExecVoucherModule

[<internal>](../modules/internal_.md).IExecVoucherModule

module exposing voucher methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecVoucherModule`**

## Table of contents

### Constructors

- [constructor](internal_.IExecVoucherModule.md#constructor)

### Properties

- [config](internal_.IExecVoucherModule.md#config)

### Methods

- [authorizeRequester](internal_.IExecVoucherModule.md#authorizerequester)
- [getVoucherAddress](internal_.IExecVoucherModule.md#getvoucheraddress)
- [fromConfig](internal_.IExecVoucherModule.md#fromconfig)

## Constructors

### constructor

• **new IExecVoucherModule**(`configOrArgs`, `options?`): [`IExecVoucherModule`](internal_.IExecVoucherModule.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Returns

[`IExecVoucherModule`](internal_.IExecVoucherModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### authorizeRequester

▸ **authorizeRequester**(`requester`): `Promise`<`string`\>

**SIGNER REQUIRED**

authorize a requester to use the voucher

example:
```js
const txHash = await authorizeRequester(requesterAddress);
console.log('tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requester` | `string` |

#### Returns

`Promise`<`string`\>

___

### getVoucherAddress

▸ **getVoucherAddress**(`owner`): `Promise`<`string`\>

return the address of the voucher contract of the specified address when the address owns one

example:
```js
const voucherAddress = await getVoucherAddress(ethAddress);
console.log('voucher contract address:', voucherAddress);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `owner` | `string` |

#### Returns

`Promise`<`string`\>

___

### fromConfig

▸ **fromConfig**(`config`): `IExecNetworkModule`

Create an IExecVoucherModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

`IExecNetworkModule`

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
