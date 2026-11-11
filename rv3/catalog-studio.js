/* Progressive enhancement: all 135 tools stay visible without JavaScript. No network request. */
(()=>{
 'use strict';
 const input=document.getElementById('rv3c-search');
 const status=document.getElementById('rv3c-status');
 const empty=document.getElementById('rv3c-empty');
 const reset=document.getElementById('rv3c-reset');
 if(!input||!status||!empty||!reset)return;
 const cards=Array.from(document.querySelectorAll('[data-tool-card]'));
 const groups=Array.from(document.querySelectorAll('[data-group]'));
 const filters=Array.from(document.querySelectorAll('[data-filter]'));
 let current='all';
 const normalize=value=>String(value||'').toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
 const index=cards.map(el=>({el,group:el.dataset.category,text:normalize(el.dataset.search||'')}));
 function apply(){
  const terms=normalize(input.value).split(' ').filter(Boolean);
  let count=0;
  for(const item of index){
    const matching=(current==='all'||current===item.group)&&terms.every(term=>item.text.includes(term));
    item.el.hidden=!matching;
    if(matching)count++;
  }
  for(const group of groups){
    group.hidden=!Array.from(group.querySelectorAll('[data-tool-card]')).some(el=>!el.hidden);
  }
  for(const button of filters)button.setAttribute('aria-pressed',String(button.dataset.filter===current));
  status.textContent='Zobrazeno '+count+' z '+cards.length+' nástrojů';
  empty.hidden=count!==0;
 }
 input.addEventListener('input',apply);
 filters.forEach(button=>button.addEventListener('click',()=>{current=button.dataset.filter||'all';apply()}));
 reset.addEventListener('click',()=>{input.value='';current='all';apply();input.focus()});
 document.addEventListener('keydown',event=>{
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
     event.preventDefault();input.focus();input.select();
   }
   if(event.key==='Escape'&&document.activeElement===input&&input.value){
     input.value='';apply();
   }
 });
 apply();
})();
