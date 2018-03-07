const { transformTools }   = require('../../index.js');
let value = [
  { a: 'a1', b: '1' },
  { a: 'a2', b: '11' },
];
let result = transformTools.jsonItemsToProp({ items: value, name: 'a', valueName: 'b' });
console.log(result);

//output { a1: '1', a2: '11' }
