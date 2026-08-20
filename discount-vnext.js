(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const num = (id, fallback = 0) => {
    const raw = String($(id)?.value ?? '').replace(/\s/g,'').replace(',','.');
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0,value) : fallback;
  };
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const money = (n) => `${Math.round(Math.max(0,n)).toLocaleString('cs-CZ')} Kč`;
  const pct = (n,d=1) => `${Math.max(0,n).toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d})} %`;
  const state = { mode:'basic' };

  function calculateMain(){
    const price = num('originalPrice',2000);
    const d1 = clamp(num('discount1',20),0,100);
    const advanced = state.mode === 'advanced';
    const d2 = advanced ? clamp(num('discount2',0),0,100) : 0;
    const qty = advanced ? Math.max(1,Math.round(num('quantity',1))) : 1;
    const coupon = advanced ? num('coupon',0) : 0;
    const shipping = advanced ? num('shipping',0) : 0;
    const afterPercentUnit = price*(1-d1/100)*(1-d2/100);
    const originalTotal = price*qty;
    const subtotalAfterPercent = afterPercentUnit*qty;
    const couponUsed = Math.min(coupon,subtotalAfterPercent);
    const goodsTotal = Math.max(0,subtotalAfterPercent-couponUsed);
    const finalTotal = goodsTotal+shipping;
    const savings = Math.max(0,originalTotal-goodsTotal);
    const effective = originalTotal>0 ? clamp(savings/originalTotal*100,0,100) : 0;
    const remaining = 100-effective;
    const unitEffective = qty>0 ? goodsTotal/qty : 0;
    return {price,d1,d2,qty,coupon,couponUsed,shipping,afterPercentUnit,originalTotal,goodsTotal,finalTotal,savings,effective,remaining,unitEffective};
  }

  function renderMain(){
    const r=calculateMain();
    const advanced = state.mode==='advanced';
    $('advancedFields').hidden=!advanced;
    $('mainResultLabel').textContent = advanced && (r.qty>1 || r.couponUsed>0 || r.shipping>0) ? 'Za objednávku zaplatíte' : 'Po slevě zaplatíte';
    $('mainResult').textContent=money(r.finalTotal);
    $('resultSummary').textContent = advanced
      ? `Z původní hodnoty ${money(r.originalTotal)} je po procentních slevách a kuponu ${money(r.goodsTotal)}. Doprava se do procenta slevy nepočítá.`
      : `Z původních ${money(r.price)} při slevě ${pct(r.d1,0)}.`;
    $('receiptOriginal').textContent=money(r.originalTotal);
    $('receiptPercent').textContent=money(r.afterPercentUnit*r.qty);
    $('receiptCoupon').textContent=advanced?`− ${money(r.couponUsed)}`:'—';
    $('receiptShipping').textContent=advanced?money(r.shipping):'—';
    $('receiptSavings').textContent=money(r.savings);
    $('receiptTotal').textContent=money(r.finalTotal);
    $('effectiveDiscount').textContent=`${pct(r.effective,1)} skutečná sleva`; 
    $('remainingPrice').textContent=pct(r.remaining,1);
    $('discountFill').style.width=`${clamp(r.effective,0,100)}%`;
    $('discountMarker').style.left=`${clamp(r.effective,0,100)}%`;
    $('resultMeaning').textContent = r.effective <= 0.01 ? 'Cena se proti původní hodnotě prakticky nezměnila.' : `Skutečná sleva z ceny zboží je ${pct(r.effective,1)}. ${advanced && r.shipping>0 ? 'Doprava je přičtena až poté, takže výsledná platba může být vyšší než samotná cena zboží po slevě.' : ''}`;
    // hero live proof
    $('heroOriginal').textContent=money(r.price);
    $('heroDiscount').textContent=`−${pct(r.d1,0)}`;
    $('heroFinal').textContent=money(r.afterPercentUnit);
    $('heroSaving').textContent=`úspora ${money(r.price-r.afterPercentUnit)}`;
    // waterfall: demonstrate actual current stacking
    const p1=r.price*(1-r.d1/100); const p2=p1*(1-r.d2/100); const e2=r.price>0?(1-p2/r.price)*100:0;
    $('wfOriginal').textContent=money(r.price); $('wfAfter1').textContent=money(p1); $('wfAfter2').textContent=money(p2); $('wfD1').textContent=`−${pct(r.d1,0)}`; $('wfD2').textContent=`−${pct(r.d2,0)}`; $('wfEffective').textContent=pct(e2,1);
    const max=Math.max(1,r.price); $('wfBar0').style.width='100%'; $('wfBar1').style.width=`${clamp(p1/max*100,0,100)}%`; $('wfBar2').style.width=`${clamp(p2/max*100,0,100)}%`;
    $('stackSentence').textContent = r.d2>0 ? `Slevy ${pct(r.d1,0)} a ${pct(r.d2,0)} se nesčítají. Druhá sleva se počítá už z nižší ceny, takže skutečné zlevnění je ${pct(e2,1)}.` : 'Přidejte v podrobném režimu druhou slevu a uvidíte, proč dvě procenta nejdou jednoduše sečíst.';
    // sync seller defaults only if user has not edited seller inputs
    if(!$('sellerPrice').dataset.touched) $('sellerPrice').value=String(Math.round(r.price));
    if(!$('sellerDiscount').dataset.touched) $('sellerDiscount').value=String(r.d1);
    renderSeller();
  }

  function sellerCalc(){
    const price=num('sellerPrice',1000); const cost=num('sellerCost',600); const discount=clamp(num('sellerDiscount',10),0,100); const baseUnits=Math.max(1,Math.round(num('sellerUnits',100)));
    const newPrice=price*(1-discount/100); const before=price-cost; const after=newPrice-cost;
    const finite=before>0 && after>0;
    const multiplier=finite?before/after:Infinity; const growth=finite?(multiplier-1)*100:Infinity; const needed=finite?Math.ceil(baseUnits*multiplier):Infinity;
    return {price,cost,discount,baseUnits,newPrice,before,after,finite,multiplier,growth,needed};
  }
  function renderSeller(){
    const r=sellerCalc();
    $('contribBefore').textContent=money(r.before); $('contribAfter').textContent=money(r.after);
    $('sellerNewPrice').textContent=money(r.newPrice);
    const answer=$('volumeGrowth'); const units=$('volumeUnits'); const note=$('volumeWarning');
    if(r.before<=0){answer.textContent='—';units.textContent='Nejdřív musí být cena nad variabilním nákladem.';note.textContent='Původní příspěvek na úhradu je nulový nebo záporný.';note.classList.add('is-danger');}
    else if(!r.finite){answer.textContent='bez konečného bodu';units.textContent='Sleva snižuje příspěvek na nulu nebo do záporu.';note.textContent='Vyšší objem prodeje už stejný příspěvek nezachrání, protože každá další jednotka nepřidává kladnou částku na fixní náklady a zisk.';note.classList.add('is-danger');}
    else {answer.textContent=`+${pct(r.growth,1)}`;units.textContent=`${r.needed.toLocaleString('cs-CZ')} ks místo ${r.baseUnits.toLocaleString('cs-CZ')} ks`;note.textContent=`Při nezměněném variabilním nákladu potřebujete přibližně ${r.multiplier.toLocaleString('cs-CZ',{maximumFractionDigits:2})}× původní objem, abyste zachovali stejný celkový příspěvek.`;note.classList.remove('is-danger');}
  }

  function setMode(mode){
    state.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    renderMain();
  }
  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  document.querySelectorAll('#discountForm input,#discountForm select').forEach(el=>el.addEventListener('input',renderMain));
  document.querySelectorAll('#sellerForm input').forEach(el=>el.addEventListener('input',()=>{el.dataset.touched='1';renderSeller();}));
  $('resetDiscount')?.addEventListener('click',()=>{ $('originalPrice').value='2000';$('discount1').value='20';$('discount2').value='0';$('quantity').value='1';$('coupon').value='0';$('shipping').value='0';document.querySelectorAll('#sellerForm input').forEach(el=>delete el.dataset.touched);$('sellerCost').value='600';$('sellerUnits').value='100';setMode('basic');});
  document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{const [price,discount]=btn.dataset.preset.split(':').map(Number);$('originalPrice').value=price;$('discount1').value=discount;renderMain();}));
  const toggle=document.querySelector('.menu-toggle'); const nav=document.querySelector('.main-nav');
  toggle?.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav?.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');}});
  setMode('basic');
})();
