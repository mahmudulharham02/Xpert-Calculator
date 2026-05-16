import { NodeType } from './ast.js';
import { S } from './state.js';

export const renderLatex = (ast, cursorPath) => {
  let tex = '';
  const traverse = (node, path) => {
    if (node.type === NodeType.GROUP || node.type === NodeType.ROOT || node.type === NodeType.PAREN) {
      if (node.type === NodeType.PAREN) tex += '\\left(';
      
      const childrenLen = node.children ? node.children.length : (node.inner ? node.inner.children.length : 0);
      const childArr = node.children || (node.inner ? node.inner.children : []);
      
      for (let i = 0; i <= childrenLen; i++) {
        if (cursorPath.length === path.length + 1 && cursorPath[cursorPath.length - 1] === i) {
          let match = true;
          for (let p=0; p<path.length; p++) if(path[p] !== cursorPath[p]) match = false;
          if (match) tex += '\\htmlClass{cursor}{}';
        }
        
        if (i < childrenLen) {
          traverse(childArr[i], [...path, i]);
        }
      }
      
      if (node.type === NodeType.PAREN) tex += '\\right)';
    } else if (node.type === NodeType.NUM || node.type === NodeType.VAR || node.type === NodeType.SYM) {
      tex += node.val;
    } else if (node.type === NodeType.CONST) {
      tex += node.val === 'pi' ? '\\pi ' : node.val;
    } else if (node.type === NodeType.OP) {
      let v = node.val;
      if(v === '×') tex += '\\times ';
      else if(v === '÷') tex += '\\div ';
      else if(v === '+') tex += '+';
      else if(v === '−') tex += '-';
      else if(v === 'mod') tex += '\\text{mod} ';
      else if(['AND','OR','XOR','XNOR','SHL','SHR'].includes(v)) tex += `\\text{${v}} `;
      else tex += v;
    } else if (node.type === NodeType.FRAC) {
      tex += '\\frac{'; traverse(node.num, [...path, 'num']); tex += '}{'; traverse(node.den, [...path, 'den']); tex += '}';
    } else if (node.type === NodeType.POW) {
      tex += '{'; traverse(node.base, [...path, 'base']); tex += '}^{'; traverse(node.exp, [...path, 'exp']); tex += '}';
    } else if (node.type === NodeType.SQRT) {
      tex += '\\sqrt{'; traverse(node.inner, [...path, 'inner']); tex += '}';
    } else if (node.type === NodeType.CBRT) {
      tex += '\\sqrt[3]{'; traverse(node.inner, [...path, 'inner']); tex += '}';
    } else if (node.type === NodeType.FUNC_BLOCK) {
      tex += `\\operatorname{${node.name}}\\left(`; traverse(node.inner, [...path, 'inner']); tex += '\\right)';
    } else if (node.type === NodeType.ABS) {
      tex += `\\operatorname{abs}\\left(`; traverse(node.inner, [...path, 'inner']); tex += '\\right)';
    }
  };
  traverse(ast, []);
  return tex;
};

export const updateExpressionHTML = (ast, cursorPath, errorElement, element) => {
  let tex = '\\displaystyle ' + renderLatex(ast, cursorPath);
  let html = '';
  if (window.katexLoaded && window.katex) {
    try {
      html = katex.renderToString(tex, { throwOnError: false, strict: false, trust: true });
    } catch(e) { html = tex; }
  } else {
    html = tex.replace(/\\displaystyle /,'');
  }

  element.innerHTML = html || (errorElement ? "" : "0");
  
  // Scroll to cursor smoothly
  const cursorElem = element.querySelector('.cursor');
  if(cursorElem) {
    const rL = element.getBoundingClientRect().left;
    const cL = cursorElem.getBoundingClientRect().left;
    if(cL > rL + element.clientWidth - 20) element.scrollLeft += 50;
    if(cL < rL + 20) element.scrollLeft -= 50;
  }
};
