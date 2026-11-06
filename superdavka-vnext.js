(() => {
'use strict';
const $=id=>document.getElementById(id);
const qsa=s=>[...document.querySelectorAll(s)];
const money=v=>`${Math.max(0,Math.ceil(Number.isFinite(v)?v:0)).toLocaleString('cs-CZ')} Kč`;
const num=v=>{const t=String(v??'').trim().replace(/[\s\u00a0\u202f]/g,'');if(!/^\d+(?:[,.]\d+)?$/.test(t))return NaN;const n=Number(t.replace(',','.'));return Number.isFinite(n)?n:NaN};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const LIFE={individual:5500,firstAdult:5000,otherAdult:3750,childUnder6:2480,child6to15:3050,child15to26:3490,existence:3130};
const SERVICE={standard:[880,1240,1600,1710,1820],vulnerable:[1310,1770,2230,2370,2380]};
const ENERGY=[2300,2800,3300,3800,4300];
const SOLID=[1500,2000,2500,3000,3500];
const LEGAL=window.__RV_SUPERDAVKA_OCT26__;if(!LEGAL||!LEGAL.districts||Object.keys(LEGAL.districts).length!==77)throw new Error("Superdávka: zákonné normativy pro říjen 2026 nejsou k dispozici.");const NORM=LEGAL.districts;
const templates={single:[{type:'adult',active:true,vulnerable:false,plan:false}],singleChild:[{type:'adult',active:true,vulnerable:true,plan:false},{type:'child6to15',active:false,vulnerable:true,plan:false}],couple:[{type:'adult',active:true,vulnerable:false,plan:false},{type:'adult',active:true,vulnerable:false,plan:false}],coupleTwoChildren:[{type:'adult',active:true,vulnerable:false,plan:false},{type:'adult',active:true,vulnerable:false,plan:false},{type:'childUnder6',active:false,vulnerable:true,plan:false},{type:'child6to15',active:false,vulnerable:true,plan:false}]};
let members=structuredClone(templates.coupleTwoChildren);let activeMode='basic';let basicTemplate=null;let advancedMembersSnapshot=null;
const el={form:$('dsspForm'),modeBtns:qsa('.sd87-mode [data-mode]'),basic:$('sd87BasicPanel'),advanced:$('sd87AdvancedPanel'),memberList:$('memberList'),add:$('addMember'),reset:$('resetBtn'),status:$('resultStatus'),total:$('totalBenefit'),explanation:$('resultExplanation'),housing:$('housingComponent'),living:$('livingComponent'),child:$('childComponent'),work:$('workComponent'),life:$('lifeMinimum'),ratio:$('incomeRatio'),recognised:$('recognisedHousing'),asset:$('assetLimit'),warnBox:$('warningBox'),warnList:$('warningList'),days:$('daysToOctober'),menu:document.querySelector('.sd87-menu'),mobile:document.querySelector('.sd87-mobile-nav')};
function clone(t){return structuredClone(templates[t]);}
function countAdults(list){return list.filter(m=>m.type==='adult').length}
function countChildren(list){return list.filter(m=>m.type!=='adult').length}
function idx(count){return clamp(Math.floor(count),1,5)-1}
function savingsLimit(count){return Math.min(400000,150000+50000*count)}
function memberLabel(type){return type==='adult'?'Dospělá osoba':type==='childUnder6'?'Dítě do 6 let':type==='child6to15'?'Dítě 6–15 let':'Dítě 15–26 let'}
function lifeMinimum(list){if(list.length===1)return list[0].type==='adult'?LIFE.individual:LIFE[list[0].type];let first=false;return list.reduce((s,m)=>{if(m.type==='adult'){const v=first?LIFE.otherAdult:LIFE.firstAdult;first=true;return s+v}return s+LIFE[m.type]},0)}
function adultLifeMinimum(member,index,list){if(list.length===1)return LIFE.individual;const a=list.map((m,i)=>m.type==='adult'?i:-1).filter(i=>i>=0);return index===a[0]?LIFE.firstAdult:LIFE.otherAdult}
function formatInput(node){if(!node)return;const n=num(node.value);if(!Number.isFinite(n)||n<0)return;node.value=n.toLocaleString('cs-CZ',{maximumFractionDigits:20})}
function renderMembers(){if(!el.memberList)return;el.memberList.innerHTML=members.map((m,i)=>`<article class="sd87-member" data-member-card="${i}"><div class="sd87-member-head"><strong>Osoba ${i+1}</strong>${members.length>1?`<button type="button" data-remove="${i}">Odebrat</button>`:''}</div><div class="sd87-member-grid"><label><select data-index="${i}" data-key="type" aria-label="Typ osoby ${i+1}"><option value="adult" ${m.type==='adult'?'selected':''}>Dospělá osoba</option><option value="childUnder6" ${m.type==='childUnder6'?'selected':''}>Dítě do 6 let</option><option value="child6to15" ${m.type==='child6to15'?'selected':''}>Dítě 6–15 let</option><option value="child15to26" ${m.type==='child15to26'?'selected':''}>Dítě 15–26 let</option></select></label><div class="sd87-member-checks ${m.type!=='adult'?'is-child':''}"><label><input type="checkbox" data-index="${i}" data-key="active" ${m.active?'checked':''} ${m.type!=='adult'?'disabled':''}> aktivní / evidence ÚP</label><label><input type="checkbox" data-index="${i}" data-key="vulnerable" ${m.vulnerable?'checked':''} ${m.type!=='adult'?'disabled':''}> zranitelná osoba</label><label><input type="checkbox" data-index="${i}" data-key="plan" ${m.plan?'checked':''} ${m.type!=='adult'?'disabled':''}> podpůrný plán</label></div>${m.type!=='adult'? '<label class="sd89-penalty"><input type="checkbox" data-index="'+i+'" data-key="schoolPenalty" '+(m.schoolPenalty?'checked':'')+'> U tohoto dítěte běží tříměsíční sankce za pravomocně potvrzený přestupek týkající se školní docházky nebo předškolního vzdělávání.</label>':''}</div></article>`).join('');
el.memberList.querySelectorAll('[data-index]').forEach(c=>c.addEventListener('change',()=>{const i=+c.dataset.index,key=c.dataset.key;if(key==='type'){members[i].type=c.value;if(c.value!=='adult'){members[i].active=false;members[i].vulnerable=true;members[i].plan=false}else members[i].schoolPenalty=false;renderMembers();focusMember(i)}else members[i][key]=c.checked;syncAllPeople();calculate()}));
el.memberList.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{members.splice(+b.dataset.remove,1);if(!members.length)members.push({type:'adult',active:true,vulnerable:false,plan:false});renderMembers();syncAllPeople();calculate();focusMember(Math.min(+b.dataset.remove,members.length-1))}));}
function syncAllPeople(){const a=$('allPeople');if(a&&num(a.value)<members.length)a.value=members.length}
function basicValues(){return{workIncome:Math.max(0,num($('basicWorkIncome').value)),otherIncome:Math.max(0,num($('basicOtherIncome').value)),housingType:$('basicHousingType').value,region:$('basicRegion').value,rent:Math.max(0,num($('basicRent').value)),energyActual:Math.max(0,num($('basicEnergy').value)),allPeople:members.length,solidFuel:false,savings:0,cars:Math.min(1,countAdults(members)),homes:1,usesOwnHome:false,secondHomeException:false,assumeAssets:true}}
function advancedValues(){return{workIncome:Math.max(0,num($('workIncome').value)),otherIncome:Math.max(0,num($('otherIncome').value)),housingType:$('housingType').value,region:$('region').value,rent:Math.max(0,num($('rentCosts').value)),energyActual:Math.max(0,num($('energyCosts').value)),allPeople:Math.max(members.length,Math.floor(num($('allPeople').value)||members.length)),solidFuel:$('solidFuel').checked,savings:Math.max(0,num($('savings').value)),cars:Math.max(0,Math.floor(num($('cars').value))),homes:Math.max(0,Math.floor(num($('homes').value))),usesOwnHome:$('usesOwnHome').checked,secondHomeException:$('secondHomeException').checked,assumeAssets:false}}
function engine(v){const work=v.workIncome,other=v.otherIncome,income=work+other,count=members.length,adults=countAdults(members),children=countChildren(members),allVulnerable=members.every(m=>m.type!=='adult'||m.vulnerable),allRequiredActive=members.filter(m=>m.type==='adult').every(m=>m.vulnerable||m.active),eligible=members.filter(m=>m.type!=='adult'||m.active||m.vulnerable),effectiveCount=Math.max(1,eligible.length),life=lifeMinimum(members),ratio=life?income/life:0,i=idx(effectiveCount),group=allVulnerable?'vulnerable':'standard',norm=NORM[v.region][group][i],service=SERVICE[group][i],energyP=ENERGY[i]*(allVulnerable?1.4:1),solid=v.solidFuel?SOLID[i]*(allVulnerable?1.4:1):0;let recEnergy=ratio>=1.43?energyP:Math.min(v.energyActual+solid,energyP*1.2);let recBase;if(v.housingType==='owner')recBase=.3*Math.max(0,norm-service)+service;else if(v.housingType==='other')recBase=Math.min(v.rent,norm*.8);else recBase=Math.min(v.rent,norm);let recHousing=(recBase+recEnergy)*(count/v.allPeople);const determined=.3*income+(income>2*life?.1*(income-2*life):0);const housing=Math.max(0,recHousing-determined);let needs=0;members.forEach((m,index)=>{if(m.type!=='adult')needs+=LIFE[m.type];else if(m.active||m.vulnerable)needs+=m.plan?adultLifeMinimum(m,index,members):LIFE.existence});const living=ratio<=1.43?Math.max(0,needs-.7*income):0;const eligibleChildren=members.filter(m=>m.type!=='adult'&&!m.schoolPenalty).length;let childPer=0;if(eligibleChildren&&allRequiredActive&&ratio<=4){if(ratio<=1.43)childPer=allVulnerable?1000:500;else if(ratio<3)childPer=1000;else childPer=Math.max(0,1000*(4-ratio))}const child=eligibleChildren*childPer;let workBonus=0;if(work>0&&(housing>0||living>0||child>0)){if(ratio<=1.6)workBonus=.4*work;else{const excess=Math.max(0,income-1.6*life);workBonus=Math.max(0,.4*Math.max(0,work-excess)-.3*excess)}}const limit=savingsLimit(count);const unusedHomes=Math.max(0,v.homes-(v.usesOwnHome?1:0));const assetUncertain=!v.assumeAssets&&unusedHomes===1&&!v.secondHomeException;const issues=[];if(!v.assumeAssets){if(v.savings>limit)issues.push(`Úspory překračují limit ${money(limit)}.`);if(v.cars>adults)issues.push(`Počet aut je vyšší než počet dospělých (${adults}).`);if(unusedHomes>1)issues.push('Více než jedna započitatelná stavba mimo vlastní bydlení překračuje základní majetkový test.');if(assetUncertain)issues.push('Stavba mimo vlastní bydlení vyžaduje ověření tříleté výjimky.')}if(count===1&&adults===1&&!members[0].active&&!members[0].vulnerable)issues.push('Jednočlenná domácnost bez pracovní aktivity a bez zranitelnosti podle základního pravidla neprochází.');if(eligibleChildren<children)issues.push('U označených dětí se po dobu zákonné sankce bonus nezapočítává.');if(!allRequiredActive&&children)issues.push('Bonus na dítě může zaniknout kvůli pracovní neaktivitě nezranitelného dospělého.');const hard=issues.some(x=>x.includes('Úspory')||x.includes('Počet aut')||x.includes('Více než jedna')||x.includes('Jednočlenná'));const raw=Math.ceil(housing+living+child+workBonus);return{total:hard?0:raw,housing,living,child,work:workBonus,life,ratio,recHousing,recBase,recEnergy,determined,limit,issues,hard,energyP,assetUncertain,assumeAssets:v.assumeAssets}}
function setText(id,v){const n=$(id);if(n)n.textContent=v}
const sharedFields=[['basicWorkIncome','workIncome'],['basicOtherIncome','otherIncome'],['basicHousingType','housingType'],['basicRegion','region'],['basicRent','rentCosts'],['basicEnergy','energyCosts']];
const proofMoney=value=>value.toLocaleString('cs-CZ',{style:'currency',currency:'CZK',minimumFractionDigits:0,maximumFractionDigits:2});
const amountIds=['totalBenefit','housingComponent','livingComponent','childComponent','workComponent','lifeMinimum','incomeRatio','recognisedHousing','assetLimit'];
const barIds=['housingBar','livingBar','childBar','workBar'];
let formSubmitted=false;
let firstIssue=null;

function showResultSections(result){
 for(const id of ['resultComponents','resultMetrics','resultNext','mobileSummary'])$(id).hidden=!result;
 $('resultProof').hidden=!result||result.hard;
 if(!result)$('resultProof').open=false;
}

function showWarnings(warnings){
 el.warnList.replaceChildren(...warnings.map(message=>{
  const item=document.createElement('li');
  item.textContent=message;
  return item;
 }));
 el.warnBox.hidden=!warnings.length;
}

function setStatus(text,style,explanation){
 el.status.textContent=text;
 el.status.className=style;
 el.explanation.textContent=explanation;
}

function render(result,v){
 showResultSections(result);
 const {total,hard,assumeAssets,assetUncertain,issues}=result;
 const components=[result.housing,result.living,result.child,result.work];
 const scale=components.reduce((sum,value)=>sum+value,0)||1;
 const values=[money(total),...components.map(value=>hard?'—':proofMoney(value)),money(result.life),result.ratio.toLocaleString('cs-CZ',{maximumFractionDigits:2})+'× minima',proofMoney(result.recHousing),money(result.limit)];
 amountIds.forEach((id,index)=>setText(id,values[index]));
 barIds.forEach((id,index)=>$(id).style.width=hard?'0%':(100*components[index]/scale)+'%');
 setText('mobileSummaryValue',money(total)+' / měsíc');
 if(hard)setStatus('Překážka v modelu','is-risk','Zadané údaje ukazují překážku. Její důvod najdete níže.');
 else if(assetUncertain)setStatus('Podmíněný odhad','is-neutral','Částka platí za předpokladu, že se u stavby mimo vlastní bydlení uplatní tříletá výjimka.');
 else if(!total)setStatus('Bez kladné částky','is-neutral','Ze zadaných údajů vychází 0 Kč.');
 else setStatus(assumeAssets?'Rychlý odhad':'Podrobný odhad','is-success',assumeAssets?'Částka předpokládá splnění majetkového testu a podmínek zvolené domácnosti.':'Výsledek vychází ze zadaných údajů a základních testů modelu.');

 const warnings=[...issues];
 if(!$('exampleNotice').hidden)warnings.unshift('Počítáte s údaji z ukázky nebo s jejich upravenou verzí.');
 if(total>0&&total<300)warnings.push('Částky pod 300 Kč se mohou vyplácet souhrnně podle § 47.');
 if(new Date()>=new Date(2027,0,1))warnings.unshift('Archivní model. Pro měsíce od ledna 2027 ověřte aktuální parametry.');
 showWarnings(warnings);
 $('checkAssets').hidden=!assumeAssets||hard;
 $('applicationLink').hidden=hard||assumeAssets||assetUncertain||total===0;
 if(hard){
  setText('nextTitle','Ověřte uvedenou překážku');
  setText('nextDescription','Při výjimce nebo nejasnostech se obraťte na Úřad práce.');
 }else if(assumeAssets){
  setText('nextTitle','Prověřte předpoklady rychlého odhadu');
  setText('nextDescription','Rychlá verze používá typovou domácnost. Úspory, auta a nemovitosti můžete zadat v podrobném výpočtu.');
 }else if(assetUncertain){
  setText('nextTitle','Ověřte výjimku pro další stavbu');
  setText('nextDescription','Podmínky výjimky posuzuje Úřad práce.');
 }else{
  setText('nextTitle',total?'Připravte si podklady k žádosti':'Zkontrolujte, jak vznikla nula');
  setText('nextDescription',total?'Připravte příjmy, náklady na bydlení a údaje o domácnosti.':'Otevřete rozpis bydlení a ověřte příjmy, osoby i započtené náklady.');
 }

 setText('proofBaseLabel',v.housingType==='owner'?'Vlastnický paušál':'Započtený nájem a služby');
 setText('proofEnergyLabel',result.ratio>=1.43?'Energetický paušál':'Započtené skutečné energie');
 setText('proofCostsLabel',v.allPeople>members.length?'Podíl domácnosti na uznaných nákladech':'Uznané náklady domácnosti');
 setText('proofBase',proofMoney(result.recBase));
 setText('proofEnergy',proofMoney(result.recEnergy));
 setText('proofCosts',proofMoney(result.recHousing));
 setText('proofDeduction',proofMoney(result.determined));
 let baseReason='Zadaný nájem se službami se vešel do stropu modelu.';
 if(v.housingType==='owner')baseReason='U vlastního a družstevního bydlení se použil vlastnický paušál.';
 else if(v.rent>result.recBase)baseReason='Zadaný nájem se službami převyšuje strop o '+proofMoney(v.rent-result.recBase)+'.';
 const energyReason=result.ratio>=1.43
  ?'Při tomto příjmu se energie počítají paušálem.'
  :'Při tomto příjmu se uznávají skutečné energie nejvýš do '+proofMoney(result.energyP*1.2)+'.';
 setText('proofReason',baseReason+' '+energyReason+(result.housing===0?' Po odečtení části příjmu vychází bydlení na 0 Kč.':''));
}

function moneyIssue(id){
 const field=$(id);
 const label=field.closest('label');
 const n=num(field.value);
 const integer=['allPeople','cars','homes'].includes(id);
 const message=!field.value.trim()?(integer?'Doplňte počet.':'Doplňte částku nebo zadejte 0.'):
  !Number.isFinite(n)||n>Number.MAX_SAFE_INTEGER?'Zadejte platné nezáporné číslo.':
  integer&&!Number.isInteger(n)?'Zadejte celé číslo.':
  id==='allPeople'&&n<members.length?'Zadejte alespoň '+members.length+' osob.':'';
 const error=label.querySelector('em');
 const show=Boolean(message&&(formSubmitted||field.value.trim()));
 error.id ||= id+'Error';
 field.setAttribute('aria-describedby',error.id);
 field.setAttribute('aria-invalid',String(show));
 error.textContent=show?message:'';
 return message?{field,label:label.firstElementChild.textContent}:null;
}

function calculate(){
 const basic=activeMode==='basic';
 const region=$(basic?'basicRegion':'region');
 const rent=$(basic?'basicRent':'rentCosts');
 const owner=$(basic?'basicHousingType':'housingType').value==='owner';
 rent.closest('label').hidden=owner;
 rent.disabled=owner;
 if(!basic){
  const homes=num($('homes').value);
  $('homeUseField').hidden=!(homes>0);
  $('homeExceptionField').hidden=homes-($('usesOwnHome').checked?1:0)!==1;
 }
 const ids=basic?['basicWorkIncome','basicOtherIncome','basicRent','basicEnergy']:['workIncome','otherIncome','rentCosts','energyCosts','allPeople','savings','cars','homes'];
 const issues=ids.filter(id=>!$(id).disabled).map(moneyIssue).filter(Boolean);
 const needsTemplate=basic&&!basicTemplate;
 firstIssue=!region.value?region:needsTemplate?document.querySelector('[data-template]'):issues[0]?.field;
 if(firstIssue){
  showResultSections(null);
  amountIds.forEach(id=>setText(id,'—'));
  barIds.forEach(id=>$(id).style.width='0%');
  showWarnings([]);
  const explanation=!region.value?'Nejprve zvolte okres bydliště.':needsTemplate?'Vyberte typ domácnosti nebo přejděte na podrobný výpočet.':'Doplňte nebo opravte pole „'+issues[0].label+'“.';
  setStatus('Čeká na údaje','is-neutral',explanation);
  return null;
 }
 const v=basic?basicValues():advancedValues();
 if(owner)v.rent=0;
 const result=engine(v);
 render(result,v);
 return result;
}

function setMode(mode,focus=false){
 if(mode!==activeMode){
  if(mode==='basic'){
   advancedMembersSnapshot=structuredClone(members);
   members=basicTemplate?clone(basicTemplate):clone('single');
  }else{
   members=advancedMembersSnapshot?structuredClone(advancedMembersSnapshot):basicTemplate?clone(basicTemplate):clone('single');
   syncAllPeople();
  }
  renderMembers();
 }
 activeMode=mode;
 el.modeBtns.forEach(button=>{
  const selected=button.dataset.mode===mode;
  button.classList.toggle('is-active',selected);
  button.setAttribute('aria-selected',String(selected));
  button.tabIndex=selected?0:-1;
  if(selected&&focus)button.focus();
 });
 el.basic.hidden=mode!=='basic';
 el.advanced.hidden=mode!=='advanced';
 setText('modeHelp',mode==='basic'?'Zadejte vlastní údaje nebo si nejdřív vyzkoušejte ukázku.':'Přidejte konkrétní osoby a doplňte údaje pro majetkový test.');
 formSubmitted=false;
 calculate();
}

function applyTemplate(key){
 basicTemplate=key;
 advancedMembersSnapshot=null;
 members=key?clone(key):clone('single');
 qsa('[data-template]').forEach(button=>{
  const selected=button.dataset.template===key;
  button.classList.toggle('is-active',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
 $('allPeople').value=members.length;
 renderMembers();
 calculate();
}

function resetForm(example=false){
 el.form.reset();
 $('exampleNotice').hidden=!example;
 $('exampleBtn').hidden=example;
 for(const [basic,advanced] of sharedFields)$(advanced).value=$(basic).value;
 setMode('basic');
 applyTemplate(example?'single':null);
 if(example){
  const values=['20000','0','rent','Praha','12000','3000'];
  sharedFields.forEach((pair,index)=>pair.forEach(id=>$(id).value=values[index]));
  for(const id of ['savings','cars','homes'])$(id).value='0';
 }
 calculate();
 $(example?'basicRegion':'exampleBtn').focus();
}

qsa('[data-template]').forEach(b=>b.addEventListener('click',()=>applyTemplate(b.dataset.template)));
el.modeBtns.forEach((button,index)=>{
 button.addEventListener('click',()=>setMode(button.dataset.mode));
 button.addEventListener('keydown',event=>{
  const target={ArrowLeft:1-index,ArrowRight:1-index,Home:0,End:1}[event.key];
  if(target===undefined)return;
  event.preventDefault();
  setMode(el.modeBtns[target].dataset.mode,true);
 });
});
for(const pair of sharedFields){
 pair.forEach((id,index)=>{
  const field=$(id);
  const counterpart=$(pair[1-index]);
  function update(){
   counterpart.value=field.value;
   calculate();
  }
  field.addEventListener(field.tagName==='SELECT'?'change':'input',update);
  if(field.tagName!=='SELECT')field.addEventListener('change',()=>{formatInput(field);update()});
 });
}
for(const id of ['allPeople','savings','cars','homes'])$(id).addEventListener('input',calculate);
for(const id of ['solidFuel','usesOwnHome','secondHomeException'])$(id).addEventListener('change',calculate);
function focusMember(index){
 el.memberList.querySelector('[data-index="'+index+'"][data-key="type"]')?.focus();
}
el.add.addEventListener('click',()=>{
 if(members.length>=12)return;
 members.push({type:'adult',active:true,vulnerable:false,plan:false});
 renderMembers();
 syncAllPeople();
 calculate();
 focusMember(members.length-1);
});
function focusResult(){
 const panel=$('vysledek');
 panel.scrollIntoView({block:'start'});
 panel.focus({preventScroll:true});
}
$('mobileSummaryLink').addEventListener('click',event=>{event.preventDefault();focusResult()});
el.form.addEventListener('submit',event=>{
 event.preventDefault();
 formSubmitted=true;
 const result=calculate();
 if(!result){
  setText('resultAnnouncement',el.explanation.textContent);
  firstIssue?.focus();
  return;
 }
 setText('resultAnnouncement','Orientační výsledek '+money(result.total)+' měsíčně.');
 focusResult();
});
$('checkAssets').addEventListener('click',()=>{
 setMode('advanced',true);
 $('kalkulacka').scrollIntoView({block:'start'});
});
$('exampleBtn').addEventListener('click',()=>resetForm(true));
$('clearExample').addEventListener('click',()=>resetForm());
el.reset.addEventListener('click',()=>resetForm());
function updateDeadline(){if(el.days)el.days.textContent=new Date()>=new Date(2027,0,1)?'Model říjen–prosinec 2026 (archivní období)':'Pravidla platná 1. 10.–31. 12. 2026'}
if(el.menu&&el.mobile){el.menu.addEventListener('click',()=>{const open=el.menu.getAttribute('aria-expanded')==='true';el.menu.setAttribute('aria-expanded',String(!open));el.mobile.hidden=open});el.mobile.addEventListener('click',e=>{if(e.target.closest('a')){el.mobile.hidden=true;el.menu.setAttribute('aria-expanded','false')}})}
function initDistricts(){
 for(const id of ['basicRegion','region']){
   const select=$(id);
   if(!select)throw new Error('Chybí výběr okresu: '+id);
   const groups=new Map();
   for(const name of LEGAL.names){
     const groupName=NORM[name].group;
     if(!groups.has(groupName)){const optgroup=document.createElement('optgroup');optgroup.label=groupName;select.appendChild(optgroup);groups.set(groupName,optgroup);}
     const option=document.createElement('option');option.value=name;option.textContent=name;groups.get(groupName).appendChild(option);
   }
 }
}
initDistricts();applyTemplate(null);updateDeadline();calculate();
window.__RV_SD87__={engine,templates,LIFE,NORM,LEGAL};
})();