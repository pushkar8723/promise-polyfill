export default function MyPromise(executor) {
  let status = 'pending';
  let successData;
  let failureError;
  let thenCallback;
  let catchCallback;
  let finallyCallback;
  let returnedResolve;
  let returnedReject;

  const resolve = (data) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'fulfilled';
        successData = data;
        if (thenCallback) {
          try {
            const value = thenCallback(data);
            if (value instanceof MyPromise) {
              value.then((data) => {
                returnedResolve(data);
              }, (err) => {
                returnedReject(err);
              });
            } else {
              returnedResolve(value);
            }
          } catch (e) {
            returnedReject?.(e);
          }
        } else {
          finallyHandler();
        }
      });
    }
  };

  const reject = (error) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'rejected';
        failureError = error;
        if (catchCallback) {
          try {
            const value = catchCallback(error);
            if (value instanceof MyPromise) {
              value.then((data) => {
                returnedResolve?.(data);
              }, (err) => {
                returnedReject?.(err);
              });
            } else {
              returnedResolve?.(value);
            }
          } catch (e) {
            returnedReject?.(e);
          }
        } else {
          finallyHandler();
        }
      });
    }
  };

  const finallyHandler = () => {
    if (finallyCallback) {
      try {
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
      } catch (e) {
        returnedReject?.(e);
      }
    } else {
      if (status === 'fulfilled') {
        returnedResolve?.(successData);
      } else {
        returnedReject?.(failureError);
      }
    }
  }

  executor(resolve, reject);

  this.then = (onFulfilled, onRejected) => {
    thenCallback = onFulfilled;
    catchCallback = onRejected;
    const thenPromise = new MyPromise((resolve, reject) => {
      if (status === 'pending') {
        returnedResolve = resolve;
        returnedReject = reject
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
    return thenPromise;
  };

  this.catch = (onRejected) => {
    thenCallback = (data) => data;
    catchCallback = onRejected;
    const catchPromise = new MyPromise((resolve, reject) => {
      if (status === 'pending') {
        returnedResolve = resolve;
        returnedReject = reject
      } else if (status === 'fulfilled') {
        // do nothing
      } else {
        queueMicrotask(() => {
          onRejected?.(failureError);
        })
      }
    });
    return catchPromise;
  }

  this.finally = (onFinally) => {
    finallyCallback = onFinally;
    const finallyPromise = new MyPromise((resolve, reject) => {
      if (status === 'pending') {
        returnedResolve = resolve;
        returnedReject = reject
      } else {
        queueMicrotask(() => {
          onFinally?.();
        })
      }
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
