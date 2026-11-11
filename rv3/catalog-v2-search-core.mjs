/* Small pure search core shared by client and Node regression tests. */
const ignored=new Set(['jak','co','kolik','mi','me','se','si','mam','chci','potrebuji','spocitat','v','ve','z','ze','na','do','a','o','i','je','jsou','bude','by','pro','podle','kalkulacka','vypocet','kdy','aby','ted']);
export function normalizeCzech(value){
 return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('cs').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
// A typo is only a single substitution, insertion, deletion or adjacent swap.
// Applied as a fallback after exact search, never to short terms or partial words.
function oneTypo(a,b){
 if(a.length<5||b.length<4||Math.abs(a.length-b.length)>1||a===b)return false;
 if(a.length===b.length){
  const diff=[];
  for(let i=0;i<a.length;i++)if(a[i]!==b[i])diff.push(i);
  return diff.length===1||(diff.length===2&&diff[1]===diff[0]+1&&a[diff[0]]===b[diff[1]]&&a[diff[1]]===b[diff[0]]);
 }
 const [longer,shorter]=a.length>b.length?[a,b]:[b,a];
 let i=0,j=0,skipped=false;
 while(i<longer.length&&j<shorter.length){
  if(longer[i]===shorter[j]){i++;j++;continue}
  if(skipped)return false;
  skipped=true;i++;
 }
 return true;
}
export function rankTools(entries,query){
 const phrase=normalizeCzech(query);
 if(phrase.length<2)return [];
 const raw=phrase.split(' ').filter(Boolean);
 const tokens=raw.filter(t=>!ignored.has(t));
 // An all-stopword query ("kolik", "jak", "na") has no user intent.
 // Do not suggest arbitrary tools merely because their descriptions contain it.
 if(!tokens.length)return [];
 const useful=tokens;
 const prepared=entries.map((item,index)=>({
  item,index,name:normalizeCzech(item.title),desc:normalizeCzech(item.description||''),
  hay:normalizeCzech(item.search||''),alias:normalizeCzech(item.alias||'')
 }));
 function rank(allowTypo){
  return prepared.map(({item,index,name,desc,hay,alias})=>{
   let typoCount=0;
   for(const t of useful){
    if(name.includes(t)||alias.includes(t)||hay.includes(t)||desc.includes(t))continue;
    if(!allowTypo||typoCount||t.length<5)return null;
    // Match whole words only, not an arbitrary substring. This avoids noisy results.
    const words=new Set((name+' '+alias+' '+hay).split(' ').filter(w=>w.length>=4));
    if(![...words].some(w=>oneTypo(t,w)))return null;
    typoCount++;
   }
   if(allowTypo&&!typoCount)return null;
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
    else if(hay.includes(t))score+=8;
   }
   if(item.quick)score+=useful.length<=2?650:140;
   return {item,score:score-typoCount*100,index};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).map(r=>r.item);
 }
 const exact=rank(false);
 return exact.length?exact:rank(true);
}
