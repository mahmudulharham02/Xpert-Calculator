export const CONSTANTS = [
  {k:"c", v:299792458, n:"Speed of light"}, {k:"h", v:6.62607015e-34, n:"Planck constant"},
  {k:"G", v:6.6743e-11, n:"Gravitational cst"}, {k:"e", v:1.602176634e-19, n:"Elem charge"},
  {k:"me", v:9.1093837e-31, n:"Electron mass"}, {k:"mp", v:1.67262192e-27, n:"Proton mass"},
  {k:"mn", v:1.6749275e-27, n:"Neutron mass"}, {k:"NA", v:6.02214076e23, n:"Avogadro"},
  {k:"k", v:1.380649e-23, n:"Boltzmann cst"}, {k:"F", v:96485.3321, n:"Faraday cst"},
  {k:"R", v:8.3144626, n:"Gas constant"}, {k:"σ", v:5.6703744e-8, n:"Stefan-Boltzmann"},
  {k:"R∞", v:10973731.568, n:"Rydberg cst"}, {k:"μB", v:9.27401e-24, n:"Bohr magneton"},
  {k:"μN", v:5.0507837e-27, n:"Nuclear magneton"},{k:"a0", v:5.2917721e-11, n:"Bohr radius"},
  {k:"α", v:7.29735256e-3, n:"Fine struct cst"},{k:"re", v:2.8179403e-15, n:"Classical e rad"},
  {k:"γp", v:2.67522187e8, n:"Proton gyromag"}, {k:"λC", v:2.42631023e-12, n:"Compton wave"},
  {k:"μ0", v:1.256637e-6, n:"Magnetic cst"}, {k:"ε0", v:8.8541878e-12, n:"Electric cst"},
  {k:"u", v:1.660539e-27, n:"Atomic mass cst"}, {k:"g", v:9.80665, n:"Standard gravity"},
  {k:"atm", v:101325, n:"Std atmosphere"}
];

export const CONVERSIONS = [
  ["in > cm", x=>x*2.54], ["cm > in", x=>x/2.54], ["ft > m", x=>x*0.3048], ["m > ft", x=>x/0.3048],
  ["yd > m", x=>x*0.9144], ["m > yd", x=>x/0.9144], ["mile > km", x=>x*1.60934], ["km > mile", x=>x/1.60934],
  ["acre > m²", x=>x*4046.86], ["m² > acre", x=>x/4046.86], ["gal(US) > L", x=>x*3.78541], ["L > gal(US)", x=>x/3.78541],
  ["oz > g", x=>x*28.3495], ["g > oz", x=>x/28.3495], ["lb > kg", x=>x*0.453592], ["kg > lb", x=>x/0.453592],
  ["°F > °C", x=>(x-32)*5/9], ["°C > °F", x=>x*9/5+32], ["atm > Pa", x=>x*101325], ["Pa > atm", x=>x/101325],
  ["mmHg > Pa", x=>x*133.322], ["Pa > mmHg", x=>x/133.322], ["hp > kW", x=>x*0.7457], ["kW > hp", x=>x/0.7457],
  ["km/h > m/s", x=>x/3.6], ["m/s > km/h", x=>x*3.6], ["kgf > N", x=>x*9.80665], ["N > kgf", x=>x/9.80665]
];

export const S = {
  mode: 1, // 1:COMP, 2:CMPLX, 3:STAT, 4:BASEN, 5:EQN, 6:MAT, 7:VCT, 8:TABLE
  angle: 'D', // D, R, G
  disp: 'NORM', fix: -1, sci: -1,
  shift: false, alpha: false, aLock: false,
  
  // AST State
  ast: null, // initialized in main.js
  cursorPath: [0],
  
  history: [], hPos: 0,
  mem: {A:0,B:0,C:0,D:0,E:0,F:0,X:0,Y:0,M:0},
  ans: 0, preAns: 0,
  isSto: false, isRcl: false, isIns: false,
  error: null,
  base: 'DEC', // DEC, HEX, BIN, OCT
  ms: {
    t: { st:0, fxText:'', fxToks:[], start:1, end:5, step:1, res:null }, // TABLE
    e: { t:1, st:0, v:[0,0,0,0,0,0], res:null }, // EQN
    s: { type:1, stR:0, stC:0, data:[{x:0,y:0,f:1}], edit:true }, // STAT
    m: { st:'A', d:[2,2], A:[[0,0],[0,0]], B:[[0,0],[0,0]], edit:true, res:null } // MAT
  }
};
