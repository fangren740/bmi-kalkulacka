(function(){
  'use strict';
  var form=document.getElementById('evChargeForm');
  if(!form)return;
  var mode='basic';
  var lastResult=null;
  var profiles={
    socket:{label:'Domácí zásuvka 2,3 kW',power:2.3,vehicle:2.3,loss:15,utilization:90,price:6.5},
    wallbox:{label:'Domácí wallbox 11 kW',power:11,vehicle:11,loss:10,utilization:95,price:6.5},
    ac22:{label:'Veřejné AC 22 kW',power:22,vehicle:11,loss:10,utilization:92,price:10},
    dc50:{label:'Rychlé DC 50 kW',power:50,vehicle:50,loss:8,utilization:78,price:13},
    dc150:{label:'Rychlé DC 150 kW',power:150,vehicle:150,loss:8,utilization:68,price:15}
  };
  var nf1=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1});
  var nf0=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  var errorBox=document.getElementById('formError');
  var warning=document.getElementById('safetyWarning');
  var advanced=document.getElementById('advancedFields');
  var compareFields=document.getElementById('compareFields');
  var compareToggle=document.getElementById('compareToggle');
  function el(id){return document.getElementById(id);}
  function number(id){return Number(String(el(id).value).replace(',','.'));}
  function selected(name){var node=form.querySelector('input[name="'+name+'"]:checked');return node?node.value:'';}
  function format1(value){return nf1.format(Math.round(value*10)/10);}
  function format0(value){return nf0.format(Math.round(value));}
  function duration(hours){
    if(!Number.isFinite(hours)||hours<0)return '—';
    var minutes=Math.round(hours*60);var h=Math.floor(minutes/60);var m=minutes%60;
    if(h===0)return m+' min';
    if(m===0)return h+' h';
    return h+' h '+m+' min';
  }
  function clearError(){errorBox.hidden=true;errorBox.textContent='';}
  function showError(message){errorBox.textContent=message;errorBox.hidden=false;errorBox.scrollIntoView({behavior:'smooth',block:'center'});}
  function validate(data){
    if(!Number.isFinite(data.capacity)||data.capacity<5||data.capacity>250)return 'Zadejte využitelnou kapacitu baterie od 5 do 250 kWh.';
    if(!Number.isFinite(data.start)||data.start<0||data.start>99)return 'Počáteční stav baterie musí být od 0 do 99 %.';
    if(!Number.isFinite(data.target)||data.target<1||data.target>100)return 'Cílový stav baterie musí být od 1 do 100 %.';
    if(data.target<=data.start)return 'Cílový stav musí být vyšší než počáteční stav baterie.';
    if(!Number.isFinite(data.power)||data.power<1||data.power>400)return 'Zadejte výkon nabíjecího bodu od 1 do 400 kW.';
    if(!Number.isFinite(data.vehicle)||data.vehicle<1||data.vehicle>400)return 'Zadejte maximální výkon přijímaný autem od 1 do 400 kW.';
    if(!Number.isFinite(data.loss)||data.loss<0||data.loss>30)return 'Ztráty nabíjení nastavte od 0 do 30 %.';
    if(!Number.isFinite(data.utilization)||data.utilization<35||data.utilization>100)return 'Průměrné využití limitu nastavte od 35 do 100 %.';
    if(!Number.isFinite(data.price)||data.price<0||data.price>60)return 'Zadejte cenu elektřiny od 0 do 60 Kč/kWh.';
    if(!Number.isFinite(data.fee)||data.fee<0||data.fee>5000)return 'Jednorázový poplatek musí být od 0 do 5 000 Kč.';
    if(!Number.isFinite(data.consumption)||data.consumption<5||data.consumption>60)return 'Spotřebu auta nastavte od 5 do 60 kWh/100 km.';
    return '';
  }
  function read(prefix){
    return {
      capacity:number('capacity'),start:number('startSoc'),target:number('targetSoc'),
      power:number(prefix+'Power'),vehicle:number(prefix+'VehicleLimit'),loss:number(prefix+'Loss'),
      utilization:number(prefix+'Utilization'),price:number(prefix+'Price'),fee:number(prefix+'Fee'),
      consumption:number('consumption')
    };
  }
  function compute(data){
    var delta=data.target-data.start;
    var stored=data.capacity*delta/100;
    var grid=stored/(1-data.loss/100);
    var limit=Math.min(data.power,data.vehicle);
    var effective=limit*data.utilization/100;
    var ideal=stored/limit;
    var planning=grid/effective;
    var cost=grid*data.price+data.fee;
    var cost100=(data.consumption/(1-data.loss/100))*data.price;
    return {delta:delta,stored:stored,grid:grid,limit:limit,effective:effective,ideal:ideal,planning:planning,cost:cost,cost100:cost100,bottleneck:data.power<data.vehicle?'nabíjecí bod':data.vehicle<data.power?'limit auta':'stejný limit auta i bodu'};
  }
  function profileName(){var key=selected('chargeProfile');return profiles[key]?profiles[key].label:'Vlastní scénář';}
  function applyProfile(key){
    var p=profiles[key];if(!p)return;
    el('mainPower').value=p.power;el('mainVehicleLimit').value=p.vehicle;el('mainLoss').value=p.loss;el('mainUtilization').value=p.utilization;el('mainPrice').value=p.price;
    el('mainFee').value=0;
  }
  function setMode(next){
    mode=next;
    document.querySelectorAll('[data-mode]').forEach(function(button){var active=button.dataset.mode===mode;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    advanced.hidden=mode!=='advanced';
    if(mode==='basic'){compareToggle.checked=false;compareFields.hidden=true;}
    calculate(false);
  }
  function renderComparison(main){
    var card=el('comparisonCard');
    if(mode!=='advanced'||!compareToggle.checked){card.hidden=true;return null;}
    var data=read('compare');var invalid=validate(data);
    if(invalid){card.hidden=true;return {error:'Ve srovnávacím scénáři: '+invalid};}
    var result=compute(data);card.hidden=false;
    el('compareTime').textContent=duration(result.planning);
    el('compareCost').textContent=format0(result.cost)+' Kč';
    el('compareEnergy').textContent=format1(result.grid)+' kWh ze sítě';
    var timeDiff=result.planning-main.planning;var costDiff=result.cost-main.cost;
    var timeText=Math.abs(timeDiff)<1/120?'časově téměř stejný':timeDiff>0?'o '+duration(timeDiff)+' pomalejší':'o '+duration(Math.abs(timeDiff))+' rychlejší';
    var costText=Math.abs(costDiff)<.5?'cenově stejný':costDiff>0?'o '+format0(costDiff)+' Kč dražší':'o '+format0(Math.abs(costDiff))+' Kč levnější';
    el('compareSummary').textContent='Druhý scénář je '+timeText+' a '+costText+'.';
    return {data:data,result:result};
  }
  function calculate(announce){
    clearError();
    var data=read('main');var invalid=validate(data);
    if(invalid){if(announce)showError(invalid);return;}
    var result=compute(data);
    el('mainTime').textContent=duration(result.planning);
    el('idealTime').textContent=duration(result.ideal);
    el('storedEnergy').textContent=format1(result.stored);
    el('gridEnergy').textContent=format1(result.grid);
    el('sessionCost').textContent=format0(result.cost);
    el('costPer100').textContent=format0(result.cost100);
    el('powerLimit').textContent=format1(result.limit)+' kW';
    el('effectivePower').textContent=format1(result.effective)+' kW';
    el('resultStatus').textContent=data.power>=50?'DC nabíjení':data.power>3.7?'AC nabíjení':'Pomalé AC';
    el('mainLabel').textContent=profileName();
    el('socText').textContent=format0(data.start)+' → '+format0(data.target)+' %';
    el('chargeRange').textContent=format0(data.target-data.start)+' procentních bodů';
    var marker=Math.max(5,Math.min(95,(data.target-data.start)));
    el('chargeMarker').style.width=marker+'%';
    el('bottleneckText').textContent='Výkon omezuje '+result.bottleneck+' na '+format1(result.limit)+' kW. Model pro plánování používá průměrně '+format0(data.utilization)+' % tohoto limitu.';
    el('resultInsight').textContent='Pro doplnění '+format1(result.stored)+' kWh do baterie model očekává odběr přibližně '+format1(result.grid)+' kWh ze sítě. Praktický čas je plánovací odhad, nikoli slib nabíjecí křivky konkrétního auta.';
    warning.hidden=true;warning.textContent='';
    if(data.power>=50&&data.target>80){warning.hidden=false;warning.textContent='Nad přibližně 80 % se rychlé DC nabíjení u mnoha aut výrazně zpomaluje. Skutečný závěr relace může trvat déle, než ukazuje průměrný model. Pro přesnější plán použijte naměřenou průměrnou hodnotu využití výkonu.';}
    else if(data.vehicle<data.power){warning.hidden=false;warning.textContent='Nabíjecí bod nabízí '+format1(data.power)+' kW, ale auto podle vstupu přijme nejvýše '+format1(data.vehicle)+' kW. Vyšší číslo na stojanu proto v tomto scénáři čas nezkrátí.';}
    else if(data.loss>=18){warning.hidden=false;warning.textContent='Zadané ztráty jsou vysoké. Může jít o pomalé nabíjení, nízkou teplotu, ohřev nebo klimatizaci během relace. Ověřte, zda používáte energii odebranou ze sítě, ne pouze energii uloženou v baterii.';}
    var comparison=renderComparison(result);
    if(comparison&&comparison.error&&announce){showError(comparison.error);return;}
    lastResult={data:data,result:result,name:profileName(),comparison:comparison};
  }
  document.querySelectorAll('[data-mode]').forEach(function(button){button.addEventListener('click',function(){setMode(button.dataset.mode);});});
  document.querySelectorAll('input[name="chargeProfile"]').forEach(function(input){input.addEventListener('change',function(){applyProfile(input.value);calculate(false);});});
  compareToggle.addEventListener('change',function(){compareFields.hidden=!compareToggle.checked;calculate(false);});
  form.addEventListener('input',function(event){if(event.target.matches('input,select'))calculate(false);});
  form.addEventListener('change',function(){calculate(false);});
  form.addEventListener('submit',function(event){event.preventDefault();calculate(true);if(errorBox.hidden)el('vysledek').scrollIntoView({behavior:'smooth',block:'start'});});
  el('resetForm').addEventListener('click',function(){form.reset();applyProfile('wallbox');setMode('basic');calculate(false);});
  el('copyResult').addEventListener('click',function(){
    if(!lastResult)return;
    var r=lastResult.result,d=lastResult.data;
    var text='Nabíjení elektromobilu – orientační výsledek\nScénář: '+lastResult.name+'\nBaterie: '+format0(d.start)+' → '+format0(d.target)+' %\nEnergie do baterie: '+format1(r.stored)+' kWh\nOdběr ze sítě: '+format1(r.grid)+' kWh\nPlánovací čas: '+duration(r.planning)+'\nCena relace: '+format0(r.cost)+' Kč\nLimit výkonu: '+format1(r.limit)+' kW\nVýsledek je orientační; skutečný čas závisí na nabíjecí křivce, teplotě a sdílení výkonu.';
    var button=this;
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(function(){button.textContent='Zkopírováno';setTimeout(function(){button.textContent='Zkopírovat stručný přehled';},1800);});
    else{var area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();button.textContent='Zkopírováno';setTimeout(function(){button.textContent='Zkopírovat stručný přehled';},1800);}
  });
  applyProfile('wallbox');calculate(false);
})();
