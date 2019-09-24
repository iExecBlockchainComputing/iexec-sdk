# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- IexecSDK constructor
- `wallet.getAddress()` gives the current wallet address
- `deal.show()` added key `tasks: { [idx]: [taskid] }` to the resolved value
- dynamic cast and validation of inputs, invalid inputs throw `ValidationError`.
- introduced TypedErrors `ValidationError`, `Web3ProviderError`, `Web3ProviderCallError`, `Web3ProviderSendError`, `Web3ProviderSignMessageError`, `ObjectNotFoundError`.

### Changed

- [BREAKING] `iexec tee` subcommands removed and replaced
  - `iexec tee init` is replaced by `ìexec dataset init --encrypted`
  - `iexec tee encrypt-dataset` is replaced by `iexec dataset encrypt`
  - `iexec tee generate-beneficiary-keys` is replaced by `iexec result generate-key`
  - `iexec tee decrypt-result` is replaced by `iexec result decrypt`
  - `iexec tee push-secret` is replaced by `iexec dataset push-secret` and `iexec result push-secret`
  - `iexec tee check-secret` is replaced by `iexec dataset check-secret` and `iexec result check-secret`
- [BREAKING] `iexec deal show` ends with error when the deal doesn't exists
- [BREAKING] `deal.show()` throw when the deal doesn't exists
- [BREAKING] `deal.computeTaskIdsArray()` is no longer exposed (`deal.show()` resolves now as `{..., tasks: { [idx]: [taskid] }}`)
- [BREAKING] `deal.computeTaskId()` returns a promise
- [BREAKING] errors handling with `--raw` option now returns `{ command, error: { name, message } }` previously was `{ command, error: message }`
- [DEPRECATED] imports of `wallet`, `account`, `order`, `orderbook`, `deal`, `task`, `hub` is deprecated, use `IExec` constructor.
- [DEPRECATED] `order.signOrder()` is replaced by dedicated methods `order.signApporder()`, `order.signDatasetorder()`, `order.signWorkerpoolorder()`, `order.signRequestorder()`
- [DEPRECATED] `order.cancelOrder()` is replaced by dedicated methods `order.cancelApporder()`, `order.cancelDatasetorder()`, `order.cancelWorkerpoolorder()`, `order.cancelRequestorder()`
- [DEPRECATED] `order.publishOrder()` is replaced by dedicated methods `order.publishApporder()`, `order.publishDatasetorder()`, `order.publishWorkerpoolorder()`, `order.publishRequestorder()`
- [DEPRECATED] `order.unpublishOrder()` is replaced by dedicated methods `order.unpublishApporder()`, `order.unpublishDatasetorder()`, `order.unpublishWorkerpoolorder()`, `order.unpublishRequestorder()`
- [DEPRECATED] `hub.createObj()` is replaced by dedicated methods `hub.deployApp()`, `hub.deployDataset()`, `hub.deployWorkerpool()`
- [DEPRECATED] `hub.countObj()` is replaced by dedicated methods `hub.countUserApps()`, `hub.countUserDatasets()`, `hub.countUserWorkerpools()`
- [DEPRECATED] `hub.showObj()` is replaced by dedicated methods `hub.countUserApps()`, `hub.countUserDatasets()`, `hub.countUserWorkerpools()`
- [DEPRECATED] `hub.showApp(contracts, objAddressOrIndex, userAddress)` will stop support params `ìndex` and `userAdress` use `hub.showUserApp(contracts, index, userAddress)` or `hub.showApp(contracts, appAddress)`
- [DEPRECATED] `hub.showDataset(contracts, objAddressOrIndex, userAddress)` will stop support params `ìndex` and `userAdress` use `hub.showUserDataset(contracts, index, userAddress)` or `hub.showDataset(contracts, datasetAddress)`
- [DEPRECATED] `hub.showWorkerpool(contracts, objAddressOrIndex, userAddress)` will stop support params `ìndex` and `userAdress` use `hub.showUserWorkerpool(contracts, index, userAddress)` or `hub.showWorkerpool(contracts, workerpoolAddress)`
- [DEPRECATED] `task.claim(contracts, taskid, userAddress)` `userAdress` is no longer required, please use `task.claim(contracts, taskid)`
- [DEPRECATED] `task.fetchResults(contracts, taskid, userAddress, options)` `userAdress` is no longer required, please use `task.fetchResults(contracts, taskid, options)`
- fix everyone can claim a task
- fix `iexec task show` oracle results hexadecimal display (#88)
- fix `iexec task show --download` oracle results error message

### Removed

- [BREAKING] `iexec deal show <dealid> --tasks <...index>` `--tasks` option is removed, as deal's tasks are added to the ouptup.
- [BREAKING] `iexec tee` subcommands removed and replaced (see changed)

## [3.0.36] - 2019-09-24

### Added

### Changed

- update params format for iexec core v3.2 compatibility

### Removed

## [3.0.35] - 2019-09-23

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

## [3.0.34] - 2019-07-10

### Added

- `iexec order fill --params <string>` allow to generate request order on the fly with specified params

### Changed

- request orders are no longer initialized with formated params

## [3.0.33] - 2019-06-25

### Added

- `iexec tee encrypt-dataset --algorithm <'aes-256-cbc'|'scone'>` allow to choose encryption methode, default is aes-256-cbc.
  `--algorithm scone` allow an encrypted dataset to be processed into a SGX enclave by a Scone compatible dapp.

### Changed

- `iexec tee encrypt-dataset` now supports dataset folders.
- CLI fix typo

## [3.0.32] - 2019-05-29

### Added

- option `--gas-price <wei>` allow to use custom gas price.

### Changed

- fix display task contributors.

### Removed

- limit methods exported from `utils` module.

## [3.0.31] - 2019-05-22

### Changed

- `iexec tee encrypt-dataset` now use nodejs implementation (previously dockerized Openssl 1.1.1b).

## [3.0.30] - 2019-05-17

### Added

- Dataset encryption `iexec tee encrypt-dataset`.

### Changed

- beneficary keys generated by `ìexec tee generate-beneficiary-keys` now use AES 256 (previously AES 128).

## [3.0.29] - 2019-05-15

This is the initial release of iExec v3.
