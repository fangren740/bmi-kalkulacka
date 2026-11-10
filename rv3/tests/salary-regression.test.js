/* Numerické regresní vektory z produkčního jádra 2026 (main 2041e3ea). Bez externích dependencies. */
'use strict';const assert=require('node:assert/strict');
require('../salary-engine.js');const engine=globalThis.RV3Salary;
const original={mode:'basic',grossBase:45000,bonus:0,otherDeductions:0,taxDeclaration:true,disabilityDiscount:0,ztpDiscount:false,pensionerDiscount:false,healthMinimum:false,applySocialCap:true,yearSocialBase:0,children:{first:false,second:false,thirdPlus:0}};
const vectors=[
['standard 45k',{}, {netSalary:35600,socialEmployee:3195,healthEmployee:2025,taxAfterDiscounts:4180,totalCost:60210}],
['min wage',{grossBase:22400},{netSalary:19011,totalCost:29972}],
['2 children',{grossBase:60000,children:{first:true,second:true,thirdPlus:0}},{netSalary:49737,taxAfterDiscounts:3303}],
['higher tax',{grossBase:160000},{netSalary:118962,taxAfterDiscounts:22478}],
['no declaration',{taxDeclaration:false},{netSalary:33030}],
['child bonus',{grossBase:25000,children:{first:true,second:true,thirdPlus:1}},{netSalary:26367,taxBonus:4267}],
['health minimum',{grossBase:15000,healthMinimum:true},{netSalary:12261,healthEmployee:1674}],
['social cap',{grossBase:160000,yearSocialBase:2320000},{netSalary:128162,socialEmployee:2160}],
['working pensioner',{pensionerDiscount:true},{netSalary:38525,socialEmployee:270}],
['disability/ztp/bonus/other',{disabilityDiscount:420,ztpDiscount:true,bonus:6000,otherDeductions:1200},{netSalary:41769,afterOther:40569}],
['income below bonus threshold',{grossBase:3000,children:{first:true,second:false,thirdPlus:0}},{netSalary:2652,taxBonus:0}]
];
let checks=0;for(const [name,overrides,expected] of vectors){const got=engine.calculate({...original,...overrides});for(const [key,val] of Object.entries(expected)){assert.equal(got[key],val,name+' / '+key);checks++}}
const base=engine.standardScenario(45000,true,false);assert.equal(base.netSalary,35600);
const child=engine.standardScenario(45000,true,true);assert.equal(child.netSalary,36867);
console.log('PASS: '+vectors.length+' golden salary scenarios, '+(checks+2)+' numeric assertions. Does NOT replace browser QA.');
