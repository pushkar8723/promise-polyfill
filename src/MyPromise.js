/** 
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

export default function MyPromise(executor) {
  /** Status of the Promise */
  let status = 'pending';
  /** Stores value of the promise if it is resolved */
  let successData;
  /** Stores error returned by the promise if it is rejected */
  let failureError;
  /** All success callbacks for the promise */
  const thenCallbacks = [];
  /** All failure callbacks for the promise */
  const catchCallbacks = [];

  /**
   * Called when Promise is resolved.
   */
  const resolve = (data) => {
    // Promise can be resolved only once
    if (status === 'pending') {
      // Push to microtask queue [2]
      queueMicrotask(() => {
        // Update status and store data
        status = 'fulfilled';
        successData = data;
      
        // Call all success callbacks
        thenCallbacks.forEach(cb => cb(data));
      });
    }
  };

  /**
   * Called when Promise is rejected
   */
  const reject = (error) => {
    // Promise can be rejected only once
    if (status === 'pending') {
      // Push to microtask queue [2]
      queueMicrotask(() => {
        // Update status and store error
        status = 'rejected';
        failureError = error;

        // Check for unhandled rejections [7]
        if (catchCallbacks.length == 0) {
          console.error("Unhandled Reject");
        }

        // Call all failure callbacks
        catchCallbacks.forEach(cb => cb(error));
      });
    }
  };

  // Call the executor syncronously [1]
  try {
    executor(resolve, reject);
  } catch (e) {
    // Reject promise on error
    reject(e);
  }

  /**
   * Promise then chain
   */
  this.then = (onFulfilled, onRejected) => {
    // Success Callback, default fn would simply return the data
    const successCallback = onFulfilled ? onFulfilled : (data) => data;

    // Failure Callback, default fn whould simply trhow the error
    const failureCallback = onRejected ? onRejected : (err) => { throw err };

    // Return a new Promise [3]
    return new MyPromise((resolve, reject) => {
      /**
       * Common handler for both success and failure
       */
      const handle = (callback, arg) => {
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

      if (status === 'pending') {
        // Push to success callbacks [4]
        thenCallbacks.push((data) => {
          handle(successCallback, data);
        });

        // Push to failure callbacks [4]
        catchCallbacks.push((error) => {
          handle(failureCallback, error);
        });
      } else if (status === 'fulfilled') {
        // Promise is already resolved, pass the data to callback [5]
        queueMicrotask(() => {
          onFulfilled?.(successData);
        });
      } else {
        // Promise is already rejected, pass the error to callback [5]
        queueMicrotask(() => {
          onRejected?.(failureError);
        })
      }
    });
  };

  /**
   * Promise catch chain
   * Implement using then chain
   */
  this.catch = (onRejected) => {
    return this.then(null, onRejected);
  }

  /**
   * Promise finally chain
   * Implement using then chain
   */
  this.finally = (onFinally) => {
    // Using a promise to wrap `onFinally` in both success and failure. [8]
    // This way, if `onFinally` returns another proimse, that is also
    // automatically chained.
    return this.then((data) => {
      return MyPromise.resolve(onFinally()).then(() => data);
    }, (reason) => { 
      return MyPromise.resolve(onFinally()).then(() => { throw reason})
    })
  }
}

// Static Methods

/**
 * Return a Promise and resolve the Promise immediately
 */
MyPromise.resolve = (data) => {
  return new MyPromise((resolve) => {
    resolve(data);
  });
};

/**
 * Return a Promise and reject the Promise immediately
 */
MyPromise.reject = (err) => {
  return new MyPromise((_, reject) => {
    reject(err);
  });
};
