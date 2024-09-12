import './styles/style.css';
// import MyPromise from './ActualPromise';
// import MyPromise from 'promise-polyfill';
import MyPromise from './MyPromise';

const p = new MyPromise((resolve, reject) => {
  console.log("hello");
  resolve('He he he');
});
console.log("hello 2")

p
  // .then(() => {
  //   throw new Error(':(');
  // })
  .then((data) => {
    console.log('again', data);
    return data;
  }, (err) => {
    console.log('then', err)
  })
  .finally(() => {
    throw new Error('Test Error')
  })
  .then((data) => console.log(`again again ${data}`))
  .catch((err) => console.log(err))
  .finally(() => {
    console.log('finally 2');
  });

p.then((data) => console.log(`hello 2 ${data}`));

setTimeout(() => {
  p.then((data) => {
    console.log('timeout promise', data)
  });
  console.log('timeout')
}, 100)

document.querySelector('#app').innerHTML = `
  Check browser console
`;
