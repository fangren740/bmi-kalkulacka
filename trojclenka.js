(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const form = $('proportionForm');
  if (!form) return;

  const state = { relation: 'direct', uiMode: 'basic', unknown: 'x' };
  const positions = ['a','b','c','x'];
  const fields = { a:$('valueA'), b:$('valueB'), c:$('valueC'), x:$('valueX') };
  const presets = {
    shopping:{relation:'direct',a:3,b:120,c:5,x:200,leftLabel:'Množství',leftUnit:'kusů',rightLabel:'Cena',rightUnit:'Kč'},
    recipe:{relation:'direct',a:4,b:300,c:10,x:750,leftLabel:'Porce',leftUnit:'porcí',rightLabel:'Mouka',rightUnit:'g'},
    workers:{relation:'inverse',a:6,b:10,c:10,x:6,leftLabel:'Pracovníci',leftUnit:'lidí',rightLabel:'Čas',rightUnit:'hodin'},
    speed:{relation:'inverse',a:80,b:3,c:120,x:2,leftLabel:'Rychlost',leftUnit:'km/h',rightLabel:'Čas',rightUnit:'hodin'},
    map:{relation:'direct',a:2,b:5,c:7,x:17.5,leftLabel:'Mapa',leftUnit:'cm',rightLabel:'Skutečnost',rightUnit:'km'}
  };

  const parseNumber = (value) => {
    const clean = String(value ?? '').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,'');
    const n = Number(clean);
    return Number.isFinite(n) ? n : NaN;
  };
  const digits = () => Number($('displayDigits').value || 4);
  const fmt = (n, max = digits()) => new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:max}).format(Number.isFinite(n)?n:0);
  const getMeta = () => ({
    leftLabel: $('leftLabel').value.trim() || 'První veličina', leftUnit: $('leftUnit').value.trim(),
    rightLabel: $('rightLabel').value.trim() || 'Druhá veličina', rightUnit: $('rightUnit').value.trim()
  });
  const unitFor = (p,m) => (p==='a'||p==='c') ? m.leftUnit : m.rightUnit;
  const labelFor = (p,m) => (p==='a'||p==='c') ? m.leftLabel : m.rightLabel;
  const rowName = (p) => (p==='a'||p==='b') ? 'známé situaci' : 'nové situaci';
  const values = () => Object.fromEntries(positions.map(p => [p, parseNumber(fields[p].value)]));

  function solve(v, relation=state.relation, unknown=state.unknown){
    if(relation==='direct'){
      if(unknown==='x') return v.b*v.c/v.a;
      if(unknown==='a') return v.b*v.c/v.x;
      if(unknown==='b') return v.a*v.x/v.c;
      return v.a*v.x/v.b;
    }
    if(unknown==='x') return v.a*v.b/v.c;
    if(unknown==='a') return v.c*v.x/v.b;
    if(unknown==='b') return v.c*v.x/v.a;
    return v.a*v.b/v.x;
  }
  function formula(relation=state.relation, unknown=state.unknown){
    const direct={x:'x = b × c ÷ a',a:'a = b × c ÷ x',b:'b = a × x ÷ c',c:'c = a × x ÷ b'};
    const inverse={x:'x = a × b ÷ c',a:'a = c × x ÷ b',b:'b = c × x ÷ a',c:'c = a × b ÷ x'};
    return relation==='direct'?direct[unknown]:inverse[unknown];
  }
  function equation(v,result){
    const map={a:fmt(v.a),b:fmt(v.b),c:fmt(v.c),x:fmt(v.x)};
    const direct={x:`${map.b} × ${map.c} ÷ ${map.a}`,a:`${map.b} × ${map.c} ÷ ${map.x}`,b:`${map.a} × ${map.x} ÷ ${map.c}`,c:`${map.a} × ${map.x} ÷ ${map.b}`};
    const inverse={x:`${map.a} × ${map.b} ÷ ${map.c}`,a:`${map.c} × ${map.x} ÷ ${map.b}`,b:`${map.c} × ${map.x} ÷ ${map.a}`,c:`${map.a} × ${map.b} ÷ ${map.x}`};
    return `${state.relation==='direct'?direct[state.unknown]:inverse[state.unknown]} = ${fmt(result)}`;
  }
  function applyRounding(n){
    const mode=$('roundingMode').value;
    if(mode==='2') return Math.round(n*100)/100;
    if(mode==='whole') return Math.round(n);
    if(mode==='up') return Math.ceil(n);
    if(mode==='down') return Math.floor(n);
    return n;
  }
  function clearErrors(){positions.forEach(p=>{fields[p].closest('.matrix-input').classList.remove('has-error');$('error'+p.toUpperCase()).textContent='';});}
  function validate(v){
    clearErrors(); let ok=true;
    positions.forEach(p=>{
      if(p===state.unknown) return;
      if(!Number.isFinite(v[p]) || v[p]<=0){
        fields[p].closest('.matrix-input').classList.add('has-error');
        $('error'+p.toUpperCase()).textContent='Zadejte číslo větší než 0.'; ok=false;
      }
    });
    return ok;
  }
  function syncUnknown(){
    positions.forEach(p=>{
      const unknown=p===state.unknown;
      fields[p].readOnly=unknown;
      fields[p].closest('.matrix-input').classList.toggle('unknown',unknown);
      if(unknown) fields[p].value='?';
    });
    document.querySelectorAll('[data-unknown]').forEach(btn=>{
      const active=btn.dataset.unknown===state.unknown; btn.classList.toggle('is-active',active); btn.setAttribute('aria-pressed',String(active));
    });
  }
  function syncLabels(){
    const m=getMeta();
    $('leftColumnLabel').textContent=m.leftLabel; $('rightColumnLabel').textContent=m.rightLabel;
    $('unitA').textContent=m.leftUnit; $('unitC').textContent=m.leftUnit; $('unitB').textContent=m.rightUnit; $('unitX').textContent=m.rightUnit;
  }
  function sentence(v,result){
    const m=getMeta(), shown={...v,[state.unknown]:result};
    return `${fmt(shown.a)} ${m.leftUnit} odpovídá ${fmt(shown.b)} ${m.rightUnit}; ${fmt(shown.c)} ${m.leftUnit} odpovídá ${fmt(shown.x)} ${m.rightUnit}.`;
  }
  function renderInvalid(){
    $('resultValue').textContent='—'; $('resultUnit').textContent=''; $('resultSentence').textContent='Opravte označené hodnoty. Všechna tři známá čísla musí být větší než nula.';
    ['scaleFactor','unitRatio','exactValue','alternativeValue'].forEach(id=>$(id).textContent='—');
    $('decisionKicker').textContent='Výpočet čeká na platné vstupy'; $('decisionTitle').textContent='Zkontrolujte označená pole.'; $('decisionText').textContent='Desetinná čárka i tečka fungují.';
  }
  function render({scroll=false}={}){
    syncLabels(); const v=values(); if(!validate(v)){renderInvalid();return false;}
    const exact=solve(v); if(!Number.isFinite(exact)){renderInvalid();return false;}
    v[state.unknown]=exact; const shown=applyRounding(exact); const m=getMeta();
    const alt=solve(v,state.relation==='direct'?'inverse':'direct',state.unknown);
    const factor=v.c/v.a; const directRatio=v.b/v.a; const resultUnit=unitFor(state.unknown,m);
    fields[state.unknown].value=fmt(shown);
    $('resultTitle').textContent=`${labelFor(state.unknown,m)} v ${rowName(state.unknown)}`;
    $('resultBadge').textContent=state.relation==='direct'?'Přímá úměra':'Nepřímá úměra';
    $('answerLabel').textContent=`Hledaná hodnota: ${labelFor(state.unknown,m).toLowerCase()}`;
    $('resultValue').textContent=fmt(shown); $('resultUnit').textContent=resultUnit;
    $('resultSentence').textContent=sentence(v,shown);
    $('equationText').textContent=equation(v,exact); $('formulaText').textContent=formula();
    $('scaleFactor').textContent=`${fmt(factor)}×`; $('scaleText').textContent=`z ${fmt(v.a)} na ${fmt(v.c)} ${m.leftUnit}`;
    $('unitRatio').textContent=state.relation==='direct'?`${fmt(directRatio)} ${m.rightUnit}/${m.leftUnit}`:`${fmt(v.a*v.b)} ${m.leftUnit}·${m.rightUnit}`;
    $('ratioText').textContent=state.relation==='direct'?'stejný v obou řádcích':'součin je stejný v obou řádcích';
    $('exactValue').textContent=`${fmt(exact,6)} ${resultUnit}`;
    $('alternativeValue').textContent=`${fmt(alt)} ${resultUnit}`; $('alternativeText').textContent=state.relation==='direct'?'výsledek při nepřímé úměře':'výsledek při přímé úměře';
    if(state.relation==='direct'){
      $('decisionKicker').textContent='Volba vztahu dává smysl, pokud hodnoty rostou společně';
      $('decisionTitle').textContent='Obě veličiny se mění stejným směrem.';
      $('decisionText').textContent=`První veličina se změnila ${fmt(factor)}krát. Druhá se při přímé úměře mění stejným poměrem.`;
      $('checkTitle').textContent='Podíly musí zůstat stejné';
      $('checkEquation').textContent=`${fmt(v.b)} ÷ ${fmt(v.a)} = ${fmt(v.x)} ÷ ${fmt(v.c)} = ${fmt(directRatio)}`;
    } else {
      $('decisionKicker').textContent='Volba vztahu dává smysl, pokud jedna hodnota roste a druhá klesá';
      $('decisionTitle').textContent='Veličiny se mění opačným směrem.';
      $('decisionText').textContent=`První veličina se změnila ${fmt(factor)}krát. Druhá se při nepřímé úměře mění převráceným poměrem.`;
      $('checkTitle').textContent='Součiny musí zůstat stejné';
      $('checkEquation').textContent=`${fmt(v.a)} × ${fmt(v.b)} = ${fmt(v.c)} × ${fmt(v.x)} = ${fmt(v.a*v.b)}`;
    }
    $('nextStepText').textContent='Před použitím výsledku ověřte stejné jednotky a to, že vztah nemá pevný poplatek, slevové pásmo nebo kapacitní limit.';
    $('liveSentence').textContent=sentence(v,shown);
    if(scroll && matchMedia('(max-width:820px)').matches) $('vysledek').scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }
  function setRelation(relation){
    state.relation=relation;
    document.querySelectorAll('[data-relation]').forEach(btn=>{const active=btn.dataset.relation===relation;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    const tipText=$('relationTip').querySelector('p');
    tipText.textContent=relation==='direct'?'Když zvýšíte první hodnotu, má se zvýšit i odpovídající hodnota? Zvolte přímou úměru.':'Když zvýšíte první hodnotu, má se odpovídající hodnota zmenšit? Zvolte nepřímou úměru.';
    render();
  }
  function setUiMode(mode){
    state.uiMode=mode; $('advancedPanel').hidden=mode!=='advanced';
    if(mode==='basic' && state.unknown!=='x'){state.unknown='x';syncUnknown();}
    document.querySelectorAll('[data-ui-mode]').forEach(btn=>{const active=btn.dataset.uiMode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    render();
  }
  function setUnknown(p){
    if(state.uiMode!=='advanced') return;
    const previous=state.unknown; const oldValue=fields[previous].value;
    state.unknown=p;
    if(previous!==p && oldValue==='?') fields[previous].value='1';
    syncUnknown(); render();
  }
  function setPreset(name){
    const p=presets[name]; if(!p) return;
    $('leftLabel').value=p.leftLabel; $('leftUnit').value=p.leftUnit; $('rightLabel').value=p.rightLabel; $('rightUnit').value=p.rightUnit;
    positions.forEach(pos=>fields[pos].value=p[pos]);
    state.unknown='x'; syncUnknown(); setRelation(p.relation);
    document.querySelectorAll('[data-preset]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.preset===name));
  }
  async function copyResult(){
    const text=`${$('resultTitle').textContent}: ${$('resultValue').textContent} ${$('resultUnit').textContent}. ${$('equationText').textContent}. Kontrola: ${$('checkEquation').textContent}`;
    try{await navigator.clipboard.writeText(text);$('copyResult').textContent='Zkopírováno';setTimeout(()=>$('copyResult').textContent='Kopírovat výsledek a postup',1500);}catch{$('copyResult').textContent='Kopírování selhalo';}
  }
  function bind(){
    form.addEventListener('submit',e=>{e.preventDefault();render({scroll:true});});
    document.querySelectorAll('[data-relation]').forEach(btn=>btn.addEventListener('click',()=>setRelation(btn.dataset.relation)));
    document.querySelectorAll('[data-ui-mode]').forEach(btn=>btn.addEventListener('click',()=>setUiMode(btn.dataset.uiMode)));
    document.querySelectorAll('[data-unknown]').forEach(btn=>btn.addEventListener('click',()=>setUnknown(btn.dataset.unknown)));
    document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>setPreset(btn.dataset.preset)));
    positions.forEach(p=>fields[p].addEventListener('input',render));
    ['leftLabel','leftUnit','rightLabel','rightUnit','roundingMode','displayDigits'].forEach(id=>{$(id).addEventListener('input',render);$(id).addEventListener('change',render);});
    $('resetButton').addEventListener('click',()=>{setUiMode('basic');$('roundingMode').value='auto';$('displayDigits').value='4';setPreset('shopping');});
    $('copyResult').addEventListener('click',copyResult);
  }
  function init(){state.unknown='x';syncUnknown();bind();setPreset('shopping');}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();