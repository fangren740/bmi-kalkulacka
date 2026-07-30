(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { mode: 'basic', couponType: 'amount' };
  const fields = {
    form: $('discountForm'), originalPrice: $('originalPrice'), discountPercent: $('discountPercent'), quantity: $('quantity'),
    secondDiscount: $('secondDiscount'), couponValue: $('couponValue'), shipping: $('shipping'), lowestPrice: $('lowestPrice'), advanced: $('advancedPanel')
  };
  const moneyFmt = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const numberFmt = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const money = (value) => moneyFmt.format(Number.isFinite(value) ? value : 0);
  const pct = (value) => `${numberFmt.format(Number.isFinite(value) ? value : 0)} %`;
  const parseNumber = (value) => {
    const normalized = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.+-]/g, '');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : NaN;
  };
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const setError = (el, message) => {
    const wrapper = el.closest('.field');
    if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
    const target = $(el.id + 'Error');
    if (target) target.textContent = message || '';
  };
  function readValues() {
    return {
      originalPrice: parseNumber(fields.originalPrice.value),
      discountPercent: parseNumber(fields.discountPercent.value),
      quantity: state.mode === 'advanced' ? parseNumber(fields.quantity.value) : 1,
      secondDiscount: state.mode === 'advanced' ? parseNumber(fields.secondDiscount.value) : 0,
      couponValue: state.mode === 'advanced' ? parseNumber(fields.couponValue.value) : 0,
      shipping: state.mode === 'advanced' ? parseNumber(fields.shipping.value) : 0,
      lowestPrice: state.mode === 'advanced' && fields.lowestPrice.value.trim() ? parseNumber(fields.lowestPrice.value) : NaN
    };
  }
  function validate(v) {
    let ok = true;
    setError(fields.originalPrice, !Number.isFinite(v.originalPrice) || v.originalPrice <= 0 ? 'Zadejte cenu vyšší než 0 Kč.' : '');
    if (!Number.isFinite(v.originalPrice) || v.originalPrice <= 0) ok = false;
    setError(fields.discountPercent, !Number.isFinite(v.discountPercent) || v.discountPercent < 0 || v.discountPercent > 100 ? 'Sleva musí být od 0 do 100 %.' : '');
    if (!Number.isFinite(v.discountPercent) || v.discountPercent < 0 || v.discountPercent > 100) ok = false;
    setError(fields.quantity, !Number.isFinite(v.quantity) || !Number.isInteger(v.quantity) || v.quantity < 1 || v.quantity > 100000 ? 'Zadejte celý počet od 1 do 100 000.' : '');
    if (!Number.isFinite(v.quantity) || !Number.isInteger(v.quantity) || v.quantity < 1 || v.quantity > 100000) ok = false;
    setError(fields.secondDiscount, !Number.isFinite(v.secondDiscount) || v.secondDiscount < 0 || v.secondDiscount > 100 ? 'Druhá sleva musí být od 0 do 100 %.' : '');
    if (!Number.isFinite(v.secondDiscount) || v.secondDiscount < 0 || v.secondDiscount > 100) ok = false;
    const couponInvalid = !Number.isFinite(v.couponValue) || v.couponValue < 0 || (state.couponType === 'percent' && v.couponValue > 100);
    setError(fields.couponValue, couponInvalid ? (state.couponType === 'percent' ? 'Kupon musí být od 0 do 100 %.' : 'Kupon nesmí být záporný.') : '');
    if (couponInvalid) ok = false;
    setError(fields.shipping, !Number.isFinite(v.shipping) || v.shipping < 0 ? 'Doprava nesmí být záporná.' : '');
    if (!Number.isFinite(v.shipping) || v.shipping < 0) ok = false;
    const lowestInvalid = fields.lowestPrice.value.trim() && (!Number.isFinite(v.lowestPrice) || v.lowestPrice <= 0 || v.lowestPrice > v.originalPrice * 10);
    setError(fields.lowestPrice, lowestInvalid ? 'Zadejte platnou kladnou referenční cenu.' : '');
    if (lowestInvalid) ok = false;
    return ok;
  }
  function calculate(v) {
    const originalTotal = v.originalPrice * v.quantity;
    const afterFirstPiece = v.originalPrice * (1 - v.discountPercent / 100);
    const afterSecondPiece = afterFirstPiece * (1 - v.secondDiscount / 100);
    const afterPercentTotal = afterSecondPiece * v.quantity;
    const couponAmount = state.couponType === 'percent' ? afterPercentTotal * (v.couponValue / 100) : Math.min(v.couponValue, afterPercentTotal);
    const goodsTotal = Math.max(0, afterPercentTotal - couponAmount);
    const finalPayment = goodsTotal + v.shipping;
    const savings = Math.max(0, originalTotal - goodsTotal);
    const effectiveDiscount = originalTotal > 0 ? savings / originalTotal * 100 : 0;
    const pricePerPiece = goodsTotal / v.quantity;
    const remainingPercent = originalTotal > 0 ? goodsTotal / originalTotal * 100 : 0;
    const referenceTotal = Number.isFinite(v.lowestPrice) ? v.lowestPrice * v.quantity : NaN;
    const referenceSavings = Number.isFinite(referenceTotal) ? referenceTotal - goodsTotal : NaN;
    const referencePercent = Number.isFinite(referenceTotal) && referenceTotal > 0 ? referenceSavings / referenceTotal * 100 : NaN;
    return { ...v, originalTotal, afterFirstPiece, afterSecondPiece, afterPercentTotal, couponAmount, goodsTotal, finalPayment, savings, effectiveDiscount, pricePerPiece, remainingPercent, referenceTotal, referenceSavings, referencePercent };
  }
  function clearFlow() { const root = $('priceFlow'); while (root.firstChild) root.removeChild(root.firstChild); }
  function addFlowRow(label, value, width) {
    const row = document.createElement('div'); row.className = 'flow-row';
    const span = document.createElement('span'); span.textContent = label;
    const strong = document.createElement('b'); strong.textContent = money(value);
    const track = document.createElement('i'); const bar = document.createElement('em'); bar.style.width = `${Math.max(2, Math.min(100, width))}%`; track.appendChild(bar);
    row.append(span, strong, track); $('priceFlow').appendChild(row);
  }
  function renderFlow(r) {
    clearFlow();
    addFlowRow('Původní cena zboží', r.originalTotal, 100);
    addFlowRow(`Po slevě ${pct(r.discountPercent)}`, r.afterFirstPiece * r.quantity, r.afterFirstPiece * r.quantity / r.originalTotal * 100);
    if (r.secondDiscount > 0) addFlowRow(`Po druhé slevě ${pct(r.secondDiscount)}`, r.afterPercentTotal, r.afterPercentTotal / r.originalTotal * 100);
    if (r.couponAmount > 0) addFlowRow('Po kuponu', r.goodsTotal, r.goodsTotal / r.originalTotal * 100);
    if (r.shipping > 0) addFlowRow('Konečná platba s dopravou', r.finalPayment, Math.min(100, r.finalPayment / r.originalTotal * 100));
  }
  function renderDecision(r) {
    const card = $('decisionCard'); card.className = 'decision-card';
    let label = 'Jasná sleva', headline = `Ušetříte ${money(r.savings)}`, text = `Po slevách a kuponu zůstává ${pct(r.remainingPercent)} původní ceny zboží.`;
    if (r.savings <= 0.005) { label = 'Bez úspory'; headline = 'Cena zboží se nezměnila'; text = 'Zadejte slevu nebo kupon, pokud je součástí nabídky.'; }
    if (r.shipping >= r.savings && r.savings > 0) { card.classList.add('is-warning'); label = 'Doprava spotřebuje úsporu'; headline = `Platba je ${money(r.finalPayment)}`; text = 'Doprava a poplatky jsou stejně vysoké nebo vyšší než úspora na zboží.'; }
    else if (r.shipping > r.savings * 0.5 && r.savings > 0) { card.classList.add('is-warning'); label = 'Pozor na konečný účet'; text = 'Doprava vrací zpět více než polovinu úspory. Porovnejte konečnou platbu s jinou nabídkou.'; }
    else if (r.secondDiscount > 0) { text = `Procenta se nesčítají. Kombinace slev dává skutečnou úsporu ${pct(r.effectiveDiscount)}.`; }
    setText('decisionLabel', label); setText('decisionHeadline', headline); setText('decisionText', text);
  }
  function renderReference(r) {
    const card = $('referenceCard');
    if (!Number.isFinite(r.referenceTotal)) { card.hidden = true; return; }
    card.hidden = false;
    if (r.referenceSavings > 0) {
      setText('referenceResult', `${money(r.goodsTotal)} je o ${money(r.referenceSavings)} méně`);
      setText('referenceText', `Proti zadané nejnižší ceně za 30 dnů je cena zboží nižší o ${pct(r.referencePercent)}.`);
    } else if (Math.abs(r.referenceSavings) < 0.005) {
      setText('referenceResult', 'Cena odpovídá referenční hodnotě');
      setText('referenceText', 'Proti zadané nejnižší ceně za 30 dnů nevzniká další úspora.');
    } else {
      setText('referenceResult', `${money(r.goodsTotal)} je o ${money(Math.abs(r.referenceSavings))} více`);
      setText('referenceText', `Finální cena zboží je proti zadané nejnižší ceně vyšší o ${pct(Math.abs(r.referencePercent))}.`);
    }
  }
  function renderInvalid() {
    ['finalTotalPrice','savedTotal','effectiveDiscount','finalPricePerPiece','shippingResult'].forEach(id => setText(id, '—'));
    setText('resultSentence','Opravte označené vstupy a výsledek se okamžitě přepočítá.');
    setText('heroFinalPrice','—'); setText('heroSavings','—'); setText('heroEffective','—');
    $('referenceCard').hidden = true; clearFlow();
  }
  function render(options = {}) {
    const v = readValues();
    if (!validate(v)) { renderInvalid(); return false; }
    const r = calculate(v);
    setText('finalTotalPrice', money(r.finalPayment));
    setText('savedTotal', money(r.savings));
    setText('effectiveDiscount', pct(r.effectiveDiscount));
    setText('finalPricePerPiece', money(r.pricePerPiece));
    setText('shippingResult', money(r.shipping));
    setText('resultBadge', r.effectiveDiscount > 0 ? `Sleva ${pct(r.effectiveDiscount)}` : 'Bez slevy');
    setText('resultSentence', `Za ${r.quantity === 1 ? 'jeden kus' : `${numberFmt.format(r.quantity)} kusů`} zaplatíte ${money(r.finalPayment)} místo ${money(r.originalTotal)}${r.shipping > 0 ? ' včetně dopravy' : ''}.`);
    setText('savedNote', r.quantity === 1 ? 'Proti původní ceně jednoho kusu.' : `Proti původní ceně ${numberFmt.format(r.quantity)} kusů.`);
    setText('pieceNote', r.quantity === 1 ? 'Při jednom kusu.' : `Průměr na ${numberFmt.format(r.quantity)} kusů.`);
    setText('heroFinalPrice', money(r.finalPayment)); setText('heroSavings', money(r.savings)); setText('heroEffective', pct(r.effectiveDiscount)); setText('heroRemaining', pct(r.remainingPercent));
    setText('heroAnswerNote', `Z původních ${money(r.originalTotal)} při celkové úspoře ${pct(r.effectiveDiscount)}.`);
    $('heroBar').style.width = `${Math.max(0, Math.min(100, r.remainingPercent))}%`;
    renderDecision(r); renderFlow(r); renderReference(r);
    if (options.scroll && matchMedia('(max-width: 720px)').matches) $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(button => { const active = button.dataset.mode === mode; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    fields.advanced.hidden = mode !== 'advanced';
    setText('heroMode', mode === 'advanced' ? 'pokročilý režim' : 'základní režim');
    render();
    if (mode === 'advanced') setTimeout(() => fields.quantity.focus({ preventScroll: true }), 0);
  }
  function setCouponType(type) {
    state.couponType = type;
    document.querySelectorAll('[data-coupon-type]').forEach(button => { const active = button.dataset.couponType === type; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    setText('couponUnit', type === 'percent' ? '%' : 'Kč');
    setText('couponHelp', type === 'percent' ? 'Další procento po předchozích slevách.' : 'Odečte se z celé objednávky.');
    render();
  }
  const presets = {
    small: { price: '1 000', d1: '10', d2: '0', qty: '1', coupon: '0', shipping: '0', type: 'amount', mode: 'basic' },
    standard: { price: '2 000', d1: '20', d2: '0', qty: '1', coupon: '0', shipping: '0', type: 'amount', mode: 'basic' },
    sale: { price: '2 490', d1: '40', d2: '0', qty: '1', coupon: '0', shipping: '0', type: 'amount', mode: 'basic' },
    stacked: { price: '2 490', d1: '20', d2: '10', qty: '2', coupon: '200', shipping: '79', type: 'amount', mode: 'advanced' }
  };
  function applyPreset(name) {
    const p = presets[name]; if (!p) return;
    fields.originalPrice.value = p.price; fields.discountPercent.value = p.d1; fields.secondDiscount.value = p.d2; fields.quantity.value = p.qty; fields.couponValue.value = p.coupon; fields.shipping.value = p.shipping; fields.lowestPrice.value = '';
    setCouponType(p.type); setMode(p.mode);
    document.querySelectorAll('[data-preset]').forEach(button => button.classList.toggle('is-active', button.dataset.preset === name));
    render();
  }
  async function copyResult() {
    const text = `${$('resultTitle').textContent}: ${$('finalTotalPrice').textContent}; úspora ${$('savedTotal').textContent}; skutečná sleva ${$('effectiveDiscount').textContent}.`;
    try { await navigator.clipboard.writeText(text); setText('copyResult','Zkopírováno'); setTimeout(() => setText('copyResult','Kopírovat výsledek'),1500); }
    catch { setText('copyResult','Kopírování selhalo'); }
  }
  function reset() { applyPreset('standard'); }
  function bind() {
    fields.form.addEventListener('submit', event => { event.preventDefault(); render({ scroll: true }); });
    [fields.originalPrice, fields.discountPercent, fields.quantity, fields.secondDiscount, fields.couponValue, fields.shipping, fields.lowestPrice].forEach(el => { el.addEventListener('input', () => render()); el.addEventListener('change', () => render()); });
    document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
    document.querySelectorAll('[data-coupon-type]').forEach(button => button.addEventListener('click', () => setCouponType(button.dataset.couponType)));
    document.querySelectorAll('[data-discount]').forEach(button => button.addEventListener('click', () => { fields.discountPercent.value = button.dataset.discount; render(); }));
    document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
    $('resetButton').addEventListener('click', reset); $('copyResult').addEventListener('click', copyResult);
  }
  function init() { bind(); applyPreset('standard'); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
