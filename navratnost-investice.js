(()=>{
"use strict";
const $=id=>document.getElementById(id);
const form=$("roiForm"); if(!form)return;
let advancedMode=false;
const ids=["initialInvestment","projectYears","annualBenefit","annualCosts","discountRate","firstYearRamp","benefitGrowth","costGrowth","extraInvestment","extraInvestmentYear","residualValue"];
const defaults={initialInvestment:"250 000",projectYears:"5",annualBenefit:"120 000",annualCosts:"20 000",discountRate:"8",firstYearRamp:"100",benefitGrowth:"0",costGrowth:"0",extraInvestment:"0",extraInvestmentYear:"3",residualValue:"30 000"};
const moneyFmt=new Intl.NumberFormat("cs-CZ",{style:"currency",currency:"CZK",maximumFractionDigits:0});
const numFmt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2});
const money=n=>moneyFmt.format(Number.isFinite(n)?n:0);
const signedMoney=n=>`${n<0?"−":""}${money(Math.abs(n))}`;
const pct=n=>Number.isFinite(n)?`${numFmt.format(n)} %`:"—";
const num=n=>Number.isFinite(n)?numFmt.format(n):"—";
const parse=v=>{const s=String(v??"").trim().replace(/\s|\u00a0/g,"").replace(",",".");return s===""?NaN:Number(s)};
const set=(id,v)=>{const el=$(id);if(el)el.textContent=v};
const inputs=Object.fromEntries(ids.map(id=>[id,$(id)]));
function read(){const v=Object.fromEntries(ids.map(id=>[id,parse(inputs[id].value)]));if(!advancedMode){v.firstYearRamp=100;v.benefitGrowth=0;v.costGrowth=0;v.extraInvestment=0;v.extraInvestmentYear=1;v.residualValue=0}return v}
function fieldError(id,msg){const el=inputs[id],err=$(id+"Error"); if(el)el.closest(".field")?.classList.toggle("has-error",!!msg); if(err)err.textContent=msg||""}
function validate(v){ids.forEach(id=>fieldError(id,""));let first="";const add=(id,msg)=>{fieldError(id,msg);if(!first)first=msg};
 if(!Number.isFinite(v.initialInvestment)||v.initialInvestment<=0)add("initialInvestment","Zadejte investici vyšší než nula.");
 if(!Number.isInteger(v.projectYears)||v.projectYears<1||v.projectYears>50)add("projectYears","Použijte celé číslo od 1 do 50 let.");
 if(!Number.isFinite(v.annualBenefit)||v.annualBenefit<0)add("annualBenefit","Přínos nesmí být záporný.");
 if(!Number.isFinite(v.annualCosts)||v.annualCosts<0)add("annualCosts","Náklady nesmí být záporné.");
 if(!Number.isFinite(v.discountRate)||v.discountRate<=-99||v.discountRate>100)add("discountRate","Sazba musí být vyšší než −99 % a nejvýše 100 %.");
 if(!Number.isFinite(v.firstYearRamp)||v.firstYearRamp<0||v.firstYearRamp>200)add("firstYearRamp","Náběh musí být od 0 do 200 %.");
 if(!Number.isFinite(v.benefitGrowth)||v.benefitGrowth<=-100||v.benefitGrowth>100)add("benefitGrowth","Změna musí být vyšší než −100 % a nejvýše 100 %.");
 if(!Number.isFinite(v.costGrowth)||v.costGrowth<=-100||v.costGrowth>100)add("costGrowth","Změna musí být vyšší než −100 % a nejvýše 100 %.");
 if(!Number.isFinite(v.extraInvestment)||v.extraInvestment<0)add("extraInvestment","Dodatečná investice nesmí být záporná.");
 if(!Number.isInteger(v.extraInvestmentYear)||v.extraInvestmentYear<1||v.extraInvestmentYear>Math.max(1,v.projectYears||1))add("extraInvestmentYear","Rok musí být uvnitř hodnoceného období.");
 if(!Number.isFinite(v.residualValue)||v.residualValue<0)add("residualValue","Zůstatková hodnota nesmí být záporná.");
 return first;
}
function npvAtRate(cashflows,rate){if(rate<=-1)return NaN;return cashflows.reduce((sum,cf,i)=>sum+cf/Math.pow(1+rate,i),0)}
function findIrr(cashflows){let signChanges=0,lastSign=0;for(const cf of cashflows){const s=Math.sign(cf);if(s&&lastSign&&s!==lastSign)signChanges++;if(s)lastSign=s}if(signChanges!==1)return NaN;
 let lo=-.9999,hi=1,fl=npvAtRate(cashflows,lo),fh=npvAtRate(cashflows,hi),guard=0;while(Number.isFinite(fh)&&fl*fh>0&&hi<1e6&&guard++<80){hi*=2;fh=npvAtRate(cashflows,hi)}if(!Number.isFinite(fl)||!Number.isFinite(fh)||fl*fh>0)return NaN;
 for(let i=0;i<160;i++){const mid=(lo+hi)/2,fm=npvAtRate(cashflows,mid);if(Math.abs(fm)<1e-7)return mid;if(fl*fm<=0){hi=mid;fh=fm}else{lo=mid;fl=fm}}return (lo+hi)/2;
}
function interpolatedPayback(series,target=0){for(let i=1;i<series.length;i++){const prev=series[i-1],cur=series[i];if(prev<target&&cur>=target&&cur>prev)return (i-1)+(target-prev)/(cur-prev);if(prev===target)return i-1}return series[0]>=target?0:Infinity}
function calculate(v,benefitFactor=1,costFactor=1){
 const rows=[];let nominal=-v.initialInvestment,discounted=-v.initialInvestment,totalCapital=v.initialInvestment,totalOperating=0,totalBenefits=0;
 const cashflows=[-v.initialInvestment],nominalSeries=[-v.initialInvestment],discountedSeries=[-v.initialInvestment];
 for(let year=1;year<=v.projectYears;year++){
   const ramp=year===1?v.firstYearRamp/100:1;
   const benefit=v.annualBenefit*benefitFactor*ramp*Math.pow(1+v.benefitGrowth/100,year-1);
   const costs=v.annualCosts*costFactor*Math.pow(1+v.costGrowth/100,year-1);
   const extra=year===v.extraInvestmentYear?v.extraInvestment:0;
   const residual=year===v.projectYears?v.residualValue:0;
   const cf=benefit-costs-extra+residual;
   const pv=cf/Math.pow(1+v.discountRate/100,year);
   nominal+=cf; discounted+=pv; totalBenefits+=benefit+residual; totalOperating+=costs; totalCapital+=extra;
   cashflows.push(cf); nominalSeries.push(nominal); discountedSeries.push(discounted);
   rows.push({year,benefit,costs,extra,residual,cf,pv,nominal,discounted});
 }
 const netProfit=cashflows.reduce((a,b)=>a+b,0);
 const roi=netProfit/totalCapital*100;
 const irr=findIrr(cashflows);
 const payback=interpolatedPayback(nominalSeries,0);
 const discountedPayback=interpolatedPayback(discountedSeries,0);
 const pvFuture=discounted+v.initialInvestment;
 const pi=pvFuture/v.initialInvestment;
 const buffer=pvFuture>0?(discounted/pvFuture*100):NaN;
 return {...v,rows,cashflows,nominalSeries,discountedSeries,totalCapital,totalOperating,totalBenefits,netProfit,roi,npv:discounted,irr,payback,discountedPayback,pvFuture,pi,buffer};
}
function solveBreakEvenBenefit(v){let lo=0,hi=Math.max(v.annualBenefit*2,1);const f=x=>calculate({...v,annualBenefit:x}).npv;let guard=0;while(f(hi)<0&&hi<1e15&&guard++<100)hi*=2;if(f(hi)<0)return NaN;for(let i=0;i<120;i++){const mid=(lo+hi)/2;if(f(mid)>=0)hi=mid;else lo=mid}return hi}
function maxInitialInvestment(v){const clone={...v,initialInvestment:0.000001};const r=calculate(clone);return Math.max(0,r.pvFuture)}
function decision(r){const gates=[r.npv>0,Number.isFinite(r.irr)&&r.irr>r.discountRate/100,Number.isFinite(r.payback)&&r.payback<=r.projectYears],score=gates.filter(Boolean).length;
 if(r.npv<0)return{score,gates,badge:"Základní scénář ničí dnešní hodnotu",title:"Projekt neprochází finančním filtrem",text:"Při zadaných tocích a diskontní sazbě je NPV záporná. Prověřte cenu, přínosy, náklady i časování dříve, než projekt posunete dál.",cls:"is-negative"};
 if(score<3)return{score,gates,badge:"Projekt vytváří hodnotu, ale má slabé místo",title:"Výsledek potřebuje další kontrolu",text:"NPV je kladná, ale některá rozhodovací brána není splněna. Zaměřte se na návratnost, IRR nebo strukturu cashflow.",cls:"is-warning"};
 return{score,gates,badge:"Základní scénář vytváří hodnotu",title:"Projekt prochází finančním filtrem",text:"Rozhodnutí ještě potvrďte opatrným scénářem, úplností nákladů a reálným plánem cashflow.",cls:""};
}
function formatYears(x){if(!Number.isFinite(x))return"Nevrátí se";if(x<.08)return"ihned";return `${num(x)} ${x===1?"rok":x<5?"roku":"let"}`}
function renderChart(r){const svg=$("cashflowChart"),w=584,h=176,x0=36,y0=28;const all=[...r.nominalSeries,...r.discountedSeries,0],min=Math.min(...all),max=Math.max(...all),range=Math.max(1,max-min);const x=i=>x0+i/(r.projectYears||1)*w,y=v=>y0+(max-v)/range*h;
 const path=arr=>arr.map((v,i)=>`${i?"L":"M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");$("nominalLinePath").setAttribute("d",path(r.nominalSeries));$("discountedLinePath").setAttribute("d",path(r.discountedSeries));const zy=y(0);$("zeroAxis").setAttribute("y1",zy);$("zeroAxis").setAttribute("y2",zy);
 const labels=$("chartLabels");labels.replaceChildren();const picks=[0,Math.round(r.projectYears/2),r.projectYears].filter((v,i,a)=>a.indexOf(v)===i);for(const i of picks){const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x",x(i));t.setAttribute("y",232);t.setAttribute("text-anchor",i===0?"start":i===r.projectYears?"end":"middle");t.setAttribute("class","axis-label");t.textContent=i===0?"Start":`${i}. rok`;labels.append(t)}
 const heroW=520,heroH=120,heroMin=Math.min(...r.nominalSeries),heroMax=Math.max(...r.nominalSeries),heroRange=Math.max(1,heroMax-heroMin);const hp=r.nominalSeries.map((v,i)=>`${i?"L":"M"}${(i/r.projectYears*heroW).toFixed(1)} ${(145-(v-heroMin)/heroRange*115).toFixed(1)}`).join(" ");$("heroLinePath").setAttribute("d",hp);$("heroAreaPath").setAttribute("d",`${hp} L520 160 L0 160 Z`);
}
function renderRows(r){const box=$("cashflowRows");box.replaceChildren();for(const row of r.rows){const d=document.createElement("div");const vals=[`${row.year}. rok`,money(row.benefit),signedMoney(-row.costs-row.extra+row.residual),signedMoney(row.cf),signedMoney(row.discounted)];vals.forEach((v,i)=>{const e=document.createElement(i===0?"span":"strong");e.textContent=v;if(i>0&&v.startsWith("−"))e.className="negative";d.append(e)});box.append(d)}}
function renderSensitivity(v){const tbody=$("sensitivityBody");tbody.replaceChildren();for(const bf of [.8,1,1.2]){const tr=document.createElement("tr");const h=document.createElement("td");h.textContent=bf===1?"Základ":`${bf<1?"−":"+"}20 %`;tr.append(h);for(const cf of [.8,1,1.2]){const r=calculate(v,bf,cf),td=document.createElement("td");td.textContent=money(r.npv);td.className=`sensitivity-cell ${r.npv<0?"negative":r.npv<Math.max(1,v.initialInvestment*.1)?"warning":"positive"}`;tr.append(td)}tbody.append(tr)}
 const low=calculate(v,.8,1.2),base=calculate(v),high=calculate(v,1.2,.8);set("scenarioLowNpv",money(low.npv));set("scenarioBaseNpv",money(base.npv));set("scenarioHighNpv",money(high.npv));set("scenarioLowText",low.npv<0?"Opatrná kombinace vytváří zápornou NPV. Projekt je citlivý a potřebuje konkrétní plán ochrany přínosu nebo snížení nákladů.":"I opatrná kombinace zůstává nad nulou, ale porovnejte velikost rezervy s nejistotou vstupů.");
}
function render(options={}){const v=read(),msg=validate(v),box=$("formMessage");if(msg){box.hidden=false;box.textContent=msg;set("resultStatus","Zkontrolujte zadání");return false}box.hidden=true;const r=calculate(v),d=decision(r),irrPct=Number.isFinite(r.irr)?r.irr*100:NaN;
 set("npvResult",signedMoney(r.npv));set("roiResult",pct(r.roi));set("irrResult",pct(irrPct));set("paybackResult",formatYears(r.payback));set("discountedPaybackResult",formatYears(r.discountedPayback));set("resultStatus","Model přepočítán");set("resultSentence",r.npv>=0?"Budoucí přínosy po diskontování převyšují všechny zadané investiční výdaje.":"Současná hodnota budoucích přínosů nepokrývá zadané investiční výdaje.");
 set("gateScore",`${d.score} ze 3 ${d.score===1?"splněna":d.score<5?"splněny":"splněno"}`);[["gateNpv",d.gates[0],"NPV je kladná","NPV je záporná"],["gateIrr",d.gates[1],"IRR převyšuje diskont","IRR nepřevyšuje diskont"],["gatePayback",d.gates[2],"Projekt se vrátí v horizontu","Projekt se v horizontu nevrátí"]].forEach(([id,ok,a,b])=>{set(id,ok?a:b);$(id).classList.toggle("is-fail",!ok)});
 const card=$("decisionCard");card.classList.remove("is-warning","is-negative");if(d.cls)card.classList.add(d.cls);set("decisionBadge",d.badge);set("decisionTitle",d.title);set("decisionText",d.text);card.querySelector(".goal-icon").textContent=d.cls==="is-negative"?"!":d.cls==="is-warning"?"~":"✓";
 set("breakEvenBenefit",money(solveBreakEvenBenefit(v)));set("maxInitialInvestment",money(maxInitialInvestment(v)));set("npvBuffer",Number.isFinite(r.buffer)?pct(r.buffer):"—");set("profitabilityIndex",Number.isFinite(r.pi)?num(r.pi):"—");
 set("chartCaption",`${v.projectYears}letý horizont`);renderChart(r);renderRows(r);renderSensitivity(v);
 set("heroNpv",signedMoney(r.npv));set("heroVerdict",r.npv>=0?"projekt vytváří hodnotu":"projekt hodnotu nevytváří");set("heroInitial",signedMoney(-v.initialInvestment));set("heroCumulative",signedMoney(r.nominalSeries.at(-1)));set("heroRoi",pct(r.roi));set("heroIrr",pct(irrPct));set("heroPayback",formatYears(r.payback));set("heroNote",`${v.projectYears}letý model při diskontní sazbě ${pct(v.discountRate)}, bez započtení financování a daní.`);
 if(options.scroll&&matchMedia("(max-width:720px)").matches)$("vysledek").scrollIntoView({behavior:"smooth",block:"start"});return true;
}
function formatOnBlur(input){const v=parse(input.value);if(Number.isFinite(v)){if(["projectYears","extraInvestmentYear"].includes(input.id))input.value=String(Math.round(v));else input.value=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2}).format(v)}}
form.addEventListener("submit",e=>{e.preventDefault();render({scroll:true})});ids.forEach(id=>{const input=inputs[id];input.addEventListener("input",()=>render());input.addEventListener("change",()=>render());input.addEventListener("blur",()=>{formatOnBlur(input);render()})});
document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>{const advanced=btn.dataset.mode==="advanced";advancedMode=advanced;document.querySelectorAll("[data-mode]").forEach(b=>{const active=b===btn;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active))});$("advancedPanel").classList.toggle("is-hidden",!advanced);render()}));
$("resetButton").addEventListener("click",()=>{for(const [id,val] of Object.entries(defaults))inputs[id].value=val;document.querySelector('[data-mode="basic"]').click();render()});render();
})();