(()=>{
  const $=s=>document.querySelector(s);
  const fmt0=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
  const fmt1=n=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number.isFinite(n)?n:0);
  const val=id=>Math.max(0,Number(String($(id)?.value??'').replace(',','.'))||0);
  const state={};
  const els={
    target:$('#targetAmount'),costs:$('#businessCosts'),reserve:$('#taxReserve'),hours:$('#billableHours'),buffer:$('#bufferPercent'),actual:$('#actualRate'),
    days:$('#workDays'),perDay:$('#billablePerDay'),util:$('#utilization'),helperOut:$('#helperHours'),
    rate:$('#hourlyRate'),monthly:$('#monthlyTarget'),forYou:$('#forYouResult'),costsOut:$('#costsResult'),reserveOut:$('#reserveResult'),bufferOut:$('#bufferResult'),meaning:$('#meaningText'),actualResult:$('#actualResult'),
    heroRate:$('#heroRate'),heroMath:$('#heroMath'),heroHours:$('#heroHours')
  };
  function calc(){
    const target=val('#targetAmount'), costs=val('#businessCosts'), reserve=val('#taxReserve'), hours=val('#billableHours'), buffer=val('#bufferPercent');
    const baseMonthly=target+costs+reserve;
    const baseRate=hours>0?baseMonthly/hours:0;
    const finalRate=baseRate*(1+buffer/100);
    const bufferMonthly=hours>0?(finalRate-baseRate)*hours:0;
    els.rate.value=`${fmt0(finalRate)} Kč/h`;
    els.monthly.textContent=`${fmt0(baseMonthly)} Kč/měs.`;
    els.forYou.textContent=`${fmt0(target)} Kč`;
    els.costsOut.textContent=`${fmt0(costs)} Kč`;
    els.reserveOut.textContent=`${fmt0(reserve)} Kč`;
    els.bufferOut.textContent=buffer>0?`${fmt0(bufferMonthly)} Kč`:'0 Kč';
    els.heroRate.textContent=`${fmt0(finalRate)} Kč/h`;
    els.heroMath.textContent=`${fmt0(baseMonthly)} Kč ÷ ${fmt0(hours)} h`;
    els.heroHours.textContent=`${fmt0(hours)} h / měsíc`;
    if(hours<=0){els.meaning.textContent='Zadejte počet fakturovatelných hodin za měsíc.'}
    else if(buffer>0){els.meaning.textContent=`Sazba ${fmt0(finalRate)} Kč/h pokrývá vaše zadané měsíční cíle a přidává ${fmt1(buffer)}% vlastní rezervu.`}
    else{els.meaning.textContent=`Sazba ${fmt0(finalRate)} Kč/h je matematické minimum podle vašich vstupů. Neobsahuje žádnou automatickou bezpečnostní přirážku.`}
    updateSensitivity(baseMonthly,buffer,hours);
    updateActual(finalRate,hours,costs,reserve,target);
  }
  function updateActual(minRate,hours,costs,reserve,target){
    const a=val('#actualRate');
    if(!a||!hours){els.actualResult.innerHTML='Zadejte svou současnou nebo plánovanou sazbu a uvidíte rozdíl.';return}
    const monthly=a*hours;
    const afterFixed=monthly-costs-reserve;
    const diff=a-minRate;
    let verdict='odpovídá matematickému minimu';
    if(diff>1) verdict=`je o <strong>${fmt0(diff)} Kč/h výš</strong> než vypočtené minimum`;
    if(diff<-1) verdict=`je o <strong>${fmt0(Math.abs(diff))} Kč/h níž</strong> než vypočtené minimum`;
    els.actualResult.innerHTML=`Při ${fmt0(hours)} fakturovaných hodinách přinese ${fmt0(a)} Kč/h tržbu <strong>${fmt0(monthly)} Kč</strong>. Po zadaných nákladech a rezervě zbývá ${fmt0(afterFixed)} Kč; sazba ${verdict}.`;
  }
  function updateSensitivity(monthly,buffer,current){
    const rows=[80,100,120,140];
    const max=rows.reduce((m,h)=>Math.max(m,monthly/h*(1+buffer/100)),1);
    rows.forEach(h=>{
      const row=document.querySelector(`[data-hours="${h}"]`); if(!row)return;
      const rate=monthly/h*(1+buffer/100);
      row.querySelector('strong').textContent=`${fmt0(rate)} Kč/h`;
      row.querySelector('i').style.width=`${Math.max(8,rate/max*100)}%`;
      row.classList.toggle('is-current',Math.abs(current-h)<1);
    });
  }
  function helper(){
    const days=val('#workDays'), perDay=val('#billablePerDay'), util=Math.min(100,val('#utilization'));
    const h=days*perDay*(util/100);
    els.helperOut.textContent=`${fmt1(h)} h / měsíc`;
  }
  $('#useHelper')?.addEventListener('click',()=>{helper(); const h=val('#workDays')*val('#billablePerDay')*(Math.min(100,val('#utilization'))/100); if(h>0){els.hours.value=h.toFixed(1);calc();}});
  ['#workDays','#billablePerDay','#utilization'].forEach(id=>$(id)?.addEventListener('input',helper));
  ['#targetAmount','#businessCosts','#taxReserve','#billableHours','#bufferPercent','#actualRate'].forEach(id=>$(id)?.addEventListener('input',calc));
  $('#freelancerForm')?.addEventListener('submit',e=>{e.preventDefault();calc()});
  $('#resetButton')?.addEventListener('click',()=>{els.target.value=60000;els.costs.value=15000;els.reserve.value=0;els.hours.value=100;els.buffer.value=0;els.actual.value=900;els.days.value=20;els.perDay.value=6;els.util.value=83.3;helper();calc();});
  const menu=$('.menu-toggle'), nav=$('.main-nav');
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('is-open',!open)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){menu.setAttribute('aria-expanded','false');nav?.classList.remove('is-open');menu.focus()}});
  helper();calc();
})();
