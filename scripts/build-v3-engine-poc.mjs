import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {POC_ROUTES,renderPrototypePage} from '../rv3/engine/renderer.mjs';
import {renderStudioCatalog} from '../rv3/engine/catalog.mjs';
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
 await writeFile(path.join(folder,'manifest.json'),
   JSON.stringify({kind:'rv3-static-shell-poc',previewOnly:true,generatedRoutes:reports},null,2)+'\n');
 return reports;
}
