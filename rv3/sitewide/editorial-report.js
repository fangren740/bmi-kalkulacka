/* RV3 Redakcni zasady — user's own e-mail client, not a server form.
 * Never silently sends, stores, fetches, or transmits personal information.
 */
export const REPORT_EMAIL='rychlevypocty@seznam.cz';
export const REPORT_TYPES=Object.freeze([
 'Chybný výpočet','Neaktuální údaj nebo zdroj','Nejasné vysvětlení','Návrh na nové téma'
]);

export function createReportMailto({type,page,detail}){
 if(!REPORT_TYPES.includes(type))throw new TypeError('Invalid issue category');
 if(typeof page!=='string'||!page.trim()||page.length>250)throw new TypeError('Missing or invalid page');
 if(typeof detail!=='string'||!detail.trim()||detail.length>1800)throw new TypeError('Missing or invalid description');
 const subject='RychléVýpočty.cz — '+type;
 const body=[
  'Typ připomínky: '+type,
  'Stránka: '+page.trim(),
  '',
  'Popis problému / očekávaný výsledek:',
  detail.trim(),
  '',
  'Zprávu odesílá uživatel sám ze svého e-mailového klienta.'
 ].join('\n');
 return 'mailto:'+REPORT_EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
export function mountEditorialReport(form,navigate){
 if(!form)return false;
 const type=form.querySelector('[name="type"]');
 const page=form.querySelector('[name="page"]');
 const detail=form.querySelector('[name="detail"]');
 const status=form.querySelector('[data-editorial-status]');
 if(!type||!page||!detail||!status)throw new Error('Editorial report form is incomplete');
 if(typeof navigate!=='function')throw new TypeError('Navigation callback missing');
 form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const href=createReportMailto({type:type.value,page:page.value,detail:detail.value});
   status.textContent='Zpráva je připravená. Její odeslání potvrďte ve své e-mailové aplikaci.';
   // Only a user-triggered submit opens the user's mail app. No auto-send.
   navigate(href);
  }catch(error){
   status.textContent='Doplňte prosím typ připomínky, stránku a popis problému.';
  }
 });
 return true;
}
if(typeof document!=='undefined'){
 const form=document.querySelector('[data-editorial-report]');
 if(form)mountEditorialReport(form,url=>{window.location.href=url;});
}
