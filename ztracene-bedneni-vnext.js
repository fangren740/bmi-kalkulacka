(() => {
  'use strict';

  const products = {
    'diton-15': { maker:'DITON', name:'Ztracené bednění 15', length:500, width:150, height:250, pallet:64, fillLiters:8.5, source:'DITON TL 141 / 01-2026', pourRows:4 },
    'diton-20': { maker:'DITON', name:'Ztracené bednění 20', length:500, width:200, height:250, pallet:60, fillLiters:14, source:'DITON TL 141 / 01-2026', pourRows:4 },
    'diton-30': { maker:'DITON', name:'Ztracené bednění 30', length:500, width:300, height:250, pallet:40, fillLiters:25, source:'DITON TL 141 / 01-2026', pourRows:4 },
    'diton-40': { maker:'DITON', name:'Ztracené bednění 40', length:500, width:400, height:250, pallet:30, fillLiters:36, source:'DITON TL 141 / 01-2026', pourRows:4 },
    custom: { maker:'Vlastní', name:'Vlastní tvárnice / technický list', length:500, width:200, height:250, pallet:0, fillLiters:0, source:'uživatelský technický list', pourRows:0 }
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const fmt = (n, d=0) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits:d, maximumFractionDigits:d }).format(Number.isFinite(n) ? n : 0);
  const money = n => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits:0 }).format(Math.round(Number.isFinite(n) ? n : 0)) + ' Kč';
  const num = el => Number(String(el?.value ?? '').replace(',', '.'));
  const ceil = Math.ceil;
  const clamp = (v,a,b) => Math.min(b, Math.max(a,v));

  const state = { sections:[{id:1,name:'Hlavní úsek',length:8,height:1}], nextId:2 };

  function product() {
    const id = $('input[name="productPreset"]:checked')?.value || 'diton-20';
    if (id !== 'custom') return { id, ...products[id] };
    return {
      id,
      maker:'Vlastní',
      name:$('#customName').value.trim() || 'Vlastní tvárnice',
      length:Math.max(1, num($('#customLength')) || 500),
      width:Math.max(1, num($('#customWidth')) || 200),
      height:Math.max(1, num($('#customHeight')) || 250),
      pallet:Math.max(0, Math.floor(num($('#customPallet')) || 0)),
      fillLiters:Math.max(0, num($('#customFill')) || 0),
      source:'váš technický list',
      pourRows:Math.max(0, Math.floor(num($('#customPourRows')) || 0))
    };
  }

  function readSections() {
    return $$('.zb-segment').map((row, i) => ({
      id:Number(row.dataset.id),
      name:$('.zb-segment-name', row).value.trim() || `Úsek ${i+1}`,
      length:Math.max(0, num($('.zb-segment-length', row)) || 0),
      height:Math.max(0, num($('.zb-segment-height', row)) || 0)
    })).filter(x => x.length > 0 && x.height > 0);
  }

  function sectionCalc(section, p) {
    const blockL = p.length / 1000;
    const blockH = p.height / 1000;
    const rows = ceil(section.height / blockH);
    const blocksPerRow = ceil(section.length / blockL);
    const installedBlocks = rows * blocksPerRow;
    const achievedHeight = rows * blockH;
    const heightDelta = achievedHeight - section.height;
    const nominalArea = section.length * achievedHeight;
    const fill = installedBlocks * p.fillLiters / 1000;
    return { ...section, rows, blocksPerRow, installedBlocks, achievedHeight, heightDelta, nominalArea, fill };
  }

  function rebarCalc(sections, p) {
    if (!$('#rebarEnabled').checked) return null;
    const horizontalBars = Math.max(0, Math.floor(num($('#horizontalBars')) || 0));
    const verticalSpacing = Math.max(0, num($('#verticalSpacing')) || 0) / 1000;
    const verticalExtra = Math.max(0, num($('#verticalExtra')) || 0);
    const diameter = Math.max(0, num($('#rebarDiameter')) || 0);
    if (!horizontalBars && !verticalSpacing) return null;
    let horizontal = 0, vertical = 0, verticalCount = 0;
    sections.forEach(s => {
      if (horizontalBars) horizontal += s.length * s.rows * horizontalBars;
      if (verticalSpacing > 0) {
        const count = ceil(s.length / verticalSpacing) + 1;
        verticalCount += count;
        vertical += count * (s.achievedHeight + verticalExtra);
      }
    });
    const total = horizontal + vertical;
    const kgPerM = diameter > 0 ? (diameter * diameter / 162) : 0;
    return { horizontalBars, horizontal, verticalSpacing, verticalExtra, verticalCount, vertical, diameter, total, weight: total * kgPerM };
  }

  function calculate() {
    const p = product();
    const sections = readSections().map(s => sectionCalc(s,p));
    const blockReserve = Math.max(0, num($('#blockReserve')) || 0);
    const concreteReserve = Math.max(0, num($('#concreteReserve')) || 0);
    const installedBlocks = sections.reduce((a,s)=>a+s.installedBlocks,0);
    const orderBlocks = ceil(installedBlocks * (1 + blockReserve/100));
    const spareBlocks = Math.max(0, orderBlocks-installedBlocks);
    const fillBase = sections.reduce((a,s)=>a+s.fill,0);
    const fillOrder = fillBase * (1 + concreteReserve/100);
    const fullPallets = p.pallet ? ceil(orderBlocks/p.pallet) : 0;
    const palletEquivalent = p.pallet ? orderBlocks/p.pallet : 0;
    const maxRows = sections.reduce((m,s)=>Math.max(m,s.rows),0);
    const pourStages = p.pourRows ? ceil(maxRows/p.pourRows) : 0;
    const rebar = rebarCalc(sections,p);
    const blockPrice = Math.max(0, num($('#blockPrice')) || 0);
    const concretePrice = Math.max(0, num($('#concretePrice')) || 0);
    const estimatedCost = orderBlocks*blockPrice + fillOrder*concretePrice;
    return {p,sections,blockReserve,concreteReserve,installedBlocks,orderBlocks,spareBlocks,fillBase,fillOrder,fullPallets,palletEquivalent,maxRows,pourStages,rebar,blockPrice,concretePrice,estimatedCost};
  }

  function renderSegments() {
    const wrap = $('#segmentsList');
    wrap.innerHTML = state.sections.map((s,i)=>`<div class="zb-segment" data-id="${s.id}">
      <div class="zb-segment-index">${String(i+1).padStart(2,'0')}</div>
      <label><span>Název úseku</span><input class="zb-segment-name" type="text" value="${escapeHtml(s.name)}" maxlength="32"></label>
      <label><span>Délka</span><div class="zb-unit"><input class="zb-segment-length" type="number" min="0.1" step="0.1" value="${s.length}"><b>m</b></div></label>
      <label><span>Cílová výška</span><div class="zb-unit"><input class="zb-segment-height" type="number" min="0.1" step="0.05" value="${s.height}"><b>m</b></div></label>
      ${state.sections.length>1?'<button class="zb-remove" type="button" aria-label="Odebrat tento úsek">×</button>':''}
    </div>`).join('');
  }

  function renderWall(section,p) {
    const wall=$('#courseWall');
    if(!section){wall.innerHTML='<div class="zb-wall-empty">Zadejte rozměry úseku.</div>';return;}
    const shownRows=Math.min(section.rows,6);
    const shownCols=Math.min(section.blocksPerRow,12);
    const rows=[];
    for(let r=0;r<shownRows;r++){
      let cells='';
      for(let c=0;c<shownCols;c++) cells += `<i></i>`;
      rows.push(`<div class="zb-course-row ${r%2?'is-offset':''}" style="--cols:${shownCols}">${cells}<b>${section.blocksPerRow} ks</b></div>`);
    }
    wall.innerHTML=`<div class="zb-wall-dim zb-wall-dim-top"><span>${fmt(section.length,2)} m</span></div><div class="zb-wall-grid">${rows.join('')}</div><div class="zb-wall-dim zb-wall-dim-side"><span>${section.rows} řady · ${fmt(section.achievedHeight,2)} m</span></div>`;
    $('#courseWallCaption').textContent = `${p.name}: modul ${fmt(p.length,0)} × ${fmt(p.height,0)} mm · ${section.blocksPerRow} ks v řadě`;
  }

  function renderConcreteGauge(data) {
    const max = Math.max(0.5, Math.ceil(data.fillOrder*2)/2);
    const ratio = clamp(data.fillOrder/max*100,0,100);
    $('#concreteFill').style.height = `${ratio}%`;
    $('#concreteGaugeMain').textContent = `${fmt(data.fillOrder,2)} m³`;
    $('#concreteGaugeScale').textContent = `měřítko 0–${fmt(max,1)} m³`;
    $('#concreteBaseText').textContent = `${fmt(data.fillBase,2)} m³ čistá výplň`;
    $('#concreteReserveText').textContent = `+ ${fmt(data.concreteReserve,0)} % rezerva`;
  }

  function render() {
    const d=calculate();
    const has=d.sections.length>0;
    $('#answerBlocks').textContent = has ? `${fmt(d.orderBlocks,0)} ks` : '—';
    $('#answerLead').textContent = has ? `Na stavbu ${fmt(d.installedBlocks,0)} ks + ${fmt(d.spareBlocks,0)} ks rezerva.` : 'Zadejte alespoň jeden úsek.';
    $('#answerConcrete').textContent = d.p.fillLiters>0 && has ? `${fmt(d.fillOrder,2)} m³` : 'doplňte TL';
    $('#answerRows').textContent = has ? `${fmt(d.maxRows,0)}` : '—';
    $('#answerProduct').textContent = d.p.name;
    $('#answerProductMeta').textContent = `${fmt(d.p.length,0)}×${fmt(d.p.width,0)}×${fmt(d.p.height,0)} mm`;
    $('#answerPallet').textContent = d.p.pallet && has ? `${fmt(d.palletEquivalent,2)} pal.` : '—';
    $('#answerPalletNote').textContent = d.p.pallet && has ? `ekvivalent; celé palety = ${d.fullPallets}` : 'doplňte ks/paletu z TL';
    $('#answerStages').textContent = d.p.pourRows && has ? `${d.pourStages}` : 'ověřit';
    $('#answerStagesNote').textContent = d.p.pourRows && has ? `DITON: max. ${d.p.pourRows} vrstvy / 1 m najednou` : 'řiďte se technickým listem výrobce';

    const deltas=d.sections.map(s=>s.heightDelta);
    const maxDelta=deltas.length?Math.max(...deltas):0;
    const exact=deltas.length && deltas.every(x=>Math.abs(x)<0.001);
    const moduleBox=$('#moduleCheck');
    moduleBox.classList.toggle('is-ok',exact);
    moduleBox.classList.toggle('is-warn',!exact && has);
    $('#moduleCheckTitle').textContent = !has ? 'Čekám na rozměry' : exact ? 'Výška sedí přesně do modulu' : 'Cílová výška nevychází na celé řady';
    $('#moduleCheckText').textContent = !has ? 'Zadejte délku a výšku.' : exact ? `Všechny úseky končí na celé výšce tvárnice ${fmt(d.p.height,0)} mm.` : `Největší přesah po zaokrouhlení na celé řady je ${fmt(maxDelta*1000,0)} mm. Neřežte výšku automaticky; ověřte detail v projektu.`;

    const sectionBreakdown=$('#sectionBreakdown');
    sectionBreakdown.innerHTML = d.sections.map(s=>`<div><span>${escapeHtml(s.name)}</span><strong>${s.rows} × ${s.blocksPerRow} = ${s.installedBlocks} ks</strong><small>cílově ${fmt(s.height,2)} m → modulově ${fmt(s.achievedHeight,2)} m</small></div>`).join('') || '<div><span>Bez úseků</span><strong>—</strong></div>';

    renderWall(d.sections[0],d.p);
    renderConcreteGauge(d);

    const rebarBox=$('#rebarResult');
    if(d.rebar){
      rebarBox.hidden=false;
      $('#rebarLength').textContent=`${fmt(d.rebar.total,1)} m`;
      $('#rebarHorizontal').textContent=`${fmt(d.rebar.horizontal,1)} m`;
      $('#rebarVertical').textContent=`${fmt(d.rebar.vertical,1)} m / ${d.rebar.verticalCount} pozic`;
      $('#rebarWeight').textContent=d.rebar.diameter?`${fmt(d.rebar.weight,1)} kg`:'zadejte Ø';
    } else rebarBox.hidden=true;

    const costBox=$('#costResult');
    const hasCost=d.blockPrice>0 || d.concretePrice>0;
    costBox.hidden=!hasCost;
    if(hasCost){
      $('#costTotal').textContent=money(d.estimatedCost);
      $('#costBlocks').textContent=money(d.orderBlocks*d.blockPrice);
      $('#costConcrete').textContent=money(d.fillOrder*d.concretePrice);
    }

    $('#heroBlocks').textContent=has?`${fmt(d.orderBlocks,0)} ks`:'68 ks';
    $('#heroConcrete').textContent=has && d.p.fillLiters?`${fmt(d.fillOrder,2)} m³`:'0,94 m³';
    $('#heroRows').textContent=has?`${d.maxRows} řady`:'4 řady';
    $('#heroModule').textContent=`${fmt(d.p.length,0)}×${fmt(d.p.height,0)}`;
  }

  function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function bind() {
    $('#addSegment').addEventListener('click',()=>{
      if(state.sections.length>=6) return;
      state.sections=readSections();
      state.sections.push({id:state.nextId++,name:`Úsek ${state.sections.length+1}`,length:4,height:1});
      renderSegments(); render();
    });
    $$('input[name="productPreset"]').forEach(el=>el.addEventListener('change',()=>{
      $('#customProduct').hidden=el.value!=='custom' || !el.checked;
      render();
    }));
    ['customName','customLength','customWidth','customHeight','customPallet','customFill','customPourRows','blockReserve','concreteReserve','blockPrice','concretePrice','horizontalBars','verticalSpacing','verticalExtra','rebarDiameter'].forEach(id=>$('#'+id)?.addEventListener('input',render));
    $('#rebarEnabled').addEventListener('change',()=>{ $('#rebarInputs').hidden=!$('#rebarEnabled').checked; render(); });
    $('#costEnabled').addEventListener('change',()=>{ $('#costInputs').hidden=!$('#costEnabled').checked; render(); });
    $('#segmentsList').addEventListener('input',render);
    $('#segmentsList').addEventListener('click',e=>{
      const btn=e.target.closest('.zb-remove');
      if(!btn) return;
      const id=Number(btn.closest('.zb-segment').dataset.id);
      state.sections=readSections().filter(x=>x.id!==id);
      renderSegments(); render();
    });

    const menu=$('#menuToggle'), mobile=$('#mobileNav');
    menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.classList.toggle('is-open',!open);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu){menu.setAttribute('aria-expanded','false');mobile.classList.remove('is-open');}});
  }

  renderSegments(); bind(); render();
})();
