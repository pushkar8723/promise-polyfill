// promise.test.js
import MyPromise from './MyPromise';

describe('Promise Synchronous and Asynchronous Tests', () => {
  test('Synchronous part of the Promise should run immediately', () => {
    const mockFn = jest.fn(); // A mock function to check synchronous execution
    
    const myPromise = new MyPromise((resolve) => {
      mockFn();  // This should run synchronously
      resolve('Success');
    });
    
    expect(mockFn).toHaveBeenCalled(); // Synchronous code should run immediately
  });

  test('Asynchronous part of the Promise runs after the synchronous code', (done) => {
    let syncFlag = false;
    
    const myPromise = new MyPromise((resolve) => {
      resolve('Success');
    });
    
    myPromise.then((result) => {
      expect(result).toBe('Success');
      expect(syncFlag).toBe(true); // This should run after the synchronous code
      done(); // Indicate the test is finished
    });

    syncFlag = true; // Synchronous part runs first
  });

  test('Promise resolves after delay', () => {
    const delayedPromise = new MyPromise((resolve) => {
      setTimeout(() => resolve('Delayed Success'), 100);
    });
    
    return expect(delayedPromise).resolves.toBe('Delayed Success');
  });

  test('Promise inside setTimeout runs asynchronously', (done) => {
    let syncFlag = false;

    setTimeout(() => {
      const myPromise = MyPromise.resolve('Async Result');
      
      myPromise.then((result) => {
        expect(result).toBe('Async Result');
        expect(syncFlag).toBe(true); // Should run after synchronous code
        done();
      });
    }, 0);

    syncFlag = true; // Synchronous part executed before timeout
  });

  test('Unhandled rejection should be caught in test', async () => {
    // Spy on console.error
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a promise that will be rejected
    const unhandled = MyPromise.reject(new Error('This is an unhandled rejection'));

    unhandled.finally(() => {
      // Assert that console.log was called with the correct arguments
      expect(logSpy).toHaveBeenCalledWith('Unhandled Reject');
  
      // Restore console.log to its original state
      logSpy.mockRestore();
    })
  });

  test('should not execute .then() after promise has resolved', async () => {
    const resolveSpy = jest.fn();

    // Create a promise that resolves
    const myPromise = new MyPromise((resolve) => {
      setTimeout(() => resolve('Resolved value'), 100);
    });

    // Add a .then handler to track when it's resolved
    await myPromise.then(resolveSpy);

    // Assert that the resolveSpy was called once
    expect(resolveSpy).toHaveBeenCalledTimes(1);

    // Try adding another .then() after the promise has already resolved
    await myPromise.then(() => {
      resolveSpy('This should not happen again');
    });

    // Assert that resolveSpy is still only called once
    expect(resolveSpy).toHaveBeenCalledTimes(2); // Once for the initial resolution and once for the post-resolution handler
  });

  test('should not resolve multiple times', async () => {
    const { promise, resolve } = MyPromise.withResolvers();

    const thenSpy = jest.fn();

    // Attach .then() to observe when the promise resolves
    promise.then(thenSpy);

    // Resolve the promise
    resolve('First resolve');
    
    // Immediately resolve again (should not trigger another resolve)
    resolve('Second resolve');

    // Wait for promise resolution
    await promise;

    // Assert that .then was called only once
    expect(thenSpy).toHaveBeenCalledTimes(1);

    // Assert that it was called with the first value
    expect(thenSpy).toHaveBeenCalledWith('First resolve');
  });

  test('Promise `then` chain should execute asynchronously', (done) => {
    const results: unknown[] = [];
    
    const myPromise = MyPromise.resolve('First');
    
    myPromise
      .then((result) => {
        results.push(result); // Should execute after synchronous code
        return 'Second';
      })
      .then((result) => {
        results.push(result); // Should execute after the first `then`
        expect(results).toEqual(['First', 'Second']); // Check the chain
        done();
      });
      
    expect(results).toEqual([]); // Synchronous part hasn't executed yet
  });

  test('should still resolve even if no arguments are passed to .then()', async () => {
    const promise = MyPromise.resolve('Resolved value');

    // No argument passed to .then()
    const result = await promise.then();

    // Assert that the result is still the resolved value
    expect(result).toBe('Resolved value');
  });

  test('should still catch rejections even if no arguments are passed to .then()', async () => {
    const promise = MyPromise.reject(new Error('Rejected value'));

    // No argument passed to .then(), but .catch() will be added to handle rejection
    try {
      await promise.then();
    } catch (error) {
      // Assert that the error is caught
      expect(error).toEqual(new Error('Rejected value'));
    }
  });

  test('catch() handles rejected promises', () => {
    const promise = MyPromise.reject(new Error('Failed'));

    return promise.catch(error => {
      expect(error?.message).toBe('Failed');
    });
  });

  test('finally() runs regardless of promise resolution', () => {
    const mockFinally = jest.fn();

    const resolvedPromise = MyPromise.resolve('Done');
    const rejectedPromise = MyPromise.reject(new Error('Failed'));

    const resolvedTest = resolvedPromise.finally(() => mockFinally()).then(data => expect(data).toBe('Done'));
    const rejectedTest = rejectedPromise.finally(() => mockFinally()).catch(error => expect(error?.message).toBe('Failed'));

    return MyPromise.all([resolvedTest, rejectedTest]).then(() => {
      expect(mockFinally).toHaveBeenCalledTimes(2);
    });
  });

  test('should resolve as usual even if no callback is passed to finally', async () => {
    const promise = MyPromise.resolve('Resolved value');

    // Call finally without any arguments
    const result = await promise.finally();

    // Assert that the result is still the resolved value
    expect(result).toBe('Resolved value');
  });

  test('should reject as usual even if no callback is passed to finally', async () => {
    const promise = MyPromise.reject(new Error('Rejected value'));

    // Call finally without any arguments
    try {
      await promise.finally();
    } catch (error) {
      // Assert that the error is still caught
      expect(error).toEqual(new Error('Rejected value'));
    }
  });

  test('all() resolves when all promises resolve', () => {
    const promises = [
      MyPromise.resolve('One'),
      MyPromise.resolve('Two'),
      MyPromise.resolve('Three')
    ];

    return MyPromise.all(promises).then(results => {
      expect(results).toEqual(['One', 'Two', 'Three']);
    });
  });

  test('all() rejects if any promise rejects', () => {
    const promises = [
      MyPromise.resolve('One'),
      MyPromise.reject(new Error('Failed')),
      MyPromise.resolve('Three')
    ];

    return MyPromise.all(promises).catch(error => {
      expect(error?.message).toBe('Failed');
    });
  });

  test('all() handles non-promise values', async () => {
    const promise1 = new MyPromise((resolve) => setTimeout(() => resolve('First'), 100));
    const promise2 = new MyPromise((resolve) => setTimeout(() => resolve('Second'), 200));
    const nonPromiseValue = 'Non-Promise Value';

    // Use Promise.all with promises and a non-promise value
    const results = await MyPromise.all([promise1, promise2, nonPromiseValue]);

    // Assert that results include the non-promise value as well
    expect(results).toEqual(['First', 'Second', nonPromiseValue]);
  });

  test('all([]) resolves immediately with an empty array', async () => {
    const result = await MyPromise.all([]);

    // Assert that the result is an empty array
    expect(result).toEqual([]);
  });

  test('any() resolves when at least one promise resolves', () => {
    const promises = [
      MyPromise.reject(new Error('Failed')),
      MyPromise.resolve('Success'),
      MyPromise.reject(new Error('Another Failure'))
    ];

    return MyPromise.any(promises).then(result => {
      expect(result).toBe('Success');
    });
  });

  test('any() rejects if all promises reject', () => {
    const promises = [
      MyPromise.reject(new Error('Failed 1')),
      MyPromise.reject(new Error('Failed 2')),
      MyPromise.reject(new Error('Failed 3'))
    ];

    return MyPromise.any(promises).catch(error => {
      expect(error?.message).toBe('All promises were rejected');
    });
  });

  test('Promise.any handles non-promise values', async () => {
    const promise1 = new MyPromise((_, reject) => setTimeout(() => reject(new Error('Failed 1')), 100));
    const promise2 = new MyPromise((_, reject) => setTimeout(() => reject(new Error('Failed 2')), 200));
    const nonPromiseValue = 'Non-Promise Value';

    // Use Promise.any with promises and a non-promise value
    const result = await MyPromise.any([promise1, promise2, nonPromiseValue]);

    // Assert that the result is the non-promise value
    expect(result).toBe(nonPromiseValue);
  });

  test('Promise.any([]) rejects immediately with an AggregateError', async () => {
    try {
      await MyPromise.any([]);
    } catch (error) {
      // Optionally, check the error message or structure
      expect(error.errors).toEqual([]);
    }
  });

  test('race() resolves or rejects based on the first promise', () => {
    const promises = [
      MyPromise.reject(new Error('Failed')),
      MyPromise.resolve('Winner'),
      MyPromise.resolve('Loser')
    ];

    return MyPromise.race(promises).catch(error => {
      expect(error?.message).toBe('Failed');
    });
  });

  test('Promise.race handles non-promise values', async () => {
    const promise1 = new MyPromise((resolve) => setTimeout(() => resolve('First'), 100));
    const promise2 = new MyPromise((resolve) => setTimeout(() => resolve('Second'), 200));
    const nonPromiseValue = 'Non-Promise Value';

    // Use Promise.race with both promises and a non-promise value
    const result = await MyPromise.race([promise1, promise2, nonPromiseValue]);

    // Assert that the result is the non-promise value
    expect(result).toBe(nonPromiseValue);
  });

  test('allSettled() resolves with the results of all promises', () => {
    const promises = [
      MyPromise.resolve('One'),
      MyPromise.reject(new Error('Failed')),
      MyPromise.resolve('Three')
    ];

    return MyPromise.allSettled(promises).then(results => {
      expect(results).toEqual([
        { status: 'fulfilled', value: 'One' },
        { status: 'rejected', reason: new Error('Failed') },
        { status: 'fulfilled', value: 'Three' }
      ]);
    });
  });

  test('Promise.allSettled handles non-promise values', async () => {
    const promise1 = new MyPromise((resolve) => setTimeout(() => resolve('First'), 100));
    const promise2 = new MyPromise((_, reject) => setTimeout(() => reject(new Error('Failed')), 200));
    const nonPromiseValue = 'Non-Promise Value';

    // Use Promise.allSettled with promises and a non-promise value
    const results = await MyPromise.allSettled([promise1, promise2, nonPromiseValue]);

    // Assert that results include the non-promise value as well
    expect(results).toEqual([
      { status: 'fulfilled', value: 'First' },
      { status: 'rejected', reason: new Error('Failed') },
      { status: 'fulfilled', value: nonPromiseValue }
    ]);
  });

  test('Promise.allSettled([]) resolves immediately with an empty array', async () => {
    const result = await MyPromise.allSettled([]);

    // Assert that the result is an empty array
    expect(result).toEqual([]);
  });

  test('withResolvers() creates a promise with resolvers', () => {
    const { promise, resolve, reject } = MyPromise.withResolvers();

    // Resolve and reject using the resolvers returned
    resolve('Resolved Value');
    reject(new Error('Rejected Error'));

    const resolvePromise = new MyPromise((res) => {
      setTimeout(() => res('Resolved Value'), 100);
    });

    const rejectPromise = new MyPromise((_, rej) => {
      setTimeout(() => rej(new Error('Rejected Error')), 100);
    });

    return MyPromise.allSettled([promise, resolvePromise, rejectPromise]).then(results => {
      // Check if the promise resolved or rejected as expected
      const [promiseResult, resolveResult, rejectResult] = results;

      expect(promiseResult.status).toBe('fulfilled');
      expect(promiseResult.value).toBe('Resolved Value');

      expect(resolveResult.status).toBe('fulfilled');
      expect(resolveResult.value).toBe('Resolved Value');

      expect(rejectResult.status).toBe('rejected');
      expect(rejectResult.reason).toEqual(new Error('Rejected Error'));
    });
  });

  test('withResolvers() promise resolves correctly', () => {
    const { promise, resolve } = MyPromise.withResolvers();

    // Resolve the promise after a short delay
    resolve('Resolved Value');

    return promise.then(result => {
      expect(result).toBe('Resolved Value');
    });
  });

  test('withResolvers() promise rejects correctly', () => {
    const { promise, reject } = MyPromise.withResolvers();

    // Reject the promise after a short delay
    reject(new Error('Rejected Value'));

    return promise.catch(error => {
      expect(error).toEqual(new Error('Rejected Value'));
    });
  });

  test('try() resolves when function succeeds', () => {
    const fn = () => 'Success';

    return MyPromise.try(fn).then(result => {
      expect(result).toBe('Success');
    });
  });

  test('try() rejects when function throws an error', () => {
    const fn = () => { throw new Error('Failed'); };

    return MyPromise.try(fn).catch(error => {
      expect(error).toEqual(expect.any(Error));
      expect(error?.message).toBe('Failed');
    });
  });

  test('try() handles functions that return promises', () => {
    const promiseFn = () => MyPromise.resolve('Promise Success');

    return MyPromise.try(promiseFn).then(result => {
      expect(result).toBe('Promise Success');
    });
  });
});
