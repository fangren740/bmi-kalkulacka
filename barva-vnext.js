(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const form = $('#paintPlanner');
  if (!form) return;

  const PRODUCTS = {
    inspiro: {
      key: 'inspiro', name: 'Primalex INSPIRO', maker: 'Primalex', unit: 'l', coverageMin: 10, coverageMax: 12,
      coverageKind: 'range', coats: 2, packages: [{size:2.5,label:'2,5 l'},{size:5,label:'5 l'}],
      source: 'https://www.primalex.cz/products/55-primalex_inspiro/84?tab=limited',
      note: 'Výrobce uvádí vydatnost 10–12 m²/l v jedné vrstvě a doporučuje dvě vrstvy.'
    },
    fortissimo: {
      key: 'fortissimo', name: 'Primalex FORTISSIMO', maker: 'Primalex', unit: 'l', coverageMin: 9, coverageMax: 11,
      coverageKind: 'range', coats: 2, packages: [{size:1,label:'1 l'},{size:3,label:'3 l'},{size:5,label:'5 l'},{size:10,label:'10 l'}],
      source: 'https://www.primalex.cz/products/59-primalex_fortissimo_baze_i.../84',
      note: 'Výrobce uvádí 9–11 m²/l v jedné vrstvě, dvě vrstvy a balení 1 / 3 / 5 / 10 l.'
    },
    'het-klasik': {
      key: 'het-klasik', name: 'HET Klasik', maker: 'HET', unit: 'kg', coverageMin: 6, coverageMax: 10,
      coverageKind: 'range', coats: 2,
      packages: [{size:1.5,label:'1,5 kg'},{size:4,label:'4 kg'},{size:5,label:'5 kg'},{size:8,label:'7+1 kg'},{size:12,label:'12 kg'},{size:18,label:'15+3 kg'},{size:20,label:'20 kg'},{size:25,label:'25 kg'},{size:40,label:'40 kg'}],
      source: 'https://www.het.cz/klasik/c-20148',
      note: 'HET deklaruje 6–10 m²/kg podle savosti, struktury a tloušťky vrstvy; doporučený vrchní nátěr 1–2 vrstvy.'
    },
    'dulux-acryl': {
      key: 'dulux-acryl', name: 'Dulux Acryl Matt', maker: 'Dulux', unit: 'l', coverageMin: 13, coverageMax: 13,
      coverageKind: 'upTo', coats: 2, packages: [{size:1,label:'1 l'},{size:2.5,label:'2,5 l'},{size:5,label:'5 l'},{size:10,label:'10 l'}],
      source: 'https://www.dulux.cz/cs/produkty/dulux-acryl-matt',
      note: 'Výrobce uvádí vydatnost až 13 m²/l a dvě vrstvy. Výpočet z této hodnoty je optimistická hranice.'
    }
  };

  const n = (value, fallback = 0) => {
    const parsed = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 2) => {
    const f = 10 ** digits;
    return Math.round((value + Number.EPSILON) * f) / f;
  };
  const fmt = (value, maxDigits = 1) => new Intl.NumberFormat('cs-CZ', {minimumFractionDigits:0, maximumFractionDigits:maxDigits}).format(Number.isFinite(value) ? value : 0);
  const money = value => `${new Intl.NumberFormat('cs-CZ', {maximumFractionDigits:0}).format(Math.round(value || 0))} Kč`;
  const area = value => `${fmt(value, 1)} m²`;
  const qty = (value, unit) => `${fmt(value, value < 20 ? 1 : 0)} ${unit}`;
  const rangeQty = (low, high, unit) => Math.abs(high - low) < 0.049 ? qty(high, unit) : `${fmt(low,1)}–${fmt(high,1)} ${unit}`;
  const esc = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  let mode = 'quick';
  let areaMode = 'room';
  let openingMode = 'quick';
  let roomSerial = 0;
  let lastResult = null;

  function parsePackages(text, unit) {
    const matches = String(text || '').match(/\d+(?:[.,]\d+)?/g) || [];
    const values = [...new Set(matches.map(v => n(v)).filter(v => v > 0).map(v => round(v,1)))].sort((a,b)=>a-b);
    return values.map(size => ({size, label:`${fmt(size,1)} ${unit}`}));
  }

  function readCustom(prefix) {
    const unit = $(`#${prefix}CustomUnit`)?.value || 'l';
    const name = $(`#${prefix}CustomName`)?.value.trim() || 'Vlastní barva';
    const min = Math.max(.1, n($(`#${prefix}CoverageMin`)?.value, 8));
    const max = Math.max(.1, n($(`#${prefix}CoverageMax`)?.value, min));
    const coverageMin = Math.min(min, max);
    const coverageMax = Math.max(min, max);
    const packages = parsePackages($(`#${prefix}Packages`)?.value || '', unit);
    return {
      key: `custom-${prefix}`, name, maker:'vlastní technický list', unit, coverageMin, coverageMax,
      coverageKind: Math.abs(coverageMax - coverageMin) < .001 ? 'exact' : 'range', coats: 2, packages,
      source:'', note:'Používají se hodnoty, které jste opsali z konkrétního technického listu nebo obalu.'
    };
  }

  function readProduct(selectId, prefix) {
    const key = $(`#${selectId}`).value;
    if (key === 'custom') return readCustom(prefix);
    return {...PRODUCTS[key], packages: PRODUCTS[key].packages.map(x => ({...x}))};
  }

  function productSignature(product) {
    return [product.name,product.unit,product.coverageMin,product.coverageMax,product.packages.map(x=>x.size).join('|')].join('::');
  }

  function requirement(surfaceArea, coats, reservePct, product) {
    const coatedArea = Math.max(0, surfaceArea) * Math.max(1, coats);
    const factor = 1 + clamp(reservePct,0,100) / 100;
    let low, high, optimistic = false;
    if (product.coverageKind === 'upTo') {
      low = high = coatedArea / product.coverageMax * factor;
      optimistic = true;
    } else {
      low = coatedArea / product.coverageMax * factor;
      high = coatedArea / product.coverageMin * factor;
    }
    return {surfaceArea, coatedArea, low, high, optimistic};
  }

  function readPrices(scope, packages) {
    const map = new Map();
    packages.forEach(pkg => {
      const el = document.querySelector(`[data-price-scope="${scope}"][data-price-size="${String(pkg.size)}"]`);
      const value = Math.max(0, n(el?.value));
      if (value > 0) map.set(pkg.size, value);
    });
    return map;
  }

  function optimizePackages(target, packages, goal, priceMap) {
    if (!(target > 0) || !packages.length) return {ok:false, reason:'Chybí použitelná balení.'};
    const list = packages
      .map(pkg => ({...pkg, units:Math.max(1,Math.round(pkg.size*10)), price:priceMap?.get(pkg.size) || 0}))
      .filter(pkg => goal !== 'cost' || pkg.price > 0);
    if (!list.length) return {ok:false, reason:'Pro režim nejnižší ceny doplňte cenu alespoň jednoho balení.'};
    const targetUnits = Math.max(1, Math.ceil(target * 10 - 1e-9));
    const maxUnit = Math.max(...list.map(x=>x.units));
    const limit = targetUnits + maxUnit * 2;
    const dp = Array(limit + 1).fill(null);
    dp[0] = {pieces:0,cost:0,counts:Array(list.length).fill(0)};
    for (let u=0; u<=limit; u++) {
      const state = dp[u];
      if (!state) continue;
      list.forEach((pkg,i) => {
        const next = u + pkg.units;
        if (next > limit) return;
        const cand = {pieces:state.pieces+1,cost:state.cost+pkg.price,counts:state.counts.map((c,j)=>c+(i===j?1:0))};
        const ex = dp[next];
        if (!ex || (goal === 'cost' ? (cand.cost < ex.cost - 1e-9 || (Math.abs(cand.cost-ex.cost)<1e-9 && cand.pieces<ex.pieces)) : cand.pieces < ex.pieces)) dp[next] = cand;
      });
    }
    let best = null;
    for (let u=targetUnits; u<=limit; u++) {
      const state = dp[u];
      if (!state) continue;
      const waste = u - targetUnits;
      const cand = {...state, units:u, waste};
      if (!best) best = cand;
      else if (goal === 'cost') {
        if (cand.cost < best.cost - 1e-9 || (Math.abs(cand.cost-best.cost)<1e-9 && cand.waste<best.waste) || (Math.abs(cand.cost-best.cost)<1e-9 && cand.waste===best.waste && cand.pieces<best.pieces)) best = cand;
      } else if (cand.waste < best.waste || (cand.waste===best.waste && cand.pieces<best.pieces)) best = cand;
    }
    if (!best) return {ok:false, reason:'Pro zadaná balení se nepodařilo sestavit nákup.'};
    const items = list.map((pkg,i)=>({pkg,count:best.counts[i]})).filter(x=>x.count>0);
    return {
      ok:true, purchased:best.units/10, waste:best.units/10-target, pieces:best.pieces, cost:best.cost,
      items, text:items.map(x=>`${x.count} × ${x.pkg.label}`).join(' + ')
    };
  }

  function renderProductCard(product, target) {
    const coverage = product.coverageKind === 'upTo' ? `až ${fmt(product.coverageMax,1)} m²/${product.unit}` : `${fmt(product.coverageMin,1)}–${fmt(product.coverageMax,1)} m²/${product.unit}`;
    const packText = product.packages.length ? product.packages.map(x=>x.label).join(' · ') : 'zadejte balení';
    target.innerHTML = `<strong>${esc(product.name)} · ${coverage}</strong><p>${esc(product.note)}</p><div class="pp-product-tags"><span>${product.unit === 'kg' ? 'hmotnostní nákup' : 'objemový nákup'}</span><span>${product.coverageKind === 'upTo' ? 'deklarované maximum' : 'interval vydatnosti'}</span><span>${esc(packText)}</span></div>`;
  }

  function renderPriceRows(scope, product, container) {
    if (!product.packages.length) {
      container.innerHTML = '<div class="pp-price-row"><div><strong>Nejsou zadaná balení</strong><small>Doplňte je u vlastního výrobku.</small></div></div>';
      return;
    }
    const existing = new Map($$(`[data-price-scope="${scope}"]`).map(el => [el.dataset.priceSize, el.value]));
    container.innerHTML = product.packages.map(pkg => `<div class="pp-price-row"><div><strong>${esc(pkg.label)}</strong><small>Volitelná cena tohoto balení</small></div><div class="pp-unit"><input data-price-scope="${scope}" data-price-size="${pkg.size}" type="number" min="0" step="1" value="${esc(existing.get(String(pkg.size)) || '')}" placeholder="0"><b>Kč</b></div></div>`).join('');
  }

  function syncQuickProduct(resetCoats = false) {
    const product = readProduct('quickProduct','quick');
    $('#quickCustom').hidden = $('#quickProduct').value !== 'custom';
    $('#quickCoverageMinUnit').textContent = `m²/${product.unit}`;
    $('#quickCoverageMaxUnit').textContent = `m²/${product.unit}`;
    renderProductCard(product,$('#quickProductCard'));
    if (resetCoats && $('#quickProduct').value !== 'custom') $('#quickCoats').value = product.coats;
    renderPriceRows('quick',product,$('#quickPackagePrices'));
  }

  function syncProjectProducts(resetCoats = false) {
    const wall = readProduct('wallProduct','wall');
    const ceiling = readProduct('ceilingProduct','ceiling');
    $('#wallCustom').hidden = $('#wallProduct').value !== 'custom';
    $('#ceilingCustom').hidden = $('#ceilingProduct').value !== 'custom';
    renderProductCard(wall,$('#wallProductCard'));
    renderProductCard(ceiling,$('#ceilingProductCard'));
    if (resetCoats) {
      if ($('#wallProduct').value !== 'custom') $('#wallCoats').value = wall.coats;
      if ($('#ceilingProduct').value !== 'custom') $('#ceilingCoats').value = ceiling.coats;
    }
    renderProjectPriceCards(wall,ceiling);
  }

  function renderProjectPriceCards(wall, ceiling) {
    const box = $('#projectPackagePrices');
    const same = productSignature(wall) === productSignature(ceiling);
    if (same) {
      box.innerHTML = `<div class="pp-project-price-card"><strong>Společný výrobek · ${esc(wall.name)}</strong><div data-project-price-container="wall"></div></div>`;
      renderPriceRows('wall',wall,$('[data-project-price-container="wall"]',box));
    } else {
      box.innerHTML = `<div class="pp-project-price-card"><strong>Stěny · ${esc(wall.name)}</strong><div data-project-price-container="wall"></div></div><div class="pp-project-price-card"><strong>Stropy · ${esc(ceiling.name)}</strong><div data-project-price-container="ceiling"></div></div>`;
      renderPriceRows('wall',wall,$('[data-project-price-container="wall"]',box));
      renderPriceRows('ceiling',ceiling,$('[data-project-price-container="ceiling"]',box));
    }
  }

  function quickArea() {
    if (areaMode === 'direct') {
      const value = Math.max(0,n($('#quickDirectArea').value));
      if (!value) throw new Error('Zadejte kladnou plochu k malování.');
      return {walls:value,ceiling:0,openings:0,total:value,summary:'známá plocha'};
    }
    const l=Math.max(0,n($('#quickLength').value)), w=Math.max(0,n($('#quickWidth').value)), h=Math.max(0,n($('#quickHeight').value));
    if (!l || !w || !h) throw new Error('Zadejte kladnou délku, šířku a výšku místnosti.');
    const rawWalls=2*(l+w)*h;
    let openings=0;
    if (openingMode === 'quick') openings=clamp(Math.round(n($('#quickDoors').value)),0,20)*1.8+clamp(Math.round(n($('#quickWindows').value)),0,30)*1.5;
    else openings=Math.max(0,n($('#quickOpeningArea').value));
    openings=Math.min(openings,rawWalls);
    const walls=Math.max(0,rawWalls-openings);
    const ceiling=$('#quickCeiling').checked?l*w:0;
    return {walls,ceiling,openings,total:walls+ceiling,summary:`${fmt(l,2)} × ${fmt(w,2)} × ${fmt(h,2)} m`};
  }

  function calculateQuick() {
    const geometry=quickArea();
    const product=readProduct('quickProduct','quick');
    if (!product.packages.length) throw new Error('U vlastního výrobku zadejte alespoň jedno dostupné balení.');
    const coats=clamp(Math.round(n($('#quickCoats').value,2)),1,6);
    const reserve=clamp(n($('#quickReserve').value),0,50);
    const req=requirement(geometry.total,coats,reserve,product);
    const goal=$('input[name="quickGoal"]:checked')?.value || 'waste';
    const prices=readPrices('quick',product.packages);
    let plan=optimizePackages(req.high,product.packages,goal,prices);
    let fallback=false;
    if (!plan.ok && goal==='cost') { plan=optimizePackages(req.high,product.packages,'waste',new Map()); fallback=true; }
    if (!plan.ok) throw new Error(plan.reason);
    return {mode:'quick',geometry,product,coats,reserve,req,goal,plan,fallback};
  }

  function roomMarkup(seed={}) {
    roomSerial += 1;
    const name=seed.name || `Místnost ${roomSerial}`;
    return `<article class="pp-room-card"><div class="pp-room-head"><input class="pp-room-name" type="text" value="${esc(name)}" aria-label="Název místnosti"><button class="pp-room-remove" type="button" aria-label="Odebrat místnost">×</button></div><div class="pp-room-meta"><label class="pp-field"><span>Délka</span><div class="pp-unit"><input class="room-length" type="number" min="0.1" step="0.1" value="${seed.length ?? 4}"><b>m</b></div></label><label class="pp-field"><span>Šířka</span><div class="pp-unit"><input class="room-width" type="number" min="0.1" step="0.1" value="${seed.width ?? 3}"><b>m</b></div></label><label class="pp-field"><span>Výška</span><div class="pp-unit"><input class="room-height" type="number" min="0.1" step="0.05" value="${seed.height ?? 2.6}"><b>m</b></div></label><label class="pp-field"><span>Otvory</span><div class="pp-unit"><input class="room-openings" type="number" min="0" step="0.1" value="${seed.openings ?? 3.3}"><b>m²</b></div></label></div><div class="pp-room-options"><label class="pp-check"><input class="room-ceiling" type="checkbox" ${seed.ceiling===false?'':'checked'}><span><strong>Malovat strop</strong><small>Přidá délka × šířka do projektu stropů.</small></span></label></div></article>`;
  }

  function addRoom(seed) {
    $('#roomList').insertAdjacentHTML('beforeend',roomMarkup(seed));
    renumberRooms();
  }
  function renumberRooms() {
    const rooms=$$('.pp-room-card',$('#roomList'));
    rooms.forEach((card,i)=>{const name=$('.pp-room-name',card); if(!name.value.trim()) name.value=`Místnost ${i+1}`; $('.pp-room-remove',card).disabled=rooms.length<=1;});
  }
  function readRooms() {
    const rooms=$$('.pp-room-card',$('#roomList'));
    if(!rooms.length) throw new Error('Přidejte alespoň jednu místnost.');
    return rooms.map((card,i)=>{
      const name=$('.pp-room-name',card).value.trim()||`Místnost ${i+1}`;
      const l=Math.max(0,n($('.room-length',card).value)),w=Math.max(0,n($('.room-width',card).value)),h=Math.max(0,n($('.room-height',card).value));
      if(!l||!w||!h) throw new Error(`Zkontrolujte rozměry místnosti „${name}“.`);
      const raw=2*(l+w)*h;
      const openings=Math.min(Math.max(0,n($('.room-openings',card).value)),raw);
      const walls=Math.max(0,raw-openings);
      const ceiling=$('.room-ceiling',card).checked?l*w:0;
      return {name,l,w,h,openings,walls,ceiling};
    });
  }

  function calculateProject() {
    const rooms=readRooms();
    const walls=rooms.reduce((s,r)=>s+r.walls,0), ceilings=rooms.reduce((s,r)=>s+r.ceiling,0);
    const wallProduct=readProduct('wallProduct','wall'), ceilingProduct=readProduct('ceilingProduct','ceiling');
    if(!wallProduct.packages.length) throw new Error('U barvy na stěny zadejte alespoň jedno balení.');
    if(ceilings>0 && !ceilingProduct.packages.length) throw new Error('U barvy na strop zadejte alespoň jedno balení.');
    const wallCoats=clamp(Math.round(n($('#wallCoats').value,2)),1,6), ceilingCoats=clamp(Math.round(n($('#ceilingCoats').value,2)),1,6);
    const wallReserve=clamp(n($('#wallReserve').value),0,50), ceilingReserve=clamp(n($('#ceilingReserve').value),0,50);
    const wallReq=requirement(walls,wallCoats,wallReserve,wallProduct);
    const ceilingReq=requirement(ceilings,ceilingCoats,ceilingReserve,ceilingProduct);
    const groups=new Map();
    const add=(surface,product,req,priceScope)=>{
      if(req.surfaceArea<=0) return;
      const key=productSignature(product);
      if(!groups.has(key)) groups.set(key,{product,low:0,high:0,coatedArea:0,surfaceArea:0,surfaces:[],priceScope});
      const g=groups.get(key); g.low+=req.low; g.high+=req.high; g.coatedArea+=req.coatedArea; g.surfaceArea+=req.surfaceArea; g.surfaces.push(surface); if(surface==='stěny') g.priceScope='wall';
    };
    add('stěny',wallProduct,wallReq,'wall'); add('stropy',ceilingProduct,ceilingReq,'ceiling');
    const goal=$('input[name="projectGoal"]:checked')?.value || 'waste';
    const purchases=[];
    for(const g of groups.values()){
      const prices=readPrices(g.priceScope,g.product.packages);
      let plan=optimizePackages(g.high,g.product.packages,goal,prices),fallback=false;
      if(!plan.ok&&goal==='cost'){plan=optimizePackages(g.high,g.product.packages,'waste',new Map());fallback=true;}
      if(!plan.ok) throw new Error(plan.reason);
      purchases.push({...g,plan,fallback});
    }
    return {mode:'project',rooms,walls,ceilings,wallReq,ceilingReq,purchases,goal,totalArea:walls+ceilings,totalCoated:wallReq.coatedArea+ceilingReq.coatedArea};
  }

  function resultRow(label,value,description){return `<div class="pp-result-row"><div><strong>${esc(label)}</strong><b>${esc(value)}</b></div><p>${esc(description)}</p></div>`;}

  function renderQuick(result) {
    const {geometry,product,req,plan,fallback,goal}=result;
    $('#resultMode').textContent='rychlý nákup';
    $('#resultPrimaryLabel').textContent='Co koupit';
    $('#resultPrimary').textContent=qty(plan.purchased,product.unit);
    $('#resultPlan').textContent=plan.text;
    $('#resultArea').textContent=area(geometry.total);
    $('#resultCoated').textContent=area(req.coatedArea);
    $('#resultNeed').textContent=rangeQty(req.low,req.high,product.unit);
    $('#resultLeftover').textContent=rangeQty(Math.max(0,plan.purchased-req.high),Math.max(0,plan.purchased-req.low),product.unit);
    const coverage=product.coverageKind==='upTo'?`až ${fmt(product.coverageMax,1)} m²/${product.unit}`:`${fmt(product.coverageMin,1)}–${fmt(product.coverageMax,1)} m²/${product.unit}`;
    const rows=[];
    rows.push(resultRow(product.name,plan.text,`${coverage} · ${result.coats}× vrstva · rezerva ${fmt(result.reserve,0)} %`));
    if(plan.cost>0) rows.push(resultRow('Cena zadaných balení',money(plan.cost),goal==='cost'?'Optimalizace podle nejnižší ceny.':'Cena aktuální vybrané kombinace.'));
    if(geometry.openings>0) rows.push(resultRow('Odečtené otvory',area(geometry.openings),openingMode==='quick'?'Rychlý orientační režim.':'Přesně zadaná plocha otvorů.'));
    $('#resultRows').innerHTML=rows.join('');
    let note;
    if(product.coverageKind==='upTo') note=`${product.name} uvádí vydatnost až ${fmt(product.coverageMax,1)} m²/${product.unit}. Výsledek je proto optimistický výpočet z deklarovaného maxima; skutečná spotřeba může být vyšší.`;
    else note=`Balení pokrývá horní hranici potřeby ${qty(req.high,product.unit)}. Skutečná spotřeba se může v rámci deklarovaného rozsahu měnit podle podkladu a aplikace.`;
    if(fallback) note+=' Režim nejnižší ceny neměl dost oceněných balení, proto je zobrazen plán s nejmenším přebytkem.';
    $('#resultNote').innerHTML=`<strong>Jak číst výsledek</strong><p>${esc(note)}</p>`;
  }

  function renderProject(result) {
    $('#resultMode').textContent='projekt';
    $('#resultArea').textContent=area(result.totalArea);
    $('#resultCoated').textContent=area(result.totalCoated);
    if(result.purchases.length===1){
      const p=result.purchases[0]; $('#resultPrimaryLabel').textContent='Co koupit'; $('#resultPrimary').textContent=qty(p.plan.purchased,p.product.unit); $('#resultPlan').textContent=p.plan.text; $('#resultNeed').textContent=rangeQty(p.low,p.high,p.product.unit); $('#resultLeftover').textContent=rangeQty(Math.max(0,p.plan.purchased-p.high),Math.max(0,p.plan.purchased-p.low),p.product.unit);
    } else {
      $('#resultPrimaryLabel').textContent='Nákupní seznam'; $('#resultPrimary').textContent=`${result.purchases.length} položky`; $('#resultPlan').textContent='stěny a strop se počítají samostatně'; $('#resultNeed').textContent=`${result.purchases.length} materiály`; $('#resultLeftover').textContent='viz rozpis';
    }
    $('#resultRows').innerHTML=result.purchases.map(p=>{
      const coverage=p.product.coverageKind==='upTo'?`až ${fmt(p.product.coverageMax,1)} m²/${p.product.unit}`:`${fmt(p.product.coverageMin,1)}–${fmt(p.product.coverageMax,1)} m²/${p.product.unit}`;
      const extra=p.plan.cost>0?` · ${money(p.plan.cost)}`:'';
      return resultRow(`${p.surfaces.join(' + ')} · ${p.product.name}`,`${qty(p.plan.purchased,p.product.unit)}${extra}`,`${p.plan.text} · potřeba ${rangeQty(p.low,p.high,p.product.unit)} · ${coverage}`);
    }).join('');
    const fallback=result.purchases.some(p=>p.fallback);
    $('#resultNote').innerHTML=`<strong>Projekt agreguje nákup podle výrobku</strong><p>${esc(`Místnosti se nejdřív sečtou na stěny a stropy. Pokud je na obou površích stejný výrobek, potřeba se spojí do jednoho nákupního řádku.${fallback?' U části projektu chyběly ceny, proto se použil plán s nejmenším přebytkem.':''}`)}</p>`;
  }

  function calculateAndRender() {
    const error=$('#formError');
    try {
      const result=mode==='quick'?calculateQuick():calculateProject();
      lastResult=result;
      if(mode==='quick') renderQuick(result); else renderProject(result);
      error.hidden=true; error.textContent='';
    } catch(e) {
      error.hidden=false; error.textContent=e.message || 'Zkontrolujte zadané hodnoty.';
    }
  }

  function setMode(next) {
    mode=next;
    $$('.pp-mode button').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',String(active));});
    $('#quickPanel').hidden=mode!=='quick'; $('#projectPanel').hidden=mode!=='project';
    calculateAndRender();
  }
  function setAreaMode(next){areaMode=next;$$('[data-area-mode]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.areaMode===next));$('#quickRoomPanel').hidden=next!=='room';$('#quickDirectPanel').hidden=next!=='direct';calculateAndRender();}
  function setOpeningMode(next){openingMode=next;$$('[data-opening-mode]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.openingMode===next));$('#quickOpeningsPanel').hidden=next!=='quick';$('#exactOpeningsPanel').hidden=next!=='exact';calculateAndRender();}

  function copySummary() {
    if(!lastResult) return;
    let text='RychléVýpočty.cz – nákupní plán barvy\n';
    if(lastResult.mode==='quick'){
      const r=lastResult; text+=`${r.product.name}\nPlocha: ${area(r.geometry.total)}\nPo vrstvách: ${area(r.req.coatedArea)}\nTechnická potřeba: ${rangeQty(r.req.low,r.req.high,r.product.unit)}\nKoupit: ${qty(r.plan.purchased,r.product.unit)} (${r.plan.text})`;
    }else{
      text+=`Projekt: ${lastResult.rooms.length} místností\nCelková čistá plocha: ${area(lastResult.totalArea)}\n`+lastResult.purchases.map(p=>`${p.surfaces.join(' + ')} – ${p.product.name}: ${qty(p.plan.purchased,p.product.unit)} (${p.plan.text})`).join('\n');
    }
    navigator.clipboard?.writeText(text).then(()=>{const b=$('#copyResult');const old=b.textContent;b.textContent='Zkopírováno';setTimeout(()=>b.textContent=old,1300);});
  }

  $$('.pp-mode button').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  $$('[data-area-mode]').forEach(btn=>btn.addEventListener('click',()=>setAreaMode(btn.dataset.areaMode)));
  $$('[data-opening-mode]').forEach(btn=>btn.addEventListener('click',()=>setOpeningMode(btn.dataset.openingMode)));
  $('#quickProduct').addEventListener('change',()=>{syncQuickProduct(true);calculateAndRender();});
  $('#wallProduct').addEventListener('change',()=>{syncProjectProducts(true);calculateAndRender();});
  $('#ceilingProduct').addEventListener('change',()=>{syncProjectProducts(true);calculateAndRender();});
  $('#quickCustomUnit').addEventListener('change',()=>{syncQuickProduct(false);calculateAndRender();});
  ['quickPackages','quickCoverageMin','quickCoverageMax'].forEach(id=>$('#'+id).addEventListener('change',()=>{syncQuickProduct(false);calculateAndRender();}));
  ['wallCustomUnit','wallPackages','wallCoverageMin','wallCoverageMax','ceilingCustomUnit','ceilingPackages','ceilingCoverageMin','ceilingCoverageMax'].forEach(id=>$('#'+id).addEventListener('change',()=>{syncProjectProducts(false);calculateAndRender();}));
  $('#addRoom').addEventListener('click',()=>{addRoom();calculateAndRender();});
  $('#roomList').addEventListener('click',e=>{const btn=e.target.closest('.pp-room-remove');if(!btn)return;btn.closest('.pp-room-card').remove();renumberRooms();calculateAndRender();});
  form.addEventListener('input',e=>{if(e.target.matches('[data-price-scope]')){calculateAndRender();return;}calculateAndRender();});
  form.addEventListener('change',calculateAndRender);
  $('#copyResult').addEventListener('click',copySummary); $('#printResult').addEventListener('click',()=>window.print());
  $('#menuToggle').addEventListener('click',()=>{const nav=$('#mobileNav');const open=nav.classList.toggle('is-open');$('#menuToggle').setAttribute('aria-expanded',String(open));});

  addRoom({name:'Místnost 1',length:4,width:3,height:2.6,openings:3.3,ceiling:true});
  syncQuickProduct(true); syncProjectProducts(true); calculateAndRender();

  // RV V-next accessibility hardening: complete keyboard model for ARIA tabs.
  (function bindRvTabs(){
    const tablist=document.querySelector('.pp-mode');
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
