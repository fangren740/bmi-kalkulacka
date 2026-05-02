
(() => {
  const form = document.getElementById('extraPaymentForm');
  const resetBtn = document.getElementById('resetBtn');
  const ids = ['remainingPrincipal','annualRate','remainingYears','extraPayment','recalculationMode','fee'];
  const $ = (id) => document.getElementById(id);
  const money = (v) => new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Number.isFinite(v)?v:0);
  const compactMoney = (v) => {
    const value = Number.isFinite(v) ? v : 0;
    if (Math.abs(value) >= 1000000) return `${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(value / 1000000)} mil. Kč`;
    if (Math.abs(value) >= 1000) return `${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(value / 1000)} tis. Kč`;
    return money(value);
  };
  const monthsText = (m) => { const months = Math.max(0, Math.round(m)); const y = Math.floor(months / 12); const r = months % 12; return y ? `${y} let ${r} měs.` : `${r} měs.`; };
  const payment = (principal, rate, months) => { const mr = rate / 100 / 12; if (months <= 0) return 0; if (mr === 0) return principal / months; return principal * mr / (1 - Math.pow(1 + mr, -months)); };
  const totalInterest = (monthly, principal, months) => Math.max(0, monthly * months - principal);
  const monthsForPayment = (principal, rate, monthly) => { const mr = rate / 100 / 12; if (principal <= 0) return 0; if (mr === 0) return principal / monthly; const ratio = 1 - principal * mr / monthly; if (ratio <= 0) return Infinity; return -Math.log(ratio) / Math.log(1 + mr); };
  const read = () => ({ remainingPrincipal:+$('remainingPrincipal').value||0, annualRate:+$('annualRate').value||0, remainingYears:+$('remainingYears').value||0, extraPayment:+$('extraPayment').value||0, recalculationMode:$('recalculationMode').value, fee:+$('fee').value||0 });
  function calculate(v){
    const originalMonths = Math.round(v.remainingYears * 12);
    const newPrincipal = Math.max(0, v.remainingPrincipal - v.extraPayment);
    const originalPayment = payment(v.remainingPrincipal, v.annualRate, originalMonths);
    const originalInterest = totalInterest(originalPayment, v.remainingPrincipal, originalMonths);
    const reducePayment = payment(newPrincipal, v.annualRate, originalMonths);
    const reducePaymentInterest = totalInterest(reducePayment, newPrincipal, originalMonths);
    const shorterMonths = monthsForPayment(newPrincipal, v.annualRate, originalPayment);
    const shorterInterest = Number.isFinite(shorterMonths) ? totalInterest(originalPayment, newPrincipal, shorterMonths) : reducePaymentInterest;
    const timeSaved = Math.max(0, originalMonths - shorterMonths);
    const selectedInterest = v.recalculationMode === 'reduce-payment' ? reducePaymentInterest : shorterInterest;
    const selectedPayment = v.recalculationMode === 'reduce-payment' ? reducePayment : originalPayment;
    const interestSaved = Math.max(0, originalInterest - selectedInterest);
    return { originalMonths, newPrincipal, originalPayment, originalInterest, reducePayment, reducePaymentInterest, shorterMonths, shorterInterest, timeSaved, selectedPayment, selectedInterest, interestSaved, netBenefit: interestSaved - v.fee };
  }
  function render(){
    const v = read();
    if (!v.remainingPrincipal || !v.remainingYears || v.extraPayment >= v.remainingPrincipal) return;
    const r = calculate(v);
    $('mainResult').textContent = money(Math.max(0, r.netBenefit));
    $('newPrincipalResult').textContent = money(r.newPrincipal);
    $('newPaymentResult').textContent = money(r.selectedPayment);
    $('timeSavedResult').textContent = v.recalculationMode === 'reduce-payment' ? '0 měs.' : monthsText(r.timeSaved);
    $('originalPaymentResult').textContent = money(r.originalPayment);
    $('paymentDifferenceResult').textContent = money(r.originalPayment - r.selectedPayment);
    $('originalInterestResult').textContent = money(r.originalInterest);
    $('newInterestResult').textContent = money(r.selectedInterest);
    $('netBenefitResult').textContent = money(r.netBenefit);
    $('heroExtraPayment').textContent = compactMoney(v.extraPayment);
    $('heroNewPrincipal').textContent = compactMoney(r.newPrincipal);
    $('heroInterestSaving').textContent = compactMoney(r.interestSaved);
    $('heroMode').textContent = v.recalculationMode === 'reduce-payment' ? 'nižší splátka' : 'kratší doba';
    $('heroImpact').textContent = v.recalculationMode === 'reduce-payment' ? money(r.originalPayment - r.selectedPayment) + ' měsíčně' : monthsText(r.timeSaved);
    $('statusBadge').textContent = r.netBenefit > 0 ? 'Mimořádná splátka vychází přínosně' : 'Přínos ověřte kvůli poplatku';
    const modeText = v.recalculationMode === 'reduce-payment' ? 'snížením měsíční splátky' : 'zkrácením doby splácení';
    $('decisionHeadline').textContent = r.netBenefit > 0 ? 'Mimořádná splátka dává orientačně smysl' : 'Výsledek je po poplatku slabý';
    $('decisionText').textContent = `Při variantě ${modeText} vychází čistý přínos přibližně ${money(r.netBenefit)}. Nová jistina je ${money(r.newPrincipal)} a zvýrazněná splátka ${money(r.selectedPayment)}.`;
    $('nextStepText').textContent = 'Další krok: ověřte u banky výročí fixace, bezplatný limit mimořádné splátky a nový splátkový kalendář.';
    $('summaryTableBody').innerHTML = `<tr><td>Původní hypotéka</td><td>${money(r.originalPayment)}</td><td>${money(r.originalInterest)}</td><td>${monthsText(r.originalMonths)}</td></tr><tr><td>Snížení splátky</td><td>${money(r.reducePayment)}</td><td>${money(r.reducePaymentInterest)}</td><td>${monthsText(r.originalMonths)}</td></tr><tr><td>Zkrácení doby</td><td>${money(r.originalPayment)}</td><td>${money(r.shorterInterest)}</td><td>${monthsText(r.shorterMonths)}</td></tr>`;
  }
  form.addEventListener('submit', (e)=>{e.preventDefault(); render();});
  ids.forEach(id => $(id).addEventListener('input', render));
  ids.forEach(id => $(id).addEventListener('change', render));
  resetBtn.addEventListener('click', () => { form.reset(); render(); });
  render();
})();
