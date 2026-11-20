/* Guide search: source-derived DOM only, no requests, no tracking, no storage. */
(()=>{
 const q=document.getElementById('rv3g-query'),form=document.getElementById('rv3g-form');
 const status=document.getElementById('rv3g-status'),empty=document.getElementById('rv3g-empty');
 const clear=document.getElementById('rv3g-clear');
 const guides=[...document.querySelectorAll('[data-guide]')];
 const collections=[...document.querySelectorAll('[data-collection]')];
 if(!q||!form||!status||!empty||guides.length!==34)return;
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs-CZ').trim();
 function update(){
  const terms=norm(q.value).split(/\s+/).filter(Boolean);
  let visible=0;
  guides.forEach(g=>{const hay=norm(g.dataset.search);const ok=terms.every(t=>hay.includes(t));g.hidden=!ok;if(ok)visible++;});
  collections.forEach(section=>{section.hidden=![...section.querySelectorAll('[data-guide]')].some(el=>!el.hidden);});
  empty.hidden=visible!==0;
  status.textContent=terms.length?'Nalezeno '+visible+' z 34 návodů.':'34 praktických návodů';
 }
 q.addEventListener('input',update);
 form.addEventListener('submit',e=>{e.preventDefault();update();(collections.find(c=>!c.hidden)||empty).scrollIntoView({behavior:'smooth',block:'start'});});
 clear?.addEventListener('click',()=>{q.value='';update();q.focus();});
 update();
})();
