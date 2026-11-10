/* RV3 calculator UI. Pure math stays in salary-engine.js (verbatim 2026 formulas). */
(()=>{'use strict';const form=document.getElementById('rv3-salary-form');if(!form)return;
const engine=window.RV3Salary;if(!engine){document.getElementById('rv3-error').textContent='Výpočetní modul se nenačetl.';document.getElementById('rv3-error').hidden=false;return}
const el=id=>document.getElementById('rv3-'+id),money=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(n))+' Kč',sign=n=>(n<0?'−':n>0?'+':'')+money(Math.abs(n)),fmt=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(n);
const parse=s=>{const x=String(s??'').trim().replace(/[\s\u00a0]/g,'').replace(',','.');return x===''?NaN:Number(x)};
const toNumber=id=>parse(el(id).value),bool=id=>el(id).checked;
const advanced=el('advanced'),count=el('children');
function syncChildren(){const n=Number(count.value);el('child-first').checked=n>=1;el('child-second').checked=n>=2;el('child-third').value=Math.max(0,n-2)}
function clearError(){el('error').hidden=true;el('error').textContent='';form.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'))}
function invalid(id,msg){el(id)?.setAttribute('aria-invalid','true');el('error').hidden=false;el('error').textContent=msg;el('result-content').hidden=true;el('result-empty').hidden=false;return false}
function read(){
 const adv=advanced.open;
 return {mode:adv?'advanced':'basic',grossBase:toNumber('gross'),bonus:adv?toNumber('bonus'):0,otherDeductions:adv?toNumber('other'):0,
 taxDeclaration:bool('declaration'),disabilityDiscount:adv?toNumber('disability'):0,ztpDiscount:adv&&bool('ztp'),pensionerDiscount:adv&&bool('pensioner'),healthMinimum:adv&&bool('health-minimum'),
 applySocialCap:!adv||bool('social-cap'),yearSocialBase:adv?toNumber('year-base'):0,
 children:adv?{first:bool('child-first'),second:bool('child-second'),thirdPlus:Math.min(10,Math.max(0,Math.round(toNumber('child-third')||0)))}:{first:Number(count.value)>=1,second:Number(count.value)>=2,thirdPlus:Math.max(0,Number(count.value)-2)}
 }
}
function valid(v){
 if(!Number.isFinite(v.grossBase)||v.grossBase<=0||v.grossBase>1e8)return invalid('gross','Zadejte hrubou mzdu od 1 Kč do 100 milionů Kč.');
 if(!Number.isFinite(v.bonus)||v.bonus<0||v.bonus>1e8)return invalid('bonus','Prémie musí být od 0 do 100 milionů Kč.');
 if(!Number.isFinite(v.otherDeductions)||v.otherDeductions<0||v.otherDeductions>1e8)return invalid('other','Další srážky musí být od 0 do 100 milionů Kč.');
 if(!Number.isFinite(v.yearSocialBase)||v.yearSocialBase<0||v.yearSocialBase>1e9)return invalid('year-base','Zadejte dosavadní roční základ od 0 do 1 miliardy Kč.');
 if(advanced.open&&(!Number.isFinite(toNumber('child-third'))||toNumber('child-third')<0||toNumber('child-third')>10))return invalid('child-third','Počet třetích a dalších dětí musí být celé číslo 0 až 10.');
 return true
}
function put(id,s){el(id).textContent=s}
function draw(r){
 put('net',money(r.netSalary));put('gross-out',money(r.gross));put('social-out',sign(-r.socialEmployee));put('health-out',sign(-r.healthEmployee));put('tax-out',sign(-r.taxAfterDiscounts));
 put('bonus-out',sign(r.taxBonus));el('bonus-row').hidden=r.taxBonus===0;put('cost',money(r.totalCost));put('ratio',fmt(r.netGrossRatio)+' % hrubé mzdy');
 el('after-row').hidden=r.otherDeductions===0;put('after',money(r.afterOther));put('employer-social',money(r.socialEmployer));put('employer-health',money(r.healthEmployer));
 put('tax-before',money(r.taxBeforeDiscounts));put('tax-discount',money(r.personalDiscounts));put('child-credit',money(r.childrenCredit));
 put('tax-base',money(r.baseForTax));put('social-base',money(r.socialBase));
 let note='Model běžného pracovního poměru za celý měsíc.';
 if(!r.taxDeclaration)note+=' Bez měsíčních daňových slev.';
 if(r.taxBonus>0)note+=' Výsledek zahrnuje daňový bonus '+money(r.taxBonus)+'.';
 if(r.gross<engine.CONFIG.minimumWage&&!r.healthMinimum)note+=' U nízké mzdy ověřte, zda se vás týká povinný dopočet zdravotního minima.';
 if(r.socialCapUsed)note+=' Vypočteno se zbývající částí ročního sociálního maxima.';
 if(r.highTaxBase>0)note+=' Část základu spadá do 23% pásma.';
 put('context',note);el('result-content').hidden=false;el('result-empty').hidden=true
}
function update(){clearError();const v=read();if(valid(v))draw(engine.calculate(v))}
form.addEventListener('input',e=>{if(e.target===count)syncChildren();update()});
form.addEventListener('change',e=>{if(e.target===count)syncChildren();update()});
form.addEventListener('submit',e=>{e.preventDefault();update();if(!el('error').hidden)el('error').scrollIntoView({block:'center'});else if(matchMedia('(max-width:950px)').matches)el('result').scrollIntoView({block:'start',behavior:'smooth'})});
advanced.addEventListener('toggle',()=>{if(advanced.open)syncChildren();update()});
document.querySelectorAll('[data-rv3-gross]').forEach(b=>b.addEventListener('click',()=>{el('gross').value=b.dataset.rv3Gross;count.value=b.dataset.rv3Kids||'0';syncChildren();update()}));
el('reset').addEventListener('click',()=>{form.reset();advanced.open=false;el('gross').value='45000';count.value='0';syncChildren();update()});
syncChildren();update()
})();
