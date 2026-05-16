const nerdamer = require('nerdamer');
require('nerdamer/Algebra');
require('nerdamer/Calculus');

let expr = nerdamer('57/(888/8) * 25/12 + sqrt(56)');
console.log(expr.text());
console.log(expr.toTeX());
