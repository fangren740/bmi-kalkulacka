(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const OFFER_IDS = ['A', 'B', 'C', 'D'];
  const CATEGORY_DATA = {
    weight: {
      base: 'kg',
      units: { g: 0.001, kg: 1 },
      defaults: {
        A: { price: '129,90', amount: '750', unit: 'g', count: '1', name: 'Balení A' },
        B: { price: '179,90', amount: '1', unit: 'kg', count: '1', name: 'Balení B' },
        C: { price: '199,90', amount: '1,2', unit: 'kg', count: '1', name: 'Balení C' },
        D: { price: '249,90', amount: '1,5', unit: 'kg', count: '1', name: 'Balení D' }
      }
    },
    volume: {
      base: 'l',
      units: { ml: 0.001, cl: 0.01, l: 1 },
      defaults: {
        A: { price: '42,90', amount: '500', unit: 'ml', count: '1', name: 'Láhev A' },
        B: { price: '69,90', amount: '1', unit: 'l', count: '1', name: 'Láhev B' },
        C: { price: '119,90', amount: '330', unit: 'ml', count: '6', name: 'Multipack C' },
        D: { price: '54,90', amount: '2', unit: 'l', count: '1', name: 'Láhev D' }
      }
    },
    piece: {
      base: 'ks',
      units: { ks: 1 },
      defaults: {
        A: { price: '299', amount: '42', unit: 'ks', count: '1', name: 'Balení A' },
        B: { price: '449', amount: '68', unit: 'ks', count: '1', name: 'Balení B' },
        C: { price: '189', amount: '24', unit: 'ks', count: '1', name: 'Balení C' },
        D: { price: '579', amount: '90', unit: 'ks', count: '1', name: 'Balení D' }
      }
    },
    length: {
      base: 'm',
      units: { mm: 0.001, cm: 0.01, m: 1 },
      defaults: {
        A: { price: '129', amount: '5', unit: 'm', count: '1', name: 'Varianta A' },
        B: { price: '199', amount: '10', unit: 'm', count: '1', name: 'Varianta B' },
        C: { price: '79', amount: '250', unit: 'cm', count: '1', name: 'Varianta C' },
        D: { price: '299', amount: '15', unit: 'm', count: '1', name: 'Varianta D' }
      }
    },
    area: {
      base: 'm²',
      units: { 'cm²': 0.0001, 'm²': 1 },
      defaults: {
        A: { price: '899', amount: '1,8', unit: 'm²', count: '1', name: 'Balení A' },
        B: { price: '1 059', amount: '2,2', unit: 'm²', count: '1', name: 'Balení B' },
        C: { price: '749', amount: '1,45', unit: 'm²', count: '1', name: 'Balení C' },
        D: { price: '1 349', amount: '2,75', unit: 'm²', count: '1', name: 'Balení D' }
      }
    }
  };

  const state = {
    mode: 'basic',
    category: 'weight',
    activeOptional: []
  };

  const form = $('unitPriceForm');
  if (!form) return;

  const parseNumber = (value) => {
    const cleaned = String(value ?? '')
      .trim()
      .replace(/\s+/g, '')
      .replace(',', '.')
      .replace(/[^0-9.+-]/g, '');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : NaN;
  };

  const formatNumber = (value, maximum = 2, minimum = 0) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: minimum,
    maximumFractionDigits: maximum
  }).format(Number.isFinite(value) ? value : 0);

  const formatMoney = (value, maximum = 2) => `${formatNumber(value, maximum, value < 100 ? 2 : 0)} Kč`;
  const formatUnitPrice = (value) => `${formatMoney(value, value < 10 ? 3 : 2)}/${CATEGORY_DATA[state.category].base}`;

  function setError(id, message) {
    const input = $(id);
    const error = $(`${id}Error`);
    const field = input?.closest('.field');
    if (field) field.classList.toggle('has-error', Boolean(message));
    if (error) error.textContent = message || '';
  }

  function createUnitOptions(select, selected) {
    select.replaceChildren();
    Object.keys(CATEGORY_DATA[state.category].units).forEach((unit) => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      option.selected = unit === selected;
      select.appendChild(option);
    });
  }

  function setCategoryDefaults(category) {
    state.category = category;
    document.querySelectorAll('[data-category]').forEach((button) => {
      const active = button.dataset.category === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    OFFER_IDS.forEach((id) => {
      const data = CATEGORY_DATA[category].defaults[id];
      $(`name${id}`).value = data.name;
      $(`price${id}`).value = data.price;
      $(`amount${id}`).value = data.amount;
      $(`count${id}`).value = data.count;
      $(`discount${id}`).value = '0';
      $(`usable${id}`).value = '100';
      createUnitOptions($(`unit${id}`), data.unit);
    });

    $('neededAmount').value = '0';
    $('neededUnit').textContent = CATEGORY_DATA[category].base;
    calculate();
  }

  function activeOfferIds() {
    return state.mode === 'basic' ? ['A', 'B'] : ['A', 'B', ...state.activeOptional];
  }

  function readOffer(id) {
    const price = parseNumber($(`price${id}`).value);
    const amount = parseNumber($(`amount${id}`).value);
    const unit = $(`unit${id}`).value;
    const count = state.mode === 'advanced' ? parseNumber($(`count${id}`).value) : 1;
    const discount = state.mode === 'advanced' ? parseNumber($(`discount${id}`).value) : 0;
    const usable = state.mode === 'advanced' ? parseNumber($(`usable${id}`).value) : 100;
    const name = $(`name${id}`).value.trim() || `Nabídka ${id}`;

    let valid = true;
    if (!Number.isFinite(price) || price <= 0) {
      setError(`price${id}`, 'Zadejte cenu větší než 0.');
      valid = false;
    } else setError(`price${id}`, '');

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(`amount${id}`, 'Zadejte množství větší než 0.');
      valid = false;
    } else setError(`amount${id}`, '');

    if (state.mode === 'advanced') {
      if (!Number.isFinite(count) || count < 1 || count > 1000 || !Number.isInteger(count)) {
        setError(`count${id}`, 'Zadejte celé číslo od 1 do 1 000.');
        valid = false;
      } else setError(`count${id}`, '');

      if (!Number.isFinite(discount) || discount < 0 || discount >= 100) {
        setError(`discount${id}`, 'Sleva musí být od 0 do méně než 100 %.');
        valid = false;
      } else setError(`discount${id}`, '');

      if (!Number.isFinite(usable) || usable <= 0 || usable > 100) {
        setError(`usable${id}`, 'Využitelný podíl musí být nad 0 a nejvýše 100 %.');
        valid = false;
      } else setError(`usable${id}`, '');
    }

    const factor = CATEGORY_DATA[state.category].units[unit];
    if (!Number.isFinite(factor)) valid = false;
    if (!valid) return null;

    const grossBaseAmount = amount * factor * count;
    const usableBaseAmount = grossBaseAmount * (usable / 100);
    const effectivePrice = price * (1 - discount / 100);
    const unitPrice = effectivePrice / usableBaseAmount;

    if (![grossBaseAmount, usableBaseAmount, effectivePrice, unitPrice].every(Number.isFinite) || usableBaseAmount <= 0) return null;

    return {
      id,
      name,
      price,
      amount,
      unit,
      count,
      discount,
      usable,
      grossBaseAmount,
      usableBaseAmount,
      effectivePrice,
      unitPrice
    };
  }

  function readNeededAmount() {
    if (state.mode !== 'advanced') {
      setError('neededAmount', '');
      return 0;
    }
    const needed = parseNumber($('neededAmount').value);
    if (!Number.isFinite(needed) || needed < 0) {
      setError('neededAmount', 'Zadejte nulu nebo kladné množství.');
      return NaN;
    }
    setError('neededAmount', '');
    return needed;
  }

  function createRankingRow(offer, rank, maxPrice) {
    const row = document.createElement('div');
    row.className = `ranking-row${rank === 1 ? ' is-winner' : ''}`;

    const number = document.createElement('span');
    number.className = 'rank-number';
    number.textContent = String(rank);

    const copy = document.createElement('div');
    copy.className = 'rank-copy';
    const name = document.createElement('b');
    name.textContent = offer.name;
    const detail = document.createElement('small');
    detail.textContent = `${formatMoney(offer.effectivePrice)} za ${formatNumber(offer.usableBaseAmount, 3)} ${CATEGORY_DATA[state.category].base}`;
    copy.append(name, detail);

    const price = document.createElement('strong');
    price.className = 'rank-price';
    price.textContent = formatUnitPrice(offer.unitPrice);

    const bar = document.createElement('span');
    bar.className = 'rank-bar';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(7, (offer.unitPrice / maxPrice) * 100)}%`;
    bar.appendChild(fill);

    row.append(number, copy, price, bar);
    return row;
  }

  function renderInvalid() {
    $('resultTitle').textContent = 'Doplňte platné údaje';
    $('winnerUnitPrice').textContent = '—';
    $('winnerSentence').textContent = 'Pro výsledek jsou potřeba alespoň dvě platné nabídky.';
    $('savingPerUnit').textContent = '—';
    $('savingPercent').textContent = '—';
    $('winnerAmount').textContent = '—';
    $('purchaseCost').textContent = '—';
    $('purchaseCostNote').textContent = 'Nejdřív opravte označené vstupy';
    $('rankingList').replaceChildren();
    $('decisionLabel').textContent = 'Chybí vstup';
    $('decisionTitle').textContent = 'Opravte označené hodnoty.';
    $('decisionText').textContent = 'Cena i množství musí být větší než nula. V pokročilém režimu zkontrolujte také multipack, slevu a využitelný podíl.';
  }

  function calculate(options = {}) {
    const offers = activeOfferIds().map(readOffer).filter(Boolean);
    const needed = readNeededAmount();
    $('resultBadge').textContent = `${activeOfferIds().length} ${activeOfferIds().length === 2 ? 'nabídky' : 'nabídky'}`;
    $('offerCountText').textContent = `Porovnáváte ${activeOfferIds().length} nabídky`;

    if (offers.length < 2 || !Number.isFinite(needed)) {
      renderInvalid();
      return false;
    }

    offers.sort((a, b) => a.unitPrice - b.unitPrice);
    const winner = offers[0];
    const runnerUp = offers[1];
    const saving = Math.max(0, runnerUp.unitPrice - winner.unitPrice);
    const savingPercent = runnerUp.unitPrice > 0 ? (saving / runnerUp.unitPrice) * 100 : 0;
    const base = CATEGORY_DATA[state.category].base;

    $('resultTitle').textContent = savingPercent < 0.05 ? 'Nabídky jsou prakticky shodné' : `Výhodnější je ${winner.name}`;
    $('winnerUnitPrice').textContent = formatUnitPrice(winner.unitPrice);
    $('winnerSentence').textContent = savingPercent < 0.05
      ? `${winner.name} a ${runnerUp.name} mají po přepočtu téměř stejnou cenu.`
      : `${winner.name} je o ${formatNumber(savingPercent, 2, 2)} % levnější na ${base} než ${runnerUp.name}.`;
    $('savingPerUnit').textContent = `${formatMoney(saving, saving < 1 ? 3 : 2)}/${base}`;
    $('savingPercent').textContent = `${formatNumber(savingPercent, 2, 2)} %`;
    $('winnerAmount').textContent = `${formatNumber(winner.usableBaseAmount, 3)} ${base}`;
    $('winnerAmountNote').textContent = winner.usable < 100 ? `Po zohlednění využitelného podílu ${formatNumber(winner.usable, 1)} %` : 'Po přepočtu na společnou jednotku';

    if (state.mode === 'advanced' && needed > 0) {
      const wholePackages = $('wholePackages').checked;
      const packages = Math.ceil(needed / winner.usableBaseAmount);
      const purchaseCost = wholePackages ? packages * winner.effectivePrice : needed * winner.unitPrice;
      $('purchaseCost').textContent = formatMoney(purchaseCost);
      $('purchaseCostNote').textContent = wholePackages
        ? `${packages} ${packages === 1 ? 'celé balení' : packages <= 4 ? 'celá balení' : 'celých balení'} pro ${formatNumber(needed, 3)} ${base}`
        : `Teoretická cena přesně ${formatNumber(needed, 3)} ${base}`;
    } else {
      $('purchaseCost').textContent = 'Nezadáno';
      $('purchaseCostNote').textContent = 'Doplňte potřebné množství v pokročilém režimu';
    }

    const maxPrice = Math.max(...offers.map((offer) => offer.unitPrice), 1);
    const ranking = $('rankingList');
    ranking.replaceChildren();
    offers.forEach((offer, index) => ranking.appendChild(createRankingRow(offer, index + 1, maxPrice)));

    const decision = $('decisionCard');
    decision.classList.toggle('is-close', savingPercent < 2);
    if (savingPercent < 0.05) {
      $('decisionLabel').textContent = 'Prakticky shodná cena';
      $('decisionTitle').textContent = 'Rozhodněte podle kvality, velikosti balení a očekávané spotřeby.';
      $('decisionText').textContent = 'Rozdíl je tak malý, že ho může převážit expirace, skladnost, doprava nebo zaokrouhlení ceny v obchodě.';
    } else if (savingPercent < 2) {
      $('decisionLabel').textContent = 'Těsný výsledek';
      $('decisionTitle').textContent = `${winner.name} je levnější, ale rozdíl je malý.`;
      $('decisionText').textContent = 'Před nákupem zvažte, zda využijete celé balení a zda druhá nabídka nepřináší lepší kvalitu nebo praktičtější velikost.';
    } else if (savingPercent < 10) {
      $('decisionLabel').textContent = 'Viditelná úspora';
      $('decisionTitle').textContent = `${winner.name} má smysluplně nižší jednotkovou cenu.`;
      $('decisionText').textContent = 'Výsledek ještě ověřte proti expiraci, kvalitě a skutečnému počtu celých balení, které potřebujete koupit.';
    } else {
      $('decisionLabel').textContent = 'Výrazný rozdíl';
      $('decisionTitle').textContent = `${winner.name} je cenově jasný vítěz.`;
      $('decisionText').textContent = 'Takto velký rozdíl obvykle stojí za pozornost. Zkontrolujte však, že obě nabídky mají srovnatelnou kvalitu, složení a podmínky nákupu.';
    }

    if (options.scroll && window.matchMedia('(max-width: 820px)').matches) {
      $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-advanced]').forEach((element) => {
      element.hidden = mode !== 'advanced';
    });

    document.querySelectorAll('.optional-offer').forEach((element) => {
      const id = element.dataset.offer;
      element.hidden = mode !== 'advanced' || !state.activeOptional.includes(id);
    });

    if (mode === 'basic') {
      state.activeOptional = [];
    }
    updateAddButton();
    calculate();
  }

  function updateAddButton() {
    const button = $('addOfferButton');
    if (!button) return;
    const next = ['C', 'D'].find((id) => !state.activeOptional.includes(id));
    button.disabled = !next;
    button.textContent = next ? '+ Přidat další nabídku' : 'Porovnáváte maximum 4 nabídek';
  }

  function addOffer() {
    const next = ['C', 'D'].find((id) => !state.activeOptional.includes(id));
    if (!next) return;
    state.activeOptional.push(next);
    const card = document.querySelector(`[data-offer="${next}"]`);
    if (card) {
      card.hidden = false;
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    updateAddButton();
    calculate();
  }

  function removeOffer(id) {
    state.activeOptional = state.activeOptional.filter((item) => item !== id);
    const card = document.querySelector(`[data-offer="${id}"]`);
    if (card) card.hidden = true;
    updateAddButton();
    calculate();
  }

  function reset() {
    state.mode = 'basic';
    state.activeOptional = [];
    $('wholePackages').checked = true;
    setCategoryDefaults('weight');
    setMode('basic');
  }

  async function copyResult() {
    const text = `${$('resultTitle').textContent}: ${$('winnerUnitPrice').textContent}. ${$('winnerSentence').textContent}`;
    try {
      await navigator.clipboard.writeText(text);
      $('copyResult').textContent = 'Výsledek zkopírován';
      window.setTimeout(() => { $('copyResult').textContent = 'Kopírovat výsledek'; }, 1600);
    } catch {
      $('copyResult').textContent = 'Kopírování se nepodařilo';
    }
  }

  function bind() {
    document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => setCategoryDefaults(button.dataset.category)));
    document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => removeOffer(button.dataset.remove)));
    $('addOfferButton').addEventListener('click', addOffer);
    $('resetButton').addEventListener('click', reset);
    $('copyResult').addEventListener('click', copyResult);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      calculate({ scroll: true });
    });

    OFFER_IDS.forEach((id) => {
      ['name', 'price', 'amount', 'unit', 'count', 'discount', 'usable'].forEach((prefix) => {
        const element = $(`${prefix}${id}`);
        if (!element) return;
        const eventName = element.tagName === 'SELECT' ? 'change' : 'input';
        element.addEventListener(eventName, calculate);
      });
    });

    $('neededAmount').addEventListener('input', calculate);
    $('wholePackages').addEventListener('change', calculate);

    const back = $('backToTop');
    const toggleBack = () => back.classList.toggle('is-visible', window.scrollY > 600);
    window.addEventListener('scroll', toggleBack, { passive: true });
    back.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function init() {
    bind();
    setCategoryDefaults('weight');
    setMode('basic');
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
