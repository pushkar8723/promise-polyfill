# promise-polyfill

Created a polyfill for promise.

This is absolutely not required in production but is a great way to learn
how to implement chaining design pattern.

## How to use this

Add following lines to your main file

```JavaScript
import Promise from '@pushkar8723/promise-polyfill';

// To make it available globally
if (typeof window.Promise === 'undefined') {
    window.Promise = Promise;
}

// Use Promise
Promise.resolve('World').then((data) => console.log('Hello', data));
```

## Testing
```
npm i
npm run test
```

## Building
```
npm i
npm run build
```

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/pushkar8723/promise-polyfill)