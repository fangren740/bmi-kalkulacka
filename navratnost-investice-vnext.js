(()=>{
"use strict";
const $=id=>document.getElementById(id);
const form=$("roiForm"); if(!form)return;
let advancedMode=false;
const ids=["initialInvestment","projectYears","annualBenefit","annualCosts","discountRate","firstYearRamp","benefitGrowth","costGrowth","extraInvestment","extraInvestmentYear","residualValue"];
const defaults={initialInvestment:"250 000",projectYears:"5",annualBenefit:"120 000",annualCosts:"20 000",discountRate:"8",firstYearRamp:"100",benefitGrowth:"0",costGrowth:"0",extraInvestment:"0",extraInvestmentYear:"3",residualValue:"0"};
const inputs=Object.fromEntries(ids.map(id=>[id,$(id)]));
const moneyFmt=new Intl.NumberFormat("cs-CZ",{style:"currency",currency:"CZK",maximumFractionDigits:0});
const numFmt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2});
const money=n=>Number.isFinite(n)?moneyFmt.format(n):"—";
const signedMoney=n=>Number.isFinite(n)?`${n<0?"−":"+"}${money(Math.abs(n))}`:"—";
const pct=n=>Number.isFinite(n)?`${numFmt.format(n)} %`:"—";
const num=n=>Number.isFinite(n)?numFmt.format(n):"—";
const parse=v=>{const s=String(v??"").trim().replace(/[\s\u00a0]/g,"").replace(",", ".");return s===""?NaN:Number(s)};
const set=(id,v)=>{const el=$(id);if(el)el.textContent=v};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function read(){
 const v=Object.fromEntries(ids.map(id=>[id,parse(inputs[id].value)]));
 if(!advancedMode){v.discountRate=0;v.firstYearRamp=100;v.benefitGrowth=0;v.costGrowth=0;v.extraInvestment=0;v.extraInvestmentYear=1;v.residualValue=0}
 return v;
}
function fieldError(id,msg){const input=inputs[id],err=$(id+"Error");input?.closest(".roi72-field")?.classList.toggle("has-error",!!msg);if(input)input.setAttribute("aria-invalid",msg?"true":"false");if(err)err.textContent=msg||""}
function validate(v){ids.forEach(id=>fieldError(id,""));let first="";const add=(id,msg)=>{fieldError(id,msg);if(!first)first=msg};
 if(!Number.isFinite(v.initialInvestment)||v.initialInvestment<=0)add("initialInvestment","Zadejte investici vyšší než nula.");
 if(!Number.isInteger(v.projectYears)||v.projectYears<1||v.projectYears>50)add("projectYears","Použijte celé číslo od 1 do 50 let.");
 if(!Number.isFinite(v.annualBenefit)||v.annualBenefit<0)add("annualBenefit","Roční přínos nesmí být záporný.");
 if(!Number.isFinite(v.annualCosts)||v.annualCosts<0)add("annualCosts","Roční náklady nesmí být záporné.");
 if(advancedMode){
   if(!Number.isFinite(v.discountRate)||v.discountRate<=-99||v.discountRate>100)add("discountRate","Sazba musí být vyšší než −99 % a nejvýše 100 %.");
   if(!Number.isFinite(v.firstYearRamp)||v.firstYearRamp<0||v.firstYearRamp>200)add("firstYearRamp","První rok nastavte mezi 0 a 200 %.");
   if(!Number.isFinite(v.benefitGrowth)||v.benefitGrowth<=-100||v.benefitGrowth>100)add("benefitGrowth","Změna musí být vyšší než −100 % a nejvýše 100 %.");
   if(!Number.isFinite(v.costGrowth)||v.costGrowth<=-100||v.costGrowth>100)add("costGrowth","Změna musí být vyšší než −100 % a nejvýše 100 %.");
   if(!Number.isFinite(v.extraInvestment)||v.extraInvestment<0)add("extraInvestment","Dodatečná investice nesmí být záporná.");
   if(!Number.isInteger(v.extraInvestmentYear)||v.extraInvestmentYear<1||v.extraInvestmentYear>Math.max(1,v.projectYears||1))add("extraInvestmentYear","Rok musí ležet uvnitř hodnoceného období.");
   if(!Number.isFinite(v.residualValue)||v.residualValue<0)add("residualValue","Zůstatková hodnota nesmí být záporná.");
 }
 return first;
}
function npvAtRate(cashflows,rate){if(rate<=-1)return NaN;return cashflows.reduce((sum,cf,i)=>sum+cf/Math.pow(1+rate,i),0)}
function signChanges(cashflows){let changes=0,last=0;for(const cf of cashflows){const s=Math.sign(cf);if(!s)continue;if(last&&s!==last)changes++;last=s}return changes}
function findIrr(cashflows){if(signChanges(cashflows)!==1)return NaN;let lo=-.9999,hi=1,fl=npvAtRate(cashflows,lo),fh=npvAtRate(cashflows,hi),guard=0;while(Number.isFinite(fh)&&fl*fh>0&&hi<1e6&&guard++<80){hi*=2;fh=npvAtRate(cashflows,hi)}if(!Number.isFinite(fl)||!Number.isFinite(fh)||fl*fh>0)return NaN;for(let i=0;i<160;i++){const mid=(lo+hi)/2,fm=npvAtRate(cashflows,mid);if(Math.abs(fm)<1e-7)return mid;if(fl*fm<=0){hi=mid;fh=fm}else{lo=mid;fl=fm}}return(lo+hi)/2}
function interpolatedPayback(series){if(series[0]>=0)return 0;for(let i=1;i<series.length;i++){const prev=series[i-1],cur=series[i];if(prev<0&&cur>=0&&cur>prev)return(i-1)+(0-prev)/(cur-prev)}return Infinity}
function calculate(v,benefitFactor=1,costFactor=1){
 const rows=[],cashflows=[-v.initialInvestment],nominalSeries=[-v.initialInvestment],discountedSeries=[-v.initialInvestment];
 let nominal=-v.initialInvestment,discounted=-v.initialInvestment,totalCapital=v.initialInvestment;
 for(let year=1;year<=v.projectYears;year++){
   const ramp=year===1?v.firstYearRamp/100:1;
   const benefit=v.annualBenefit*benefitFactor*ramp*Math.pow(1+v.benefitGrowth/100,year-1);
   const costs=v.annualCosts*costFactor*Math.pow(1+v.costGrowth/100,year-1);
   const extra=year===v.extraInvestmentYear?v.extraInvestment:0;
   const residual=year===v.projectYears?v.residualValue:0;
   const cf=benefit-costs-extra+residual;
   const pv=cf/Math.pow(1+v.discountRate/100,year);
   nominal+=cf;discounted+=pv;totalCapital+=extra;
   cashflows.push(cf);nominalSeries.push(nominal);discountedSeries.push(discounted);
   rows.push({year,benefit,costs,extra,residual,cf,pv,nominal,discounted});
 }
 const netProfit=cashflows.reduce((a,b)=>a+b,0);
 const roi=netProfit/totalCapital*100;
 const irr=findIrr(cashflows);
 return{...v,rows,cashflows,nominalSeries,discountedSeries,totalCapital,netProfit,roi,npv:discounted,irr,payback:interpolatedPayback(nominalSeries),discountedPayback:interpolatedPayback(discountedSeries)};
}
function solveBreakEvenBenefit(v){let lo=0,hi=Math.max(v.annualBenefit*2,1);const f=x=>calculate({...v,annualBenefit:x}).npv;let guard=0;while(f(hi)<0&&hi<1e15&&guard++<100)hi*=2;if(f(hi)<0)return NaN;for(let i=0;i<120;i++){const mid=(lo+hi)/2;if(f(mid)>=0)hi=mid;else lo=mid}return hi}
function maxInitialInvestment(v){const test=calculate({...v,initialInvestment:0.000001});return Math.max(0,test.npv+0.000001)}
function formatYears(x){if(!Number.isFinite(x))return"Nevrátí se";if(x<.04)return"ihned";const rounded=Math.round(x*100)/100;return`${num(rounded)} ${rounded===1?"rok":rounded>1&&rounded<5?"roku":"let"}`}
function crossingYearText(x,years){if(!Number.isFinite(x))return`do ${years}. roku se investice nevrátí`;const y=Math.min(years,Math.floor(x)+1);return x<1?"během 1. roku":`během ${y}. roku`}
function basicMeaning(r){if(!Number.isFinite(r.payback))return`Při zadaném čistém cashflow se investice do ${r.projectYears}. roku nevrátí. ROI za celý horizont je ${pct(r.roi)}.`;if(r.roi<0)return`Investice se sice může částečně vracet, ale za celý zvolený horizont zůstává čistý výsledek záporný (${pct(r.roi)} ROI).`;return`ROI je ${pct(r.roi)} a investice překročí bod nula ${crossingYearText(r.payback,r.projectYears)}. Samotné ROI ale nezohledňuje cenu kapitálu ani riziko odhadu.`}
function advancedVerdict(r){if(!Number.isFinite(r.npv))return"NPV nelze určit z aktuálních vstupů.";if(r.npv>0)return`Při ${pct(r.discountRate)} požadované výnosnosti projekt vytváří ${money(r.npv)} dnešní hodnoty nad investici.`;if(Math.abs(r.npv)<1)return`Při ${pct(r.discountRate)} požadované výnosnosti je projekt přibližně na hraně NPV = 0.`;return`Při ${pct(r.discountRate)} požadované výnosnosti projekt chybí o ${money(Math.abs(r.npv))} dnešní hodnoty do NPV = 0.`}
function formatInput(input){const v=parse(input.value);if(!Number.isFinite(v))return;if(["projectYears","extraInvestmentYear"].includes(input.id))input.value=String(Math.round(v));else input.value=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2}).format(v)}
function updateHero(r){set("heroPayback",formatYears(r.payback));set("heroPaybackMeta",Number.isFinite(r.payback)?`hranice se překročí ${crossingYearText(r.payback,r.projectYears)}`:`do ${r.projectYears}. roku bez návratu`);set("heroRoi",pct(r.roi));set("heroProfit",money(r.netProfit));set("heroAnnual",money(r.annualBenefit-r.annualCosts));set("heroNote",`Model: investice ${money(r.initialInvestment)}, roční přínos ${money(r.annualBenefit)}, roční náklady ${money(r.annualCosts)}, horizont ${r.projectYears} let${advancedMode?`, diskont ${pct(r.discountRate)}`:""}.`);
 const ratio=Number.isFinite(r.payback)?clamp(r.payback/r.projectYears,0,1):1;$("heroTrackMark").style.left=`${ratio*100}%`;$("heroTrackFill").style.width=`${Math.max(4,ratio*100)}%`;
}
function renderChart(r){
 const svg=$("cashflowChart"),w=680,h=220,x0=54,y0=34;const series=advancedMode?[...r.nominalSeries,...r.discountedSeries,0]:[...r.nominalSeries,0];const min=Math.min(...series),max=Math.max(...series),range=Math.max(1,max-min);const x=i=>x0+i/(r.projectYears||1)*w,y=v=>y0+(max-v)/range*h;
 const path=arr=>arr.map((v,i)=>`${i?"L":"M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");const nominalPath=path(r.nominalSeries);$("nominalLinePath").setAttribute("d",nominalPath);$("nominalAreaPath").setAttribute("d",`${nominalPath} L${x(r.projectYears).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`);$("discountedLinePath").setAttribute("d",advancedMode?path(r.discountedSeries):"");$("discountedLinePath").style.display=advancedMode?"":"none";const zy=y(0);$("zeroAxis").setAttribute("y1",zy);$("zeroAxis").setAttribute("y2",zy);$("discountLegend").hidden=!advancedMode;
 const labels=$("chartLabels");labels.replaceChildren();const picks=[0,...Array.from({length:r.projectYears},(_,i)=>i+1)].filter(i=>r.projectYears<=8||i===0||i===r.projectYears||i===Math.round(r.projectYears/2));for(const i of picks){const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("x",x(i));t.setAttribute("y",284);t.setAttribute("text-anchor",i===0?"start":i===r.projectYears?"end":"middle");t.setAttribute("class","axis-label");t.textContent=i===0?"start":`${i}. rok`;labels.append(t)}
 const dots=$("chartDots");dots.replaceChildren();r.nominalSeries.forEach((v,i)=>{if(i!==0&&i!==r.projectYears&&r.projectYears>8)return;const c=document.createElementNS("http://www.w3.org/2000/svg","circle");c.setAttribute("cx",x(i));c.setAttribute("cy",y(v));c.setAttribute("r",i===Math.ceil(r.payback)?"7":"5");c.setAttribute("class",i===Math.ceil(r.payback)?"cross-dot":"dot");dots.append(c)});
 const aria=`Kumulované nominální cashflow začíná na ${money(r.nominalSeries[0])} a končí na ${money(r.nominalSeries.at(-1))}. ${Number.isFinite(r.payback)?`Bod návratnosti nastává přibližně za ${formatYears(r.payback)}.`:`V hodnoceném období se investice nevrátí.`}${advancedMode?` Diskontovaná křivka končí na ${money(r.discountedSeries.at(-1))}.`:""}`;$("runwayChart").setAttribute("aria-label",aria);
 set("runwayHeadline",`${signedMoney(r.nominalSeries[0])} → ${signedMoney(r.nominalSeries.at(-1))}`);set("runwayPayback",formatYears(r.payback));set("runwaySecondLabel",advancedMode?"NPV na konci horizontu":"Konec horizontu");set("runwayEnd",advancedMode?signedMoney(r.npv):signedMoney(r.netProfit));set("runwayInsight",Number.isFinite(r.payback)?`Investice překročí nulu ${crossingYearText(r.payback,r.projectYears)} a do konce ${r.projectYears}. roku vytvoří ${money(r.netProfit)} nominálního čistého zisku.${advancedMode?` Po diskontování vychází NPV ${signedMoney(r.npv)}.`:""}`:`Kumulované cashflow zůstává do konce ${r.projectYears}. roku pod nulou. Čistý nominální výsledek je ${signedMoney(r.netProfit)}.`);
}
function renderSwitching(v,r){if(!advancedMode){set("breakEvenBenefit","—");set("breakEvenBenefitText","Zapněte pokročilý režim a zadejte diskontní sazbu.");set("maxInitialInvestment","—");set("stressNpv","—");set("stressText","Přínos −15 % a náklady +15 %. Nejde o předpověď, ale o rychlý test odolnosti.");$("advancedPrompt").hidden=false;return}
 const minBenefit=solveBreakEvenBenefit(v),maxInitial=maxInitialInvestment(v),stress=calculate(v,.85,1.15);set("breakEvenBenefit",money(minBenefit));const gap=v.annualBenefit-minBenefit;set("breakEvenBenefitText",gap>=0?`Aktuální roční přínos je o ${money(gap)} nad hranicí NPV = 0.`:`Aktuální roční přínos je o ${money(Math.abs(gap))} pod potřebnou hranicí.`);set("maxInitialInvestment",money(maxInitial));set("stressNpv",signedMoney(stress.npv));set("stressText",stress.npv>=0?"I při přínosu −15 % a nákladech +15 % zůstává NPV nad nulou. Ověřte, zda je tato odchylka pro váš projekt realistická.":"Při přínosu −15 % a nákladech +15 % padá NPV pod nulu. Projekt je na tyto předpoklady citlivý.");$("advancedPrompt").hidden=true;
 const ratio=minBenefit>0?clamp(v.annualBenefit/minBenefit,.1,2):1;$("breakEvenMarker").style.transform=`translate(-50%,-50%) scale(${clamp(.8+ratio*.18,.85,1.25)})`;
}
function render(options={}){const v=read(),msg=validate(v),box=$("formMessage");if(msg){box.hidden=false;box.textContent=msg;set("resultStatus","Zkontrolujte zadání");return false}box.hidden=true;const r=calculate(v);const annualNet=v.annualBenefit-v.annualCosts;const simpleBreak=v.projectYears>0?v.initialInvestment/v.projectYears:NaN;
 set("resultStatus",advancedMode?"Pokročilý model":"Základní model");set("paybackResult",formatYears(r.payback));set("paybackSentence",Number.isFinite(r.payback)?`Počáteční investice se podle kumulovaného cashflow překročí ${crossingYearText(r.payback,r.projectYears)}.`:`Při zadaném cashflow se investice do ${r.projectYears}. roku nevrátí.`);set("roiResult",pct(r.roi));set("profitResult",money(r.netProfit));set("annualNetResult",money(annualNet));set("simpleBreakEven",`${money(simpleBreak)}/rok`);set("resultMeaning",basicMeaning(r));set("compareRoi",`Aktuálně: ${pct(r.roi)}`);
 const advancedResults=$("advancedResults");advancedResults.hidden=!advancedMode;if(advancedMode){set("npvResult",signedMoney(r.npv));set("irrResult",Number.isFinite(r.irr)?pct(r.irr*100):"Nelze jednoznačně");set("discountedPaybackResult",formatYears(r.discountedPayback));set("advancedVerdict",advancedVerdict(r));set("compareNpv",`Aktuálně: ${signedMoney(r.npv)}`);set("compareIrr",Number.isFinite(r.irr)?`Aktuálně: ${pct(r.irr*100)}`:"Aktuálně: nejednoznačná")}else{set("compareNpv","Zapněte pokročilý režim");set("compareIrr","Zapněte pokročilý režim")}
 updateHero(r);renderChart(r);renderSwitching(v,r);window.__roi72={v,r};if(options.scroll&&matchMedia("(max-width:700px)").matches)$("vysledek").scrollIntoView({behavior:"smooth",block:"start"});return true;
}
function setMode(mode){advancedMode=mode==="advanced";document.querySelectorAll("[data-mode]").forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active))});$("advancedPanel").hidden=!advancedMode;render()}
function scenarioUrl(){const v=Object.fromEntries(ids.map(id=>[id,parse(inputs[id].value)]));const map={initialInvestment:"i",projectYears:"y",annualBenefit:"b",annualCosts:"c",discountRate:"r",firstYearRamp:"fr",benefitGrowth:"bg",costGrowth:"cg",extraInvestment:"e",extraInvestmentYear:"ey",residualValue:"rv"};const u=new URL(location.href);u.search="";for(const [k,q] of Object.entries(map)){if(Number.isFinite(v[k]))u.searchParams.set(q,String(v[k]))}if(advancedMode)u.searchParams.set("mode","advanced");u.hash="kalkulacka";return u.toString()}
function loadQuery(){const p=new URLSearchParams(location.search),map={i:"initialInvestment",y:"projectYears",b:"annualBenefit",c:"annualCosts",r:"discountRate",fr:"firstYearRamp",bg:"benefitGrowth",cg:"costGrowth",e:"extraInvestment",ey:"extraInvestmentYear",rv:"residualValue"};let any=false;for(const [q,id] of Object.entries(map)){if(p.has(q)&&Number.isFinite(Number(p.get(q)))){inputs[id].value=p.get(q);formatInput(inputs[id]);any=true}}if(p.get("mode")==="advanced")advancedMode=true;return any}
async function copyText(text,button,label){try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent=label;setTimeout(()=>button.textContent=old,1600)}catch{const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.append(ta);ta.select();document.execCommand("copy");ta.remove();const old=button.textContent;button.textContent=label;setTimeout(()=>button.textContent=old,1600)}}
form.addEventListener("submit",e=>{e.preventDefault();render({scroll:true})});ids.forEach(id=>{const input=inputs[id];input.addEventListener("input",()=>render());input.addEventListener("change",()=>render());input.addEventListener("blur",()=>{formatInput(input);render()})});document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));$("enableAdvanced").addEventListener("click",()=>{setMode("advanced");$("kalkulacka").scrollIntoView({behavior:"smooth",block:"start"})});$("resetButton").addEventListener("click",()=>{for(const [id,val] of Object.entries(defaults))inputs[id].value=val;setMode("basic")});$("copyButton").addEventListener("click",()=>{if(!window.__roi72)return;const {r}=window.__roi72;const text=`Návratnost investice: ${formatYears(r.payback)} | ROI ${pct(r.roi)} | čistý zisk ${money(r.netProfit)}${advancedMode?` | NPV ${signedMoney(r.npv)} | IRR ${Number.isFinite(r.irr)?pct(r.irr*100):"nelze jednoznačně určit"}`:""}. RychléVýpočty.cz`;copyText(text,$("copyButton"),"Zkopírováno")});$("shareButton").addEventListener("click",()=>copyText(scenarioUrl(),$("shareButton"),"Odkaz zkopírován"));
loadQuery();document.querySelectorAll("[data-mode]").forEach(btn=>{const active=btn.dataset.mode===(advancedMode?"advanced":"basic");btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active))});$("advancedPanel").hidden=!advancedMode;render();
})();
