export default function MyPromise(executor) {
  let status = 'pending';
  let thenCallback;
  let catchCallback;
  let finallyCallback;
  let returnedResolve;
  let returnedReject;

  const resolve = (data) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'fulfilled';
        if (thenCallback) {
          const value = thenCallback(data);
          if (value instanceof MyPromise) {
            value.then((data) => {
              returnedResolve?.(data);
            }, (err) => {
              returnedReject?.(err);
            });
          } else {
            returnedResolve?.(value);
          }
        } else {
          finallyHandler();
        }
      });
    }
  };

  const reject = (data) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'rejected';

        if (catchCallback) {
          const value = catchCallback(data);
          if (value instanceof MyPromise) {
            value.then((data) => {
              returnedResolve?.(data);
            }, (err) => {
              returnedReject?.(err);
            });
          } else {
            returnedResolve?.(value);
          }
        } else {
          finallyHandler();
        }
      });
    }
  };

  const finallyHandler = () => {
    if (finallyCallback) {
      const value = finallyCallback();
      if (value instanceof MyPromise) {
        value.then((data) => {
          returnedResolve?.(data);
        }, (err) => {
          returnedReject?.(err);
        });
      } else {
        returnedResolve?.(value);
      }
    }
  }

  executor(resolve, reject);

  this.then = (onFulfilled, onRejected) => {
    thenCallback = onFulfilled;
    catchCallback = onRejected;
    const thenPromise = new MyPromise((resolve, reject) => {
      returnedResolve = resolve;
      returnedReject = reject
    });
    return thenPromise;
  };

  this.catch = (onRejected) => {
    thenCallback = (data) => data;
    catchCallback = onRejected;
    const catchPromise = new MyPromise((resolve, reject) => {
      returnedResolve = resolve;
      returnedReject = reject;
    });
    return catchPromise;
  }

  this.finally = (onFinally) => {
    finallyCallback = onFinally;
    const finallyPromise = new MyPromise((resolve, reject) => {
      returnedResolve = resolve;
      returnedReject = reject;
    });
    return finallyPromise;
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
