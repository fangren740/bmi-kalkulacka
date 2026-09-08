'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = require('../../tapety-core.js');
const defaults={height:'2.5',rollWidth:'50',rollLength:'10',trimTop:'0',trimBottom:'0',match:'free',repeat:'64',offset:'32',aligned:true,openings:false,walls:[{width:'2',customHeight:false,height:'2.5'}]};
const input=changes=>({...defaults,...changes});
// Constants hand-derived in MODEL_AND_EXPECTED.md before core implementation.
const fixtures=[
['T01',input({trimTop:'4',trimBottom:'4'}),{rolls:2,strips:4,lengths:[2580,2580,2580,2580],leftovers:[2260,7420]}],
['T02',input({}),{rolls:1,strips:4,lengths:[2500,2500,2500,2500],leftovers:[0]}],
['T03',input({walls:[{width:'2.001'}]}),{rolls:2,strips:5,leftovers:[0,7500]}],
['T04',input({walls:[{width:'1.5'}],trimTop:'4',trimBottom:'4',match:'straight'}),{rolls:1,strips:3,lengths:[3200,3200,3200],leftovers:[400],repeatExtra:1860}],
['T05',input({trimTop:'4',trimBottom:'4',match:'offset'}),{rolls:2,strips:4,phases:[0,320,0,320],gaps:[0,320,0,0],leftovers:[80,6800]}],
['T06',input({walls:[{width:'1.01'},{width:'0.51',height:'2',customHeight:true}]}),{rolls:2,strips:5,lengths:[2500,2500,2500,2000,2000],leftovers:[500,8000]}],
['T07',input({height:'10.01',walls:[{width:'0.5'}]}),{state:'unavailable'}],
['T08',input({height:'2,501',rollWidth:'53',rollLength:'10,05',trimTop:'2,5',trimBottom:'2,5',walls:[{width:'1,061'}]}),{rolls:1,strips:3,lengths:[2551,2551,2551],leftovers:[2397]}],
['T09',input({height:'2.4',trimTop:'5',trimBottom:'5'}),{rolls:1,strips:4,lengths:[2500,2500,2500,2500],leftovers:[0],trimTotal:400}],
['T10',input({openings:true}),{rolls:1,strips:4,leftovers:[0]}],
['T11',input({walls:[{width:'1.5'}],trimTop:'4',trimBottom:'4',match:'straight',aligned:false}),{rolls:2,strips:3,leftovers:[2960,6160],startAllowance:1280}],
['T12',input({height:'2.4',walls:[{width:'1.5'}],match:'offset',repeat:'60',offset:'20'}),{rolls:1,strips:3,phases:[0,200,400],gaps:[0,200,200],leftovers:[2400]}],
['T13',input({match:'straight',repeat:'1100'}),{state:'unavailable'}],
['T14',input({height:'9.6',walls:[{width:'.5'}],match:'straight',aligned:false}),{state:'invalid'}],
['T14b',input({height:'9.6',walls:[{width:'0.5'}],match:'straight',aligned:false}),{state:'unavailable'}],
['E01',input({rollLength:'0'}),{state:'invalid'}],['E02',input({rollWidth:'0'}),{state:'invalid'}],
['E03',input({height:'-1'}),{state:'invalid'}],['E04',input({height:''}),{state:'empty'}],
['E05',input({height:'abc'}),{state:'invalid'}],['E06',input({height:'Infinity'}),{state:'invalid'}],
['E07',input({height:'9999999999999999999'}),{state:'invalid'}],['E08',input({height:'2.5001'}),{state:'invalid'}],
['E09',input({height:'0.001',rollWidth:'0.1',rollLength:'0.001',walls:[{width:'0.001'}]}),{rolls:1,strips:1,leftovers:[0],lengths:[1]}],
['E10',input({match:'offset',offset:'0'}),{state:'invalid'}],['E11',input({match:'offset',offset:'64'}),{state:'invalid'}],
['E12',input({walls:[{width:'100'}],rollWidth:'0.1'}),{state:'invalid'}],
['E13',input({match:'straight',repeat:'0'}),{state:'invalid'}],
['E14',input({match:'free',repeat:'abc',offset:'abc'}),{rolls:1,strips:4,leftovers:[0]}],
['E15',input({match:'offset',repeat:'64',offset:'32',height:'2.5',walls:[{width:'0.51'},{width:'0.51'}]}),{rolls:2,strips:4,phases:[0,320,0,320],leftovers:[1680,7120]}]
];
const report=[];
for(const [id,raw,expected] of fixtures){
 const result=core.run(raw);const v=result.value;
 const actual={state:result.state};
 if(v) Object.assign(actual,{rolls:v.rolls.length,strips:v.strips.length,lengths:v.strips.map(s=>s.length),leftovers:v.rolls.map(r=>r.leftover),phases:v.strips.map(s=>s.phase),gaps:v.strips.map(s=>s.gap),repeatExtra:v.repeatExtra,startAllowance:v.startAllowance,trimTotal:v.trimTotal});
 for(const [key,value] of Object.entries(expected))assert.deepEqual(actual[key],value,`${id} ${key}`);
 if(!expected.state) assert.equal(result.state,'valid',id);
 report.push({id,expected,actual,status:'PASS'});
}
const parser=[['1 234,50','m','valid',1234500],['1\u00a0234,50','m','valid',1234500],['1234.50','m','valid',1234500],['-1','m','valid',-1000],['0','cm','valid',0],['','m','empty'],['abc','m','invalid'],['1,2,3','m','invalid'],['1.234,5','m','invalid'],['12 34','m','invalid'],['0.01','cm','invalid'],['2.50000','m','valid',2500]];
for(const [raw,unit,kind,value] of parser){const p=core.parseLength(raw,unit);assert.equal(p.kind,kind);if(value!==undefined)assert.equal(p.value,value);}
// Independent physical invariants: length conservation, covering wall widths, phases, no roll overflow.
let invariantCases=0;
for(const match of ['free','straight','offset']) for(const height of ['0.123','1.9','2.5','3.1','8.2']) for(const width of ['0.01','0.53','2.123','9.99']) for(const aligned of [true,false]){
 const out=core.run(input({match,height,aligned,trimTop:'2.5',trimBottom:'4',walls:[{width},{width:'1.7',height:'1.8',customHeight:true}]}));
 if(out.state!=='valid')continue;const v=out.value;
 assert.equal(v.totalCut+v.alignmentWaste+v.startAllowance+v.totalLeftover,v.rolls.length*v.input.rollLength);
 const ids=new Set();for(const roll of v.rolls){let used=0;for(const s of roll.cuts){assert(!ids.has(s.id));ids.add(s.id);used+=s.gap;assert.equal(s.start,used);if(match!=='free')assert.equal(used%v.input.repeat,s.phase);assert(s.length>=v.input.walls[s.wall-1].height+v.input.trimTop+v.input.trimBottom);used+=s.length;}assert.equal(used+roll.allowance+roll.leftover,v.input.rollLength);assert(roll.leftover>=0);}
 for(const w of v.wallSummary){assert(w.count*v.input.rollWidth>=w.width);assert((w.count-1)*v.input.rollWidth<w.width);}
 invariantCases++;
}
const worst=input({height:'6',rollWidth:'1',walls:[{width:'5'}]});
const t=performance.now();for(let i=0;i<100;i++)core.run(worst);const avgMs=(performance.now()-t)/100;
fs.writeFileSync(__dirname+'/test-results.json',JSON.stringify({fixtures:report,parserCases:parser.length,invariantCases,worstCase500StripsMeanMs:avgMs},null,2));
console.log(`${report.length} fixtures PASS; ${parser.length} parser cases PASS; ${invariantCases} physical invariant scenarios PASS; 500 strips mean ${avgMs.toFixed(3)} ms`);
