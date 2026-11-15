/* RV3 Page Studio / O projektu — independent, content-first page in the
   SAME visual family as the reviewed V3 calculator catalogue.
   Source HTML is used for fact-checking only, never as a markup template. */
import {createHash} from 'node:crypto';
import {extractMain, getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE='o-nas.html';
const CANONICAL='https://rychlevypocty.cz/o-nas.html';
const TITLE='O projektu | RychléVýpočty.cz';
const DESCRIPTION='Kdo provozuje RychléVýpočty.cz, proč projekt vznikl a jak vznikají jeho kalkulačky.';
const OWNER='Martin Šilinger';
const EMAIL='rychlevypocty@seznam.cz';
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export function renderAboutStudio(source){
  if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Invalid source');
  if(getCanonical(source)!==CANONICAL)throw Error('Canonical identity changed');
  if(!source.includes('<title>'+TITLE+'</title>')||!source.includes('content="'+DESCRIPTION+'"'))throw Error('SEO identity changed');
  if(!source.includes('<meta name="robots" content="index,follow">'))throw Error('Source robots changed');
  const main=extractMain(source);
  if(!main)throw Error('Source main missing');
  if(!main.includes('>'+OWNER+'</span>')||!main.includes('bez přiděleného IČO')||
     !main.includes('mailto:'+EMAIL))throw Error('Verified owner provenance missing');
  if(!main.includes('href="https://www.facebook.com/rychlevypocty"')||
     !main.includes('href="https://www.instagram.com/rychlevypocty/"'))throw Error('Verified social link missing');
  const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  if(!json)throw Error('JSON-LD missing');
  const data=JSON.parse(json);
  if(!data['@graph']?.some(item=>item['@type']==='WebPage'&&item.url===CANONICAL))throw Error('Structured identity changed');

  // One-off markup. No copied legacy hero, sidebar, cards or original <main>.
  const html=`<!doctype html>
<html lang="cs"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#f8fbf5">
<meta name="color-scheme" content="light">
<title>${escape(TITLE)}</title>
<meta name="description" content="${escape(DESCRIPTION)}">
<link rel="canonical" href="${CANONICAL}">
<link rel="icon" href="/favicon.ico?v=2" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RychléVýpočty.cz">
<meta property="og:title" content="${escape(TITLE)}">
<meta property="og:description" content="${escape(DESCRIPTION)}">
<meta property="og:url" content="${CANONICAL}">
<meta property="og:image" content="https://rychlevypocty.cz/og-image.jpg">
<script type="application/ld+json">${json}</script>
<meta name="rv3-preview" content="catalog-aligned-about-page">
<link rel="stylesheet" href="/rv3/catalog-v2.css">
<link rel="stylesheet" href="/rv3/catalog-v3-theme.css">
<link rel="stylesheet" href="/rv3/sitewide/about.css">
</head><body class="rv3d-page rv3a-page">
<a class="rv3d-skip" href="#main">Přeskočit na obsah</a>
${renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html'})}
<main id="main">
  <section class="rv3a-hero" aria-labelledby="about-title">
    <div class="rv3d-wrap">
      <nav class="rv3a-crumbs" aria-label="Drobečková navigace"><a href="/">Domů</a><span aria-hidden="true">/</span><span aria-current="page">O projektu</span></nav>
      <div class="rv3a-hero-grid">
        <div class="rv3a-hero-copy">
          <span class="rv3d-kicker"><span class="rv3d-kicker-line" aria-hidden="true"></span> O PROJEKTU</span>
          <h1 id="about-title">Nejde jen o číslo.<br><em>Jde o to mu rozumět.</em></h1>
          <p class="rv3a-lead">RychléVýpočty pomáhají proměnit každodenní otázky v konkrétní odpovědi. Vyberete téma, zadáte potřebné údaje a uvidíte nejen výsledek, ale také souvislosti a předpoklady výpočtu.</p>
          <div class="rv3a-hero-actions">
            <a class="rv3a-btn rv3a-btn-primary" href="/rv3/poc/katalog-v2.html">Prozkoumat kalkulačky <span aria-hidden="true">↗</span></a>
            <a class="rv3a-btn rv3a-btn-text" href="#nase-principy">Jak web funguje <span aria-hidden="true">↓</span></a>
          </div>
          <div class="rv3a-keyline"><span>Praktické české kalkulačky</span><span>Vysvětlení a předpoklady</span><span>Bez registrace</span></div>
        </div>
        <div class="rv3a-hero-art">
          <img src="/rv3/assets/about-story.svg" alt="Ilustrovaný zápisník s otázkami, podklady a kalkulačkou" width="580" height="470" decoding="async" fetchpriority="high">
          <span class="rv3a-art-note">OD OTÁZKY K SOUVISLOSTEM <span aria-hidden="true">↗</span></span>
        </div>
      </div>
    </div>
  </section>
  <nav class="rv3a-chapters" aria-label="Obsah stránky O projektu">
    <div class="rv3d-wrap rv3a-chapters-inner">
      <span class="rv3a-chapters-caption">RYCHLÁ ORIENTACE <span aria-hidden="true">/</span></span>
      <div class="rv3a-chapters-links">
        <a href="#proc-vznikl"><span aria-hidden="true">01</span> Proč jsme vznikli</a>
        <a href="#nase-principy"><span aria-hidden="true">02</span> Jak pracujeme</a>
        <a href="#kdo-web-provozuje"><span aria-hidden="true">03</span> Kdo za webem stojí</a>
      </div>
    </div>
  </nav>
  <section class="rv3a-intro" id="proc-vznikl" aria-labelledby="why-title">
    <div class="rv3d-wrap rv3a-intro-grid">
      <div><span class="rv3a-eyebrow">01 / MYŠLENKA PROJEKTU</span><h2 id="why-title">Číslo samo o sobě <em>nestačí.</em></h2></div>
      <div class="rv3a-intro-copy">
        <p class="rv3a-intro-lead">Kolik dostanu čistého? Co udělá splátka s rozpočtem? Jak se změní výsledek při jiném zadání?</p>
        <p>Podobné otázky si klademe každý den. Smyslem RychlýchVýpočtů je zjednodušit cestu k odpovědi — ukázat výsledek, jeho předpoklady a případně i to, co je potřeba ověřit jinde.</p>
        <a class="rv3a-link" href="/rv3/poc/katalog-v2.html">Najít kalkulačku k vlastní otázce <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </section>
  <section class="rv3a-process" id="nase-principy" aria-labelledby="process-title">
    <div class="rv3d-wrap">
      <div class="rv3a-heading-row"><div><span class="rv3a-eyebrow">02 / OD MYŠLENKY K VÝPOČTU</span><h2 id="process-title">Tři věci, na kterých <em>záleží.</em></h2></div>
        <p>Nejen rychlost. Také jasné zadání, správná pravidla a vysvětlení, co výsledek znamená.</p>
      </div>
      <div class="rv3a-process-grid">
        <article class="rv3a-step"><span class="rv3a-step-top"><span class="rv3a-step-icon" aria-hidden="true">01</span><span class="rv3a-step-arrow" aria-hidden="true">↗</span></span><h3>Vědět, co počítáme</h3><p>Nejprve je potřeba vymezit otázku, smysluplné vstupy a očekávaný výsledek.</p></article>
        <article class="rv3a-step"><span class="rv3a-step-top"><span class="rv3a-step-icon" aria-hidden="true">02</span><span class="rv3a-step-arrow" aria-hidden="true">↗</span></span><h3>Opřít se o pravidla</h3><p>U měnících se témat uvádět období, sazby, použité předpoklady a podstatné výjimky.</p></article>
        <article class="rv3a-step"><span class="rv3a-step-top"><span class="rv3a-step-icon" aria-hidden="true">03</span><span class="rv3a-step-arrow" aria-hidden="true">↗</span></span><h3>Říct, co to znamená</h3><p>Odlišit přesné výpočty od modelových a orientačních. Nenechat uživatele jen s číslem.</p></article>
      </div>
      <div class="rv3a-process-bottom"><span>Podrobnější popis zdrojů, postupu a omezení.</span><a class="rv3a-link" href="/jak-pocitame.html">Jak počítáme <span aria-hidden="true">↗</span></a></div>
    </div>
  </section>
  <section class="rv3a-clarity" aria-labelledby="clarity-title">
    <div class="rv3d-wrap rv3a-clarity-grid">
      <div class="rv3a-clarity-copy"><span class="rv3a-eyebrow">03 / FÉROVĚ K VÝSLEDKŮM</span>
        <h2 id="clarity-title">Vědět, kde končí <em>jistota.</em></h2>
        <p>U jednoduché matematiky můžeme spočítat přesné číslo. U složitějších finančních, daňových nebo pracovních situací záleží na předpokladech a aktuálních pravidlech.</p>
        <p>Proto rozlišujeme přesný, modelový a orientační výsledek. Kalkulačka pomůže získat přehled, ale nenahrazuje odborné posouzení ani rozhodnutí příslušné instituce.</p>
        <a class="rv3a-link" href="/redakcni-zasady.html">Naše redakční zásady <span aria-hidden="true">↗</span></a>
      </div>
      <div class="rv3a-clarity-panel">
        <span class="rv3a-panel-eyebrow">JAK ČÍST VÝSLEDKY</span>
        <div class="rv3a-result-line"><span class="rv3a-line-icon" aria-hidden="true">=</span><div><strong>Přesný výsledek</strong><small>Vychází z jednoznačného zadání a pravidel.</small></div></div>
        <div class="rv3a-result-line"><span class="rv3a-line-icon" aria-hidden="true">≈</span><div><strong>Modelový výpočet</strong><small>Závisí na zvolených předpokladech.</small></div></div>
        <div class="rv3a-result-line"><span class="rv3a-line-icon" aria-hidden="true">?</span><div><strong>Orientační odhad</strong><small>Pomáhá se zorientovat, není konečným rozhodnutím.</small></div></div>
        <div class="rv3a-panel-foot"><span aria-hidden="true">ⓘ</span> Vždy záleží na konkrétním nástroji a jeho metodice.</div>
      </div>
    </div>
  </section>
  <section class="rv3a-author" id="kdo-web-provozuje" aria-labelledby="author-title">
    <div class="rv3d-wrap rv3a-author-grid">
      <div class="rv3a-author-copy"><span class="rv3a-eyebrow">04 / KDO ZA PROJEKTEM STOJÍ</span>
        <h2 id="author-title">Za projektem stojí <em>konkrétní člověk.</em></h2>
        <p>RychléVýpočty.cz provozuje <strong>${escape(OWNER)}</strong> jako fyzická osoba bez přiděleného IČO. Jde o nezávislý projekt, za jehož témata, obsah a podobu odpovídá provozovatel.</p>
        <p>Našli jste chybu, nejasný výsledek nebo vám chybí určité téma? Dejte vědět přímo provozovateli — konkrétní připomínky pomáhají nástroje zlepšovat.</p>
      </div>
      <div class="rv3a-contact"><span class="rv3a-contact-head">KONTAKT NA PROVOZOVATELE</span>
        <strong>${escape(OWNER)}</strong><span>Nezávislý projekt RychléVýpočty.cz</span>
        <a class="rv3a-contact-email" href="mailto:${EMAIL}">${EMAIL}</a>
        <a class="rv3a-btn rv3a-btn-primary" href="/kontakt.html">Kontaktovat projekt <span aria-hidden="true">↗</span></a>
        <div class="rv3a-contact-social"><a href="https://www.facebook.com/rychlevypocty" rel="me noopener noreferrer">Facebook ↗</a><a href="https://www.instagram.com/rychlevypocty/" rel="me noopener noreferrer">Instagram ↗</a></div>
      </div>
    </div>
  </section>
  <section class="rv3a-next" aria-labelledby="next-title">
    <div class="rv3d-wrap">
      <div class="rv3a-next-lead"><span class="rv3a-eyebrow">KAM DÁL</span><h2 id="next-title">Z otázky k <em>výsledku.</em></h2><p>Vyberte si cestu podle toho, co právě potřebujete.</p></div>
      <div class="rv3a-next-grid">
        <a href="/rv3/poc/katalog-v2.html"><span>01 / PROZKOUMAT</span><strong>Všechny kalkulačky</strong><small>Najděte správný nástroj podle své situace.</small><span aria-hidden="true">↗</span></a>
        <a href="/jak-pocitame.html"><span>02 / POROZUMĚT</span><strong>Jak počítáme</strong><small>Metodika, předpoklady a omezení výsledků.</small><span aria-hidden="true">↗</span></a>
        <a href="/kontakt.html"><span>03 / OZVAT SE</span><strong>Zpětná vazba</strong><small>Chyba, námět nebo otázka k projektu.</small><span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </section>
</main>
${renderFooterV2()}
</body></html>`;

  if((html.match(/<h1\b/gi)||[]).length!==1||(html.match(/<main\b/gi)||[]).length!==1)throw Error('Page landmarks invalid');
  if(html.includes('rv-trust-v7.css')||html.includes('trust-nav')||html.includes('hero-panel')||html.includes('class="card"'))throw Error('Legacy design leaked');
  return {html,manifest:{
    source:SOURCE,preview:'/rv3/studio/o-nas.html',kind:'catalog-aligned-bespoke-about',
    canonical:CANONICAL,title:TITLE,previewOnly:true,
    sourceSha256:createHash('sha256').update(source).digest('hex'),
    art:'/rv3/assets/about-story.svg',css:['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/about.css'],
    designStatus:'VISUAL_REVIEW_PENDING',browserQa:'NOT_VERIFIED'
  }};
}
