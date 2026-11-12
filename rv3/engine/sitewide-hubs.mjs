/* W1 hub adapter extending existing RV3 shell/SEO-preserving renderer.
   Opt-in preview only. Do not rewrite root HTML, <main>, or source scripts. */
import {createHash} from 'node:crypto';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';
import {extractMain,scriptsOf,getCanonical} from './renderer.mjs';

export const HUB_WAVE1_ROUTES=Object.freeze([
 Object.freeze({source:'finance-a-hypoteky.html',family:'finance'}),
 Object.freeze({source:'osvc-a-freelancing.html',family:'osvc'})
]);
const hash=s=>createHash('sha256').update(s).digest('hex');
const matches=(html,rx)=>[...html.matchAll(new RegExp(rx.source,rx.flags.includes('g')?rx.flags:rx.flags+'g'))];
const replaceExactlyOne=(html,rx,replace,name)=>{
 if(matches(html,rx).length!==1)throw Error(name+' must have exactly one instance');
 return html.replace(rx,replace);
};
export function renderHubWave1(source,route){
 const approved=HUB_WAVE1_ROUTES.find(x=>x.source===route?.source&&x.family===route.family);
 if(!approved)throw Error('Unapproved hub wave1 route');
 if(!/<!doctype html>/i.test(source))throw Error('Missing HTML doctype');
 if(/<base\b/i.test(source))throw Error('Unexpected BASE element');
 const refs=[...source.matchAll(/\b(?:href|src|action|poster)=(["'])(.*?)\1/gi)].map(m=>m[2]);
 const relative=refs.filter(u=>u&&!u.startsWith('/')&&!u.startsWith('#')&&!/^[a-z][a-z0-9+.-]*:/i.test(u));
 if(relative.length)throw Error('Relative URLs need explicit adapter: '+relative[0]);
 const originalMain=extractMain(source);
 if(!originalMain)throw Error('Missing main for '+route.source);
 const originalScripts=scriptsOf(source);
 const oldCanonical=getCanonical(source);
 if(oldCanonical!=='https://rychlevypocty.cz/'+route.source)throw Error('Canonical mismatch for '+route.source);
 const title=source.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
 if(!title)throw Error('Missing title');
 const headSource=source.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)?.[0];
 if(!headSource)throw Error('Missing head');
 const oldRobots=source.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0];
 if(!oldRobots||!/index,follow/i.test(oldRobots))throw Error('Unexpected source robots');
 const oldHeader=source.match(/<header\b[^>]*>[\s\S]*?<\/header>/gi)||[];
 const oldFooter=source.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi)||[];
 if(oldHeader.length!==1||oldFooter.length!==1)throw Error('Ambiguous header/footer');
 let html=source;
 html=replaceExactlyOne(html,/<header\b[^>]*>[\s\S]*?<\/header>/i,
   renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html'})+
   '<div class="rv3w-legacy" hidden inert aria-hidden="true">'+oldHeader[0]+'</div>','header');
 html=replaceExactlyOne(html,/<footer\b[^>]*>[\s\S]*?<\/footer>/i,
   renderFooterV2()+'<div class="rv3w-legacy" hidden inert aria-hidden="true">'+oldFooter[0]+'</div>','footer');
 html=replaceExactlyOne(html,/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i,
   '<meta name="robots" content="noindex,nofollow,noarchive">','robots');
 html=replaceExactlyOne(html,/<\/head>/i,
   '<meta name="rv3-preview" content="sitewide-wave1">'+
   '<link rel="stylesheet" href="/rv3/sitewide/foundation.css">'+
   '<link rel="stylesheet" href="/rv3/sitewide/hub-wave1.css"></head>','head');
 html=replaceExactlyOne(html,/<body\b[^>]*>/i,tag=>
   /\bclass=(["'])([^"']*)\1/.test(tag)
    ?tag.replace(/\bclass=(["'])([^"']*)\1/,(_,q,v)=>'class='+q+v+' rv3w-page rv3w-'+route.family+q)
    :tag.slice(0,-1)+' class="rv3w-page rv3w-'+route.family+'">','body');
 if(extractMain(html)!==originalMain)throw Error('Main modified: '+route.source);
 if(JSON.stringify(scriptsOf(html))!==JSON.stringify(originalScripts))throw Error('Scripts modified: '+route.source);
 if(getCanonical(html)!==oldCanonical)throw Error('Canonical changed: '+route.source);
 if(!html.includes('<title>'+title+'</title>'))throw Error('Title changed');
 if((html.match(/<h1\b/gi)||[]).length!==(source.match(/<h1\b/gi)||[]).length)throw Error('H1 count changed');
 if(html.includes('<base '))throw Error('BASE element introduced');
 return {html,manifest:{
   route:route.source,preview:'/rv3/wave1/'+route.source,
   status:'preview-only-browser-unverified',family:route.family,
   preserveMainSha256:hash(originalMain),preserveScriptsSha256:hash(JSON.stringify(originalScripts)),
   canonical:oldCanonical,title,sourceRobots:oldRobots,legacyCompatibility:true
 }};
}
