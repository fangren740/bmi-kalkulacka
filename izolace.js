(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const num = (el, fallback=0) => { const v = Number(el?.value); return Number.isFinite(v) ? v : fallback; };
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
  const ceil = (v) => Math.ceil(Math.max(0,v));
  const fmt = (v,d=2) => new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number.isFinite(v)?v:0);
  const money = (v) => new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
  const materials = {
    epsGraphite:{name:'Šedý fasádní EPS',short:'Šedý EPS',lambda:.031,packArea:3,packPrice:690,density:16,thickness:160,waste:5,labor:650},
    epsWhite:{name:'Bílý fasádní EPS',short:'Bílý EPS',lambda:.039,packArea:3,packPrice:540,density:15,thickness:180,waste:5,labor:630},
    mineralRoll:{name:'Minerální role',short:'Minerální role',lambda:.039,packArea:5.4,packPrice:990,density:18,thickness:240,waste:8,labor:520},
    mineralBoard:{name:'Minerální fasádní deska',short:'Minerální deska',lambda:.035,packArea:2.88,packPrice:1120,density:45,thickness:160,waste:6,labor:760},
    epsFloor:{name:'Podlahový EPS',short:'Podlahový EPS',lambda:.037,packArea:3,packPrice:720,density:20,thickness:140,waste:5,labor:260},
    xps:{name:'XPS',short:'XPS',lambda:.034,packArea:3,packPrice:1320,density:33,thickness:120,waste:6,labor:520},
    pir:{name:'PIR deska',short:'PIR',lambda:.022,packArea:2.88,packPrice:1980,density:32,thickness:120,waste:7,labor:720}
  };
  const useDefaults = {
    facade:{material:'epsGraphite',length:10,second:5,openings:5,thickness:160,waste:5,label:'Výška'},
    roof:{material:'mineralRoll',length:10,second:8,openings:4,thickness:240,waste:8,label:'Šířka šikminy'},
    floor:{material:'epsFloor',length:8,second:6,openings:0,thickness:140,waste:5,label:'Šířka'},
    partition:{material:'mineralRoll',length:4,second:2.6,openings:2,thickness:75,waste:5,label:'Výška'}
  };
  const state={mode:'basic',basicMaterial:'epsGraphite',zones:[]};
  const form=$('#insulationForm');
  function setMaterial(key, sync=true){
    if(!materials[key]) return;
    state.basicMaterial=key;
    $$('.material-chip').forEach(b=>b.classList.toggle('is-active',b.dataset.material===key));
    if(sync){ const m=materials[key]; $('#basicLambda').value=m.lambda; $('#basicPackArea').value=m.packArea; $('#basicPackPrice').value=m.packPrice; $('#basicDensity').value=m.density; }
    calculate();
  }
  function setUse(use){
    const d=useDefaults[use]||useDefaults.facade;
    $('#basicLength').value=d.length; $('#basicSecond').value=d.second; $('#basicOpenings').value=d.openings; $('#basicThickness').value=d.thickness; $('#basicWaste').value=d.waste; $('#basicSecondLabel').textContent=d.label;
    setMaterial(d.material,true);
  }
  function basicData(){
    const method=$('input[name="basicMeasure"]:checked')?.value||'dimensions';
    const area=method==='area'?Math.max(0,num($('#basicKnownArea'))):Math.max(0,num($('#basicLength'))*num($('#basicSecond'))-num($('#basicOpenings')));
    const lambda=clamp(num($('#basicLambda'),.039),.015,.08); const thickness=Math.max(0,num($('#basicThickness'))); const waste=Math.max(0,num($('#basicWaste'))); const packArea=Math.max(.01,num($('#basicPackArea'),1)); const packPrice=Math.max(0,num($('#basicPackPrice'))); const density=Math.max(1,num($('#basicDensity'),20));
    const required=area*(1+waste/100); const packs=ceil(required/packArea); const purchase=packs*packArea; const volume=purchase*thickness/1000; const weight=volume*density; const R=thickness/1000/lambda; const cost=packs*packPrice;
    return {name:'Zadaná plocha',material:materials[state.basicMaterial]?.name||'Izolace',short:materials[state.basicMaterial]?.short||'Izolace',area,required,packs,purchase,volume,weight,R,cost,thickness,lambda,waste,packArea,packPrice,density,laborCost:0};
  }
  function zoneData(card){
    const key=$('.zone-material',card).value; const m=materials[key]||materials.epsGraphite; const area=Math.max(0,(num($('.zone-length',card))*num($('.zone-second',card))-num($('.zone-openings',card)))*Math.max(1,num($('.zone-repeat',card),1))); const thickness=Math.max(0,num($('.zone-thickness',card))); const lambda=clamp(num($('.zone-lambda',card),m.lambda),.015,.08); const waste=Math.max(0,num($('.zone-waste',card))); const packArea=Math.max(.01,num($('.zone-pack-area',card),m.packArea)); const packPrice=Math.max(0,num($('.zone-pack-price',card),m.packPrice)); const density=Math.max(1,num($('.zone-density',card),m.density)); const required=area*(1+waste/100); const packs=ceil(required/packArea); const purchase=packs*packArea; const volume=purchase*thickness/1000; const weight=volume*density; const R=thickness/1000/lambda; const cost=packs*packPrice; const laborCost=$('#useLabor').checked?area*Math.max(0,num($('.zone-labor-rate',card),m.labor)):0;
    return {name:$('.zone-name',card).value.trim()||'Konstrukce',material:m.name,short:m.short,area,required,packs,purchase,volume,weight,R,cost,thickness,lambda,waste,packArea,packPrice,density,laborCost};
  }
  function advancedData(){
    const zones=$$('.zone-card','#zonesList').map(zoneData); const area=zones.reduce((a,z)=>a+z.area,0); const required=zones.reduce((a,z)=>a+z.required,0); const packs=zones.reduce((a,z)=>a+z.packs,0); const purchase=zones.reduce((a,z)=>a+z.purchase,0); const volume=zones.reduce((a,z)=>a+z.volume,0); const weight=zones.reduce((a,z)=>a+z.weight,0); const materialCost=zones.reduce((a,z)=>a+z.cost,0); const laborCost=zones.reduce((a,z)=>a+z.laborCost,0); const weightedR=area?zones.reduce((a,z)=>a+z.R*z.area,0)/area:0;
    let membrane={qty:0,cost:0,label:'Fólie / membrána'}; if($('#useMembrane').checked){const cover=area*(1+Math.max(0,num($('#membraneOverlap')))/100); const rolls=ceil(cover/Math.max(1,num($('#membraneRollArea'),75))); membrane={qty:rolls,cost:rolls*Math.max(0,num($('#membraneRollPrice'))),label:`Fólie / membrána (${rolls} rol.)`};}
    let adhesive={qty:0,cost:0,label:'Lepicí směs'}; if($('#useAdhesive').checked){const kg=area*Math.max(0,num($('#adhesiveRate'))); const bags=ceil(kg/Math.max(1,num($('#adhesiveBagKg'),25))); adhesive={qty:bags,cost:bags*Math.max(0,num($('#adhesiveBagPrice'))),label:`Lepicí směs (${bags} pytlů)`};}
    let anchors={qty:0,cost:0,label:'Kotvy'}; if($('#useAnchors').checked){const pcs=ceil(area*Math.max(0,num($('#anchorsRate')))); const packsA=ceil(pcs/Math.max(1,num($('#anchorsPackSize'),100))); anchors={qty:packsA,cost:packsA*Math.max(0,num($('#anchorsPackPrice'))),label:`Kotvy (${packsA} bal.)`};}
    const transport=Math.max(0,num($('#transportCost'))), equipment=Math.max(0,num($('#equipmentCost'))), other=Math.max(0,num($('#otherCost'))); const systemCost=membrane.cost+adhesive.cost+anchors.cost; const total=materialCost+systemCost+laborCost+transport+equipment+other;
    return {zones,area,required,packs,purchase,volume,weight,materialCost,laborCost,weightedR,membrane,adhesive,anchors,transport,equipment,other,systemCost,total};
  }
  function renderScenarios(lambda,thickness){
    const values=[100,140,180,240]; const grid=$('#scenarioGrid'); grid.innerHTML=values.map(t=>`<article class="scenario-card ${Math.abs(t-thickness)<1?'is-current':''}"><span>${t} mm</span><strong>R ${fmt(t/1000/lambda,2)}</strong><small>při λ ${fmt(lambda,3)} W/mK</small></article>`).join('');
  }
  function renderRows(zones){ $('#breakdownBody').innerHTML=zones.map(z=>`<tr><td>${escapeHtml(z.name)}</td><td>${fmt(z.area)} m²</td><td>${fmt(z.thickness,0)} mm</td><td>${fmt(z.R,2)}</td><td>${fmt(z.packs,0)}</td><td>${money(z.cost)}</td></tr>`).join(''); }
  function renderCosts(items){ $('#costBreakdown').innerHTML=items.filter(i=>i.value>0).map(i=>`<div><span>${escapeHtml(i.label)}</span><strong>${money(i.value)}</strong></div>`).join('')||'<div><span>Žádné náklady</span><strong>0 Kč</strong></div>'; }
  function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function renderBasic(d){
    $('#resultModeBadge').textContent='Základní režim'; $('#resultMaterialBadge').textContent=d.short.toUpperCase(); $('#resultPacks').textContent=`${fmt(d.packs,0)} bal.`; $('#resultPurchaseArea').textContent=`Nakoupíte ${fmt(d.purchase)} m²`; $('#resultMainText').textContent=`Pro čistou plochu ${fmt(d.area)} m² a rezervu ${fmt(d.waste,0)} % vychází ${fmt(d.required)} m². Po zaokrouhlení koupíte ${fmt(d.packs,0)} celých balení.`; $('#resultNetArea').textContent=`${fmt(d.area)} m²`; $('#resultVolume').textContent=`${fmt(d.volume)} m³`; $('#resultWeight').textContent=`${fmt(d.weight,0)} kg`; $('#resultMaterialCost').textContent=money(d.cost); $('#resultR').textContent=`${fmt(d.R,2)} m²·K/W`; $('#thermalFill').style.width=`${clamp(d.R/8*100,5,100)}%`; $('#advancedResult').hidden=true; renderScenarios(d.lambda,d.thickness); renderRows([d]); renderCosts([{label:'Izolace – celá balení',value:d.cost}]); $('#insightTitle').textContent=d.packs? 'Balení rozhoduje o skutečném nákupu':'Zadejte platnou plochu'; $('#insightText').textContent=d.packs?`Požadujete ${fmt(d.required)} m², ale kvůli celým balením nakoupíte ${fmt(d.purchase)} m². Přebytek je ${fmt(Math.max(0,d.purchase-d.area))} m².`:'Délka, výška a plocha musí být větší než nula.'; updateHero(d);
  }
  function renderAdvanced(d){
    const lead=d.zones[0]||basicData(); $('#resultModeBadge').textContent='PRO projekt'; $('#resultMaterialBadge').textContent=`${d.zones.length} KONSTRUKCE`; $('#resultPacks').textContent=`${fmt(d.packs,0)} bal.`; $('#resultPurchaseArea').textContent=`Izolace pro ${fmt(d.area)} m²`; $('#resultMainText').textContent=`Projekt obsahuje ${d.zones.length} samostatných konstrukcí, ${fmt(d.volume)} m³ izolace a orientační celkový rozpočet ${money(d.total)}.`; $('#resultNetArea').textContent=`${fmt(d.area)} m²`; $('#resultVolume').textContent=`${fmt(d.volume)} m³`; $('#resultWeight').textContent=`${fmt(d.weight,0)} kg`; $('#resultMaterialCost').textContent=money(d.materialCost); $('#resultR').textContent=`${fmt(d.weightedR,2)} plošně vážené`; $('#thermalFill').style.width=`${clamp(d.weightedR/8*100,5,100)}%`; $('#advancedResult').hidden=false; $('#resultTotalCost').textContent=money(d.total); $('#resultSystemCost').textContent=money(d.systemCost); $('#resultLaborCost').textContent=money(d.laborCost); $('#resultWeightedR').textContent=fmt(d.weightedR,2); renderScenarios(lead.lambda,lead.thickness); renderRows(d.zones); renderCosts([{label:'Izolanty – celá balení',value:d.materialCost},{label:d.membrane.label,value:d.membrane.cost},{label:d.adhesive.label,value:d.adhesive.cost},{label:d.anchors.label,value:d.anchors.cost},{label:'Montážní práce',value:d.laborCost},{label:'Doprava',value:d.transport},{label:'Lešení / technika',value:d.equipment},{label:'Ostatní materiál',value:d.other}]); const target=Math.max(0,num($('#targetR'))); const below=d.zones.filter(z=>target&&z.R<target).length; $('#insightTitle').textContent=below?`${below} konstrukce jsou pod kontrolním R`:'Projektový souhrn je připraven'; $('#insightText').textContent=below?`Kontrolní hodnota R ${fmt(target,1)} není norma ani návrh celé konstrukce. U označených vrstev pouze upozorňuje, že odpor samotné izolace je nižší než vaše pracovní hodnota.`:`Plošně vážené R je pouze orientační souhrn. Každou skladbu posuzujte samostatně podle projektu a technické dokumentace.`; updateHero({area:d.area,packs:d.packs,volume:d.volume,R:d.weightedR});
  }
  function updateHero(d){ $$('[data-hero-area]').forEach(e=>e.textContent=`${fmt(d.purchase||d.area)} m²`); $$('[data-hero-packs]').forEach(e=>e.textContent=`${fmt(d.packs,0)} bal.`); $$('[data-hero-volume]').forEach(e=>e.textContent=`${fmt(d.volume)} m³`); $$('[data-hero-r]').forEach(e=>e.textContent=`R ${fmt(d.R,2)}`); }
  function calculate(){ state.mode==='advanced'?renderAdvanced(advancedData()):renderBasic(basicData()); }
  function switchMode(mode){ state.mode=mode; form.dataset.mode=mode; document.body.dataset.calculatorMode=mode; $$('.mode-button').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));}); $('#basicCalculation').hidden=mode!=='basic'; $('#advancedCalculation').hidden=mode!=='advanced'; calculate(); }
  function syncZoneMaterial(card,key){const m=materials[key]||materials.epsGraphite; $('.zone-lambda',card).value=m.lambda; $('.zone-pack-area',card).value=m.packArea; $('.zone-pack-price',card).value=m.packPrice; $('.zone-density',card).value=m.density; $('.zone-thickness',card).value=m.thickness; $('.zone-waste',card).value=m.waste; $('.zone-labor-rate',card).value=m.labor;}
  function syncUse(card,use){const map={facade:'epsGraphite',roof:'mineralRoll',floor:'epsFloor',partition:'mineralRoll',other:'mineralBoard'}; const key=map[use]||'epsGraphite'; $('.zone-material',card).value=key; $('.zone-second-label',card).textContent=['roof','floor'].includes(use)?'Šířka':'Výška'; syncZoneMaterial(card,key);}
  function addZone(data={}){const node=$('#zoneTemplate').content.firstElementChild.cloneNode(true); $('#zonesList').append(node); const idx=$$('.zone-card','#zonesList').length; $('.zone-index',node).textContent=String(idx).padStart(2,'0'); if(data.name) $('.zone-name',node).value=data.name; if(data.use){$('.zone-use',node).value=data.use;syncUse(node,data.use);} Object.entries(data).forEach(([k,v])=>{const el=$(`.zone-${k}`,node);if(el&&k!=='use')el.value=v;}); $('.zone-remove',node).addEventListener('click',()=>{node.remove();renumberZones();calculate();}); $('.zone-use',node).addEventListener('change',e=>{syncUse(node,e.target.value);calculate();}); $('.zone-material',node).addEventListener('change',e=>{syncZoneMaterial(node,e.target.value);calculate();}); node.addEventListener('input',calculate); node.addEventListener('change',calculate); renumberZones(); calculate(); return node;}
  function renumberZones(){$$('.zone-card','#zonesList').forEach((c,i)=>$('.zone-index',c).textContent=String(i+1).padStart(2,'0'));}
  function resetAdvanced(){ $('#zonesList').innerHTML=''; addZone({name:'Fasáda – hlavní plocha',use:'facade',length:10,second:5,openings:5,repeat:1,thickness:160,waste:5}); addZone({name:'Šikmá střecha',use:'roof',length:10,second:8,openings:4,repeat:1,thickness:240,waste:8}); $('#useMembrane').checked=true;$('#useAdhesive').checked=true;$('#useAnchors').checked=true;$('#useLabor').checked=true;$('#transportCost').value=2800;$('#equipmentCost').value=12000;$('#otherCost').value=4500;calculate();}
  function transferToAdvanced(){ const d=basicData(); $('#zonesList').innerHTML=''; const use=$('input[name="basicUse"]:checked')?.value||'facade'; const directArea=$('input[name="basicMeasure"]:checked')?.value==='area'; const card=addZone({name:'Přenesená konstrukce',use,length:directArea?d.area:num($('#basicLength')),second:directArea?1:num($('#basicSecond')),openings:directArea?0:num($('#basicOpenings')),repeat:1,thickness:d.thickness,lambda:d.lambda,waste:d.waste,packArea:d.packArea,packPrice:d.packPrice,density:d.density}); $('.zone-material',card).value=state.basicMaterial; $('.zone-lambda',card).value=d.lambda; $('.zone-pack-area',card).value=d.packArea; $('.zone-pack-price',card).value=d.packPrice; $('.zone-density',card).value=d.density; switchMode('advanced');}
  $$('.mode-button').forEach(b=>b.addEventListener('click',()=>switchMode(b.dataset.mode)));
  $$('input[name="basicUse"]').forEach(r=>r.addEventListener('change',()=>setUse(r.value)));
  $$('input[name="basicMeasure"]').forEach(r=>r.addEventListener('change',()=>{const area=r.value==='area';$('[data-basic-area]').hidden=!area;$('[data-basic-dimensions]').hidden=area;calculate();}));
  $$('.material-chip').forEach(b=>b.addEventListener('click',()=>setMaterial(b.dataset.material,true)));
  form.addEventListener('input',calculate); form.addEventListener('change',calculate); form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  $('#resetBasic').addEventListener('click',()=>{document.querySelector('input[name="basicUse"][value="facade"]').checked=true;document.querySelector('input[name="basicMeasure"][value="dimensions"]').checked=true;$('[data-basic-area]').hidden=true;$('[data-basic-dimensions]').hidden=false;setUse('facade');});
  $('#sendToAdvanced').addEventListener('click',transferToAdvanced); $('#addZone').addEventListener('click',()=>addZone({name:'Další konstrukce',use:'facade'})); $('#resetAdvanced').addEventListener('click',resetAdvanced);
  ['useMembrane','useAdhesive','useAnchors'].forEach(id=>$('#'+id).addEventListener('change',e=>{const box=$(`[data-feature="${id.replace('use','').toLowerCase()}"]`);if(box)box.hidden=!e.target.checked;calculate();}));
  $('#copyResult').addEventListener('click',async()=>{const text=`Kalkulačka izolace: ${$('#resultPacks').textContent}, ${$('#resultPurchaseArea').textContent}, R ${$('#resultR').textContent}, cena izolantu ${$('#resultMaterialCost').textContent}.`;try{await navigator.clipboard.writeText(text);$('#copyResult').textContent='Zkopírováno';setTimeout(()=>$('#copyResult').textContent='Kopírovat',1400);}catch{}}); $('#printResult').addEventListener('click',()=>window.print());
  resetAdvanced(); switchMode('basic'); setUse('facade');
})();
