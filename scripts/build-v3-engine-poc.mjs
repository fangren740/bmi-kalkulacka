import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {POC_ROUTES,renderPrototypePage} from '../rv3/engine/renderer.mjs';
import {renderStudioCatalog} from '../rv3/engine/catalog.mjs';
import {renderCatalogV2} from '../rv3/engine/catalog-v2.mjs';
import {HUB_WAVE1_ROUTES,renderHubWave1} from '../rv3/engine/sitewide-hubs.mjs';
import {renderHomepageStudio} from '../rv3/engine/sitewide-home.mjs';
import {renderAboutStudio} from '../rv3/engine/studio-about.mjs';
import {renderMethodologyStudio} from '../rv3/engine/studio-methodology.mjs';
import {renderEditorialStudio} from '../rv3/engine/studio-editorial.mjs';
import {renderContactStudio} from '../rv3/engine/studio-contact.mjs';
import {renderPrivacyStudio} from '../rv3/engine/studio-privacy.mjs';
import {renderCookiesStudio} from '../rv3/engine/studio-cookies.mjs';
import {renderAdvertisingStudio} from '../rv3/engine/studio-advertising.mjs';
import {renderTermsStudio} from '../rv3/engine/studio-terms.mjs';
export async function buildPrototype({root,output}){
 const folder=path.join(output,'rv3','poc');
 await mkdir(folder,{recursive:true});
 const reports=[];
 for(const route of POC_ROUTES){
  const source=await readFile(path.join(root,route.source),'utf8');
  const {html,manifest}=renderPrototypePage(source,route);
  const target=path.join(folder,route.source);
  await writeFile(target,html);
  await stat(target);
  reports.push(manifest);
 }
 // The first fully-generated V3 page: a static, searchable directory of all verified tools.
 const indexSource=await readFile(path.join(root,'rv-tool-index.js'),'utf8');
 const tools=JSON.parse(indexSource.slice(indexSource.indexOf('['),indexSource.lastIndexOf(']')+1));
 for(const tool of tools){
  if(typeof tool?.url!=='string'||!tool.url.startsWith('/')||!tool.url.endsWith('.html')||tool.url.includes('..'))
   throw Error('Unexpected indexed tool route');
  await stat(path.join(output,tool.url.slice(1))).catch(()=>{
   throw Error('Catalog tool missing from preview: '+tool.url);
  });
 }
 const studio=renderStudioCatalog(tools);
 await writeFile(path.join(folder,'studio-katalog.html'),studio.html);
 reports.push(studio.report);
 // Alternative V3 information architecture, independent of previous 135-card Studio proposal.
 const taxonomy=JSON.parse(await readFile(path.join(root,'rv3/engine/catalog-v2.taxonomy.json'),'utf8'));
 const v2=renderCatalogV2(tools,taxonomy);
 await writeFile(path.join(folder,'katalog-v2.html'),v2.html);
 await stat(path.join(folder,'katalog-v2.html'));
 reports.push(v2.report);
 // First site-wide preview wave. Source root HTML and numerical scripts are left untouched.
 const hubFolder=path.join(output,'rv3','wave1');
 await mkdir(hubFolder,{recursive:true});
 const hubReports=[];
 for(const route of HUB_WAVE1_ROUTES){
  const source=await readFile(path.join(root,route.source),'utf8');
  const {html,manifest}=renderHubWave1(source,route);
  const target=path.join(hubFolder,route.source);
  await writeFile(target,html);
  await stat(target);
  hubReports.push(manifest);
  reports.push(manifest);
 }
 // Unique editorial/trust page — no changes to the existing public source route.
 const trustFolder=path.join(output,'rv3','studio');
 await mkdir(trustFolder,{recursive:true});
 const aboutSource=await readFile(path.join(root,'o-nas.html'),'utf8');
 const about=renderAboutStudio(aboutSource);
 const aboutTarget=path.join(trustFolder,'o-nas.html');
 await writeFile(aboutTarget,about.html);
 await stat(aboutTarget);
 reports.push(about.manifest);
 // The next standalone trust product: explain & demonstrate the calculation method.
 const methodSource=await readFile(path.join(root,'jak-pocitame.html'),'utf8');
 const methodTemplate=await readFile(path.join(root,'rv3/engine/methodology.template.html'),'utf8');
 const method=renderMethodologyStudio(methodSource,methodTemplate);
 const methodTarget=path.join(trustFolder,'jak-pocitame.html');
 await writeFile(methodTarget,method.html);
 await stat(methodTarget);
 reports.push(method.manifest);
 // Individual editorial ethics product: source-verified, own composition, no public route edits.
 const editorialSource=await readFile(path.join(root,'redakcni-zasady.html'),'utf8');
 const editorialTemplate=await readFile(path.join(root,'rv3/engine/editorial.template.html'),'utf8');
 const editorial=renderEditorialStudio(editorialSource,editorialTemplate);
 const editorialTarget=path.join(trustFolder,'redakcni-zasady.html');
 await writeFile(editorialTarget,editorial.html);
 await stat(editorialTarget);
 reports.push(editorial.manifest);
 // A source-verified, privacy-preserving contact hub; leave root /kontakt.html untouched.
 const contactSource=await readFile(path.join(root,'kontakt.html'),'utf8');
 const contactTemplate=await readFile(path.join(root,'rv3/engine/contact.template.html'),'utf8');
 const contact=renderContactStudio(contactSource,contactTemplate);
 const contactTarget=path.join(trustFolder,'kontakt.html');
 await writeFile(contactTarget,contact.html);
 await stat(contactTarget);
 reports.push(contact.manifest);
 // Privacy is a legally sensitive reading room. Copy all seven source sections
 // verbatim and fail closed on the reviewed source Git blob fingerprint.
 const privacySource=await readFile(path.join(root,'ochrana-osobnich-udaju.html'),'utf8');
 const privacyTemplate=await readFile(path.join(root,'rv3/engine/privacy.template.html'),'utf8');
 const privacy=renderPrivacyStudio(privacySource,privacyTemplate);
 const privacyTarget=path.join(trustFolder,'ochrana-osobnich-udaju.html');
 await writeFile(privacyTarget,privacy.html);
 await stat(privacyTarget);
 reports.push(privacy.manifest);
 // Cookies: exact source reference for nine storage keys, readable on all screens.
 // Preview-only; public cookies.html and local-storage behavior remain untouched.
 const cookiesSource=await readFile(path.join(root,'cookies.html'),'utf8');
 const cookiesTemplate=await readFile(path.join(root,'rv3/engine/cookies.template.html'),'utf8');
 const cookies=renderCookiesStudio(cookiesSource,cookiesTemplate);
 const cookiesTarget=path.join(trustFolder,'cookies.html');
 await writeFile(cookiesTarget,cookies.html);
 await stat(cookiesTarget);
 reports.push(cookies.manifest);
 // Advertising: customer-first explanation, original two source sections preserved.
 const advertisingSource=await readFile(path.join(root,'reklama-a-spoluprace.html'),'utf8');
 const advertisingTemplate=await readFile(path.join(root,'rv3/engine/advertising.template.html'),'utf8');
 const advertising=renderAdvertisingStudio(advertisingSource,advertisingTemplate);
 const advertisingTarget=path.join(trustFolder,'reklama-a-spoluprace.html');
 await writeFile(advertisingTarget,advertising.html);
 await stat(advertisingTarget);
 reports.push(advertising.manifest);
 // Bespoke terms page: all eight original legal chapters preserved exactly.
 const termsSource=await readFile(path.join(root,'podminky-pouziti.html'),'utf8');
 const termsTemplate=await readFile(path.join(root,'rv3/engine/terms.template.html'),'utf8');
 const terms=renderTermsStudio(termsSource,termsTemplate);
 const termsTarget=path.join(trustFolder,'podminky-pouziti.html');
 await writeFile(termsTarget,terms.html);
 await stat(termsTarget);
 reports.push(terms.manifest);
 // Homepage is a distinct editorial product, not a copy of the hub skin.
 const homepageSource=await readFile(path.join(root,'index.html'),'utf8');
 const homepage=renderHomepageStudio(homepageSource);
 await writeFile(path.join(hubFolder,'index.html'),homepage.html);
 await stat(path.join(hubFolder,'index.html'));
 hubReports.push(homepage.manifest);
 reports.push(homepage.manifest);
 await writeFile(path.join(hubFolder,'manifest.json'),
   JSON.stringify({kind:'rv3-hub-wave1',previewOnly:true,generated:hubReports},null,2)+'\n');
 await writeFile(path.join(folder,'manifest.json'),
   JSON.stringify({kind:'rv3-static-shell-poc',previewOnly:true,generatedRoutes:reports},null,2)+'\n');
 return reports;
}
