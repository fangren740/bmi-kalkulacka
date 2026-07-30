(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const form=$('percentageForm');
  if(!form)return;
  let task='part';
  let mode='basic';
  const taskIds={
    part:['partPercent','partBase'],share:['sharePart','shareWhole'],adjust:['adjustBase','adjustDirection','adjustPercent'],base:['basePart','basePercent'],change:['changeOld','changeNew'],points:['pointsOld','pointsNew'],chain:['chainBase','chainDirection1','chainPercent1','chainDirection2','chainPercent2']
  };
  const defaults={partPercent:'15',partBase:'200',sharePart:'45',shareWhole:'180',adjustBase:'800',adjustDirection:'increase',adjustPercent:'12',basePart:'30',basePercent:'15',changeOld:'100',changeNew:'125',pointsOld:'20',pointsNew:'25',chainBase:'100',chainDirection1:'increase',chainPercent1:'10',chainDirection2:'decrease',chainPercent2:'10'};
  const examples={
    discount:{task:'adjust',values:{adjustBase:'1250',adjustDirection:'decrease',adjustPercent:'20'}},
    budget:{task:'share',values:{sharePart:'12000',shareWhole:'40000'}},
    growth:{task:'change',values:{changeOld:'160',changeNew:'184'}},
    points:{task:'points',values:{pointsOld:'20',pointsNew:'25'}},
    base:{task:'base',values:{basePart:'24',basePercent:'60'}},
    chain:{task:'chain',values:{chainBase:'100',chainDirection1:'increase',chainPercent1:'10',chainDirection2:'decrease',chainPercent2:'10'}}
  };
  const parseNumber=value=>{const cleaned=String(value??'').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,'');const n=Number(cleaned);return Number.isFinite(n)?n:NaN};
  const decimals=()=>Math.max(0,Math.min(6,Number($('decimals').value)||0));
  const fmt=(value,d=decimals())=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:0,maximumFractionDigits:d}).format(Number.isFinite(value)?value:0);
  const pct=value=>`${fmt(value)} %`;
  const customUnit=()=>$('customUnit').value.trim();
  const withUnit=(value,unit='')=>`${fmt(value)}${unit?` ${unit}`:''}`;
  const val=id=>parseNumber($(id).value);
  const setText=(id,value)=>{const el=$(id);if(el)el.textContent=value};
  function values(){const out={};taskIds[task].forEach(id=>{const el=$(id);out[id]=el.tagName==='SELECT'?el.value:val(id)});return out}
  function validate(v){
    const nums=Object.values(v).filter(x=>typeof x==='number');
    if(nums.some(x=>!Number.isFinite(x)))return 'Vyplňte všechna zobrazená pole platnými čísly.';
    if(task==='share'&&v.shareWhole===0)return 'Celek nesmí být nula.';
    if(task==='base'&&v.basePercent===0)return 'Procento nesmí být nula, jinak celý základ nelze dopočítat.';
    if(task==='change'&&v.changeOld===0)return 'Původní hodnota nesmí být nula. Relativní změnu by nebylo možné vypočítat.';
    if(task==='part'&&Math.abs(v.partPercent)>1000000)return 'Zadejte procento v rozumném rozsahu.';
    if(task==='adjust'&&(v.adjustPercent<0||v.adjustPercent>1000000))return 'Procentní změna musí být nezáporná.';
    if(task==='adjust'&&v.adjustDirection==='decrease'&&v.adjustPercent>100)return 'Snížení o více než 100 % by vytvořilo zápornou hodnotu. Zkontrolujte zadání.';
    if(task==='chain'&&(v.chainPercent1<0||v.chainPercent2<0))return 'Procentní změny musí být nezáporné.';
    if(task==='chain'&&((v.chainDirection1==='decrease'&&v.chainPercent1>100)||(v.chainDirection2==='decrease'&&v.chainPercent2>100)))return 'Snížení o více než 100 % není v tomto modelu povoleno.';
    return '';
  }
  function result(v){
    const unit=customUnit();
    if(task==='part'){
      const answer=v.partBase*v.partPercent/100;
      return{title:'Procento z hodnoty',label:`${pct(v.partPercent)} z ${fmt(v.partBase)} je`,answer:withUnit(answer,unit),sentence:`Základ ${fmt(v.partBase)} vynásobený koeficientem ${fmt(v.partPercent/100,6)} dává ${withUnit(answer,unit)}.`,equation:`${fmt(v.partBase)} × ${fmt(v.partPercent)} ÷ 100 = ${fmt(answer)}`,labels:['Zadané procento','Základ 100 %','Zpětná kontrola','Doplněk do 100 %'],metrics:[pct(v.partPercent),withUnit(v.partBase,unit),v.partBase===0?'—':pct(answer/v.partBase*100),pct(100-v.partPercent)],bar:v.partPercent,barTitle:'Podíl na zvoleném základu',barNote:'Barevná část orientačně ukazuje zadané procento v rozsahu 0 až 100 %.',headline:'Výsledek má stejnou jednotku jako základ',decision:`Hodnota ${withUnit(answer,unit)} představuje ${pct(v.partPercent)} ze zadaného základu ${withUnit(v.partBase,unit)}.`,next:'Pro kontrolu vydělte výsledek základem a poměr vynásobte stem.'};
    }
    if(task==='share'){
      const answer=v.sharePart/v.shareWhole*100;
      return{title:'Podíl části z celku',label:`${fmt(v.sharePart)} z ${fmt(v.shareWhole)} je`,answer:pct(answer),sentence:`Část ${fmt(v.sharePart)} tvoří ${pct(answer)} ze zvoleného celku ${fmt(v.shareWhole)}.`,equation:`${fmt(v.sharePart)} ÷ ${fmt(v.shareWhole)} × 100 = ${pct(answer)}`,labels:['Část','Celek 100 %','Kontrolní část','Zbývá do celku'],metrics:[withUnit(v.sharePart,unit),withUnit(v.shareWhole,unit),withUnit(v.shareWhole*answer/100,unit),pct(100-answer)],bar:answer,barTitle:'Podíl části na celku',barNote:'Hodnota nad 100 % znamená, že část je větší než zvolený celek.',headline:answer>100?'Část je větší než zvolený celek':'Celek je základ 100 %',decision:`Za 100 % považujeme hodnotu ${withUnit(v.shareWhole,unit)}.`,next:'Ověřte, že část i celek mají stejnou jednotku a stejné časové období.'};
    }
    if(task==='adjust'){
      const sign=v.adjustDirection==='increase'?1:-1;
      const amount=v.adjustBase*v.adjustPercent/100;
      const answer=v.adjustBase+sign*amount;
      const finalPct=100+sign*v.adjustPercent;
      return{title:sign>0?'Hodnota po zvýšení':'Hodnota po snížení',label:`${sign>0?'Zvýšená':'Snížená'} hodnota je`,answer:withUnit(answer,unit),sentence:`Změna činí ${withUnit(amount,unit)} a konečný stav odpovídá ${pct(finalPct)} původní hodnoty.`,equation:`${fmt(v.adjustBase)} × ${fmt(1+sign*v.adjustPercent/100,6)} = ${fmt(answer)}`,labels:['Výchozí hodnota','Velikost změny','Konečný podíl','Rozdíl'],metrics:[withUnit(v.adjustBase,unit),withUnit(amount,unit),pct(finalPct),withUnit(sign*amount,unit)],bar:finalPct,barTitle:'Konečný stav vůči původní hodnotě',barNote:'Původní hodnota představuje 100 %. Barevný pruh zobrazuje konečný relativní stav.',headline:sign>0?'K základu se přičítá procentní část':'Od základu se odečítá procentní část',decision:`Výchozí hodnota ${withUnit(v.adjustBase,unit)} se ${sign>0?'zvýší':'sníží'} o ${withUnit(amount,unit)}.`,next:'Stejné procento v opačném směru hodnotu obvykle nevrátí přesně zpět, protože se změní základ.'};
    }
    if(task==='base'){
      const answer=v.basePart/(v.basePercent/100);
      return{title:'Dopočet celého základu',label:`${fmt(v.basePart)} je ${pct(v.basePercent)} z`,answer:withUnit(answer,unit),sentence:`Hodnota odpovídající 100 % je ${withUnit(answer,unit)}.`,equation:`${fmt(v.basePart)} ÷ ${fmt(v.basePercent/100,6)} = ${fmt(answer)}`,labels:['Známá část','Zadaný podíl','Zpětná kontrola','Zbývající část'],metrics:[withUnit(v.basePart,unit),pct(v.basePercent),withUnit(answer*v.basePercent/100,unit),withUnit(answer-v.basePart,unit)],bar:v.basePercent,barTitle:'Známá část z dopočteného celku',barNote:'Zadaná část představuje barevně vyznačený podíl z celého základu.',headline:'Hledaná hodnota představuje 100 %',decision:`Část ${withUnit(v.basePart,unit)} odpovídá ${pct(v.basePercent)} ze základu ${withUnit(answer,unit)}.`,next:'Kontrola: vypočítejte z nalezeného základu zadané procento. Musí vyjít původní část.'};
    }
    if(task==='change'){
      const diff=v.changeNew-v.changeOld;
      const answer=diff/v.changeOld*100;
      const ratio=v.changeNew/v.changeOld*100;
      return{title:'Procentní změna',label:`Změna z ${fmt(v.changeOld)} na ${fmt(v.changeNew)}`,answer:pct(answer),sentence:`Hodnota se ${diff>=0?'zvýšila':'snížila'} o ${withUnit(Math.abs(diff),unit)}, tedy o ${pct(Math.abs(answer))}.`,equation:`(${fmt(v.changeNew)} − ${fmt(v.changeOld)}) ÷ ${fmt(v.changeOld)} × 100 = ${pct(answer)}`,labels:['Původní hodnota','Nová hodnota','Absolutní rozdíl','Konečný stav'],metrics:[withUnit(v.changeOld,unit),withUnit(v.changeNew,unit),withUnit(diff,unit),pct(ratio)],bar:ratio,barTitle:'Nová hodnota vůči původní',barNote:'Původní hodnota je 100 %. Pruh ukazuje nový relativní stav.',headline:diff>=0?'Hodnota vzrostla':'Hodnota klesla',decision:`Původní hodnota ${withUnit(v.changeOld,unit)} je základem pro výpočet 100 %.`,next:'Při obrácení směru vyjde jiné procento, protože se změní původní základ.'};
    }
    if(task==='points'){
      const diff=v.pointsNew-v.pointsOld;
      const relative=v.pointsOld===0?null:diff/v.pointsOld*100;
      return{title:'Rozdíl v procentních bodech',label:'Rozdíl dvou sazeb je',answer:`${fmt(diff)} p. b.`,sentence:relative===null?`Sazba se změnila o ${fmt(diff)} procentních bodů. Relativní změna z nuly není definovaná.`:`Sazba se změnila o ${fmt(diff)} procentních bodů, relativně o ${pct(relative)}.`,equation:`${pct(v.pointsNew)} − ${pct(v.pointsOld)} = ${fmt(diff)} p. b.`,labels:['Původní sazba','Nová sazba','Relativní změna','Prostý rozdíl'],metrics:[pct(v.pointsOld),pct(v.pointsNew),relative===null?'Nedefinováno':pct(relative),`${fmt(diff)} p. b.`],bar:v.pointsNew,barTitle:'Nová sazba v rozsahu 0 až 100 %',barNote:'Pruh zobrazuje novou sazbu. Procentní body jsou prostý rozdíl, nikoliv relativní změna.',headline:'Procentní body a procenta odpovídají na jinou otázku',decision:'Procentní bod měří rozdíl dvou sazeb. Relativní změna používá původní sazbu jako základ.',next:'Při sdílení výsledku vždy napište, zda jde o procentní body, nebo relativní procentní změnu.'};
    }
    const sign1=v.chainDirection1==='increase'?1:-1;
    const sign2=v.chainDirection2==='increase'?1:-1;
    const factor1=1+sign1*v.chainPercent1/100;
    const factor2=1+sign2*v.chainPercent2/100;
    const middle=v.chainBase*factor1;
    const answer=middle*factor2;
    const total=(answer/v.chainBase-1)*100;
    return{title:'Dvě změny po sobě',label:'Konečná hodnota je',answer:withUnit(answer,unit),sentence:`Po první změně vznikne ${withUnit(middle,unit)}. Druhá změna vede ke konečné hodnotě ${withUnit(answer,unit)}.`,equation:`${fmt(v.chainBase)} × ${fmt(factor1,6)} × ${fmt(factor2,6)} = ${fmt(answer)}`,labels:['Výchozí hodnota','Po první změně','Celková změna','Konečný podíl'],metrics:[withUnit(v.chainBase,unit),withUnit(middle,unit),pct(total),pct(answer/v.chainBase*100)],bar:answer/v.chainBase*100,barTitle:'Konečný stav vůči výchozí hodnotě',barNote:'Navazující změny se násobí pomocí koeficientů; běžně je nelze jednoduše sečíst.',headline:Math.abs(total)<1e-12?'Změny se přesně vyrušily':total>0?'Celkový výsledek je vyšší než začátek':'Celkový výsledek je nižší než začátek',decision:`Celková změna oproti výchozí hodnotě je ${pct(total)}.`,next:'Pro návrat na původní hodnotu musí druhá procentní změna zohlednit nový základ po první změně.'};
  }
  function render(opts={}){
    const v=values();
    const message=validate(v);
    const error=$('percentageError');
    if(message){
      error.hidden=false;error.textContent=message;
      setText('resultBadge','Opravte zadání');setText('answerValue','—');setText('answerSentence',message);setText('equationText','Výpočet není dostupný.');
      ['metricA','metricB','metricCheck','metricComplement'].forEach(id=>setText(id,'—'));
      $('percentageFill').style.width='0%';return false;
    }
    error.hidden=true;
    const r=result(v);
    setText('resultTitle',r.title);setText('resultBadge','Výpočet hotový');setText('answerLabel',r.label);setText('answerValue',r.answer);setText('answerSentence',r.sentence);setText('equationText',r.equation);
    const labelIds=['metricALabel','metricBLabel','metricCheckLabel','metricComplementLabel'];
    const metricIds=['metricA','metricB','metricCheck','metricComplement'];
    r.labels.forEach((x,i)=>setText(labelIds[i],x));r.metrics.forEach((x,i)=>setText(metricIds[i],x));
    setText('barTitle',r.barTitle);setText('barLabel',`${fmt(r.bar)} %`);setText('barNote',r.barNote);$('percentageFill').style.width=`${Math.max(0,Math.min(100,Math.abs(r.bar)))}%`;
    setText('decisionHeadline',r.headline);setText('decisionText',r.decision);setText('nextStepText',r.next);
    if(opts.scroll&&matchMedia('(max-width:720px)').matches)$('vysledek').scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }
  function setTask(next,{scroll=false}={}){
    task=next;
    document.querySelectorAll('[data-task]').forEach(button=>{const active=button.dataset.task===next;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active))});
    document.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==next);
    render();
    if(scroll)$('kalkulacka').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function setMode(next){
    mode=next;
    document.body.classList.toggle('is-advanced',next==='advanced');
    document.querySelectorAll('[data-mode]').forEach(button=>{const active=button.dataset.mode===next;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active))});
    $('advancedSettings').hidden=next!=='advanced';
    if(next==='basic'&&!['part','share','adjust'].includes(task))setTask('part');else render();
  }
  function applyExample(name){const item=examples[name];if(!item)return;if(!['part','share','adjust'].includes(item.task))setMode('advanced');setTask(item.task);Object.entries(item.values).forEach(([id,value])=>{$(id).value=value});render({scroll:true})}
  async function copyResult(){const text=`${$('resultTitle').textContent}: ${$('answerValue').textContent}. ${$('equationText').textContent}`;try{await navigator.clipboard.writeText(text);$('copyResult').textContent='Zkopírováno';setTimeout(()=>$('copyResult').textContent='Kopírovat výsledek',1500)}catch{$('copyResult').textContent='Kopírování selhalo'}}
  function reset(){Object.entries(defaults).forEach(([id,value])=>{$(id).value=value});$('decimals').value='2';$('customUnit').value='';setMode('basic');setTask('part')}
  document.querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>setTask(button.dataset.task)));
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
  document.querySelectorAll('[data-jump-task]').forEach(button=>button.addEventListener('click',()=>{const next=button.dataset.jumpTask;if(!['part','share','adjust'].includes(next))setMode('advanced');setTask(next,{scroll:true})}));
  document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>applyExample(button.dataset.example)));
  Object.values(taskIds).flat().forEach(id=>{const el=$(id);el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>render())});
  $('decimals').addEventListener('change',render);$('customUnit').addEventListener('input',render);
  form.addEventListener('submit',event=>{event.preventDefault();render({scroll:true})});
  $('resetBtn').addEventListener('click',reset);$('copyResult').addEventListener('click',copyResult);
  document.addEventListener('keydown',event=>{if(event.key==='Tab')document.body.classList.add('keyboard-user')},{once:true});document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard-user'));const skip=document.querySelector('.skip-link');if(document.activeElement===skip)skip.blur();
  const top=$('backToTop');const toggleTop=()=>top.classList.toggle('is-visible',window.scrollY>600);window.addEventListener('scroll',toggleTop,{passive:true});top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));toggleTop();
  setMode('basic');setTask('part');
})();