import { S } from './state.js';

export const KEYS_TOP_L = [
  ['SHIFT','','','btn-sys','SYS'], ['ALPHA','','','btn-sys','SYS'], 
  ['CALC','SOLVE','=','btn-sys','SYS'], ['∫dx','d/dx',':','btn-op','MATH']
];

export const KEYS_TOP_R = [
  ['OPTN','','','btn-sys','SYS'], ['MENU','SETUP','','btn-sys','SYS'],
  ['x⁻¹','x!','','btn-op','MATH'], ['log_','Σ','Π','btn-op','MATH']
];

export const KEYS_SCI = [
  ['ab/c','d/c','÷R','btn-op','MATH'], ['√','∛','mod','btn-op','MATH'], ['x²','x³','(■)','btn-op','MATH'], ['^','ˣ√','','btn-op','MATH'], ['log(','10ˣ','','btn-op','MATH'], ['ln(','eˣ','T','btn-op','MATH'],
  ['(-)','∠','A','btn-op','MATH'], ['°\'"','FACT','B','btn-op','MATH'], ['hyp','Abs','C','btn-op','MATH'], ['sin(','sin⁻¹','D','btn-op','MATH'], ['cos(','cos⁻¹','E','btn-op','MATH'], ['tan(','tan⁻¹','F','btn-op','MATH'],
  ['RCL','STO','CLRV','btn-sys','SYS'], ['ENG','i','cot','btn-op','MATH'], ['(','%','cot⁻¹','btn-op','MATH'], [')',',','X','btn-op','MATH'], ['S⇔D','a ⇔ d','Y','btn-sys','SYS'], ['M+','M−','M','btn-sys','SYS']
];

export const KEYS_NUM = [
  ['7','CONST','','btn-num','NUM'], ['8','CONV','','btn-num','NUM'], ['9','Limit','∞','btn-num','NUM'], ['DEL','INS','','btn-ac','SYS'], ['AC','','','btn-ac','SYS'],
  ['4','MATRIX','[...]','btn-num','NUM'], ['5','VECTOR','','btn-num','NUM'], ['6','','','btn-num','NUM'], ['×','nPr','GCD','btn-op','MATH'], ['÷','nCr','LCM','btn-op','MATH'],
  ['1','','','btn-num','NUM'], ['2','CMPLX','','btn-num','NUM'], ['3','BASE','','btn-num','NUM'], ['+','Pol','Ceil','btn-op','MATH'], ['−','Rec','Floor','btn-op','MATH'],
  ['0','','','btn-num','NUM'], ['.','Ran#','RanInt','btn-num','NUM'], ['×10ˣ','pi','e','btn-num','NUM'], ['Ans','PreAns','','btn-num','NUM'], ['=','','','btn-sys','SYS']
];

export const getKeyHtml = (k) => {
    let [p, s, a, cls, cat] = k;
    let labelS = s, labelA = a, keyP = p, dP = p;
    let isDisabled = false;
    
    if (S.mode === 4) {
       if(p === '(-)') { keyP = 'A'; dP = 'A'; cls = 'btn-num'; }
       if(p === '°\'"') { keyP = 'B'; dP = 'B'; cls = 'btn-num'; }
       if(p === 'hyp') { keyP = 'C'; dP = 'C'; cls = 'btn-num'; }
       if(p === 'sin(') { keyP = 'D'; dP = 'D'; cls = 'btn-num'; }
       if(p === 'cos(') { keyP = 'E'; dP = 'E'; cls = 'btn-num'; }
       if(p === 'tan(') { keyP = 'F'; dP = 'F'; cls = 'btn-num'; }
       
       if(p === 'x⁻¹') dP = keyP = 'AND';
       if(p === '√') dP = keyP = 'OR';
       if(p === 'x²') dP = keyP = 'XOR';
       if(p === '^') dP = keyP = 'XNOR';
       if(p === 'log(') dP = keyP = 'NOT(';
       if(p === 'ln(') dP = keyP = 'NEG(';
       if(p === 'x³') dP = keyP = 'SHL'; // Note x³ is a shift label now, but mapped appropriately if requested
       if(p === '∛') dP = keyP = 'SHR';
       
       if(S.base === 'DEC' && 'ABCDEF'.includes(keyP)) isDisabled = true;
       if(S.base === 'OCT' && '89ABCDEF'.includes(keyP)) isDisabled = true;
       if(S.base === 'BIN' && '23456789ABCDEF'.includes(keyP)) isDisabled = true;
       
       if('ABCDEF'.includes(keyP) && !isDisabled) {
          cls += ' key-hex';
       }
       if(['sin⁻¹','cos⁻¹','tan⁻¹','A','B','C','D','E','F'].includes(s) || ['A','B','C','D','E','F'].includes(a)) {
          labelS = ''; labelA = '';
       }
    }

    let disp = dP.replace('^','x^').replace('sqrt','√');
    if (p === 'SETUP') disp = '⚙';
    if (p === 'DEL') disp = '⌫';
    if (p === 'OPTN') disp = '';
    if (p === 'log_') disp = 'log<sub style="font-size:0.6em">■</sub>□';
    
    return `
      <div class="key-wrapper">
        <div class="key-labels"><span class="lbl-s">${labelS}</span><span class="lbl-a">${labelA}</span></div>
        <button class="btn ${cls}" data-p="${keyP}" data-s="${s}" data-a="${a}" data-cat="${cat}" onclick="pressBtn(this)" style="opacity: ${isDisabled ? '0.2' : '1'}; pointer-events: ${isDisabled ? 'none' : 'auto'}">${disp}</button>
      </div>`;
}

export const renderKeypad = () => {
  let topHtml = "";
  topHtml += getKeyHtml(KEYS_TOP_L[0]);
  topHtml += getKeyHtml(KEYS_TOP_L[1]);
  topHtml += `
      <div class="dpad-container">
         <button class="dpad-btn dpad-up" onclick="pressBtn(this)" data-p="▲">▲</button>
         <button class="dpad-btn dpad-down" onclick="pressBtn(this)" data-p="▼">▼</button>
         <button class="dpad-btn dpad-left" onclick="pressBtn(this)" data-p="◄">◄</button>
         <button class="dpad-btn dpad-right" onclick="pressBtn(this)" data-p="►">►</button>
         <div class="dpad-center"></div>
      </div>
  `;
  topHtml += getKeyHtml(KEYS_TOP_R[0]);
  topHtml += getKeyHtml(KEYS_TOP_R[1]);
  
  topHtml += getKeyHtml(KEYS_TOP_L[2]);
  topHtml += getKeyHtml(KEYS_TOP_L[3]);
  topHtml += getKeyHtml(KEYS_TOP_R[2]);
  topHtml += getKeyHtml(KEYS_TOP_R[3]);

  let sciHtml = KEYS_SCI.map(getKeyHtml).join('');
  let numHtml = KEYS_NUM.map(getKeyHtml).join('');

  document.getElementById('keypad').innerHTML = `
    <div class="keypad-zone-top">${topHtml}</div>
    <div class="keypad-zone-sci">${sciHtml}</div>
    <div class="keypad-zone-num">${numHtml}</div>
  `;
};
