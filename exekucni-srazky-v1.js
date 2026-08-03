(function(){'use strict';
const BASE=14101.5, QUARTER=3525.375, LIMIT=31521, PENSION_MIN=1089;
const $=id=>document.getElementById(id); const all=s=>Array.from(document.querySelectorAll(s));
const form=$('executionForm'); if(!form)return;
let mode='basic';
const fmt=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(Math.max(0,n)))+' Kč';
const num=(id,fallback=0)=>{const n=Number($(id).value);return Number.isFinite(n)?Math.max(0,n):fallback};
function core({net,dependants=0,spouse=false,priority=0,ordinary=0,four=false,pension=false,comp=true}){
  const depCount=Math.max(0,Math.floor(dependants))+(spouse?1:0);
  const protectedRaw=BASE+depCount*QUARTER;
  const protectedRounded=Math.ceil(protectedRaw);
  const remainder=Math.max(0,net-protectedRounded);
  const bounded=Math.min(remainder,LIMIT);
  const thirdBase=Math.floor(bounded/3)*3;
  const third=thirdBase/3;
  const rounding=Math.max(0,bounded-thirdBase);
  const fully=Math.max(0,remainder-LIMIT);
  const fourException=!!(four&&pension&&third<PENSION_MIN);
  const forcedTwo=!!(four&&!fourException);
  priority=Math.max(0,priority); ordinary=Math.max(0,ordinary);
  let deduction=0;
  if(forcedTwo){deduction=Math.min(priority+ordinary,2*third+fully)}
  else{
    const fullForPriority=Math.min(fully,priority);
    let pRemain=priority-fullForPriority;
    const secondForPriority=Math.min(third,pRemain);
    pRemain-=secondForPriority;
    const unusedFull=fully-fullForPriority;
    const firstPool=third+unusedFull;
    const firstUse=Math.min(firstPool,pRemain+ordinary);
    deduction=fullForPriority+secondForPriority+firstUse;
  }
  deduction=Math.min(deduction,remainder,priority+ordinary);
  const employer=comp&&deduction>0?Math.min(50,Math.ceil(deduction/3)):0;
  return{net,dependants:depCount,protectedRaw,protectedRounded,remainder,bounded,thirdBase,third,rounding,fully,forcedTwo,fourException,deduction,employer,executor:Math.max(0,deduction-employer),remain:Math.max(0,net-deduction)};
}
function inputs(){
 const net=num('netIncome'); const dependants=Math.floor(num('dependants')); const spouse=mode==='advanced'&&$('spouseEligible').value==='yes';
 if(mode==='basic'){
   const type=(form.querySelector('input[name="debtType"]:checked')||{}).value||'ordinary';
   return{net,dependants,spouse:false,priority:type==='priority'?1e12:0,ordinary:type==='ordinary'||type==='fourplus'?1e12:0,four:type==='fourplus',pension:false,comp:true,type};
 }
 return{net,dependants,spouse,priority:num('priorityDebt'),ordinary:num('ordinaryDebt'),four:$('fourExecutions').checked,pension:$('debtorPension').checked,comp:$('employerComp').checked,type:'advanced'};
}
function scenario(net,dependants,spouse,type){return core({net,dependants,spouse,priority:type==='priority'?1e12:0,ordinary:type!=='priority'?1e12:0,four:type==='fourplus',pension:false,comp:false}).deduction}
function update(){
 const v=inputs(); const r=core(v); const err=$('formError');
 if(v.net<=0){err.hidden=false;err.textContent='Zadejte kladnou čistou měsíční mzdu.'}else{err.hidden=true;err.textContent=''}
 const pct=v.net>0?r.remain/v.net*100:0, dpct=100-pct;
 $('remainValue').textContent=fmt(r.remain); $('deductionValue').textContent=fmt(r.deduction); $('protectedValue').textContent=fmt(r.protectedRounded); $('thirdValue').textContent=fmt(r.third); $('fullValue').textContent=fmt(r.fully);
 $('remainText').textContent=r.deduction>0?`Po srážce vám zůstane ${pct.toLocaleString('cs-CZ',{maximumFractionDigits:1})} % zadané čisté mzdy.`:'Zadaná mzda nepřesahuje chráněnou částku nebo nejsou zadány vymáhané dluhy.';
 $('remainBar').style.width=pct+'%'; $('deductionBar').style.width=dpct+'%';
 $('breakNet').textContent=fmt(v.net); $('breakDependants').textContent=r.dependants?new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:3,maximumFractionDigits:3}).format(r.dependants*QUARTER)+' Kč':'0 Kč'; $('breakProtected').textContent=fmt(r.protectedRounded); $('breakThirdBase').textContent=fmt(r.thirdBase); $('breakThird').textContent=fmt(r.third); $('breakFull').textContent=fmt(r.fully); $('executorValue').textContent=fmt(r.executor); $('employerValue').textContent=fmt(r.employer);
 $('scenarioOrdinary').textContent=fmt(scenario(v.net,v.dependants,v.spouse,'ordinary')); $('scenarioPriority').textContent=fmt(scenario(v.net,v.dependants,v.spouse,'priority')); $('scenarioFour').textContent=fmt(scenario(v.net,v.dependants,v.spouse,'fourplus'));
 let alert='Výpočet používá standardní nepřednostní srážku z první třetiny zbytku čisté mzdy.'; let cls='result-alert';
 if(r.fourException){alert='Přestože jsou označeny nejméně čtyři exekuce, uplatnila se důchodová výjimka: jedna třetina je nižší než 1 089 Kč.';cls+=' is-warning'}
 else if(r.forcedTwo){alert='Jsou splněny podmínky čtyř a více exekucí, proto kalkulačka používá dvě třetiny zbytku čisté mzdy.';cls+=' is-warning'}
 else if(v.priority>0){alert='Výsledek zahrnuje přednostní pohledávku, která může využít také druhou třetinu zbytku čisté mzdy.'}
 else if(r.deduction===0){alert=v.net<=r.protectedRounded?'Zadaný příjem nepřesahuje vypočtenou nezabavitelnou částku.':'Pokročilý režim nemá zadaný kladný zůstatek vymáhaných pohledávek.'}
 $('resultAlert').className=cls; $('resultAlert').textContent=alert;
 const label=mode==='basic'?(v.type==='ordinary'?'nepřednostní':v.type==='priority'?'přednostní':'4+ exekuce'):(r.forcedTwo?'4+ exekuce':v.priority>0?'kombinace':'nepřednostní');
 $('heroRemain').textContent=fmt(r.remain); $('heroDeduction').textContent=fmt(r.deduction); $('heroProtected').textContent=fmt(r.protectedRounded); $('heroThird').textContent=fmt(r.third); $('heroMode').textContent=label; $('heroContext').textContent='z čisté mzdy '+fmt(v.net); $('heroRemainBar').style.width=pct+'%'; $('heroDeductionBar').style.width=dpct+'%';
 writeUrl(v);
}
function setMode(next){mode=next;all('.mode-button').forEach(b=>{const active=b.dataset.mode===next;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});all('[data-basic]').forEach(el=>el.hidden=next!=='basic');all('[data-advanced]').forEach(el=>el.hidden=next!=='advanced');update()}
function writeUrl(v){try{const u=new URL(location.href);u.search='';u.searchParams.set('mzda',Math.round(v.net));u.searchParams.set('osoby',v.dependants);if(mode==='basic')u.searchParams.set('typ',v.type);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function readUrl(){const q=new URLSearchParams(location.search);if(q.has('mzda'))$('netIncome').value=q.get('mzda');if(q.has('osoby'))$('dependants').value=q.get('osoby');const t=q.get('typ');if(t&&['ordinary','priority','fourplus'].includes(t)){const el=form.querySelector(`input[name="debtType"][value="${t}"]`);if(el)el.checked=true}}
all('.mode-button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode))); form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('submit',e=>{e.preventDefault();update()});
$('resetForm').addEventListener('click',()=>{form.reset();$('netIncome').value=40000;$('dependants').value=0;$('ordinaryDebt').value=100000;$('priorityDebt').value=0;setMode('basic')});
const mt=$('menuToggle'),nav=$('mainNav');if(mt&&nav)mt.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');mt.setAttribute('aria-expanded',String(open))});
readUrl();update();window.__rvExecutionCalc=core;
})();