(()=>{'use strict';
const $=id=>document.getElementById(id), $$=s=>Array.from(document.querySelectorAll(s));
const money=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(Number.isFinite(n)?n:0))+' Kč';
const dec=n=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0);
const num=id=>{const e=$(id),v=e?Number(String(e.value).replace(',','.')):0;return Number.isFinite(v)?Math.max(0,v):0};
function calc(price,count,daily,days){
 const piece=count>0?price/count:0;
 const need=daily>0&&days>0?Math.ceil(daily*days):0;
 const packs=count>0&&need>0?Math.ceil(need/count):0;
 const bought=packs*count,spend=packs*price,left=Math.max(0,bought-need),packDays=daily>0?count/daily:0;
 return{piece,need,packs,bought,spend,left,packDays}
}
function text(id,v){if($(id))$(id).textContent=v}
function renderTimeline(a,days){
 const axis=$('timelineAxis');axis.replaceChildren();
 const slots=Math.min(days,60);
 for(let i=0;i<slots;i++){const el=document.createElement('i');axis.appendChild(el)}
 const wrap=$('timelinePacks');wrap.replaceChildren();
 if(!a.packs)return;
 const fullDays=a.packDays;
 for(let i=0;i<a.packs;i++){
   const start=i*fullDays,usedDays=Math.max(0,Math.min(fullDays,days-start));
   const block=document.createElement('div');block.className='timeline-pack'+(i===a.packs-1?' last':'');
   block.style.flexGrow=String(Math.max(.25,usedDays/fullDays));
   block.setAttribute('data-days',`${Math.round(usedDays*10)/10} dne`);
   block.textContent=`PACK ${String(i+1).padStart(2,'0')}`;
   wrap.appendChild(block)
 }
}
function render(){
 const price=num('priceA'),count=num('countA'),daily=num('daily'),days=Math.max(1,Math.round(num('days')||30));
 const a=calc(price,count,daily,days),b=calc(num('priceB'),num('countB'),daily,days);
 const usage=a.bought?a.need/a.bought*100:0,leftDays=daily?a.left/daily:0,lastUsed=a.packs&&count?Math.max(0,Math.min(100,(count-a.left)/count*100)):0;
 text('packs',a.packs?`${a.packs} balení`:'—');text('caption',`na ${days} dnů při spotřebě ${daily||0} ks denně`);text('spend',a.packs?money(a.spend):'—');text('piece',a.piece?dec(a.piece)+' Kč':'—');text('left',`${a.left} ks`);text('leftDays',daily?`≈ ${Math.round(leftDays*10)/10} dnů zásoby`:'—');text('need',`${a.need} ks`);text('bought',`${a.bought} ks`);
 text('heroPacks',a.packs?`${a.packs} BALENÍ`:'—');text('heroNeed',`${a.need} ks`);text('heroBought',`${a.bought} ks`);text('heroLeft',`${a.left} ks`);text('heroUsage',`${Math.round(usage*10)/10} %`);$('heroMeter').style.width=Math.min(100,usage)+'%';
 text('answerTitle',a.packs?`${a.packs} celé balení${a.packs===1?'':'/í'} pokryjí celé období.`:'Doplňte vstupy.');text('answerText',a.packs?`Poslední balení se spotřebuje jen částečně; ${a.left} ks zůstává pro další období.`:'');
 text('runwayHeadline',a.packs?`${a.packs} balení přes ${days} dnů`:'—');text('runwayMetric',a.packDays?`1 balení ≈ ${Math.round(a.packDays*10)/10} dne`:'—');text('packDays',a.packDays?`${Math.round(a.packDays*10)/10} dne`:'—');text('lastUsed',a.packs?`${Math.round(lastUsed*10)/10} %`:'—');text('stockDays',daily?`${Math.round(leftDays*10)/10} dne`:'—');text('nextBuy',daily&&a.left?`za ~${Math.round(leftDays*10)/10} dne`:'hned');text('timelineEnd',`den ${days}`);renderTimeline(a,days);
 text('aPiece',a.piece?dec(a.piece)+' Kč':'—');text('aPacks',a.packs||'—');text('aSpend',a.packs?money(a.spend):'—');text('bPiece',b.piece?dec(b.piece)+' Kč':'—');text('bPacks',b.packs||'—');text('bSpend',b.packs?money(b.spend):'—');
 $('rowA').classList.remove('is-best');$('rowB').classList.remove('is-best');
 if(a.packs&&b.packs){const win=a.spend<=b.spend?'A':'B';$(win==='A'?'rowA':'rowB').classList.add('is-best');const pieceWin=a.piece<=b.piece?'A':'B';text('compareWinner',win===pieceWin?`${win} je levnější za kus i za celý nákup.`:`${pieceWin} má levnější kus, ale ${win} je levnější skutečný nákup.`);text('compareText',`Rozdíl za zvolené období je ${money(Math.abs(a.spend-b.spend))}.`)}
 text('slipStatus','živý přepočet');
}
['priceA','countA','daily','days','priceB','countB'].forEach(id=>$(id).addEventListener('input',render));
$$('[data-days]').forEach(b=>b.addEventListener('click',()=>{$('days').value=b.dataset.days;$$('[data-days]').forEach(x=>x.classList.toggle('active',x===b));render()}));
$('reset').addEventListener('click',()=>{$('priceA').value=449;$('countA').value=84;$('daily').value=7;$('days').value=30;$('priceB').value=529;$('countB').value=100;$$('[data-days]').forEach(x=>x.classList.toggle('active',x.dataset.days==='30'));render()});
$('copy').addEventListener('click',async()=>{const a=calc(num('priceA'),num('countA'),num('daily'),Math.max(1,Math.round(num('days')||30)));const s=`Pleny: ${a.packs} balení, ${money(a.spend)}, ${a.need} ks spotřeba, ${a.left} ks zůstane. RychléVýpočty.cz`;try{await navigator.clipboard.writeText(s);text('slipStatus','výsledek zkopírován')}catch(_){text('slipStatus','kopírování není dostupné')}});
const menu=document.querySelector('.menu'),mob=$('mobileNav');menu.addEventListener('click',()=>{const o=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!o));mob.hidden=o});
render();
})();