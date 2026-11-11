/* RychléVýpočty V3: calculator-first homepage. All numbers from unchanged RV3Salary engine. */
(()=>{'use strict';
const salary=window.RV3Salary;
const $=id=>document.getElementById(id);
const gross=$('rv3-quick-gross');
const result=$('rv3-quick-net');
if(!gross||!result)return;
const children=$('rv3-quick-children');
const declaration=$('rv3-quick-declaration');
const money=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(n))+' Kč';
const parse=s=>{const v=String(s??'').trim().replace(/[\s\u00a0]/g,'').replace(',','.');return v===''?NaN:Number(v)};
const put=(id,value)=>{const el=$(id);if(el)el.textContent=value};
const signed=n=>n<0?'−'+money(-n):n>0?'+'+money(n):money(0);
function empty(){
 result.textContent='—';
 put('rv3-quick-share','—');
 put('rv3-quick-gross-out','—');
 put('rv3-quick-taxes','—');
 put('rv3-quick-cost','—');
 const bar=$('rv3-quick-share-bar');if(bar)bar.style.width='0%';
}
function update(){
 const amount=parse(gross.value);
 if(!salary||!Number.isFinite(amount)||amount<=0||amount>1e8){empty();gross.setAttribute('aria-invalid','true');return}
 gross.removeAttribute('aria-invalid');
 const count=Number(children?.value||0);
 const r=salary.calculate({
  mode:'basic',grossBase:amount,bonus:0,otherDeductions:0,
  taxDeclaration:declaration?.checked??true,disabilityDiscount:0,
  ztpDiscount:false,pensionerDiscount:false,healthMinimum:false,
  applySocialCap:true,yearSocialBase:0,
  children:{first:count>=1,second:count>=2,thirdPlus:Math.max(0,count-2)}
 });
 result.textContent=money(r.netSalary);
 put('rv3-quick-share',money(Math.round(r.netGrossRatio)));
 put('rv3-quick-gross-out',money(r.gross));
 put('rv3-quick-taxes',signed(-r.mandatoryDeductions));
 put('rv3-quick-cost',money(r.totalCost));
 const bar=$('rv3-quick-share-bar');if(bar)bar.style.width=Math.min(100,Math.max(0,r.netGrossRatio))+'%';
}
gross.addEventListener('input',update);
children?.addEventListener('change',update);
declaration?.addEventListener('change',update);
document.querySelectorAll('[data-home-gross]').forEach(b=>b.addEventListener('click',()=>{
 gross.value=b.dataset.homeGross;
 if(children)children.value=b.dataset.homeKids||'0';
 if(declaration)declaration.checked=true;
 update();
}));
update();
})();
