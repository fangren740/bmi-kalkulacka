/* Individuální page-studio adapter: O projektu.
   Explicitly opt-in, keeps all original factual text and external links.
   PREVIEW ONLY: does not edit /o-nas.html or production main. */
import {createHash} from 'node:crypto';
import {extractMain,scriptsOf,getCanonical} from './renderer.mjs';

const route='o-nas.html';
const canonical='https://rychlevypocty.cz/o-nas.html';
const headings=[
  ['Kdo za projektem stojí','provozovatel'],
  ['Proč web vznikl','proc'],
  ['Jak vznikají kalkulačky','metodika'],
  ['Oficiální profily','profily'],
];
const hash=s=>createHash('sha256').update(s).digest('hex');

function replaceExactlyOne(text,from,to,name){
  const bits=text.split(from);
  if(bits.length!==2)throw Error('Unexpected '+name+' structure, expected exactly once');
  return bits.join(to);
}

export function renderAboutStudio(source){
  if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Invalid source');
  if(getCanonical(source)!==canonical)throw Error('Canonical mismatch');
  if(!/<meta name="robots" content="index,follow">/.test(source))throw Error('Unexpected source robots');
  if(!source.includes('mailto:rychlevypocty@seznam.cz')||
     !source.includes('Martin Šilinger')||
     !source.includes('bez přiděleného IČO'))throw Error('Missing factual provenance or contact');
  if(/<base\b/i.test(source))throw Error('Unexpected base URL');
  const originalMain=extractMain(source);
  if(!originalMain)throw Error('Main missing');
  const originalScripts=JSON.stringify(scriptsOf(source));
  const title=source.match(/<title>([^<]+)<\/title>/)?.[1];
  if(title!=='O projektu | RychléVýpočty.cz')throw Error('Unexpected page title');

  let html=replaceExactlyOne(source,
    '<meta name="robots" content="index,follow">',
    '<meta name="robots" content="noindex,nofollow,noarchive">','robots');
  html=replaceExactlyOne(html,'</head>',
    '<meta name="rv3-preview" content="about-page-studio"><link rel="stylesheet" href="/rv3/sitewide/about.css"></head>','head');
  html=replaceExactlyOne(html,'<body>','<body class="rv3t-about">','body');

  for(const [label,id] of headings){
    html=replaceExactlyOne(html,
      '<section class="card"><span class="section-label">'+label+'</span>',
      '<section class="card" id="'+id+'"><span class="section-label">'+label+'</span>',
      'section '+label);
  }
  const anchors=headings.map(([label,id],i)=>
    '<a href="#'+id+'"><span aria-hidden="true">0'+(i+1)+'</span>'+label+'</a>').join('');
  const trail='<nav class="rv3t-stepnav" aria-label="Rychlá orientace na stránce">'+
    '<div><span>PRŮVODCE PROJEKTEM</span><strong>Čtyři krátké kapitoly.</strong></div>'+
    '<div class="rv3t-stepnav-links">'+anchors+'</div></nav>';
  html=replaceExactlyOne(html,'<div class="content">','<div class="content">'+trail,'content');

  // The added landmarks/anchors can change markup but cannot change any source
  // paragraph or heading text, the calculation scripts, or canonical metadata.
  for(const fragment of originalMain.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi)||[]){
    if(!html.includes(fragment))throw Error('Source paragraph changed');
  }
  if(JSON.stringify(scriptsOf(html))!==originalScripts)throw Error('Source scripts modified');
  if(getCanonical(html)!==canonical||!html.includes('<title>'+title+'</title>'))throw Error('SEO invariant changed');
  if((html.match(/<h1\b/gi)||[]).length!==1)throw Error('Must have one H1');
  if((html.match(/<main\b/gi)||[]).length!==1)throw Error('Must have one main');
  if((html.match(/<section class="card" id=/gi)||[]).length!==headings.length)throw Error('Section loss');
  return {html,manifest:{
    source:route,preview:'/rv3/studio/o-nas.html',kind:'trust-page-studio',
    canonical,title,sourceMainHash:hash(originalMain),
    sourceScriptsHash:hash(originalScripts),previewOnly:true,
    designStatus:'PREVIEW_NEEDS_VISUAL_REVIEW',browserQa:'NOT_VERIFIED',
  }};
}
