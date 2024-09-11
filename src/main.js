import './styles/style.css';
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
  Check browser console
`;
