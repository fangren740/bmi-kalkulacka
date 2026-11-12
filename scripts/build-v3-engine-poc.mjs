import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {POC_ROUTES,renderPrototypePage} from '../rv3/engine/renderer.mjs';
import {renderStudioCatalog} from '../rv3/engine/catalog.mjs';
import {renderCatalogV2} from '../rv3/engine/catalog-v2.mjs';
import {HUB_WAVE1_ROUTES,renderHubWave1} from '../rv3/engine/sitewide-hubs.mjs';
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
 await writeFile(path.join(hubFolder,'manifest.json'),
   JSON.stringify({kind:'rv3-hub-wave1',previewOnly:true,generated:hubReports},null,2)+'\n');
 await writeFile(path.join(folder,'manifest.json'),
   JSON.stringify({kind:'rv3-static-shell-poc',previewOnly:true,generatedRoutes:reports},null,2)+'\n');
 return reports;
}
