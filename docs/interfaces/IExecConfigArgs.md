[iexec](../README.md) / [Exports](../modules.md) / IExecConfigArgs

# Interface: IExecConfigArgs

## Table of contents

### Properties

- [ethProvider](IExecConfigArgs.md#ethprovider)
- [flavour](IExecConfigArgs.md#flavour)

## Properties

### ethProvider

• **ethProvider**: `string` \| `number` \| [`EnhancedWallet`](../classes/EnhancedWallet.md) \| [`Eip1193Provider`](Eip1193Provider.md)

A web3 Eth provider or network name or chain id

examples:
- `window.ethereum`
- `"mainnet"` or `1` or `"1"` for ethereum mainnet
- `"bellecour"` or `134` or `"134"` for iExec sidechain
- `"http://localhost:8545"` for local chain

___

### flavour

• `Optional` **flavour**: `string`

flavour to use (default standard)
