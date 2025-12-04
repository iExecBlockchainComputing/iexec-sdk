# Changelog

All notable changes to this project will be documented in this file.

## [8.22.4](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.22.3...v8.22.4) (2025-12-01)


### Changed

* disable lifecycle scripts for contributors and CI ([07ba772](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/07ba77279bf08301af02f95d639f1b9aa776b458))
* reduce deps by moving contracts packages to dev deps ([07ba772](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/07ba77279bf08301af02f95d639f1b9aa776b458))
* security hardening ([#493](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/493)) ([07ba772](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/07ba77279bf08301af02f95d639f1b9aa776b458))
* update @ensdomains/buffer ([07ba772](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/07ba77279bf08301af02f95d639f1b9aa776b458))
* update node-forge ([07ba772](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/07ba77279bf08301af02f95d639f1b9aa776b458))

## [8.22.3](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.22.2...v8.22.3) (2025-11-20)


### Changed

* patch regression in CLI on networks without ENS ([#491](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/491)) ([e0f2ee2](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/e0f2ee266f386626c37b99bdc18d26e6e1fa73a9))

## [8.22.2](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.22.1...v8.22.2) (2025-11-20)


### Changed

* enable bulk processing on arbitrum-mainnet ([#489](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/489)) ([56c806c](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/56c806c107f08ad9675f00679c380b32129960ad))
* update poco version ([#469](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/469)) ([83bc857](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/83bc857cd4401a3a323b39d14eddc41df58d2a7c))

## [8.22.1](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.22.0...v8.22.1) (2025-11-19)


### Changed

* allow (DATASET_INFINITE_VOLUME - 1) in bulk datasetorders for compatibility with already signed orders ([#487](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/487)) ([06d8406](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/06d8406eab8c18efbf94951eca841e281e5687b9))

## [8.22.0](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.21.2...v8.22.0) (2025-11-03)


### Added

* experimental support for bulk processing on arbitrum-sepolia-testnet ([#463](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/463)) ([afd5480](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/afd54805f2c911c6c8194d3c2390bbd6b59a2864))

## [8.21.2](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.21.1...v8.21.2) (2025-10-30)


### Changed

* resole incorrect Voucher check  in estimateMatchOrders ([220dc78](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/220dc7800ffdcd23a2b87fa652e3ae85b24bbc25))

## [8.21.1](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.21.0...v8.21.1) (2025-10-29)


### Changed

* add chain specific feature check errors ([#483](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/483)) ([0d82e47](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/0d82e47c000e1e76fd94520abee4b40a753181a0))
* TypeScript add missing option in fetchWorkerpoolOrderbook ([#481](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/481)) ([72e2323](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/72e2323946f449cb466d890009fd4ecd75c834d7))

## [8.21.0](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.20.0...v8.21.0) (2025-10-27)


### Added

* add estimated volume to estimateMatchOrders ([#479](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/479)) ([3f5dfc1](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/3f5dfc1cc9e196095c20dd8fe8a04c7e1d32671a))


### Changed

* add missing requester field in requestorder types ([#477](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/477)) ([1026f45](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/1026f45d57c84ca6ea50285d0898d83d0a29218c))
* allow TEE datasetorders without framework ([#473](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/473)) ([a5c3e86](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/a5c3e86cedeab094c24718b216738005effe15db))

## [8.20.0](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.19.0...v8.20.0) (2025-10-14)


### Added

* Migrate `arbitrum-sepolia-testnet` from experimental to non-experimental network ([#471](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/471)) ([ab23604](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/ab23604c352483de124ceef991c0edff2c474392))

## [8.19.0](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.18.0...v8.19.0) (2025-10-02)


### Added

* allow searching apporders and datasetorders by asset owner ([#466](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/466)) ([5e1c880](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/5e1c880b2d966c07d58caf61cacfc4f31d766b75))


### Changed

* improve maintainability ([#467](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/467)) ([4b02cd5](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/4b02cd5d4a3c6746e57721e074e70543efdcc76d))
* typing issue on getSignerFromPrivateKey, providers option is optional ([#464](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/464)) ([819bd1a](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/819bd1a56dc68543230d5c899d54a9c874029429))

## [8.18.0](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.17.1...v8.18.0) (2025-08-06)


### Added

* add support for arbitrum-mainnet ([#460](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/460)) ([8607611](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/8607611e046e53b9cf4b1059a672bfd76c536ff9))

## [8.17.1](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.17.0...v8.17.1) (2025-07-29)


### Changed

* stop reading poco address from deprecated file ([#455](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/455)) ([0c0f109](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/0c0f109ab049c435b2f1de8a3a3fa3a7c0c81e0d))
* update arbitrum-sepolia-testnet PoCo address to target latest diamond proxy deployment ([#457](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/457)) ([d8e4094](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/d8e4094f5f9988836fc359f068e3db687bb5b7fe))

## [8.17.0](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.16.1...v8.17.0) (2025-07-22)


### Added

* add compass service for offchain config resolution ([#454](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/454)) ([31d4a28](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/31d4a28f00d61702883f1854e594ec4b227a88ac))


### Changed

* typescript fix getNetwork() return type ([#452](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/452)) ([9c747d0](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/9c747d059d7e4159e389156e8706c7f55ea6e90e))

## [8.16.1](https://github.com/iExecBlockchainComputing/iexec-sdk/compare/v8.16.0...v8.16.1) (2025-07-03)


### Changed

* drop support for node 18 ([#449](https://github.com/iExecBlockchainComputing/iexec-sdk/issues/449)) ([4d48d18](https://github.com/iExecBlockchainComputing/iexec-sdk/commit/4d48d18dca4f36e747fb970b7e7519be2a302fb2))

## [8.16.0] (2025-06-19)

### Added

- added experimental networks

### Changed

- updated `iexec app init --tee` template to Scone v5.9

## [8.15.0] (2025-04-10)

### Added

- added support for aes-256-cbc encrypted result decryption

### Changed

- fixed `BN` type export issue

## [8.14.1] (2025-03-27)

### Changed

- migrated subgraphs default base URL (<https://thegraph.iex.ec>)

## [8.14.0] (2025-03-25)

### Added

- added `voucherAddress` option for using a non-owned voucher contract in `matchOrders`

## [8.13.1] (2025-02-24)

### Changed

- migrated SMS default URL (<https://sms.iex.ec>)
- migrated from SMS deprecated apps secrets endpoint

## [8.13.0] (2025-01-21)

### Added

- added key `isUserRejection` in `Web3ProviderError` set to `true` when the error is detected as a user rejection
- `task.fetchOffchainInfo(taskid)` to get off-chain status information about the task from the workerpool
- `task.fetchLogs(taskid)` to fetch app logs from the workers

### Changed

- `iexec_result_storage_proxy` default value is no more set in request params
- removed deprecated request param `iexec_developer_logger`
- change information exposed by `iexec task debug` for better readability

### Removed

- IExec `enterprise` flavour is removed, although `enterprise` flavour support was dropped for a while the "enterprise" specific methods and keys were still present in `iexec` SDK. These are now removed, although the changes impact some parts of the API, these changes should not impact developers using the `iexec` package.
  - [BREAKING] `IExecModule`
    - removed optional constructor param `flavour`
  - [BREAKING] `IExecConfig`
    - removed `resolveStandardContractsClient` and `resolveEnterpriseContractsClient` methods
    - removed optional constructor param `flavour` and `enterpriseSwapConf`
  - [BREAKING] `IExecWalletModule`
    - removed `wrapEnterpriseRLC` and `unwrapEnterpriseRLC` methods
  - [BREAKING] `IExecContractsClient`
    - removed optional constructor param `flavour`
    - removed `flavour` key
  - [BREAKING] CLI `chain.json` configuration file
    - removed `flavour` key
    - removed `[chainName].enterprise` key
  - [BREAKING] CLI `iexec wallet` command
    - removed `swap-RLC-for-eRLC` and `swap-eRLC-for-RLC`

## [8.12.0] (2024-10-22)

### Added

- added account methods for staked RLC allowance management
  - allowance
  - approve
  - revoke
- added support for iExec voucher
  - show
  - authorize
  - revoke
- added support for using a voucher to pay for a deal

## [8.11.0] (2024-10-03)

### Changed

- Upgrade PoCo to v5.5.0

## [8.10.1] (2024-08-26)

### Changed

- Typescript fixes
- fix an issue occurring when network 134 is already registered on ethers
- doc fixes

## [8.10.0] (2024-07-24)

### Added

- added support for ethers `AbstractProvider`, `AbstractSigner` and `BrowserProvider` to instantiate modules

### Changed

- reduced default polling interval for faster tx confirmation
- more permissive url validation for `iexec_input_files`

### Removed

- removed `ensRegistryAddress` option (use ethers `Network.register()` to configure custom networks supporting ENS)
- CLI removed `iexec registry` commands

## [8.9.1] (2024-06-19)

### Changed

- fixed exposed version

## [8.9.0] (2024-06-19)

### Added

- a generic `ApiCallError` is thrown when a network error occurs while connecting to a service or when the service returns a HTTP 5xx status code, each service has a dedicated inherited error class
  - `SmsCallError` for SMS call errors
  - `ResultProxyCallError` for Result Proxy call errors
  - `MarketCallError` for Market API call errors
  - `IpfsGatewayCallError` for IPFS gateway call errors
  - `WorkerpoolCallError` for workerpool API call errors
- Error `cause` is now set in errors everywhere `originalError` was used

### Changed

- [DEPRECATED] `originalError` is deprecated in favor of Error `cause`

## [8.8.0] (2024-05-28)

### Changed

- Typescript fixes
- accept `CryptoKey` in `utils.decryptResult(encrypted, key)`

## [8.7.0] (2024-04-22)

### Added

- `account.approve(spenderAddress, amount)` to approve a spender to spend staked RLC from the user account
- `account.checkAllowance(ownerAddress, spenderAddress)` to check the amount of allowance approved for the specified spender to use the account of the owner
- `account.revokeApproval(spenderAddress)` to revoke the approval for the spender to use the account

### Changed

- fix `--gas-price` option not being enforced on every command
- provider options for ethers provider are loosely type-checked to allow better control
- Typescript fixes
- move tests to the local fork of bellecour
- cache secrets' existence when confirmed by the SMS

## [8.6.1] (2024-03-11)

### Changed

- fix bundling issue occurring in webpack due to conditional import of node builtin in node context

## [8.6.0] (2024-03-04)

### Added

- strict mode `isRequesterStrict`, `isAppStrict`, `isDatasetStrict`, `isWorkerpoolStrict` in corresponding orderbook methods `fetchRequestOrderbook()`, `fetchAppOrderbook()`, `fetchDatasetOrderbook()`, `fetchWorkerpoolOrderbook()`, defaults to false

### Changed

- remove ipfs initialization preflight checks on request orders
- Typescript fixes

## [8.5.2] (2024-01-24)

### Added

- expose package `version` in `IExecModule`
- accept `CryptoKey` in `iexec.result.pushResultEncryptionKey(key)`

### Changed

- fix encryption key formatting issue in `iexec.result.pushResultEncryptionKey(key)`

## [8.5.1] (2023-12-21)

### Changed

- fix regression causing browser providers (metamask) to prompt unlock screen on IExec instantiation
- fix `iexec task show --download` issue with node 18 and above

## [8.5.0] (2023-11-02)

### Changed

- upgraded to `ethers@6`, this upgrade is internal and should not change the way developers interact with `iexec`
- updated dependencies
- [BREAKING] drop support for node 16

## [8.4.0] (2023-10-03)

### Added

- add pagination options (`page` and `pageSize`) to `orderbook` and `deal` fetch methods

### Changed

- fix `iexec order fill` command when no dataset is provided
- fix error message in `iexec app show`
- fix ambiguous error message when trying to transfer an asset not deployed

## [8.3.0] (2023-09-22)

### Added

- add transfer methods allowing to transfer the ownership of apps, datasets and workerpools

## [8.2.1] (2023-08-01)

### Changed

- fix missing import causing `decryptResult()` to crash in browser

## [8.2.0] (2023-07-28)

### Changed

- use `node-forge` for crypto operations to remove dependencies on nodejs built-in modules

## [8.1.5] (2023-06-22)

### Changed

- fix windows install

## [8.1.4] (2023-06-01)

### Changed

- Typescript fixes

## [8.1.3] (2023-05-26)

### Changed

- Typescript fixes

## [8.1.2] (2023-05-26)

### Changed

- Typescript fixes

## [8.1.1] (2023-05-22)

### Changed

- Typescript fixes

## [8.1.0] (2023-05-17)

### Changed

- Typescript fixes
- app orderbook accept `"any"` for the app address to fetch orderbook without filtering on app
- dataset orderbook accept `"any"` for the dataset address to fetch orderbook without filtering on dataset

## [8.0.0] (2023-04-07)

### Added

- `defaultTeeFramework` option for `IExecConfig` and `chain.json` for choosing the default TEE framework to use
- `iexec app init` option `--tee-framework <'scone'|'gramine'>` to specify the TEE framework to use for the app
- tee framework tags 'scone' & 'gramine'
- app orderbook accept `"any"` for `dataset`, `workerpool`, `requester` to fetch orderbook without filtering
- dataset orderbook accept `"any"` for `app`, `workerpool`, `requester` to fetch orderbook without filtering
- workerpool orderbook accept `"any"` for `app`, `dataset`, `requester` to fetch orderbook without filtering
- requester orderbook accept `"any"` for `workerpool` to fetch orderbook without filtering

### Changed

- SMS URL resolution depends on TEE framework (default `scone`)
- SMS URL override in `IExecConfig` or `chain.json` accepts `Record<TeeFramework,Url> | string`
- `iexec app push-secret` and `app.pushAppSecretExists(appAddress)` use a TEE framework inferred from app if not specified
- `iexec app check-secret` and `app.checkAppSecret(appAddress, secret)` use a TEE framework inferred from app if not specified
- `iexec storage init` and `storage.pushStorageToken(appAddress)` use the default TEE framework if not specified
- `iexec storage check` and `app.checkStorageTokenExists(appAddress, secret)` use the default TEE framework if not specified
- `iexec requester check-secret <name>` and `secrets.checkRequesterSecretExists(name)` use the default TEE framework if not specified
- `iexec requester push-secret <name>` and `secrets.pushRequesterSecret(name, value)` use the default TEE framework if not specified
- `iexec result check-encryption-key` and `result.checkResultEncryptionKeyExists(address)` use the default TEE framework if not specified
- `iexec result push-encryption-key` and `result.pushResultEncryptionKey(value)` use the default TEE framework if not specified
- `iexec dataset check-secret` and `dataset.checkDatasetSecretExists(datasetAddress)` use the default TEE framework if not specified
- `iexec dataset push-secret` and `dataset.pushDatasetSecret(datasetAddress, encryptionKey)` use the default TEE framework if not specified
- TEE app `mrenclave.provider` has been renamed `mrenclave.framework`
- [BREAKING] drop support for node 12
- [BREAKING] exports ES modules only, since all NodeJS LTS now supports ES modules natively, commonjs modules are no longer exported.
  - if you use commonjs module `require` consider moving to ES module to use static import (ie: `import iexecSdk from 'iexec'`)
  - if moving your project to ES module is not an option, you must use dynamic import to load iExec SDK (ie: `import('iexec').then((iexecSdk) => { ... })`)
- [BREAKING] 'tee' tag must be combined with a tee framework tag ('scone' or 'gramine')
- [BREAKING] `checkRequest` option is replaced by `preflightCheck`, use `preflightCheck: false` to disable checks
- [BREAKING] `--skip-request-check` option is replaced by `--skip-preflight-check`
- [BREAKING] bellecour is now the default chain initialized in `chain.json` when running `iexec init`
- [BREAKING] iExec stack is no longer deployed on mainnet, stack configuration for mainnet is no longer provided
- [BREAKING] iExec enterprise stack is no longer deployed, stack configuration for enterprise is no longer provided

### Removed

- [BREAKING] viviani is no longer available in the default configuration
- [BREAKING] goerli is no longer available in the default configuration
- [BREAKING] removed now useless faucet commands `iexec wallet get-RLC` and `iexec wallet get-ether`

## [7.2.5] (2023-04-03)

### Changed

- changed IPFS default gateway to v7 stack specific gateway
- fix API providers configuration

## [7.2.4] (2023-01-12)

### Changed

- fix `iexec orderbook` raw pagination

## [7.2.3] (2022-12-14)

### Changed

- TypeScript fixes

## [7.2.2] (2022-09-05)

### Changed

- TypeScript fixes
- [DEPRECATED] request param `iexec_developer_logger` was removed from iExec worker, using this param no longer have an effect. `iexec_developer_logger` will be removed in a next version.

## [7.2.1] (2022-07-25)

## Changed

- TypeScript fixes

## [7.2.0] (2022-07-05)

### Added

- workerpool API url configuration
- `iexec task debug <taskid> [--logs]` to show off-chain information
- `ens.getDefaultDomain(address)` to get the default free to use ENS domain given an address
- support for requester secrets
- check dataset secret exists on requestorder check
- check requester secret exists on requestorder check
- app/dataset/workerpool predict address methods
- app/dataset/workerpool check deployed methods

### Changed

- `show` commands display ENS when configured
- `iexec ens register <label> --for <address>` default domain is selected given the nature of `--for` address
- [DEPRECATED] Node 12 support will be dropped

## [7.1.1] (2022-06-06)

### Changed

- fix unhandled promise rejection when sdk is incorrectly initialized
- fix typo in `iexec storage init --raw` output
- fix typo in `iexec storage check --raw` output

## [7.1.0] (2022-04-11)

### Added

- TypeScript interfaces
- `providerOptions` can be passed to the constructor to configure ethers default provider on bridged chain
- `ethProvider` now accepts network name, network chainId and RPC url, using one of those option will setup an IExecConfig with provider allowing read-only operations (operations requiring a Signer will fail)

### Changed

- split lib into `IExecConfig` and independent `IExecModule`s to allow modular imports
- reintegrated `iexec-contracts-js-client`
- fix a bug transforming an Array into a plain object
- documentation refactoring
- fix ENS configure resolution removed useless transaction for EOA

## [7.0.2] (2022-02-16)

### Added

- observable ENS configuration with `ens.obsConfigureResolution(label, address)`
- observable bridge to mainchain with `wallet.obsBridgeToMainchain(amount)`
- observable bridge to sidechain with `wallet.obsBridgeToSidechain(amount)`

### Changed

- update deps

## [7.0.1] (2022-01-10)

### Changed

- fix `colors` to uncorrupted version

## [7.0.0] (2021-12-17)

### Added

- ENS resolution on iExec sidechains and custom networks
- ENS methods in CLI and lib:
  - `iexec ens resolve <name>` and `iexec.ens.resolveName(name)`
  - `iexec ens lookup <address>` and `iexec.ens.lookupAddress(address)`
  - `iexec ens get-owner <name>` and `iexec.ens.getOwner(name)`
  - `iexec ens register <label>`
  - `iexec.ens.claimName(label, domain)`
  - `iexec.ens.configureResolution(label, address)`

### Changed

- fix `iexec registry validate app` to support new mrenclave format

### Removed

## [6.0.0] (2021-07-19)

### Added

- client-side (in browser) dataset encryption is now possible.
- confirms option allows to set the number of block to wait for transaction confirmation.
- `iexec app init --tee` init the TEE app template

### Changed

- [BREAKING] `iexec init` set default chain `viviani` (iExec sidechain testnet) in `chain.json`, previously was `goerli` (using `--chain` option still overrides the `chain.json` configuration).
- [BREAKING] SCONE file system encryption is dropped in favor of AES-256-CBC for dataset encryption. Existing datasets will stop working, these datasets original files MUST be re-encrypted using `iexec dataset encrypt` and republished.
- [BREAKING] changed generated dataset keys and encrypted datasets files naming pattern.
- [BREAKING] a dataset is now a single file. in order to pass a tree structure, the dataset owner must package all the files in a single archive file, applications that previously used multiple files from a single dataset must handle unwrapping files from an archive file.
- [BREAKING] app `mrenclave` format changed from string to object previously deployed TEE apps must be rebuilt and redeployed with v6 workflow
- [BREAKING] `iexec.task.obsTask()` now returns `Promise<Observable>` previously it returned `Observable`
- [BREAKING] `iexec.deal.obsDeal()` now returns `Promise<Observable>` previously it returned `Observable`
- [DEPRECATED] `iexec wallet getETH` is now an alias to `iexec wallet get-ether` and will be removed in a next version
- [DEPRECATED] `iexec wallet getRLC` is now an alias to `iexec wallet get-RLC` and will be removed in a next version
- [DEPRECATED] `iexec wallet sendETH` is now an alias to `iexec wallet send-ether` and will be removed in a next version
- [DEPRECATED] `iexec wallet sendRLC` will be removed in a next version, use `iexec wallet send-RLC` BEWARE default unit is RLC!
- `chainId` is no longer required to call `IExec` constructor, the chainId is lazily fetched from the provider
- fix `iexec wallet send-ether` return sent `amount` in wei
- fix `fetchWorkerpoolOrderbook()` to include `requester` restricted workerpoolorders (fix `app run` using requester restricted workerpoolorder)
- fix `iexec app run` `--gas-price` option
- removed `mrenclave` from app default template
- `iexec run --watch` and `iexec deal show --watch` added tasks status details

### Removed

- [BREAKING] `--algorithm` option is removed from `iexec dataset encrypt`
- [BREAKING] removed `iexec.network.id` and `iexec.network.isSidechain`, use `iexec.network.getNetwork() => Promise<{chainId: String, isSidechain: Boolean}>`
- [BREAKING] tee post-compute configuration responsibility has been transferred to the SMS and is no longer supported by requestorder. any custom `iexec_tee_post_compute_image` and `iexec_tee_post_compute_fingerprint` will be silently removed from `requestorder.params`.
- [BREAKING] drop previously deprecated `iexec wallet show --raw` returned json key `balance.ETH`, use `balance.ether` instead
- [BREAKING] drop previously deprecated `bridge.bridgedChainId` in `chain.json` use `bridge.bridgedChainName` instead
- [BREAKING] drop previously deprecated `iexec.orderbook.fetchWorkerpoolOrderbook(category, options)` use `category` as an option of `iexec.orderbook.fetchWorkerpoolOrderbook(options)`
- [BREAKING] drop previously deprecated `iexec.orderbook.fetchRequestOrderbook(category, options)` use `category` as an option of `iexec.orderbook.fetchRequestOrderbook(options)`
- [BREAKING] drop previously deprecated `iexec.orderbook.fetchAppOrderbook()` returned value `appOrders` use `orders`
- [BREAKING] drop previously deprecated `iexec.orderbook.fetchDatasetOrderbook()` returned value `datasetOrders` use `orders`
- [BREAKING] drop previously deprecated `iexec.orderbook.fetchWorkerpoolOrderbook()` returned value `workerpoolOrders` use `orders`
- [BREAKING] drop previously deprecated `iexec.orderbook.fetchRequestOrderbook()` returned value `requestOrders` use `orders`
- [BREAKING] drop previously deprecated `task.waitForTaskStatusChange(taskid, initialStatus)` use `task.obsTask(taskid)`

## [5.3.1] (2021-07-12)

### changed

- set ethers version to ~5.3.1 for pre berlin fork compatibility (iExec sidechains)

## [5.3.0] (2021-05-05)

### changed

- fixed `iexec registry validate app`

### Removed

- [BREAKING] drop support for Node 10

## [5.2.0] (2021-01-22)

### Added

- iExec enterprise flavour support
- `iexec wallet swap-eRLC-for-RLC` and `wallet.wrapEnterpriseRLC()` enables to wrap RLC to eRLC (requires an authorized wallet)
- `iexec wallet swap-eRLC-for-RLC` and `wallet.unwrapEnterpriseRLC()` enables to unwrap eRLC to RLC (requires an authorized wallet)
- `enterprise` value added to `--chain [chainName]` option enable connecting iExec enterprise
- optional named argument `flavour` added to IExec constructor enables connecting iExec enterprise by passing `flavour: 'enterprise'`

### Changed

- `id` is no longer required in `chain.json`
- passing `chainId` to `--chain [chainName]` will support only the following values: `1` for `mainnet`, `5` for `goerli`, `134` for `bellecour`, `133` for `viviani`
- CLI `native` chain key no longer set default gasPrice to 0, use key `"useGas": false` to force default gasPrice to 0
- lib `isNative` option no longer set default gasPrice to 0, use option `useGas: false` to force default gasPrice to 0
- migrate EIP712 hash and sign to ethers implementation
- fixed `iexec deal claim` fail due to missing signer
- [DEPRECATED] `bridge.bridgedChainId` in `chain.json` is deprecated and must me replaced by `bridge.bridgedChainName`

### Removed

## [5.1.0] (2020-11-09)

### Added

- `iexec orderbook` more filter options
- `iexec orderbook` pagination
- `iexec app request-execution <appAddress>` publish a requestorder to run an app at limit price

### Changed

- migrated to new market API
- fixed amount validation error
- fixed multiaddr format machine to human
- fixed requester stake too low error message for matching orders
- update `Web3ProviderError` messages
- `iexec orderbook workerpool [address]` `--category <catid>` is now optional
- `iexec orderbook requester [address]` `--category <catid>` is now optional
- [DEPRECATED] `iexec.orderbook.fetchWorkerpoolOrderbook(category, options)` is deprecated, use `category` as an option of `iexec.orderbook.fetchWorkerpoolOrderbook(options)`
- [DEPRECATED] `iexec.orderbook.fetchRequestOrderbook(category, options)` is deprecated, use `category` as an option of `iexec.orderbook.fetchRequestOrderbook(options)`
- [DEPRECATED] `iexec.orderbook.fetchAppOrderbook()` returned value `appOrders` is deprecated, use `orders`
- [DEPRECATED] `iexec.orderbook.fetchDatasetOrderbook()` returned value `datasetOrders` is deprecated, use `orders`
- [DEPRECATED] `iexec.orderbook.fetchWorkerpoolOrderbook()` returned value `workerpoolOrders` is deprecated, use `orders`
- [DEPRECATED] `iexec.orderbook.fetchRequestOrderbook()` returned value `requestOrders` is deprecated, use `orders`

### Removed

- undocumented option `beforeTimestamp` removed from `iexec.deal.fetchRequesterDeals()`
- undocumented output value `openVolume` removed from `iexec.orderbook.fetchWorkerpoolOrderbook()` and `iexec orderbook workerpool`

## [5.0.1] (2020-08-26)

### Added

- support for unit in amounts
  - ether units: `ether` (`eth`), `finney`, `szabo`, `gwei`, `mwei`, `kwei`, `wei`
  - RLC units: `RLC`, `nRLC`

### Changed

- fixed result encryption v5 workflow
- messages amount use main units (RLC and ether)
- [DEPRECATED] `iexec wallet show --raw` returned json key `balance.ETH` is deprecated, use `balance.ether` instead

### Removed

## [5.0.0] (2020-07-22)

### Added

- ENS resolution
- support for INFURA, Etherscan and Alchemy providers configuration
- simplified order management for deployed resources in cli
  - `iexec app/dataset/workerpool publish`
  - `iexec app/dataset/workerpool unpublish`
- remote storage management
  - support for `dropbox` storage
  - `iexec storage init [provider]` initialize the remote storage
  - `iexec storage check [provider]` check if the remote storage is initialized
  - `iexec.storage.defaultStorageLogin()` get an authorization token for default remote storage
  - `iexec.storage.pushStorageToken()` push a storage token to the SMS
- dataset secret management in js lib
  - `iexec.dataset.pushDatasetSecret(datasetAddress, secret)` push the dataset key to the SMS
  - `iexec.dataset.checkDatasetSecretExists(datasetAddress)` check if the dataset key exists in the SMS
- result encryption key management in js lib
  - `iexec.result.pushResultEncryptionKey(rsaPubKey)` push the beneficiary result encryption key to the SMS
  - `iexec.result.updateResultEncryptionKey(rsaPubKey)` update the beneficiary result encryption key in the SMS
  - `iexec.result.checkResultEncryptionKeyExists(address)` check if the beneficiary result encryption key exists in the SMS
  - `utils.decryptResult(encryptedResultFile, beneficiaryKey)` decrypt encrypted result with RSA beneficiary key
- requestorder check to prevent runtime errors
  - `iexec order sign`, `iexec order publish`, `iexec order fill` and `iexec app run` perform advanced check on request (use option `--skip-request-check` to disable)
  - `iexec.order.signRequestorder()`, `iexec.order.publishRequestorder()` and `iexec.order.matchOrder()` perform advanced check on request (use option `{ checkRequest: false }` to disable)
- `--decrypt` option added `iexec task show <taskid> --download --decrypt` allow to decrypt downloaded result
- `--watch` option added to `iexec deal show <dealid>` allow to watch execution status changes
- default values for `order.createApporder()`, `order.createDatasetorder()`, `order.createWorkerpoolorder()` and `order.createRequestorder()`.
- support for units in `parseEth()` and `parseRLC()` methods

### Changed

- [BREAKING] `iexec app show <index>` and `app.showUserApp(index)` first index is `0` previously was `1`
- [BREAKING] `iexec dataset show <index>` and `dataset.showUserDataset(index)` first index is `0` previously was `1`
- [BREAKING] `iexec workerpool show <index>` and `dataset.showUserWorkerpool(index)` first index is `0` previously was `1`
- [BREAKING] `iexec dataset check-secret` returned json key is now `isSecretSet` previously was `isKnownAddress`
- [BREAKING] `iexec task show` and `task.show(taskid)` returned `task.results` is an object previously was url or hexString
- [BREAKING] `iexec app run` option `--dataset <address|"deployed">` using last deployed dataset is no more implicit
- [BREAKING] `iexec app run` option `--workerpool <address|"deployed">` using last deployed workerpool is no more implicit
- [BREAKING] `bridge.bridgedChainId` is now used to override bridged chain chainId in `iexec.json` previously `bridge.bridgedNetworkId` was used
- [BREAKING] `iexec result generate-keys` is deprecated, use `iexec result generate-encryption-keypair`
- [BREAKING] `iexec result push-secret` is deprecated, use `iexec result push-encryption-key`
- [BREAKING] `iexec result check-secret` is deprecated, use `iexec result check-encryption-key` returned json key is now `isEncryptionKeySet` previously was `isKnownAddress`
- [BREAKING] standardized Error messages format, capitalized first letter.
- access to the blockchain through ethers default provider
- standardized CLI messages format
- fixed mutation in order sign methods
- fixed `iexec wallet sweep` and `wallet.sweep()`
- fixed method name `iexec.order.publishWorkerpoolorder()`
- fixed method name `iexec.order.unpublishWorkerpoolorder()`

### Removed

- [BREAKING] `aes-256-cbc` dataset encryption is removed, only `scone` encryption is supported (use `iexec dataset encrypt --algorithm scone`)

## [4.0.3] (2020-02-27)

### Added

- `orderbook.fetchAppOrderbook` and `iexec orderbook app <address>` optional filters (dataset, workerpool, requester)
- `orderbook.fetchDatasetOrderbook` and `iexec orderbook dataset <address>` optional filters (app, workerpool, requester)
- `utils.sumTags([...Bytes32])` added to JS lib
- `task.obsTask(taskid, { dealid })` observable for task status
- `deal.obsDeal(dealid)` observable for deal status

### Changed

- fix `iexec order show --raw` output
- `task.waitForTaskStatusChange(taskid, initialStatus)` is deprecated prefer `task.obsTask(taskid)`

### Removed

## [4.0.2] (2020-02-12)

### Added

- `iexec app run [address]` allow to run an app on iExec at the market price
- `deal.show(dealid)` and `iexec deal show` returns extra keys `finalTime: BN` and `deadlineReached: Boolean`
- `task.show(taskid)` and `iexec task show` returns extra keys `taskTimedOut: Boolean`
- `requestorder.params` now accepts object in `iexec.json` and JS lib

### Changed

- fix SMS url in `chain.json`
- fix `task.show(taskid)` and `iexec task show` returned `statusName` is now set to `"TIMEOUT"` when task timed out

### Removed

## [4.0.1] (2020-01-17)

### Added

- `gpu` tag is now supported
- `getTransactionCount` option for custom nonce management
- Goerli testnet added to `chain.json` run `iexec init --skip-wallet` to update `chain.json`

### Changed

- updated yup integer validation
- `iexec wallet show` no longer requires password to show wallet content (issue #87)
- `iexec account show` no longer requires password to show account content
- fix `iexec.app.showApp(address)` and `iexec app show` now returns decoded `appMREnclave`

### Removed

## [4.0.0] (2019-12-13)

### Added

- `iexec wallet bridge-to-sidechain <nRlcAmount>` sending RLC from a mainchain to the bridged sidechain.
- `iexec wallet bridge-to-mainchain <nRlcAmount>` sending RLC from a sidechain to the bridged mainchain.
- optional bridge configuration in `chain.json`
- bridging RLC between mainchain an sidechain may throw `BridgeError`
- `deal.claim(dealid)` and `iexec deal claim` to claim all failed of a deal
- `utils.getSignerFromPrivateKey()` creates a signer provider for server side applications

### Changed

- [BREAKING] `iexec order init --raw` output is now a single json `{ok, apporder, datasetorder, workerpoolorder, requestorder, fail: [...errors]}`.
- [BREAKING] `iexec order sign --raw` output is now a single json `{ok, apporder, datasetorder, workerpoolorder, requestorder, fail: [...errors]}`.
- [BREAKING] `iexec order cancel --raw` output is now a single json `{ok, apporder, datasetorder, workerpoolorder, requestorder, fail: [...errors]}`.
- [BREAKING] `iexec order fill --raw` volume in output is now formatted as decimal string, previously was hexadecimal string.
- [BREAKING] `iexec order publish --raw` output is now a single json `{ok, apporder, datasetorder, workerpoolorder, requestorder, fail: [...errors]}`.
- [BREAKING] `iexec order unpublish --raw` output is now a single json `{ok, apporder, datasetorder, workerpoolorder, requestorder, fail: [...errors]}`.
- [BREAKING] `iexec order show --raw` output is now a single json `{ok, apporder, datasetorder, workerpoolorder, requestorder, fail: [...errors]}`.
- [BREAKING] `iexec registry validate <object> --raw` output is now a single json `{ok, validated: [...fileNames], fail: [...errors]}`.
- [BREAKING] Ethereum public key representation changed, first byte `04` is no longer skipped.
- [BREAKING] `app.deploy()` promise now resolves as `{address, txHash}`, previously was `address`.
- [BREAKING] `dataset.deploy()` promise now resolves as `{address, txHash}`, previously was `address`.
- [BREAKING] `workerpool.deploy()` promise now resolves as `{address, txHash}`, previously was `address`.
- [BREAKING] `account.deposit()` promise now resolves as `{amount, txHash}`, previously was `amount`.
- [BREAKING] `account.withdraw()` promise now resolves as `{amount, txHash}`, previously was `amount`.
- [BREAKING] `wallet.sweep()` promise now resolves as `{sendNativeTxHash, sendERC20TxHash, errors}` on mainchains or `{sendNativeTxHash, errors}` on sidechains, previously was `{sendETHTxHash, sendRLCTxHash}`.
- [BREAKING] `order.cancel()` promise now resolves as `{order, txHash}`, previously was `true`.

### Removed

- [BREAKING] curated utils
- [BREAKING] imports of `wallet`, `account`, `order`, `orderbook`, `deal`, `task`, `hub` are removed.

## [3.1.1] (2019-10-17)

### Added

- `iexec orderbook workerpool` added option `--require-tag <...tags>`
- Support for tag array of string representation (ex: tee tag `0x0000000000000000000000000000000000000000000000000000000000000001` can be replaced by `['tee']` ), available in:
  - `iexec.json`
  - `orderbook` command
  - js lib
- Filtering options for orderbook in js lib

### Changed

### Removed

## [3.1.0] (2019-09-25)

### Added

- `IExec` sdk constructor simplify integration [see documentation](https://github.com/iExecBlockchainComputing/iexec-sdk#iexec-sdk-library-api)
- `wallet.getAddress()` gives the current wallet address
- `deal.show()` added key `tasks: { [idx]: [taskid] }` to the resolved value
- dynamic cast and validation of inputs, invalid inputs throw `ValidationError`.
- introduced TypedErrors `ValidationError`, `Web3ProviderError`, `Web3ProviderCallError`, `Web3ProviderSendError`, `Web3ProviderSignMessageError`, `ObjectNotFoundError`.

### Changed

- [BREAKING] dropped support for nodejs v8 added support for nodejs v14
- [BREAKING] `iexec tee` subcommands removed and replaced
  - `iexec tee init` is replaced by `iexec dataset init --encrypted`
  - `iexec tee encrypt-dataset` is replaced by `iexec dataset encrypt`
  - `iexec tee generate-beneficiary-keys` is replaced by `iexec result generate-key`
  - `iexec tee decrypt-result` is replaced by `iexec result decrypt`
  - `iexec tee push-secret` is replaced by `iexec dataset push-secret` and `iexec result push-secret`
  - `iexec tee check-secret` is replaced by `iexec dataset check-secret` and `iexec result check-secret`
- [BREAKING] `.tee-secrets/`folder moved to `.secrets`
- [BREAKING] default original dataset folder `tee/original-dataset/` folder moved to `datasets/original/`
- [BREAKING] default encrypted dataset folder `tee/original-encrypted/` folder moved to `datasets/encrypted/`
- [BREAKING] `iexec deal show` ends with error when the deal doesn't exists
- [BREAKING] `deal.show()` throw when the deal doesn't exists
- [BREAKING] `deal.computeTaskIdsArray()` is no longer exposed (`deal.show()` resolves now as `{..., tasks: { [idx]: [taskid] }}`)
- [BREAKING] `deal.computeTaskId()` returns a promise
- [BREAKING] errors handling with `--raw` option now returns `{ command, error: { name, message } }` previously was `{ command, error: message }`
- [DEPRECATED] imports of `wallet`, `account`, `order`, `orderbook`, `deal`, `task`, `hub` is deprecated, use `IExec` constructor.
- [DEPRECATED] `order.signOrder()` is replaced by dedicated methods of `IExec`: `order.signApporder()`, `order.signDatasetorder()`, `order.signWorkerpoolorder()`, `order.signRequestorder()`
- [DEPRECATED] `order.cancelOrder()` is replaced by dedicated methods of `IExec`: `order.cancelApporder()`, `order.cancelDatasetorder()`, `order.cancelWorkerpoolorder()`, `order.cancelRequestorder()`
- [DEPRECATED] `order.publishOrder()` is replaced by dedicated methods of `IExec`: `order.publishApporder()`, `order.publishDatasetorder()`, `order.publishWorkerpoolorder()`, `order.publishRequestorder()`
- [DEPRECATED] `order.unpublishOrder()` is replaced by dedicated methods of `IExec`: `order.unpublishApporder()`, `order.unpublishDatasetorder()`, `order.unpublishWorkerpoolorder()`, `order.unpublishRequestorder()`
- [DEPRECATED] `hub.createObj()` is replaced by dedicated methods of `IExec`: `app.deployApp()`, `dataset.deployDataset()`, `workerpool.deployWorkerpool()`
- [DEPRECATED] `hub.countObj()` is replaced by dedicated methods of `IExec`: `app.countUserApps()`, `dataset.countUserDatasets()`, `workerpool.countUserWorkerpools()`
- [DEPRECATED] `hub.showObj()` is replaced by dedicated methods of `IExec`: `hub.countUserApps()`, `hub.countUserDatasets()`, `hub.countUserWorkerpools()`
- [DEPRECATED] `hub.showApp(contracts, objAddressOrIndex, userAddress)` will stop support params `index` and `userAddress` use `IExec` methods `app.showUserApp(index, userAddress)` or `app.showApp(appAddress)`
- [DEPRECATED] `hub.showDataset(contracts, objAddressOrIndex, userAddress)` will stop support params `index` and `userAddress` please use `IExec` method `dataset.showUserDataset(index, userAddress)` or `dataset.showDataset(contracts, datasetAddress)`
- [DEPRECATED] `hub.showWorkerpool(contracts, objAddressOrIndex, userAddress)` will stop support params `index` and `userAddress` please use `IExec` method `workerpool.showUserWorkerpool(index, userAddress)` or `workerpool.showWorkerpool(workerpoolAddress)`
- [DEPRECATED] `task.claim(contracts, taskid, userAddress)` `userAddress` is no longer required, please use `IExec` method `task.claim(taskid)`
- [DEPRECATED] `task.fetchResults(contracts, taskid, userAddress, options)` `userAddress` is no longer required, please use `IExec` method `task.fetchResults(taskid, options)`
- Update `multiaddr@6.1.0` to `multiaddr@7.1.0`: `/ipfs` protocol 421 is now displayed `/p2p`
- fix everyone can claim a task
- fix `iexec task show` oracle results hexadecimal display (#88)
- fix `iexec task show --download` oracle results error message

### Removed

- [BREAKING] `iexec deal show <dealid> --tasks <...index>` `--tasks` option is removed, as deal's tasks are added to the output.
- [BREAKING] `iexec tee` subcommands removed and replaced (see changed)

## [3.0.36] (2019-09-24)

### Added

### Changed

- update params format for iexec core v3.2 compatibility

### Removed

## [3.0.35] (2019-09-23)

### Added

- global option `--quiet` disable update notification

### Changed

- global option `--raw` disable update notification
- fix `iexec wallet create --raw` and `iexec wallet import --raw` JSON output on fail
- fix numbers format in templates
- update api url
- `iexec registry validate <'app'|'dataset'|'workerpool'>` update schema validation for buyConf
- dependencies update

### Removed

## [3.0.34] (2019-07-10)

### Added

- `iexec order fill --params <string>` allow to generate request order on the fly with specified params

### Changed

- request orders are no longer initialized with formatted params

## [3.0.33] (2019-06-25)

### Added

- `iexec tee encrypt-dataset --algorithm <'aes-256-cbc'|'scone'>` allow to choose encryption method, default is aes-256-cbc.
  `--algorithm scone` allow an encrypted dataset to be processed into a SGX enclave by a Scone compatible dapp.

### Changed

- `iexec tee encrypt-dataset` now supports dataset folders.
- CLI fix typo

## [3.0.32] (2019-05-29)

### Added

- option `--gas-price <wei>` allow to use custom gas price.

### Changed

- fix display task contributors.

### Removed

- limit methods exported from `utils` module.

## [3.0.31] (2019-05-22)

### Changed

- `iexec tee encrypt-dataset` now use nodejs implementation (previously dockerized Openssl 1.1.1b).

## [3.0.30] (2019-05-17)

### Added

- Dataset encryption `iexec tee encrypt-dataset`.

### Changed

- beneficiary keys generated by `iexec tee generate-beneficiary-keys` now use AES 256 (previously AES 128).

## [3.0.29] (2019-05-15)

This is the initial release of iExec v3.
