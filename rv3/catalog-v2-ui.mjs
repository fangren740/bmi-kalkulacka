/* Progressive enhancement of an otherwise browseable HTML directory. No network calls. */
import {rankTools} from './catalog-v2-search-core.mjs';
const input=document.getElementById('rv3d-search');
const panel=document.getElementById('rv3d-search-results');
const state=document.getElementById('rv3d-search-state');
const results=document.getElementById('rv3d-suggestions');
const more=document.getElementById('rv3d-more-results');
const clear=document.getElementById('rv3d-clear');
const noResults=document.getElementById('rv3d-no-results');
if(input&&panel&&state&&results&&more&&clear&&noResults){
 const source=Array.from(document.querySelectorAll('[data-v3-tool]'));
 const quick=new Set(Array.from(document.querySelectorAll('.rv3d-quick a[href]')).map(a=>a.getAttribute('href')));
 const items=source.map(a=>({
  href:a.getAttribute('href'),title:a.dataset.title||a.textContent.trim(),
  description:a.dataset.description||'',search:a.dataset.search||'',category:a.dataset.category||'',
  quick:quick.has(a.getAttribute('href'))
 }));
 const categoryNames=new Map(Array.from(document.querySelectorAll('[data-v3-category]')).map(node=>
   [node.dataset.v3Category,node.querySelector('.rv3d-domain-identity strong')?.textContent||'']));
 let matches=[],limit=6;
 const create=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
 };
 function close(){
  panel.hidden=true;
  input.setAttribute('aria-expanded','false');
 }
 function paint(){
  results.replaceChildren();
  const fragment=document.createDocumentFragment();
  for(const item of matches.slice(0,limit)){
   const li=create('li','rv3d-result');
   const a=create('a','rv3d-result-link');
   a.href=item.href;
   a.append(create('span','rv3d-result-title',item.title));
   const meta=create('span','rv3d-result-meta',categoryNames.get(item.category)||'Kalkulačka');
   a.append(meta);
   a.append(create('span','rv3d-result-arrow','↗'));
   li.append(a);fragment.append(li);
  }
  results.append(fragment);
  more.hidden=matches.length<=limit;
  if(!more.hidden)more.textContent='Zobrazit dalších '+Math.min(6,matches.length-limit)+' výsledků';
  noResults.hidden=matches.length!==0;
  state.textContent=matches.length?matches.length+' odpovídajících kalkulaček':'Žádná shoda';
 }
 function update(){
  const value=input.value.trim();
  if(value.length<2){matches=[];close();return}
  matches=rankTools(items,value);
  limit=6;paint();
  panel.hidden=false;input.setAttribute('aria-expanded','true');
 }
 function reset(){
  input.value='';matches=[];close();input.focus();
 }
 input.addEventListener('input',update);
 more.addEventListener('click',()=>{limit+=6;paint()});
 clear.addEventListener('click',reset);
 document.querySelectorAll('[data-v3-query]').forEach(button=>{
  button.addEventListener('click',()=>{input.value=button.dataset.v3Query||'';input.focus();update()});
 });
 input.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'&&!panel.hidden){
   const first=results.querySelector('a');if(first){event.preventDefault();first.focus()}
  }
  if(event.key==='Enter'&&!panel.hidden&&matches.length){
   const first=results.querySelector('a');if(first){event.preventDefault();first.click()}
  }
  if(event.key==='Escape'){event.preventDefault();reset()}
 });
 panel.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();reset();return}
  if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
  const links=Array.from(results.querySelectorAll('a'));
  const index=links.indexOf(document.activeElement);
  if(event.key==='ArrowUp'&&index===0){event.preventDefault();input.focus();return}
  const next=links[index+(event.key==='ArrowDown'?1:-1)];
  if(next){event.preventDefault();next.focus()}
 });
 document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
   event.preventDefault();input.focus();input.select();
  }
 });
 document.addEventListener('pointerdown',event=>{
  if(!event.target.closest('.rv3d-find'))close();
 });
}
