// Isolated Worker preview build. Copies existing public assets without altering source/main.
import {readdir,stat,copyFile,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const excludeDirs=new Set(['.git','.github','node_modules','dist','audits','reviews','design-concepts','scripts','cloudflare','.vscode']);
const excludeFiles=new Set(['CNAME','.nojekyll','wrangler.jsonc','wrangler.json','wrangler.toml','package.json','package-lock.json','robots.txt','_headers','_redirects']);
const extensions=new Set(['.html','.css','.js','.mjs','.json','.xml','.svg','.txt','.webmanifest','.png','.jpg','.jpeg','.gif','.webp','.avif','.ico','.woff','.woff2','.ttf','.otf','.pdf','.wasm','.webm','.mp4','.map','.csv','.zip','.eot','.otc']);
let copied=0;let html=0;const skipped=[];

async function walk(input,relative=''){
  for(const ent of await readdir(input,{withFileTypes:true})){
    if(ent.isSymbolicLink())throw Error('Symlinks forbidden in preview output: '+path.join(relative,ent.name));
    const rel=path.join(relative,ent.name);
    if(ent.isDirectory()){
      if(excludeDirs.has(ent.name)||ent.name.startsWith('.')
       || (relative==='rv3' && ent.name==='tests'))continue;
      await walk(path.join(input,ent.name),rel);
      continue;
    }
    if(!ent.isFile())continue;
    if(excludeFiles.has(ent.name)||ent.name.startsWith('.')||ent.name.toLowerCase().endsWith('.md')
       || !extensions.has(path.extname(ent.name).toLowerCase())){
      skipped.push(rel);continue;
    }
    const dest=path.join(output,rel);
    await mkdir(path.dirname(dest),{recursive:true});
    await copyFile(path.join(input,ent.name),dest);
    copied++;if(rel.endsWith('.html'))html++;
  }
}
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await walk(root);

/* Generate the V3 search catalog from the actual existing, verified public tool index.
   No new URLs are invented and no request contains user-entered search text. */
const indexSource=await readFile(path.join(root,'rv-tool-index.js'),'utf8');
const firstBracket=indexSource.indexOf('['),lastBracket=indexSource.lastIndexOf(']');
const sourceItems=JSON.parse(indexSource.slice(firstBracket,lastBracket+1));
if(!Array.isArray(sourceItems)||sourceItems.length<100)throw Error('Tool search source incomplete');
const searchIndex=[];const seenUrls=new Set();
for(const item of sourceItems){
 if(!item?.url?.startsWith('/')||!item.url.endsWith('.html'))continue;
 if(seenUrls.has(item.url))continue;
 const filename=path.join(output,item.url.slice(1));
 await stat(filename).catch(()=>{throw Error('Invalid search destination: '+item.url)});
 seenUrls.add(item.url);
 searchIndex.push([String(item.title||'').trim().slice(0,90),
   String(item.desc||item.type||'').trim().slice(0,140),item.url,
   String(item.keywords||'').slice(0,300)]);
}
if(searchIndex.length<100)throw Error('Search index incomplete or unexpected loss of valid tools');
await mkdir(path.join(output,'rv3'),{recursive:true});
await writeFile(path.join(output,'rv3/tool-search-index.json'),JSON.stringify(searchIndex)+'\n');
console.log('Validated lazy search index:',searchIndex.length,'working tool URLs.');

const critical=['index.html','cista-mzda-kalkulacka.html','mzdy-a-prace.html','kalkulacka-priplatku-za-smeny.html','sitemap.xml','rv-tool-index.js'];
for(const f of critical){await stat(path.join(output,f)).catch(()=>{throw Error('CRITICAL ASSET MISSING: '+f)})}
if(html<180)throw Error('Too few HTML files in preview ('+html+'). Deployment intentionally blocked.');
if((await readFile(path.join(output,'index.html'),'utf8')).length<1000)throw Error('Homepage unexpectedly empty.');

await writeFile(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
await writeFile(path.join(output,'_headers'),'/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
await writeFile(path.join(output,'404.html'),'<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 – Stránka nenalezena</title><body><main style="font:1.1rem system-ui;max-width:38rem;margin:10vh auto;padding:2rem"><h1>Stránka nenalezena</h1><p>Požadovaná stránka neexistuje.</p><a href="/">Zpět na úvod</a></main></body></html>');
const manifest={kind:'cloudflare-preview-only',sourceRef:process.env.CF_PAGES_BRANCH||process.env.CF_BRANCH||process.env.GITHUB_SHA||'git-branch',files:copied,html,createdAt:new Date().toISOString(),previewOnly:true};
await writeFile(path.join(output,'rv3-preview-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Preview build ready:',html,'HTML files,',copied,'assets. No source URLs changed. Skipped:',skipped.length);
