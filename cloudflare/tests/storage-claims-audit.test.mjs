import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const claims=read('cookies.html');
const privacy=read('ochrana-osobnich-udaju.html');
const audit=read('docs/rv3/COOKIE_STORAGE_AUDIT_2026-11-20.md');
const programs=[
 ['planovac-dovolene.html','planovac-dovolene.js','rv-vacation-planner-v1'],
 ['smenovy-kalendar.html','smenovy-kalendar.js','rv-shift-calendar-v1']
];
test('known discrepancy: two documented localStorage keys have no matching implementation in the linked scripts',()=>{
 for(const [page,script,key] of programs){
  const html=read(page),js=read(script);
  assert.ok(claims.includes(key),'documented key unexpectedly changed: re-audit required');
  assert.ok(html.includes('/'+script+'?'),'expected linked script moved: re-audit required');
  for(const v of [html,js]){
   assert.ok(!v.includes(key),'stored key now implemented: update audit and visitor documentation');
   assert.ok(!/\b(?:localStorage|sessionStorage|indexedDB)\b/.test(v),
     'storage access now present: audit runtime behavior before marking resolved');
  }
  assert.ok(audit.includes(key));
 }
});
test('discrepancy remains explicitly blocked for release despite green build',()=>{
 assert.ok(privacy.includes('Google Analytics nyní není aktivní'));
 assert.ok(claims.includes('Tyto technologie nyní nejsou aktivní'));
 assert.ok(audit.includes('RELEASE BLOCKED'));
 assert.ok(audit.includes('NENÍ ověřeno'));
});
