[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / IExecConfigArgs

# Interface: IExecConfigArgs

[{internal}](../modules/internal_.md).IExecConfigArgs

## Table of contents

### Properties

- [ethProvider](internal_.IExecConfigArgs.md#ethprovider)
- [flavour](internal_.IExecConfigArgs.md#flavour)

## Properties

### ethProvider

• **ethProvider**: `string` \| [`EnhancedWallet`](../classes/internal_.EnhancedWallet.md) \| `ExternalProvider`

A web3 Eth provider or network name or chain id

examples:
- `window.ethereum`
- `"mainnet"` or  `"1"` for ethereum mainnet
- `"bellecour"` or `"134"` for iExec sidechain
- `"http://localhost:8545"` for local chain

___

### flavour

• `Optional` **flavour**: `string`

flavour to use (default standard)
