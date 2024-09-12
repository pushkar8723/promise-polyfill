export default function MyPromise(executor) {
  let status = 'pending';
  let successData;
  let failureError;
  let thenCallback;
  let catchCallback;
  let returnedResolve;
  let returnedReject;

  const resolve = (data) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'fulfilled';
        successData = data;
        try {
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
        } catch (e) {
          returnedReject?.(e);
        }
      });
    }
  };

  const reject = (error) => {
    if (status === 'pending') {
      queueMicrotask(() => {
        status = 'rejected';
        failureError = error;

        if (!returnedReject) {
          console.error("Unhandled Reject");
        }

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
      });
    }
  };

  executor(resolve, reject);

  this.then = (onFulfilled, onRejected) => {
    thenCallback = onFulfilled ? onFulfilled : (data) => data;
    catchCallback = onRejected ? onRejected : (err) => { throw err };
    return new MyPromise((resolve, reject) => {
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
