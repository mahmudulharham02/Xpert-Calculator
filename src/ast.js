export const NodeType = {
  GROUP: 'group',
  ROOT: 'root',
  FRAC: 'frac',
  POW: 'pow',
  SQRT: 'sqrt',
  CBRT: 'cbrt',
  ABS: 'abs',
  FUNC_BLOCK: 'func_block', // sin(...), cos(...)
  PAREN: 'paren',
  
  // Terminal Tokens
  NUM: 'num',
  OP: 'op',
  FUNC: 'func',     // pre-built functions if not using FUNC_BLOCK
  CONST: 'const',
  VAR: 'var',
  SYM: 'sym'        // fallback
};

export const createNode = (type, val = '') => {
  if (type === NodeType.GROUP || type === NodeType.ROOT) return { type, children: [] };
  if (type === NodeType.FRAC) return { type, num: { type: NodeType.GROUP, children:[] }, den: { type: NodeType.GROUP, children:[] } };
  if (type === NodeType.POW) return { type, base: { type: NodeType.GROUP, children:[] }, exp: { type: NodeType.GROUP, children:[] } };
  if (type === NodeType.SQRT || type === NodeType.CBRT || type === NodeType.ABS || type === NodeType.PAREN) return { type, inner: { type: NodeType.GROUP, children:[] } };
  if (type === NodeType.FUNC_BLOCK) return { type, name: val, inner: { type: NodeType.GROUP, children:[] } };
  return { type, val };
};

export const createEmptyAST = () => createNode(NodeType.ROOT);

// Returns the list of children at the current cursor path
export const getActiveGroup = (ast, path) => {
  let curr = ast;
  for (let i = 0; i < path.length - 1; i++) {
    const step = path[i];
    if (typeof step === 'number') {
      curr = curr.children[step];
    } else {
      curr = curr[step];
    }
  }
  return curr;
};

export const moveCursorLeft = (ast, path) => {
  const group = getActiveGroup(ast, path);
  const idx = path[path.length - 1];
  
  if (idx > 0) {
    const prev = group.children[idx - 1];
    if ([NodeType.FRAC, NodeType.POW].includes(prev.type)) {
      path[path.length - 1]--;
      path.push(prev.type === NodeType.FRAC ? 'den' : 'exp');
      path.push(getActiveGroup(ast, path).children.length);
    } else if ([NodeType.SQRT, NodeType.CBRT, NodeType.ABS, NodeType.FUNC_BLOCK, NodeType.PAREN].includes(prev.type)) {
      path[path.length - 1]--;
      path.push('inner');
      path.push(getActiveGroup(ast, path).children.length);
    } else {
      path[path.length - 1]--;
    }
  } else if (path.length > 1) {
    const prop = path[path.length - 2];
    path.pop(); // remove idx
    path.pop(); // remove prop
    
    if (prop === 'den') {
      path.push('num');
      path.push(getActiveGroup(ast, path).children.length);
    } else if (prop === 'exp') {
      path.push('base');
      path.push(getActiveGroup(ast, path).children.length);
    } 
  }
};

export const moveCursorRight = (ast, path) => {
  const group = getActiveGroup(ast, path);
  const idx = path[path.length - 1];
  
  if (idx < group.children.length) {
    const next = group.children[idx];
    if ([NodeType.FRAC, NodeType.POW].includes(next.type)) {
      path.push(next.type === NodeType.FRAC ? 'num' : 'base');
      path.push(0);
    } else if ([NodeType.SQRT, NodeType.CBRT, NodeType.ABS, NodeType.FUNC_BLOCK, NodeType.PAREN].includes(next.type)) {
      path.push('inner');
      path.push(0);
    } else {
      path[path.length - 1]++;
    }
  } else if (path.length > 1) {
    const prop = path[path.length - 2];
    path.pop();
    path.pop();
    
    if (prop === 'num') {
      path.push('den');
      path.push(0);
    } else if (prop === 'base') {
      path.push('exp');
      path.push(0);
    } else {
      path[path.length - 1]++;
    }
  }
};

export const insertNode = (ast, path, node) => {
  const group = getActiveGroup(ast, path);
  const idx = path[path.length - 1];
  group.children.splice(idx, 0, node);
  path[path.length - 1]++;
};

export const deleteNode = (ast, path) => {
  const group = getActiveGroup(ast, path);
  const idx = path[path.length - 1];
  if (idx > 0) {
    const nodeToDel = group.children[idx - 1];
    if (nodeToDel.type === NodeType.NUM) {
      if (nodeToDel.val.length > 1) {
        nodeToDel.val = nodeToDel.val.slice(0, -1);
      } else {
        group.children.splice(idx - 1, 1);
        path[path.length - 1]--;
      }
    } else {
      group.children.splice(idx - 1, 1);
      path[path.length - 1]--;
    }
  } else if (path.length > 1) {
    path.pop(); 
    path.pop(); 
  }
};
