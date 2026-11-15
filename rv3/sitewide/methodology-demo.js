/* RV3 Jak počítáme — tiny, dependency-free worked model.
 * Price 1,000 Kč; variable cost 600 Kč; fixed costs held constant.
 * Same model as "Sleva vs. potřebný objem prodeje" dataset.
 */
export const MODEL_PRICE=1000;
export const MODEL_COST=600;
export const DISCOUNTS=Object.freeze([0,5,10,15,20]);

export function discountScenario(percent){
 if(typeof percent!=='number'||!Number.isFinite(percent)||percent<0||percent>39)
   throw new RangeError('Discount must be a finite percentage leaving positive contribution');
 const afterPrice=MODEL_PRICE*(1-percent/100);
 const afterContribution=afterPrice-MODEL_COST;
 if(afterContribution<=0)throw new RangeError('Non-positive contribution has no finite break-even');
 const beforeContribution=MODEL_PRICE-MODEL_COST;
 return {
  percent,afterPrice,afterContribution,
  volumeIncreasePercent:(beforeContribution/afterContribution-1)*100,
  barPercent:afterContribution/beforeContribution*100
 };
}
export const formatCzk=value=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(value)+' Kč';
export const formatVolume=value=>'+'+new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value)+' %';

export function mountMethodDemo(root){
 if(!root)return false;
 const buttons=[...root.querySelectorAll('[data-discount]')];
 const price=root.querySelector('[data-after-price]');
 const contribution=root.querySelector('[data-after-contribution]');
 const bar=root.querySelector('[data-after-bar]');
 const barLabel=root.querySelector('[data-after-bar-label]');
 const volume=root.querySelector('[data-needed-volume]');
 if(buttons.length!==DISCOUNTS.length||!buttons.every((button,i)=>Number(button.dataset.discount)===DISCOUNTS[i])||
   !price||!contribution||!bar||!barLabel||!volume)throw Error('Methodology demo markup incomplete');
 function update(percent){
  const scenario=discountScenario(percent);
  price.textContent=formatCzk(scenario.afterPrice);
  contribution.textContent=formatCzk(scenario.afterContribution);
  barLabel.textContent=formatCzk(scenario.afterContribution);
  bar.style.width=scenario.barPercent.toFixed(4)+'%';
  volume.textContent=formatVolume(scenario.volumeIncreasePercent);
  for(const button of buttons)button.setAttribute('aria-pressed',String(Number(button.dataset.discount)===percent));
 }
 for(const button of buttons)button.addEventListener('click',()=>update(Number(button.dataset.discount)));
 update(10);
 return true;
}
if(typeof document!=='undefined'){
 const root=document.querySelector('[data-method-demo]');
 if(root)mountMethodDemo(root);
}
