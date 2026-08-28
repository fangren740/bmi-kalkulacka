(()=>{
"use strict";
const CONFIG={
  year:2026,dppThreshold:12000,dpcThreshold:4500,minWage:22400,minHourly:134.40,
  employeeSocialRate:0.071,employerSocialRate:0.248,healthTotalRate:0.135,
  taxpayerDiscount:2570,highTaxThreshold:146901,maxGross:10000000
};
const ceilCzk=n=>Math.ceil((Number(n)||0)-1e-9);
const round2=n=>Math.round((Number(n)||0)*100)/100;
function agreementThreshold(type){return type==='dpc'?CONFIG.dpcThreshold:CONFIG.dppThreshold}
function advanceTax(gross){
  const base=gross<=100?Math.ceil(gross):Math.ceil(gross/100)*100;
  const low=Math.min(base,CONFIG.highTaxThreshold),high=Math.max(0,base-CONFIG.highTaxThreshold);
  return ceilCzk(low*.15+high*.23);
}
function withholdingTax(gross){return Math.floor(Math.max(0,gross)*.15+1e-9)}
function calculate(input={}){
  const type=input.type==='dpc'?'dpc':'dpp';
  const gross=Math.max(0,Number(input.gross)||0),sameEmployer=Math.max(0,Number(input.sameEmployer)||0);
  const totalGross=gross+sameEmployer,threshold=agreementThreshold(type),insured=totalGross>=threshold;
  const signed=!!input.signedDeclaration,healthMode=['applies','exempt','unknown'].includes(input.healthMode)?input.healthMode:'unknown';
  const hours=Math.max(0,Number(input.hours)||0),priorDppHours=Math.max(0,Number(input.priorDppHours)||0);
  let employeeSocial=0,employerSocial=0,employeeHealth=0,employerHealth=0,healthMinimumExtra=0,totalHealth=0;
  if(insured){
    employeeSocial=ceilCzk(totalGross*CONFIG.employeeSocialRate);
    employerSocial=ceilCzk(totalGross*CONFIG.employerSocialRate);
    totalHealth=ceilCzk(totalGross*CONFIG.healthTotalRate);
    employeeHealth=ceilCzk(totalHealth/3);
    employerHealth=totalHealth-employeeHealth;
    if(healthMode==='applies'&&totalGross<CONFIG.minWage){
      healthMinimumExtra=ceilCzk((CONFIG.minWage-totalGross)*CONFIG.healthTotalRate);
      employeeHealth+=healthMinimumExtra;
    }
  }
  let taxMode='advance',taxBeforeCredit=0,tax=0;
  const withholdingEligible=!signed&&totalGross<threshold;
  if(withholdingEligible){
    taxMode='withholding';taxBeforeCredit=withholdingTax(totalGross);tax=taxBeforeCredit;
  }else{
    taxBeforeCredit=advanceTax(totalGross);
    tax=signed?Math.max(0,taxBeforeCredit-CONFIG.taxpayerDiscount):taxBeforeCredit;
  }
  const deductions=employeeSocial+employeeHealth+tax;
  const net=Math.max(0,totalGross-deductions);
  const employerCost=totalGross+employerSocial+employerHealth;
  const grossHourly=hours>0?totalGross/hours:null,netHourly=hours>0?net/hours:null;
  const reserve=insured?0:Math.max(0,threshold-totalGross);
  const thresholdUse=threshold>0?Math.min(100,totalGross/threshold*100):0;
  const dppHoursTotal=type==='dpp'?priorDppHours+hours:null;
  const dppHoursRemaining=type==='dpp'?Math.max(0,300-dppHoursTotal):null;
  return {type,gross,sameEmployer,totalGross,threshold,insured,signed,healthMode,hours,priorDppHours,
    employeeSocial,employerSocial,totalHealth,employeeHealth,employerHealth,healthMinimumExtra,
    taxMode,taxBeforeCredit,tax,deductions,net,employerCost,grossHourly,netHourly,reserve,thresholdUse,
    dppHoursTotal,dppHoursRemaining,minHourlyOk:grossHourly===null?null:grossHourly>=CONFIG.minHourly};
}
if(typeof module!=="undefined"&&module.exports)module.exports={CONFIG,calculate,advanceTax,withholdingTax};
if(typeof document==="undefined")return;
const $=id=>document.getElementById(id),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const nf=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
const n1=new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:0,maximumFractionDigits:1});
const money=n=>`${nf.format(Math.round(n))} Kč`,hourly=n=>n==null?'—':`${n1.format(n)} Kč/h`,pct=n=>`${n1.format(n)} %`;
const parse=v=>{const n=Number(String(v??'').replace(/[\s\u00a0]/g,'').replace(',','.'));return Number.isFinite(n)?n:NaN};
const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
let state={type:'dpp',advanced:false};
function read(){return{type:state.type,gross:parse($('grossReward').value),sameEmployer:state.advanced?parse($('sameEmployerReward').value):0,hours:parse($('hoursWorked').value),signedDeclaration:$('signedDeclaration').checked,healthMode:state.advanced?$('healthMinimumMode').value:'unknown',priorDppHours:state.advanced?parse($('priorDppHours').value):0}}
function clearErrors(){$$('.agr77-field').forEach(x=>x.classList.remove('has-error'));['grossError','hoursError','sameError','priorHoursError'].forEach(id=>set(id,''));}
function error(input,errorId,msg){const el=$(input);el?.closest('.agr77-field')?.classList.add('has-error');set(errorId,msg)}
function validate(v){clearErrors();let ok=true;if(!Number.isFinite(v.gross)||v.gross<0||v.gross>CONFIG.maxGross){error('grossReward','grossError','Zadejte odměnu od 0 do 10 000 000 Kč.');ok=false}if(!Number.isFinite(v.hours)||v.hours<=0||v.hours>744){error('hoursWorked','hoursError','Zadejte počet hodin větší než 0 a nejvýše 744.');ok=false}if(state.advanced&&(!Number.isFinite(v.sameEmployer)||v.sameEmployer<0||v.sameEmployer>CONFIG.maxGross)){error('sameEmployerReward','sameError','Zadejte nezápornou částku.');ok=false}if(state.advanced&&(!Number.isFinite(v.priorDppHours)||v.priorDppHours<0||v.priorDppHours>3000)){error('priorDppHours','priorHoursError','Zadejte nezáporný počet hodin.');ok=false}const box=$('formMessage');box.hidden=ok;if(!ok)box.textContent='Opravte označené hodnoty. Výsledek se zobrazí až po platném zadání.';return ok}
function regimeLabel(r){if(!r.insured)return r.type==='dpp'?'DPP · bez pojistného':'DPČ · bez pojistného';return r.type==='dpp'?'DPP · s pojistným':'DPČ · s pojistným'}
function taxLabel(r){if(r.taxMode==='withholding')return'Srážková daň 15 %';if(r.signed)return'Zálohová daň po slevě';return'Zálohová daň bez slevy'}
function healthText(r){if(!r.insured)return'Z dohody se zdravotní pojistné zaměstnavateli neodvádí. Pokud za vás neplatí stát ani nemáte jiné krytí, ověřte povinnost OBZP.';if(r.healthMode==='applies'&&r.healthMinimumExtra>0)return`Zahrnut doplatek zdravotního minima ${money(r.healthMinimumExtra)}.`;if(r.healthMode==='unknown'&&r.totalGross<CONFIG.minWage)return'Pojistné z dohody vzniklo, ale kalkulačka bez vaší volby nedopočítává zdravotní minimum. Ověřte, zda se na vás vztahuje.';return'Zdravotní pojistné je počítáno z odměny bez doplatku do minima.'}
function render(r){
  set('resultStatus',regimeLabel(r));set('netResult',money(r.net));set('grossResult',money(r.totalGross));set('deductionsResult',money(r.deductions));set('employeeSocialResult',money(r.employeeSocial));set('employeeHealthResult',money(r.employeeHealth));set('taxResult',money(r.tax));set('taxModeResult',taxLabel(r));set('employerCostResult',money(r.employerCost));set('grossHourlyResult',hourly(r.grossHourly));set('netHourlyResult',hourly(r.netHourly));
  set('thresholdValue',money(r.threshold));set('thresholdCurrent',money(r.totalGross));set('thresholdReserve',r.insured?'Pojistné vzniká':`Do hranice zbývá ${money(r.reserve)}`);$('thresholdBar').style.width=`${r.thresholdUse}%`;
  set('heroType',r.type.toUpperCase());set('heroNet',money(r.net));set('heroGross',money(r.totalGross));set('heroStatus',r.insured?'pojistné se odvádí':'bez pojistného');set('heroThreshold',r.insured?`hranice ${money(r.threshold)} dosažena`:`${money(r.reserve)} do hranice`);$('heroMeter').style.width=`${r.thresholdUse}%`;
  set('healthNotice',healthText(r));
  const wage=$('hourlyNotice');if(r.grossHourly!=null){wage.className='agr77-alert '+(r.minHourlyOk?'is-ok':'is-warn');wage.innerHTML=r.minHourlyOk?`<b>Hodinová odměna ${hourly(r.grossHourly)}</b><span>Je alespoň na úrovni minimální hodinové mzdy ${n1.format(CONFIG.minHourly)} Kč/h pro rok 2026.</span>`:`<b>Hodinová odměna ${hourly(r.grossHourly)}</b><span>Je pod minimální hodinovou mzdou ${n1.format(CONFIG.minHourly)} Kč/h. Zkontrolujte zadání a pracovněprávní podmínky.</span>`}
  const scope=$('scopeNotice');if(r.type==='dpp'){
    scope.hidden=false;scope.className='agr77-scope '+(r.dppHoursTotal>300?'is-warn':'');set('scopeTitle',`DPP: ${n1.format(r.dppHoursTotal)} z 300 hodin`);set('scopeText',r.dppHoursTotal>300?`Zadaný součet překračuje limit o ${n1.format(r.dppHoursTotal-300)} h.`:`Po zadaném měsíci zbývá ${n1.format(r.dppHoursRemaining)} h do ročního limitu.`)
  }else{scope.hidden=false;scope.className='agr77-scope';set('scopeTitle','DPČ: sleduje se průměrný rozsah práce');set('scopeText','Z jednoho měsíce nelze právně určit dodržení limitu. DPČ může být v průměru nejvýše 20 hodin týdně za sjednané období, nejdéle za 52 týdnů.')}
  set('resultSentence',`${money(r.totalGross)} hrubého → ${money(r.net)} čistého. ${r.insured?'Sociální a zdravotní pojistné se odvádí.':'Z dohody se v tomto měsíčním modelu pojistné neodvádí.'}`);
}
function update(){const v=read();if(!validate(v))return false;const r=calculate(v);render(r);return true}
function setType(type){state.type=type==='dpc'?'dpc':'dpp';$$('[data-agreement]').forEach(b=>{const on=b.dataset.agreement===state.type;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});set('agreementHelp',state.type==='dpp'?'Pojistné od 12 000 Kč včetně · max. 300 hodin ročně.':'Pojistné od 4 500 Kč včetně · v průměru nejvýše 20 h týdně.');$('priorDppWrap').hidden=state.type!=='dpp';update()}
$$('[data-agreement]').forEach(b=>b.addEventListener('click',()=>setType(b.dataset.agreement)));
$$('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const p=b.dataset.preset;if(p==='dpp10'){state.type='dpp';$('grossReward').value='10 000';$('hoursWorked').value='60';$('signedDeclaration').checked=true}else if(p==='dpp12'){state.type='dpp';$('grossReward').value='12 000';$('hoursWorked').value='70';$('signedDeclaration').checked=true}else if(p==='dpc8'){state.type='dpc';$('grossReward').value='8 000';$('hoursWorked').value='40';$('signedDeclaration').checked=true}else if(p==='unsigned'){state.type='dpp';$('grossReward').value='10 000';$('hoursWorked').value='60';$('signedDeclaration').checked=false}setType(state.type)}));
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.advanced=b.dataset.mode==='advanced';$$('[data-mode]').forEach(x=>{const on=(x.dataset.mode==='advanced')===state.advanced;x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',String(on))});$('advancedPanel').hidden=!state.advanced;update()}));
$('dppDpcForm').addEventListener('input',e=>{if(e.target.matches('input,select'))update()});$('dppDpcForm').addEventListener('change',update);$('dppDpcForm').addEventListener('submit',e=>{e.preventDefault();update();if(matchMedia('(max-width:760px)').matches)$('vysledek').scrollIntoView({behavior:'smooth',block:'start'})});
$('resetButton').addEventListener('click',()=>{document.getElementById('dppDpcForm').reset();state={type:'dpp',advanced:false};$('grossReward').value='10 000';$('hoursWorked').value='60';$('sameEmployerReward').value='0';$('priorDppHours').value='0';$('signedDeclaration').checked=true;$('healthMinimumMode').value='unknown';$('advancedPanel').hidden=true;$$('[data-mode]').forEach(x=>{const on=x.dataset.mode==='basic';x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',String(on))});setType('dpp')});
const menu=$('menuBtn');menu?.addEventListener('click',()=>{const nav=$('mobile-nav'),open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open)});
setType('dpp');
})();
