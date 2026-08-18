(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const number0 = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const number2 = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  let mode = "geometry";
  let nextId = 2;
  let components = [{ id: 1, name: "Deska", type: "slab", values: { length: 6, width: 4, thickness: 12 } }];
  let lastSummary = "";

  const shapes = {
    slab: { label: "Deska", fields: [["length","Délka","m",6],["width","Šířka","m",4],["thickness","Tloušťka","cm",12]] },
    strip: { label: "Základový pás", fields: [["length","Součet délek","m",30],["width","Šířka","cm",50],["height","Výška","cm",60]] },
    footing: { label: "Patky", fields: [["count","Počet","ks",8],["length","Délka","cm",50],["width","Šířka","cm",50],["height","Výška","cm",80]] },
    column: { label: "Válcové sloupy / vrty", fields: [["count","Počet","ks",6],["diameter","Průměr","cm",30],["height","Výška / hloubka","m",1.2]] },
    wall: { label: "Betonová stěna", fields: [["length","Délka","m",5],["height","Výška","m",2],["thickness","Tloušťka","cm",20]] }
  };
  const bags = {
    b208:{name:"quick-mix B 208", yield:12},
    be04:{name:"quick-mix BE 04/C16/20", yield:12.5},
    b308:{name:"quick-mix B 308", yield:12},
    cemixb25:{name:"Cemix BETON BASIC B25", yield:12}
  };
  const n = (v, fallback=0) => { const x=Number(v); return Number.isFinite(x) ? x : fallback; };
  const clamp = (v,min,max,fallback) => Math.min(max,Math.max(min,n(v,fallback)));
  const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
  const fmtM3 = (v) => `${number2.format(round2(v))} m³`;
  const pluralPart = (x) => x===1 ? "1 část" : x>=2 && x<=4 ? `${x} části` : `${x} částí`;
  const pluralTrip = (x) => x===1 ? "1 jízda" : x>=2 && x<=4 ? `${x} jízdy` : `${x} jízd`;

  function volumeOf(c){
    const v=c.values||{};
    switch(c.type){
      case "slab": return clamp(v.length,0,10000,0)*clamp(v.width,0,10000,0)*(clamp(v.thickness,0,10000,0)/100);
      case "strip": return clamp(v.length,0,10000,0)*(clamp(v.width,0,10000,0)/100)*(clamp(v.height,0,10000,0)/100);
      case "footing": return clamp(v.count,0,100000,0)*(clamp(v.length,0,10000,0)/100)*(clamp(v.width,0,10000,0)/100)*(clamp(v.height,0,10000,0)/100);
      case "column": { const r=clamp(v.diameter,0,10000,0)/200; return clamp(v.count,0,100000,0)*Math.PI*r*r*clamp(v.height,0,10000,0); }
      case "wall": return clamp(v.length,0,10000,0)*clamp(v.height,0,10000,0)*(clamp(v.thickness,0,10000,0)/100);
      default:return 0;
    }
  }
  function geometryText(c){
    const v=c.values||{};
    const f=(x)=>String(number2.format(n(x)));
    if(c.type==="slab") return `${f(v.length)} × ${f(v.width)} m × ${f(v.thickness)} cm`;
    if(c.type==="strip") return `${f(v.length)} m × ${f(v.width)} × ${f(v.height)} cm`;
    if(c.type==="footing") return `${number0.format(n(v.count))}× ${f(v.length)} × ${f(v.width)} × ${f(v.height)} cm`;
    if(c.type==="column") return `${number0.format(n(v.count))}× Ø ${f(v.diameter)} cm × ${f(v.height)} m`;
    if(c.type==="wall") return `${f(v.length)} × ${f(v.height)} m × ${f(v.thickness)} cm`;
    return "—";
  }
  function renderComponents(){
    const host=$("componentList"); host.innerHTML="";
    components.forEach((c,index)=>{
      const card=document.createElement("div"); card.className="component-card"; card.dataset.id=c.id;
      const options=Object.entries(shapes).map(([key,s])=>`<option value="${key}"${key===c.type?" selected":""}>${s.label}</option>`).join("");
      const fields=shapes[c.type].fields.map(([key,label,unit,def])=>`<label class="field"><span>${label}</span><div class="input-unit"><input data-field="${key}" type="number" min="0" step="${unit==='ks'?'1':'0.01'}" value="${c.values[key] ?? def}"><b>${unit}</b></div></label>`).join("");
      card.innerHTML=`<div class="component-card-head"><span class="component-index">${String(index+1).padStart(2,'0')}</span><input class="component-name" data-name maxlength="40" value="${escapeHtml(c.name)}" aria-label="Název části ${index+1}"><button class="component-remove" data-remove type="button" aria-label="Odebrat část ${index+1}" ${components.length===1?'disabled':''}>×</button></div><div class="component-type-row"><label class="field"><span>Geometrie</span><select data-type>${options}</select></label><div class="component-fields">${fields}</div></div><div class="component-volume">Čistý objem této části: <strong data-component-volume>${fmtM3(volumeOf(c))}</strong></div>`;
      host.appendChild(card);
    });
    bindComponentEvents();
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));}
  function bindComponentEvents(){
    document.querySelectorAll(".component-card").forEach(card=>{
      const id=Number(card.dataset.id);
      card.querySelector("[data-name]")?.addEventListener("input",e=>{const c=components.find(x=>x.id===id); if(c)c.name=e.target.value; renderAll();});
      card.querySelector("[data-type]")?.addEventListener("change",e=>{const c=components.find(x=>x.id===id); if(!c)return; c.type=e.target.value; c.name=shapes[c.type].label; c.values={}; shapes[c.type].fields.forEach(([k,,,d])=>c.values[k]=d); renderComponents(); renderAll();});
      card.querySelectorAll("[data-field]").forEach(inp=>inp.addEventListener("input",e=>{const c=components.find(x=>x.id===id); if(!c)return; c.values[e.target.dataset.field]=n(e.target.value); card.querySelector("[data-component-volume]").textContent=fmtM3(volumeOf(c)); renderAll(false);}));
      card.querySelector("[data-remove]")?.addEventListener("click",()=>{if(components.length<=1)return; components=components.filter(x=>x.id!==id); renderComponents(); renderAll();});
    });
  }
  function netVolume(){ return mode==="direct" ? clamp($("directVolume").value,0,10000,0) : components.reduce((s,c)=>s+volumeOf(c),0); }
  function orderData(){
    const net=netVolume(); const reservePct=clamp($("reservePct").value,0,30,5); const step=Math.max(.01,n($("orderStep").value,.1)); const withReserve=net*(1+reservePct/100); const order=Math.ceil((withReserve-1e-10)/step)*step; return {net,reservePct,reserve:Math.max(0,order2(withReserve-net)),withReserve,step,order:order2(order)};
  }
  function order2(x){return Math.round((x+Number.EPSILON)*1000)/1000;}
  function tripRange(volume){ if(volume<=0)return {min:0,max:0,label:"—"}; const min=Math.ceil(volume/8); const max=Math.ceil(volume/6); const rangeWord=max<=4?"jízdy":"jízd"; return {min,max,label:min===max?pluralTrip(min):`${min}–${max} ${rangeWord}`}; }
  function renderBreakdown(total){
    const body=$("breakdownBody"); body.innerHTML="";
    if(mode==="direct"){
      const v=netVolume(); body.innerHTML=`<tr><td><strong>${escapeHtml($("directNote").value||"Objem z projektu")}</strong></td><td>přímý vstup z projektu / výkazu</td><td><strong>${fmtM3(v)}</strong></td><td>100 %</td></tr>`; $("componentCount").textContent="1 vstup"; return;
    }
    components.forEach(c=>{const v=volumeOf(c); const share=total>0?v/total*100:0; const tr=document.createElement("tr"); tr.innerHTML=`<td><strong>${escapeHtml(c.name||shapes[c.type].label)}</strong><small>${shapes[c.type].label}</small></td><td>${geometryText(c)}</td><td><strong>${fmtM3(v)}</strong></td><td>${number0.format(share)} %</td>`; body.appendChild(tr);});
    $("componentCount").textContent=pluralPart(components.length);
  }
  function renderBag(order){
    const product=bags[$("bagProduct").value]||bags.b208; const count=order>0?Math.ceil(order*1000/product.yield):0;
    $("bagOrderVolume").textContent=fmtM3(order); $("bagCount").textContent=`${number0.format(count)} ks`; $("bagYieldNote").textContent=`${product.name} · ${number2.format(product.yield)} l / 25 kg`;
    const bagPrice=n($("bagPrice").value,0); $("bagCostWrap").hidden=!(bagPrice>0 && count>0); if(bagPrice>0)$("bagCost").textContent=money.format(count*bagPrice);
    $("bagAdvice").textContent = order < .4 ? "Malý objem může být vhodný k porovnání s pytlovanou směsí. Ověřte ale minimální tloušťku vrstvy, použití výrobku a jeho technický list." : order < 1 ? "Jde už o desítky pytlů. Porovnejte manipulaci, míchání a čas s možností malého odběru nebo dopravy z betonárny." : "Při tomto objemu jde o velké množství pytlů. Přepočet je matematický; praktickou logistiku porovnejte s transportbetonem.";
  }
  function renderAll(renderCards=false){
    if(renderCards)renderComponents();
    const d=orderData(); const trips=tripRange(d.order);
    $("netVolume").textContent=fmtM3(d.net); $("reserveVolume").textContent=fmtM3(Math.max(0,d.withReserve-d.net)); $("orderVolume").textContent=fmtM3(d.order); $("truckTrips").textContent=trips.label;
    $("orderExplain").textContent=`${fmtM3(d.net)} čistě + ${number2.format(d.reservePct)} % rezerva, zaokrouhleno nahoru na ${number2.format(d.step)} m³.`;
    $("heroNet").textContent=fmtM3(d.net); $("heroOrder").textContent=fmtM3(d.order); $("heroTrips").textContent=trips.label;
    $("resultModeLabel").textContent=mode==="direct"?"objem z projektu":"geometrický součet";
    const readyPrice=n($("readyPrice").value,0), extras=n($("readyExtras").value,0); const showPrice=readyPrice>0; $("priceResult").hidden=!showPrice; if(showPrice)$("readyCost").textContent=money.format(d.order*readyPrice+extras);
    if(d.order<=0){$("resultCallout").innerHTML="<strong>Doplňte objem</strong><p>Zadané části zatím nemají kladný objem.</p>";}
    else if(d.order<1){$("resultCallout").innerHTML="<strong>Malá betonáž</strong><p>CEMEX u veřejného poptávkového formuláře uvádí minimum 1 m³. Není to tržní norma — u konkrétní betonárny ověřte malý odběr, vlastní odvoz nebo jiný způsob dodání.</p>";}
    else if(d.order>8){$("resultCallout").innerHTML=`<strong>Počítejte s více jízdami</strong><p>Při veřejně uváděné kapacitě 6–8 m³ vychází orientačně ${trips.label}. Před betonáží potvrďte návaznost aut, čas ukládání a případné čerpání.</p>`;}
    else{$("resultCallout").innerHTML="<strong>Co ověřit před objednávkou</strong><p>Specifikaci betonu vezměte z projektu. Potvrďte minimální odběr, dopravní podmínky, přístup vozu a případné čerpání.</p>";}
    renderBreakdown(d.net); renderBag(d.order);
    const compText=mode==="direct"?($("directNote").value||"objem z projektu"):components.map(c=>`${c.name||shapes[c.type].label}: ${fmtM3(volumeOf(c))}`).join("; ");
    lastSummary=`Betonáž: ${compText}. Čistý objem ${fmtM3(d.net)}, rezerva ${number2.format(d.reservePct)} %, k objednání ${fmtM3(d.order)} po zaokrouhlení na krok ${number2.format(d.step)} m³. Logistika 6–8m³ vozů: ${trips.label}. Třídu betonu kalkulačka neurčuje.`;
  }
  function setMode(newMode){
    mode=newMode==="direct"?"direct":"geometry"; document.querySelectorAll("[data-mode]").forEach(b=>{const a=b.dataset.mode===mode;b.classList.toggle("is-active",a);b.setAttribute("aria-selected",String(a));}); $("geometryPanel").hidden=mode!=="geometry"; $("directPanel").hidden=mode!=="direct"; renderAll();
  }
  function copySummary(){ if(!lastSummary)return; const b=$("copyResult"); const done=()=>{const old=b.textContent;b.textContent="Zkopírováno";setTimeout(()=>b.textContent=old,1300)}; navigator.clipboard?.writeText(lastSummary).then(done).catch(()=>{const ta=document.createElement("textarea");ta.value=lastSummary;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();done();}); }

  $("addComponent")?.addEventListener("click",()=>{components.push({id:nextId++,name:"Další část",type:"slab",values:{length:2,width:2,thickness:10}});renderComponents();renderAll();});
  document.querySelectorAll(".c-mode [data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  ["directVolume","directNote","reservePct","orderStep","readyPrice","readyExtras","bagProduct","bagPrice"].forEach(id=>$(id)?.addEventListener("input",()=>renderAll()));
  document.querySelectorAll("[data-reserve]").forEach(b=>b.addEventListener("click",()=>{$("reservePct").value=b.dataset.reserve;document.querySelectorAll("[data-reserve]").forEach(x=>x.classList.toggle("is-active",x===b));renderAll();}));
  $("reservePct")?.addEventListener("input",()=>document.querySelectorAll("[data-reserve]").forEach(x=>x.classList.toggle("is-active",Number(x.dataset.reserve)===Number($("reservePct").value))));
  $("copyResult")?.addEventListener("click",copySummary); $("printResult")?.addEventListener("click",()=>window.print());
  const menuToggle=$("menuToggle"),mainNav=$("mainNav"); menuToggle?.addEventListener("click",()=>{const open=mainNav.classList.toggle("is-open");menuToggle.setAttribute("aria-expanded",String(open));menuToggle.setAttribute("aria-label",open?"Zavřít navigaci":"Otevřít navigaci")}); mainNav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mainNav.classList.remove("is-open");menuToggle?.setAttribute("aria-expanded","false")}));
  renderComponents(); renderAll();

  // RV V-next accessibility hardening: complete keyboard model for ARIA tabs.
  (function bindRvTabs(){
    const tablist=document.querySelector('.c-mode');
    if(!tablist) return;
    const tabs=Array.from(tablist.querySelectorAll('[role="tab"]'));
    if(!tabs.length) return;
    const sync=()=>tabs.forEach(tab=>tab.setAttribute('tabindex',tab.getAttribute('aria-selected')==='true'?'0':'-1'));
    tabs.forEach(tab=>tab.addEventListener('click',sync));
    tablist.addEventListener('keydown',event=>{
      const index=tabs.indexOf(document.activeElement);
      if(index<0) return;
      let next=index;
      if(event.key==='ArrowRight'||event.key==='ArrowDown') next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp') next=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home') next=0;
      else if(event.key==='End') next=tabs.length-1;
      else return;
      event.preventDefault();
      tabs[next].click();
      tabs[next].focus();
      sync();
    });
    sync();
  })();
})();
