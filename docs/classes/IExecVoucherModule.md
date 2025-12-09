[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecVoucherModule

# Class: IExecVoucherModule

module exposing voucher methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecVoucherModule**(`configOrArgs`, `options?`): `IExecVoucherModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecVoucherModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### authorizeRequester()

> **authorizeRequester**(`requester`): `Promise`\<`string`\>

**SIGNER REQUIRED**

authorize a requester to use the voucher

example:
```js
const txHash = await authorizeRequester(requesterAddress);
console.log('tx:', txHash);
```

#### Parameters

##### requester

`string`

#### Returns

`Promise`\<`string`\>

***

### getVoucherAddress()

> **getVoucherAddress**(`owner`): `Promise`\<`string` \| `null`\>

returns the address of the voucher contract for the specified address if the address owns a voucher

example:
```js
const voucherAddress = await getVoucherAddress(ownerAddress);
console.log('voucher contract address:', voucherAddress);
```

#### Parameters

##### owner

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### revokeRequesterAuthorization()

> **revokeRequesterAuthorization**(`requester`): `Promise`\<`string`\>

#### Parameters

##### requester

`string`

#### Returns

`Promise`\<`string`\>

***

### showUserVoucher()

> **showUserVoucher**(`owner`): `Promise`\<[`VoucherInfo`](../-internal-/interfaces/VoucherInfo.md)\>

returns the user voucher information

example:
```js
const userVoucher = await showUserVoucher(userAddress);
console.log('address:', userVoucher.address);
console.log('balance:', userVoucher.balance);
console.log('expiration:', userVoucher.expirationTimestamp);
console.log('sponsored apps:', userVoucher.sponsoredApps);
console.log('sponsored datasets:', userVoucher.sponsoredDatasets);
console.log('sponsored workerpools:', userVoucher.sponsoredWorkerpools);
console.log('allowance on user account:', userVoucher.allowanceAmount);
console.log('authorized accounts:', userVoucher.authorizedAccounts);
```

#### Parameters

##### owner

`string`

#### Returns

`Promise`\<[`VoucherInfo`](../-internal-/interfaces/VoucherInfo.md)\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecVoucherModule`

Create an IExecVoucherModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecVoucherModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
