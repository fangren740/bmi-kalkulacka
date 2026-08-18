(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const products = {"porotherm30": {"id": "porotherm30", "name": "Porotherm 30 Profi", "brand": "Wienerberger / Porotherm", "use": "nosné zdivo 300 mm", "length": 247, "width": 300, "height": 249, "consumption": 16.0, "pallet": 80, "weight": 14.7, "palletWeight": 1220, "source": "https://www.wienerberger.cz/zdivo-porotherm/produkty/cihly/porotherm-30-profi.html"}, "heluzfamily30": {"id": "heluzfamily30", "name": "HELUZ FAMILY 30 broušená", "brand": "HELUZ", "use": "obvodové / vnitřní zdivo 300 mm", "length": 247, "width": 300, "height": 249, "consumption": 16.0, "pallet": 96, "weight": 12.4, "palletWeight": null, "source": "https://www.heluz.cz/cs/vyrobek/heluz-family-30-brousena-1"}, "porotherm115": {"id": "porotherm115", "name": "Porotherm 11,5 Profi", "brand": "Wienerberger / Porotherm", "use": "nenosné příčky 115 mm", "length": 497, "width": 115, "height": 249, "consumption": 8.0, "pallet": 100, "weight": 12.1, "palletWeight": 1240, "source": "https://www.wienerberger.cz/zdivo-porotherm/produkty/cihly/porotherm-11-5-profi.html"}, "heluz115": {"id": "heluz115", "name": "HELUZ 11,5 broušená", "brand": "HELUZ", "use": "nenosné příčky 115 mm", "length": 497, "width": 115, "height": 249, "consumption": 8.0, "pallet": 120, "weight": 10.3, "palletWeight": null, "source": "https://www.heluz.cz/cs/vyrobek/heluz-11-5-brousena-1"}, "heluzuni25": {"id": "heluzuni25", "name": "HELUZ UNI 25", "brand": "HELUZ", "use": "nosné i nenosné zdivo 250 mm", "length": 375, "width": 250, "height": 238, "consumption": 10.7, "pallet": 72, "weight": 15.8, "palletWeight": null, "source": "https://www.heluz.cz/cs/vyrobek/heluz-uni-25-1"}, "heluzp1525": {"id": "heluzp1525", "name": "HELUZ P15 25", "brand": "HELUZ", "use": "nosné zdivo 250 mm", "length": 375, "width": 250, "height": 238, "consumption": 10.7, "pallet": 72, "weight": 18.1, "palletWeight": null, "source": "https://www.heluz.cz/cs/vyrobek/heluz-p15-25-1"}};
  const n0 = new Intl.NumberFormat("cs-CZ", {maximumFractionDigits:0});
  const n1 = new Intl.NumberFormat("cs-CZ", {minimumFractionDigits:1, maximumFractionDigits:1});
  const money = new Intl.NumberFormat("cs-CZ", {style:"currency",currency:"CZK",maximumFractionDigits:0});
  let mode = "dimensions";
  let reserve = 5;
  let lastSummary = "";

  const val = (id, fallback=0) => { const x=Number($(id)?.value); return Number.isFinite(x)?x:fallback; };
  const clamp = (x,min,max) => Math.min(max,Math.max(min,x));
  const fmtWeight = (kg) => kg >= 1000 ? `${n1.format(kg/1000)} t` : `${n0.format(kg)} kg`;
  const palletWord = (count) => {
    const n=Math.abs(Math.trunc(count));
    if (n===1) return "paleta";
    if (n>=2 && n<=4) return "palety";
    return "palet";
  };
  const palletsLabel = (count) => `${n0.format(count)} ${palletWord(count)}`;

  function currentArea() {
    if (mode === "area") return clamp(val("directArea",15.5),0,10000);
    const gross = clamp(val("wallLength",6),0,1000) * clamp(val("wallHeight",2.75),0,20);
    return Math.max(0, gross - clamp(val("openings",1),0,10000));
  }
  function currentProduct() {
    const id=$("productSelect").value;
    if (id !== "custom") return {...products[id], custom:false};
    return {id:"custom",name:"Vlastní výrobek",brand:"Vlastní zadání",use:"",consumption:clamp(val("customConsumption",8),0.1,200),pallet:Math.max(1,Math.round(clamp(val("customPallet",72),1,1000))),weight:clamp(val("customWeight",12),0,500),source:"",custom:true};
  }
  function syncProductUI() {
    const p=currentProduct(); const custom=p.custom;
    $("customFields").hidden=!custom; $("productProof").hidden=custom;
    if (!custom) {
      $("proofConsumption").textContent=`${String(p.consumption).replace('.',',')} ks/m²`;
      $("proofPallet").textContent=`${p.pallet} ks`;
      $("proofWeight").textContent=`${String(p.weight).replace('.',',')} kg`;
      $("proofSource").href=p.source;
    }
  }
  function render() {
    const area=currentArea(); const p=currentProduct(); const r=clamp(val("reserve",reserve),0,30); reserve=r;
    const baseRaw=area*p.consumption;
    const base=Math.ceil(baseRaw-1e-9);
    const pieces=Math.ceil(baseRaw*(1+r/100)-1e-9);
    const reservePieces=Math.max(0,pieces-base);
    const full=Math.floor(pieces/p.pallet); const loose=pieces%p.pallet;
    const palletOnly=Math.ceil(pieces/p.pallet); const palletPieces=palletOnly*p.pallet; const leftover=palletPieces-pieces;
    const coverage=p.pallet/p.consumption;
    const weight=pieces*p.weight;
    const inputPrice=val("unitPrice",0)>0 ? val("unitPrice",0) : (p.custom && val("customPrice",0)>0 ? val("customPrice",0) : 0);
    const price=inputPrice>0 ? pieces*inputPrice : 0;

    $("resultProduct").textContent=p.name;
    $("resultPieces").textContent=`${n0.format(pieces)} ks`;
    $("resultFormula").textContent=`${n1.format(area)} m² × ${String(p.consumption).replace('.',',')} ks/m² × ${n1.format(1+r/100)}`;
    $("resultArea").textContent=`${n1.format(area)} m²`;
    $("basePieces").textContent=`${n0.format(base)} ks`;
    $("reservePieces").textContent=`${n0.format(reservePieces)} ks`;
    $("palletSplit").textContent=loose ? `${palletsLabel(full)} + ${n0.format(loose)} ks` : palletsLabel(full);
    $("palletCoverage").textContent=`1 paleta ≈ ${n1.format(coverage)} m² zdiva`;
    $("fullPalletOrder").textContent=`${palletsLabel(palletOnly)} / ${n0.format(palletPieces)} ks`;
    $("leftoverPieces").textContent=leftover ? `${n0.format(leftover)} ks nad vypočtenou potřebu` : `bez přebytku proti vypočtenému množství`;
    $("resultWeight").textContent=p.weight>0 ? fmtWeight(weight) : "nezadáno";
    $("resultPrice").textContent=price>0 ? money.format(price) : "doplňte cenu/ks";
    $("heroArea").textContent=`${n1.format(area)} m²`; $("heroPieces").textContent=`${n0.format(pieces)} ks`; $("heroPallets").textContent=loose ? `${palletsLabel(full)} + ${loose} ks` : palletsLabel(full);
    $("resultCallout").textContent=p.custom ? "U vlastního výrobku ověřte spotřebu, paletizaci a hmotnost v aktuálním technickém listu. Doplňkové prvky se počítají samostatně." : `Preset používá veřejné technické údaje ${p.brand} ověřené 17. 8. 2026. Před objednávkou zkontrolujte aktuální variantu a balení.`;
    lastSummary=`Zdivo: ${n1.format(area)} m²; ${p.name}; spotřeba ${p.consumption} ks/m²; rezerva ${r} %; doporučeno ${n0.format(pieces)} ks. Pokud lze dokoupit kusově: ${palletsLabel(full)}${loose?` + ${loose} ks`:''}. Pouze celé palety: ${palletsLabel(palletOnly)} / ${palletPieces} ks${leftover?` (přebytek ${leftover} ks)`:''}.`;
  }
  function setMode(next) { mode=next==="area"?"area":"dimensions"; document.querySelectorAll("[data-mode]").forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle("is-active",active);b.setAttribute("aria-selected",String(active));}); $("dimensionsPanel").hidden=mode!=="dimensions"; $("areaPanel").hidden=mode!=="area"; render(); }
  document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
  ["wallLength","wallHeight","openings","directArea","reserve","unitPrice","customConsumption","customPallet","customWeight","customPrice"].forEach(id=>$(id)?.addEventListener("input",render));
  $("productSelect").addEventListener("change",()=>{syncProductUI();render();});
  document.querySelectorAll("[data-reserve]").forEach(b=>b.addEventListener("click",()=>{reserve=Number(b.dataset.reserve);$("reserve").value=reserve;document.querySelectorAll("[data-reserve]").forEach(x=>x.classList.toggle("is-active",x===b));render();}));
  $("reserve").addEventListener("input",()=>{document.querySelectorAll("[data-reserve]").forEach(x=>x.classList.toggle("is-active",Number(x.dataset.reserve)===val("reserve",5)));});
  $("applyGeometry").addEventListener("click",()=>{const l=clamp(val("customLength",499),10,2000)/1000;const h=clamp(val("customHeight",249),10,1000)/1000;const c=1/(l*h);$("customConsumption").value=(Math.round(c*10)/10).toString();$("geometryNote").textContent=`Geometrický odhad: ${n1.format(c)} ks/m². Ověřte proti technickému listu; deklarovaná spotřeba výrobce má přednost.`;render();});
  $("copyResult").addEventListener("click",()=>{const done=()=>{const old=$("copyResult").textContent;$("copyResult").textContent="Zkopírováno";setTimeout(()=>$("copyResult").textContent=old,1200);};navigator.clipboard?.writeText(lastSummary).then(done).catch(()=>{});});
  const mt=$("menuToggle"),nav=$("mainNav"); mt?.addEventListener("click",()=>{const open=nav.classList.toggle("is-open");mt.setAttribute("aria-expanded",String(open));});nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("is-open");mt?.setAttribute("aria-expanded","false");}));
  syncProductUI(); setMode("dimensions");

  // RV V-next accessibility hardening: complete keyboard model for ARIA tabs.
  (function bindRvTabs(){
    const tablist=document.querySelector('.m-mode');
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