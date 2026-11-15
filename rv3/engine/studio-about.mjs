/* RV3 ABOUT / product-studio rewrite from a blank page.
   Deliberately does NOT reuse the old <main>, trust-nav, cards or hero.
   The old page is read only to validate identity, contact and SEO provenance.
   Never replaces /o-nas.html in production. */
import {createHash} from 'node:crypto';
import {getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const sourceRoute='o-nas.html';
const canonical='https://rychlevypocty.cz/o-nas.html';
const email='rychlevypocty@seznam.cz';
const name='Martin Šilinger';
const originalTitle='O projektu | RychléVýpočty.cz';
const description='Kdo provozuje RychléVýpočty.cz, proč projekt vznikl a jak vznikají jeho kalkulačky.';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sha=s=>createHash('sha256').update(s).digest('hex');

export function renderAboutStudio(source){
  if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Invalid source page');
  if(getCanonical(source)!==canonical)throw Error('Unexpected canonical');
  if(!source.includes('<title>'+originalTitle+'</title>')||
     !source.includes('content="'+description+'"'))throw Error('SEO identity mismatch');
  if(!source.includes('<meta name="robots" content="index,follow">'))throw Error('Source robots mismatch');
  if(!source.includes('>'+name+'</span>')||
     !source.includes('bez přiděleného IČO')||
     !source.includes('mailto:'+email))throw Error('Missing verified operator facts');
  if(!source.includes('https://www.facebook.com/rychlevypocty')||
     !source.includes('https://www.instagram.com/rychlevypocty/'))throw Error('Missing verified social links');
  const structuredData=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  if(!structuredData)throw Error('Source structured data missing');
  const graph=JSON.parse(structuredData);
  if(!Array.isArray(graph?.['@graph'])||!graph['@graph'].some(x=>x['@type']==='WebPage'&&x.url===canonical))throw Error('Structured data mismatch');
  const visual=String.raw`
  <div class="rv3a-visual" aria-label="Ukázka cesty od otázky přes zadání k výsledku">
    <div class="rv3a-visual-top"><span>RYCHLÉVÝPOČTY / PRINCIP</span><span class="rv3a-visual-dot" aria-hidden="true"></span></div>
    <div class="rv3a-visual-card">
      <span class="rv3a-vnum">01 / OTÁZKA</span>
      <strong>Kolik mi opravdu zůstane?</strong>
      <p>Začínáme tím, co člověk potřebuje zjistit.</p>
    </div>
    <div class="rv3a-visual-connector" aria-hidden="true"><span></span>↓<span></span></div>
    <div class="rv3a-visual-card rv3a-visual-middle">
      <span class="rv3a-vnum">02 / VSTUPY A PRAVIDLA</span>
      <div class="rv3a-mini-fields" aria-hidden="true"><i></i><i></i><i></i></div>
      <p>Jen údaje, které jsou pro výpočet relevantní.</p>
    </div>
    <div class="rv3a-visual-connector" aria-hidden="true"><span></span>↓<span></span></div>
    <div class="rv3a-visual-card rv3a-visual-result">
      <span class="rv3a-vnum">03 / VÝSLEDEK A SOUVISLOSTI</span>
      <strong>Číslo. Vysvětlení. Další krok.</strong>
      <p>Bez falešné jistoty tam, kde jde jen o odhad.</p>
    </div>
    <span class="rv3a-visual-foot">Ilustrace postupu · není to skutečný výpočet</span>
  </div>`;

  const html=`<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#f7fbf6">
<meta name="color-scheme" content="light">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(originalTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.ico?v=2">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RychléVýpočty.cz">
<meta property="og:title" content="${esc(originalTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://rychlevypocty.cz/og-image.jpg">
<script type="application/ld+json">${structuredData}</script>
<meta name="rv3-preview" content="about-rebuilt-from-scratch">
<link rel="stylesheet" href="/rv3/sitewide/foundation.css">
<link rel="stylesheet" href="/rv3/sitewide/about.css">
</head>
<body class="rv3w-page rv3a-page">
<a class="rv3a-skip" href="#main">Přejít na obsah</a>
${renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/o-nas.html'})}
<main id="main">
<section class="rv3a-hero" aria-labelledby="rv3a-title">
  <div class="rv3a-shell">
    <div class="rv3a-breadcrumb"><a href="/">Úvod</a><span aria-hidden="true">/</span><span>O projektu</span><span class="rv3a-breadcrumb-index">01 / POZNAT PROJEKT</span></div>
    <div class="rv3a-hero-grid">
      <div class="rv3a-hero-copy">
        <p class="rv3a-overline"><span aria-hidden="true"></span> O PROJEKTU RYCHLÉVÝPOČTY</p>
        <h1 id="rv3a-title">Čísla jsou začátek.<br><em>Rozhodnutí je cíl.</em></h1>
        <p class="rv3a-hero-lead">Kalkulačka nemá jen vyplivnout výsledek. Má vám pomoct pochopit, co znamená — a jak s ním dál naložit.</p>
        <div class="rv3a-hero-actions">
          <a class="rv3a-button rv3a-button-main" href="/rv3/poc/katalog-v2.html">Prozkoumat kalkulačky <span aria-hidden="true">↗</span></a>
          <a class="rv3a-text-link" href="#proc-existujeme">Proč projekt vznikl <span aria-hidden="true">↓</span></a>
        </div>
        <div class="rv3a-hero-proof"><span>Bez registrace</span><span>Vysvětlení výsledku</span><span>Jasné předpoklady</span></div>
      </div>
      ${visual}
    </div>
  </div>
</section>

<section class="rv3a-manifesto" id="proc-existujeme" aria-labelledby="rv3a-manifesto-title">
 <div class="rv3a-shell rv3a-manifesto-grid">
   <div class="rv3a-section-side"><span class="rv3a-section-kicker">01 / PROČ EXISTUJEME</span><span class="rv3a-side-rule" aria-hidden="true"></span><span class="rv3a-side-small">Méně tápání. Více jasno.</span></div>
   <div class="rv3a-manifesto-main">
     <h2 id="rv3a-manifesto-title">Za každým číslem je <em>skutečná otázka.</em></h2>
     <p class="rv3a-manifesto-lead">Kolik mi přijde na účet? Vyplatí se změnit práci? Co udělá splátka hypotéky s rozpočtem?</p>
     <p>RychléVýpočty vznikly jako nezávislý projekt praktických online kalkulaček. Smyslem není zahlcovat návštěvníka tabulkami, ale nabídnout mu srozumitelnou cestu od vstupních údajů k výsledku a jeho kontextu.</p>
     <a class="rv3a-underlink" href="/situace.html">Najít nástroj podle životní situace <span aria-hidden="true">↗</span></a>
   </div>
 </div>
</section>

<section class="rv3a-method" id="jak-pracujeme" aria-labelledby="rv3a-method-title">
  <div class="rv3a-shell">
    <div class="rv3a-method-head"><div><span class="rv3a-section-kicker">02 / JAK PŘEMÝŠLÍME</span><h2 id="rv3a-method-title">Nejdřív otázka.<br><em>Potom správná odpověď.</em></h2></div><p>U každého tématu záleží nejen na vzorci, ale i na předpokladech, aktuálnosti a správném vysvětlení.</p></div>
    <div class="rv3a-method-steps">
      <article><span class="rv3a-step-index">01 <span aria-hidden="true">↗</span></span><h3>Ujasnit zadání</h3><p>Co se má spočítat, jaké vstupy jsou potřeba a pro koho má výsledek smysl.</p></article>
      <article><span class="rv3a-step-index">02 <span aria-hidden="true">↗</span></span><h3>Ověřit pravidla</h3><p>U proměnlivých témat pracovat s relevantními zdroji, obdobím, sazbami a hraničními scénáři.</p></article>
      <article><span class="rv3a-step-index">03 <span aria-hidden="true">↗</span></span><h3>Vysvětlit výsledek</h3><p>Odlišit přesný výpočet od modelového nebo orientačního odhadu. Ukázat, co číslo říká — i co neříká.</p></article>
    </div>
    <a class="rv3a-underlink" href="/jak-pocitame.html">Podrobně o metodice <span aria-hidden="true">↗</span></a>
  </div>
</section>

<section class="rv3a-honesty" aria-labelledby="rv3a-honesty-title">
  <div class="rv3a-shell rv3a-honesty-grid">
    <div class="rv3a-honesty-mark" aria-hidden="true"><span>R/V</span><i></i><b>?</b></div>
    <div><span class="rv3a-section-kicker">03 / DŮVĚRA NENÍ SAMOZŘEJMOST</span>
      <h2 id="rv3a-honesty-title">Když je něco jen odhad, <em>má to být jasné.</em></h2>
      <p>V tématech jako finance, daně, zaměstnání nebo dávky může mít jeden detail velký vliv. Proto rozlišujeme přesné, modelové a orientační výpočty. Nástroj pomáhá se zorientovat, nenahrazuje však individuální posouzení odborníkem nebo příslušnou institucí.</p>
      <a href="/redakcni-zasady.html">Naše redakční zásady <span aria-hidden="true">↗</span></a>
    </div>
  </div>
</section>

<section class="rv3a-owner" id="kdo-za-webem-stoji" aria-labelledby="rv3a-owner-title">
  <div class="rv3a-shell rv3a-owner-grid">
    <div class="rv3a-owner-copy">
      <span class="rv3a-section-kicker">04 / KDO ZA PROJEKTEM STOJÍ</span>
      <h2 id="rv3a-owner-title">Za webem je konkrétní člověk.<br><em>Ne anonymní tým.</em></h2>
      <p>RychléVýpočty.cz provozuje <strong>${esc(name)}</strong> jako fyzická osoba bez přiděleného IČO. Jde o nezávislý projekt. Za výběr témat, podobu webu a zveřejněný obsah odpovídá provozovatel.</p>
      <p>Našli jste chybu, nejasný výsledek nebo chybějící téma? Ozvěte se přímo.</p>
      <a class="rv3a-button rv3a-button-light" href="mailto:${email}?subject=Rychl%C3%A9V%C3%BDpo%C4%8Dty%20%E2%80%93%20zp%C4%9Btn%C3%A1%20vazba">Napsat provozovateli <span aria-hidden="true">↗</span></a>
    </div>
    <div class="rv3a-owner-signature">
      <div class="rv3a-owner-initial" aria-hidden="true">R<span>/</span>V</div>
      <span>NEZÁVISLÝ ČESKÝ PROJEKT</span>
      <strong>${esc(name)}</strong>
      <a href="mailto:${email}">${email}</a>
      <div class="rv3a-owner-rule" aria-hidden="true"></div>
      <p>Jeden provozovatel. Otevřený kontakt. Žádné vymyšlené reference.</p>
    </div>
  </div>
</section>

<section class="rv3a-next" aria-labelledby="rv3a-next-title">
 <div class="rv3a-shell">
  <div class="rv3a-next-head"><div><span class="rv3a-section-kicker">A CO TEĎ?</span><h2 id="rv3a-next-title">Pojďme od slov <em>k výpočtu.</em></h2></div><p>Vyberte si kalkulačku, zjistěte výsledek a podívejte se, z čeho vychází.</p></div>
  <div class="rv3a-next-grid">
    <a href="/rv3/poc/katalog-v2.html"><span>01 / NÁSTROJE</span><strong>Najít kalkulačku</strong><small>Přímá cesta k praktickému výpočtu.</small><b aria-hidden="true">↗</b></a>
    <a href="/jak-pocitame.html"><span>02 / METODIKA</span><strong>Jak počítáme</strong><small>Zdroje, modely, přesnost a omezení.</small><b aria-hidden="true">↗</b></a>
    <a href="/kontakt.html"><span>03 / ZPĚTNÁ VAZBA</span><strong>Ozvat se</strong><small>Chyby, nápady a dotazy k projektu.</small><b aria-hidden="true">↗</b></a>
  </div>
  <div class="rv3a-social"><span>Sledovat projekt:</span><a href="https://www.facebook.com/rychlevypocty" rel="me noopener noreferrer">Facebook ↗</a><a href="https://www.instagram.com/rychlevypocty/" rel="me noopener noreferrer">Instagram ↗</a></div>
 </div>
</section>
</main>
${renderFooterV2()}
</body></html>`;
  if((html.match(/<h1\b/g)||[]).length!==1)throw Error('One H1 required');
  if((html.match(/<main\b/g)||[]).length!==1)throw Error('One main required');
  if(html.includes('rv-trust-v7.css')||html.includes('trust-nav')||html.includes('hero-panel')||html.includes('class="card"'))throw Error('Legacy page reused');
  return {html,manifest:{
    source:sourceRoute,preview:'/rv3/studio/o-nas.html',kind:'individual-rebuilt-trust-page',
    canonical,title:originalTitle,previewOnly:true,productionSourceSha256:sha(source),
    designStatus:'NEW_FROM_SCRATCH_OWNER_REVIEW_PENDING',browserQa:'NOT_VERIFIED'
  }};
}
