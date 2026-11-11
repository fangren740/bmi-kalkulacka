import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');
const registry=JSON.parse(read('docs/rv3/route-registry.json'));

test('registry matches every physical HTML URL in Git checkout',()=>{
 const physical=readdirSync(root).filter(p=>p.endsWith('.html')).sort();
 const recorded=registry.routes.map(r=>r.path.slice(1)).sort();
 assert.equal(physical.length,207);
 assert.equal(recorded.length,207);
 assert.deepEqual(recorded,physical);
 assert.equal(new Set(registry.routes.map(r=>r.path)).size,207);
 assert.equal(registry.totals.html,207);
 assert.equal(registry.totals.nonCatalog,72);
 for(const route of registry.routes){
  assert.ok(route.path.startsWith('/')&&route.path.endsWith('.html'));
  assert.ok(['legacy-unmigrated','preview-built'].includes(route.previewStatus));
  assert.ok(['needs-individual-review'].includes(route.reviewStatus));
 }
});

test('catalog 135 matches route registry and existing tool index exactly',()=>{
 const source=read('rv-tool-index.js');
 const catalog=JSON.parse(source.slice(source.indexOf('['),source.lastIndexOf(']')+1));
 assert.equal(catalog.length,135);
 const catalogUrls=new Set(catalog.map(item=>item.url));
 assert.equal(catalogUrls.size,135);
 const mapped=new Set(registry.routes.filter(r=>r.catalog!==null).map(r=>r.path));
 assert.equal(mapped.size,135);
 assert.deepEqual([...mapped].sort(),[...catalogUrls].sort());
 const pilot=registry.routes.filter(r=>r.previewStatus==='preview-built');
 assert.deepEqual(pilot.map(x=>x.path).sort(),['/cista-mzda-kalkulacka.html','/index.html','/mzdy-a-prace.html']);
});

test('protected tools and plan navigation exist and cannot become production silently',()=>{
 const shifted=registry.routes.find(r=>r.path==='/kalkulacka-priplatku-za-smeny.html');
 const superdavka=registry.routes.find(r=>r.path==='/superdavka-kalkulacka.html');
 assert.equal(shifted.risk,'protected-live-calculator');
 assert.equal(superdavka.risk,'legislation-sensitive');
 for(const p of ['RV3_START_HERE.md','docs/rv3/CONTROL_CENTER.md','docs/rv3/ROADMAP.md',
  'docs/rv3/ARCHITECTURE.md','docs/rv3/WORKFLOW.md','docs/rv3/HANDOFF.md',
  'docs/rv3/DECISIONS.md','docs/rv3/SESSION_LOG.md'])assert.ok(existsSync(path.join(root,p)),p);
 const build=read('scripts/build-cloudflare-preview.mjs');
 assert.ok(build.includes("'docs'"),'internal planning docs should not be served as website assets');
 assert.ok(build.includes("excludeFiles=new Set(['CNAME'"),'never copy production DNS asset to preview');
});
