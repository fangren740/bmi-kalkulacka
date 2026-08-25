(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var ids=['annualKm','petrolConsumption','petrolPrice','dieselConsumption','dieselPrice','evConsumption','homePrice','publicPrice','publicShare','ownershipYears','petrolPurchase','petrolResale','petrolService','petrolOther','dieselPurchase','dieselResale','dieselService','dieselOther','evPurchase','evResale','evService','evOther','evSetup'];
var el={};ids.forEach(function(id){el[id]=$(id)});
var names={petrol:'Benzín',diesel:'Diesel',ev:'Elektro'};
var order=['petrol','diesel','ev'];
var colors={petrol:'#f0a33b',diesel:'#5e9fe2',ev:'#42c986'};
var lastOwnership=null;
function num(v){var s=String(v==null?'':v).trim().replace(/\s/g,'').replace(',','.').replace(/[^0-9.\-]/g,'');return s===''?NaN:Number(s)}
function val(id){return num(el[id]&&el[id].value)}
function safe(v,fallback){return Number.isFinite(v)?v:fallback}
function money(v){return Math.round(v).toLocaleString('cs-CZ')+' Kč'}
function money1(v){return v.toLocaleString('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1})+' Kč'}
function dec(v,d){return v.toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d})}
function text(id,v){var n=$(id);if(n)n.textContent=v}
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function operatingModel(kmOverride){
 var annual=safe(kmOverride,safe(val('annualKm'),0));
 var share=clamp(safe(val('publicShare'),0),0,100)/100;
 var home=safe(val('homePrice'),0),pub=safe(val('publicPrice'),0);
 var blend=home*(1-share)+pub*share;
 var rows={
  petrol:{key:'petrol',name:names.petrol,cons:safe(val('petrolConsumption'),0),unit:safe(val('petrolPrice'),0)},
  diesel:{key:'diesel',name:names.diesel,cons:safe(val('dieselConsumption'),0),unit:safe(val('dieselPrice'),0)},
  ev:{key:'ev',name:names.ev,cons:safe(val('evConsumption'),0),unit:blend}
 };
 order.forEach(function(k){var r=rows[k];r.per100=r.cons*r.unit;r.perKm=r.per100/100;r.annual=r.perKm*annual});
 return {annualKm:annual,share:share,home:home,public:pub,blend:blend,rows:rows,sorted:order.map(function(k){return rows[k]}).sort(function(a,b){return a.annual-b.annual})};
}
function validateOperating(){
 var issues=[];var annual=val('annualKm');
 if(!Number.isFinite(annual)||annual<500||annual>100000)issues.push('Roční nájezd zadejte mezi 500 a 100 000 km.');
 [['petrolConsumption','Spotřeba benzínu'],['petrolPrice','Cena benzínu'],['dieselConsumption','Spotřeba dieselu'],['dieselPrice','Cena nafty'],['evConsumption','Spotřeba elektromobilu'],['homePrice','Domácí cena elektřiny'],['publicPrice','Veřejná cena elektřiny']].forEach(function(x){var v=val(x[0]);if(!Number.isFinite(v)||v<=0)issues.push(x[1]+' musí být větší než nula.');});
 var box=$('formError');if(box){box.hidden=issues.length===0;box.textContent=issues.join(' ')}return issues.length===0;
}
function renderOperating(){
 if(!validateOperating())return;
 var m=operatingModel();var sorted=m.sorted,w=sorted[0],second=sorted[1];
 text('publicShareLabel',Math.round(m.share*100)+' %');text('evBlendPrice',dec(m.blend,2)+' Kč/kWh');
 text('petrol100',money1(m.rows.petrol.per100));text('diesel100',money1(m.rows.diesel.per100));text('ev100',money1(m.rows.ev.per100));
 text('heroAnnualKm',Math.round(m.annualKm).toLocaleString('cs-CZ')+' km/rok');text('heroPetrol100',money1(m.rows.petrol.per100));text('heroDiesel100',money1(m.rows.diesel.per100));text('heroEv100',money1(m.rows.ev.per100));text('heroWinner',w.name);text('heroWinnerDelta','o '+money1(second.per100-w.per100)+' / 100 km před druhým místem');
 var max100=Math.max(m.rows.petrol.per100,m.rows.diesel.per100,m.rows.ev.per100),min100=Math.min(m.rows.petrol.per100,m.rows.diesel.per100,m.rows.ev.per100),range=Math.max(1,max100-min100);
 order.forEach(function(k){var pct=45+55*(max100-m.rows[k].per100)/range;var b=$('hero'+k.charAt(0).toUpperCase()+k.slice(1)+'Bar');if(b)b.style.width=pct+'%'});
 text('resultScope',Math.round(m.annualKm).toLocaleString('cs-CZ')+' km/rok');text('winnerName',w.name);text('winnerCost100',money1(w.per100)+' / 100 km');text('winnerText','Při zadané spotřebě a ceně energie vychází ročně na '+money(w.annual)+'. To je čistě provozní vrstva bez ceny auta a servisu.');text('winnerDeltaAnnual',money(second.annual-w.annual)+' / rok');text('winnerDeltaPer100',money1(second.per100-w.per100)+' na každých 100 km');
 var rank=$('rankList');if(rank){rank.replaceChildren();sorted.forEach(function(r){var row=document.createElement('div');row.className='ptx-rank-row '+r.key;var s=document.createElement('span');s.textContent=r.name;var i=document.createElement('i');var b=document.createElement('b');b.style.width=(42+58*(max100-r.per100)/range)+'%';i.appendChild(b);var st=document.createElement('strong');st.textContent=money(r.annual)+'/rok';row.append(s,i,st);rank.appendChild(row)})}
 var homePart=m.blend>0?m.home*(1-m.share)/m.blend:0;var publicPart=m.blend>0?m.public*m.share/m.blend:0;
 var homeW=(1-m.share)*100,pubW=m.share*100;var mh=$('mixHome'),mp=$('mixPublic'),mm=$('mixMarker');if(mh)mh.style.width=homeW+'%';if(mp)mp.style.width=pubW+'%';if(mm)mm.style.left=homeW+'%';
 text('mixHomeCost',money1(m.rows.ev.cons/100*m.home*m.annualKm*(1-m.share)));text('mixPublicCost',money1(m.rows.ev.cons/100*m.public*m.annualKm*m.share));text('mixBlendCost',dec(m.blend,2)+' Kč/kWh');
 if(lastOwnership)renderOwnership();
}
function ownershipInputsComplete(){return ['petrolPurchase','petrolResale','dieselPurchase','dieselResale','evPurchase','evResale'].every(function(id){var v=val(id);return Number.isFinite(v)&&v>=0})}
function buildOwnership(kmOverride){
 var op=operatingModel(kmOverride);var years=safe(val('ownershipYears'),5);var configs={
 petrol:{purchase:val('petrolPurchase'),resale:val('petrolResale'),service:safe(val('petrolService'),0),other:safe(val('petrolOther'),0),setup:0},
 diesel:{purchase:val('dieselPurchase'),resale:val('dieselResale'),service:safe(val('dieselService'),0),other:safe(val('dieselOther'),0),setup:0},
 ev:{purchase:val('evPurchase'),resale:val('evResale'),service:safe(val('evService'),0),other:safe(val('evOther'),0),setup:safe(val('evSetup'),0)}
 };
 var rows=order.map(function(k){var c=configs[k],o=op.rows[k];var dep=c.purchase-c.resale;var energy=o.annual*years;var extras=(c.service+c.other)*years+c.setup;var total=dep+energy+extras;return {key:k,name:names[k],dep:dep,energy:energy,extras:extras,total:total,annualEq:total/years,perKm:total/(op.annualKm*years),config:c,energyPerKm:o.perKm}}).sort(function(a,b){return a.total-b.total});
 return {years:years,annualKm:op.annualKm,totalKm:op.annualKm*years,rows:rows,byKey:Object.fromEntries(rows.map(function(r){return [r.key,r]}))};
}
function validateOwnership(){
 var issues=[];var years=val('ownershipYears');if(!Number.isFinite(years)||years<1||years>15)issues.push('Dobu vlastnictví zadejte mezi 1 a 15 lety.');
 order.forEach(function(k){var p=val(k+'Purchase'),r=val(k+'Resale');if(Number.isFinite(p)&&Number.isFinite(r)&&r>p)issues.push(names[k]+': prodejní cena nemůže být vyšší než pořizovací cena v tomto jednoduchém modelu.');['Service','Other'].forEach(function(s){var v=val(k+s);if(Number.isFinite(v)&&v<0)issues.push(names[k]+': roční náklady nemohou být záporné.')})});var evs=val('evSetup');if(Number.isFinite(evs)&&evs<0)issues.push('Jednorázový náklad EV nemůže být záporný.');
 var box=$('ownershipError');if(box){box.hidden=issues.length===0;box.textContent=issues.join(' ')}return issues.length===0;
}
function renderOwnership(){
 if(!ownershipInputsComplete()||!validateOwnership()){lastOwnership=null;var out=$('ownershipResult');if(out)out.hidden=true;renderBreak(null);return}
 var m=buildOwnership();lastOwnership=m;var out=$('ownershipResult');if(out)out.hidden=false;var w=m.rows[0],second=m.rows[1];text('ownWinner',w.name+' vychází nejníž');text('ownPeriod',m.years+' let · '+Math.round(m.totalKm).toLocaleString('cs-CZ')+' km');text('ownGap',money(second.total-w.total));
 var extrasUsed=order.some(function(k){var r=m.byKey[k];return r.extras>0});text('ownScope','hodnota + energie'+(extrasUsed?' + zadané další náklady':''));text('ownDecision','V tomto zadaném modelu je '+w.name+' nejlevnější o '+money(second.total-w.total)+' proti druhému místu. Pokud je rozdíl malý proti ceně auta, testujte konzervativnější prodejní cenu a skutečný servisní rozpočet.');
 var max=Math.max.apply(null,m.rows.map(function(r){return r.total}));var box=$('costRibbons');if(box){box.replaceChildren();m.rows.forEach(function(r){var row=document.createElement('div');row.className='ptx-cost-row';var name=document.createElement('span');name.textContent=r.name;var ribbon=document.createElement('div');ribbon.className='ptx-ribbon';var dep=document.createElement('i'),energy=document.createElement('b'),extra=document.createElement('em');var total=Math.max(1,r.total);dep.style.width=(r.dep/total*100)+'%';energy.style.width=(r.energy/total*100)+'%';extra.style.width=(r.extras/total*100)+'%';ribbon.append(dep,energy,extra);ribbon.style.width=(38+62*r.total/max)+'%';var totalEl=document.createElement('strong');totalEl.textContent=money(r.total);row.append(name,ribbon,totalEl);box.appendChild(row)})}
 renderBreak(m);
}
function pairThreshold(a,b,years){var fixedA=(a.dep+a.extras)/years,fixedB=(b.dep+b.extras)/years;var deltaVariable=a.energyPerKm-b.energyPerKm;if(Math.abs(deltaVariable)<1e-9)return null;var km=(fixedB-fixedA)/deltaVariable;return km>0&&Number.isFinite(km)?km:null}
function renderBreak(m){
 var status=$('breakStatus');var pairs=$('breakPairs');var paths={petrol:$('linePetrol'),diesel:$('lineDiesel'),ev:$('lineEv')};if(!m){Object.values(paths).forEach(function(p){if(p)p.setAttribute('d','')});if(pairs)pairs.replaceChildren();if(status)status.innerHTML='<b>Zatím čeká na ceny aut</b><span>Rozbalte „Celé vlastnictví“ a zadejte pořizovací a prodejní cenu všech tří variant.</span>';drawGrid();return}
 if(status)status.innerHTML='<b>Živý model 5 000–50 000 km/rok</b><span>Čáry drží stejné ceny aut, stejné období a mění pouze roční nájezd. Průsečík je modelový bod zlomu, ne univerzální doporučení.</span>';
 var xs=[];for(var km=5000;km<=50000;km+=2500)xs.push(km);var series={petrol:[],diesel:[],ev:[]};var min=Infinity,max=-Infinity;xs.forEach(function(km){var mm=buildOwnership(km);order.forEach(function(k){var y=mm.byKey[k].annualEq;series[k].push(y);min=Math.min(min,y);max=Math.max(max,y)})});var W=720,H=360,pad={l:42,r:22,t:26,b:32};var x=function(k){return pad.l+(k-5000)/(50000-5000)*(W-pad.l-pad.r)};var y=function(v){return pad.t+(max-v)/Math.max(1,max-min)*(H-pad.t-pad.b)};order.forEach(function(k){var d=series[k].map(function(v,i){return (i?'L':'M')+x(xs[i]).toFixed(1)+' '+y(v).toFixed(1)}).join(' ');if(paths[k])paths[k].setAttribute('d',d)});drawGrid(min,max,y);
 var markers=$('breakMarkers');if(markers)markers.replaceChildren();if(pairs)pairs.replaceChildren();[['petrol','diesel'],['petrol','ev'],['diesel','ev']].forEach(function(pair){var a=m.byKey[pair[0]],b=m.byKey[pair[1]],thr=pairThreshold(a,b,m.years);var item=document.createElement('div');item.className='ptx-break-pair';var s=document.createElement('span');s.textContent=names[pair[0]]+' × '+names[pair[1]];var st=document.createElement('strong');if(thr&&thr>=5000&&thr<=50000){st.textContent='průsečík ≈ '+(Math.round(thr/100)*100).toLocaleString('cs-CZ')+' km/rok';if(markers){var cx=x(thr),cy=(y((buildOwnership(thr).byKey[pair[0]].annualEq)));var c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',cx);c.setAttribute('cy',cy);c.setAttribute('r','7');c.setAttribute('fill','#fff');c.setAttribute('stroke','#071a33');c.setAttribute('stroke-width','3');markers.appendChild(c)}}else if(thr){st.textContent=thr<5000?'průsečík pod 5 000 km':'průsečík nad 50 000 km';}else{st.textContent='bez užitečného průsečíku';}item.append(s,st);if(pairs)pairs.appendChild(item)});
}
function drawGrid(min,max,yFn){var g=$('breakGrid');if(!g)return;g.replaceChildren();var NS='http://www.w3.org/2000/svg';for(var i=0;i<5;i++){var yy=30+i*72;var l=document.createElementNS(NS,'line');l.setAttribute('x1','42');l.setAttribute('x2','698');l.setAttribute('y1',String(yy));l.setAttribute('y2',String(yy));l.setAttribute('stroke','#dbe5eb');l.setAttribute('stroke-dasharray','5 7');g.appendChild(l)}for(var j=0;j<6;j++){var xx=42+j*(656/5);var l2=document.createElementNS(NS,'line');l2.setAttribute('x1',String(xx));l2.setAttribute('x2',String(xx));l2.setAttribute('y1','26');l2.setAttribute('y2','328');l2.setAttribute('stroke','#edf2f5');g.appendChild(l2)}}
function fillDemo(){var vals={petrolPurchase:650000,petrolResale:360000,petrolService:15000,petrolOther:0,dieselPurchase:690000,dieselResale:380000,dieselService:18000,dieselOther:0,evPurchase:790000,evResale:420000,evService:10000,evOther:0,evSetup:25000};Object.keys(vals).forEach(function(k){el[k].value=vals[k]});renderOwnership()}
function clearOwn(){['petrolPurchase','petrolResale','dieselPurchase','dieselResale','evPurchase','evResale'].forEach(function(k){el[k].value=''});['petrolService','petrolOther','dieselService','dieselOther','evService','evOther','evSetup'].forEach(function(k){el[k].value='0'});renderOwnership()}
function reset(){var vals={annualKm:'18000',petrolConsumption:'6,7',petrolPrice:'38,9',dieselConsumption:'5,3',dieselPrice:'41',evConsumption:'18',homePrice:'6',publicPrice:'12,4',publicShare:'25',ownershipYears:'5'};Object.keys(vals).forEach(function(k){el[k].value=vals[k]});clearOwn();renderOperating()}
var form=$('powertrainForm');if(form){form.addEventListener('input',function(){renderOperating();renderOwnership()});form.addEventListener('change',function(){renderOperating();renderOwnership()});form.addEventListener('submit',function(e){e.preventDefault()})}
var own=$('ownershipDetails');if(own){own.addEventListener('input',renderOwnership);own.addEventListener('change',renderOwnership)}
var resetBtn=$('resetPowertrain');if(resetBtn)resetBtn.addEventListener('click',reset);var demo=$('demoOwnership');if(demo)demo.addEventListener('click',fillDemo);var clear=$('clearOwnership');if(clear)clear.addEventListener('click',clearOwn);
var menu=document.querySelector('.menu-btn'),mobile=$('mobile-nav');if(menu&&mobile){menu.addEventListener('click',function(){var open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-label',open?'Otevřít menu':'Zavřít menu');mobile.classList.toggle('open',!open)});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&mobile.classList.contains('open')){mobile.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Otevřít menu');menu.focus()}})}
reset();
}());
