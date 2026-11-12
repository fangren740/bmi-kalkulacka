/* Preview-only individual homepage studio. No URL / algorithm / source DOM rewrite. */
import {createHash} from 'node:crypto';
import {extractMain,scriptsOf,getCanonical} from './renderer.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const once=(s,rx,v,label)=>{
 if([...s.matchAll(new RegExp(rx.source,rx.flags.includes('g')?rx.flags:rx.flags+'g'))].length!==1)
   throw Error(label+' has unexpected number of matches');
 return s.replace(rx,v);
};
export function renderHomepageStudio(source){
 if(!/<!doctype html>/i.test(source))throw Error('Missing doctype');
 const main=extractMain(source),scripts=scriptsOf(source),canonical=getCanonical(source);
 if(!main||canonical!=='https://rychlevypocty.cz/')throw Error('Unexpected homepage semantics');
 if(!source.includes('id="offer-before"')||!source.includes('id="offer-after"')||
  !source.includes('id="tool-search"')||!source.includes('data-intent-root'))throw Error('Required product interaction missing');
 const oldRobots=source.match(/<meta\b(?=[^>]*name=["']robots["'])[^>]*>/i)?.[0];
 if(!oldRobots||!oldRobots.includes('index,follow'))throw Error('Original robots unexpected');
 const title=source.match(/<title>([^<]+)<\/title>/i)?.[1];
 if(!title)throw Error('No title');
 let html=source;
 html=once(html,/<meta\b(?=[^>]*name=["']robots["'])[^>]*>/i,
  '<meta name="robots" content="noindex,nofollow,noarchive">','robots');
 html=once(html,/<\/head>/i,
  '<meta name="rv3-preview" content="page-studio-homepage">'+
  '<link rel="stylesheet" href="/rv3/sitewide/homepage.css"></head>','head');
 html=once(html,/<body\b[^>]*>/i,tag=>tag.slice(0,-1)+' class="rv3w-home">','body');
 if(extractMain(html)!==main)throw Error('Homepage main altered unexpectedly');
 if(JSON.stringify(scriptsOf(html))!==JSON.stringify(scripts))throw Error('Calculation scripts changed');
 if(getCanonical(html)!==canonical||!html.includes('<title>'+title+'</title>'))throw Error('SEO baseline changed');
 if((html.match(/<h1\b/gi)||[]).length!==1)throw Error('Multiple H1');
 return {html,manifest:{route:'index.html',preview:'/rv3/wave1/index.html',
 status:'PREVIEW_DESIGN_ITERATION_NOT_FINAL',canonical,title,
 preserveMainSha256:hash(main),preserveScriptsSha256:hash(JSON.stringify(scripts)),
 sourceRobots:oldRobots,approval:'PENDING',browserQA:'NOT_VERIFIED'}};
}
