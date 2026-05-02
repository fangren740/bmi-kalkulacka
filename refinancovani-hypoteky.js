
(() => {
  const form = document.getElementById('refiForm');
  const resetBtn = document.getElementById('resetBtn');
  const ids = ['remainingPrincipal','remainingYears','currentRate','newRate','newYears','refiFees','monthlyFeeCurrent','monthlyFeeNew','incomeShare'];
  const $ = (id) => document.getElementById(id);
  const money = (v) => new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
  const percent = (v) => new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(Number.isFinite(v)?v:0) + ' %';
  const annuity = (principal, rate, years) => { const months = years * 12; const mr = rate / 100 / 12; const monthlyPayment = mr === 0 ? principal / months : principal * mr / (1 - Math.pow(1 + mr, -months)); return { months, monthlyPayment, totalPaid: monthlyPayment * months, totalInterest: monthlyPayment * months - principal }; };
  const read = () => ({ remainingPrincipal:+$('remainingPrincipal').value||0, remainingYears:+$('remainingYears').value||0, currentRate:+$('currentRate').value||0, newRate:+$('newRate').value||0, newYears:+$('newYears').value||0, refiFees:+$('refiFees').value||0, monthlyFeeCurrent:+$('monthlyFeeCurrent').value||0, monthlyFeeNew:+$('monthlyFeeNew').value||0, incomeShare:+$('incomeShare').value||35 });
  function render(){
    const v = read();
    if (!v.remainingPrincipal || !v.remainingYears || !v.newYears) return;
    const current = annuity(v.remainingPrincipal, v.currentRate, v.remainingYears);
    const fresh = annuity(v.remainingPrincipal, v.newRate, v.newYears);
    const currentMonthly = current.monthlyPayment + v.monthlyFeeCurrent;
    const newMonthly = fresh.monthlyPayment + v.monthlyFeeNew;
    const currentTotal = current.totalPaid + v.monthlyFeeCurrent * current.months;
    const newTotal = fresh.totalPaid + v.monthlyFeeNew * fresh.months + v.refiFees;
    const netSaving = currentTotal - newTotal;
    const monthlyDifference = currentMonthly - newMonthly;
    const interestSaving = current.totalInterest - fresh.totalInterest;
    const neededIncome = newMonthly / (v.incomeShare / 100);
    $('netSaving').textContent = money(netSaving);
    $('newMonthlyPayment').textContent = money(newMonthly);
    $('monthlyDifference').textContent = money(monthlyDifference);
    $('neededIncome').textContent = money(neededIncome);
    $('currentMonthlyPayment').textContent = money(currentMonthly);
    $('currentTotalInterest').textContent = money(current.totalInterest);
    $('newTotalInterest').textContent = money(fresh.totalInterest);
    $('interestSaving').textContent = money(interestSaving);
    $('newTotalWithFees').textContent = money(newTotal);
    $('heroNewRate').textContent = percent(v.newRate);
    $('heroCurrentRate').textContent = percent(v.currentRate);
    $('heroMonthlyDiff').textContent = money(monthlyDifference);
    $('heroNetSaving').textContent = money(netSaving);
    $('heroNewPayment').textContent = money(newMonthly);
    $('resultBadge').textContent = netSaving > 0 ? 'Nová nabídka vychází levněji' : 'Nová nabídka nevychází levněji';
    $('decisionHeadline').textContent = netSaving > 0 ? 'Refinancování orientačně dává smysl' : 'Refinancování je potřeba znovu ověřit';
    $('decisionText').textContent = netSaving > 0 ? `Po započtení poplatků vychází úspora přibližně ${money(netSaving)} a měsíční rozdíl ${money(monthlyDifference)}.` : `Po započtení poplatků nová varianta nevychází levněji. Hlídejte hlavně splatnost, poplatky a fixaci.`;
    $('nextStepText').textContent = 'Další krok: vyžádejte si RPSN, podmínky fixace a porovnejte nabídku se současnou bankou.';
    $('comparisonBody').innerHTML = `<tr><td>Stávající hypotéka</td><td>${money(currentMonthly)}</td><td>${money(current.totalInterest)}</td><td>${money(currentTotal)}</td></tr><tr><td>Nová nabídka</td><td>${money(newMonthly)}</td><td>${money(fresh.totalInterest)}</td><td>${money(newTotal)}</td></tr><tr><td>Rozdíl</td><td>${money(monthlyDifference)}</td><td>${money(interestSaving)}</td><td>${money(netSaving)}</td></tr>`;
  }
  form.addEventListener('submit', (e)=>{e.preventDefault(); render();});
  ids.forEach(id => $(id).addEventListener('input', render));
  ids.forEach(id => $(id).addEventListener('change', render));
  resetBtn.addEventListener('click', () => { form.reset(); render(); });
  render();
})();
