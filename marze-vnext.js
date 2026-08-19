
(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const nf=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
const pf=new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1});
const money=n=>Number.isFinite(n)?nf.format(Math.round(n))+' Kč':'—';
const pct=n=>Number.isFinite(n)?pf.format(n)+' %':'—';
const num=v=>{const n=Number(String(v).replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0};
const state={mode:'analyse',targetType:'margin'};
const ids=['cost','price','targetPct']; const el=Object.fromEntries(ids.map(id=>[id,$('#'+id)]));
function values(){
 let cost=Math.max(0,num(el.cost.value)), price=Math.max(0,num(el.price.value)), target=Math.max(0,num(el.targetPct.value));
 if(state.mode==='target'){
   if(state.targetType==='margin') price=target>=100?Infinity:cost/(1-target/100);
   else price=cost*(1+target/100);
 }
 const profit=price-cost, margin=price>0?profit/price*100:0, markup=cost>0?profit/cost*100:0;
 return {cost,price,target,profit,margin,markup};
}
function render(){
 const v=values();
 $('#priceField').hidden=state.mode!=='analyse'; $('#targetFields').hidden=state.mode!=='target';
 $('#primaryLabel').textContent=state.mode==='analyse'?'Zisk na jeden prodej':'Potřebná prodejní cena';
 $('#primaryValue').textContent=state.mode==='analyse'?money(v.profit):money(v.price);
 $('#profitMetric').textContent=money(v.profit); $('#marginMetric').textContent=pct(v.margin); $('#markupMetric').textContent=pct(v.markup); $('#priceMetric').textContent=money(v.price);
 const per100=v.margin; $('#meaningText').textContent=v.price>0?`Z každých 100 Kč tržby po odečtení zadaného nákladu zůstává ${pf.format(per100)} Kč. Teprve z této částky se hradí další náklady a vzniká skutečný zisk.`:'Zadejte kladnou cenu.';
 $('#resultSentence').textContent=state.mode==='analyse'?`Cena ${money(v.price)} minus náklad ${money(v.cost)}.`:`Při nákladu ${money(v.cost)} a cíli ${pct(v.target)}.`;
 // 100 Kč board
 const cshare=v.price>0?Math.max(0,Math.min(100,v.cost/v.price*100)):0, pshare=Math.max(0,100-cshare);
 $('#hundredCost').style.width=cshare+'%'; $('#hundredProfit').style.width=pshare+'%'; $('#hundredCostText').textContent=pf.format(cshare)+' Kč'; $('#hundredProfitText').textContent=pf.format(pshare)+' Kč';
 $('#markupExplain').textContent=v.cost>0?`Stejný zisk je zároveň ${pf.format(v.markup)} % z nákladu. Proto marže ${pf.format(v.margin)} % a přirážka ${pf.format(v.markup)} % nejsou stejné číslo.`:'—';
 renderDiscount(v);
}
function renderDiscount(v){
 const d=Number($('#discount').value)||0; $('#discountOut').textContent=d+' %';
 const newPrice=v.price*(1-d/100), newProfit=newPrice-v.cost, newMargin=newPrice>0?newProfit/newPrice*100:0, maxDisc=v.price>0?Math.max(0,Math.min(100,v.profit/v.price*100)):0;
 $('#discountPrice').textContent=money(newPrice); $('#discountProfit').textContent=money(newProfit); $('#discountMargin').textContent=pct(newMargin); $('#maxDiscount').textContent=pct(maxDisc);
 $('#runway').style.setProperty('--runway',maxDisc+'%');
 $('#discountMessage').textContent=newProfit<0?'Při této slevě už je cena pod zadaným nákladem.':newProfit===0?'Při této slevě jste přesně na zadaném jednotkovém nákladu.':`Po slevě zůstává ${money(newProfit)} na prodej před dalšími náklady.`;
}
$$('.mode-btn').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;$$('.mode-btn').forEach(x=>{x.classList.toggle('is-active',x===b);x.setAttribute('aria-pressed',x===b?'true':'false')});render()}));
$$('.target-type button').forEach(b=>b.addEventListener('click',()=>{state.targetType=b.dataset.targetType;$$('.target-type button').forEach(x=>{x.classList.toggle('is-active',x===b);x.setAttribute('aria-pressed',x===b?'true':'false')});$('#targetLabel').textContent=state.targetType==='margin'?'Cílová marže':'Cílová přirážka';render()}));
ids.forEach(id=>el[id].addEventListener('input',render)); $('#discount').addEventListener('input',()=>renderDiscount(values()));
$('#marginForm').addEventListener('submit',e=>{e.preventDefault();render()});
$('#resetBtn').addEventListener('click',()=>{el.cost.value='600';el.price.value='1000';el.targetPct.value='30';$('#discount').value='20';state.mode='analyse';state.targetType='margin';$$('.mode-btn').forEach(x=>{const on=x.dataset.mode==='analyse';x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',on?'true':'false')});$$('.target-type button').forEach(x=>{const on=x.dataset.targetType==='margin';x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',on?'true':'false')});render()});
const menu=$('.menu-toggle'),nav=$('.main-nav');if(menu&&nav){menu.addEventListener('click',()=>{const o=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!o));nav.classList.toggle('is-open',!o)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}})}
render();
})();
