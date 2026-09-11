(()=>{
'use strict';
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const cfg={
  'procenta-kalkulacka.html':{mark:'% / V7',risk:'M0',method:'Matematika ověřena 11. 9. 2026',disclaimer:''},
  'kalkulacka-celkove-ceny-vlastnictvi-auta.html':{mark:'TCO / V7',risk:'M2',method:'Model a vzorce zkontrolovány 11. 9. 2026',disclaimer:'Výsledek je model pro vaše zadané předpoklady. Není oceněním vozidla, nabídkou financování ani garancí budoucí prodejní ceny, servisu nebo provozních nákladů.'},
  'kalkulacka-hodinove-mzdy.html':{mark:'KČ/H / V7',risk:'M1',method:'Metodika zkontrolována 11. 9. 2026',disclaimer:'Hodinová hodnota je analytický podíl zadaného příjmu a času. Není automaticky pracovněprávním průměrným výdělkem. Hranice minimální mzdy 134,40 Kč/h pro rok 2026 platí pro stanovenou týdenní pracovní dobu 40 hodin; u zákonně kratších režimů se hodinové minimum přepočítává.'},
  'kalkulacka-dovolene.html':{mark:'VOLNO / V7',risk:'M3',method:'Pravidla dovolené ověřena 11. 9. 2026',disclaimer:'Kalkulačka je kontrolní pomůcka. Přesný nárok závisí na evidenci zaměstnavatele, rozvrhu směn, započitatelných náhradních dobách a konkrétním průběhu pracovněprávního vztahu.',sources:[['MPSV · Zákoník práce','https://ppropo.mpsv.cz/zakon_262_2006'],['MPSV · Dovolená','https://mpsv.gov.cz/slovnik-pojmu-dovolena']]},
  'kalkulacka-prescasu.html':{mark:'+25% / V7',risk:'M3',method:'Pravidla přesčasů ověřena 11. 9. 2026',disclaimer:'Jde o orientační kontrolu. Konkrétní vyrovnání závisí na evidenci pracovní doby, průměrném výdělku, režimu mzda/plat, smluvních ujednáních a na tom, zda zadané hodiny skutečně splňují definici práce přesčas.',sources:[['MPSV · Práce přesčas','https://ppropo.mpsv.cz/VIII5Praceprescas'],['MPSV · Zákoník práce','https://ppropo.mpsv.cz/zakon_262_2006']]},
  'cestovni-nahrady-kalkulacka.html':{mark:'TRIP / V7',risk:'M3',method:'Sazby a pravidla ověřeny 11. 9. 2026',disclaimer:'Výsledek je orientační kontrola cestovních náhrad podle zadaných údajů. Nenahrazuje cestovní příkaz, interní směrnici, účetní kontrolu dokladů ani individuální pracovněprávní posouzení.'}
}[page];
if(!cfg)return;

function ensureBrandCss(){
  if(!document.querySelector('link[href*="rv-brand-v32.css"]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='/rv-brand-v32.css?v=20260801-stable';document.head.appendChild(l);
  }
}
function addRuntimeCss(){
  if(document.getElementById('rv-finish-runtime-css'))return;
  const s=document.createElement('style');s.id='rv-finish-runtime-css';s.textContent=`
    body.rv-brand-v32{--rv-finish-border:#d8e5ed;--rv-finish-ink:#0b2545;--rv-finish-muted:#526579;--rv-finish-green:#15866d}
    .rv-finish-watermark{position:relative;isolation:isolate;overflow:hidden}
    .rv-finish-watermark::after{content:attr(data-rv-watermark);position:absolute;right:clamp(-1rem,2vw,2rem);top:50%;transform:translateY(-50%) rotate(-8deg);font-size:clamp(5rem,12vw,12rem);font-weight:900;letter-spacing:-.07em;line-height:.8;color:currentColor;opacity:.028;pointer-events:none;white-space:nowrap;z-index:0}
    .rv-finish-watermark>*{position:relative;z-index:1}
    .rv-finish-trust{margin:18px 0 0;padding:16px 18px;border:1px solid var(--rv-finish-border);border-radius:16px;background:#f7fbfd;color:var(--rv-finish-ink);font-size:15px;line-height:1.55}
    .rv-finish-trust strong{display:block;margin-bottom:4px;font-size:15px}
    .rv-finish-trust p{margin:0;color:var(--rv-finish-muted)}
    .rv-finish-trust a{font-weight:700;color:#0b67b2;text-decoration-thickness:1px;text-underline-offset:3px}
    .rv-finish-method-chip{display:inline-flex;align-items:center;gap:7px;margin:0 0 8px;padding:6px 10px;border-radius:999px;background:#e7f7f2;color:#0c6a56;font-size:12px;font-weight:800;letter-spacing:.02em}
    .rv-finish-method-chip::before{content:'✓';font-weight:900}
    .rv-finish-sources{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .rv-finish-sources a{display:inline-flex;min-height:38px;align-items:center;padding:7px 10px;border:1px solid #cfe0e9;border-radius:10px;background:#fff;font-size:13px}
    .rv-finish-socials{display:flex;align-items:center;gap:10px;margin-top:16px}
    .rv-finish-socials a{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid rgba(255,255,255,.25);border-radius:12px;color:inherit;text-decoration:none;transition:transform .18s ease,border-color .18s ease}
    .rv-finish-socials a:hover{transform:translateY(-1px);border-color:currentColor}
    .rv-finish-socials svg{width:20px;height:20px;display:block}
    @media(max-width:640px){.rv-finish-trust{font-size:14px;padding:14px 15px}.rv-finish-watermark::after{font-size:clamp(4.5rem,28vw,8rem);right:-1.5rem;opacity:.023}}
    @media(prefers-reduced-motion:reduce){.rv-finish-socials a{transition:none}}
  `;document.head.appendChild(s);
}
function normaliseIdentity(){
  document.body.classList.add('rv-brand-v3','rv-brand-v32');
  const h=document.querySelector('header');
  const hi=h&&h.querySelector('a[href="/"],a[href="/index.html"],.brand,.mrp-logo,.vpc-brand,.brand-logo,.rv-logo');
  const himg=hi&&hi.querySelector('img');
  if(himg){himg.src='/logo-rv-v32.svg?v=1';himg.width=295;himg.height=48;himg.alt='';himg.decoding='async';hi.classList.add('rv-logo');if(!hi.getAttribute('aria-label'))hi.setAttribute('aria-label','RychléVýpočty.cz – domů')}
  const f=document.querySelector('footer');
  if(f){f.classList.add('rv-brand-footer');const fa=f.querySelector('a[href="/"],.footer-brand a,.mrp-footer__brand a,.vpc-brand');const fi=fa&&fa.querySelector('img');if(fi){fi.src='/logo-rv-v32-inverse.svg?v=1';fi.width=295;fi.height=48;fi.alt='';fi.decoding='async';fa.classList.add('rv-logo','rv-logo--inverse');if(!fa.getAttribute('aria-label'))fa.setAttribute('aria-label','RychléVýpočty.cz – domů')}}
}
function heroIdentity(){
  const hero=document.querySelector('main section[class*="hero"],main .hero-section,main .rv-identity-hero');
  if(!hero)return;hero.classList.add('rv-identity-hero','rv-finish-watermark');hero.dataset.rvWatermark=cfg.mark;
}
function socialIcons(){
  const f=document.querySelector('footer');if(!f||f.querySelector('a[href*="facebook.com/rychlevypocty"]'))return;
  const host=f.querySelector('.footer-brand,.mrp-footer__brand,.vpc-footer__grid>div:first-child,.footer-grid>div:first-child')||f.firstElementChild||f;
  const box=document.createElement('div');box.className='rv-finish-socials';box.setAttribute('role','group');box.setAttribute('aria-label','RychléVýpočty.cz na sociálních sítích');
  box.innerHTML=`<a href="https://www.facebook.com/rychlevypocty" aria-label="RychléVýpočty.cz na Facebooku" rel="me noopener"><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M13.7 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5H17V4.9c-.3 0-1.3-.1-2.4-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.6v3h2.8v8h3.3z"/></svg></a><a href="https://www.instagram.com/rychlevypocty/" aria-label="RychléVýpočty.cz na Instagramu" rel="me noopener"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg></a>`;
  host.appendChild(box);
}
function trustBlock(){
  if(document.querySelector('[data-rv-finish-trust="1"]'))return;
  let target=document.querySelector('#vysledek,.result-panel,.result-card,.result-section,[class*="result-card"],[class*="result-panel"]');
  if(!target)target=document.querySelector('#kalkulacka');
  if(!target)return;
  const box=document.createElement('aside');box.className='rv-finish-trust';box.dataset.rvFinishTrust='1';box.setAttribute('aria-label','Metodika a omezení výsledku');
  let html=`<span class="rv-finish-method-chip">${cfg.method}</span>`;
  if(cfg.disclaimer)html+=`<strong>Co je důležité vědět</strong><p>${cfg.disclaimer}</p>`;
  if(cfg.sources?.length)html+=`<div class="rv-finish-sources">${cfg.sources.map(([t,u])=>`<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join('')}</div>`;
  box.innerHTML=html;
  target.appendChild(box);
}
function enhanceTablists(){
  document.querySelectorAll('[role="tablist"]').forEach(list=>{
    const tabs=[...list.querySelectorAll(':scope > [role="tab"]')];
    if(!tabs.length)return;
    const sync=()=>{
      const active=tabs.find(t=>t.classList.contains('is-active'))||tabs.find(t=>t.getAttribute('aria-selected')==='true')||tabs[0];
      tabs.forEach(t=>{const on=t===active;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;});
    };
    tabs.forEach((tab,index)=>{
      tab.addEventListener('click',()=>requestAnimationFrame(sync));
      tab.addEventListener('keydown',e=>{
        let next=-1;
        if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(index+1)%tabs.length;
        if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(index-1+tabs.length)%tabs.length;
        if(e.key==='Home')next=0;
        if(e.key==='End')next=tabs.length-1;
        if(next<0)return;
        e.preventDefault();tabs[next].focus();tabs[next].click();
      });
      new MutationObserver(()=>requestAnimationFrame(sync)).observe(tab,{attributes:true,attributeFilter:['class']});
    });
    sync();
  });
}
function pageSpecificFixes(){
  if(page==='kalkulacka-prescasu.html'){
    const input=document.getElementById('overtimeHours');const field=input&&input.closest('.field');const small=field&&field.querySelector('small');
    if(small)small.textContent='Zadejte jen hodiny, které skutečně splňují definici práce přesčas. U kratší pracovní doby není samotné překročení sjednaného kratšího úvazku automaticky přesčasem.';
  }
}
function init(){ensureBrandCss();addRuntimeCss();normaliseIdentity();heroIdentity();socialIcons();trustBlock();pageSpecificFixes();enhanceTablists();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
