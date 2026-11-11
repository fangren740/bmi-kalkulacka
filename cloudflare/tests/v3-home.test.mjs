import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const homepage=read('index.html');
const hub=read('mzdy-a-prace.html');
const salaryPage=read('cista-mzda-kalkulacka.html');
test('original RychléVýpočty visual identity on all pilot pages',()=>{
  for(const html of [homepage,hub,salaryPage]){
    assert.ok(html.includes('src="/logo-rv-v32.svg"'));
    assert.ok(!html.includes('class="logo-mark"'));
    assert.ok(html.includes('href="./rv3/site.css"'));
    assert.ok(html.includes('content="index,follow"'));
    assert.ok(html.includes('class="site-header"'));
    const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,'duplicate DOM IDs');
  }
  assert.ok(homepage.includes('href="https://rychlevypocty.cz/"'),'preserve homepage canonical');
  assert.ok(hub.includes('href="https://rychlevypocty.cz/mzdy-a-prace.html"'),'preserve work hub canonical');
  assert.ok(salaryPage.includes('href="https://rychlevypocty.cz/cista-mzda-kalkulacka.html"'),'preserve salary canonical');
});
test('homepage remains an actual in-browser calculator, not just illustrative figures',()=>{
  const window={},elements={};
  function make(id){return elements[id]={value:'',checked:false,textContent:'',style:{width:''},attributes:{},events:{},
    addEventListener(name,fn){this.events[name]=fn},
    setAttribute(name,val){this.attributes[name]=val},
    removeAttribute(name){delete this.attributes[name]}
  }}
  for(const id of ['rv3-quick-gross','rv3-quick-children','rv3-quick-declaration','rv3-quick-net','rv3-quick-share','rv3-quick-gross-out','rv3-quick-taxes','rv3-quick-cost','rv3-quick-share-bar'])make(id);
  elements['rv3-quick-gross'].value='45000';
  elements['rv3-quick-children'].value='0';
  elements['rv3-quick-declaration'].checked=true;
  const presets=[{dataset:{homeGross:'60000',homeKids:'2'},events:{},addEventListener(key,fn){this.events[key]=fn}}];
  const document={getElementById:id=>elements[id]||null,querySelectorAll:sel=>sel==='[data-home-gross]'?presets:[]};
  runInNewContext(read('rv3/salary-engine.js'),{window});
  runInNewContext(read('rv3/site.js'),{window,document});
  const compact=x=>x.replace(/[\s\u00a0\u202f]/g,'');
  assert.equal(compact(elements['rv3-quick-net'].textContent),'35600Kč');
  assert.equal(compact(elements['rv3-quick-cost'].textContent),'60210Kč');
  presets[0].events.click();
  assert.equal(compact(elements['rv3-quick-net'].textContent),'49737Kč');
  elements['rv3-quick-gross'].value='45000';
  elements['rv3-quick-children'].value='0';
  elements['rv3-quick-declaration'].checked=false;
  elements['rv3-quick-declaration'].events.change();
  assert.equal(compact(elements['rv3-quick-net'].textContent),'33030Kč');
  elements['rv3-quick-gross'].value='';
  elements['rv3-quick-gross'].events.input();
  assert.equal(elements['rv3-quick-net'].textContent,'—','invalid input must not preserve stale result');
});
test('critical homepage paths and no dependency on remote runtime',()=>{
  for(const url of ['/cista-mzda-kalkulacka.html','/mzdy-a-prace.html','/kalkulacka-priplatku-za-smeny.html','/finance-a-hypoteky.html']){
    assert.ok(homepage.includes(url),url+' missing from entry navigation');
  }
  assert.ok(!homepage.includes('https://htmlpreview.github.io'));
  assert.ok(!homepage.includes('https://raw.githack.com'));
  assert.ok(homepage.includes('src="./rv3/salary-engine.js"'));
  assert.ok(homepage.includes('src="./rv3/site.js"'));
});
