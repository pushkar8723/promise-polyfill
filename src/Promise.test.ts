// promise.test.js
import Promise from './MyPromise';

describe('Promise Synchronous and Asynchronous Tests', () => {
  test('Synchronous part of the Promise should run immediately', () => {
    const mockFn = jest.fn(); // A mock function to check synchronous execution
    
    const myPromise = new Promise((resolve) => {
      mockFn();  // This should run synchronously
      resolve('Success');
    });
    
    expect(mockFn).toHaveBeenCalled(); // Synchronous code should run immediately
  });

  test('Asynchronous part of the Promise runs after the synchronous code', (done) => {
    let syncFlag = false;
    
    const myPromise = new Promise((resolve) => {
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
    const delayedPromise = new Promise((resolve) => {
      setTimeout(() => resolve('Delayed Success'), 100);
    });
    
    return expect(delayedPromise).resolves.toBe('Delayed Success');
  });

  test('Promise inside setTimeout runs asynchronously', (done) => {
    let syncFlag = false;

    setTimeout(() => {
      const myPromise = Promise.resolve('Async Result');
      
      myPromise.then((result) => {
        expect(result).toBe('Async Result');
        expect(syncFlag).toBe(true); // Should run after synchronous code
        done();
      });
    }, 0);

    syncFlag = true; // Synchronous part executed before timeout
  });

  test('Promise `then` chain should execute asynchronously', (done) => {
    const results: unknown[] = [];
    
    const myPromise = Promise.resolve('First');
    
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

  test('catch() handles rejected promises', () => {
    const promise = Promise.reject(new Error('Failed'));

    return promise.catch(error => {
      expect(error?.message).toBe('Failed');
    });
  });

  test('finally() runs regardless of promise resolution', () => {
    const mockFinally = jest.fn();

    const resolvedPromise = Promise.resolve('Done');
    const rejectedPromise = Promise.reject(new Error('Failed'));

    const resolvedTest = resolvedPromise.finally(() => mockFinally()).then(data => expect(data).toBe('Done'));
    const rejectedTest = rejectedPromise.finally(() => mockFinally()).catch(error => expect(error?.message).toBe('Failed'));

    return Promise.all([resolvedTest, rejectedTest]).then(() => {
      expect(mockFinally).toHaveBeenCalledTimes(2);
    });
  });

  test('all() resolves when all promises resolve', () => {
    const promises = [
      Promise.resolve('One'),
      Promise.resolve('Two'),
      Promise.resolve('Three')
    ];

    return Promise.all(promises).then(results => {
      expect(results).toEqual(['One', 'Two', 'Three']);
    });
  });

  test('all() rejects if any promise rejects', () => {
    const promises = [
      Promise.resolve('One'),
      Promise.reject(new Error('Failed')),
      Promise.resolve('Three')
    ];

    return Promise.all(promises).catch(error => {
      expect(error?.message).toBe('Failed');
    });
  });

  test('any() resolves when at least one promise resolves', () => {
    const promises = [
      Promise.reject(new Error('Failed')),
      Promise.resolve('Success'),
      Promise.reject(new Error('Another Failure'))
    ];

    return Promise.any(promises).then(result => {
      expect(result).toBe('Success');
    });
  });

  test('any() rejects if all promises reject', () => {
    const promises = [
      Promise.reject(new Error('Failed 1')),
      Promise.reject(new Error('Failed 2')),
      Promise.reject(new Error('Failed 3'))
    ];

    return Promise.any(promises).catch(error => {
      expect(error?.message).toBe('All promises were rejected');
    });
  });

  test('race() resolves or rejects based on the first promise', () => {
    const promises = [
      Promise.reject(new Error('Failed')),
      Promise.resolve('Winner'),
      Promise.resolve('Loser')
    ];

    return Promise.race(promises).catch(error => {
      expect(error?.message).toBe('Failed');
    });
  });

  test('allSettled() resolves with the results of all promises', () => {
    const promises = [
      Promise.resolve('One'),
      Promise.reject(new Error('Failed')),
      Promise.resolve('Three')
    ];

    return Promise.allSettled(promises).then(results => {
      expect(results).toEqual([
        { status: 'fulfilled', value: 'One' },
        { status: 'rejected', reason: new Error('Failed') },
        { status: 'fulfilled', value: 'Three' }
      ]);
    });
  });

  test('withResolvers() creates a promise with resolvers', () => {
    const { promise, resolve, reject } = Promise.withResolvers();

    // Resolve and reject using the resolvers returned
    resolve('Resolved Value');
    reject(new Error('Rejected Error'));

    const resolvePromise = new Promise((res) => {
      setTimeout(() => res('Resolved Value'), 100);
    });

    const rejectPromise = new Promise((_, rej) => {
      setTimeout(() => rej(new Error('Rejected Error')), 100);
    });

    return Promise.allSettled([promise, resolvePromise, rejectPromise]).then(results => {
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
    const { promise, resolve } = Promise.withResolvers();

    // Resolve the promise after a short delay
    resolve('Resolved Value');

    return promise.then(result => {
      expect(result).toBe('Resolved Value');
    });
  });

  test('withResolvers() promise rejects correctly', () => {
    const { promise, reject } = Promise.withResolvers();

    // Reject the promise after a short delay
    reject(new Error('Rejected Value'));

    return promise.catch(error => {
      expect(error).toEqual(new Error('Rejected Value'));
    });
  });

  test('try() resolves when function succeeds', () => {
    const fn = () => 'Success';

    return Promise.try(fn).then(result => {
      expect(result).toBe('Success');
    });
  });

  test('try() rejects when function throws an error', () => {
    const fn = () => { throw new Error('Failed'); };

    return Promise.try(fn).catch(error => {
      expect(error).toEqual(expect.any(Error));
      expect(error?.message).toBe('Failed');
    });
  });

  test('try() handles functions that return promises', () => {
    const promiseFn = () => Promise.resolve('Promise Success');

    return Promise.try(promiseFn).then(result => {
      expect(result).toBe('Promise Success');
    });
  });
});
