(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { mode: 'basic', advancedInitialized: false };
  const ids = ['salePrice','mortgageBalance','commissionRate','otherCostsBasic','legalCosts','prepCosts','adminCosts','mortgageFee','taxReserve','contingencyRate','ownershipShare','targetCash','priceShock'];
  const presets = {
    flat:{salePrice:5000000,mortgageBalance:500000,commissionRate:4,otherCostsBasic:55000,legalCosts:30000,prepCosts:20000,adminCosts:5000,mortgageFee:0,taxReserve:0,contingencyRate:0,ownershipShare:100,targetCash:3500000,priceShock:3,taxStatus:'exempt'},
    house:{salePrice:8500000,mortgageBalance:1900000,commissionRate:3.5,otherCostsBasic:135000,legalCosts:45000,prepCosts:75000,adminCosts:15000,mortgageFee:0,taxReserve:0,contingencyRate:.5,ownershipShare:100,targetCash:5500000,priceShock:4,taxStatus:'unsure'},
    self:{salePrice:4300000,mortgageBalance:0,commissionRate:0,otherCostsBasic:85000,legalCosts:40000,prepCosts:35000,adminCosts:10000,mortgageFee:0,taxReserve:0,contingencyRate:1,ownershipShare:100,targetCash:3800000,priceShock:3,taxStatus:'exempt'}
  };
  const parseNumber = (value) => {
    const cleaned = String(value ?? '').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,'');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  };
  const fmt = (n) => `${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(Number.isFinite(n)?n:0))} Kč`;
  const fmtSigned = (n) => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`;
  const pct = (n,d=1) => `${new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number.isFinite(n)?n:0)} %`;
  const setValue = (id,n) => { const el=$(id); if(el) el.value = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2,useGrouping:true}).format(n); };
  const fieldError = (id,message) => { const el=$(id); if(!el) return; const field=el.closest('.field'); if(field) field.classList.toggle('has-error',Boolean(message)); const err=$(id+'Error'); if(err) err.textContent=message||''; };
  const value = (id) => parseNumber($(id)?.value);

  function syncBasicToAdvanced(){
    const total=Math.max(0,value('otherCostsBasic')||0);
    if(!state.advancedInitialized){
      const legal=Math.round(total*.55/1000)*1000;
      const prep=Math.round(total*.35/1000)*1000;
      const admin=Math.max(0,total-legal-prep);
      setValue('legalCosts',legal);setValue('prepCosts',prep);setValue('adminCosts',admin);
      state.advancedInitialized=true;
    }
  }
  function syncAdvancedToBasic(){
    const total=Math.max(0,value('legalCosts')||0)+Math.max(0,value('prepCosts')||0)+Math.max(0,value('adminCosts')||0)+Math.max(0,value('mortgageFee')||0)+Math.max(0,value('taxReserve')||0);
    setValue('otherCostsBasic',total);
  }
  function setMode(mode){
    if(mode==='advanced') syncBasicToAdvanced(); else if(state.mode==='advanced') syncAdvancedToBasic();
    state.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    $('advancedPanel').hidden=mode!=='advanced';
    document.querySelectorAll('.basic-only').forEach(el=>el.hidden=mode==='advanced');
    $('modeDescription').textContent=mode==='basic'?'Základní režim používá cenu, hypotéku, provizi a souhrn ostatních známých nákladů.':'Pokročilý režim nahrazuje souhrn konkrétními položkami a přidává daňovou rezervu, vlastnický podíl, cíl a stresový test.';
    calculate();
  }
  function validate(){
    let ok=true;
    const rules={salePrice:[0,1e12,'Cena musí být větší než 0.'],mortgageBalance:[0,1e12,'Dluh nesmí být záporný.'],commissionRate:[0,30,'Provize musí být od 0 do 30 %.'],otherCostsBasic:[0,1e12,'Náklady nesmí být záporné.'],legalCosts:[0,1e12,'Náklady nesmí být záporné.'],prepCosts:[0,1e12,'Náklady nesmí být záporné.'],adminCosts:[0,1e12,'Náklady nesmí být záporné.'],mortgageFee:[0,1e12,'Náklady nesmí být záporné.'],taxReserve:[0,1e12,'Rezerva nesmí být záporná.'],contingencyRate:[0,30,'Rezerva musí být od 0 do 30 %.'],ownershipShare:[.01,100,'Podíl musí být větší než 0 a nejvýše 100 %.'],targetCash:[0,1e12,'Cíl nesmí být záporný.'],priceShock:[0,30,'Pokles musí být od 0 do 30 %.']};
    Object.entries(rules).forEach(([id,[min,max,msg]])=>{if(state.mode==='basic'&&!['salePrice','mortgageBalance','commissionRate','otherCostsBasic'].includes(id)){fieldError(id,'');return;}const n=value(id);const bad=!Number.isFinite(n)||n<min||n>max;fieldError(id,bad?msg:'');if(bad)ok=false;});
    return ok;
  }
  function model(overrides={}){
    const salePrice=overrides.salePrice ?? value('salePrice');
    const share=state.mode==='advanced' ? value('ownershipShare')/100 : 1;
    const sharePrice=Math.max(0,salePrice*share);
    const commissionRate=overrides.commissionRate ?? value('commissionRate');
    const commission=Math.max(0,sharePrice*commissionRate/100);
    let fixed=0,contingency=0,parts=[];
    if(state.mode==='advanced'){
      const legal=Math.max(0,value('legalCosts')),prep=Math.max(0,value('prepCosts')),admin=Math.max(0,value('adminCosts')),bank=Math.max(0,value('mortgageFee')),tax=Math.max(0,value('taxReserve'));
      fixed=legal+prep+admin+bank+tax+(overrides.extraFixed||0);
      contingency=Math.max(0,sharePrice*value('contingencyRate')/100);
      parts=[['Provize realitní kanceláře',commission],['Právní servis a úschova',legal],['Příprava a prezentace',prep],['Dokumenty a administrativa',admin],['Náklady banky',bank],['Daňová rezerva',tax],['Bezpečnostní rezerva',contingency]];
    }else{
      fixed=Math.max(0,value('otherCostsBasic'))+(overrides.extraFixed||0);
      parts=[['Provize realitní kanceláře',commission],['Ostatní náklady',fixed]];
    }
    const sellingCosts=commission+fixed+contingency;
    const debt=Math.max(0,value('mortgageBalance'));
    const beforeDebt=sharePrice-sellingCosts;
    const net=beforeDebt-debt;
    return {salePrice,sharePrice,commissionRate,commission,fixed,contingency,sellingCosts,debt,beforeDebt,net,parts};
  }
  function renderScenario(title,badge,data,note,current=false){
    const article=document.createElement('article');article.className='scenario-card'+(current?' is-current':'');
    const tag=document.createElement('span');tag.textContent=badge;
    const h=document.createElement('h3');h.textContent=title;
    const strong=document.createElement('strong');strong.textContent=fmt(data.net);
    const p=document.createElement('p');p.textContent=`Náklady ${fmt(data.sellingCosts)} · dluh ${fmt(data.debt)}`;
    const small=document.createElement('small');small.textContent=note;
    article.append(tag,h,strong,p,small);return article;
  }
  function renderScenarios(base){
    const grid=$('scenarioGrid');grid.replaceChildren();
    const shockPct=state.mode==='advanced'?Math.max(0,value('priceShock')):3;
    const lowerPrice=model({salePrice:Math.max(0,value('salePrice')*(1-shockPct/100))});
    const lowerCommission=model({commissionRate:Math.max(0,value('commissionRate')-1)});
    const surprise=model({extraFixed:100000});
    grid.append(
      renderScenario('Váš základní plán','Aktuální',base,'Výchozí hodnoty bez dalších změn.',true),
      renderScenario(`Cena nižší o ${pct(shockPct,0)}`,'Cenový stres',lowerPrice,`Dopad proti základu ${fmtSigned(lowerPrice.net-base.net)}.`),
      renderScenario('Provize nižší o 1 p. b.','Vyjednání',lowerCommission,`Dopad proti základu ${fmtSigned(lowerCommission.net-base.net)}.`),
      renderScenario('Neočekávaný výdaj 100 000 Kč','Rezerva',surprise,`Dopad proti základu ${fmtSigned(surprise.net-base.net)}.`)
    );
  }
  function calculate(){
    if(!validate()) return;
    const m=model();
    const sharePct=m.sharePrice>0?Math.max(0,m.net)/m.sharePrice*100:0;
    const costPct=m.sharePrice>0?m.sellingCosts/m.sharePrice*100:0;
    const debtPct=m.sharePrice>0?m.debt/m.sharePrice*100:0;
    const netPct=Math.max(0,100-costPct-debtPct);
    const target=state.mode==='advanced'?Math.max(0,value('targetCash')):0;
    const gap=m.net-target;
    $('netProceeds').textContent=fmt(m.net);$('resultSentence').textContent=m.net>=0?`To odpovídá ${pct(sharePct)} vaší části prodejní ceny.`:`K pokrytí všech zadaných nákladů a dluhu chybí ${fmt(Math.abs(m.net))}.`;
    $('sellingCosts').textContent=fmt(m.sellingCosts);$('sellingCostsPct').textContent=`${pct(costPct)} z vaší části ceny`;$('debtResult').textContent=fmt(m.debt);$('beforeDebt').textContent=fmt(m.beforeDebt);
    if(state.mode==='advanced'&&target>0){$('targetGap').textContent=fmtSigned(gap);$('targetGapText').textContent=gap>=0?`Cíl ${fmt(target)} je pokryt`:`Do cíle ${fmt(target)} chybí ${fmt(Math.abs(gap))}`;}else{$('targetGap').textContent='Nezadáno';$('targetGapText').textContent='Cíl doplníte v pokročilém režimu';}
    $('heroNet').textContent=fmt(m.net);$('heroCosts').textContent=fmt(m.sellingCosts);$('heroDebt').textContent=fmt(m.debt);$('heroShare').textContent=pct(sharePct);$('heroStatus').textContent=`Modelová cena ${fmt(value('salePrice'))}`;
    $('heroNote').textContent=m.net<0?'Zadaná cena nepokrývá náklady a dluh. Ověřte cenu a vyčíslení banky.':`Prodejní náklady tvoří ${pct(costPct)} a doplacení dluhu ${pct(debtPct)} vaší části ceny.`;
    $('heroCostBar').style.width=`${Math.min(100,costPct)}%`;$('heroDebtBar').style.width=`${Math.min(100,Math.max(0,debtPct))}%`;$('heroNetBar').style.width=`${Math.min(100,Math.max(0,netPct))}%`;
    $('costFill').style.width=`${Math.min(100,costPct)}%`;$('debtFill').style.width=`${Math.min(100,Math.max(0,debtPct))}%`;$('netFill').style.width=`${Math.min(100,Math.max(0,netPct))}%`;$('compositionLabel').textContent=`${pct(sharePct)} zůstane`;$('costLegend').textContent=fmt(m.sellingCosts);$('debtLegend').textContent=fmt(m.debt);$('netLegend').textContent=fmt(m.net);
    const positiveParts=m.parts.filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const largest=positiveParts[0]||['Žádný zadaný náklad',0];$('largestCostTitle').textContent=largest[0];$('largestCostText').textContent=largest[1]>0?`${fmt(largest[1])}, tedy ${pct(m.sellingCosts>0?largest[1]/m.sellingCosts*100:0)} prodejních nákladů.`:'Do modelu zatím nebyla přidána žádná kladná nákladová položka.';
    const taxStatus=$('taxStatus').value;const taxReserve=Math.max(0,value('taxReserve')||0);const card=$('decisionCard');card.className='decision-card';let badge='Zdravý prostor',title='Výsledek má kladnou rezervu',text='Před podpisem nahraďte odhady konkrétní smluvní provizí, vyčíslením banky a ověřenými náklady.';
    if(m.net<0){card.classList.add('is-danger');badge='Deficit';title='Cena nepokrývá všechny zadané odtoky';text=`Podle modelu chybí ${fmt(Math.abs(m.net))}. Nejdřív ověřte prodejní cenu, vyčíslení banky a daňovou situaci.`;}
    else if(state.mode==='advanced'&&target>0&&gap<0){card.classList.add('is-warning');badge='Cíl není pokryt';title='Čistý výnos nestačí na zadaný další plán';text=`Do cíle chybí ${fmt(Math.abs(gap))}. Otestujte nižší cenu a nechte rezervu na překryv transakcí.`;}
    else if(state.mode==='advanced'&&taxStatus!=='exempt'&&taxReserve===0){card.classList.add('is-warning');badge='Neověřená daň';title='Čistý výnos může být nadhodnocený';text='Daňová situace není označena jako pravděpodobně osvobozená, ale daňová rezerva je nulová. Před použitím výsledku ji ověřte.';}
    else if(costPct>10){card.classList.add('is-warning');badge='Vysoké náklady';title='Transakční náklady ukrajují přes desetinu ceny';text='Zkontrolujte rozsah provize, duplicity služeb a rezervu. Úspora nesmí snížit právní bezpečnost transakce.';}
    else if(state.mode==='advanced'&&target>0&&gap>=0){badge='Cíl pokryt';title='Čistý výnos pokrývá zadaný další plán';text=`Po dosažení cíle zůstává pracovní rezerva ${fmt(gap)}. Stále otestujte nižší prodejní cenu a časový překryv.`;}
    $('decisionBadge').textContent=badge;$('decisionTitle').textContent=title;$('decisionText').textContent=text;$('resultBadge').textContent=state.mode==='basic'?'Rychlý odhad':'Detailní scénář';
    $('assumptionLabel').textContent=state.mode==='basic'?'Základní model':'Pokročilý model';$('assumptionText').textContent=state.mode==='basic'?`Cena ${fmt(value('salePrice'))} · provize ${pct(value('commissionRate'))} · ostatní náklady ${fmt(value('otherCostsBasic'))}`:`Podíl ${pct(value('ownershipShare'))} · daňová rezerva ${fmt(value('taxReserve'))} · stress −${pct(value('priceShock'),0)}`;
    renderScenarios(m);
  }
  function applyPreset(name){const p=presets[name]||presets.flat;Object.entries(p).forEach(([id,v])=>{if(id==='taxStatus')$('taxStatus').value=v;else setValue(id,v);});state.advancedInitialized=true;calculate();}
  async function copyResult(){const text=`Prodej nemovitosti: čistý výnos ${$('netProceeds').textContent}; prodejní náklady ${$('sellingCosts').textContent}; doplacení hypotéky ${$('debtResult').textContent}.`;try{await navigator.clipboard.writeText(text);$('copyResult').textContent='Zkopírováno';setTimeout(()=>$('copyResult').textContent='Kopírovat výsledek',1500)}catch{$('copyResult').textContent='Kopírování selhalo'}}
  function bind(){document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));ids.forEach(id=>$(id).addEventListener('input',calculate));$('taxStatus').addEventListener('change',calculate);$('saleForm').addEventListener('submit',e=>{e.preventDefault();calculate()});$('resetButton').addEventListener('click',()=>{state.advancedInitialized=true;applyPreset('flat')});$('copyResult').addEventListener('click',copyResult);}
  function init(){bind();applyPreset('flat');setMode('basic');}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
