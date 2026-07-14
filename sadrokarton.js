(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const num=(id,root=document)=>{const el=typeof id==='string'?$(id,root):id;const v=parseFloat(el?.value);return Number.isFinite(v)?v:0};
const money=n=>Math.round(n).toLocaleString('cs-CZ')+' Kč';
const dec=(n,d=1)=>n.toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d});
const whole=n=>Math.round(n).toLocaleString('cs-CZ');
const clamp=(v,min,max)=>Math.min(Math.max(v,min),max);
const defaults={boardW:1.2,boardH:2,compoundPerM2:.35,tapePerM2:1.35,insulationReserve:1.05,profileReserve:1.05};
let mode='basic', zoneCounter=0, lastResult=null;
const form=$('#drywallForm'), basicPanel=$('#basicCalculation'), advancedPanel=$('#advancedCalculation'), advancedSummary=$('#advancedSummary');
function boardLabel(v){return v==='moisture'?'Impregnovaná':v==='fire'?'Protipožární':'Standardní'}
function typeLabel(v){return v==='lining'?'Předstěna':v==='ceiling'?'Podhled':'Příčka'}
function baseGeometry(type,length,second,openings=0){const gross=Math.max(0,length*second);return Math.max(0,gross-(type==='ceiling'?0:openings));}
function calcZone(z,prices){
 const area=baseGeometry(z.type,z.length,z.second,z.openings)*z.repeat;
 const sides=z.type==='partition'?2:1;
 const cladding=area*sides*z.layers;
 const needed=cladding*(1+z.waste/100);
 const boardArea=defaults.boardW*defaults.boardH;
 const boards=Math.ceil(needed/boardArea);
 let profiles=0,perimeter=0,hangers=0,profileNote='';
 if(z.type==='ceiling'){
   const rows=Math.ceil(z.second/z.spacing)+1;
   const cd=rows*z.length*z.repeat;
   const ud=2*(z.length+z.second)*z.repeat;
   profiles=(cd+ud)*defaults.profileReserve; perimeter=ud; hangers=Math.ceil(area/(.5*1.2)); profileNote='CD + UD';
 }else{
   const studs=(Math.ceil(z.length/z.spacing)+1)*z.repeat;
   const cw=studs*z.second;
   const uw=2*z.length*z.repeat;
   profiles=(cw+uw)*defaults.profileReserve; perimeter=uw; profileNote=z.type==='partition'?'CW + UW':'CW + UW / předstěna';
 }
 const screws=Math.ceil(cladding*(z.type==='ceiling'?24:20));
 const insulation=z.insulation?area*defaults.insulationReserve:0;
 const compound=cladding*defaults.compoundPerM2;
 const tape=cladding*defaults.tapePerM2;
 const boardPrice=prices.board[z.board]||0;
 const boardCost=boards*boardPrice;
 const profileCost=profiles*prices.profile;
 const insulationCost=insulation*prices.insulation;
 const screwBoxes=Math.max(0,Math.ceil(screws/prices.screwsPerBox));
 const screwCost=screwBoxes*prices.screwBox;
 const compoundBags=Math.max(0,Math.ceil(compound/20));
 const compoundCost=prices.useCompound?compoundBags*prices.compoundBag:0;
 const tapeRolls=Math.max(0,Math.ceil(tape/90));
 const tapeCost=prices.useCompound?tapeRolls*prices.tapeRoll:0;
 const acousticRolls=Math.max(0,Math.ceil(perimeter/30));
 const acousticCost=prices.useAcousticTape?acousticRolls*prices.acousticRoll:0;
 const vaporArea=prices.useVapor && z.type!=='partition'?area*1.12:0;
 const vaporCost=vaporArea*prices.vapor;
 const hangerCost=hangers*prices.hanger;
 const laborRate=z.type==='partition'?prices.laborPartition:z.type==='lining'?prices.laborLining:prices.laborCeiling;
 const labor=area*laborRate;
 return {...z,area,sides,cladding,needed,boards,boardArea,profiles,perimeter,hangers,profileNote,screws,insulation,compound,tape,boardCost,profileCost,insulationCost,screwBoxes,screwCost,compoundBags,compoundCost,tapeRolls,tapeCost,acousticRolls,acousticCost,vaporArea,vaporCost,hangerCost,labor,material:boardCost+profileCost+insulationCost+screwCost+compoundCost+tapeCost+acousticCost+vaporCost+hangerCost};
}
function basicData(){
 const type=$('input[name="basicType"]:checked')?.value||'partition';
 return {name:typeLabel(type),type,length:num('#basicLength'),second:num('#basicSecond'),openings:num('#basicOpenings'),repeat:1,layers:num('#basicLayers')||1,board:$('#basicBoardType').value,waste:num('#basicWaste'),spacing:Math.max(.3,num('#basicSpacing')||.625),insulation:$('#basicInsulation').checked};
}
function basicPrices(){return {board:{standard:num('#basicBoardPrice'),moisture:num('#basicBoardPrice'),fire:num('#basicBoardPrice')},profile:num('#basicProfilePrice'),insulation:num('#basicInsulationPrice'),screwBox:390,screwsPerBox:1000,compoundBag:720,tapeRoll:180,acousticRoll:230,vapor:42,hanger:18,useCompound:true,useAcousticTape:true,useVapor:false,laborPartition:0,laborLining:0,laborCeiling:0};}
function advancedPrices(){return {board:{standard:num('#priceBoardStandard'),moisture:num('#priceBoardMoisture'),fire:num('#priceBoardFire')},profile:num('#priceProfile'),insulation:$('#useInsulation').checked?num('#priceInsulation'):0,screwBox:num('#priceScrewBox'),screwsPerBox:Math.max(1,num('#screwsPerBox')),compoundBag:num('#priceCompoundBag'),tapeRoll:num('#priceTapeRoll'),acousticRoll:num('#priceAcousticRoll'),vapor:num('#priceVapor'),hanger:num('#priceHanger'),useCompound:$('#useCompound').checked,useAcousticTape:$('#useAcousticTape').checked,useVapor:$('#useVapor').checked,laborPartition:num('#laborPartition'),laborLining:num('#laborLining'),laborCeiling:num('#laborCeiling')};}
function readZone(card){return {name:$('.zone-name',card).value||'Konstrukce',type:$('.zone-type',card).value,length:num($('.zone-length',card)),second:num($('.zone-second',card)),openings:num($('.zone-openings',card)),repeat:Math.max(1,num($('.zone-repeat',card))||1),board:$('.zone-board',card).value,layers:Math.max(1,num($('.zone-layers',card))||1),spacing:Math.max(.3,num($('.zone-spacing',card))||.625),waste:clamp(num($('.zone-waste',card)),0,30),insulation:$('.zone-insulation',card).checked&&$('#useInsulation').checked};}
function aggregate(results,prices,advanced=false){
 const sum=k=>results.reduce((a,r)=>a+(r[k]||0),0);
 const boardByType={standard:0,moisture:0,fire:0};results.forEach(r=>boardByType[r.board]+=r.boards);
 const extra=advanced?num('#deliveryCost')+num('#equipmentCost')+num('#otherCost'):0;
 return {results,boards:sum('boards'),boardByType,area:sum('area'),cladding:sum('cladding'),needed:sum('needed'),purchase:sum('boards')*defaults.boardW*defaults.boardH,profiles:sum('profiles'),perimeter:sum('perimeter'),hangers:sum('hangers'),screws:sum('screws'),insulation:sum('insulation'),compound:sum('compound'),tape:sum('tape'),material:sum('material'),labor:sum('labor'),extra,total:sum('material')+sum('labor')+extra};
}
function render(data,advanced=false){lastResult=data;const first=data.results[0]||{};const purchaseArea=data.purchase;const wasteArea=Math.max(0,purchaseArea-data.needed);const usedPct=purchaseArea?clamp(data.needed/purchaseArea*100,0,100):0;
 $('#resultBoards').textContent=whole(data.boards)+' ks';$('#resultBoardArea').textContent='Nakoupíte '+dec(purchaseArea,2)+' m² desek';$('#resultNeededArea').textContent=dec(data.needed,2)+' m²';$('#resultWasteArea').textContent=dec(wasteArea,2)+' m²';$('#resultProgressUsed').style.width=usedPct+'%';$('#resultProgressWaste').style.width=(100-usedPct)+'%';
 $('#resultProfiles').textContent=whole(Math.ceil(data.profiles))+' m';$('#resultProfileNote').textContent=advanced?'součet všech profilů':first.profileNote||'profily';$('#resultScrews').textContent=whole(data.screws)+' ks';const boxes=Math.ceil(data.screws/(advanced?Math.max(1,num('#screwsPerBox')):1000));$('#resultScrewBoxes').textContent=whole(boxes)+' '+(boxes===1?'balení':'balení');$('#resultInsulation').textContent=data.insulation?dec(data.insulation,1)+' m²':'—';$('#resultCost').textContent=money(advanced?data.total:data.material);$('#resultCostNote').textContent=advanced?'materiál + práce':'orientační materiál';
 $('#resultTape').textContent=dec(data.tape,0)+' m';const tapeRolls=Math.ceil(data.tape/90);$('#resultTapeRolls').textContent=whole(tapeRolls)+' '+(tapeRolls===1?'role':'role');$('#resultCompound').textContent=dec(data.compound,1)+' kg';const compoundBags=Math.ceil(data.compound/20);$('#resultCompoundBags').textContent=whole(compoundBags)+' '+(compoundBags===1?'pytel':'pytle');$('#resultPerimeter').textContent=whole(Math.ceil(data.perimeter))+' m';
 const days=Math.max(1,Math.ceil(data.area/22));$('#resultTime').textContent=days===1?'1 den':days+' dny';$('#resultMode').textContent=advanced?'Rozšířený režim':'Základní režim';$('#resultTypeBadge').textContent=advanced?'PROJEKT':typeLabel(first.type||'partition').toUpperCase();
 $('#resultNarrative').textContent=advanced?`Projekt obsahuje ${data.results.length} konstrukcí, ${dec(data.area,2)} m² čisté plochy a ${dec(data.cladding,2)} m² opláštění před rezervou.`:`Pro čistou plochu konstrukce ${dec(data.area,2)} m² vychází při ${first.sides===2?'opláštění obou stran':'jedné opláštěné straně'} a rezervě ${whole(first.waste)} % nákup ${whole(data.boards)} celých desek.`;
 $('#advancedSummary').hidden=!advanced;if(advanced){$('#advancedZones').textContent=whole(data.results.length);$('#advancedCladding').textContent=dec(data.cladding,1)+' m²';$('#advancedCompound').textContent=dec(data.compound,1)+' kg';$('#advancedHangers').textContent=whole(data.hangers)+' ks';$('#advancedLabor').textContent=money(data.labor);$('#advancedTotal').textContent=money(data.total);}
 const multi=advanced&&Object.values(data.boardByType).filter(Boolean).length>1;$('#insightTitle').textContent=advanced?'Projekt je rozdělený na samostatné konstrukce':'Nákup odpovídá '+typeLabel(first.type||'partition').toLowerCase();$('#insightText').textContent=multi?'Projekt používá více typů desek. Objednejte každý typ samostatně a nekombinujte zbytky mezi skladbami bez ověření systému.':'Před objednávkou ověřte rozměr desek, systémové profily, požadovanou akustiku, požární skladbu a místa budoucího zatížení.';
 $('[data-hero-boards]').textContent=whole(data.boards)+' ks';$('[data-hero-profiles]').textContent=whole(Math.ceil(data.profiles))+' m';$('[data-hero-screws]').textContent=whole(data.screws)+' ks';renderBreakdown(data);renderCosts(data,advanced);if(!advanced)renderScenarios(first);
}
function renderBreakdown(data){$('#breakdownBody').innerHTML=data.results.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${dec(r.area,2)} m²</td><td>${dec(r.cladding,2)} m²</td><td>${whole(r.boards)} ks</td><td>${whole(Math.ceil(r.profiles))} m</td></tr>`).join('');}
function renderCosts(data,advanced){const rows=[['Sádrokartonové desky',data.results.reduce((a,r)=>a+r.boardCost,0)],['Profily a závěsy',data.results.reduce((a,r)=>a+r.profileCost+r.hangerCost,0)],['Vruty, tmel a pásky',data.results.reduce((a,r)=>a+r.screwCost+r.compoundCost+r.tapeCost+r.acousticCost,0)],['Izolace a parozábrana',data.results.reduce((a,r)=>a+r.insulationCost+r.vaporCost,0)]];if(advanced){rows.push(['Práce',data.labor],['Doprava, technika a ostatní',data.extra]);}$('#costBreakdown').innerHTML=rows.filter(([,v])=>v>0).map(([n,v])=>`<div><span>${n}</span><strong>${money(v)}</strong></div>`).join('')||'<div><span>Cena není zapnutá</span><strong>—</strong></div>';}
function renderScenarios(zone){const prices=mode==='advanced'?advancedPrices():basicPrices();const current=zone.waste;$('#scenarioGrid').innerHTML=[5,8,12,15].map(w=>{const r=calcZone({...zone,waste:w},prices);return `<article class="scenario-card ${w===current?'is-current':''}"><span>Rezerva ${w} %</span><strong>${whole(r.boards)} desek</strong><small>${dec(r.needed,2)} m² k pokrytí</small></article>`}).join('');}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function calculate(){if(mode==='basic'){const zone=basicData();const r=calcZone(zone,basicPrices());const data=aggregate([r],basicPrices(),false);if(!$('#basicCost').checked){data.material=0;}render(data,false);}else{const prices=advancedPrices();const zones=$$('.zone-card').map(readZone).filter(z=>z.length>0&&z.second>0);const results=zones.map(z=>calcZone(z,prices));render(aggregate(results,prices,true),true);}}
function setMode(next,transfer=false){mode=next;form.dataset.mode=next;document.body.dataset.calculatorMode=next;basicPanel.hidden=next!=='basic';advancedPanel.hidden=next!=='advanced';$$('.mode-button').forEach(b=>{const active=b.dataset.mode===next;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));});if(next==='advanced'&&transfer&&$$('.zone-card').length===0){const b=basicData();addZone({...b,name:typeLabel(b.type)+' z rychlého výpočtu'});}calculate();}
function addZone(data={}){zoneCounter++;const frag=$('#zoneTemplate').content.cloneNode(true);const card=$('.zone-card',frag);$('.zone-index',card).textContent=String(zoneCounter).padStart(2,'0');if(data.name)$('.zone-name',card).value=data.name;if(data.type)$('.zone-type',card).value=data.type;if(data.length!=null)$('.zone-length',card).value=data.length;if(data.second!=null)$('.zone-second',card).value=data.second;if(data.openings!=null)$('.zone-openings',card).value=data.openings;if(data.repeat!=null)$('.zone-repeat',card).value=data.repeat;if(data.board)$('.zone-board',card).value=data.board;if(data.layers!=null)$('.zone-layers',card).value=data.layers;if(data.spacing!=null)$('.zone-spacing',card).value=data.spacing;if(data.waste!=null)$('.zone-waste',card).value=data.waste;if(data.insulation!=null)$('.zone-insulation',card).checked=data.insulation;$('#zoneList').append(card);updateZoneType(card);calculate();}
function updateZoneType(card){const type=$('.zone-type',card).value;$('.zone-second-label',card).textContent=type==='ceiling'?'Šířka':'Výška';$('.zone-openings-wrap',card).style.display=type==='ceiling'?'none':'';if(type==='ceiling')$('.zone-spacing',card).value=.5;}
function resetBasic(){form.reset();$('#basicLength').value=4;$('#basicSecond').value=2.6;$('#basicOpenings').value=2;$('#basicBoardPrice').value=260;updateBasicType();calculate();}
function resetAdvanced(){$('#zoneList').innerHTML='';zoneCounter=0;addZone({name:'Příčka obývací pokoj',type:'partition',length:4,second:2.6,openings:2,repeat:1,board:'standard',layers:1,spacing:.625,waste:8,insulation:true});addZone({name:'Podhled ložnice',type:'ceiling',length:4.2,second:3.6,openings:0,repeat:1,board:'standard',layers:1,spacing:.5,waste:10,insulation:false});calculate();}
function updateBasicType(){const type=$('input[name="basicType"]:checked')?.value||'partition';$('#basicSecondLabel').textContent=type==='ceiling'?'Šířka konstrukce':'Výška konstrukce';$('#basicOpeningsField').style.display=type==='ceiling'?'none':'';$('#basicSpacing').value=type==='ceiling'?.5:.625;calculate();}
$$('.mode-button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode,b.dataset.mode==='advanced')));$$('input[name="basicType"]').forEach(r=>r.addEventListener('change',updateBasicType));form.addEventListener('input',e=>{if(e.target.closest('.zone-card')&&e.target.classList.contains('zone-type'))updateZoneType(e.target.closest('.zone-card'));calculate();});form.addEventListener('change',calculate);form.addEventListener('submit',e=>{e.preventDefault();calculate();});$('#addZone').addEventListener('click',()=>addZone());$('#zoneList').addEventListener('click',e=>{const btn=e.target.closest('.zone-remove');if(btn){btn.closest('.zone-card').remove();calculate();}});$('#basicReset').addEventListener('click',resetBasic);$('#advancedReset').addEventListener('click',resetAdvanced);$('#copyResult').addEventListener('click',async()=>{if(!lastResult)return;const text=`Sádrokarton: ${whole(lastResult.boards)} desek, ${whole(Math.ceil(lastResult.profiles))} m profilů, ${whole(lastResult.screws)} vrutů, ${money(mode==='advanced'?lastResult.total:lastResult.material)}.`;try{await navigator.clipboard.writeText(text);$('#copyResult').textContent='Zkopírováno';setTimeout(()=>$('#copyResult').textContent='Kopírovat výsledek',1600);}catch{}});$('#printResult').addEventListener('click',()=>window.print());
resetAdvanced();setMode('basic');
})();