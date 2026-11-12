import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=p=>readFileSync(new URL('../../'+p,import.meta.url));
const logo=read('logo-rv-v32.svg');
const blobHash=createHash('sha1').update('blob '+logo.length+'\\0').update(logo).digest('hex');
const shell=read('rv3/engine/shell-v2.mjs').toString('utf8');
const css=read('rv3/catalog-v2.css').toString('utf8');

test('V3 must preserve the existing RychleVypocty logo bytes',()=>{
 assert.equal(blobHash,'4bb11036d1fab3161d95cfd3605f532d1414360a','The established logo changed without explicit approval');
});

test('Header and footer must reference exact original SVG, not a recreated wordmark',()=>{
 assert.equal((shell.match(/src="\\/logo-rv-v32\\.svg"/g)||[]).length,2);
 assert.ok(!shell.includes('rv3d-footer-wordmark'));
 assert.ok(css.includes('.rv3d-footer-brand img'));
 assert.ok(!css.includes('.rv3d-footer-brand{background:white'),'No white sticker around footer branding');
});
