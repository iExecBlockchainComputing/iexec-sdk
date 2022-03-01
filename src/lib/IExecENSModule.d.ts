import { Observable } from '../common/utils/reactive';
import IExecModule from './IExecModule';
import { Address, ENS, TxHash } from './types';

declare class ENSConfigirationObservable extends Observable {
  /**
   * subscribe and start the ENS configuration process until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned cancel method.
   *
   * return the `cancel: () => void` method.
   *
   * data:
   * | message | comment | additional entries |
   * | --- | --- | --- |
   * | `DESCRIBE_WORKFLOW` | sent once | `addressType`,`steps` |
   * | `SET_RESOLVER_TX_REQUEST` | sent once if resolver is not set | `name`,`resolverAddress` |
   * | `SET_RESOLVER_TX_SENT` | sent once if resolver is not set | `txHash` |
   * | `SET_RESOLVER_SUCCESS` | sent once | `name`,`resolverAddress` |
   * | `SET_ADDR_TX_REQUEST` | sent once if addr is not set | `name`,`address` |
   * | `SET_ADDR_TX_SENT` | sent once if addr is not set | `txHash` |
   * | `SET_ADDR_SUCCESS` | sent once | `name`,`address` |
   * | `CLAIM_REVERSE_WITH_RESOLVER_TX_REQUEST` | sent once if address type is EAO and reverse address is not claimedt | `address`,`resolverAddress` |
   * | `CLAIM_REVERSE_WITH_RESOLVER_TX_SENT` | sent once if address type is EAO and reverse address is not claimed | `txHash` |
   * | `CLAIM_REVERSE_WITH_RESOLVER_SUCCESS` | sent once if address type is EAO | `address`,`resolverAddress` |
   * | `SET_NAME_TX_REQUEST` | sent once if the name is not set | `name`,`address` |
   * | `SET_NAME_TX_SENT` | sent once if the name is not set | `txHash` |
   * | `SET_NAME_SUCCESS` | sent once | `name`,`address` |
   */
  subscribe(callbacks: {
    /**
     * callback fired at every configuration step
     *
     * data:
     * | message | comment | additional entries |
     * | --- | --- | --- |
     * | `DESCRIBE_WORKFLOW` | sent once | `addressType`,`steps` |
     * | `SET_RESOLVER_TX_REQUEST` | sent once if resolver is not set | `name`,`resolverAddress` |
     * | `SET_RESOLVER_TX_SENT` | sent once if resolver is not set | `txHash` |
     * | `SET_RESOLVER_SUCCESS` | sent once | `name`,`resolverAddress` |
     * | `SET_ADDR_TX_REQUEST` | sent once if addr is not set | `name`,`address` |
     * | `SET_ADDR_TX_SENT` | sent once if addr is not set | `txHash` |
     * | `SET_ADDR_SUCCESS` | sent once | `name`,`address` |
     * | `CLAIM_REVERSE_WITH_RESOLVER_TX_REQUEST` | sent once if address type is EAO and reverse address is not claimedt | `address`,`resolverAddress` |
     * | `CLAIM_REVERSE_WITH_RESOLVER_TX_SENT` | sent once if address type is EAO and reverse address is not claimed | `txHash` |
     * | `CLAIM_REVERSE_WITH_RESOLVER_SUCCESS` | sent once if address type is EAO | `address`,`resolverAddress` |
     * | `SET_NAME_TX_REQUEST` | sent once if the name is not set | `name`,`address` |
     * | `SET_NAME_TX_SENT` | sent once if the name is not set | `txHash` |
     * | `SET_NAME_SUCCESS` | sent once | `name`,`address` |
     */
    next: (data: {
      message: string;
      addressType?: string;
      steps?: string[];
      name?: ENS;
      resolverAddress?: Address;
      address?: Address;
      txHash?: TxHash;
    }) => any;
    /**
     * callback fired once when the configuration is completed
     *
     * no other callback is fired after firing `complete()`
     */
    complete: () => any;
    /**
     * callback fired once when an error occurs
     *
     * no other callback is fired after firing `error(error: Error)`
     */
    error: (error: Error) => any;
  }): /**
   * `cancel: () => void` method, calling this method cancels the subscribtion and stops the configuration
   *
   * no callback is fired after calling this method
   */
  () => void;
}

/**
 * module exposing ENS methods
 */
export default class IExecDealModule extends IExecModule {
  /**
   * get the address of the ENS name's owner.
   *
   * example:
   * ```js
   * const owner = await getOwner('iexec.eth');
   * console.log('iexec.eth owner:', owner);
   * ```
   */
  getOwner(name: ENS): Promise<Address | null>;
  /**
   * resolve the ENS name to an ethereum address if a resolver is configured for the name
   *
   * example:
   * ```js
   * const owner = await resolveName('me.users.iexec.eth');
   * console.log('me.users.iexec.eth:', address);
   * ```
   */
  resolveName(name: ENS): Promise<Address | null>;
  /**
   * lookup to find the ENS name of an ethereum address
   *
   * example:
   * ```js
   * const name = await lookupAddress(address);
   * console.log('ENS name:', name);
   * ```
   */
  lookupAddress(address: Address): Promise<ENS | null>;
  /**
   * register a subdomain (label) on an ENS FIFSRegistrar
   *
   * _NB_:
   * - if specifier, the domain must be controlled by a FIFSRegistrar, default "users.iexec.eth"
   * - if the user already own the domain, the register transaction will not occur
   *
   * example:
   * ```js
   * const { name, registerTxHash } = claimName(
   *   'me',
   *   'users.iexec.eth',
   * );
   * console.log('regitered:', name);
   * ```
   */
  claimName(
    label: string,
    domain?: string,
  ): Promise<{ registeredName: ENS; registerTxHash?: TxHash }>;
  /**
   * return a cold Observable with a `subscribe` method to start and monitor the ENS resolution and reverse resolution configuration.
   *
   * calling the `subscribe` method on the observable will immediately return a cancel function and start the asynchronous ENS configuration.
   *
   * calling the returned cancel method will stop the configuration process
   *
   * _NB_:
   * - `address` must be an iExec RegistryEntry address (ie: app, dataset or workerpool) or the user address, default user address
   * - the configuration may require up to 4 transactions, depending on the target type (EOA or RegistryEntry) and the current state, some transaction may or may not occur to complete the configuration
   *
   * example:
   * - EOA ENS configuration
   * ```js
   * const configureResolutionObservable = await obsConfigureResolution(
   *   'me.users.iexec.eth',
   * );
   * configureResolutionObservable.subscribe({
   *   error: console.error,
   *   next: ({ message, ...rest }) =>
   *     console.log(`${message} ${JSON.strigify(rest)}`),
   *   completed: () => console.log('resolution configured'),
   * });
   * ```
   * - iExec App contract ENS configuration
   * ```js
   * const configureResolutionObservable = await obsConfigureResolution(
   *   'my-app.eth',
   *    appAddress
   * );
   * configureResolutionObservable.subscribe({
   *   error: console.error,
   *   next: ({ message, ...rest }) =>
   *     console.log(`${message} ${JSON.strigify(rest)}`),
   *   completed: () => console.log('resolution configured'),
   * });
   * ```
   */
  obsConfigureResolution(
    name: ENS,
    address?: Address,
  ): Promise<ENSConfigirationObservable>;
  /**
   * configure the ENS resolution and reverse resolution for an owned ENS name, same as `obsConfigureResolution` wrapped in a `Promise`.
   *
   * _NB_:
   * - `address` must be an iExec RegistryEntry address (ie: app, dataset or workerpool) or the user address, default user address
   * - the configuration may require up to 4 transactions, depending on the target type (EOA or RegistryEntry) and the current state, some transaction may or may not occur to complete the configuration
   *
   * example:
   * - EOA ENS configuration
   * ```js
   * const { address, name } = await configureResolution(
   *   'me.users.iexec.eth',
   * );
   * console.log('configured resolution:', address, '<=>', name);
   * ```
   * - iExec App contract ENS configuration
   * ```js
   * const { address, name } = await configureResolution(
   *   'my-app.eth',
   *    appAddress
   * );
   * console.log('configured resolution:', address, '<=>', name);
   * ```
   */
  configureResolution(
    name: ENS,
    address?: Address,
  ): Promise<{
    name: ENS;
    address: Address;
    setResolverTxHash?: TxHash;
    setAddrTxHash?: TxHash;
    claimReverseTxHash?: TxHash;
    setNameTxHash?: TxHash;
  }>;
}
