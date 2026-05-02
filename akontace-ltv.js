
(() => {
  const form = document.getElementById('ltvForm');
  const resetBtn = document.getElementById('resetBtn');
  const ids = ['propertyPrice','ownSavings','reserveAmount','additionalCosts','targetLtv','monthlyIncome'];
  const $ = (id) => document.getElementById(id);
  const money = (v) => new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
  const percent = (v) => new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(Number.isFinite(v)?v:0) + ' %';
  const num = (v) => new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(Number.isFinite(v)?v:0);
  const compactMoney = (v) => {
    const value = Number.isFinite(v) ? v : 0;
    if (Math.abs(value) >= 1000000) return `${num(value / 1000000)} mil. Kč`;
    if (Math.abs(value) >= 1000) return `${num(value / 1000)} tis. Kč`;
    return money(value);
  };
  const read = () => ({ propertyPrice:+$('propertyPrice').value||0, ownSavings:+$('ownSavings').value||0, reserveAmount:+$('reserveAmount').value||0, additionalCosts:+$('additionalCosts').value||0, targetLtv:+$('targetLtv').value||80, monthlyIncome:+$('monthlyIncome').value||0 });
  function calculate(v){
    const usableSavings = Math.max(0, v.ownSavings - v.reserveAmount);
    const fundsAfterCosts = Math.max(0, usableSavings - v.additionalCosts);
    const usedOwnSources = Math.min(v.propertyPrice, fundsAfterCosts);
    const requiredMortgage = Math.max(0, v.propertyPrice - usedOwnSources);
    const ltv = v.propertyPrice > 0 ? requiredMortgage / v.propertyPrice * 100 : 0;
    const targetMortgage = v.propertyPrice * (v.targetLtv / 100);
    const ownForTarget = Math.max(0, v.propertyPrice - targetMortgage);
    const missingForTarget = Math.max(0, ownForTarget - usedOwnSources);
    const incomeMultiple = v.monthlyIncome > 0 ? requiredMortgage / v.monthlyIncome : 0;
    return { usableSavings, fundsAfterCosts, usedOwnSources, requiredMortgage, ltv, ownForTarget, missingForTarget, incomeMultiple };
  }
  function render(){
    const v = read();
    if (!v.propertyPrice) return;
    const r = calculate(v);
    $('requiredMortgage').textContent = money(r.requiredMortgage);
    $('usableDownPayment').textContent = money(r.usedOwnSources);
    $('ltvValue').textContent = percent(r.ltv);
    $('missingForTarget').textContent = money(r.missingForTarget);
    $('summaryIncomeMultiple').textContent = `${num(r.incomeMultiple)}×`;
    $('summaryPropertyPrice').textContent = money(v.propertyPrice);
    $('summaryAdditionalCosts').textContent = money(v.additionalCosts);
    $('summaryReserve').textContent = money(v.reserveAmount);
    $('summaryUsedOwnSources').textContent = money(r.usedOwnSources);
    $('heroLtvValue').textContent = `${percent(r.ltv)} LTV`;
    $('heroPropertyPrice').textContent = compactMoney(v.propertyPrice);
    $('heroOwnSources').textContent = compactMoney(r.usedOwnSources);
    $('heroReserve').textContent = compactMoney(v.reserveAmount);
    $('heroMortgage').textContent = compactMoney(r.requiredMortgage);
    $('ltvBadge').textContent = r.ltv <= v.targetLtv ? `Vešli jste se do ${v.targetLtv} % LTV` : `Do ${v.targetLtv} % LTV chybí vlastní zdroje`;
    $('decisionHeadline').textContent = r.ltv <= v.targetLtv ? 'LTV vychází v cílovém pásmu' : 'Cílové LTV zatím nevychází';
    $('decisionText').textContent = r.ltv <= v.targetLtv ? `Potřebná hypotéka je ${money(r.requiredMortgage)} a LTV přibližně ${percent(r.ltv)}. Po rezervě a nákladech používáte ${money(r.usedOwnSources)} vlastních zdrojů.` : `Potřebná hypotéka je ${money(r.requiredMortgage)} a do cílového LTV chybí přibližně ${money(r.missingForTarget)} vlastních zdrojů.`;
    $('nextStepText').textContent = r.ltv <= v.targetLtv ? 'Další krok: spočítejte měsíční splátku a ověřte, zda sedí do příjmu domácnosti.' : 'Další krok: zkuste levnější nemovitost, vyšší úspory nebo jiný cílový limit LTV.';
    const scenarios = [80,85,90].map(limit => {
      const ownNeed = Math.max(0, v.propertyPrice * (1 - limit / 100));
      const mortgage = Math.max(0, v.propertyPrice - Math.max(r.usedOwnSources, ownNeed));
      const missing = Math.max(0, ownNeed - r.usedOwnSources);
      const state = missing > 0 ? `chybí ${money(missing)}` : 'splněno';
      return `<tr><td>LTV ${limit} %</td><td>${money(ownNeed)}</td><td>${money(mortgage)}</td><td>${state}</td></tr>`;
    }).join('');
    $('breakdownBody').innerHTML = scenarios;
  }
  form.addEventListener('submit', (e)=>{e.preventDefault(); render();});
  ids.forEach(id => $(id).addEventListener('input', render));
  ids.forEach(id => $(id).addEventListener('change', render));
  resetBtn.addEventListener('click', () => { form.reset(); render(); });
  render();
})();
