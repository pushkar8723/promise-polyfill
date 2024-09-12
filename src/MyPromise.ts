/**
 * Custom implementation for Promise
 * 
 * Cases to be handled
 * 1. Executor should be synchronus
 * 2. resolve and reject should be pushed to micro task queue
 * 3. `then`, `catch` and `finally` should return a new Promise
 * 4. Muliple `then`, `catch` and `finally` can be added to same promise
 * 5. `then`, `catch` and `finally` can be called at a later time
 * 6. If callbacks from `then`, `catch` and `finally` returns a promise
 *    then the returned Promise should be chained
 * 7. Unhandled rejection should be caught
 * 8. `finally` should be called in both resolution and rejection of the promise
 */
export default class MyPromise {
  /** Status of the Promise */
  private status = 'pending';
  /** Stores value of the promise if it is resolved */
  private successData?: unknown;
  /** Stores error returned by the promise if it is rejected */
  private failureError?: Error;
  /** All success callbacks for the promise */
  private thenCallbacks: ((value?: unknown) => any)[] = [];
  /** All failure callbacks for the promise */
  private catchCallbacks:  ((reason?: Error) => any)[] = [];

  constructor(executor: (resolve: (data?: unknown) => any, reject: (reason?: Error) => any) => void) {
    // Call the executor syncronously [1]
    try {
      executor(this.resolve, this.reject);
    } catch (e) {
      // Reject promise on error
      this.reject(e);
    }
  }

  // Private Methods

  /**
   * Called when Promise is resolved.
   */
  private resolve = (data: unknown) => {
    // Promise can be resolved only once
    if (this.status === 'pending') {
      // Push to microtask queue [2]
      queueMicrotask(() => {
        // Update status and store data
        this.status = 'fulfilled';
        this.successData = data;
      
        // Call all success callbacks
        this.thenCallbacks.forEach(cb => cb(data));
      });
    }
  };

  /**
   * Called when Promise is rejected
   */
  private reject = (error?: Error) => {
    // Promise can be rejected only once
    if (this.status === 'pending') {
      // Push to microtask queue [2]
      queueMicrotask(() => {
        // Update status and store error
        this.status = 'rejected';
        this.failureError = error;

        // Check for unhandled rejections [7]
        if (this.catchCallbacks.length == 0) {
          console.error("Unhandled Reject");
        }

        // Call all failure callbacks
        this.catchCallbacks.forEach(cb => cb(error));
      });
    }
  };
  
  // Static Methods

  /**
   * Return a Promise and resolve the Promise immediately
   */
  static resolve = (data?: unknown) => {
    return new MyPromise((resolve) => {
      resolve(data);
    });
  }

  /**
   * Return a Promise and reject the Promise immediately
   */
  static reject = (err?: Error) => {
    return new MyPromise((_, reject) => {
      reject(err);
    });
  };

  /**
   * Settle to first promise's result or first non-promise value.
   */
  static race = (arr: Iterable<unknown>) => {
    return new MyPromise((resolve, reject) => {
      [...arr].forEach(item => {
        if (item instanceof MyPromise) {
          item.then((data) => resolve(data), (reason) => reject(reason));
        } else {
          resolve(item);
        }
      })
    });
  }

  /**
   * Resolve with first successful promise's resolution or first non-promise value.
   */
  static any = (arr: Iterable<unknown>) => {
    let counter = 0;
    let array = [...arr];
    return new MyPromise((resolve, reject) => {
      array.forEach(item => {
        if (item instanceof MyPromise) {
          item.then((data) => resolve(data), () => {
            counter++;
            if (counter === array.length) {
              reject(new Error('Aggregate Error'));
            }
          })
        } else {
          resolve(item);
        }
      })
    })
  }

  /**
   * Wait for all promises to resolve. Return array with resolution
   * of each promise or value.
   * Reject if any promise fails.
   */
  static all = (arr: Iterable<unknown>) => {
    const array = [...arr];
    let result = new Array(array.length);
    let counter = 0;

    return new MyPromise((resolve, reject) => {
      if (array.length === 0) {
        resolve(arr);
      }

      const updateResult = (data: unknown, index: number) => {
        result[index] = data;
        counter++;
        if (counter === array.length) {
          resolve(result)
        }
      }

      [...arr].forEach((item, index) => {
        if (item instanceof MyPromise) {
          item.then((data) => {
            updateResult(data, index);
          }, (reason) => reject(reason))
        } else {
          updateResult(item, index);
        }
      });
    });
  }

  /**
   * Resolves with `staus` and `value` or `reason` for each promise
   * or value in the given iterable. 
   */
  static allSettled = (arr: Iterable<unknown>) => {
    const array = [...arr];
    let result = new Array(array.length);
    let counter = 0;

    return new MyPromise((resolve) => {
      if (!arr || array.length === 0) {
        resolve(arr);
      }

      const updateResult = (data: unknown, index: number) => {
        result[index] = data;
        counter++;
        if (counter === array.length) {
          resolve(result);
        }
      }

      [...arr].forEach((item, index) => {
        if (item instanceof MyPromise) {
          item.then((value) => {
            updateResult({
              status: 'fulfilled',
              value,
            }, index);
          }, (reason) => {
            updateResult({
              status: 'rejected',
              reason
            }, index);
          });
        } else {
          updateResult({
            status: 'fulfilled',
            value: item,
          }, index);
        }
      })
    });
  }

  // Public Methods

  /**
   * Promise then chain
   */
  public then = (onFulfilled?: (data?: unknown) => any, onRejected?: (reason?: Error) => any)  => {
    // Success Callback, default fn would simply return the data
    const successCallback = onFulfilled ? onFulfilled : (data: unknown) => data;

    // Failure Callback, default fn whould simply trhow the error
    const failureCallback = onRejected ? onRejected : (err: Error) => { throw err };

    // Return a new Promise [3]
    return new MyPromise((resolve, reject) => {
      /**
       * Common handler for both success and failure
       */
      const handle = (callback: Function, arg: unknown) => {
        try {
          // Call the callback
          const value = callback(arg);

          // Check if value is another promise [6]
          if (value instanceof MyPromise) {
            // Chain resolve and reject in case the returned value
            // is a promise
            value.then(resolve, reject);
          } else {
            // Resolve the returned promise
            resolve(value);
          }
        } catch(e) {
          // Reject the returned proimse in case of error
          reject(e);
        }
      }

      if (this.status === 'pending') {
        // Push to success callbacks [4]
        this.thenCallbacks.push((data) => {
          handle(successCallback, data);
        });

        // Push to failure callbacks [4]
        this.catchCallbacks.push((error) => {
          handle(failureCallback, error);
        });
      } else if (this.status === 'fulfilled') {
        // Promise is already resolved, pass the data to callback [5]
        queueMicrotask(() => {
          onFulfilled?.(this.successData);
        });
      } else {
        // Promise is already rejected, pass the error to callback [5]
        queueMicrotask(() => {
          onRejected?.(this.failureError);
        })
      }
    });
  };

  /**
   * Promise catch chain
   * Implement using then chain
   */
  public catch = (onRejected: (reason?: Error) => any) => {
    return this.then(undefined, onRejected);
  }

  /**
   * Promise finally chain
   * Implement using then chain
   */
  public finally = (onFinally?: () => any) => {
    // Using a promise to wrap `onFinally` in both success and failure. [8]
    // This way, if `onFinally` returns another proimse, that is also
    // automatically chained.
    return this.then((data: unknown) => {
      return MyPromise.resolve(onFinally?.()).then(() => data);
    }, (reason?: Error) => { 
      return MyPromise.resolve(onFinally?.()).then(() => { throw reason})
    })
  }
}
