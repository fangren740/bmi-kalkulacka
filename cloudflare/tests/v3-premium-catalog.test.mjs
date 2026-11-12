import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCatalogV2} from '../../rv3/engine/catalog-v2.mjs';

const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=read('rv-tool-index.js');
const tools=JSON.parse(source.slice(source.indexOf('['),source.lastIndexOf(']')+1));
const taxonomy=JSON.parse(read('rv3/engine/catalog-v2.taxonomy.json'));

test('V3 design preserves 135 links, 8 categories, 6 quick routes and original logo',()=>{
 const {html,report}=renderCatalogV2(tools,taxonomy);
 assert.equal(report.total,135);
 assert.equal(report.groups.length,8);
 assert.equal(html.split('class="rv3d-tool-link ').length-1,135);
 assert.equal(html.split('class="rv3d-domain-illustration"').length-1,8);
 assert.equal(html.split('class="rv3d-quick-icon"').length-1,6);
 assert.equal(html.split('class="rv3d-quick-ordinal"').length-1,6);
 assert.equal(html.split('src="/logo-rv-v32.svg"').length-1,2);
 assert.ok(html.includes('href="/rv3/catalog-v3-theme.css"'));
 assert.ok(html.includes('content="noindex,nofollow,noarchive"'));
});

test('Local hero art is small, static and uses no remote assets',()=>{
 const svg=read('rv3/assets/hero-desk.svg');
 const css=read('rv3/catalog-v3-theme.css');
 assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
 assert.ok(svg.length<12000);
 assert.ok(css.length<6000);
 assert.ok(css.includes('url("/rv3/assets/hero-desk.svg")'));
 assert.ok(!css.includes('@import'));
 assert.ok(!css.includes('url("http'));
 assert.ok(!svg.includes('<script'));
 assert.ok(!svg.includes('<image'));
});

test('Search button reuses local Czech search engine',()=>{
 const html=renderCatalogV2(tools,taxonomy).html;
 const ui=read('rv3/catalog-v2-ui.mjs');
 assert.ok(html.includes('id="rv3d-search-submit"'));
 assert.ok(ui.includes("getElementById('rv3d-search-submit')"));
 assert.ok(ui.includes("submit.addEventListener('click'"));
 assert.ok(ui.includes("rankTools(items,value)"));
 assert.ok(!ui.includes('fetch('));
 assert.ok(!ui.includes('sendBeacon'));
});
