/* Run after Cloudflare supplies a real Preview/Deployment URL:
   node scripts/verify-cloudflare-preview.mjs https://<real-preview-host>
   Exits non-zero for redirects, missing noindex, missing assets or bad 404s. */
const arg=process.argv[2];
if(!arg||!arg.startsWith('https://'))throw Error('Usage: node scripts/verify-cloudflare-preview.mjs https://<actual-preview-host>');
const origin=new URL(arg).origin;
const checks=[
 ['/',200,'text/html'],['/cista-mzda-kalkulacka.html',200,'text/html'],['/mzdy-a-prace.html',200,'text/html'],
 ['/kalkulacka-priplatku-za-smeny.html',200,'text/html'],['/rv3/site.css',200,'text/css'],
 ['/rv3/salary-engine.js',200,'javascript'],['/sitemap.xml',200,'xml'],
 ['/robots.txt',200,'text/plain'],['/unavailable-rv3-check-2026.html',404,'text/html']
];
let failed=0;
for(const [route,status,mime] of checks){
 try{
  const response=await fetch(origin+route,{redirect:'manual',headers:{'cache-control':'no-cache'}});
  const tag=response.headers.get('x-robots-tag')||'';
  const ct=response.headers.get('content-type')||'';
  const location=response.headers.get('location');
  let ok=response.status===status&&!location&&tag.includes('noindex')&&ct.includes(mime);
  if(route==='/robots.txt')ok=ok&&(await response.text()).includes('Disallow: /');
  if(route==='/cista-mzda-kalkulacka.html')ok=ok&&(await response.text()).includes('rv3/salary-engine.js');
  if(route==='/kalkulacka-priplatku-za-smeny.html')ok=ok&&(await response.text()).includes('Příplatky');
  if(!ok)failed++;
  console.log((ok?'PASS':'FAIL').padEnd(5),String(response.status).padStart(3),route,'X-Robots-Tag='+tag,'Content-Type='+ct,location?('Location='+location):'');
 }catch(e){failed++;console.error('FAIL',route,e.message)}
}
if(failed){console.error('FAIL:',failed,'live HTTP checks');process.exitCode=1;}
else console.log('PASS:',checks.length,'real HTTP checks including noindex and exact .html URLs');
