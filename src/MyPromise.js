export default function MyPromise(executor) {
  let status = 'pending';
  let successData;
  let failureError;
  const thenCallbacks = [];
  const catchCallbacks = [];

  const resolve = (data) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'fulfilled';
        successData = data;
      
        thenCallbacks.forEach(cb => cb(data));
      });
    }
  };

  const reject = (error) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'rejected';
        failureError = error;

        if (catchCallbacks.length == 0) {
          console.error("Unhandled Reject");
        }

        catchCallbacks.forEach(cb => cb(error));
      });
    }
  };

  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }

  this.then = (onFulfilled, onRejected) => {
    const successCallback = onFulfilled ? onFulfilled : (data) => data;
    const failureCallback = onRejected ? onRejected : (err) => { throw err };
    return new MyPromise((resolve, reject) => {
      const handle = (callback, arg) => {
        try {
          const value = callback(arg);
          if (value instanceof MyPromise) {
            value.then(resolve, reject);
          } else {
            resolve(value);
          }
        } catch(e) {
          reject(e);
        }
      }

      if (status === 'pending') {
        thenCallbacks.push((data) => {
          handle(successCallback, data);
        });

        catchCallbacks.push((error) => {
          handle(failureCallback, error);
        });
      } else if (status === 'fulfilled') {
        queueMicrotask(() => {
          onFulfilled?.(successData);
        });
      } else {
        queueMicrotask(() => {
          onRejected?.(failureError);
        })
      }
    });
  };

  this.catch = (onRejected) => {
    return this.then(null, onRejected);
  }

  this.finally = (onFinally) => {
    return this.then((data) => {
      return MyPromise.resolve(onFinally()).then(() => data);
    }, (reason) => { 
      return MyPromise.resolve(onFinally()).then(() => { throw reason})
    })
  }
}

MyPromise.resolve = (data) => {
  return new MyPromise((resolve) => {
    resolve(data);
  });
};

MyPromise.reject = (err) => {
  return new MyPromise((_, reject) => {
    reject(err);
  });
};
