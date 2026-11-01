'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  siteFile, referencedFiles, dependencies, discover
} = require('./rv-change-aware-qa.cjs');

test('recognize only local site assets without query strings or fragments', () => {
  assert.equal(siteFile('/superdavka-vnext.js?v=2026', 'superdavka-kalkulacka.html'), 'superdavka-vnext.js');
  assert.equal(siteFile('https://rychlevypocty.cz/rv-tool-master.css?v=4', 'index.html'), 'rv-tool-master.css');
  assert.equal(siteFile('../foo.js', 'index.html'), null);
  assert.equal(siteFile('https://example.com/foo.js', 'index.html'), null);
  assert.equal(siteFile('data:text/plain,hi', 'index.html'), null);
});
test('static dependency scanner catches modified JS/CSS linked by HTML', () => {
  const html = '<link rel="stylesheet" href="/styles/tool.css?v=1"><script defer src="/scripts/tool.js?v=2"></script><img src="/logo-rv-v32.svg">';
  const refs = referencedFiles(html, 'example.html');
  assert.ok(refs.has('styles/tool.css'));
  assert.ok(refs.has('scripts/tool.js'));
  assert.ok(refs.has('logo-rv-v32.svg'));
});
test('detect CSS imported resources for indirect asset impact', () => {
  const refs = referencedFiles('@import "/styles/base.css"; .x{background:url("/picture.webp")}', 'styles/theme.css');
  assert.ok(refs.has('styles/base.css'));
  assert.ok(refs.has('picture.webp'));
});
test('changed historical superdavka JS maps to its real URL', () => {
  const result = discover(['superdavka-vnext.js']);
  assert.ok(result.affected.some(x => x.html === 'superdavka-kalkulacka.html'));
  assert.equal(result.unmapped.length, 0);
});
test('changed rosný bod JS maps to its own calculator', () => {
  const result = discover(['rosny-bod-page.js']);
  assert.ok(result.affected.some(x => x.html === 'rosny-bod-kalkulacka.html'));
});
test('a GitHub workflow change does not invent affected calculator pages', () => {
  const result = discover(['.github/workflows/rv-predeploy-audit.yml']);
  assert.equal(result.affectedCount, 0);
});
test('candidate dependencies contain its directly linked JS', () => {
  const deps = dependencies('superdavka-kalkulacka.html');
  assert.ok(deps.has('superdavka-vnext.js'));
  assert.ok(deps.has('superdavka-vnext.css'));
});
