/* Rosný bod V8 — UI only; physics stays in rosny-bod-core.js. */
(function(){'use strict';
const core=window.RVDewPointCore;if(!core)return;
const $=id=>document.getElementById(id),fmt=(n,d=1)=>n.toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d});
const parse=value=>{const s=String(value??'').trim().replace(/\s/g,'').replace(',','.');if(!s)return NaN;const n=Number(s);return Number.isFinite(n)?n:NaN};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const inputs={air:$('air'),rh:$('rh'),surface:$('surface')};let mode='dew';
const put=(id,value)=>{const el=$(id);if(el)el.textContent=value};
function invalidate(message){
 $('resultHeadline').innerHTML='Zkontrolujte <strong>zadání</strong>';
 put('resultHint',message);put('glassStatus','Nejprve opravte vstupní hodnoty.');put('resultState','NEPLATNÉ ZADÁNÍ');
 for(const id of ['quickDew','kpiDew','kpiVapor','kpiAbs','kpiMargin','dewLegend','surfaceLegend','dewLabel','surfaceLabel','thresholdValue','scenarioCurrent','scenario40','scenario50','scenario60','scenario70','scenario80'])put(id,'—');
 put('meaningTitle','Výsledek není aktuální.');put('meaningText',message);put('marginHint','Čeká na platné hodnoty.');
 $('glassPane').classList.remove('is-wet');$('thresholdWrap').hidden=true;put('formula','Zadejte platné vstupy. Předchozí výsledek byl odstraněn.');put('status',message);
}
function drawScale(dew,surface,hasSurface){
 const min=Math.min(dew,surface)-4,max=Math.max(dew,surface)+4;
 const at=n=>clamp((n-min)/(max-min)*84+8,8,92)+'%';
 $('dewMarker').style.left=at(dew);$('surfaceMarker').style.left=at(surface);
 $('dewFill').style.width=at(dew);
 put('dewLabel','Rosný bod '+fmt(dew)+' °C');put('surfaceLabel',(hasSurface?'Povrch ':'Vzduch ')+fmt(surface)+' °C');
 put('scaleCaption',hasSurface?'Rosný bod × měřený povrch':'Rosný bod × vzduch');
}
function drawScenarios(t,rh){
 put('scenarioCurrent',fmt(rh,0)+' % RH');
 for(const preset of [40,50,60,70,80]){
  const calc=core.calculate({airTempC:t,rhPct:preset});put('scenario'+preset,calc.ok?fmt(calc.dewPointC)+' °C':'—');
 }
 document.querySelectorAll('[data-rh-preset]').forEach(button=>{
  const active=Number(button.dataset.rhPreset)===rh;button.classList.toggle('is-current',active);button.setAttribute('aria-pressed',String(active));
 });
}
function render(r,scroll){
 const hasSurface=mode==='surface';
 const surface=hasSurface?r.surfaceTempC:r.airTempC;
 const dry=!hasSurface||!r.condensationPossible;
 const dew=fmt(r.dewPointC)+' °C';
 $('resultHeadline').innerHTML='Rosný bod je <strong>'+dew+'</strong>';
 put('resultHint','Při teplotě '+fmt(r.airTempC)+' °C a relativní vlhkosti '+fmt(r.rhPct,0)+' %.');
 put('resultState',hasSurface?(r.condensationPossible?'KONDENZACE MOŽNÁ':'POVRCH NAD HRANICÍ'):'ROSNÝ BOD VYPOČTEN');
 put('quickDew',dew);put('kpiDew',dew);put('kpiVapor',fmt(r.vaporKPa,2)+' kPa');put('kpiAbs',fmt(r.absoluteHumidityGm3)+' g/m³');
 put('dewLegend',dew);put('surfaceLegend',hasSurface?fmt(surface)+' °C':'nezadán');
 $('glassPane').classList.toggle('is-wet',hasSurface&&r.condensationPossible);
 put('glassStatus',!hasSurface?'Změřte i povrch a ověřte kondenzaci.':r.condensationPossible?'Povrch je na nebo pod hranicí.':'Povrch zůstává nad hranicí.');
 if(!hasSurface){
  put('kpiMargin','—');put('marginHint','Zapněte kontrolu povrchu.');put('meaningTitle','Co tato teplota znamená?');
  put('meaningText','Povrch ochlazený přibližně na '+dew+' nebo níž může za daných podmínek začít rosit. Samotný rosný bod neříká, jak teplé je vaše okno či stěna.');
  $('thresholdWrap').hidden=true;
 }else{
  put('kpiMargin',(r.marginC>=0?'+':'')+fmt(r.marginC)+' °C');
  put('marginHint',r.condensationPossible?'Podmínky pro kondenzaci jsou možné.':'Povrch je nad rosným bodem.');
  put('meaningTitle',r.condensationPossible?'Povrch je v oblasti možné kondenzace.':'Povrch je nyní nad rosným bodem.');
  put('meaningText',r.condensationPossible?'Povrch o teplotě '+fmt(surface)+' °C je na nebo pod rosným bodem '+dew+'. Při odpovídajících podmínkách na něm může kondenzovat voda.':'Naměřený povrch má rezervu +'+fmt(r.marginC)+' °C vůči rosnému bodu. Odhad relativní vlhkosti těsně u povrchu je '+fmt(r.surfaceRhDisplayPct,0)+' %.');
  $('thresholdWrap').hidden=false;
  const threshold=100*core.saturationVaporPressureKPa(surface)/core.saturationVaporPressureKPa(r.airTempC);
  if(threshold>100){put('thresholdValue','nad 100 %');put('thresholdText','Při současné teplotě vzduchu a povrchu hranice kondenzace vychází nad 100 % RH; zadaný povrch je teplejší než vzduch. Jde o matematický model, ne o záruku chování konstrukce.');}
  else {put('thresholdValue',fmt(threshold,1)+' % RH');put('thresholdText','Při zachování teploty vzduchu '+fmt(r.airTempC)+' °C a povrchu '+fmt(surface)+' °C je to orientační hranice relativní vlhkosti vzduchu pro dosažení rosného bodu.');}
 }
 drawScale(r.dewPointC,surface,hasSurface);
 drawScenarios(r.airTempC,r.rhPct);
 $('formula').innerHTML='<b>Výpočet:</b> Magnusova aproximace (Alduchov–Eskridge); tlak vodní páry '+fmt(r.vaporKPa,3)+' kPa a rosný bod '+fmt(r.dewPointC,2)+' °C. Orientační model za předpokladu rovnováhy.';
 put('status','Výsledek byl aktualizován.');if(scroll)document.getElementById('vysledek')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function calculate(scroll=false){
 const values={airTempC:parse(inputs.air.value),rhPct:parse(inputs.rh.value)};
 if(mode==='surface')values.surfaceTempC=parse(inputs.surface.value);
 const r=core.calculate(values);if(!r.ok){invalidate(r.error);return false;}render(r,scroll);return true;
}
function setMode(next){
 if(next!=='dew'&&next!=='surface')return;
 mode=next;$('surfaceField').hidden=mode!=='surface';
 document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
 calculate();
}
for(const id of ['air','rh','surface']){
 const input=$(id),slider=$(id+'Range');
 input.addEventListener('input',()=>{const n=parse(input.value);if(Number.isFinite(n)&&n>=Number(slider.min)&&n<=Number(slider.max))slider.value=n;calculate();});
 slider.addEventListener('input',()=>{input.value=slider.value;calculate();});
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('[data-rh-preset]').forEach(b=>b.addEventListener('click',()=>{inputs.rh.value=b.dataset.rhPreset;$('rhRange').value=b.dataset.rhPreset;calculate();}));
$('dpForm').addEventListener('submit',e=>{e.preventDefault();calculate(true)});
$('resetBtn').addEventListener('click',()=>{for(const [id,val] of [['air','22'],['rh','60'],['surface','17']]){$(id).value=val;$(id+'Range').value=val;}setMode('dew');calculate();});
calculate();
})();
