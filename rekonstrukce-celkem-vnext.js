(()=>{
  const $=id=>document.getElementById(id), q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const money=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(n))+' Kč';
  const moneyM=n=>{if(n>=1e6)return new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/1e6)+' mil. Kč';return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(n/1000))+' tis. Kč'};
  const num=v=>Math.max(0,Number(String(v??'').replace(/\s/g,'').replace(',','.'))||0);
  const state={property:'flat',scope:'complete'};
  const refs={
    flat:{cosmetic:{low:2000,high:5000,label:'Lehčí obnova bytu',source:'Síť práce · veřejná orientace ČR 2026',note:'Malby, podlahy, osvětlení a drobné opravy.'},middle:{low:6000,high:12000,label:'Střední rekonstrukce bytu',source:'Síť práce · veřejná orientace ČR 2026',note:'Koupelna nebo kuchyň, podlahy a další běžné zásahy.'},complete:{low:12000,high:25000,label:'Kompletní rekonstrukce bytu',source:'Síť práce · veřejná orientace ČR 2026',note:'Kompletní zásah včetně rozvodů; skutečný rozsah vždy ověřte v nabídce.'}},
    house:{interior:{low:14000,high:22000,label:'Dům – interiér a rozvody',source:'StavDAM · Praha a okolí 2026',note:'Veřejná regionální reference bez nové fasády a střechy.'},full:{low:15000,high:30833,label:'Starší dům – široká kompletní renovace',source:'Pan Stavitel · model 120 m² / 1,8–3,7 mil. Kč',note:'Transparentní přepočet z veřejného 120m² modelu včetně střechy, oken, fasády a technologií.'}}
  };
  function getScope(){return q('input[name="renoScope"]:checked')?.value||'complete'}
  function nearestRenoviu(area,building){
    const data={panel:[[32,416000,576000],[55,715000,990000],[75,975000,1350000],[95,1235000,1710000]],brick:[[32,480000,704000],[55,825000,1210000],[75,1125000,1650000],[95,1425000,2090000]]};
    const arr=data[building]||data.panel; return arr.reduce((best,row)=>Math.abs(row[0]-area)<Math.abs(best[0]-area)?row:best,arr[0]);
  }
  function updateScopes(){
    const flat=$('flatScopes'),house=$('houseScopes');
    if(state.property==='flat'){flat.hidden=false;house.hidden=true;if(!['cosmetic','middle','complete'].includes(getScope()))q('input[value="complete"]').checked=true}
    else{flat.hidden=true;house.hidden=false;if(!['interior','full'].includes(getScope()))q('input[value="interior"]').checked=true}
  }
  function calcQuick(){
    state.scope=getScope(); const area=Math.max(1,num($('renoArea').value)); const ref=refs[state.property][state.scope];
    const low=area*ref.low,high=area*ref.high;
    $('quickRange').textContent=moneyM(low)+' – '+moneyM(high);
    $('resultLabel').textContent=ref.label+' · '+new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(area)+' m²';
    $('resultMeaning').textContent=state.property==='flat'?'Tohle je rychlý rámec z veřejného pásma. Neříká, že každá položka projektu je v ceně — proto níže můžete nahradit odhad vlastními nabídkami.':'U domu je rozsah ještě důležitější než plocha. Výsledek drží přesně popsanou veřejnou referenci a automaticky nepřidává vlastní koeficienty.';
    $('rateRange').textContent=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(ref.low)+'–'+new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(ref.high)+' Kč/m²';
    $('sourceName').textContent=ref.source;$('sourceNote').textContent=ref.note;
    const b=$('buildingRow'); b.hidden=!(state.property==='flat'&&state.scope==='complete');
    const control=$('controlRef');
    if(state.property==='flat'&&state.scope==='complete'){
      const building=$('flatBuilding').value; const r=nearestRenoviu(area,building);
      control.hidden=false;$('controlRefText').textContent=`Nejbližší veřejná RENOVIU reference: ${r[0]} m² · ${building==='panel'?'panel':'cihlový byt'} · ${moneyM(r[1])}–${moneyM(r[2])}.`;
    }else control.hidden=true;
    const warn=$('rangeWarning');
    warn.textContent=state.property==='house'&&state.scope==='full'&&Math.abs(area-120)>40?'Pozor: široká renovace domu je odvozena z veřejného 120m² modelu. U výrazně jiné plochy berte přepočet jen jako hrubý rámec a přejděte na vlastní položky.':'Veřejná pásma mají různý region a rozsah. Výsledek je orientace, ne závazná nabídka.';
    updateScopeXray(); compareOwn(low,high);
  }
  function budgetRows(){return qa('[data-budget]')}
  function calcOwn(){
    const subtotal=budgetRows().reduce((s,i)=>s+num(i.value),0); const reserve=num($('ownReserve').value); const total=subtotal*(1+reserve/100);
    $('ownSubtotal').textContent=money(subtotal);$('ownTotal').textContent=money(total);
    const quick=refs[state.property][getScope()]; const area=Math.max(1,num($('renoArea').value)); compareOwn(area*quick.low,area*quick.high,total);
    updateBudgetXray();
  }
  function compareOwn(low,high,total){
    if(total===undefined){const subtotal=budgetRows().reduce((s,i)=>s+num(i.value),0);total=subtotal*(1+num($('ownReserve').value)/100)}
    const el=$('ownCompare'); if(!total){el.textContent='Zatím nejsou zadané vlastní částky.';return}
    if(total<low)el.textContent='Váš vlastní součet je pod rychlým veřejným pásmem. Zkontrolujte, zda v něm nechybí některá velká část.';
    else if(total>high)el.textContent='Váš vlastní součet je nad rychlým veřejným pásmem. To může být v pořádku — vlastní nabídky a skutečný rozsah mají přednost.';
    else el.textContent='Váš vlastní součet leží uvnitř rychlého veřejného pásma.';
  }
  function updateBudgetXray(){
    const groups={demolition:['demolition'],systems:['electro','water','heating'],wet:['bathroom','kitchen'],surfaces:['floors','walls'],finish:['doors','windows','roof','facade','other']};
    Object.entries(groups).forEach(([key,ids])=>{const sum=ids.reduce((s,id)=>s+num($(id)?.value),0);const layer=$('layer-'+key);if(layer){layer.classList.toggle('is-active',sum>0);layer.querySelector('span').textContent=sum?moneyM(sum):'bez vlastní ceny'}})
  }
  function updateScopeXray(){
    qa('.reno-scope-layer').forEach(x=>x.classList.remove('is-active'));
    const map=state.property==='flat'?(state.scope==='cosmetic'?['surfaces','finish']:state.scope==='middle'?['wet','surfaces','finish']:['demolition','systems','wet','surfaces','finish']):(state.scope==='interior'?['demolition','systems','wet','surfaces','finish']:['demolition','systems','wet','surfaces','finish']);
    map.forEach(k=>$('layer-'+k)?.classList.add('is-active'));
  }
  function propertyChange(){state.property=q('input[name="propertyType"]:checked')?.value||'flat';updateScopes();$('houseOnlyRows').hidden=state.property!=='house';calcQuick();calcOwn()}
  qa('input[name="propertyType"]').forEach(x=>x.addEventListener('change',propertyChange));
  qa('input[name="renoScope"]').forEach(x=>x.addEventListener('change',()=>{calcQuick();calcOwn()}));
  $('renoArea').addEventListener('input',calcQuick);$('flatBuilding').addEventListener('change',calcQuick);
  budgetRows().forEach(x=>x.addEventListener('input',calcOwn));$('ownReserve').addEventListener('input',calcOwn);
  const menu=$('menuToggle'),nav=$('mobileNav'); if(menu&&nav){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-label',open?'Otevřít navigaci':'Zavřít navigaci');nav.classList.toggle('is-open',!open)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Otevřít navigaci');nav.classList.remove('is-open')}})}
  propertyChange();calcOwn();
})();
