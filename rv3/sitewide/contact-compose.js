/* RV3 Contact Studio / no server API, no analytics and no auto-submission.
 * All data stays in the browser until the user opens their own mail app.
 */
export const CONTACT_EMAIL='rychlevypocty@seznam.cz';
export const CONTACT_TYPES=Object.freeze([
 'Chyba ve výpočtu','Neaktuální zdroj','Návrh nástroje','Obecný dotaz'
]);
export const CONTACT_HINTS=Object.freeze({
 'Chyba ve výpočtu':Object.freeze(['Odkaz na kalkulačku','Konkrétní zadané hodnoty','Co vyšlo a co očekáváte']),
 'Neaktuální zdroj':Object.freeze(['Odkaz na stránku','Novější právní pravidlo nebo podklad','Od kdy je údaj platný']),
 'Návrh nástroje':Object.freeze(['Co by měl nástroj vypočítat','Kdy by vám pomáhal','Jaké vstupy by potřeboval']),
 'Obecný dotaz':Object.freeze(['Čeho se otázka týká','Případný odkaz na stránku','Co potřebujete vysvětlit'])
});

export function createContactMailto({type,page='',detail}){
 if(!CONTACT_TYPES.includes(type))throw new TypeError('Invalid contact category');
 if(typeof page!=='string'||page.length>250)throw new TypeError('Invalid page link');
 if(typeof detail!=='string'||!detail.trim()||detail.length>1800)
  throw new TypeError('Message is required (max 1800 characters)');
 const subject='RychléVýpočty.cz — '+type;
 const body=[
  'Typ podnětu: '+type,
  'Stránka: '+(page.trim()||'Neuvedena'),
  '',
  'Zpráva:',
  detail.trim()
 ].join('\n');
 return 'mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}

export function mountContactComposer(form,navigate){
 if(!form)return false;
 if(typeof navigate!=='function')throw new TypeError('Contact navigation callback required');
 const types=[...form.querySelectorAll('[name="type"]')];
 const page=form.querySelector('[name="page"]');
 const detail=form.querySelector('[name="detail"]');
 const tips=form.querySelector('[data-contact-tips]');
 const guidance=form.querySelector('[data-contact-guidance]');
 const status=form.querySelector('[data-contact-status]');
 if(types.length!==4||!page||!detail||!tips||!guidance||!status)
  throw new Error('Contact composer markup incomplete');
 function selectedType(){
  const selected=types.find(type=>type.checked);
  return selected?.value;
 }
 function renderTips(){
  const type=selectedType();
  if(!CONTACT_TYPES.includes(type))return;
  // Text-only values from immutable local constants; never HTML from user input.
  tips.replaceChildren(...CONTACT_HINTS[type].map(message=>{
   const item=tips.ownerDocument.createElement('li');
   item.textContent=message;
   return item;
  }));
  guidance.textContent={
   'Chyba ve výpočtu':'Uveďte odkaz na kalkulačku, vstupní hodnoty a očekávaný výsledek.',
   'Neaktuální zdroj':'Pošlete odkaz a pokud možno novější předpis, datum nebo metodiku.',
   'Návrh nástroje':'Popište, jakou situaci by měl nový nástroj řešit.',
   'Obecný dotaz':'Napište, co vás zajímá nebo co bychom mohli vysvětlit lépe.'
  }[type];
  status.textContent='';
 }
 for(const input of types)input.addEventListener('change',renderTips);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const mailto=createContactMailto({type:selectedType(),page:page.value,detail:detail.value});
   status.textContent='Zpráva je připravená. Odeslání potvrďte v e-mailové aplikaci.';
   // Only a user-initiated submit can hand off to the e-mail client.
   navigate(mailto);
  }catch{
   status.textContent='Zkontrolujte prosím typ podnětu a vyplňte zprávu.';
  }
 });
 return true;
}

export function mountCopyContact(button,writeText){
 if(!button)return false;
 const status=button.closest('.rv3c-email-card')?.querySelector('[data-copy-status]');
 if(!status)throw new Error('Copy feedback missing');
 button.addEventListener('click',async()=>{
  try{
   await writeText(CONTACT_EMAIL);
   status.textContent='E-mailová adresa byla zkopírována.';
  }catch{
   status.textContent='Kopírování se nezdařilo. Adresu můžete označit a zkopírovat ručně.';
  }
 });
 return true;
}
if(typeof document!=='undefined'){
 const form=document.querySelector('[data-contact-compose]');
 if(form)mountContactComposer(form,url=>{window.location.href=url});
 const copy=document.querySelector('[data-copy-contact]');
 if(copy)mountCopyContact(copy,text=>navigator.clipboard.writeText(text));
}
