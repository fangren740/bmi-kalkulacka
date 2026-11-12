import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const registry=JSON.parse(read('docs/rv3/route-registry.json'));
const tracker=JSON.parse(read('docs/rv3/PAGE_TRACKER_2026-11-12.json'));
const routes=tracker.routes;

test('One and only one individual quality card per original HTML URL (207), without hallucinated migration',()=>{
 assert.equal(registry.routes.length,207);
 assert.equal(routes.length,207);
 const source=registry.routes.map(x=>x.path).sort();
 const tracked=routes.map(x=>x.path).sort();
 assert.deepEqual(tracked,source,'A route was duplicated, invented or dropped');
 assert.equal(new Set(tracked).size,207);
 const tally={};
 for(const item of routes){
   tally[item.registryKind]=(tally[item.registryKind]||0)+1;
   assert.ok(item.plan&&item.delivery&&item.audit,'Missing quality record '+item.path);
   assert.ok(item.identity?.logo==='LOCK_ORIGINAL');
   assert.ok(item.identity?.oldUrl==='LOCK');
   assert.ok(item.delivery.release!=='RELEASED'||item.delivery.approval==='USER_APPROVED',
     'Never mark production released without specific approval '+item.path);
   if(item.delivery.cloudflareBuild==='PASS')
     assert.ok(item.delivery.previewUrl,'Build PASS needs verifiable preview '+item.path);
   if(item.delivery.design==='USER_APPROVED')
     assert.equal(item.delivery.approval,'USER_APPROVED');
 }
 assert.deepEqual(tally,registry.kindCounts,'Historical URL taxonomy must stay honest');
});

test('Homepage, About and Methodology each have a distinct page studio brief',()=>{
 for(const slug of ['index','o-nas','jak-pocitame']){
   const path='docs/rv3/pages/'+slug+'.md';
   assert.ok(existsSync(new URL('../../'+path,import.meta.url)));
   const body=read(path);
   assert.ok(body.includes('## Stage checklist'));
   assert.ok(body.length>900,'Do not replace a bespoke brief with a generic paragraph');
 }
});

test('Masterplan supersedes stale batch assumptions without touching production',()=>{
 const master=read('docs/rv3/PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md');
 assert.ok(master.includes('207'));
 assert.ok(master.includes('homepage'));
 assert.ok(master.includes('PAGE_TRACKER_2026-11-12.json'));
 assert.ok(master.includes('PR #67'));
 assert.ok(master.includes('NO MERGE')||master.includes('Nenasazovat')||master.includes('explicitní souhlas'));
});
