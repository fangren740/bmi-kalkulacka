(()=>{
  const root=document.documentElement;
  let t1=0,t2=0;
  const pulse=()=>{clearTimeout(t1);clearTimeout(t2);root.dataset.rvState='working';t1=setTimeout(()=>root.dataset.rvState='ready',180);t2=setTimeout(()=>root.dataset.rvState='idle',720)};
  document.addEventListener('input',pulse,{passive:true});document.addEventListener('change',pulse,{passive:true});document.addEventListener('click',e=>{if(e.target.closest('button,[role="tab"],.mode-button,.calc-tab,.category-filter,.group-toggle'))pulse()},{passive:true});root.dataset.rvState='idle';
  const num=v=>{const n=parseFloat(String(v||'').replace(/\s/g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};
  const pct=n=>`${Math.round(n)} %`;
  const use=(name)=>`<svg aria-hidden="true" class="rv-status-icon" focusable="false" viewBox="0 0 24 24"><use href="/rv-status-icons-v32.svg?v=1#rv-status-${name}"></use></svg>`;
  function observe(ids,fn){const nodes=ids.map(id=>document.getElementById(id)).filter(Boolean);if(!nodes.length)return;const mo=new MutationObserver(fn);nodes.forEach(n=>mo.observe(n,{childList:true,characterData:true,subtree:true}));document.addEventListener('input',fn,{passive:true});document.addEventListener('change',fn,{passive:true});fn()}

  // Finance: visualise the numbers already produced by the page without changing its business logic.
  const financeStatus=document.getElementById('rv-finance-status');
  if(financeStatus){
    const update=()=>{
      const price=num(document.getElementById('property-price')?.value), own=Math.max(0,num(document.getElementById('own-funds')?.value));
      const ownPct=price>0?Math.min(100,own/price*100):0, loanPct=Math.max(0,100-ownPct);
      const ownBar=document.getElementById('rv-own-share'),loanBar=document.getElementById('rv-loan-share');
      if(ownBar){ownBar.style.width=`${ownPct}%`;loanBar.style.width=`${loanPct}%`}
      const ownLabel=document.getElementById('rv-own-label'),loanLabel=document.getElementById('rv-loan-label');if(ownLabel){ownLabel.textContent=pct(ownPct);loanLabel.textContent=pct(loanPct)}
      const dsti=num(document.getElementById('dsti-value')?.textContent), meter=document.getElementById('rv-dsti-meter'),dstiLabel=document.getElementById('rv-dsti-label');
      if(meter)meter.style.width=`${Math.min(100,Math.max(0,dsti/70*100))}%`;if(dstiLabel)dstiLabel.textContent=`${dsti.toFixed(1).replace('.',',')} %`;
      const source=(document.getElementById('profile-status')?.textContent||'').toLowerCase();let kind='info',icon='info',label='Orientační profil',advice='Porovnejte splátku s kompletním rozpočtem domácnosti a vytvořte si rezervu pro změnu sazby.';
      if(source.includes('siln')){kind='success';icon='check';label='Silný výchozí profil';advice='Profil vypadá příznivě. Otestujte ještě vyšší sazbu, vedlejší náklady koupě a rezervu po nastěhování.'}
      else if(source.includes('napjat')||source.includes('hran')){kind='warning';icon='warning';label='Napjatý profil';advice='Výsledek je citlivý na výdaje a sazbu. Snižte úvěr, zvyšte vlastní zdroje nebo vytvořte větší měsíční rezervu.'}
      else if(source.includes('rizik')||dsti>=50){kind='risk';icon='risk';label='Rizikový profil';advice='Taková zátěž může být obtížně udržitelná. Nejdřív upravte cenu nemovitosti, úvěr nebo rozpočet domácnosti.'}
      financeStatus.className=`rv-status rv-status--${kind}`;financeStatus.innerHTML=use(icon)+label;const a=document.getElementById('rv-finance-advice');if(a)a.textContent=advice;
    };
    observe(['monthly-payment','profile-status','loan-amount','ltv-value','dsti-value'],update);
  }

  // Concrete: mirror existing outputs into a clear order summary.
  if(document.getElementById('rv-order-total')){
    const update=()=>{
      const pairs=[['netVolumeLegend','rv-order-net'],['reserveVolumeLegend','rv-order-reserve'],['resultVolume','rv-order-total']];pairs.forEach(([a,b])=>{const x=document.getElementById(a),y=document.getElementById(b);if(x&&y)y.textContent=x.textContent.trim()});
      const reserve=num(document.getElementById('reservePercentMetric')?.textContent);const advice=document.getElementById('rv-order-advice');if(advice){advice.textContent=reserve>=15?'Vyšší rezerva výrazně mění objednávku. Ověřte, zda odpovídá členitosti konstrukce, ztrátám a podmínkám ukládání.':'Ověřte minimální odběr, dopravu, přístup domíchávače a způsob ukládání betonu.'}
    };observe(['netVolumeLegend','reserveVolumeLegend','resultVolume','reservePercentMetric'],update);
  }

  // Catalog: actionable and specific empty state.
  const empty=document.getElementById('empty-state');
  if(empty){
    const input=document.getElementById('catalog-search'),query=document.getElementById('rv-empty-query');
    const sync=()=>{if(query)query.textContent=input?.value.trim()?`„${input.value.trim()}“`:'vybraná oblast'};
    input?.addEventListener('input',sync,{passive:true});sync();
    document.getElementById('rv-empty-clear')?.addEventListener('click',()=>document.getElementById('search-clear')?.click());
    document.getElementById('rv-empty-all')?.addEventListener('click',()=>{document.getElementById('reset-filter')?.click();document.querySelector('.category-filter[data-category="all"]')?.click()});
  }
})();