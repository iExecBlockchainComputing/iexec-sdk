[**iexec**](../README.md)

***

[iexec](../globals.md) / ProviderOptions

# Interface: ProviderOptions

[ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options

## Properties

### alchemy?

> `optional` **alchemy**: `string`

[Alchemy](https://alchemyapi.io/) API key

***

### cloudflare?

> `optional` **cloudflare**: `boolean`

allow Cloudflare provider

***

### etherscan?

> `optional` **etherscan**: `string`

[Etherscan](https://etherscan.io/) API key

***

### infura?

> `optional` **infura**: `string` \| \{ `projectId`: `string`; `projectSecret`: `string`; \}

[INFURA](https://infura.io/) Project ID or { projectId, projectSecret }

#### Type Declaration

`string`

\{ `projectId`: `string`; `projectSecret`: `string`; \}

#### projectId

> **projectId**: `string`

[INFURA](https://infura.io/) project ID

#### projectSecret

> **projectSecret**: `string`

[INFURA](https://infura.io/) project secret

***

### quorum?

> `optional` **quorum**: `number`

the number of backends that must agree (default: 2 for mainnet, 1 for testnets)
