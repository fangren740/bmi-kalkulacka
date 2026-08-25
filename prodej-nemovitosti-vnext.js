(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const state = { mode: 'basic', commissionMode: 'percent', advancedInitialized: false };
  const presets = {
    flat: { salePrice: 5000000, mortgageBalance: 500000, commissionMode: 'percent', commissionRate: 4, commissionFixed: 200000, otherCostsBasic: 55000, legalCosts: 30000, prepCosts: 20000, adminCosts: 3000, registryFee: 2000, mortgageFee: 0, contingencyRate: 0, taxStatus: 'exempt', taxReserve: 0, ownershipShare: 100, label: 'Modelový byt' },
    house: { salePrice: 8500000, mortgageBalance: 1900000, commissionMode: 'percent', commissionRate: 3.5, commissionFixed: 297500, otherCostsBasic: 120000, legalCosts: 45000, prepCosts: 60000, adminCosts: 13000, registryFee: 2000, mortgageFee: 0, contingencyRate: 0, taxStatus: 'unsure', taxReserve: 0, ownershipShare: 100, label: 'Rodinný dům' },
    self: { salePrice: 4300000, mortgageBalance: 0, commissionMode: 'fixed', commissionRate: 0, commissionFixed: 0, otherCostsBasic: 85000, legalCosts: 40000, prepCosts: 40000, adminCosts: 3000, registryFee: 2000, mortgageFee: 0, contingencyRate: 0, taxStatus: 'exempt', taxReserve: 0, ownershipShare: 100, label: 'Prodej bez RK' }
  };
  let currentPreset = 'flat';
  const numericIds = ['salePrice','mortgageBalance','commissionRate','commissionFixed','otherCostsBasic','legalCosts','prepCosts','adminCosts','mortgageFee','contingencyRate','taxReserve','ownershipShare'];
  const parse = (v) => {
    const n = Number(String(v ?? '').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,''));
    return Number.isFinite(n) ? n : NaN;
  };
  const value = (id) => parse($(id)?.value);
  const money = (n) => `${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(Number.isFinite(n)?n:0))} Kč`;
  const percent = (n,d=1) => `${new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number.isFinite(n)?n:0)} %`;
  const signedMoney = (n) => `${n < 0 ? '−' : '+'}${money(Math.abs(n))}`;
  const setNum = (id,n) => { if($(id)) $(id).value = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(n); };
  const setError = (id,msg='') => { const el=$(id), err=$(id+'Error'); if(el) el.closest('.sale54-field')?.classList.toggle('has-error',!!msg); if(err) err.textContent=msg; };

  function validate(){
    const rules = {
      salePrice:[1,1e12,'Zadejte prodejní cenu vyšší než 0 Kč.'],
      mortgageBalance:[0,1e12,'Doplacení úvěru nesmí být záporné.'],
      commissionRate:[0,30,'Provize musí být mezi 0 a 30 %.'],
      commissionFixed:[0,1e12,'Provize nesmí být záporná.'],
      otherCostsBasic:[0,1e12,'Náklady nesmí být záporné.'],
      legalCosts:[0,1e12,'Náklady nesmí být záporné.'], prepCosts:[0,1e12,'Náklady nesmí být záporné.'], adminCosts:[0,1e12,'Náklady nesmí být záporné.'], mortgageFee:[0,1e12,'Náklady nesmí být záporné.'], taxReserve:[0,1e12,'Rezerva nesmí být záporná.'], contingencyRate:[0,30,'Rezerva musí být mezi 0 a 30 %.'], ownershipShare:[0.01,100,'Podíl musí být větší než 0 a nejvýše 100 %.']
    };
    let ok = true;
    Object.entries(rules).forEach(([id,[min,max,msg]]) => {
      if(state.mode==='basic' && !['salePrice','mortgageBalance','commissionRate','commissionFixed','otherCostsBasic'].includes(id)){ setError(id); return; }
      if(id==='commissionRate' && state.commissionMode!=='percent'){ setError(id); return; }
      if(id==='commissionFixed' && state.commissionMode!=='fixed'){ setError(id); return; }
      const n=value(id), bad=!Number.isFinite(n)||n<min||n>max; setError(id,bad?msg:''); if(bad) ok=false;
    });
    return ok;
  }

  function commissionFor(sharePrice){
    return state.commissionMode==='fixed' ? Math.max(0,value('commissionFixed')||0) : Math.max(0,sharePrice*(value('commissionRate')||0)/100);
  }

  function model(salePriceOverride){
    const salePrice = Number.isFinite(salePriceOverride) ? salePriceOverride : value('salePrice');
    const share = state.mode==='advanced' ? Math.max(.0001,(value('ownershipShare')||100)/100) : 1;
    const gross = Math.max(0,salePrice*share);
    const commission = commissionFor(gross);
    let other=0, detailed=0, extras=0, contingency=0;
    if(state.mode==='advanced'){
      const legal=Math.max(0,value('legalCosts')||0), prep=Math.max(0,value('prepCosts')||0), admin=Math.max(0,value('adminCosts')||0);
      const registry=Math.max(0,parse($('registryFee')?.value)||0), bank=Math.max(0,value('mortgageFee')||0), tax=Math.max(0,value('taxReserve')||0);
      contingency=Math.max(0,gross*(value('contingencyRate')||0)/100);
      detailed=legal+prep+admin;
      extras=registry+bank+tax+contingency;
      other=detailed+extras;
    } else {
      other=Math.max(0,value('otherCostsBasic')||0);
    }
    const sellingCosts=commission+other;
    const afterCosts=gross-sellingCosts;
    const debt=Math.max(0,value('mortgageBalance')||0);
    const net=afterCosts-debt;
    return {salePrice,gross,commission,other,detailed,extras,contingency,sellingCosts,afterCosts,debt,net};
  }

  function syncBasicToAdvanced(){
    if(state.advancedInitialized) return;
    const total=Math.max(0,value('otherCostsBasic')||0);
    const registry=total>=2000?2000:0;
    const rest=Math.max(0,total-registry);
    const legal=Math.round(rest*.58/1000)*1000;
    const prep=Math.round(rest*.36/1000)*1000;
    const admin=Math.max(0,rest-legal-prep);
    setNum('legalCosts',legal); setNum('prepCosts',prep); setNum('adminCosts',admin); $('registryFee').value=String(registry);
    setNum('mortgageFee',0); setNum('taxReserve',0); setNum('contingencyRate',0); setNum('ownershipShare',100);
    state.advancedInitialized=true;
  }
  function syncAdvancedToBasic(){
    const m=model(); setNum('otherCostsBasic',m.other);
  }

  function setMode(mode){
    if(mode==='advanced') syncBasicToAdvanced(); else if(state.mode==='advanced') syncAdvancedToBasic();
    state.mode=mode;
    qsa('[data-mode]').forEach(btn=>{const on=btn.dataset.mode===mode;btn.classList.toggle('is-active',on);btn.setAttribute('aria-pressed',String(on));});
    $('advancedPanel').hidden=mode!=='advanced'; qsa('.sale54-basic-only').forEach(x=>x.hidden=mode==='advanced'); qsa('.sale54-advanced-result').forEach(x=>x.hidden=mode!=='advanced'); $('resultOtherRow').hidden=mode==='advanced';
    $('resultMode').textContent=mode==='advanced'?'POKROČILÝ REŽIM':'ZÁKLADNÍ REŽIM'; calculate();
  }

  function setCommissionMode(mode){
    state.commissionMode=mode;
    qsa('input[name="commissionMode"]').forEach(input=>{const on=input.value===mode;input.checked=on;input.closest('label')?.classList.toggle('is-active',on);});
    $('commissionPercentField').hidden=mode!=='percent'; $('commissionFixedField').hidden=mode!=='fixed'; calculate();
  }

  function updateTaxNotice(){
    const status=$('taxStatus')?.value || 'exempt';
    const notice=$('taxNotice');
    if(status==='exempt'){
      notice.className='sale54-tax-notice is-ok'; $('taxNoticeText').textContent='Osvobození máte označené jako ověřené. Kalkulačka do výsledku daň nepřidává, pokud je rezerva 0 Kč.'; $('taxHelper').textContent='Daňová rezerva může zůstat nulová, pokud máte osvobození skutečně ověřené.';
    } else if(status==='unsure'){
      notice.className='sale54-tax-notice is-warn'; $('taxNoticeText').textContent='Daňovou situaci nemáte potvrzenou. Čistý výnos berte jako neúplný, dokud neověříte osvobození nebo nedoplníte vlastní rezervu.'; $('taxHelper').textContent='Ověřte podmínky u Finanční správy nebo s daňovým poradcem před podpisem smlouvy.';
    } else {
      notice.className='sale54-tax-notice is-warn'; $('taxNoticeText').textContent='Počítáte se zdaněním. Výsledek zahrnuje pouze částku, kterou jste sami zadali do daňové rezervy.'; $('taxHelper').textContent='Kalkulačka daňový základ ani sazbu neurčuje. Zadejte vlastní ověřenou rezervu.';
    }
  }

  function renderSensitivity(base){
    const impacts=[1,3,5].map(p=>{const m=model(value('salePrice')*(1-p/100));return {p,m,delta:m.net-base.net};});
    const one=Math.abs(impacts[0].delta); $('onePctImpact').textContent=money(one);
    impacts.forEach(({p,m,delta})=>{ $('scenario'+p+'Net').textContent=money(m.net); $('scenario'+p+'Delta').textContent=`${signedMoney(delta)} proti plánu`; });
    $('sensitivityNote').textContent=state.commissionMode==='percent'?'U procentní provize část slevy kompenzuje nižší provize. Fixní náklady a doplacení banky se nemění.':'U pevné provize se sleva z ceny propíše do čistého výnosu téměř korunu za korunu; ostatní fixní náklady a banka se nemění.';
  }

  function calculate(){
    if(!validate()) return;
    const m=model();
    const costPct=m.gross>0?m.sellingCosts/m.gross*100:0, debtPct=m.gross>0?m.debt/m.gross*100:0, sharePct=m.gross>0?m.net/m.gross*100:0;
    $('heroGross').textContent=money(m.gross); $('heroCosts').textContent=money(m.sellingCosts); $('heroDebt').textContent=money(m.debt); $('heroNet').textContent=money(m.net); $('heroShare').textContent=m.net>=0?`${percent(sharePct)} prodejní ceny`:`Chybí ${money(Math.abs(m.net))}`;
    $('heroProperty').textContent=presets[currentPreset]?.label || 'Váš prodej'; $('heroNote').textContent=m.net>=0?`Provize a ostatní výdaje tvoří ${percent(costPct)} ceny.`:`Zadaná cena nepokrývá prodejní náklady a dluh.`;
    $('resultNet').textContent=money(m.net); $('resultShare').textContent=m.net>=0?`${percent(sharePct)} vaší části prodejní ceny`:`Po nákladech a dluhu chybí ${money(Math.abs(m.net))}`; $('resultGross').textContent=money(m.gross); $('resultCommission').textContent=money(m.commission); $('resultOther').textContent=money(m.other); $('resultDetailed').textContent=money(m.detailed); $('resultExtras').textContent=money(m.extras); $('resultAfterCosts').textContent=money(m.afterCosts); $('resultMortgage').textContent=money(m.debt); $('resultCostPct').textContent=`${percent(costPct)} ceny`; $('resultDebtPct').textContent=`${percent(debtPct)} ceny`;
    $('flowGross').textContent=money(m.gross); $('flowCosts').textContent=money(m.sellingCosts); $('flowDebt').textContent=money(m.debt); $('flowNet').textContent=money(m.net);
    updateTaxNotice(); renderSensitivity(m);
  }

  function applyPreset(key){
    const p=presets[key]; if(!p) return; currentPreset=key;
    Object.entries(p).forEach(([id,v])=>{ if(numericIds.includes(id)) setNum(id,v); });
    $('registryFee').value=String(p.registryFee); $('taxStatus').value=p.taxStatus; state.advancedInitialized=true; setCommissionMode(p.commissionMode); calculate();
  }

  qsa('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
  qsa('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  qsa('input[name="commissionMode"]').forEach(input=>input.addEventListener('change',()=>setCommissionMode(input.value)));
  qsa('#saleForm input, #saleForm select').forEach(el=>{ const event=el.tagName==='SELECT'?'change':'input'; el.addEventListener(event,()=>{currentPreset='custom';calculate();}); });
  $('resetButton').addEventListener('click',()=>{state.mode='basic';state.advancedInitialized=false;applyPreset('flat');setMode('basic');});
  $('copyButton').addEventListener('click',async()=>{ const m=model(); const txt=`Prodej nemovitosti – orientační closing statement\nVaše část prodejní ceny: ${money(m.gross)}\nProdejní náklady: ${money(m.sellingCosts)}\nDoplacení úvěru: ${money(m.debt)}\nČistá částka: ${money(m.net)}\nrychlevypocty.cz`; try{await navigator.clipboard.writeText(txt);$('copyButton').textContent='Zkopírováno ✓';setTimeout(()=>$('copyButton').textContent='Kopírovat výsledek',1800);}catch(e){$('copyButton').textContent='Kopírování není dostupné';} });
  const menuBtn=document.querySelector('.menu-btn'), mobileNav=$('mobile-nav'); if(menuBtn&&mobileNav) menuBtn.addEventListener('click',()=>{const open=menuBtn.getAttribute('aria-expanded')==='true';menuBtn.setAttribute('aria-expanded',String(!open));mobileNav.classList.toggle('is-open',!open);});
  applyPreset('flat'); setMode('basic');
})();
