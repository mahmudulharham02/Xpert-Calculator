import { S, CONSTANTS, CONVERSIONS } from './state.js';
import { createEmptyAST, createNode, NodeType, moveCursorLeft, moveCursorRight, insertNode, deleteNode } from './ast.js';
import { evaluateAST, toNerdamerString } from './evaluator.js';
import { parseAST } from './parser.js';
import { updateExpressionHTML } from './renderer.js';

S.ast = createEmptyAST();

const vibrate = ms => navigator.vibrate && navigator.vibrate(ms);
const $ = id => document.getElementById(id);

export const updateUI = () => {
  $('st-s').className = S.shift ? 'st-active' : '';
  $('st-a').className = (S.alpha||S.aLock) ? 'st-active' : '';
  $('st-m').className = Math.abs(S.mem.M)>1e-15 ? 'st-active' : '';
  $('st-sto').className = S.isSto ? 'st-active' : '';
  $('st-rcl').className = S.isRcl ? 'st-active' : '';
  $('st-deg').className = S.angle==='D' ? 'st-active' : '';
  $('st-rad').className = S.angle==='R' ? 'st-active' : '';
  $('st-gra').className = S.angle==='G' ? 'st-active' : '';
  
  // Mode indicators
  ['comp','cplx','stat','base','eqn','mat','vct','table'].forEach(m => {
    $( `st-${m}`).classList.remove('st-active');
  });
  
  const modes = ['comp','cplx','stat','base','eqn','mat','vct','table'];
  $( `st-${modes[S.mode-1]}` ).classList.add('st-active');
  
  if (S.mode === 4) {
    if ($('base-tabs')) {
      $('base-tabs').classList.add('active');
      ['dec','hex','oct','bin'].forEach(b => $(`tab-${b}`).className = 'base-tab');
      $(`tab-${S.base.toLowerCase()}`).classList.add('active', 'st-active');
    }
  } else {
    if ($('base-tabs')) $('base-tabs').classList.remove('active');
  }
  
  if(S.error) {
    $('result-zone').innerHTML = `<span class="st-err">${S.error}</span>`;
    $('display-glass').classList.add('err-shake');
    setTimeout(()=>$('display-glass').classList.remove('err-shake'),300);
    vibrate(50);
  } else {
    updateExpressionHTML(S.ast, S.cursorPath, S.error, $('expression-zone'));
  }
};
window.updateUI = updateUI;

export const setResult = (val, exactTex = null) => {
  S.error = null;
  const rz = $('result-zone');
  rz.classList.remove('has-result');
  void rz.offsetWidth; // trigger reflow
  rz.classList.add('has-result');
  
  let html = '';
  if (exactTex) {
     try {
       let texHtml = window.katex ? window.katex.renderToString('\\displaystyle ' + exactTex, {throwOnError:false}) : exactTex;
       html += `<div class="result-exact">${texHtml}</div>`;
     } catch(e) {}
  }
  
  if (typeof val === 'number') {
    S.ans = val;
    S.preAns = S.ans;
    
    let str = val.toPrecision(10).replace(/0+$/,'').replace(/\.$/,'');
    if(Math.abs(val) < 1e-10 && val !== 0) {
      str = val.toExponential(5);
    }
    
    html += `<div class="result-dec">${str}</div>`;
  } else if (typeof val === 'string') {
    html += `<div class="result-dec">${val}</div>`;
  }
  rz.innerHTML = html;
};

window.cycleAngle = () => { S.angle = S.angle==='D'?'R':S.angle==='R'?'G':'D'; updateUI(); };
window.setBase = (b) => { S.base = b; updateUI(); };

const showSysModal = (title, items) => {
  if (items.length === 0) {
    $('sys-modal').classList.remove('active');
    return;
  }
  $('modal-title').innerText = title;
  $('modal-list').innerHTML = items.map((item, idx) => `
    <div class="menu-item" onclick="selectModalItem(${idx})">
      <span class="menu-key">${idx+1}</span>
      <span class="menu-label">${item.label}</span>
    </div>
  `).join('');
  $('sys-modal').classList.add('active');
  window._modalItems = items;
};

window.selectModalItem = (idx) => {
  if (window._modalItems && window._modalItems[idx]) {
    window._modalItems[idx].action();
  }
  $('sys-modal').classList.remove('active');
};

export const handleKey = (group, val) => {
  vibrate(10);
  
  if(S.error && val!=='AC') {
    S.error=null; updateUI();
    return;
  }
  
  if(val==='AC' || val==='ON') {
    S.ast = createEmptyAST(); S.cursorPath=[0]; S.error=null; setResult(0);
    S.shift=false; S.alpha=false; S.isSto=false; S.isRcl = false;
    updateUI(); return;
  }

  if(val==='STO') { S.isSto = true; return; }
  if(val==='RCL') { S.isRcl = true; return; }
  
  if(['A','B','C','D','E','F','X','Y','M'].includes(val)) {
    if (S.isSto) {
       S.mem[val] = S.ans; // evaluateAST(S.ast) maybe? Standard STO sets Ans to Mem
       S.isSto = false;
       S.shift = false;
       S.alpha = false;
       setResult('Ans→'+val);
       S.ast = createEmptyAST(); 
       S.cursorPath=[0];
       updateUI();
       return;
    } else if (S.isRcl) {
       S.isRcl = false;
       S.shift = false;
       S.alpha = false;
       insertNode(S.ast, S.cursorPath, createNode(NodeType.NUM, S.mem[val].toString()));
       updateUI();
       return;
    }
  }

  // Clear states if pressed something else
  if (S.isSto && !['A','B','C','D','E','F','X','Y','M'].includes(val)) S.isSto = false;
  if (S.isRcl && !['A','B','C','D','E','F','X','Y','M'].includes(val)) S.isRcl = false;

  if(val==='DEL') {
    deleteNode(S.ast, S.cursorPath);
  }
  else if(val==='◄') { moveCursorLeft(S.ast, S.cursorPath); }
  else if(val==='►') { moveCursorRight(S.ast, S.cursorPath); }
  else if(val==='▲') {
    if (S.history.length > 0) {
      if (S.hPos > 0) S.hPos--;
      S.ast = JSON.parse(JSON.stringify(S.history[S.hPos]));
      S.cursorPath = [S.ast.children.length];
    }
  }
  else if(val==='▼') {
    if (S.history.length > 0) {
      if (S.hPos < S.history.length - 1) S.hPos++;
      S.ast = JSON.parse(JSON.stringify(S.history[S.hPos]));
      S.cursorPath = [S.ast.children.length];
    }
  }
  else if(val==='=' || val==='CALC') {
    try {
      let res = evaluateAST(S.ast);
      
      let exactTex = null;
      if (window.nerdamer && S.mode === 1) { // COMP mode
        try {
          const exprTree = parseAST(S.ast);
          const str = toNerdamerString(exprTree);
          const solved = window.nerdamer(str);
          if (solved) {
            let t = solved.toTeX();
            if (t && t !== res.toString() && !t.includes('decimal')) {
              exactTex = t;
            }
          }
        } catch(e) {}
      }
      
      setResult(res, exactTex);
      
      // Save to history
      if (S.ast.children.length > 0) {
         S.history.push(JSON.parse(JSON.stringify(S.ast)));
         S.hPos = S.history.length;
      }
      
      S.ast = createEmptyAST(); 
      S.cursorPath=[0];
      // Insert ans snippet?
      insertNode(S.ast, S.cursorPath, createNode(NodeType.VAR, 'Ans'));
    } catch(e) {
      S.error = typeof e ==='string' ? e : "Math ERROR";
    }
  }
  else if(val==='ab/c') {
    insertNode(S.ast, S.cursorPath, createNode(NodeType.FRAC));
    S.cursorPath[S.cursorPath.length-1]--;
    S.cursorPath.push('num'); S.cursorPath.push(0);
  }
  else if(val==='×10ˣ') {
    insertNode(S.ast, S.cursorPath, createNode(NodeType.OP, '×'));
    insertNode(S.ast, S.cursorPath, createNode(NodeType.NUM, '10'));
    insertNode(S.ast, S.cursorPath, createNode(NodeType.POW));
    S.cursorPath[S.cursorPath.length-1]--; // move onto pow
    S.cursorPath.push('exp'); S.cursorPath.push(0);
  }
  else if(val==='(-)') {
    insertNode(S.ast, S.cursorPath, createNode(NodeType.OP, '−'));
  }
  else if(val==='^' || val==='x²' || val==='x³' || val==='x⁻¹' || val==='10ˣ' || val==='eˣ') {
    let powNode = createNode(NodeType.POW);
    
    if (val==='10ˣ') {
      powNode.base.children.push(createNode(NodeType.NUM, '10'));
    } else if (val==='eˣ') {
      powNode.base.children.push(createNode(NodeType.CONST, 'e'));
    } else {
      let group = S.ast;
      const tPath = S.cursorPath;
      for (let i = 0; i < tPath.length - 1; i++) {
        group = typeof tPath[i] === 'number' ? group.children[tPath[i]] : group[tPath[i]];
      }
      const idx = tPath[tPath.length - 1];
      
      if (idx > 0) {
        let prev = group.children[idx - 1];
        if ([NodeType.NUM, NodeType.CONST, NodeType.VAR, NodeType.PAREN, NodeType.FUNC_BLOCK, NodeType.ABS].includes(prev.type)) {
          // Snatch it into the base!
          group.children.splice(idx - 1, 1);
          powNode.base.children.push(prev);
          S.cursorPath[S.cursorPath.length - 1]--;
        }
      }
    }
    
    insertNode(S.ast, S.cursorPath, powNode);
    S.cursorPath[S.cursorPath.length-1]--;
    S.cursorPath.push('exp'); S.cursorPath.push(0);
    
    if (val==='x²') { insertNode(S.ast, S.cursorPath, createNode(NodeType.NUM, '2')); moveCursorRight(S.ast, S.cursorPath); }
    if (val==='x³') { insertNode(S.ast, S.cursorPath, createNode(NodeType.NUM, '3')); moveCursorRight(S.ast, S.cursorPath); }
    if (val==='x⁻¹') { insertNode(S.ast, S.cursorPath, createNode(NodeType.OP, '−')); insertNode(S.ast, S.cursorPath, createNode(NodeType.NUM, '1')); moveCursorRight(S.ast, S.cursorPath); }
  }
  else if(val==='√') {
    insertNode(S.ast, S.cursorPath, createNode(NodeType.SQRT));
    S.cursorPath[S.cursorPath.length-1]--;
    S.cursorPath.push('inner'); S.cursorPath.push(0);
  }
  else if(val==='∛') {
    insertNode(S.ast, S.cursorPath, createNode(NodeType.CBRT));
    S.cursorPath[S.cursorPath.length-1]--;
    S.cursorPath.push('inner'); S.cursorPath.push(0);
  }
  else if(val==='Abs' || val==='hyp') {
    insertNode(S.ast, S.cursorPath, createNode(NodeType.ABS));
    S.cursorPath[S.cursorPath.length-1]--;
    S.cursorPath.push('inner'); S.cursorPath.push(0);
  }
  else if(val==='sin('||val==='cos('||val==='tan('||val==='log('||val==='ln('||val==='sin⁻¹'||val==='cos⁻¹'||val==='tan⁻¹' || val==='log_' || val==='NOT(' || val==='NEG(') {
    let fn = val === 'log_' ? 'log' : val.replace('(','');
    insertNode(S.ast, S.cursorPath, createNode(NodeType.FUNC_BLOCK, fn));
    S.cursorPath[S.cursorPath.length-1]--;
    S.cursorPath.push('inner'); S.cursorPath.push(0);
  }
  else if(val==='(') {
    insertNode(S.ast, S.cursorPath, createNode(NodeType.PAREN));
    S.cursorPath[S.cursorPath.length-1]--;
    S.cursorPath.push('inner'); S.cursorPath.push(0);
  }
  else if(val===')') {
    if(S.cursorPath.length > 1) {
       S.cursorPath.pop(); S.cursorPath.pop();
       S.cursorPath[S.cursorPath.length-1]++;
    }
  }
  else {
    if (val === 'nPr') val = 'P';
    if (val === 'nCr') val = 'C';
    if (val === 'x!') val = '!';
    
    let type = NodeType.SYM;
    if (val.match(/^[0-9.]$/)) type = NodeType.NUM;
    else if (['+','−','×','÷','mod','AND','OR','XOR','XNOR','SHL','SHR', 'P', 'C', '!'].includes(val)) type = NodeType.OP;
    else if (val === 'Ans' || val === 'PreAns' || val.match(/^[A-FXYM]$/)) type = NodeType.VAR;
    else if (val === 'pi' || val === 'e' || val === 'i') type = NodeType.CONST;
    
    insertNode(S.ast, S.cursorPath, createNode(type, val));
  }
  
  S.shift = false;
  if(!S.aLock) S.alpha = false;
  updateUI();
};

const showMenuModal = () => {
  showSysModal('MODE MENU', [
    { label: '1: Calculate', action: () => { S.mode = 1; updateUI(); } },
    { label: '2: Complex', action: () => { S.mode = 2; updateUI(); } },
    { label: '3: Base-N', action: () => { S.mode = 4; updateUI(); } },
    { label: '4: Equation', action: () => { S.mode = 5; updateUI(); } }
  ]);
};

const showSetupModal = () => {
  showSysModal('SETUP', [
    { label: '1: Deg', action: () => { S.angle = 'D'; updateUI(); } },
    { label: '2: Rad', action: () => { S.angle = 'R'; updateUI(); } },
    { label: '3: Gra', action: () => { S.angle = 'G'; updateUI(); } }
  ]);
};

const showOptnModal = () => {
  showSysModal('OPTIONS', [
    { label: '1: Hyperbolic Func', action: () => { S.shift = true; handleKey('MATH', 'hyp'); } },
    { label: '2: Eng Notation', action: () => { handleKey('MATH', 'ENG'); } }
  ]);
};

window.pressBtn = (btn) => {
  let p = btn.getAttribute('data-p'),
      s = btn.getAttribute('data-s'),
      a = btn.getAttribute('data-a'),
      cat = btn.getAttribute('data-cat');
      
  if(S.shift && s) {
    if(s==='SETUP') { showSetupModal(); S.shift = false; updateUI(); return; }
    if(s==='CONST' || s==='CONV' || s==='STAT' || s==='MAT') return; // disabled temporarily
    handleKey(cat, s);
  } else if(S.alpha && a) {
    handleKey('ALPHA', a);
  } else {
    if(p==='SHIFT') { S.shift = !S.shift; updateUI(); return; }
    if(p==='ALPHA') { S.alpha = !S.alpha; updateUI(); return; }
    if(p==='MENU') { showMenuModal(); return; }
    if(p==='OPTN') { showOptnModal(); return; }
    handleKey(cat, p);
  }
};

import { renderKeypad } from './keypad.js';

window.onload = () => {
    renderKeypad();
    updateUI();
};
