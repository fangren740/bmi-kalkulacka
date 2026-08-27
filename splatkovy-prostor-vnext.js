(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("payForm");
  if (!form) return;
  const nf0 = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const ids = ["income","expenses","existing","protected","planned","savings","incomeShock","expenseShock"];
  const defaults = { income:"75000", expenses:"42000", existing:"6500", protected:"12000", planned:"8000", savings:"250000", incomeShock:"8", expenseShock:"5" };

  function parseNumber(value){
    const raw = String(value ?? "").trim().replace(/[\s\u00a0']/g, "").replace(",", ".");
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }
  const money = (n) => `${nf0.format(Math.round(Number.isFinite(n) ? n : 0))} Kč`;
  const pct = (n) => `${nf1.format(Number.isFinite(n) ? n : 0)} %`;
  const months = (n) => `${nf1.format(Number.isFinite(n) ? n : 0)} měs.`;
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const set = (id,value) => { const el=$(id); if(el) el.textContent=value; };

  function values(){
    const out={}; ids.forEach(id=>out[id]=parseNumber($(id).value)); out.housing=$("housingMode").checked; return out;
  }
  function validate(v){
    if (!(v.income>0)) return ["income","Zadejte kladný čistý měsíční příjem."];
    for (const id of ["expenses","existing","protected","planned","savings"]){ if (!(v[id]>=0)) return [id,"Zadejte nezápornou částku."]; }
    if (!(v.incomeShock>=0 && v.incomeShock<=80)) return ["incomeShock","Pokles příjmu nastavte mezi 0 a 80 %."];
    if (!(v.expenseShock>=0 && v.expenseShock<=100)) return ["expenseShock","Růst výdajů nastavte mezi 0 a 100 %."];
    return null;
  }
  function model(v){
    const freeBefore = v.income - v.expenses - v.existing;
    const ceiling = Math.max(0, freeBefore - v.protected);
    const leftAfter = freeBefore - v.planned;
    const headroom = ceiling - v.planned;
    const debtRatio = v.income>0 ? (v.existing+v.planned)/v.income*100 : 0;
    const monthlyOut = v.expenses+v.existing+v.planned;
    const reserveMonths = monthlyOut>0 ? v.savings/monthlyOut : 0;
    const stressIncome = v.income*(1-v.incomeShock/100);
    const stressExpenses = v.expenses*(1+v.expenseShock/100);
    const stressLeft = stressIncome-stressExpenses-v.existing-v.planned;
    const stressBuffer = stressLeft-v.protected;
    const cnBTotal = v.income*.40;
    const cnbNew = Math.max(0,cnBTotal-v.existing);
    let status="good";
    if (leftAfter < 0 || v.planned > Math.max(0,freeBefore)) status="bad";
    else if (leftAfter < v.protected || stressLeft < 0) status="warn";
    else if (stressLeft < v.protected) status="watch";
    return {freeBefore,ceiling,leftAfter,headroom,debtRatio,reserveMonths,monthlyOut,stressIncome,stressExpenses,stressLeft,stressBuffer,cnBTotal,cnbNew,status};
  }
  function statusCopy(r){
    if(r.status==="bad") return ["Rozpočet nevychází","is-bad","Plánovaná splátka už podle zadaných částek spotřebuje víc, než vám po výdajích a současných dluzích zbývá."];
    if(r.status==="warn") return ["Rozpočet je napjatý","is-warn","Běžný měsíc může ještě vyjít, ale chráněný polštář nebo stresový scénář už nevychází podle vašeho nastavení."];
    if(r.status==="watch") return ["Běžný měsíc drží","is-watch","V běžném měsíci chráněný polštář zůstává, ale modelový stres ho už částečně ukrajuje."];
    return ["Rozpočet drží","is-good","Plánovaná splátka je pod vaším nastaveným stropem a modelový stres stále ponechává chráněný polštář."];
  }
  function render(){
    const v=values(), err=validate(v), error=$("formError");
    ids.forEach(id=>$(id).removeAttribute("aria-invalid"));
    if(err){ error.hidden=false; error.textContent=err[1]; $(err[0]).setAttribute("aria-invalid","true"); return false; }
    error.hidden=true;
    const r=model(v), [title,badge,desc]=statusCopy(r);
    set("resultTitle",title); const badgeEl=$("resultBadge"); badgeEl.className=`pay67-badge ${badge}`; badgeEl.textContent="podle zadaného modelu";
    set("ceilingValue",nf0.format(Math.round(r.ceiling))); set("ceilingNote",`Po odečtení výdajů, současných splátek a chráněných ${money(v.protected)}.`);
    set("leftAfter",money(r.leftAfter)); set("leftAfterMeta",`${r.leftAfter-v.protected>=0?"o ":"o "}${money(Math.abs(r.leftAfter-v.protected))} ${r.leftAfter-v.protected>=0?"více":"méně"} než chráněný polštář`);
    set("debtRatio",pct(r.debtRatio)); set("reserveMonths",months(r.reserveMonths)); set("freeBefore",money(r.freeBefore));
    const gaugeMax=Math.max(1,r.freeBefore,v.planned,r.ceiling); const planPct=clamp(v.planned/gaugeMax*100,0,100); const ceilPct=clamp(r.ceiling/gaugeMax*100,0,100); $("plannedMarker").style.left=`${planPct}%`; $("ceilingMarker").style.left=`${ceilPct}%`; $("protectedZone").style.width=`${ceilPct}%`; set("plannedGaugeLabel",`plán ${money(v.planned)}`); set("gaugeMaxLabel",money(gaugeMax));
    set("gaugeCaption", r.headroom>=0 ? `Plánovaná splátka je ${money(r.headroom)} pod vaším nastaveným stropem.` : `Plánovaná splátka je ${money(Math.abs(r.headroom))} nad vaším nastaveným stropem.`);
    $("housingRef").hidden=!v.housing; if(v.housing){ set("housingRefText",`Při příjmu ${money(v.income)} odpovídá 40% reference celkovým splátkám ${money(r.cnBTotal)} měsíčně; po odečtení současných splátek je to ${money(r.cnbNew)} pro nový úvěr. ČNB aktuálně nemá závaznou horní hranici DSTI, ale nad 40 % doporučuje vysokou obezřetnost.`); }
    set("runwayIncome",`${money(v.income)} příjem`); set("segExpensesText",money(v.expenses)); set("segExistingText",money(v.existing)); set("segPlannedText",money(v.planned)); set("segProtectedText",money(v.protected)); const extra=Math.max(0,r.leftAfter-v.protected); set("segExtraText",money(extra));
    const denom=Math.max(1,v.income); const pieces=[["segExpenses",v.expenses],["segExisting",v.existing],["segPlanned",v.planned],["segProtected",Math.max(0,Math.min(v.protected,r.leftAfter))],["segExtra",extra]]; pieces.forEach(([id,val])=>{const el=$(id); el.style.flexBasis=`${clamp(val/denom*100,0,100)}%`; el.hidden=val<=0;});
    set("runwayStatus", r.leftAfter>=v.protected ? "Po nové splátce zůstává chráněný polštář celý." : "Nová splátka ukrajuje z částky, kterou chcete chránit."); set("runwayDelta", `${r.leftAfter-v.protected>=0?"+":"−"}${money(Math.abs(r.leftAfter-v.protected))} ${r.leftAfter-v.protected>=0?"nad něj":"do něj"}`);
    set("normalLeft",money(r.leftAfter)); set("normalBuffer",`${r.leftAfter-v.protected>=0?"+":"−"}${money(Math.abs(r.leftAfter-v.protected))}`); set("stressLabel",`STRES · PŘÍJEM −${nf1.format(v.incomeShock)} % · VÝDAJE +${nf1.format(v.expenseShock)} %`); set("stressLeft",money(r.stressLeft)); set("stressBuffer",`${r.stressBuffer>=0?"+":"−"}${money(Math.abs(r.stressBuffer))}`);
    let stressText="Modelový stres stále ponechává celý chráněný polštář."; if(r.stressLeft<0) stressText="Modelový stres už vytváří měsíční deficit. To je výrazný varovný signál před novým závazkem."; else if(r.stressBuffer<0) stressText="V běžném měsíci máte prostor, ale v modelovém stresu už chráněný polštář klesne. To není automatické „ne“, ale je to důvod pracovat s rezervou."; $("stressNote").innerHTML=`<b>Co z toho plyne:</b><span>${stressText}</span>`;
    return true;
  }
  form.addEventListener("submit",e=>{e.preventDefault(); render(); if(matchMedia("(max-width:880px)").matches) $("vysledek").scrollIntoView({behavior:"smooth",block:"start"});});
  ids.forEach(id=>{ $(id).addEventListener("input",render); $(id).addEventListener("change",render); }); $("housingMode").addEventListener("change",render);
  $("resetBtn").addEventListener("click",()=>{ Object.entries(defaults).forEach(([id,val])=>$(id).value=val); $("housingMode").checked=false; $("advanced").open=false; render(); $("income").focus(); });
  $("copyBtn").addEventListener("click",async()=>{ const text=`Splátkový prostor: ${$("ceilingValue").textContent} Kč/měs.\nPlánovaná splátka: ${money(values().planned)}\nPo splátce zůstane: ${$("leftAfter").textContent}\nVšechny splátky / příjem: ${$("debtRatio").textContent}\nStresový zůstatek: ${$("stressLeft").textContent}`; try{await navigator.clipboard.writeText(text); $("copyBtn").textContent="Zkopírováno"; setTimeout(()=>$("copyBtn").textContent="Zkopírovat stručný výsledek",1400);}catch(_){$("copyBtn").textContent="Kopírování není dostupné";} });
  const menu=$("menuBtn"), mobile=$("mobile-nav"); if(menu&&mobile){menu.addEventListener("click",()=>{const on=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!on));mobile.classList.toggle("is-open",!on);});document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu.setAttribute("aria-expanded","false");mobile.classList.remove("is-open");}});}
  render();
})();
