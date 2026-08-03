(function(){
  'use strict';
  const DAY = 86400000;
  const q = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));

  function utcDateFromInput(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [y,m,d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y,m-1,d));
    return date.getUTCFullYear()===y && date.getUTCMonth()===m-1 && date.getUTCDate()===d ? date : null;
  }
  function inputFromDate(date){ return date.toISOString().slice(0,10); }
  function addDays(date, days){ return new Date(date.getTime() + days * DAY); }
  function diffDays(a,b){ return Math.round((a.getTime() - b.getTime()) / DAY); }
  function formatDate(date, withYear=true){ return new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'long',year:withYear?'numeric':undefined,timeZone:'UTC'}).format(date); }
  function formatDateShort(date){ return new Intl.DateTimeFormat('cs-CZ',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(date); }
  function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }
  function plural(n,one,few,many){ const a=Math.abs(n); if(a===1) return one; if(a>=2&&a<=4) return few; return many; }

  const form = q('#dueDateForm');
  if(!form) return;
  const modes = qa('[data-mode]');
  const basicPanel = q('#basicPanel');
  const advancedPanel = q('#advancedPanel');
  const method = q('#datingMethod');
  const reference = q('#referenceDate');
  const error = q('#formError');

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));
  q('#lmpDate').value = inputFromDate(addDays(todayUTC,-70));
  reference.value = inputFromDate(todayUTC);
  q('#advancedLmpDate').value = q('#lmpDate').value;
  q('#conceptionDate').value = inputFromDate(addDays(todayUTC,-56));
  q('#knownDueDate').value = inputFromDate(addDays(todayUTC,210));
  q('#transferDate').value = inputFromDate(addDays(todayUTC,-51));

  let activeMode = 'basic';

  function setMode(modeName, focus=false){
    activeMode = modeName;
    modes.forEach(btn=>{
      const on = btn.dataset.mode===modeName;
      btn.classList.toggle('is-active',on);
      btn.setAttribute('aria-pressed',String(on));
    });
    basicPanel.hidden = modeName!=='basic';
    advancedPanel.hidden = modeName!=='advanced';
    if(focus) (modeName==='basic'?basicPanel:advancedPanel).querySelector('input,select')?.focus();
    calculate();
  }
  modes.forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode,true)));

  function updateAdvancedFields(){
    const current = method.value;
    qa('[data-method-panel]').forEach(panel=>panel.hidden = panel.dataset.methodPanel!==current);
    calculate();
  }
  method.addEventListener('change',updateAdvancedFields);

  function getDating(){
    if(activeMode==='basic'){
      const lmp = utcDateFromInput(q('#lmpDate').value);
      const cycle = Number(q('#cycleLength').value);
      if(!lmp) return {error:'Zadejte platné datum prvního dne poslední menstruace.'};
      if(!Number.isFinite(cycle)||cycle<21||cycle>45) return {error:'Délka cyklu musí být mezi 21 a 45 dny.'};
      return {method:'lmp',edd:addDays(lmp,280+(cycle-28)),start:lmp,label:'poslední menstruace',detail:`cyklus ${cycle} dní`};
    }
    const current = method.value;
    if(current==='lmp'){
      const lmp = utcDateFromInput(q('#advancedLmpDate').value);
      const cycle = Number(q('#advancedCycleLength').value);
      if(!lmp) return {error:'Zadejte platné datum prvního dne poslední menstruace.'};
      if(!Number.isFinite(cycle)||cycle<21||cycle>45) return {error:'Délka cyklu musí být mezi 21 a 45 dny.'};
      return {method:'lmp',edd:addDays(lmp,280+(cycle-28)),start:lmp,label:'poslední menstruace',detail:`cyklus ${cycle} dní`};
    }
    if(current==='conception'){
      const conception = utcDateFromInput(q('#conceptionDate').value);
      if(!conception) return {error:'Zadejte platné datum početí nebo ovulace.'};
      return {method:'conception',edd:addDays(conception,266),start:addDays(conception,-14),label:'datum početí / ovulace',detail:'+ 266 dní'};
    }
    if(current==='known'){
      const edd = utcDateFromInput(q('#knownDueDate').value);
      if(!edd) return {error:'Zadejte platný termín porodu určený lékařem nebo ultrazvukem.'};
      return {method:'known',edd,start:addDays(edd,-280),label:'potvrzený termín porodu',detail:'převzatý termín'};
    }
    if(current==='ivf'){
      const transfer = utcDateFromInput(q('#transferDate').value);
      const embryoAge = Number(q('#embryoAge').value);
      if(!transfer) return {error:'Zadejte platné datum embryotransferu.'};
      if(![3,5].includes(embryoAge)) return {error:'Vyberte stáří embrya při transferu.'};
      const edd = addDays(transfer,266-embryoAge);
      return {method:'ivf',edd,start:addDays(edd,-280),label:`IVF transfer ${embryoAge}denního embrya`,detail:`+ ${266-embryoAge} dní`};
    }
    return {error:'Vyberte způsob určení termínu.'};
  }

  function pregnancyStatus(days){
    const week = Math.floor(days/7);
    const day = ((days%7)+7)%7;
    if(days<0) return {week,day,label:'před začátkem vypočteného těhotenství',trimester:'—',currentWeek:'—'};
    let trimester='1. trimestr';
    if(days>=14*7) trimester='2. trimestr';
    if(days>=28*7) trimester='3. trimestr';
    return {week,day,label:`${week}+${day}`,trimester,currentWeek:`${week+1}. týden`};
  }
  function setText(id,value){ const el=q('#'+id); if(el) el.textContent=value; }

  function buildMilestones(start,edd,referenceDate){
    const milestones = [
      {week:12,title:'12+0',copy:'uzavření 12 dokončených týdnů'},
      {week:14,title:'14+0',copy:'začátek 2. trimestru'},
      {week:20,title:'20+0',copy:'polovina 40týdenního výpočtu'},
      {week:28,title:'28+0',copy:'začátek 3. trimestru'},
      {week:37,title:'37+0',copy:'začátek období od 37. týdne'},
      {week:40,title:'40+0',copy:'vypočtený termín porodu'}
    ];
    const container=q('#milestoneList');
    container.innerHTML='';
    milestones.forEach(item=>{
      const date = item.week===40 ? edd : addDays(start,item.week*7);
      const passed = date.getTime() < referenceDate.getTime();
      const row=document.createElement('div');
      row.className='milestone'+(passed?' is-past':'');
      row.innerHTML=`<span>${item.title}</span><div><strong>${formatDate(date)}</strong><small>${item.copy}</small></div><b>${passed?'proběhlo':'čeká'}</b>`;
      container.appendChild(row);
    });
  }

  function calculate(){
    const dating=getDating();
    const ref=utcDateFromInput(reference.value);
    if(dating.error || !ref){
      error.hidden=false;
      error.textContent=dating.error || 'Zadejte platné referenční datum.';
      return;
    }
    error.hidden=true;
    const {edd,start,label,detail}=dating;
    const gestDays=diffDays(ref,start);
    const status=pregnancyStatus(gestDays);
    const daysTo=diffDays(edd,ref);
    const rangeStart=addDays(start,37*7);
    const rangeEnd=addDays(start,42*7-1);
    const progress=clamp((gestDays/280)*100,0,100);

    setText('resultDueDate',formatDate(edd));
    setText('resultDueDateShort',formatDateShort(edd));
    setText('resultGestation',gestDays>=0?status.label:'—');
    setText('resultCurrentWeek',gestDays>=0?status.currentWeek:'—');
    setText('resultTrimester',status.trimester);
    setText('resultMethod',label);
    setText('resultMethodDetail',detail);
    setText('resultRange',`${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`);
    setText('resultStartDate',formatDate(start));

    q('#progressBar').style.width=`${progress}%`;
    q('#progressBar').parentElement.setAttribute('aria-valuenow',String(Math.round(progress)));
    setText('progressLabel',gestDays<0?'před začátkem':gestDays>280?'po termínu':`${Math.round(progress)} % z 40 týdnů`);

    let remainingText;
    if(daysTo>0) remainingText=`${daysTo} ${plural(daysTo,'den','dny','dní')}`;
    else if(daysTo===0) remainingText='termín je dnes';
    else remainingText=`${Math.abs(daysTo)} ${plural(Math.abs(daysTo),'den','dny','dní')} po termínu`;
    setText('resultRemaining',remainingText);

    let insight='';
    let statusClass='is-info';
    if(gestDays<0){
      insight='Referenční datum leží před vypočteným začátkem těhotenství. Zkontrolujte zadaná data.';
      statusClass='is-warning';
    }else if(gestDays<37*7){
      insight=`K datu ${formatDate(ref)} odpovídá výpočet stáří ${status.label}. Jste v ${status.currentWeek.toLowerCase()} a termín 40+0 vychází na ${formatDate(edd)}.`;
    }else if(gestDays<42*7){
      insight=`Výpočet je v období od 37. týdne. Termín 40+0 vychází na ${formatDate(edd)}, ale skutečný den porodu se může od odhadu lišit.`;
      statusClass='is-success';
    }else{
      insight='Referenční datum je za hranicí 42+0. Ověřte vstupy a řiďte se termínem a postupem stanoveným vaším poskytovatelem péče.';
      statusClass='is-warning';
    }
    const insightEl=q('#resultInsight');
    insightEl.className=`result-insight ${statusClass}`;
    insightEl.textContent=insight;

    buildMilestones(start,edd,ref);
    setText('heroDueDate',formatDate(edd));
    setText('heroWeek',gestDays>=0?status.label:'—');
    setText('heroTrimester',status.trimester);
    setText('heroRemaining',remainingText);
  }

  form.addEventListener('input',calculate);
  form.addEventListener('change',calculate);
  form.addEventListener('submit',e=>{e.preventDefault();calculate();q('#vysledek').scrollIntoView({behavior:'smooth',block:'start'});});
  q('#resetCalculator').addEventListener('click',()=>{
    q('#lmpDate').value=inputFromDate(addDays(todayUTC,-70));
    q('#cycleLength').value='28';
    q('#advancedLmpDate').value=q('#lmpDate').value;
    q('#advancedCycleLength').value='28';
    reference.value=inputFromDate(todayUTC);
    method.value='lmp';
    updateAdvancedFields();
    setMode('basic');
  });

  updateAdvancedFields();
  setMode('basic');
})();
