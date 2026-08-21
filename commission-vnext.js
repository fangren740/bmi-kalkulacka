(() => {
'use strict';
const $=id=>document.getElementById(id);
const money=n=>`${(Number.isFinite(Number(n))?Number(n):0).toLocaleString('cs-CZ',{maximumFractionDigits:0})} Kč`;
const percent=n=>`${(Number(n)||0).toLocaleString('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2})} %`;
const val=(id,fb=0)=>{const n=Number($(id)?.value);return Number.isFinite(n)?Math.max(0,n):fb};
let task='earn';
function calcCommission(base, rate, fixed, tier){
  base=Math.max(0,base); rate=Math.max(0,rate); fixed=Math.max(0,fixed);
  let basePart=base*rate/100, tierPart=0, total=basePart+fixed, baseSegment=base, tierSegment=0;
  if(tier.enabled){
    const t=Math.max(0,tier.threshold), tr=Math.max(0,tier.rate);
    if(tier.mode==='retroactive' && base>t){basePart=0;tierPart=base*tr/100;baseSegment=0;tierSegment=base;total=tierPart+fixed;}
    else{baseSegment=Math.min(base,t);tierSegment=Math.max(0,base-t);basePart=baseSegment*rate/100;tierPart=tierSegment*tr/100;total=basePart+tierPart+fixed;}
  }
  return {base,rate,fixed,basePart,tierPart,total,baseSegment,tierSegment,effective:base>0?total/base*100:0};
}
function currentPlan(){return {rate:val('commissionRate',8),fixed:val('fixedCommission'),team:Math.max(1,Math.round(val('teamSize',1))),settlement:$('settlementMode').value,tier:{enabled:$('tierEnabled').value==='yes',threshold:val('tierThreshold',100000),rate:val('tierRate',12),mode:$('tierMode').value}}}
function requiredBase(target,p){
  target=Math.max(0,target);
  const needed=Math.max(0,target-p.fixed);
  if(needed<=0)return 0;
  if(!p.tier.enabled)return p.rate>0?needed/(p.rate/100):Infinity;
  const t=p.tier.threshold, r=p.rate/100, tr=p.tier.rate/100;
  if(p.tier.mode==='progressive'){
    const atThreshold=t*r;
    if(needed<=atThreshold)return r>0?needed/r:Infinity;
    return tr>0?t+(needed-atThreshold)/tr:Infinity;
  }
  // Retroactive plan: below threshold use base rate; above threshold whole base uses tier rate.
  const belowCandidate=r>0?needed/r:Infinity;
  if(belowCandidate<=t)return belowCandidate;
  if(tr<=0)return Infinity;
  const retroCandidate=needed/tr;
  return Math.max(t+0.000001,retroCandidate);
}
function compareTier(base,p){
 const prog=calcCommission(base,p.rate,p.fixed,{...p.tier,enabled:true,mode:'progressive'});
 const retro=calcCommission(base,p.rate,p.fixed,{...p.tier,enabled:true,mode:'retroactive'});
 return {prog,retro,diff:retro.total-prog.total};
}
function render(){
 const p=currentPlan(); const rawBase=task==='earn'?val('baseAmount',150000):requiredBase(val('targetCommission',20000),p); const possible=Number.isFinite(rawBase); const base=possible?rawBase:0;
 const c=calcCommission(base,p.rate,p.fixed,p.tier); const per=c.total/p.team;
 $('tierFields').hidden=!p.tier.enabled;
 document.querySelectorAll('[data-earn-only]').forEach(el=>el.hidden=task!=='earn');
 document.querySelectorAll('[data-target-only]').forEach(el=>el.hidden=task!=='target');
 document.querySelectorAll('[data-earn-metric]').forEach(el=>el.hidden=task!=='earn');
 document.querySelectorAll('[data-target-metric]').forEach(el=>el.hidden=task!=='target');
 $('resultTag').textContent=task==='earn'?'VAŠE PROVIZE':'POTŘEBNÝ OBRAT';
 $('resultTitle').textContent=task==='earn'?money(c.total):(possible?money(base):'Nelze dopočítat');
 let planText=p.tier.enabled?`${p.tier.mode==='progressive'?'progresivním':'retroaktivním'} pásmu ${p.rate.toLocaleString('cs-CZ')} % / ${p.tier.rate.toLocaleString('cs-CZ')} %`:`sazbě ${p.rate.toLocaleString('cs-CZ')} %`;
 $('resultLead').textContent=task==='earn'?`Z obratu ${money(base)} při ${planText}.`:`Pro cílovou provizi ${money(val('targetCommission',20000))} při ${planText}.`;
 $('effectiveRate').textContent=percent(c.effective);
 $('baseCommission').textContent=money(c.basePart + (!p.tier.enabled?p.fixed:0));
 if(!p.tier.enabled){$('baseCaption').textContent=`${money(base)} × ${p.rate.toLocaleString('cs-CZ')} %${p.fixed?` + pevně ${money(p.fixed)}`:''}`;$('tierCommission').textContent='—';$('tierCaption').textContent='Pásmo není aktivní';}
 else if(p.tier.mode==='retroactive'&&base>p.tier.threshold){$('baseCommission').textContent=money(p.fixed);$('baseCaption').textContent=p.fixed?`Pouze pevná složka ${money(p.fixed)}`:'Základní pásmo se zpětně nepoužije';$('tierCommission').textContent=money(c.tierPart);$('tierCaption').textContent=`${money(base)} × ${p.tier.rate.toLocaleString('cs-CZ')} %`;}
 else{$('baseCommission').textContent=money(c.basePart+p.fixed);$('baseCaption').textContent=`${money(c.baseSegment)} × ${p.rate.toLocaleString('cs-CZ')} %${p.fixed?` + pevně ${money(p.fixed)}`:''}`;$('tierCommission').textContent=money(c.tierPart);$('tierCaption').textContent=c.tierSegment?`${money(c.tierSegment)} × ${p.tier.rate.toLocaleString('cs-CZ')} %`:'Zatím bez části nad hranicí';}
 $('totalCommission').textContent=money(c.total);$('perPerson').textContent=money(per);$('requiredBase').textContent=possible?money(base):'—';
 if(task==='earn'){
   if(p.settlement==='add'){$('settlementLabel').textContent='Zákazník celkem zaplatí';$('settlementValue').textContent=money(base+c.total)}else{$('settlementLabel').textContent='Po odečtení provize zbývá';$('settlementValue').textContent=money(Math.max(0,base-c.total))}
 }
 const track=$('tierTrack'); track.hidden=!p.tier.enabled || !possible;
 if(!track.hidden){const max=Math.max(base,p.tier.threshold,1),thr=Math.min(100,p.tier.threshold/max*100),basePct=Math.min(100,Math.min(base,p.tier.threshold)/max*100),tierPct=Math.max(0,Math.min(100,(base-p.tier.threshold)/max*100));$('baseFill').style.width=`${basePct}%`;$('thresholdMarker').style.left=`${thr}%`;$('tierFill').style.left=`${thr}%`;$('tierFill').style.width=`${tierPct}%`;$('thresholdScale').textContent=`${Math.round(p.tier.threshold/1000)} tis.`;$('baseScale').textContent=`${Math.round(base/1000)} tis.`;$('trackLabel').textContent=base>p.tier.threshold?`${money(Math.min(base,p.tier.threshold))} + ${money(base-p.tier.threshold)}`:`${money(base)} pod hranicí`;}
 const cmp=$('tierComparison');cmp.hidden=!p.tier.enabled||base<=p.tier.threshold||!possible;
 if(!cmp.hidden){const q=compareTier(base,p);$('progressiveCompare').textContent=money(q.prog.total);$('retroCompare').textContent=money(q.retro.total);$('compareDifference').textContent=`Retroaktivní varianta je o ${money(Math.abs(q.diff))} ${q.diff>=0?'vyšší':'nižší'}.`;}
 if(!possible){$('resultMeaning').textContent='Cílovou provizi nelze s aktuálním nastavením dopočítat. Zkontrolujte, zda je procentní sazba nebo pevná složka dostatečná pro vznik odměny.'}
 else if(!p.tier.enabled){$('resultMeaning').textContent=`Provize vzniká jako ${p.rate.toLocaleString('cs-CZ')} % ze zadaného základu${p.fixed?` plus pevná složka ${money(p.fixed)}`:''}. Efektivní sazba je ${percent(c.effective)}.`}
 else if(p.tier.mode==='progressive'){$('resultMeaning').textContent=base>p.tier.threshold?`Vyšší sazba ${p.tier.rate.toLocaleString('cs-CZ')} % se použila pouze na ${money(base-p.tier.threshold)} nad hranicí. Efektivní sazba je proto ${percent(c.effective)}, nikoli automaticky ${p.tier.rate.toLocaleString('cs-CZ')} %.`:`Obrat zatím nepřekročil hranici ${money(p.tier.threshold)}, takže celý procentní základ používá ${p.rate.toLocaleString('cs-CZ')} %.`}
 else{$('resultMeaning').textContent=base>p.tier.threshold?`Po překročení hranice se podle retroaktivního modelu celý základ přepočítal sazbou ${p.tier.rate.toLocaleString('cs-CZ')} %. Takový skok používejte jen tehdy, pokud ho skutečně stanoví smlouva.`:`Hranice ${money(p.tier.threshold)} zatím nebyla překročena, proto se používá základní sazba ${p.rate.toLocaleString('cs-CZ')} %.`}
 window.__rvCommission={task,plan:p,base,calc:c};
}
function setTask(next){task=next;document.querySelectorAll('.cm-task button').forEach(b=>{const active=b.dataset.task===task;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});render()}
document.querySelectorAll('.cm-task button').forEach(b=>b.addEventListener('click',()=>setTask(b.dataset.task)));
$('tierEnabled').addEventListener('change',render);$('tierMode').addEventListener('change',render);$('commissionForm').addEventListener('input',render);$('commissionForm').addEventListener('change',render);$('commissionForm').addEventListener('submit',e=>{e.preventDefault();render();$('vysledek').scrollIntoView({behavior:'smooth',block:'start'})});
$('resetBtn').addEventListener('click',()=>{$('baseAmount').value=150000;$('targetCommission').value=20000;$('commissionRate').value=8;$('fixedCommission').value=0;$('teamSize').value=1;$('settlementMode').value='deduct';$('tierEnabled').value='no';$('tierThreshold').value=100000;$('tierRate').value=12;$('tierMode').value='progressive';$('advanced').open=false;setTask('earn')});
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.main-nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open))});document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false')}})}
$('advanced').open=false;setTask('earn');
})();