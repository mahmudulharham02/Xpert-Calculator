import katex from 'katex';
console.log(katex.renderToString('\\htmlId{my-cursor}{} 2+2', {throwOnError:false, trust: true, strict: false}));
