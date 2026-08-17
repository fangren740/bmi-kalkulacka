(() => {
"use strict";
const $=id=>document.getElementById(id);
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const money=v=>new Intl.NumberFormat("cs-CZ",{style:"currency",currency:"CZK",maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
const num=(v,d=0)=>new Intl.NumberFormat("cs-CZ",{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number.isFinite(v)?v:0);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const val=(id,f=0)=>{const n=Number($(id)?.value);return Number.isFinite(n)?n:f};

const cover={
 concrete:{label:"Betonová taška",low:500,high:1000},
 ceramic:{label:"Pálená taška",low:700,high:1500},
 metal:{label:"Profilovaný plech",low:500,high:1200},
 seam:{label:"Falcovaný plech",low:900,high:2000}
};
const renovation={concrete:[1800,2800],ceramic:[2200,3500],metal:[1600,2800],seam:[2500,4500]};
const scopeLabels={covering:"Výměna krytiny",renovation:"Kompletní rekonstrukce",new:"Nová střecha",insulation:"Jen zateplení"};
const complexityLabels={standard:"Běžná / jednoduchá",complex:"Členitá"};
const included={
 covering:["demontáž staré krytiny","pojistná hydroizolace + latě","nová krytina + standardní montáž"],
 renovation:["nový / zásadně řešený krov","izolace","střešní plášť + krytina"],
 new:["nový krov","izolace","střešní plášť + krytina","bez demontáže staré střechy"],
 insulation:["izolační rozpočtový blok","modelový rozsah 500–1 200 Kč/m²"]
};
const excluded=["atypická střešní okna a prostupy","rozsáhlá klempířina a okapový systém","jeřáb / mimořádná logistika","skryté vady konstrukce po odkrytí"];

let areaMode="known";
function derivedArea(){
 const l=clamp(val("houseLength",10),3,100),w=clamp(val("houseWidth",9),3,100),p=clamp(val("roofPitch",35),1,70),o=clamp(val("overhang",.5),0,2);
 const a=(l+2*o)*(w+2*o)/Math.cos(p*Math.PI/180);
 $("derivedArea").textContent=`${num(a)} m²`;
 return a;
}
function currentArea(){return areaMode==="derive"?derivedArea():clamp(val("roofArea",160),20,3000)};
function baseBand(scope,coverKey){
 if(scope==="covering"){const c=cover[coverKey];return [c.low+160+100,c.high+380+250,"AZ-Střecha + KolikMaterialu"]}
 if(scope==="renovation"){const r=renovation[coverKey];return [r[0],r[1],"AZ-Střecha · kompletní rekonstrukce"]}
 if(scope==="new"){const r=renovation[coverKey];return [r[0],r[1],"AZ-Střecha · kompletní rekonstrukce / nová střecha"]}
 return [500,1200,"AZ-Střecha · zateplení"];
}
function estimate(){
 const scope=q('input[name="scope"]:checked')?.value||"covering";
 const coverKey=$("coveringType").value;
 const complexity=$("complexity").value;
 const area=currentArea();
 const reserve=clamp(val("reserve",10),0,40);
 const extras=Math.max(0,val("extras",0));
 const budget=Math.max(0,val("budget",0));
 let [loM2,hiM2,source]=baseBand(scope,coverKey);
 if(complexity==="complex"&&scope!=="insulation"){loM2*=1.15;hiM2*=1.30;}
 let low=loM2*area+extras,high=hiM2*area+extras;
 const mid=(low+high)/2;
 const planning=mid*(1+reserve/100);
 return {scope,coverKey,complexity,area,reserve,extras,budget,loM2,hiM2,low,high,mid,planning,source};
}
function insight(m){
 if(m.scope==="renovation") return ["Největší neznámá je stav po odkrytí.","Pásmo počítá s kompletní rekonstrukcí, ale konkrétní rozsah oprav dřeva může vzniknout až po demontáži. Předem si nastavte pravidla víceprací."];
 if(m.complexity==="complex") return ["Členitost rozšiřuje interval záměrně.","Veřejný přehled uvádí u komplikovaného tvaru nárůst přibližně 15–30 %. Model proto nezvedá jedno číslo, ale roztahuje celé pásmo."];
 if(m.budget>0&&m.planning>m.budget) return ["Plánovací střed je nad vaším limitem.",`Do modelového středu včetně rezervy chybí ${money(m.planning-m.budget)}. Nejdřív ověřte rozsah, až potom hledejte úsporu v materiálu.`];
 if(m.scope==="covering") return ["Krytina je jen část konečné nabídky.","Model zahrnuje demontáž, základní vrstvy a krytinu. Okna, rozsáhlá klempířina, lešení nebo skryté opravy zůstávají k samostatnému ověření."];
 return ["Výsledek je rozpočtový interval, ne cenová nabídka.","Pro další krok použijte projektovou plochu a nahraďte model konkrétní nabídkou. Pak si v režimu „Mám nabídku“ zkontrolujte, zda obsahuje stejné položky."];
}
function renderEstimate(){
 const m=estimate();
 $("resultScope").textContent=scopeLabels[m.scope];
 $("rangeTotal").value=`${money(m.low)} – ${money(m.high)}`;
 $("rangePerM2").textContent=`${money(m.loM2)} – ${money(m.hiM2)} / m²${m.extras?" + mimořádné položky":""}`;
 $("planningTotal").textContent=money(m.planning);
 $("planningNote").textContent=`střed pásma + ${num(m.reserve)} % rezervy${m.extras?" · včetně zadaných mimořádných položek":""}`;
 $("resultArea").textContent=`${num(m.area)} m²`;
 $("resultComplexity").textContent=complexityLabels[m.complexity];
 $("resultSource").textContent=m.source;
 $("budgetResult").textContent=m.budget?`${m.planning>m.budget?"chybí":"zbývá"} ${money(Math.abs(m.budget-m.planning))}`:"nezadaný";
 $("includedList").innerHTML=included[m.scope].map(x=>`<li>${x}</li>`).join("");
 $("excludedList").innerHTML=excluded.map(x=>`<li>${x}</li>`).join("");
 const [t,p]=insight(m);$("insightTitle").textContent=t;$("insightText").textContent=p;
 window._roofModel=m;
}
function renderOffer(){
 const total=Math.max(0,val("offerTotal",0)),area=Math.max(1,val("offerArea",160)),vat=$("offerVat").value;
 const checks=qa('#offerChecks input[type="checkbox"]');const checked=checks.filter(x=>x.checked);const missing=checks.filter(x=>!x.checked).map(x=>x.value);
 const ratio=checked.length/checks.length*100;
 $("offerScoreBadge").textContent=`${checked.length} / ${checks.length}`;
 $("offerPerM2").textContent=money(total/area)+" / m²";
 $("offerCompleteness").textContent=num(ratio)+" %";$("offerCompletenessBar").style.width=`${ratio}%`;
 $("offerVatText").textContent=vat==="yes"?"cena označena jako s DPH":vat==="no"?"cena je uvedena bez DPH":"DPH není v nabídce potvrzené";
 $("offerMissing").innerHTML=missing.length?missing.map(x=>`<li>${x}</li>`).join(""):"<li>Všechny kontrolované části jsou označené jako zahrnuté.</li>";
 let title,text;
 if(vat==="unknown"){title="Nejdřív potvrďte DPH.";text="Bez stejného daňového režimu nelze férově porovnat konečné ceny dvou nabídek."}
 else if(ratio<70){title="Nabídka ještě není srovnatelná.";text="Více kontrolovaných částí není potvrzených. Neznamená to, že v nabídce chybí — znamená to, že rozsah potřebuje písemně vyjasnit."}
 else if(ratio<100){title="Rozsah je už poměrně dobře popsaný.";text="Před porovnáním s další nabídkou si potvrďte zbývající položky a pravidla víceprací."}
 else{title="Kontrolovaný rozsah je kompletně označený.";text="Teď dává smysl porovnávat cenu za m² a jednotlivé položky s jinou nabídkou — za předpokladu stejné plochy a stejného technického řešení."}
 $("offerInsightTitle").textContent=title;$("offerInsightText").textContent=text;
 window._offerModel={total,area,vat,checked:checked.map(x=>x.value),missing};
}
function setMode(mode){
 qa('.roof-mode').forEach(b=>{const a=b.dataset.mode===mode;b.classList.toggle('is-active',a);b.setAttribute('aria-selected',String(a))});
 qa('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==mode);
}
qa('.roof-mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
qa('[data-area-mode]').forEach(b=>b.addEventListener('click',()=>{areaMode=b.dataset.areaMode;qa('[data-area-mode]').forEach(x=>x.classList.toggle('is-active',x===b));qa('[data-area-panel]').forEach(p=>p.hidden=p.dataset.areaPanel!==areaMode);renderEstimate()}));
qa('#roofEstimateForm input,#roofEstimateForm select').forEach(x=>{x.addEventListener('input',renderEstimate);x.addEventListener('change',renderEstimate)});
qa('#offerForm input,#offerForm select').forEach(x=>{x.addEventListener('input',renderOffer);x.addEventListener('change',renderOffer)});
$("resetEstimate").addEventListener('click',()=>{q('#roofEstimateForm').reset();areaMode='known';qa('[data-area-mode]').forEach(x=>x.classList.toggle('is-active',x.dataset.areaMode==='known'));qa('[data-area-panel]').forEach(p=>p.hidden=p.dataset.areaPanel!=='known');renderEstimate()});
$("resetOffer").addEventListener('click',()=>{q('#offerForm').reset();renderOffer()});
$("copyEstimate").addEventListener('click',async()=>{const m=window._roofModel||estimate();const text=`Kalkulačka ceny střechy 2026 – ${scopeLabels[m.scope]}, ${num(m.area)} m²: referenční pásmo ${money(m.low)} až ${money(m.high)}, plánovací střed + ${num(m.reserve)} % rezerva ${money(m.planning)}. Výsledek je orientační model, ne cenová nabídka.`;try{await navigator.clipboard.writeText(text);$("copyEstimate").textContent="Zkopírováno";setTimeout(()=>$("copyEstimate").textContent="Kopírovat výsledek",1600)}catch(_){window.prompt("Zkopírujte výsledek:",text)}});
$("copyOffer").addEventListener('click',async()=>{const m=window._offerModel;const text=`Kontrola nabídky střechy: ${money(m.total)}, ${num(m.area)} m² (${money(m.total/m.area)}/m²). Zahrnuto: ${m.checked.join(', ')||'nic nepotvrzeno'}. Ověřit: ${m.missing.join(', ')||'žádná z kontrolovaných položek'}. DPH: ${m.vat==='yes'?'s DPH':m.vat==='no'?'bez DPH':'nepotvrzeno'}.`;try{await navigator.clipboard.writeText(text);$("copyOffer").textContent="Zkopírováno";setTimeout(()=>$("copyOffer").textContent="Kopírovat kontrolní seznam",1600)}catch(_){window.prompt("Zkopírujte seznam:",text)}});
const menu=$("menuToggle"),nav=$("mainNav");
if(menu&&nav){
 menu.addEventListener("click",()=>{const open=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!open));nav.classList.toggle("is-open",!open)});
 nav.addEventListener("click",e=>{if(e.target.closest("a")){menu.setAttribute("aria-expanded","false");nav.classList.remove("is-open")}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu.setAttribute("aria-expanded","false");nav.classList.remove("is-open")}});
}
derivedArea();renderEstimate();renderOffer();setMode('estimate');
})();
