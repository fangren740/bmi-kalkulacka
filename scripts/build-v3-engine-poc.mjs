import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {POC_ROUTES,renderPrototypePage} from '../rv3/engine/renderer.mjs';
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
 await writeFile(path.join(folder,'manifest.json'),
   JSON.stringify({kind:'rv3-static-shell-poc',previewOnly:true,generatedRoutes:reports},null,2)+'\n');
 return reports;
}
