import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const load=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const pages=[['index.html','https://rychlevypocty.cz/'],['mzdy-a-prace.html','https://rychlevypocty.cz/mzdy-a-prace.html'],['cista-mzda-kalkulacka.html','https://rychlevypocty.cz/cista-mzda-kalkulacka.html']];
test('three source-clean pages retain legacy identity and canonical',()=>{
 for(const [path,canonical] of pages){
  const h=load(path);
  assert.ok(h.includes('src="/logo-rv-v32.svg"'),path+' missing original brand');
  assert.ok(h.includes('href="/rv3/foundation.css"'),path+' missing new design system');
  assert.ok(h.includes('href="'+canonical+'"'),path+' canonical changed');
  assert.ok(!h.includes('rv3/site.css'),path+' old stylesheet still loaded');
  const ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,path+' duplicate id');
 }
 const home=load('index.html');
 assert.ok(home.includes('id="offer-before"')&&home.includes('id="offer-after"'),'home missing real comparison');
 assert.ok(home.includes('href="/kalkulacka-priplatku-za-smeny.html"'),'organic priority hidden');
});
test('independent 2026 engine works with salary offer comparison',()=>{
 const win={};runInNewContext(load('rv3/salary-engine.js'),{window:win});
 assert.equal(win.RV3Salary.standardScenario(42000,true,false).netSalary,33398);
 assert.equal(win.RV3Salary.standardScenario(52000,true,false).netSalary,40738);
});
function fakeDom(){
 const es=new Map();
 const elem=(id,value='')=>{
  const e={id,value,checked:false,textContent:'',hidden:false,open:false,style:{},attributes:{},events:{},classList:{add(){},remove(){}},
   setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]},
   addEventListener(k,fn){this.events[k]=fn},reset(){},
   getAttribute(k){return this.attributes[k]},
  };es.set(id,e);return e;
 };
 const doc={getElementById:k=>es.get(k)||null,querySelector(){return null},querySelectorAll(){return []},addEventListener(){}};
 return {elem,es,doc};
}
test('comparison reacts to input and does not present stale values',()=>{
 const win={};runInNewContext(load('rv3/salary-engine.js'),{window:win});
 const {elem,es,doc}=fakeDom();
 for(const id of ['offer-before','offer-after','offer-difference','offer-year','offer-help'])elem(id);
 es.get('offer-before').value='42000';es.get('offer-after').value='52000';
 runInNewContext(load('rv3/product-ui.js'),{window:win,document:doc});
 const compact=v=>v.replace(/[\s\u00a0\u202f]/g,'');
 assert.equal(compact(es.get('offer-difference').textContent),'+7340Kč');
 assert.equal(compact(es.get('offer-year').textContent),'+88080Kč');
 es.get('offer-after').value='42000';es.get('offer-after').events.input();
 assert.equal(compact(es.get('offer-difference').textContent),'0Kč');
 es.get('offer-before').value='';es.get('offer-before').events.input();
 assert.equal(es.get('offer-year').textContent,'—');
});
test('new salary form uses same engine, allows scenarios and validates user input',()=>{
 const win={};runInNewContext(load('rv3/salary-engine.js'),{window:win});
 const {elem,es,doc}=fakeDom();
 const inputIds=['s-form','s-valid-result','s-invalid-result','s-error','s-gross','s-children','s-declaration',
 's-advanced','s-bonus','s-other','s-extra-children','s-invalidity','s-year-base','s-ztp','s-pensioner','s-health-min','s-cap','s-reset',
 's-net','s-percentage','s-gross-out','s-social','s-health','s-tax','s-cost','s-tax-bonus','s-bonus-line','s-after-line','s-after',
 's-tax-base','s-tax-before','s-discounts','s-child-credit','s-employer-social','s-employer-health','s-context'];
 for(const id of inputIds)elem(id);
 Object.assign(es.get('s-gross'),{value:'45000'});
 Object.assign(es.get('s-children'),{value:'0'});
 es.get('s-declaration').checked=true;es.get('s-cap').checked=true;
 for(const id of ['s-bonus','s-other','s-extra-children','s-invalidity','s-year-base'])es.get(id).value='0';
 runInNewContext(load('rv3/product-ui.js'),{window:win,document:doc});
 const compact=v=>v.replace(/[\s\u00a0\u202f]/g,'');
 assert.equal(compact(es.get('s-net').textContent),'35600Kč');
 assert.equal(compact(es.get('s-cost').textContent),'60210Kč');
 es.get('s-gross').value='60000';es.get('s-children').value='2';es.get('s-form').events.input();
 assert.equal(compact(es.get('s-net').textContent),'49737Kč');
 es.get('s-gross').value='45000';es.get('s-children').value='0';es.get('s-declaration').checked=false;
 es.get('s-form').events.change();
 assert.equal(compact(es.get('s-net').textContent),'33030Kč');
 es.get('s-gross').value='';es.get('s-form').events.input();
 assert.equal(es.get('s-valid-result').hidden,true);
 assert.equal(es.get('s-error').hidden,false);
});


test('Czech question search resolves meaningful intent to existing, preserved tools',()=>{
  const es=new Map();
  const elem=tag=>({tag,children:[],textContent:'',href:'',hidden:false,events:{},dataset:{},
     addEventListener(name,fn){this.events[name]=fn},
     append(...nodes){this.children.push(...nodes)},
     replaceChildren(){this.children=[]},
     setAttribute(){},contains(){return false},
     querySelector(){return this.children.find(x=>x.tag==='a')||null},
     click(){}
  });
  const input=elem('input');input.value='';
  const output=elem('div');es.set('tool-search',input);es.set('tool-results',output);
  const document={
    getElementById:id=>es.get(id)||null,
    querySelector(){return null},
    querySelectorAll(){return []},
    addEventListener(){},
    createElement:tag=>elem(tag)
  };
  runInNewContext(load('rv3/product-ui.js'),{window:{},document});
  for(const [query,want] of [
    ['příplatek za víkend','/kalkulacka-priplatku-za-smeny.html'],
    ['čistá mzda','/cista-mzda-kalkulacka.html'],
    ['nemocné dítě','/ocr-kalkulacka.html'],
    ['hypotéka','/hypotecni-kalkulacka.html']
  ]){
    input.value=query;
    input.events.input();
    assert.equal(output.hidden,false,query+' should show results');
    assert.equal(output.children[0]?.href,want,query+' first choice');
  }
});


test('Studio scenario presets and net salary bars use original salary engine',()=>{
 const window={};runInNewContext(load('rv3/salary-engine.js'),{window});
 const {elem,es,doc}=fakeDom();
 for(const id of ['offer-before','offer-after','offer-difference','offer-year','offer-help',
  'offer-net-before','offer-net-after','offer-bar-before','offer-bar-after',
  'offer-copy','offer-copy-status'])elem(id);
 const preset=elem('preset');preset.dataset={offerIncrease:'10000'};
 doc.querySelectorAll=selector=>selector==='[data-offer-increase]'?[preset]:[];
 es.get('offer-before').value='42000';es.get('offer-after').value='52000';
 let copied='';
 const navigator={clipboard:{writeText:async value=>{copied=value}}};
 runInNewContext(load('rv3/product-ui.js'),{window,document:doc,navigator});
 const compact=v=>v.replace(/[\s\u00a0\u202f]/g,'');
 assert.equal(compact(es.get('offer-net-before').textContent),'33398Kč');
 assert.equal(compact(es.get('offer-net-after').textContent),'40738Kč');
 assert.equal(es.get('offer-bar-after').style.width,'100.00%');
 assert.ok(parseFloat(es.get('offer-bar-before').style.width)>80);
 assert.equal(preset.attributes['aria-pressed'],'true');
 es.get('offer-after').value='67000';es.get('offer-after').events.input();
 assert.equal(preset.attributes['aria-pressed'],'false');
 preset.events.click();
 assert.equal(es.get('offer-after').value,'52000');
 assert.equal(compact(es.get('offer-difference').textContent),'+7340Kč');
 es.get('offer-copy').events.click();
 assert.ok(copied.includes('33')&&copied.includes('40'),'copied summary must include both net amounts');
 es.get('offer-before').value='';es.get('offer-before').events.input();
 assert.equal(es.get('offer-net-before').textContent,'—');
 assert.equal(es.get('offer-bar-after').style.width,'0%');
 assert.equal(es.get('offer-copy').disabled,true);
});
