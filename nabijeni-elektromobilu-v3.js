(function(){
  'use strict';
  const $=id=>document.getElementById(id);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const money=(v,d=0)=>new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',minimumFractionDigits:d,maximumFractionDigits:d}).format(Number.isFinite(v)?v:0);
  const num=(v,d=1)=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:d}).format(Number.isFinite(v)?v:0);
  const presets={home:{price:6.5,loss:10,power:11,label:'Domácí wallbox'},ac:{price:10,loss:12,power:22,label:'Veřejné AC'},dc:{price:15,loss:15,power:100,label:'Rychlé DC'},trip:{price:16.5,loss:16,power:150,label:'Dálniční DC'}};
  function n(id,f=0){const e=$(id),v=Number(String(e?.value??'').replace(',','.'));return Number.isFinite(v)?v:f}
  function checked(id){return Boolean($(id)?.checked)}
  function text(id,v){const e=$(id);if(e)e.textContent=v}
  function width(id,v){const e=$(id);if(e)e.style.width=`${Math.max(0,Math.min(100,v))}%`}
  function values(){
    const capacity=Math.max(1,n('batteryCapacity',64)),start=Math.max(0,Math.min(99,n('startCharge',20))),target=Math.max(1,Math.min(100,n('targetCharge',80)));
    const loss=Math.max(0,Math.min(40,n('chargingLoss',10))),power=Math.max(.5,n('chargingPower',11)),price=Math.max(0,n('pricePerKwh',6.5));
    const consumption=Math.max(.1,n('consumptionPer100',17)),monthlyKm=Math.max(0,n('monthlyKm',1200)),sessions=Math.max(1,Math.round(n('sessionsPerMonth',6)));
    const includeFees=checked('includeSessionFees'),fixedFee=includeFees?Math.max(0,n('fixedFee')):0,timeFee=includeFees?Math.max(0,n('timeFee')):0;
    const includeMix=checked('includeMix'),homeShare=Math.max(0,n('homeShare',75)),acShare=Math.max(0,n('acShare',15)),dcShare=Math.max(0,n('dcShare',10));
    const homePrice=Math.max(0,n('homePrice',6.5)),acPrice=Math.max(0,n('acPrice',10)),dcPrice=Math.max(0,n('dcPrice',15)),subscription=includeMix?Math.max(0,n('subscription')):0;
    const reservePct=Math.max(0,Math.min(100,n('reservePct',10))),compareFuel=checked('compareFuel'),fuelConsumption=Math.max(.1,n('fuelConsumption',6.5)),fuelPrice=Math.max(0,n('fuelPrice',38.5));
    return{capacity,start,target,loss,power,price,consumption,monthlyKm,sessions,includeFees,fixedFee,timeFee,includeMix,homeShare,acShare,dcShare,homePrice,acPrice,dcPrice,subscription,reservePct,compareFuel,fuelConsumption,fuelPrice};
  }
  function calculate(v){
    const range=Math.max(0,v.target-v.start),batteryEnergy=v.capacity*range/100,efficiency=Math.max(.6,1-v.loss/100),gridEnergy=batteryEnergy/efficiency,lossEnergy=gridEnergy-batteryEnergy;
    const mixTotal=v.homeShare+v.acShare+v.dcShare,weightedPrice=v.includeMix&&mixTotal>0?(v.homeShare*v.homePrice+v.acShare*v.acPrice+v.dcShare*v.dcPrice)/mixTotal:v.price;
    const time=gridEnergy/v.power,sessionFees=v.fixedFee+v.timeFee*time,subscriptionPerSession=v.subscription/v.sessions,chargeCost=gridEnergy*weightedPrice+sessionFees+subscriptionPerSession;
    const gridConsumption=v.consumption/efficiency,monthlyGrid=v.monthlyKm/100*gridConsumption,monthlyFees=sessionFees*v.sessions+v.subscription,monthlyCost=monthlyGrid*weightedPrice+monthlyFees;
    const cost100=v.monthlyKm>0?monthlyCost/v.monthlyKm*100:gridConsumption*weightedPrice;const costKm=cost100/100,rangeAdded=v.consumption>0?batteryEnergy/v.consumption*100:0;
    const fullChargeGrid=v.capacity/efficiency,fullChargeFees=v.fixedFee+v.timeFee*(fullChargeGrid/v.power),fullChargeCost=fullChargeGrid*weightedPrice+fullChargeFees+subscriptionPerSession,reserve=chargeCost*v.reservePct/100;
    const feesPer100=v.monthlyKm>0?monthlyFees/v.monthlyKm*100:0,lowLoss=Math.max(0,v.loss-2)/100,low=v.consumption*.9/(1-lowLoss)*weightedPrice+feesPer100;
    const winterLoss=Math.min(.4,(v.loss+3)/100),winter=v.consumption*1.25/(1-winterLoss)*weightedPrice+feesPer100;
    const fuel100=v.fuelConsumption*v.fuelPrice,fuelDifference=fuel100-cost100;
    const shares=v.includeMix?{home:v.homeShare/mixTotal*100||0,ac:v.acShare/mixTotal*100||0,dc:v.dcShare/mixTotal*100||0}:{home:100,ac:0,dc:0};
    return{range,batteryEnergy,efficiency,gridEnergy,lossEnergy,weightedPrice,time,sessionFees,chargeCost,monthlyGrid,monthlyFees,monthlyCost,cost100,costKm,rangeAdded,fullChargeGrid,fullChargeCost,reserve,low,winter,fuel100,fuelDifference,shares,mixTotal};
  }
  function validate(v,r){const e=[];if(v.target<=v.start)e.push('Cílové nabití musí být vyšší než počáteční.');if(v.price<=0&&!v.includeMix)e.push('Zadejte kladnou cenu elektřiny.');if(v.includeMix&&Math.abs(r.mixTotal-100)>.1)e.push(`Podíly nabíjení musí dát 100 %. Nyní dávají ${num(r.mixTotal,0)} %.`);if(v.includeMix&&[v.homePrice,v.acPrice,v.dcPrice].some(x=>x<=0))e.push('Všechny použité ceny v mixu musí být kladné.');return e}
  function render(v,r){
    text('mainChargeCost',money(r.chargeCost));text('resultRange',`${num(v.start,0)}–${num(v.target,0)} %`);text('resultBatteryEnergy',`${num(r.batteryEnergy)} kWh`);text('resultGridEnergy',`${num(r.gridEnergy)} kWh`);text('resultLossEnergy',`${num(r.lossEnergy)} kWh`);text('resultCost100',money(r.cost100));text('resultCostKm',`${money(r.costKm,2)}/km`);text('resultMonthly',money(r.monthlyCost));text('resultTime',`${num(r.time,1)} h`);text('resultRangeAdded',`${num(r.rangeAdded,0)} km`);text('resultFullCharge',money(r.fullChargeCost));text('resultEffectivePrice',`${money(r.weightedPrice,2)}/kWh`);text('resultReserve',money(r.reserve));text('resultWithReserve',money(r.chargeCost+r.reserve));
    text('breakdownEnergy',money(r.gridEnergy*r.weightedPrice));text('breakdownFees',money(r.sessionFees+r.subscription/v.sessions));text('breakdownTotal',money(r.chargeCost));text('breakdownBattery',`${num(r.batteryEnergy)} kWh`);text('breakdownGrid',`${num(r.gridEnergy)} kWh`);text('breakdownEfficiency',`${num(r.efficiency*100,0)} %`);
    text('scenarioEco',money(r.low));text('scenarioBase',money(r.cost100));text('scenarioWinter',money(r.winter));text('scenarioSpread',money(Math.max(0,r.winter-r.cost100)));
    text('fuelCost100',money(r.fuel100));text('fuelDifference',`${r.fuelDifference>=0?'Elektro je v modelu levnější o ':'Elektro je v modelu dražší o '}${money(Math.abs(r.fuelDifference))} / 100 km`);const fuel=$('fuelBenchmark');if(fuel)fuel.hidden=!v.compareFuel;
    text('modeBadge',v.includeMix||v.includeFees?'PRO · úplný tarif':'BASIC · jedna cena');text('readingTitle',v.includeMix?'Výsledek používá váš skutečný mix nabíjení.':'Jedno nabití je rychlé číslo, cena za 100 km lepší srovnání.');text('readingText',v.includeMix?`Domácí, AC a DC podíl dávají dohromady ${num(r.mixTotal,0)} %. Předplatné a poplatky jsou rozpočítané podle relací.`:'Pokud střídáte domácí a veřejné nabíjení, otevřete PRO a vytvořte váženou průměrnou cenu.');
    text('heroChargeCost',money(r.chargeCost));text('heroCost100',money(r.cost100));text('heroGridEnergy',`${num(r.gridEnergy)} kWh`);text('heroTime',`${num(r.time,1)} h`);text('heroBatteryLabel',`${num(v.start,0)} → ${num(v.target,0)} %`);width('heroBatteryFill',v.target);width('heroLossBar',v.loss);width('heroHomeBar',r.shares.home);width('heroAcBar',r.shares.ac);width('heroDcBar',r.shares.dc);
    text('mixHomeShare',`${num(r.shares.home,0)} %`);text('mixAcShare',`${num(r.shares.ac,0)} %`);text('mixDcShare',`${num(r.shares.dc,0)} %`);
  }
  function update(){const v=values(),r=calculate(v),errors=validate(v,r),box=$('formError');if(box){box.hidden=!errors.length;box.textContent=errors.join(' ')}if(!errors.length)render(v,r)}
  function toggles(){if($('sessionFeeFields'))$('sessionFeeFields').hidden=!checked('includeSessionFees');if($('mixFields'))$('mixFields').hidden=!checked('includeMix');if($('fuelFields'))$('fuelFields').hidden=!checked('compareFuel')}
  function pressed(selector,active,key){$$(selector).forEach(b=>{const on=b.dataset[key]===active;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))})}
  function preset(name){const p=presets[name]||presets.home;$('pricePerKwh').value=p.price;$('chargingLoss').value=p.loss;$('chargingPower').value=p.power;text('chargingContext',p.label);pressed('[data-preset]',name,'preset');update()}
  function tab(name){const tabs=$$('[data-pro-tab]'),panels=$$('[data-pro-panel]'),i=Math.max(0,tabs.findIndex(x=>x.dataset.proTab===name));tabs.forEach((x,n)=>{const a=n===i;x.classList.toggle('is-active',a);x.setAttribute('aria-selected',String(a));x.tabIndex=a?0:-1});panels.forEach(x=>x.hidden=x.dataset.proPanel!==tabs[i].dataset.proTab);text('proStep',`${i+1} / ${tabs.length}`);$('proPrev').disabled=i===0;$('proNext').textContent=i===tabs.length-1?'Hotovo':'Další krok'}
  function move(d){const tabs=$$('[data-pro-tab]'),i=Math.max(0,tabs.findIndex(x=>x.classList.contains('is-active'))),to=Math.max(0,Math.min(tabs.length-1,i+d));if(d>0&&i===tabs.length-1){$('proSettings').open=false;$('vysledek').scrollIntoView({behavior:'smooth',block:'start'});return}tab(tabs[to].dataset.proTab)}
  const form=$('chargingForm');if(!form)return;
  form.addEventListener('submit',e=>{e.preventDefault();update();$('vysledek').scrollIntoView({behavior:'smooth',block:'start'})});form.addEventListener('input',e=>{if(e.target.matches('input,select')){toggles();update()}});form.addEventListener('change',e=>{if(e.target.matches('input,select')){toggles();update()}});
  $$('[data-preset]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.preset)));$$('[data-pro-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.proTab)));$('proPrev').addEventListener('click',()=>move(-1));$('proNext').addEventListener('click',()=>move(1));
  $('resetBtn').addEventListener('click',()=>{form.reset();$('includeSessionFees').checked=false;$('includeMix').checked=false;$('compareFuel').checked=false;toggles();tab('session');preset('home');$('proSettings').open=false});toggles();tab('session');preset('home');
})();
