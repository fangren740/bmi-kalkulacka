/* RV3 privacy URL inspector. Local-only structural test, not a privacy guarantee.
 * Never fetch, navigate, store, log or display user-entered URL values.
 */
export function inspectSharedUrl(raw){
 if(typeof raw!=='string'||!raw.trim()||raw.length>2048)
  throw new TypeError('Enter an address up to 2048 characters');
 const value=raw.trim();
 if(!/^https?:\/\//i.test(value)&&!(value.startsWith('/')&&!value.startsWith('//')))
  throw new TypeError('Enter an HTTP(S) link or a relative path beginning with /');
 let address;
 try{address=new URL(value,'https://rychlevypocty.cz/')}
 catch{throw new TypeError('Invalid URL syntax')}
 if(!['http:','https:'].includes(address.protocol)||!address.hostname)
  throw new TypeError('Only HTTP(S) links are supported');
 const parameters=[...address.searchParams].length;
 const fragment=address.hash.length>0;
 return Object.freeze({
  parameters,fragment,
  hasEmbeddedState:parameters>0||fragment,
  // This is intentionally a *structure check*, not a content or safety check.
  message:parameters>0||fragment
   ?'Pozor: odkaz obsahuje '+parameters+' '+(parameters===1?'parametr':parameters>=2&&parameters<=4?'parametry':'parametrů')+
    (fragment?' a část za znakem #':'')+
    '. Mohou obsahovat zadané hodnoty. Před sdílením pečlivě zkontrolujte celou adresu.'
   :'V adrese nejsou parametry ani část za znakem #. To samo o sobě neznamená, že je odkaz bezpečný ke sdílení.'
 });
}
export function mountUrlInspector(root){
 if(!root)return false;
 const input=root.querySelector('[data-url-value]');
 const check=root.querySelector('[data-url-check]');
 const clear=root.querySelector('[data-url-clear]');
 const result=root.querySelector('[data-url-result]');
 if(!input||!check||!clear||!result)
  throw new Error('Privacy inspector markup incomplete');
 function verify(){
  try{
   const report=inspectSharedUrl(input.value);
   result.textContent=report.message;
   result.dataset.state=report.hasEmbeddedState?'review':'neutral';
  }catch{
   result.textContent='Zadejte platný odkaz začínající https://, http:// nebo / (maximálně 2 048 znaků).';
   result.dataset.state='invalid';
  }
 }
 check.addEventListener('click',verify);
 input.addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();verify();}
 });
 clear.addEventListener('click',()=>{
  input.value='';
  result.textContent='Adresa byla vymazána. Obsah nebyl nikam odeslán.';
  result.dataset.state='neutral';
  input.focus();
 });
 return true;
}
if(typeof document!=='undefined'){
 const root=document.querySelector('[data-url-inspector]');
 if(root)mountUrlInspector(root);
}