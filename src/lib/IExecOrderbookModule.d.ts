import IExecConfig from './IExecConfig';
import IExecModule from './IExecModule';
import {
  Address,
  Addressish,
  BNish,
  Bytes,
  Bytes32,
  OrderHash,
  HumanSingleTag,
  Tag,
} from './types';

/**
 * published sell order for an app
 */
export interface PublishedApporder {
  orderHash: OrderHash;
  chainId: number;
  remaining: number;
  status: string;
  signer: Address;
  publicationTimestamp: string;
  order: {
    app: Address;
    appprice: number;
    volume: number;
    tag: Bytes32;
    datasetrestrict: Address;
    workerpoolrestrict: Address;
    requesterrestrict: Address;
    salt: Bytes32;
    sign: Bytes;
  };
}

/**
 * published sell order for a dataset
 */
export interface PublishedDatasetorder {
  orderHash: OrderHash;
  chainId: number;
  remaining: number;
  status: string;
  signer: Address;
  publicationTimestamp: string;
  order: {
    dataset: Address;
    datasetprice: number;
    volume: number;
    tag: Bytes32;
    apprestrict: Address;
    workerpoolrestrict: Address;
    requesterrestrict: Address;
    salt: Bytes32;
    sign: Bytes;
  };
}

/**
 * published sell order for computing power
 */
export interface PublishedWorkerpoolorder {
  orderHash: OrderHash;
  chainId: number;
  remaining: number;
  status: string;
  signer: Address;
  publicationTimestamp: string;
  order: {
    workerpool: Address;
    workerpoolprice: number;
    volume: number;
    tag: Bytes32;
    category: number;
    trust: number;
    apprestrict: Address;
    datasetrestrict: Address;
    requesterrestrict: Address;
    salt: Bytes32;
    sign: Bytes;
  };
}

/**
 * published buy order for computing tasks
 */
export interface PublishedRequestorder {
  orderHash: OrderHash;
  chainId: number;
  remaining: number;
  status: string;
  signer: Address;
  publicationTimestamp: string;
  order: {
    app: Address;
    appmaxprice: number;
    dataset: Address;
    datasetmaxprice: number;
    workerpool: Address;
    workerpoolmaxprice: number;
    volume: number;
    tag: Bytes32;
    category: number;
    trust: number;
    beneficiary: Address;
    callback: Address;
    params: string;
    salt: Bytes32;
    sign: Bytes;
  };
}

export interface PaginableOrders<OT> {
  /**
   * order page (this may be a partial result)
   */
  orders: OT[];
  /**
   * total count
   */
  count: number;
  /**
   * when a partial result is returned, `more()` can be called to get the next page.
   */
  more?: () => Promise<PaginableOrders<OT>>;
}

/**
 * module exposing orderbook methods
 */
export default class IExecOrderbookModule extends IExecModule {
  /**
   * find the cheapest orders for the specified app.
   *
   * _NB_: use `options` to include restricted orders or filter results.
   *
   * example:
   * ```js
   * const { count, orders } = await fetchAppOrderbook(appAddress);
   * console.log('best order:', orders[0]?.order);
   * console.log('total orders:', count);
   * ```
   */
  fetchAppOrderbook(
    appAddress: Addressish,
    options?: {
      /**
       * include orders restricted to specified dataset (use `'any'` to include any dataset)
       */
      dataset?: Addressish | 'any';
      /**
       * include orders restricted to specified workerpool (use `'any'` to include any workerpool)
       */
      workerpool?: Addressish | 'any';
      /**
       * include orders restricted to specified requester (use `'any'` to include any requester)
       */
      requester?: Addressish | 'any';
      /**
       * filter by minimum volume remaining
       */
      minVolume?: BNish;
      /**
       * filter by minimum tag required
       */
      minTag?: Tag | HumanSingleTag[];
      /**
       * filter by maximum tag accepted
       */
      maxTag?: Tag | HumanSingleTag[];
    },
  ): Promise<PaginableOrders<PublishedApporder>>;
  /**
   * find the cheapest orders for the specified dataset.
   *
   * _NB_: use `options` to include restricted orders or filter results.
   *
   * example:
   * ```js
   * const { count, orders } = await fetchDatasetOrderbook(datasetAddress);
   * console.log('best order:', orders[0]?.order);
   * console.log('total orders:', count);
   * ```
   */
  fetchDatasetOrderbook(
    datasetAddress: Addressish,
    options?: {
      /**
       * include orders restricted to specified app (use `'any'` to include any app)
       */
      app?: Addressish | 'any';
      /**
       * include orders restricted to specified workerpool (use `'any'` to include any workerpool)
       */
      workerpool?: Addressish | 'any';
      /**
       * include orders restricted to specified requester (use `'any'` to include any requester)
       */
      requester?: Addressish | 'any';
      /**
       * filter by minimum volume remaining
       */
      minVolume?: BNish;
      /**
       * filter by minimum tag required
       */
      minTag?: Tag | HumanSingleTag[];
      /**
       * filter by maximum tag accepted
       */
      maxTag?: Tag | HumanSingleTag[];
    },
  ): Promise<PaginableOrders<PublishedDatasetorder>>;
  /**
   * find the cheapest orders for the specified computing resource.
   *
   * _NB_: use `options` to include restricted orders or filter results.
   *
   * example:
   * ```js
   * const { count, orders } = await fetchWorkerpoolOrderbook();
   * console.log('best order:', orders[0]?.order);
   * console.log('total orders:', count);
   * ```
   */
  fetchWorkerpoolOrderbook(options?: {
    /**
     * filter by workerpool
     */
    workerpool?: Addressish;
    /**
     * filter by category
     */
    category?: BNish;
    /**
     * include orders restricted to specified app (use `'any'` to include any app)
     */
    app?: Addressish | 'any';
    /**
     * include orders restricted to specified dataset (use `'any'` to include any dataset)
     */
    dataset?: Addressish | 'any';
    /**
     * include orders restricted to specified requester (use `'any'` to include any requester)
     */
    requester?: Addressish | 'any';
    /**
     * filter by minimum volume remaining
     */
    minVolume?: BNish;
    /**
     * filter by minimum tag required
     */
    minTag?: Tag | HumanSingleTag[];
    /**
     * filter by maximum tag offered
     */
    maxTag?: Tag | HumanSingleTag[];
    /**
     * filter by minimum trust required
     */
    minTrust?: BNish;
  }): Promise<PaginableOrders<PublishedWorkerpoolorder>>;
  /**
   * find the best paying request orders for computing resource.
   *
   * _NB_: use `options` to include restricted orders or filter results.
   *
   * example:
   * ```js
   * const { count, orders } = await fetchRequestOrderbook();
   * console.log('best order:', orders[0]?.order);
   * console.log('total orders:', count);
   * ```
   */
  fetchRequestOrderbook(options?: {
    /**
     * filter by requester
     */
    requester?: Addressish;
    /**
     * filter by category
     */
    category?: BNish;
    /**
     * filter by specified app
     */
    app?: Addressish;
    /**
     * filter by specified dataset
     */
    dataset?: Addressish;
    /**
     * include orders restricted to specified workerpool (use `'any'` to include any workerpool)
     */
    workerpool?: Addressish | 'any';
    /**
     * filter by minimum volume remaining
     */
    minVolume?: BNish;
    /**
     * filter by minimum tag required
     */
    minTag?: Tag | HumanSingleTag[];
    /**
     * filter by maximum tag accepted
     */
    maxTag?: Tag | HumanSingleTag[];
    /**
     * filter by maximum trust required
     */
    maxTrust?: BNish;
  }): Promise<PaginableOrders<PublishedWorkerpoolorder>>;
  /**
   * find a published apporder by orderHash.
   *
   * example:
   * ```js
   * const { order, remaining } = await fetchApporder(orderHash);
   * console.log('order:' order);
   * console.log('remaining volume:', remaining);
   * ```
   */
  fetchApporder(orderHash: OrderHash): Promise<PublishedApporder>;
  /**
   * find a published datasetorder by orderHash.
   *
   * example:
   * ```js
   * const { order, remaining } = await fetchDatasetorder(orderHash);
   * console.log('order:' order);
   * console.log('remaining volume:', remaining);
   * ```
   */
  fetchDatasetorder(orderHash: OrderHash): Promise<PublishedDatasetorder>;
  /**
   * find a published workerpoolorder by orderHash.
   *
   * example:
   * ```js
   * const { order, remaining } = await fetchWorkerpoolorder(orderHash);
   * console.log('order:' order);
   * console.log('remaining volume:', remaining);
   * ```
   */
  fetchWorkerpoolorder(orderHash: OrderHash): Promise<PublishedWorkerpoolorder>;
  /**
   * find a published requestorder by orderHash.
   *
   * example:
   * ```js
   * const { order, remaining } = await fetchRequestorder(orderHash);
   * console.log('order:' order);
   * console.log('remaining volume:', remaining);
   * ```
   */
  fetchRequestorder(orderHash: OrderHash): Promise<PublishedRequestorder>;
  /**
   * Create an IExecOrderbookModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecOrderbookModule;
}
