(function(){
'use strict';
var form=document.getElementById('supportForm');
if(!form)return;
var mode='basic',childrenBox=document.getElementById('childrenBox'),errorBox=document.getElementById('formErrors');
var fmt=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
var money=function(n){return fmt.format(Math.max(0,Math.round(n)))+' Kč';};
var num=function(id){var el=document.getElementById(id);return el?Number(String(el.value).replace(',','.')):0;};
var clamp=function(n,min,max){return Math.min(max,Math.max(min,n));};
var rates=[[14,12,10,8],[16,14,12,10],[18,16,14,12],[20,18,16,14]];
function stage(age){return age<=5?0:age<=10?1:age<=15?2:3;}
function stageName(age){return ['předškolní věk','I. stupeň ZŠ','II. stupeň ZŠ','střední škola a vyšší vzdělávání'][stage(age)];}
function rate(age,obligations){return rates[stage(age)][clamp(obligations,1,4)-1]/100;}
function controlShare(obligations){return obligations===2?.66:obligations===3?.55:obligations>=4?.50:0;}
function careFactor(nights,paysOrdinary){if(!paysOrdinary)return 1;return 1-clamp(nights,0,30.4)/30.4;}
function setText(id,text){var el=document.getElementById(id);if(el)el.textContent=text;}
function resultStatus(text,warning){var el=document.getElementById('resultStatus');el.textContent=text;el.classList.toggle('warning',!!warning);}
function showErrors(errors){errorBox.innerHTML='';if(!errors.length){errorBox.classList.remove('is-visible');return false;}var ul=document.createElement('ul');errors.forEach(function(e){var li=document.createElement('li');li.textContent=e;ul.appendChild(li);});errorBox.appendChild(ul);errorBox.classList.add('is-visible');return true;}
function range(amount){return [Math.max(0,amount*.9),amount*1.1];}
function renderCommon(amount,low,high,share,care,ageImpact,childrenImpact,insight,warning,direction){
setText('resultLabel',direction||'Orientační měsíční výživné');setText('mainAmount',money(amount));setText('resultDirection',direction?'Čistý rozdíl po modelovém výpočtu obou rodičů.':'Doporučený střed podle zadaných údajů.');setText('rangeLow',money(low));setText('rangeHigh',money(high));setText('incomeShare',share);setText('careImpact',care);setText('ageImpact',ageImpact);setText('childrenImpact',childrenImpact);setText('resultInsight',insight);var w=document.getElementById('resultWarning');w.textContent=warning;w.hidden=!warning;resultStatus(warning?'Výsledek vyžaduje kontext':'Orientační výsledek',!!warning);setText('scenarioLow',money(low));setText('scenarioMid',money(amount));setText('scenarioHigh',money(high));document.getElementById('resultPanel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}
function calculateBasic(){
var income=num('basicIncome'),age=num('basicAge'),obligations=num('basicObligations'),nights=num('basicNights'),pays=document.getElementById('basicCareCosts').checked,errors=[];
if(!Number.isFinite(income)||income<0||income>5000000)errors.push('Čistý měsíční příjem zadejte v rozmezí 0 až 5 000 000 Kč.');
if(!Number.isFinite(age)||age<0||age>26)errors.push('Věk dítěte zadejte v rozmezí 0 až 26 let.');
if(!Number.isInteger(obligations)||obligations<1||obligations>4)errors.push('Vyberte celkový počet vyživovaných dětí od 1 do 4.');
if(!Number.isFinite(nights)||nights<0||nights>30.4)errors.push('Počet nocí musí být od 0 do 30,4 za měsíc.');
if(showErrors(errors))return;
var r=rate(age,obligations),pre=income*r,factor=careFactor(nights,pays),amount=pre*factor,rg=range(amount),carePct=Math.round((1-factor)*100),warning='';
if(income===0)warning='Nulový aktuální příjem automaticky neznamená nulové výživné. Soud může posuzovat také potenciální příjem, majetek a důvod poklesu výdělku.';
else if(income>=200000)warning='U nadstandardního příjmu nemusí být vztah mezi příjmem a výživným prostě lineární. Výsledek proto berte jen jako výchozí orientaci.';
else if(age>=18)warning='U zletilého dítěte záleží zejména na tom, zda se stále není schopné samo živit, kde studuje, jaké má příjmy a skutečné náklady.';
var insight='Tabulka přiřadila '+stageName(age)+' a sazbu '+Math.round(r*100)+' % z příjmu. '+(carePct?'Pravidelná osobní péče snížila modelovou peněžní částku o '+carePct+' %.':'Rozsah péče výsledek nesnížil.');
renderCommon(amount,rg[0],rg[1],Math.round(r*factor*1000)/10+' %','− '+carePct+' %',stageName(age),obligations+' vyživovací '+(obligations===1?'povinnost':'povinnosti'),insight,warning,'');
}
function childRows(){return Array.from(childrenBox.querySelectorAll('.v-child'));}
function calculateAdvanced(){
var incomeA=num('incomeA'),incomeB=num('incomeB'),extraObligations=num('extraObligations'),rows=childRows(),errors=[];
if(!Number.isFinite(incomeA)||incomeA<0||incomeA>5000000)errors.push('Příjem rodiče A zadejte v rozmezí 0 až 5 000 000 Kč.');
if(!Number.isFinite(incomeB)||incomeB<0||incomeB>5000000)errors.push('Příjem rodiče B zadejte v rozmezí 0 až 5 000 000 Kč.');
if(!Number.isInteger(extraObligations)||extraObligations<0||extraObligations>3)errors.push('Další vyživovací povinnosti musí být od 0 do 3.');
var obligations=rows.length+extraObligations;if(obligations>4)errors.push('Doporučující tabulka je určena nejvýše pro 4 vyživovací povinnosti celkem.');
var data=rows.map(function(row,i){var age=Number(row.querySelector('[data-age]').value),nightsA=Number(String(row.querySelector('[data-nights]').value).replace(',','.')),extra=Number(row.querySelector('[data-extra]').value),paidA=Number(row.querySelector('[data-paid-a]').value);if(!Number.isFinite(age)||age<0||age>26)errors.push('U dítěte '+(i+1)+' zadejte věk 0 až 26 let.');if(!Number.isFinite(nightsA)||nightsA<0||nightsA>30.4)errors.push('U dítěte '+(i+1)+' zadejte 0 až 30,4 nocí u rodiče A.');if(!Number.isFinite(extra)||extra<0||extra>500000)errors.push('Mimořádné náklady dítěte '+(i+1)+' musí být od 0 do 500 000 Kč.');if(!Number.isFinite(paidA)||paidA<0||paidA>100)errors.push('Přímá úhrada rodiče A u dítěte '+(i+1)+' musí být 0 až 100 %.');return{age:age,nightsA:nightsA,extra:extra,paidA:paidA};});
if(showErrors(errors))return;
var totalIncome=incomeA+incomeB,expectedA=totalIncome?incomeA/totalIncome:.5,totalA=0,totalB=0,extraAdjust=0,parts=[];
data.forEach(function(d){var r=rate(d.age,obligations),a=incomeA*r*(1-clamp(d.nightsA,0,30.4)/30.4),b=incomeB*r*(clamp(d.nightsA,0,30.4)/30.4);totalA+=a;totalB+=b;var adj=d.extra*(expectedA-d.paidA/100);extraAdjust+=adj;parts.push({rate:r,a:a,b:b,adj:adj,stage:stageName(d.age)});});
var share=controlShare(obligations),scaled=false;if(share){var capA=incomeA*(1-share),capB=incomeB*(1-share);if(totalA>capA&&totalA>0){var sa=capA/totalA;parts.forEach(function(p){p.a*=sa;});totalA=capA;scaled=true;}if(totalB>capB&&totalB>0){var sb=capB/totalB;parts.forEach(function(p){p.b*=sb;});totalB=capB;scaled=true;}}
var net=totalA-totalB+extraAdjust,direction=net>=0?'Rodič A → rodič B':'Rodič B → rodič A',amount=Math.abs(net),rg=range(amount),careAvg=data.reduce(function(s,d){return s+d.nightsA;},0)/data.length,avgRate=parts.reduce(function(s,p){return s+p.rate;},0)/parts.length,warning='';
if(incomeA===0||incomeB===0)warning='Nulový příjem jednoho rodiče vyžaduje individuální posouzení jeho pracovních možností, majetku a důvodu, proč příjem nemá.';else if(Math.max(incomeA,incomeB)>=200000)warning='U nadstandardních příjmů nelze mechanicky předpokládat přímou úměru mezi příjmem a výživným.';else if(scaled)warning='Součet modelových povinností zasáhl procentní kontrolní hranici Ministerstva spravedlnosti. Pevná spodní kontrolní částka se v této kalkulačce záměrně nepředstírá bez individuálního ověření.';
var insight='Pro každého rodiče byla zvlášť vypočtena tabulková povinnost, snížena podle faktické péče a následně porovnána. U pravidelných mimořádných nákladů se zohlednil poměr příjmů a už zadaná přímá úhrada rodiče A.';
renderCommon(amount,rg[0],rg[1],Math.round(avgRate*1000)/10+' %','A: '+Math.round(careAvg/30.4*100)+' % nocí',data.map(function(d){return stageName(d.age);}).join(', '),obligations+' celkem',insight,warning,direction);
setText('resultDirection',direction+' • orientační čistý rozdíl za měsíc');
}
function setMode(next){mode=next;document.querySelectorAll('.v-mode').forEach(function(b){var active=b.dataset.mode===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});document.getElementById('basicFields').hidden=mode!=='basic';document.getElementById('advancedFields').hidden=mode!=='advanced';showErrors([]);}
document.querySelectorAll('.v-mode').forEach(function(b){b.addEventListener('click',function(){setMode(b.dataset.mode);});});
function updateChildLabels(){childRows().forEach(function(row,i){row.querySelector('.child-title').textContent='Dítě '+(i+1);row.querySelector('.remove-child').hidden=childRows().length===1;});}
function addChild(){if(childRows().length>=4)return;var index=childRows().length+1,article=document.createElement('article');article.className='v-child';article.innerHTML='<div class="v-child-head"><strong class="child-title">Dítě '+index+'</strong><button class="remove-child" type="button">Odebrat</button></div><div class="v-fields"><label class="v-field"><span>Věk dítěte</span><span class="v-input"><input data-age type="number" min="0" max="26" step="1" value="8" inputmode="numeric"><b>let</b></span></label><label class="v-field"><span>Nocí u rodiče A</span><span class="v-input"><input data-nights type="number" min="0" max="30.4" step="0.5" value="15.2" inputmode="decimal"><b>/ měsíc</b></span></label><label class="v-field"><span>Pravidelné zvláštní náklady</span><span class="v-input"><input data-extra type="number" min="0" max="500000" step="100" value="0" inputmode="numeric"><b>Kč</b></span></label><label class="v-field v-field-wide"><span>Kolik z těchto nákladů platí přímo rodič A</span><span class="v-input"><input data-paid-a type="number" min="0" max="100" step="1" value="50" inputmode="numeric"><b>%</b></span><small>Například školné, pravidelná terapie nebo zdravotní pomůcky; běžné jídlo a oblečení sem nepatří.</small></label></div>';childrenBox.appendChild(article);updateChildLabels();}
document.getElementById('addChild').addEventListener('click',addChild);childrenBox.addEventListener('click',function(e){if(e.target.classList.contains('remove-child')&&childRows().length>1){e.target.closest('.v-child').remove();updateChildLabels();}});
form.addEventListener('submit',function(e){e.preventDefault();mode==='basic'?calculateBasic():calculateAdvanced();});
document.getElementById('resetForm').addEventListener('click',function(){form.reset();while(childRows().length>1)childRows().pop().remove();updateChildLabels();setMode('basic');setText('mainAmount','4 800 Kč');setText('rangeLow','4 300 Kč');setText('rangeHigh','5 300 Kč');setText('resultLabel','Orientační měsíční výživné');setText('resultDirection','Ukázkový výsledek – zadejte vlastní údaje.');setText('incomeShare','16 %');setText('careImpact','− 20 %');setText('ageImpact','I. stupeň ZŠ');setText('childrenImpact','1 povinnost');setText('resultInsight','Výsledek se po výpočtu rozloží na vliv věku, počtu dětí a osobní péče.');document.getElementById('resultWarning').hidden=true;resultStatus('Připraveno',false);});
updateChildLabels();setMode('basic');
})();
