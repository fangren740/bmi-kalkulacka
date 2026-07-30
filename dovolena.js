(function(){
  'use strict';
  const form=document.getElementById('vacationForm');
  if(!form)return;
  const $=id=>document.getElementById(id);
  const fmt1=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1});
  const fmt2=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
  let mode='basic';

  function num(id,fallback=0){const el=$(id);const value=Number(String(el&&el.value||'').replace(',','.'));return Number.isFinite(value)?value:fallback}
  function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
  function hours(v){return `${fmt1.format(v)} h`}
  function days(v,shift){return `${fmt1.format(v/shift)} ${Math.abs(v/shift-1)<.001?'den':'dnů'}`}
  function setText(id,value){const el=$(id);if(el)el.textContent=value}
  function setWidth(id,value){const el=$(id);if(el)el.style.width=`${clamp(value,0,100)}%`}

  function inputs(){
    if(mode==='basic'){
      return{mode,relation:'employment',weekly:clamp(num('basicWeeklyHours',40),1,80),leaveWeeks:clamp(num('basicLeaveWeeks',5),1,12),multiples:Math.floor(clamp(num('basicMultiples',52),0,80)),used:Math.max(0,num('basicUsedHours',40)),carry:0,reduction:0,shift:8,relationDays:365,countedHours:null};
    }
    const relation=$('relationType').value;
    const weekly=relation==='agreement'?20:clamp(num('advancedWeeklyHours',40),1,80);
    const counted=Math.max(0,num('countedHours',0));
    return{mode,relation,weekly,leaveWeeks:clamp(num('advancedLeaveWeeks',5),1,12),multiples:Math.floor(counted/weekly),used:Math.max(0,num('advancedUsedHours',0)),carry:Math.max(0,num('carryHours',0)),reduction:Math.max(0,num('reductionHours',0)),shift:clamp(num('shiftHours',8),1,24),relationDays:clamp(num('relationDays',365),1,366),countedHours:counted};
  }

  function calculate(input,overrideWeeks){
    const leaveWeeks=overrideWeeks||input.leaveWeeks;
    const eligible=input.relationDays>=28&&input.multiples>=4;
    const annualBase=input.weekly*leaveWeeks;
    const raw=eligible?annualBase*input.multiples/52:0;
    const earned=raw>0?Math.ceil(raw-1e-9):0;
    let corrected=Math.max(0,earned-input.reduction);
    if(input.relation==='employment'&&input.relationDays>=365&&input.multiples>=52&&input.reduction>0){corrected=Math.max(input.weekly*2,corrected)}
    const available=corrected+input.carry;
    const remaining=available-input.used;
    return{...input,leaveWeeks,eligible,annualBase,raw,earned,corrected,available,remaining,onePart:annualBase/52,usedShare:available>0?input.used/available*100:0};
  }

  function decision(r){
    if(!r.eligible){
      return{title:'Podmínky pro vznik nároku zatím nejsou splněné',text:r.relation==='agreement'?'U DPP/DPČ musí vztah trvat alespoň 28 dnů a být započteno nejméně 80 hodin.':'Pracovní vztah musí trvat alespoň 4 týdny a musí být započteny nejméně 4 násobky týdenní pracovní doby.'};
    }
    if(r.remaining<0)return{title:'Evidence ukazuje přečerpání dovolené',text:`Vyčerpané hodiny převyšují dostupný zůstatek o ${hours(Math.abs(r.remaining))}. Ověřte převod, korekce a údaje zaměstnavatele.`};
    if(r.multiples<52)return{title:'Jde o poměrnou část dovolené',text:`Nárok vznikl za ${r.multiples} celých násobků týdenní pracovní doby. Výsledek ${hours(r.earned)} je zaokrouhlen nahoru na celé hodiny.`};
    if(r.multiples>52)return{title:'Výpočet zahrnuje více než 52 násobků',text:'Při skutečně započtených hodinách nad 52násobek může nárok růst o další dvaapadesátiny. Ověřte, že počet hodin odpovídá evidenci.'};
    return{title:'Nárok odpovídá plnému roku',text:`Základ činí ${hours(r.annualBase)}. Po čerpání zbývá ${hours(r.remaining)}; přepočet na dny je pouze orientační.`};
  }

  function renderTable(r){
    const rows=[
      ['Roční základ',hours(r.annualBase),`${fmt1.format(r.weekly)} h × ${fmt1.format(r.leaveWeeks)} týdne`],
      ['Započtené násobky',`${r.multiples}×`,r.countedHours===null?'zadaný rychlý odhad':`${hours(r.countedHours)} / ${hours(r.weekly)}`],
      ['Nárok 2026',hours(r.earned),`${hours(r.annualBase)} × ${r.multiples}/52, zaokrouhleno nahoru`],
      ['Přenesená dovolená',hours(r.carry),'samostatně zadaný převod'],
      ['Korekce',`− ${hours(r.reduction)}`,'odečtená úprava evidence'],
      ['Vyčerpáno',`− ${hours(r.used)}`,'již čerpané hodiny'],
      ['Zůstatek',hours(r.remaining),'dostupné hodiny po odečtení čerpání']
    ];
    $('summaryTable').innerHTML=rows.map(x=>`<tr><td>${x[0]}</td><td>${x[1]}</td><td>${x[2]}</td></tr>`).join('');
  }

  function render(){
    const input=inputs();
    const r=calculate(input);
    const d=decision(r);
    const remainingPositive=Math.max(0,r.remaining);
    setText('remainingHours',hours(r.remaining));
    setText('remainingDays',`${days(remainingPositive,r.shift)} při směně ${fmt1.format(r.shift)} h`);
    setText('earnedHours',hours(r.earned));
    setText('earnedFormula',`${r.multiples} započtených násobků`);
    setText('availableHours',hours(r.available));
    setText('usedHoursResult',hours(r.used));
    setText('usedShare',`${fmt1.format(r.usedShare)} % dostupné dovolené`);
    setText('multiplesResult',`${r.multiples}×`);
    setText('eligibilityText',r.eligible?'podmínky splněny':'nárok zatím nevznikl');
    setText('resultMode',mode==='basic'?'Rychlý režim':r.relation==='agreement'?'Přesný režim · DPP/DPČ':'Přesný režim · pracovní poměr');
    setText('usedProgressLabel',hours(r.used));
    setWidth('usedProgressBar',r.usedShare);
    setText('decisionTitle',d.title);setText('decisionText',d.text);
    setText('annualBase',hours(r.annualBase));setText('oneFiftySecond',hours(r.onePart));setText('carryResult',hours(r.carry));setText('reductionResult',hours(r.reduction));
    setText('heroRemaining',hours(r.remaining));setText('heroRemainSmall',hours(r.remaining));setText('heroDays',`${days(remainingPositive,r.shift)} při směně ${fmt1.format(r.shift)} h`);setText('heroUsed',hours(r.used));setText('heroEarned',hours(r.earned));setText('heroWeekly',hours(r.weekly));setText('heroMultiples',`${r.multiples}×`);
    const heroUsedShare=r.available>0?clamp(r.used/r.available*100,0,100):0;setWidth('heroUsedBar',heroUsedShare);setWidth('heroRemainingBar',100-heroUsedShare);
    [4,5,6].forEach(w=>{const s=calculate(input,w);setText(`scenario${w}`,hours(s.earned));setText(`scenario${w}days`,`${days(s.earned,r.shift)} při směně ${fmt1.format(r.shift)} h`)});
    renderTable(r);
  }

  function setMode(next){mode=next;const basic=next==='basic';$('basicPanel').hidden=!basic;$('advancedPanel').hidden=basic;form.classList.toggle('mode-basic',basic);form.classList.toggle('mode-advanced',!basic);document.querySelectorAll('.mode-card').forEach(btn=>{const active=btn.dataset.mode===next;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});render()}
  function relationChange(){const agreement=$('relationType').value==='agreement';$('advancedWeeklyField').classList.toggle('is-disabled',agreement);$('advancedWeeklyHours').disabled=agreement;setText('advancedNote',agreement?'U DPP/DPČ používá kalkulačka fiktivní týdenní pracovní dobu 20 hodin. Nárok vzniká při trvání alespoň 28 dnů a započtení alespoň 80 hodin.':'Počet započtených násobků vznikne vydělením evidovaných hodin týdenní pracovní dobou a zaokrouhlením dolů.');render()}
  function reset(){form.reset();$('basicWeeklyHours').value=40;$('basicLeaveWeeks').value=5;$('basicMultiples').value=52;$('basicUsedHours').value=40;$('advancedWeeklyHours').value=40;$('advancedLeaveWeeks').value=5;$('countedHours').value=2080;$('relationDays').value=365;$('advancedUsedHours').value=40;$('carryHours').value=0;$('reductionHours').value=0;$('shiftHours').value=8;$('relationType').value='employment';relationChange();setMode('basic')}

  document.querySelectorAll('.mode-card').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  form.addEventListener('submit',e=>{e.preventDefault();render()});
  form.addEventListener('input',render);
  form.addEventListener('change',e=>{if(e.target.id==='relationType')relationChange();else render()});
  $('resetButton').addEventListener('click',reset);
  relationChange();setMode('basic');
})();
