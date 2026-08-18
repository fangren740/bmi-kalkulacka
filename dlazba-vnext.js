(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const num = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
  const money = new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0});

  const products = {
    custom:{label:'Vlastní produkt',w:600,h:600,pack:1.44,pieces:4},
    rako30:{label:'RAKO System WAKVK000 · 30×60',w:598,h:298,pack:1.44,pieces:8},
    rakoLinka60:{label:'RAKO Linka DAK63821 · 60×60',w:598,h:598,pack:1.08,pieces:3},
    rakoBetonico60:{label:'RAKO Betonico DAF62791 · 60×60',w:598,h:598,pack:1.44,pieces:4}
  };

  let mode='floor';

  const val = (id, fallback=0) => {
    const n = Number(String($(id)?.value ?? '').replace(',','.'));
    return Number.isFinite(n) ? n : fallback;
  };
  const ceil2 = x => Math.ceil((x - Number.EPSILON) * 100) / 100;
  const areaText = x => `${num.format(x)} m²`;
  const packsText = n => `${n} ${n===1?'karton':n>=2&&n<=4?'kartony':'kartonů'}`;

  function cleanArea(){
    if(mode==='floor') return Math.max(0,val('floorLength')*val('floorWidth'));
    if(mode==='wall') return Math.max(0,val('wallLength')*val('wallHeight')-val('openingsArea'));
    return Math.max(0,val('directArea'));
  }

  function calculateForReserve(reserve, spare=false){
    const net=cleanArea();
    const pack=Math.max(0,val('packArea'));
    const required=net*(1+Math.max(0,reserve)/100);
    let packs=pack>0?Math.ceil(required/pack):0;
    if(spare && packs>0) packs+=1;
    const purchased=packs*pack;
    return {net,required,packs,purchased,extra:Math.max(0,purchased-net),rounding:Math.max(0,purchased-required)};
  }

  function setMeters(r){
    const max=Math.max(r.purchased,0.01);
    const need=Math.min(100,r.net/max*100);
    const req=Math.min(100,Math.max(0,(r.required-r.net)/max*100));
    const spare=Math.min(100,Math.max(0,(r.purchased-r.required)/max*100));
    $('meterNeed').style.setProperty('--meter',`${need}%`);
    $('meterPack').style.setProperty('--meter',`${req}%`);
    $('meterSpare').style.setProperty('--meter',`${spare}%`);
  }

  function currentProductLabel(){
    const key=$('productPreset').value;
    return products[key]?.label || 'Vlastní produkt';
  }

  function renderScenarios(){
    const wrap=$('scenarioGrid');
    const current=Math.max(0,val('reservePct'));
    const levels=[5,10,15,20];
    wrap.innerHTML=levels.map(p=>{
      const r=calculateForReserve(p,false);
      return `<article class="tn-scenario-card ${Math.abs(current-p)<0.01?'is-current':''}"><span>${p} % rezerva</span><strong>${packsText(r.packs)}</strong><p>${areaText(r.required)} potřeba → ${areaText(r.purchased)} skutečný nákup. Nad čistou plochou ${areaText(r.extra)}.</p></article>`;
    }).join('');
  }

  function render(){
    const error=$('formError');
    const packArea=val('packArea');
    const net=cleanArea();
    if(net<=0 || packArea<=0){
      error.hidden=false;
      error.textContent='Zadejte kladnou plochu a údaj m² v jednom kartonu.';
      return;
    }
    error.hidden=true;
    const reserve=Math.max(0,val('reservePct'));
    const spare=$('sparePack').checked;
    const r=calculateForReserve(reserve,spare);
    const piecesPerPack=Math.max(0,Math.floor(val('piecesPerPack')));
    const pieces=piecesPerPack>0?r.packs*piecesPerPack:0;

    $('resultProduct').textContent=currentProductLabel();
    $('packResult').textContent=packsText(r.packs);
    $('resultExplain').textContent=`${areaText(r.net)} čistě → ${areaText(r.required)} po rezervě → ${areaText(r.purchased)} skutečně nakoupeno.`;
    $('netAreaResult').textContent=areaText(r.net);
    $('requiredAreaResult').textContent=areaText(r.required);
    $('purchaseAreaResult').textContent=areaText(r.purchased);
    $('piecesResult').textContent=piecesPerPack>0?`${pieces} ks`:'údaj chybí';
    $('extraAreaResult').textContent=areaText(r.extra);
    setMeters(r);

    const priceMode=$('priceMode').value;
    const unitPrice=Math.max(0,val('unitPrice'));
    if(priceMode!=='none' && unitPrice>0){
      $('costWrap').hidden=false;
      const cost=priceMode==='pack'?r.packs*unitPrice:r.purchased*unitPrice;
      $('costResult').textContent=money.format(cost);
    } else $('costWrap').hidden=true;

    renderScenarios();
  }

  function setMode(next){
    mode=next;
    document.querySelectorAll('[data-mode]').forEach(btn=>{
      const active=btn.dataset.mode===mode;
      btn.classList.toggle('is-active',active);
      btn.setAttribute('aria-selected',String(active));
    });
    $('floorPanel').hidden=mode!=='floor';
    $('wallPanel').hidden=mode!=='wall';
    $('directPanel').hidden=mode!=='direct';
    render();
  }

  function applyProduct(key){
    const p=products[key];
    if(!p || key==='custom'){render();return;}
    $('tileWidth').value=p.w;
    $('tileHeight').value=p.h;
    $('packArea').value=p.pack;
    $('piecesPerPack').value=p.pieces;
    render();
  }

  function updatePriceMode(){
    const m=$('priceMode').value;
    $('priceField').hidden=m==='none';
    $('priceLabel').textContent=m==='pack'?'Cena za karton':'Cena za m²';
    $('priceUnit').textContent=m==='pack'?'Kč/karton':'Kč/m²';
    render();
  }

  function copySummary(){
    const reserve=val('reservePct');
    const r=calculateForReserve(reserve,$('sparePack').checked);
    const piecesPerPack=Math.max(0,Math.floor(val('piecesPerPack')));
    const lines=[
      'Nákupní plán dlažby / obkladu – RychléVýpočty.cz',
      `Produkt: ${currentProductLabel()}`,
      `Čistá plocha: ${areaText(r.net)}`,
      `Rezerva: ${num.format(reserve)} %`,
      `Potřeba s rezervou: ${areaText(r.required)}`,
      `Balení: ${packsText(r.packs)} × ${num.format(val('packArea'))} m²`,
      `Skutečně nakoupená plocha: ${areaText(r.purchased)}`,
      piecesPerPack>0?`Kusů v objednávce: ${r.packs*piecesPerPack} ks`:'',
      `Plocha nad čistou plochu: ${areaText(r.extra)}`,
      'Před objednávkou zkontrolujte shodný odstín a deklarovaný rozměr výrobní šarže na kartonech.'
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join('\n')).then(()=>{
      const b=$('copyResult'); const old=b.textContent; b.textContent='Zkopírováno'; setTimeout(()=>b.textContent=old,1500);
    }).catch(()=>{});
  }

  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  document.querySelectorAll('[data-reserve]').forEach(btn=>btn.addEventListener('click',()=>{
    $('reservePct').value=btn.dataset.reserve;
    document.querySelectorAll('[data-reserve]').forEach(x=>x.classList.toggle('is-active',x===btn));
    render();
  }));

  ['floorLength','floorWidth','wallLength','wallHeight','openingsArea','directArea','packArea','piecesPerPack','tileWidth','tileHeight','reservePct','sparePack','unitPrice'].forEach(id=>$(id)?.addEventListener('input',render));
  $('sparePack').addEventListener('change',render);
  $('productPreset').addEventListener('change',e=>applyProduct(e.target.value));
  $('priceMode').addEventListener('change',updatePriceMode);
  $('copyResult').addEventListener('click',copySummary);
  $('printResult').addEventListener('click',()=>window.print());
  $('tileForm').addEventListener('submit',e=>{e.preventDefault();render();});

  const menu=$('menuToggle');
  menu?.addEventListener('click',()=>{
    const open=menu.getAttribute('aria-expanded')==='true';
    menu.setAttribute('aria-expanded',String(!open));
    $('mobileNav').classList.toggle('is-open',!open);
  });

  updatePriceMode();
  render();

  // RV V-next accessibility hardening: complete keyboard model for ARIA tabs.
  (function bindRvTabs(){
    const tablist=document.querySelector('.tn-mode');
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
