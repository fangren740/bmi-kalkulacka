(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(n) ? n : 0)) + ' Kč';
  const pct = (n) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 }).format(Number.isFinite(n) ? n : 0) + ' %';
  const num = (id) => Math.max(0, parseFloat($(id)?.value || '0') || 0);

  const presets = {
    flat: { salePrice: 5000000, mortgagePayoff: 500000, commissionRate: 4, legalCosts: 35000, prepCosts: 30000, adminCosts: 8000, reserveRate: 1, taxMode: 'none', purchasePrice: 3600000, customTax: 0 },
    house: { salePrice: 8500000, mortgagePayoff: 1800000, commissionRate: 3.5, legalCosts: 48000, prepCosts: 90000, adminCosts: 12000, reserveRate: 1.2, taxMode: 'none', purchasePrice: 6200000, customTax: 0 },
    self: { salePrice: 4300000, mortgagePayoff: 0, commissionRate: 0, legalCosts: 45000, prepCosts: 55000, adminCosts: 12000, reserveRate: 1.5, taxMode: 'none', purchasePrice: 2800000, customTax: 0 }
  };

  function setValues(values) {
    Object.entries(values).forEach(([key, value]) => { if ($(key)) $(key).value = value; });
    toggleTaxFields();
    calculate();
  }

  function toggleTaxFields() {
    const mode = $('taxMode')?.value || 'none';
    if ($('purchaseField')) $('purchaseField').hidden = mode !== 'profit15';
    if ($('customTaxField')) $('customTaxField').hidden = mode !== 'custom';
  }

  function getTax(salePrice, sellingCosts) {
    const mode = $('taxMode')?.value || 'none';
    if (mode === 'custom') return num('customTax');
    if (mode === 'profit15') {
      const purchase = num('purchasePrice');
      const profit = Math.max(0, salePrice - purchase - sellingCosts);
      return profit * 0.15;
    }
    return 0;
  }

  function calculate() {
    const salePrice = num('salePrice');
    const mortgage = num('mortgagePayoff');
    const commission = salePrice * (num('commissionRate') / 100);
    const legal = num('legalCosts');
    const prep = num('prepCosts');
    const admin = num('adminCosts');
    const reserve = salePrice * (num('reserveRate') / 100);
    const sellingCostsBeforeTax = commission + legal + prep + admin + reserve;
    const tax = getTax(salePrice, sellingCostsBeforeTax);
    const totalCosts = sellingCostsBeforeTax + tax;
    const afterCosts = Math.max(0, salePrice - totalCosts);
    const net = salePrice - totalCosts - mortgage;
    const costRatio = salePrice > 0 ? (totalCosts / salePrice) * 100 : 0;
    const netRatio = salePrice > 0 ? (Math.max(0, net) / salePrice) * 100 : 0;

    $('netProceeds').textContent = fmt(net);
    $('resultSub').textContent = net >= 0 ? 'Po započtení nákladů, rezervy, daně v modelu a doplacení závazků.' : 'Náklady a závazky jsou vyšší než očekávaná prodejní cena.';
    $('totalCosts').textContent = fmt(totalCosts);
    $('costRatio').textContent = pct(costRatio);
    $('afterCosts').textContent = fmt(afterCosts);
    $('taxAmount').textContent = fmt(tax);
    $('bdSalePrice').textContent = fmt(salePrice);
    $('bdSellingCosts').textContent = fmt(totalCosts);
    $('bdMortgage').textContent = fmt(mortgage);
    $('bdNet').textContent = fmt(net);

    $('heroNetSale').textContent = fmt(net);
    $('heroShare').textContent = pct(netRatio) + ' z prodejní ceny';
    $('heroSalePrice').textContent = fmt(salePrice);
    $('heroCosts').textContent = fmt(totalCosts);
    $('heroMortgage').textContent = fmt(mortgage);
    $('heroReserve').textContent = fmt(reserve);

    let verdict = '';
    let next = 'Ověřte si, jestli čistá částka stačí na další bydlení, rezervu nebo doplacení navazujících závazků.';
    if (net < 0) {
      verdict = 'Pozor: podle zadaných hodnot by prodej nepokryl všechny náklady a závazky. Zkontrolujte cenu, hypotéku a daňový model.';
      next = 'Nejdřív si ověřte přesný zůstatek hypotéky, podmínky doplacení a realistickou prodejní cenu.';
    } else if (costRatio > 10) {
      verdict = 'Náklady tvoří vysoký podíl z prodejní ceny. Vyplatí se projít provizi, přípravu nemovitosti, rezervu a daňový scénář.';
      next = 'Porovnejte variantu s jinou provizí, nižší rezervou nebo přesnějším daňovým výpočtem.';
    } else if (mortgage > salePrice * 0.55) {
      verdict = 'Hlavní brzdou čistého výsledku je zůstatek hypotéky. Prodej může dávat smysl, ale rozhoduje částka po doplacení banky.';
      next = 'Zjistěte přesný zůstatek úvěru a případné poplatky za předčasné splacení.';
    } else {
      verdict = 'Výsledek vypadá zdravě: zůstává vám většina prodejní ceny. Přesto zkontrolujte největší položky a daňovou situaci.';
    }
    $('resultVerdict').textContent = verdict;
    $('nextStep').textContent = next;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('saleForm')?.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
    document.querySelectorAll('#saleForm input, #saleForm select').forEach((el) => {
      el.addEventListener('input', () => { if (el.id === 'taxMode') toggleTaxFields(); calculate(); });
      el.addEventListener('change', () => { if (el.id === 'taxMode') toggleTaxFields(); calculate(); });
    });
    document.querySelectorAll('.preset').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.preset').forEach((b) => b.classList.remove('active'));
        button.classList.add('active');
        setValues(presets[button.dataset.preset] || presets.flat);
      });
    });
    $('resetSale')?.addEventListener('click', () => {
      document.querySelectorAll('.preset').forEach((b) => b.classList.toggle('active', b.dataset.preset === 'flat'));
      setValues(presets.flat);
    });
    toggleTaxFields();
    calculate();
  });
})();
