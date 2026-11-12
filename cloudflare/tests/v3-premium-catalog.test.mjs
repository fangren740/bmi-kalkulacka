import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCatalogV2} from '../../rv3/engine/catalog-v2.mjs';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=read('rv-tool-index.js');
const tools=JSON.parse(source.slice(source.indexOf('['),source.lastIndexOf(']')+1));
const taxonomy=JSON.parse(read('rv3/engine/catalog-v2.taxonomy.json'));

test('V3 premium design preserves all 135 routes and 8 real categories',()=>{
 const {html,report}=renderCatalogV2(tools,taxonomy);
 assert.equal(report.total,135);
 assert.equal(report.groups.length,8);
 assert.equal((html.match(/class="rv3d-tool-link /g)||[]).length,135);
 assert.equal((html.match(/class="rv3d-domain-illustration"/g)||[]).length,8);
 assert.equal((html.match(/class="rv3d-quick-icon"/g)||[]).length,6);
 assert.equal((html.match(/class="rv3d-quick-ordinal"/g)||[]).length,6);
 assert.equal((html.match(/src="\\/logo-rv-v32\\.svg"/g)||[]).length,2);
 assert.ok(html.includes('href="/rv3/catalog-v3-theme.css"'));
 assert.ok(html.includes('content="noindex,nofollow,noarchive"'));
});

test('V3 illustration is local, lightweight and does not require external data',()=>{
 const svg=read('rv3/assets/hero-desk.svg');
 const css=read('rv3/catalog-v3-theme.css');
 assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
 assert.ok(svg.length<12000);
 assert.ok(css.length<6000);
 assert.ok(css.includes('url("/rv3/assets/hero-desk.svg")'));
 assert.ok(!/@import\\b/i.test(css));
 assert.ok(!/url\\(\\s*["']?https?:/i.test(css));
 assert.ok(!/<script\\b/i.test(svg));
 assert.ok(!/<image\\b/i.test(svg));
});

test('V3 search action invokes existing private on-device ranking',()=>{
 const html=renderCatalogV2(tools,taxonomy).html;
 const ui=read('rv3/catalog-v2-ui.mjs');
 assert.ok(html.includes('id="rv3d-search-submit"'));
 assert.ok(ui.includes("getElementById('rv3d-search-submit')"));
 assert.ok(ui.includes("submit.addEventListener('click'"));
 assert.ok(ui.includes("rankTools(items,value)"));
 assert.ok(!ui.includes('fetch('));
 assert.ok(!ui.includes('sendBeacon'));
});
