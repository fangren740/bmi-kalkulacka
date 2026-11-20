/* Progressive enhancement only. All 28 decisions remain linked and accessible without JS. */
(()=>{
 const input=document.getElementById('rv3s-query');
 const form=document.getElementById('rv3s-search-form');
 const count=document.getElementById('rv3s-count');
 const reset=document.getElementById('rv3s-reset');
 const empty=document.getElementById('rv3s-empty');
 const emptyReset=document.getElementById('rv3s-empty-reset');
 const topics=[...document.querySelectorAll('[data-filter]')];
 const groups=[...document.querySelectorAll('[data-group-section]')];
 const cards=[...document.querySelectorAll('[data-situation]')];
 if(!input||!form||!count||!reset||!empty||cards.length!==28||groups.length!==7)return;
 let selected='';
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs-CZ').trim();
 function apply(){
  const terms=normalize(input.value).split(/\s+/).filter(Boolean);
  let visible=0;
  for(const card of cards){
   const hay=normalize(card.dataset.search);
   const match=(!selected||card.dataset.group===selected)&&terms.every(t=>hay.includes(t));
   card.hidden=!match;
   if(match)visible++;
  }
  for(const section of groups)
   section.hidden=![...section.querySelectorAll('[data-situation]')].some(c=>!c.hidden);
  topics.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.filter===selected)));
  reset.hidden=!selected&&!terms.length;
  empty.hidden=visible!==0;
  count.textContent=visible===0?'Žádná shoda. Zkuste jiný dotaz.':
   'Zobrazeno '+visible+' z 28 situací'+(selected||terms.length?' pro váš výběr.':'.');
 }
 function clear(){selected='';input.value='';apply();}
 topics.forEach(btn=>btn.addEventListener('click',()=>{
  selected=selected===btn.dataset.filter?'':btn.dataset.filter;
  apply();
  const first=groups.find(g=>!g.hidden);if(first)first.scrollIntoView({behavior:'smooth',block:'start'});
 }));
 input.addEventListener('input',apply);
 form.addEventListener('submit',e=>{e.preventDefault();apply();if(!empty.hidden)empty.focus?.();else groups.find(g=>!g.hidden)?.scrollIntoView({behavior:'smooth',block:'start'});});
 reset.addEventListener('click',clear);
 emptyReset?.addEventListener('click',clear);
 apply();
})();
