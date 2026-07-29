(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const form = byId('reserveForm');
  if (!form) return;

  const fieldIds = [
    'businessCosts', 'personalCosts', 'crisisIncome', 'targetMonths', 'liquidReserve',
    'receivables', 'collectability', 'earmarked', 'oneOffShock', 'costCutPercent',
    'costCutDelay', 'safetyBuffer', 'monthlySaving', 'clientConcentration', 'recoveryMonths'
  ];

  const state = { mode: 'basic' };
  const moneyFormatter = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
  const numberFormatter = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
  const percentFormatter = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

  const parseNumber = (value) => {
    const normalized = String(value ?? '')
      .trim()
      .replace(/\s+/g, '')
      .replace(',', '.')
      .replace(/[^0-9.+-]/g, '');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : NaN;
  };

  const money = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const number = (value) => numberFormatter.format(Number.isFinite(value) ? value : 0);
  const percent = (value) => `${percentFormatter.format(Number.isFinite(value) ? value : 0)} %`;
  const months = (value) => {
    if (!Number.isFinite(value)) return 'Bez pravidelného deficitu';
    if (value < 0.05) return '0 měs.';
    return `${number(value)} měs.`;
  };

  const setText = (id, value) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };

  function setError(id, message) {
    const input = byId(id);
    const error = byId(`${id}Error`);
    const field = input ? input.closest('.field') : null;
    if (error) error.textContent = message;
    if (field) field.classList.toggle('has-error', Boolean(message));
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function rawValues() {
    return Object.fromEntries(fieldIds.map((id) => [id, parseNumber(byId(id).value)]));
  }

  function effectiveValues() {
    const raw = rawValues();
    if (state.mode === 'advanced') return raw;
    return {
      ...raw,
      receivables: 0,
      collectability: 0,
      earmarked: 0,
      oneOffShock: 0,
      costCutPercent: 0,
      costCutDelay: raw.targetMonths,
      safetyBuffer: 10,
      monthlySaving: 0,
      clientConcentration: 0,
      recoveryMonths: raw.targetMonths
    };
  }

  function validate(values) {
    const errors = {};
    const nonNegative = [
      'businessCosts', 'personalCosts', 'crisisIncome', 'liquidReserve', 'receivables',
      'earmarked', 'oneOffShock', 'monthlySaving'
    ];
    nonNegative.forEach((id) => {
      if (!Number.isFinite(values[id]) || values[id] < 0) errors[id] = 'Zadejte nezápornou částku.';
      if (Number.isFinite(values[id]) && values[id] > 1000000000) errors[id] = 'Zkontrolujte nezvykle vysokou částku.';
    });

    if (values.businessCosts + values.personalCosts <= 0) {
      errors.businessCosts = 'Zadejte alespoň jednu nezbytnou měsíční částku.';
      errors.personalCosts = 'Zadejte alespoň jednu nezbytnou měsíční částku.';
    }
    if (!Number.isFinite(values.targetMonths) || values.targetMonths < 1 || values.targetMonths > 36) errors.targetMonths = 'Zadejte horizont 1 až 36 měsíců.';
    if (!Number.isFinite(values.collectability) || values.collectability < 0 || values.collectability > 100) errors.collectability = 'Zadejte 0 až 100 %.';
    if (!Number.isFinite(values.costCutPercent) || values.costCutPercent < 0 || values.costCutPercent > 100) errors.costCutPercent = 'Zadejte 0 až 100 %.';
    if (!Number.isFinite(values.costCutDelay) || values.costCutDelay < 0 || values.costCutDelay > 36) errors.costCutDelay = 'Zadejte 0 až 36 měsíců.';
    if (!Number.isFinite(values.safetyBuffer) || values.safetyBuffer < 0 || values.safetyBuffer > 100) errors.safetyBuffer = 'Zadejte 0 až 100 %.';
    if (!Number.isFinite(values.clientConcentration) || values.clientConcentration < 0 || values.clientConcentration > 100) errors.clientConcentration = 'Zadejte 0 až 100 %.';
    if (!Number.isFinite(values.recoveryMonths) || values.recoveryMonths < 0 || values.recoveryMonths > 60) errors.recoveryMonths = 'Zadejte 0 až 60 měsíců.';

    fieldIds.forEach((id) => setError(id, errors[id] || ''));
    return Object.keys(errors).length === 0;
  }

  function calculate(values, horizon = values.targetMonths) {
    const targetMonths = Math.max(0, horizon);
    const essentialBefore = values.businessCosts + values.personalCosts;
    const reducedBusinessCosts = values.businessCosts * (1 - values.costCutPercent / 100);
    const essentialAfter = reducedBusinessCosts + values.personalCosts;
    const monthlyGapBefore = Math.max(0, essentialBefore - values.crisisIncome);
    const monthlyGapAfter = Math.max(0, essentialAfter - values.crisisIncome);
    const firstStageMonths = Math.min(targetMonths, Math.max(0, values.costCutDelay));
    const secondStageMonths = Math.max(0, targetMonths - firstStageMonths);
    const operatingNeed = monthlyGapBefore * firstStageMonths + monthlyGapAfter * secondStageMonths;
    const baseNeed = operatingNeed + values.oneOffShock;
    const recommended = baseNeed * (1 + values.safetyBuffer / 100);

    const usableReceivables = values.receivables * values.collectability / 100;
    const availableCash = Math.max(0, values.liquidReserve - values.earmarked);
    const available = availableCash + usableReceivables;
    const missing = Math.max(0, recommended - available);
    const surplus = Math.max(0, available - recommended);
    const coverage = recommended > 0 ? available / recommended : 1;

    const afterShock = Math.max(0, available - values.oneOffShock);
    let runway;
    if (monthlyGapBefore <= 0 && monthlyGapAfter <= 0) {
      runway = Infinity;
    } else if (firstStageMonths <= 0) {
      runway = monthlyGapAfter > 0 ? afterShock / monthlyGapAfter : Infinity;
    } else {
      const firstStageNeed = monthlyGapBefore * firstStageMonths;
      if (monthlyGapBefore > 0 && afterShock < firstStageNeed) {
        runway = afterShock / monthlyGapBefore;
      } else if (monthlyGapAfter > 0) {
        runway = firstStageMonths + Math.max(0, afterShock - firstStageNeed) / monthlyGapAfter;
      } else {
        runway = Infinity;
      }
    }

    const monthsToBuild = missing <= 0 ? 0 : values.monthlySaving > 0 ? missing / values.monthlySaving : Infinity;
    const receivableShare = available > 0 ? usableReceivables / available : 0;
    const monthlySavingForYear = missing / 12;

    return {
      ...values,
      targetMonths,
      essentialBefore,
      essentialAfter,
      reducedBusinessCosts,
      monthlyGapBefore,
      monthlyGapAfter,
      firstStageMonths,
      secondStageMonths,
      operatingNeed,
      baseNeed,
      recommended,
      usableReceivables,
      availableCash,
      available,
      missing,
      surplus,
      coverage,
      runway,
      monthsToBuild,
      receivableShare,
      monthlySavingForYear
    };
  }

  function resultState(result) {
    if (result.coverage >= 1.2) return { badge: 'Silná rezerva', className: 'status-badge strong', level: 'strong' };
    if (result.coverage >= 1) return { badge: 'Cíl pokryt', className: 'status-badge strong', level: 'covered' };
    if (result.coverage >= 0.5) return { badge: 'Částečně pokryto', className: 'status-badge warning', level: 'partial' };
    return { badge: 'Kritická mezera', className: 'status-badge danger', level: 'critical' };
  }

  function decision(values, result) {
    const concentrationRisk = values.clientConcentration >= 50;
    const receivableRisk = result.receivableShare >= 0.4;

    if (result.coverage < 0.5) {
      return {
        className: 'decision-card is-danger',
        label: 'Priorita: likvidita',
        title: 'Současné zdroje nestačí ani na polovinu stress testu',
        text: concentrationRisk
          ? 'Mezeru zvyšuje vysoká závislost na největším klientovi. Vedle doplnění hotovosti připravte i konkrétní plán náhrady příjmu.'
          : 'Nejdříve oddělte vyhrazené závazky, snižte nejistotu pohledávek a nastavte částku, která bude z každého inkasa automaticky odcházet do rezervy.'
      };
    }
    if (result.coverage < 1) {
      return {
        className: 'decision-card is-warning',
        label: 'Priorita: doplnění',
        title: 'Rezerva už dává čas, ale nevydrží celý zvolený scénář',
        text: receivableRisk
          ? 'Významná část použitelné rezervy stojí na pohledávkách. Pro bezpečnější plán pracujte také s variantou jejich pozdější nebo nižší úhrady.'
          : 'Mezeru lze uzavřít kombinací pravidelného doplňování, rychlejšího inkasa a předem připraveného snížení nákladů.'
      };
    }
    if (concentrationRisk) {
      return {
        className: 'decision-card is-warning',
        label: 'Cíl pokryt · riziko klienta',
        title: 'Likvidita je dostatečná, ale příjem je koncentrovaný',
        text: 'Rezerva splňuje zvolený finanční cíl. Současně však sledujte závislost na největším klientovi a pracujte na rozložení příjmů.'
      };
    }
    return {
      className: 'decision-card',
      label: result.coverage >= 1.2 ? 'Silná výchozí pozice' : 'Cíl stress testu splněn',
      title: result.coverage >= 1.2 ? 'Rezerva vytváří prostor i nad zvolený scénář' : 'Dostupné zdroje pokrývají zvolený horizont',
      text: 'Držte rezervu odděleně, pravidelně aktualizujte nezbytné náklady a po každém využití obnovte plán doplnění.'
    };
  }

  function goalDate(monthCount) {
    if (!Number.isFinite(monthCount) || monthCount <= 0) return '';
    const date = new Date();
    date.setMonth(date.getMonth() + Math.ceil(monthCount));
    return new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' }).format(date);
  }

  function updateActions(values, result) {
    if (result.missing <= 0) {
      setText('actionOneTitle', 'Chraňte dosažený cíl');
      setText('actionOneText', `Po pokrytí cíle zbývá ${money(result.surplus)}. Určete, jaká část zůstává nedotknutelná.`);
    } else if (values.monthlySaving > 0) {
      setText('actionOneTitle', 'Doplňte likviditu');
      setText('actionOneText', `Při ${money(values.monthlySaving)} měsíčně vychází přibližně ${Math.ceil(result.monthsToBuild)} měsíců do cíle${goalDate(result.monthsToBuild) ? `, tedy kolem ${goalDate(result.monthsToBuild)}` : ''}.`);
    } else {
      setText('actionOneTitle', 'Nastavte pravidelný vklad');
      setText('actionOneText', `Pro doplnění do 12 měsíců by bylo potřeba odkládat přibližně ${money(result.monthlySavingForYear)} měsíčně.`);
    }

    if (result.usableReceivables > 0) {
      setText('actionTwoTitle', result.receivableShare >= 0.4 ? 'Snižte závislost na pohledávkách' : 'Hlídejte inkaso');
      setText('actionTwoText', `${money(result.usableReceivables)} zdrojů stojí na očekávaných úhradách. Sledujte splatnost a platební historii.`);
    } else {
      setText('actionTwoTitle', 'Zrychlete inkaso');
      setText('actionTwoText', 'Kratší splatnost, zálohy a průběžná fakturace mohou snížit potřebu vlastního překlenovacího kapitálu.');
    }

    if (values.costCutPercent > 0) {
      setText('actionThreeTitle', 'Připravte spouštěč úspor');
      setText('actionThreeText', `Po ${number(values.costCutDelay)} měsících model počítá s ${percent(values.costCutPercent)} snížením podnikatelských nákladů.`);
    } else {
      setText('actionThreeTitle', 'Sepište úspornou variantu');
      setText('actionThreeText', 'Určete náklady, které lze omezit bez ztráty schopnosti získat a dodat práci.');
    }
  }

  function renderScenarioCard(values, horizon) {
    const result = calculate(values, horizon);
    const card = document.createElement('article');
    card.className = 'scenario-card';
    if (Math.abs(horizon - values.targetMonths) < 0.01) card.classList.add('is-current');

    const label = document.createElement('span');
    label.textContent = `${horizon} měsíců ochrany`;
    const heading = document.createElement('h3');
    heading.textContent = money(result.recommended);
    const list = document.createElement('dl');
    [
      ['Použitelné zdroje', money(result.available)],
      ['Chybí do cíle', money(result.missing)],
      ['Deficit po úsporách', money(result.monthlyGapAfter)],
      ['Doplnění při zadaném vkladu', Number.isFinite(result.monthsToBuild) ? (result.monthsToBuild === 0 ? 'Cíl splněn' : `${Math.ceil(result.monthsToBuild)} měs.`) : 'Bez vkladu']
    ].forEach(([term, description]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = term;
      dd.textContent = description;
      row.append(dt, dd);
      list.append(row);
    });
    card.append(label, heading, list);
    if (Math.abs(horizon - values.targetMonths) < 0.01) {
      const current = document.createElement('b');
      current.textContent = 'Váš zvolený scénář';
      card.append(current);
    }
    return card;
  }

  function renderScenarios(values) {
    const grid = byId('scenarioGrid');
    grid.replaceChildren(...[3, 6, 9, 12].map((horizon) => renderScenarioCard(values, horizon)));
    const current = calculate(values, values.targetMonths);
    setText('scenarioHeadline', `${number(values.targetMonths)}měsíční varianta vyžaduje ${money(current.recommended)}.`);
    setText('scenarioExplanation', values.recoveryMonths > values.targetMonths
      ? `Odhad návratu příjmů je ${number(values.recoveryMonths)} měsíců, tedy delší než zvolený horizont. Zvažte delší stress test nebo rychlejší reakční plán.`
      : 'Horizont je pracovní rozhodnutí, nikoli univerzální doporučení. Vyšší nejistota příjmů a pomalejší reakce nákladů obvykle znamenají potřebu delšího scénáře.');
  }

  function render(options = {}) {
    const values = effectiveValues();
    if (!validate(values)) {
      setText('recommendedReserve', '—');
      setText('availableReserve', '—');
      setText('currentRunway', '—');
      setText('missingReserve', '—');
      setText('monthlyGap', '—');
      return false;
    }

    const result = calculate(values);
    const status = resultState(result);
    const decisionData = decision(values, result);
    const coverageWidth = Math.min(100, Math.max(0, result.coverage * 100));
    const bufferText = state.mode === 'basic' ? 'včetně výchozího 10% polštáře' : `včetně ${percent(values.safetyBuffer)} polštáře`;

    setText('recommendedReserve', money(result.recommended));
    setText('availableReserve', money(result.available));
    setText('availableDetail', state.mode === 'basic'
      ? 'Likvidní peníze bez započtení pohledávek a závazků'
      : `${money(result.availableCash)} hotovost + ${money(result.usableReceivables)} realistické pohledávky`);
    setText('currentRunway', months(result.runway));
    setText('runwayDetail', values.oneOffShock > 0 ? `Po jednorázovém šoku ${money(values.oneOffShock)}` : 'Bez zadaného jednorázového šoku');
    setText('missingReserve', money(result.missing));
    setText('gapDetail', result.missing > 0 ? `${percent((1 - Math.min(1, result.coverage)) * 100)} cílové rezervy` : `Přebytek ${money(result.surplus)}`);
    setText('monthlyGap', money(result.monthlyGapBefore));
    setText('postCutGap', values.costCutPercent > 0 ? `Po úsporách ${money(result.monthlyGapAfter)}` : 'Bez zadaného snížení nákladů');
    setText('resultSentence', `Cíl kryje ${number(values.targetMonths)} měsíců zadaného scénáře, ${bufferText}${values.oneOffShock > 0 ? ` a jednorázový šok ${money(values.oneOffShock)}` : ''}.`);

    const badge = byId('resultBadge');
    badge.textContent = status.badge;
    badge.className = status.className;
    setText('coveragePercent', percent(result.coverage * 100));
    setText('coverageNote', result.coverage >= 1 ? 'Zvolený cíl je pokryt' : 'Cíl ještě není splněn');
    byId('coverageFill').style.width = `${coverageWidth}%`;
    setText('coverageText', `Použitelná rezerva ${money(result.available)} oproti doporučeným ${money(result.recommended)}.`);

    const decisionCard = byId('decisionCard');
    decisionCard.className = decisionData.className;
    setText('decisionLabel', decisionData.label);
    setText('decisionTitle', decisionData.title);
    setText('decisionText', decisionData.text);
    updateActions(values, result);

    setText('heroRecommended', money(result.recommended));
    setText('heroStatus', status.badge);
    byId('heroCoverageFill').style.width = `${coverageWidth}%`;
    setText('heroCoverageLabel', percent(result.coverage * 100));
    setText('heroRunway', months(result.runway));
    setText('heroGap', money(result.missing));
    setText('heroMonthlyGap', money(result.monthlyGapBefore));
    setText('heroNote', state.mode === 'advanced'
      ? 'Výpočet odděluje dostupnou hotovost od vyhrazených závazků a zohledňuje jen realistickou část pohledávek.'
      : 'Základní režim používá likvidní hotovost, nulové pohledávky a výchozí 10% bezpečnostní polštář.');

    renderScenarios(values);

    if (options.scroll && window.matchMedia('(max-width: 820px)').matches) {
      byId('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    byId('advancedPanel').hidden = mode !== 'advanced';
    render();
  }

  const presets = {
    freelancer: {
      businessCosts: '8 000', personalCosts: '32 000', crisisIncome: '0', targetMonths: '6', liquidReserve: '160 000',
      receivables: '30 000', collectability: '70', earmarked: '15 000', oneOffShock: '20 000', costCutPercent: '10',
      costCutDelay: '1', safetyBuffer: '10', monthlySaving: '10 000', clientConcentration: '45', recoveryMonths: '4'
    },
    studio: {
      businessCosts: '85 000', personalCosts: '30 000', crisisIncome: '45 000', targetMonths: '6', liquidReserve: '420 000',
      receivables: '180 000', collectability: '60', earmarked: '90 000', oneOffShock: '50 000', costCutPercent: '20',
      costCutDelay: '2', safetyBuffer: '15', monthlySaving: '30 000', clientConcentration: '35', recoveryMonths: '6'
    },
    eshop: {
      businessCosts: '140 000', personalCosts: '35 000', crisisIncome: '80 000', targetMonths: '9', liquidReserve: '520 000',
      receivables: '120 000', collectability: '80', earmarked: '170 000', oneOffShock: '100 000', costCutPercent: '18',
      costCutDelay: '3', safetyBuffer: '20', monthlySaving: '45 000', clientConcentration: '15', recoveryMonths: '8'
    }
  };

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([id, value]) => { byId(id).value = value; });
    document.querySelectorAll('[data-preset]').forEach((button) => button.classList.toggle('is-active', button.dataset.preset === name));
    render();
  }

  function reset() {
    form.reset();
    fieldIds.forEach((id) => setError(id, ''));
    document.querySelectorAll('[data-preset]').forEach((button) => button.classList.remove('is-active'));
    setMode('basic');
  }

  async function copyResult() {
    const values = effectiveValues();
    if (!validate(values)) return;
    const result = calculate(values);
    const text = `Podnikatelská rezerva: doporučený cíl ${money(result.recommended)}, použitelné zdroje ${money(result.available)}, runway ${months(result.runway)}, chybí ${money(result.missing)}. Horizont ${number(values.targetMonths)} měsíců.`;
    const button = byId('copyResult');
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Zkopírováno';
      window.setTimeout(() => { button.textContent = 'Kopírovat výsledek'; }, 1500);
    } catch {
      button.textContent = 'Kopírování selhalo';
    }
  }

  document.addEventListener('keydown', (event) => { if (event.key === 'Tab') document.body.classList.add('keyboard-user'); });
  document.addEventListener('pointerdown', () => document.body.classList.remove('keyboard-user'));
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  fieldIds.forEach((id) => {
    const field = byId(id);
    field.addEventListener('input', () => render());
    field.addEventListener('change', () => render());
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render({ scroll: true });
  });
  byId('resetButton').addEventListener('click', reset);
  byId('copyResult').addEventListener('click', copyResult);

  setMode('basic');
})();
