import { NodeType } from './ast.js';
import { S } from './state.js';

/*
  Converts visually-structured AST into a semantic Expression Tree for evaluation.
  e.g., [ NUM(2), OP(+), NUM(3) ] -> Binary(+, 2, 3)
  e.g., [ NUM(2), PAREN(NUM(3)) ] -> Binary(×, 2, 3) // Implicit multiplication
*/

const OpPrec = {
  '+': 10, '−': 10,
  '×': 20, '÷': 20, 'mod': 20,
  'implicit_mul': 25, 
  '^': 30, '!': 35,
  'P': 15, 'C': 15,
  'AND': 5, 'OR': 5, 'XOR': 5, 'XNOR': 5,
  'SHL': 15, 'SHR': 15
};

// Determines if parsing a token stops left-associativity. Usually power is right-associative.
const isRightAssoc = (op) => op === '^';

export const parseAST = (astNode) => {
  if (!astNode) return { type: 'number', value: 0 };
  
  if (astNode.type === NodeType.ROOT || astNode.type === NodeType.GROUP) {
    return parseGroup(astNode.children);
  } else if (astNode.type === NodeType.PAREN) {
    return parseGroup(astNode.inner.children);
  } else if (astNode.type === NodeType.FRAC) {
    return {
      type: 'binary', op: '÷',
      left: parseAST(astNode.num),
      right: parseAST(astNode.den)
    };
  } else if (astNode.type === NodeType.POW) {
    return {
      type: 'binary', op: '^',
      left: parseAST(astNode.base),
      right: parseAST(astNode.exp)
    };
  } else if (astNode.type === NodeType.SQRT) {
    return { type: 'function', name: 'sqrt', args: [parseAST(astNode.inner)] };
  } else if (astNode.type === NodeType.CBRT) {
    return { type: 'function', name: 'cbrt', args: [parseAST(astNode.inner)] };
  } else if (astNode.type === NodeType.ABS) {
    return { type: 'function', name: 'abs', args: [parseAST(astNode.inner)] };
  } else if (astNode.type === NodeType.FUNC_BLOCK) {
    return { type: 'function', name: astNode.name, args: [parseAST(astNode.inner)] };
  } else if (astNode.type === NodeType.NUM) {
    return { type: 'number', value: parseFloat(astNode.val) };
  } else if (astNode.type === NodeType.CONST) {
    return { type: 'constant', name: astNode.val };
  } else if (astNode.type === NodeType.VAR) {
    return { type: 'variable', name: astNode.val };
  }
  return { type: 'number', value: 0 };
};

const parseGroup = (children) => {
  if (!children || children.length === 0) return { type: 'number', value: 0 };
  
  let i = 0;
  
  // Combine adjacent numerals/decimals. Currently already separated as NUM tokens by main.js logic?
  // Actually, main.js inserts numbers as individual SYM/TEXT or NUM tokens. We should join consecutive NUMs.
  let tokens = [];
  for (let c of children) {
    if (c.type === NodeType.NUM) {
      if (tokens.length > 0 && tokens[tokens.length-1].type === NodeType.NUM) {
        tokens[tokens.length-1].val += c.val;
      } else {
        tokens.push({ ...c }); // duplicate
      }
    } else {
      tokens.push(c);
    }
  }

  // Pratt Parser implementation
  const advance = () => tokens[i++];
  const peek = () => tokens[i];
  
  const parsePrefix = () => {
    let t = advance();
    if (!t) return null;
    
    if (t.type === NodeType.OP && (t.val === '+' || t.val === '−')) {
      let right = parseExpression(40); // high precedence for unary
      return { type: 'unary', op: t.val, right };
    }
    
    // Parse it as a standard node
    return parseAST(t);
  };
  
  const parseExpression = (precedence = 0) => {
    let left = parsePrefix();
    if (!left) return { type: 'number', value: 0 };
    
    while (i < tokens.length) {
      let t = peek();
      
      // Implicit multiplication logic
      // If the next token is a NUM, CONST, VAR, PAREN, SQRT, etc and we're not expecting an operator
      let isNextOperable = t.type !== NodeType.OP || t.val === '+' || t.val === '−'; // unary sign starts a block
      if (t.type !== NodeType.OP) {
        if (OpPrec['implicit_mul'] > precedence) {
           // It's implicit mul
           left = { type: 'binary', op: '×', left, right: parseExpression(OpPrec['implicit_mul']) };
           continue;
        } else {
           break;
        }
      }
      
      // It's an operator
      let op = t.val;
      let p = OpPrec[op] || 0;
      if (p <= precedence) break;
      
      advance(); // consume op
      
      if (op === '!') {
         left = { type: 'unary_postfix', op, left };
         continue;
      }
      
      let nextPrec = isRightAssoc(op) ? p - 1 : p;
      left = { type: 'binary', op, left, right: parseExpression(nextPrec) };
    }
    
    return left;
  };

  return parseExpression(0);
};
