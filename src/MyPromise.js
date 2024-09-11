export default function MyPromise(executor) {
  let status = 'inProgress';

  // This is array because it can be chained and we need to
  // save all callbacks.
  let thenCallback;
  let thenPromiseResolve;

  const resolve = (data) => {
    // Status check so that promise can be
    // resolved only once.
    if (status === 'inProgress') {
      // Promise is a microtask
      queueMicrotask(() => {
        // Update status
        status = 'fulfilled';

        const value = thenCallback?.(data);
        if (value instanceof MyPromise) {
          value.then((data) => {
            thenPromiseResolve?.(data);
          });
        } else {
          thenPromiseResolve?.(value);
        }
      });
    }
  };

  executor(resolve);

  this.then = (callback) => {
    thenCallback = callback;
    const thenPromise = new MyPromise((resolve) => {
      thenPromiseResolve = resolve;
    });
    return thenPromise;
  };
}

MyPromise.resolve = (data) => {
  return new MyPromise((resolve) => {
    resolve(data);
  });
};
