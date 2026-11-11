/* Small pure search core shared by client and Node regression tests. */
const ignored=new Set(['jak','co','kolik','mi','me','se','si','mam','chci','potrebuji','spocitat','v','ve','z','ze','na','do','a','o','i','je','jsou','bude','by','pro','podle','kalkulacka','vypocet','kdy','aby','ted']);
export function normalizeCzech(value){
 return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('cs').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
export function rankTools(entries,query){
 const phrase=normalizeCzech(query);
 if(phrase.length<2)return [];
 const raw=phrase.split(' ').filter(Boolean);
 const tokens=raw.filter(t=>!ignored.has(t));
 const useful=tokens.length?tokens:raw;
 return entries.map((item,index)=>{
   const name=normalizeCzech(item.title),desc=normalizeCzech(item.description||''),
    hay=normalizeCzech(item.search||''),alias=normalizeCzech(item.alias||'');
   if(!useful.every(t=>name.includes(t)||alias.includes(t)||hay.includes(t)||desc.includes(t)))return null;
   let score=0;
   if(name===phrase)score+=750;
   if(name.startsWith(phrase))score+=350;
   if(name.includes(phrase))score+=220;
   if(alias.includes(phrase))score+=180;
   for(const t of useful){
     if(name.split(' ').includes(t))score+=110;
     else if(name.includes(t))score+=75;
     else if(alias.includes(t))score+=55;
     else if(desc.includes(t))score+=20;
     else score+=8;
   }
   // Direct, editorially selected calculator wins generic searches over related explainers.
   if(item.quick)score+=300;
   return {item,score,index};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).map(r=>r.item);
}
