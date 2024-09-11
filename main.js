import './style.css';
import javascriptLogo from './javascript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter.js';
import MyPromise from './ActualPromise';

const p = new MyPromise((resolve) => {
  resolve('Hello then');
});

p.then((data) => {
  console.log(data);
  return MyPromise.reject(`${data} reject`);
})
  .then((data) => {
    console.log('again', data);
    return data;
  })
  .finally(() => {
    console.log('finally 1');
  })
  .then((data) => console.log(`again again ${data}`))
  .catch((err) => console.log(err))
  .finally(() => {
    console.log('finally 2');
  });

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector('#counter'));
