(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const fmt=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  const money=n=>`${fmt.format(Math.round(Math.max(0,Number(n)||0)))} Kč`;
  const pct=(n,d=1)=>`${Math.max(0,Number(n)||0).toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d})} %`;
  const num=id=>Math.max(0,Number($(id)?.value)||0);
  const checked=id=>Boolean($(id)?.checked);

  function commission(price){
    const mode=$('commissionMode')?.value||'included';
    if(mode==='percent') return price*Math.min(20,num('commissionPercent'))/100;
    if(mode==='fixed') return num('commissionFixed');
    return 0;
  }
  function cadastre(){
    const count=Math.max(0,Math.round(num('filings')||1));
    const gross=count*2000;
    return checked('onlineFiling')?gross*.8:gross;
  }
  function calc(){
    const price=num('price');
    const realtor=commission(price);
    const legal=num('legal');
    const inspection=num('inspection');
    const bank=num('bank');
    const cadastral=cadastre();
    const renovation=num('renovation');
    const equipment=num('equipment');
    const moving=num('moving');
    const firstSetup=num('firstSetup');
    const reserve=num('reserve');
    const before=legal*.35+inspection+bank;
    const transfer=realtor+legal*.65+cadastral;
    const after=renovation+equipment+moving+firstSetup;
    const extras=realtor+legal+inspection+bank+cadastral+after;
    const spend=price+extras;
    const cashPlan=spend+reserve;
    const uplift=price?extras/price*100:0;
    return {price,realtor,legal,inspection,bank,cadastral,renovation,equipment,moving,firstSetup,reserve,before,transfer,after,extras,spend,cashPlan,uplift};
  }
  function render(){
    const r=calc();
    $('heroPrice').textContent=money(r.price);
    $('heroExtras').textContent=money(r.extras);
    $('heroSpend').textContent=money(r.spend);
    $('heroUplift').textContent=`+${pct(r.uplift)}`;
    $('resultSpend').textContent=money(r.spend);
    $('resultExtras').textContent=money(r.extras);
    $('resultUplift').textContent=`+${pct(r.uplift)}`;
    $('resultCashPlan').textContent=money(r.cashPlan);
    $('resultReserve').textContent=money(r.reserve);
    $('linePrice').textContent=money(r.price);
    $('lineRealtor').textContent=money(r.realtor);
    $('lineTransaction').textContent=money(r.legal+r.inspection+r.bank+r.cadastral);
    $('lineAfter').textContent=money(r.after);
    $('timelineBefore').textContent=money(r.before);
    $('timelineTransfer').textContent=money(r.transfer+Math.max(0,r.price));
    $('timelineAfter').textContent=money(r.after);
    const total=Math.max(1,r.spend);
    $('stackPrice').style.width=`${Math.min(100,r.price/total*100)}%`;
    $('stackTransaction').style.width=`${Math.min(100,(r.realtor+r.legal+r.inspection+r.bank+r.cadastral)/total*100)}%`;
    $('stackAfter').style.width=`${Math.min(100,r.after/total*100)}%`;
    $('commissionPercentWrap').hidden=$('commissionMode').value!=='percent';
    $('commissionFixedWrap').hidden=$('commissionMode').value!=='fixed';
    $('resultHeadline').textContent=r.extras>0?`Cena v inzerátu tvoří ${pct(r.price/r.spend*100,0)} skutečného výdaje.`:'Vedlejší náklady jsou zatím nulové.';
    $('resultText').textContent=r.extras>0?`Nad kupní cenu přidáváte ${money(r.extras)}. Rezervu ${money(r.reserve)} vedeme zvlášť, protože není nákladem – zůstává vaším majetkem.`:'Doplňte skutečné náklady, které nejsou součástí kupní ceny.';
    window.__rvPropertyTotal=r;
  }
  function reset(){
    $('price').value=5200000;$('commissionMode').value='percent';$('commissionPercent').value=3;$('commissionFixed').value=150000;
    $('legal').value=35000;$('inspection').value=12000;$('bank').value=0;$('filings').value=1;$('onlineFiling').checked=true;
    $('renovation').value=250000;$('equipment').value=120000;$('moving').value=20000;$('firstSetup').value=15000;$('reserve').value=250000;render();
  }
  function renderMatrix(){
    const root=$('benchmarkMatrix'); if(!root)return;
    const prices=[3000000,4500000,6000000,8000000,10000000], rates=[2,5,10,20,30];
    let html='<div class="pt-m-label">náklady navíc ↓ / cena →</div>'+prices.map(p=>`<div class="pt-m-label">${(p/1e6).toLocaleString('cs-CZ')} mil.</div>`).join('');
    for(const rate of rates){
      html+=`<div class="pt-m-label">+${rate} %</div>`;
      for(const p of prices){const extras=p*rate/100,total=p+extras;html+=`<div class="pt-m-cell"><b>${(total/1e6).toLocaleString('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2})} mil.</b><span>+${money(extras)}</span></div>`}
    }
    root.innerHTML=html;
  }
  $('totalForm')?.addEventListener('input',render);
  $('totalForm')?.addEventListener('change',render);
  $('totalForm')?.addEventListener('submit',e=>{e.preventDefault();render();$('vysledek')?.scrollIntoView({behavior:'smooth',block:'start'})});
  $('resetBtn')?.addEventListener('click',reset);
  const toggle=document.querySelector('.pt-menu-toggle'),nav=document.querySelector('.pt-main-nav');
  toggle?.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open))});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav?.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false')}});
  renderMatrix();render();
})();
