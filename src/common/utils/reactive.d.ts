export class Observable {
  /**
   * subscribe to a data source events via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.
   *
   * return the `unsubscribe: () => void` method.
   */
  subscribe(
    /**
     * callbacks to call on specific events
     */
    callbacks: {
      /**
       * callback to fire on incoming data
       */
      next?: (data: Record<string, any> & { message: string }) => any;
      /**
       * callback to fire when the data emission is done
       *
       * no other callback is fired after firing `complete()`
       */
      complete?: () => any;
      /**
       * callback to fire when a error occurs on the data source
       *
       * no other callback is fired after firing `error(error: Error)`
       */
      error?: (error: Error) => any;
    }
  ): /**
   * `unsubscribe: () => void` method, calling this method cancels the subscription
   *
   * no callback is fired after calling this method
   */
  () => void;
}
