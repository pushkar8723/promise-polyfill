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

  test('Promise.all resolves with multiple promises', () => {
    const promise1 = Promise.resolve('First');
    const promise2 = Promise.resolve('Second');
    
    return expect(Promise.all([promise1, promise2])).resolves.toEqual(['First', 'Second']);
  });

  test('Promise.all rejects when one promise fails', () => {
    const promise1 = Promise.resolve('First');
    const promise2 = Promise.reject(new Error('Failed'));
    
    return expect(Promise.all([promise1, promise2])).rejects.toThrow('Failed');
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
});
