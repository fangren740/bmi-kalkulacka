'use strict';

/*
 * RV V8 change-aware browser evidence.
 * Discovers the real production HTML pages affected by a PR, including pages
 * which load modified CSS/JS/assets. It does NOT certify calculation correctness
 * or design quality; those still require topic-specific tests and visual review.
 */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');
const OUTPUT = process.env.RV_QA_OUTPUT || '/tmp/rv-v8-change-aware-qa';
const MAX_PAGES = Number(process.env.RV_QA_MAX_PAGES || 40);
const SITE_ORIGIN = 'https://rychlevypocty.cz';
const ASSET_EXT = /\.(?:css|js|mjs|json|csv|svg|png|jpe?g|webp|gif|woff2?|ico)$/i;

function listPages(root = ROOT) {
  return fs.readdirSync(root).filter(x => x.endsWith('.html') && fs.statSync(path.join(root, x)).isFile()).sort();
}
function siteFile(raw, from) {
  if (!raw || /^(?:#|data:|mailto:|tel:|javascript:|blob:)/i.test(raw)) return null;
  let v = String(raw).trim().replace(/^["']|["']$/g, '');
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      if (u.origin !== SITE_ORIGIN) return null;
      v = u.pathname;
    } catch { return null; }
  } else if (/^\/\//.test(v)) return null;
  v = v.split(/[?#]/, 1)[0];
  try { v = decodeURIComponent(v); } catch { return null; }
  if (!v || v === '/') return 'index.html';
  const result = v.startsWith('/') ? path.posix.normalize(v.slice(1)) : path.posix.normalize(path.posix.join(path.posix.dirname(from), v));
  if (result === '..' || result.startsWith('../') || path.posix.isAbsolute(result)) return null;
  return result;
}
function referencedFiles(content, file) {
  const out = new Set();
  const add = raw => {
    const f = siteFile(raw, file);
    if (f && ASSET_EXT.test(f)) out.add(f);
  };
  if (file.endsWith('.html')) {
    const attributes = /\b(?:src|href|data-src)\s*=\s*(["'])(.*?)\1/gi;
    let m;
    while ((m = attributes.exec(content))) add(m[2]);
    const srcsets = /\bsrcset\s*=\s*(["'])(.*?)\1/gi;
    while ((m = srcsets.exec(content))) {
      for (const segment of m[2].split(',')) add(segment.trim().split(/\s+/)[0]);
    }
  }
  if (file.endsWith('.css')) {
    const urls = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
    let m;
    while ((m = urls.exec(content))) add(m[2]);
    const imports = /@import\s+(?:url\()?["']([^"']+)["']/gi;
    while ((m = imports.exec(content))) add(m[1]);
  }
  if (/\.(?:js|mjs)$/.test(file)) {
    const imports = /\b(?:import|export)\s+(?:[\s\S]{0,100}?\s+from\s+)?["']([^"']+)["']/g;
    let m;
    while ((m = imports.exec(content))) add(m[1]);
    const dynamic = /\b(?:import|fetch)\(\s*["']([^"']+)["']/g;
    while ((m = dynamic.exec(content))) add(m[1]);
  }
  return out;
}
function dependencies(page, root = ROOT) {
  const visited = new Set();
  const pending = [page];
  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    const full = path.join(root, file);
    if (!full.startsWith(root + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    if (!/\.(?:html|css|js|mjs)$/.test(file)) continue;
    for (const dep of referencedFiles(fs.readFileSync(full, 'utf8'), file)) {
      if (!visited.has(dep)) pending.push(dep);
    }
  }
  return visited;
}
function discover(changed, root = ROOT) {
  const changedNames = changed.map(p => p.replace(/\\/g, '/')).filter(Boolean);
  const changedSet = new Set(changedNames);
  const publicChanges = changedNames.filter(p => !p.includes('/') && (p.endsWith('.html') || ASSET_EXT.test(p)));
  const affected = [];
  const assetsFound = new Set();
  for (const html of listPages(root)) {
    const deps = dependencies(html, root);
    const matches = publicChanges.filter(x => deps.has(x));
    if (matches.length) {
      affected.push({html, causes:matches});
      for (const x of matches) assetsFound.add(x);
    }
  }
  const unmapped = publicChanges.filter(x => ASSET_EXT.test(x) && !x.endsWith('.html') && !assetsFound.has(x));
  return {changed: changedNames, publicChanges, affected, unmapped, affectedCount:affected.length};
}
function changedFiles() {
  if (process.env.RV_QA_CHANGED_FILES) {
    return process.env.RV_QA_CHANGED_FILES.split('\n').map(x => x.trim()).filter(Boolean);
  }
  const base = process.env.RV_QA_BASE_SHA;
  if (!base) throw new Error('RV_QA_BASE_SHA is required on PR builds; cannot safely guess the comparison base.');
  return cp.execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', '-z', base, 'HEAD'], {cwd:ROOT}).toString('utf8').split('\0').filter(Boolean);
}
function save(name, value) {
  fs.mkdirSync(OUTPUT, {recursive:true});
  fs.writeFileSync(path.join(OUTPUT, name), JSON.stringify(value, null, 2) + '\n');
}
function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(OUTPUT, 'affected.json'), 'utf8'));
}
function prepare() {
  const result = discover(changedFiles());
  result.generatedAt = new Date().toISOString();
  result.candidateSha = cp.execFileSync('git', ['rev-parse', 'HEAD'], {cwd:ROOT}).toString().trim();
  result.preview = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
  result.canaryOnly = !result.affectedCount;
  if (result.canaryOnly) result.affected = [{html:'index.html', causes:['QA canary only']}];
  save('affected.json', result);
  console.log(JSON.stringify({status:'DISCOVERED', affectedCount:result.affectedCount, pages:result.affected.map(x=>x.html), unmapped:result.unmapped, canaryOnly:result.canaryOnly}));
  if (result.affectedCount > MAX_PAGES) {
    throw new Error('WIDE IMPACT: ' + result.affectedCount + ' pages; scope exceeds QA limit ' + MAX_PAGES + '. Provide a separate comprehensive impact audit; do not silently sample.');
  }
  // A modified top-level JS not mapped to a page may still be executed through
  // dynamic loading. It must not silently pass without an impact assessment.
  const looseJs = result.unmapped.filter(x => /\.(?:js|mjs)$/.test(x));
  if (looseJs.length) throw new Error('UNMAPPED SITE JS: ' + looseJs.join(', ') + '. Fix dependency discovery or document and verify every affected page.');
}
async function smoke() {
  const manifest = readManifest();
  const {chromium} = require('playwright');
  const browser = await chromium.launch({headless:true});
  const base = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
  const rows = [];
  const baselineRows = [];
  let liveAvailable = true;
  let failed = false;
  try {
    for (const item of manifest.affected) {
      for (const width of [320, 390, 768, 1440]) {
        const page = await browser.newPage({viewport:{width,height:900}, locale:'cs-CZ', reducedMotion:'reduce'});
        const errors = [];
        const assets = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('response', response => {
          const u = new URL(response.url());
          const resource = response.request().resourceType();
          if (u.origin === base && ['script','stylesheet','document'].includes(resource) && response.status() >= 400) {
            assets.push({url:u.pathname, status:response.status()});
          }
        });
        let code = null, metrics = null;
        try {
          const response = await page.goto(base + '/' + item.html, {waitUntil:'load',timeout:45000});
          code = response ? response.status() : null;
          await page.waitForTimeout(160);
          metrics = await page.evaluate(() => {
            const doc = document.documentElement;
            const visible = selector => [...document.querySelectorAll(selector)].filter(x => {
              const r = x.getBoundingClientRect();
              const s = getComputedStyle(x);
              return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none';
            });
            return {
              title:document.title,
              h1Count:visible('h1').length,
              overflow: Math.max(doc.scrollWidth, document.body.scrollWidth) - innerWidth,
              bodyTextLength:document.body.innerText.trim().length,
              inputs:visible('input, select, textarea').length,
              buttons:visible('button').length,
              htmlLang:doc.lang || ''
            };
          });
          if ([390,1440].includes(width)) {
            await page.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0,0); });
            await page.waitForTimeout(75);
            const shot = item.html.replace(/[^a-zA-Z0-9._-]/g, '_') + '-' + width + '-CANDIDATE.png';
            await page.screenshot({path:path.join(OUTPUT,shot),fullPage:true,animations:'disabled'});
            // A screenshot is evidence for review, not an automated product PASS.
            if (!manifest.canaryOnly) {
              if (!liveAvailable) {
                baselineRows.push({html:item.html,width,status:'NOT_RUN',reason:'LIVE capture failed previously'});
              } else {
                const livePage = await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
                try {
                  const liveResponse = await livePage.goto(SITE_ORIGIN + '/' + item.html, {waitUntil:'load',timeout:15000});
                  if (!liveResponse || liveResponse.status() !== 200) {
                    baselineRows.push({html:item.html,width,status:'NOT_AVAILABLE',http:liveResponse && liveResponse.status()});
                  } else {
                    await livePage.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0,0); });
                    await livePage.waitForTimeout(75);
                    const liveShot = item.html.replace(/[^a-zA-Z0-9._-]/g, '_') + '-' + width + '-LIVE.png';
                    await livePage.screenshot({path:path.join(OUTPUT,liveShot),fullPage:true,animations:'disabled'});
                    baselineRows.push({html:item.html,width,status:'CAPTURED',file:liveShot});
                  }
                } catch(e) {
                  liveAvailable = false;
                  baselineRows.push({html:item.html,width,status:'NOT_RUN',reason:e.message});
                } finally { await livePage.close(); }
              }
            }
          }
        } catch(e) {
          errors.push('NAVIGATION_OR_RENDER: ' + e.message);
        }
        const problems = [
          ...(code !== 200 ? ['HTTP_' + code] : []),
          ...errors.map(x => 'JS_' + x),
          ...assets.map(x => 'ASSET_' + x.status + '_' + x.url)
        ];
        if (metrics) {
          if (metrics.overflow > 2) problems.push('HORIZONTAL_OVERFLOW_' + metrics.overflow);
          if (!metrics.title) problems.push('MISSING_TITLE');
          if (metrics.h1Count < 1) problems.push('MISSING_H1');
          if (metrics.bodyTextLength < 50) problems.push('EMPTY_BODY');
        }
        const row = {html:item.html, width, causes:item.causes, code, metrics, errors, assets, problems};
        rows.push(row);
        if (problems.length) failed = true;
        await page.close();
      }
    }
  } finally {
    await browser.close();
    save('smoke.json', {candidateSha:manifest.candidateSha, canaryOnly:manifest.canaryOnly, rows, baselineRows, browserSmokeStatus:failed?'FAIL':'PASS', arithmeticTests:'NOT_RUN', productVisualReview:'NOT_RUN'});
  }
  console.log(JSON.stringify({status:failed?'FAIL':'BROWSER_SMOKE_PASS', rows:rows.length, affected:manifest.affected.length, liveCaptures:baselineRows.filter(x=>x.status==='CAPTURED').length, arithmeticTests:'NOT_RUN', productVisualReview:'NOT_RUN', failures:rows.filter(x=>x.problems.length).map(x=>({page:x.html,width:x.width,problems:x.problems}))}));
  if (failed) process.exitCode = 1;
}
async function run() {
  const action = process.argv[2];
  if (action === 'discover') prepare();
  else if (action === 'smoke') await smoke();
  else throw new Error('Usage: node rv-change-aware-qa.cjs discover|smoke');
}
if (require.main === module) run().catch(e => {console.error(e.stack||e); process.exitCode=1;});
module.exports={siteFile,referencedFiles,dependencies,discover,changedFiles};
