import { S } from './state.js';
import { parseAST } from './parser.js';

const toR = a => (S.angle==='D'?a*Math.PI/180 : S.angle==='G'?a*Math.PI/200 : a);
const frR = a => (S.angle==='D'?a*180/Math.PI : S.angle==='G'?a*200/Math.PI : a);
const isC = v => typeof v==='object';
const cR = v => isC(v)?v.r:v; 
const cI = v => isC(v)?v.i:0;
const mkC = (r,i) => (Math.abs(i)<1e-14 && S.mode!==2) ? r : {r,i};

const C = {
  add: (a,b) => mkC(cR(a)+cR(b), cI(a)+cI(b)),
  sub: (a,b) => mkC(cR(a)-cR(b), cI(a)-cI(b)),
  mul: (a,b) => mkC(cR(a)*cR(b)-cI(a)*cI(b), cR(a)*cI(b)+cI(a)*cR(b)),
  div: (a,b) => { 
    let d = cR(b)*cR(b)+cI(b)*cI(b); 
    if(d===0) throw "Math ERROR"; 
    return mkC((cR(a)*cR(b)+cI(a)*cI(b))/d, (cI(a)*cR(b)-cR(a)*cI(b))/d); 
  },
  pow: (a,b) => {
    if(!isC(a) && !isC(b)) {
      if(a<0 && b%1!==0) throw "Non-Real ERROR";
      return Math.pow(a,b);
    }
    throw "Math ERROR";
  }
};

const factorial = n => {
  if(n<0 || n%1!==0) throw "Math ERROR";
  if(n===0) return 1;
  let res=1; for(let i=1;i<=n;i++) res*=i; return res;
};

const getVar = (name) => {
  if(name === 'Ans') return S.ans;
  if(name === 'PreAns') return S.preAns;
  if(S.mem[name] !== undefined) return S.mem[name];
  throw "Syntax ERROR";
};

export const evalExpr = (expr) => {
  if (!expr) return 0;
  
  if (expr.type === 'number') return expr.value;
  if (expr.type === 'constant') {
    if (expr.name === 'pi') return Math.PI;
    if (expr.name === 'e') return Math.E;
    if (expr.name === 'i') return { r: 0, i: 1 };
  }
  if (expr.type === 'variable') {
    return getVar(expr.name);
  }
  
  if (expr.type === 'unary') {
    let right = evalExpr(expr.right);
    if (expr.op === '+') return right;
    if (expr.op === '−') return C.mul(-1, right);
  }
  
  if (expr.type === 'unary_postfix') {
    let left = evalExpr(expr.left);
    if (expr.op === '!') return factorial(left);
  }
  
  if (expr.type === 'binary') {
    let left = evalExpr(expr.left);
    let right = evalExpr(expr.right);
    
    switch (expr.op) {
      case '+': return C.add(left, right);
      case '−': return C.sub(left, right);
      case '×': return C.mul(left, right);
      case '÷': return C.div(left, right);
      case '^': return C.pow(left, right);
      case 'mod': return C.sub(left, C.mul(Math.floor(cR(left)/cR(right)), right));
      case 'P': 
        if(isC(left)||isC(right)||left<0||right<0||left%1!==0||right%1!==0) throw "Math ERROR";
        return factorial(left) / factorial(left - right);
      case 'C':
        if(isC(left)||isC(right)||left<0||right<0||left%1!==0||right%1!==0) throw "Math ERROR";
        return factorial(left) / (factorial(right) * factorial(left - right));
      
      // Base-N
      case 'AND': return cR(left) & cR(right);
      case 'OR': return cR(left) | cR(right);
      case 'XOR': return cR(left) ^ cR(right);
      case 'XNOR': return ~(cR(left) ^ cR(right));
      case 'SHL': return cR(left) << cR(right);
      case 'SHR': return cR(left) >>> cR(right);
    }
  }
  
  if (expr.type === 'function') {
    let arg = evalExpr(expr.args[0]);
    let v = cR(arg);
    
    if(isC(arg) && S.mode!==2) throw "Non-Real ERROR";
    
    switch (expr.name) {
      case 'sin': return Math.sin(toR(v));
      case 'cos': return Math.cos(toR(v));
      case 'tan': return Math.tan(toR(v));
      case 'asin': return frR(Math.asin(v));
      case 'acos': return frR(Math.acos(v));
      case 'atan': return frR(Math.atan(v));
      case 'sinh': return Math.sinh(v);
      case 'cosh': return Math.cosh(v);
      case 'tanh': return Math.tanh(v);
      case 'log': return Math.log10(v);
      case 'ln': return Math.log(v);
      case 'sqrt': return v < 0 ? Math.sqrt(-v) * {r:0, i:1} : Math.sqrt(v);
      case 'cbrt': return Math.cbrt(v);
      case 'abs': return Math.abs(v);
      case 'ceil': return Math.ceil(v);
      case 'floor': return Math.floor(v);
      case 'int': return Math.trunc(v);
      default: return arg;
    }
  }
  
  return 0;
};

export const evaluateAST = (ast) => {
  const exprTree = parseAST(ast);
  return evalExpr(exprTree);
};

export const toNerdamerString = (expr) => {
  if (!expr) return '0';
  if (expr.type === 'number') return expr.value.toString();
  if (expr.type === 'constant') return expr.name;
  if (expr.type === 'variable') {
    if (['Ans', 'PreAns'].includes(expr.name)) return getVar(expr.name).toString();
    return expr.name; 
  }
  if (expr.type === 'unary') return `(${expr.op === '−' ? '-' : expr.op}${toNerdamerString(expr.right)})`;
  if (expr.type === 'unary_postfix') return `(${toNerdamerString(expr.left)}${expr.op})`;
  if (expr.type === 'binary') {
    let op = expr.op;
    if (op === '×') op = '*';
    if (op === '÷') op = '/';
    if (op === '−') op = '-';
    // mod, P, C are trickier for nerdamer
    return `(${toNerdamerString(expr.left)}${op}${toNerdamerString(expr.right)})`;
  }
  if (expr.type === 'function') {
    return `${expr.name}(${toNerdamerString(expr.args[0])})`;
  }
  return '0';
};
