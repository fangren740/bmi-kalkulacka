(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('pricingForm');
  if (!form) return;

  const basicIds = ['bDirect','bLabor','bOverhead','bFees','bMargin','bVat','bCurrent','bDiscount','bRounding'];
  const advancedIds = ['aMaterial','aProduction','aPackaging','aShipping','aOther','aWaste','aMinutes','aHourly','aFixedMonthly','aUnits','aCommission','aPayment','aMarketing','aReturns','aFixedFee','aMargin','aDiscount','aVat','aCurrent','aRounding','aBuffer'];
  const allIds = [...basicIds, ...advancedIds];

  const defaults = {
    bDirect:'420', bLabor:'180', bOverhead:'70', bFees:'4.5', bMargin:'25', bVat:'21', bCurrent:'999', bDiscount:'10', bRounding:'10',
    aMaterial:'350', aProduction:'55', aPackaging:'35', aShipping:'20', aOther:'0', aWaste:'3', aMinutes:'30', aHourly:'500', aFixedMonthly:'12000', aUnits:'100',
    aCommission:'12', aPayment:'1.5', aMarketing:'4', aReturns:'2', aFixedFee:'5', aMargin:'22', aDiscount:'15', aVat:'21', aCurrent:'1190', aRounding:'99', aBuffer:'3'
  };

  const presets = {
    eshop: {
      basic: {bDirect:420,bLabor:120,bOverhead:85,bFees:8,bMargin:24,bDiscount:10,bCurrent:999},
      advanced: {aCommission:0,aPayment:1.5,aMarketing:8,aReturns:3,aDiscount:10}
    },
    marketplace: {
      basic: {bDirect:420,bLabor:120,bOverhead:95,bFees:17.5,bMargin:22,bDiscount:15,bCurrent:1190},
      advanced: {aCommission:12,aPayment:1.5,aMarketing:4,aReturns:2,aDiscount:15}
    },
    service: {
      basic: {bDirect:40,bLabor:850,bOverhead:160,bFees:2,bMargin:30,bDiscount:0,bCurrent:1690},
      advanced: {aMaterial:0,aProduction:0,aPackaging:0,aShipping:0,aMinutes:90,aHourly:650,aCommission:0,aPayment:1,aMarketing:5,aReturns:1,aDiscount:0}
    },
    handmade: {
      basic: {bDirect:280,bLabor:320,bOverhead:90,bFees:4,bMargin:28,bDiscount:8,bCurrent:1190},
      advanced: {aMaterial:280,aProduction:30,aPackaging:45,aShipping:15,aMinutes:45,aHourly:420,aWaste:6,aCommission:0,aPayment:1.5,aMarketing:4,aReturns:1,aDiscount:8}
    }
  };

  let mode = 'basic';
  let lastResult = null;

  function number(value) {
    const normalized = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.');
    if (normalized === '') return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  const money = (value) => Number.isFinite(value)
    ? new Intl.NumberFormat('cs-CZ', {style:'currency',currency:'CZK',maximumFractionDigits:0}).format(value)
    : '—';

  const percent = (value) => Number.isFinite(value)
    ? `${new Intl.NumberFormat('cs-CZ', {minimumFractionDigits:1,maximumFractionDigits:1}).format(value)} %`
    : '—';

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setWidth(id, value) {
    const element = $(id);
    if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  function readValues() {
    if (mode === 'basic') {
      return {
        mode,
        direct:number($('bDirect').value),
        labor:number($('bLabor').value),
        overhead:number($('bOverhead').value),
        fees:number($('bFees').value) / 100,
        margin:number($('bMargin').value) / 100,
        vat:number($('bVat').value) / 100,
        current:number($('bCurrent').value),
        discount:number($('bDiscount').value) / 100,
        rounding:$('bRounding').value,
        units:Number.NaN,
        risk:0
      };
    }

    const material = number($('aMaterial').value);
    const production = number($('aProduction').value);
    const packaging = number($('aPackaging').value);
    const shipping = number($('aShipping').value);
    const other = number($('aOther').value);
    const waste = number($('aWaste').value) / 100;
    const minutes = number($('aMinutes').value);
    const hourly = number($('aHourly').value);
    const monthlyFixed = number($('aFixedMonthly').value);
    const units = number($('aUnits').value);
    const fixedFee = number($('aFixedFee').value);
    const buffer = number($('aBuffer').value) / 100;

    const labor = minutes / 60 * hourly;
    const overhead = units > 0 ? monthlyFixed / units : Number.NaN;
    const base = material + production + packaging + shipping + other + labor;
    const adjustedForWaste = waste < 1 ? base / (1 - waste) : Number.NaN;
    const wasteCost = adjustedForWaste - base;
    const beforeBuffer = adjustedForWaste + overhead + fixedFee;
    const bufferCost = beforeBuffer * buffer;
    const channelPercent = number($('aCommission').value) + number($('aPayment').value) + number($('aMarketing').value) + number($('aReturns').value);

    return {
      mode,
      direct:material + production + packaging + shipping + other + fixedFee,
      labor,
      overhead,
      fees:channelPercent / 100,
      margin:number($('aMargin').value) / 100,
      vat:number($('aVat').value) / 100,
      current:number($('aCurrent').value),
      discount:number($('aDiscount').value) / 100,
      rounding:$('aRounding').value,
      units,
      risk:wasteCost + bufferCost,
      cost:beforeBuffer + bufferCost,
      channel:channelPercent
    };
  }

  function validate(values) {
    const required = [values.direct,values.labor,values.overhead,values.fees,values.margin,values.vat,values.current,values.discount];
    if (required.some((value) => !Number.isFinite(value))) return 'Doplňte všechna aktivní pole platným číslem. Lze použít desetinnou čárku i tečku.';
    if ([values.direct,values.labor,values.overhead,values.current].some((value) => value < 0)) return 'Náklady ani současná cena nemohou být záporné.';
    if (values.mode === 'advanced' && (!Number.isFinite(values.cost) || !Number.isFinite(values.units) || values.units <= 0)) return 'Očekávaný měsíční prodej musí být větší než nula.';
    if (values.fees < 0 || values.margin < 0 || values.discount < 0 || values.vat < 0) return 'Procentní hodnoty nemohou být záporné.';
    if (values.fees + values.margin >= 0.95) return 'Součet poplatků a cílové marže je příliš vysoký. Musí zůstat část ceny na pokrytí nákladů.';
    if (values.discount >= 0.9) return 'Plánovaná sleva musí být nižší než 90 %.';
    return '';
  }

  function roundPrice(value, method) {
    if (method === 'exact') return value;
    if (method === '49') {
      let rounded = Math.floor(value / 100) * 100 + 49;
      if (rounded < value) rounded += 100;
      return rounded;
    }
    if (method === '99') {
      let rounded = Math.floor(value / 100) * 100 + 99;
      if (rounded < value) rounded += 100;
      return rounded;
    }
    const step = Math.max(1, Number(method) || 1);
    return Math.ceil((value - 1e-9) / step) * step;
  }

  function calculate(values) {
    const cost = values.mode === 'advanced' ? values.cost : values.direct + values.labor + values.overhead;
    const breakEven = cost / (1 - values.fees);
    const target = cost / (1 - values.fees - values.margin);
    const rawCatalog = target / (1 - values.discount);
    const catalog = roundPrice(rawCatalog, values.rounding);
    const discounted = catalog * (1 - values.discount);
    const gross = catalog * (1 + values.vat);
    const feeAmount = target * values.fees;
    const profit = target * values.margin;
    const markup = cost > 0 ? (target - cost) / cost * 100 : 0;
    const currentProfit = values.current > 0 ? values.current - cost - values.current * values.fees : Number.NaN;
    const currentMargin = values.current > 0 ? currentProfit / values.current * 100 : Number.NaN;
    const difference = values.current > 0 ? values.current - target : Number.NaN;
    const safeDiscount = values.current >= target && values.current > 0 ? (values.current - target) / values.current * 100 : Number.NaN;

    return {
      cost,breakEven,target,catalog,discounted,gross,feeAmount,profit,markup,currentMargin,difference,safeDiscount,
      monthlyProfit:Number.isFinite(values.units) ? profit * values.units : Number.NaN,
      monthlyRevenue:Number.isFinite(values.units) ? target * values.units : Number.NaN
    };
  }

  function getVerdict(values, result) {
    if (!(values.current > 0)) return ['neutral','Bez porovnání ceníku','Ekonomické hranice jsou připravené',`Cílové minimum je ${money(result.target)} bez DPH. Současnou cenu jste nezadali.`,`Porovnejte výsledek s trhem a hodnotou nabídky.`];
    if (values.current < result.breakEven) return ['danger','Cena pod bodem nula','Současná cena nepokrývá celý model',`Do bodu nula chybí ${money(result.breakEven - values.current)}.`,`Zvyšte cenu, změňte kanál nebo snižte nákladovou stopu.`];
    if (values.current < result.target) return ['warning','Cena pod cílovým minimem','Náklady pokryjete, cílovou marži ne',`Cena je o ${money(result.target - values.current)} nižší než zadaný cíl.`,`Rozhodněte, zda jde o vědomou akci, nebo slabý ceník.`];
    if (Number.isFinite(result.safeDiscount) && result.safeDiscount < 5) return ['warning','Těsná cenová rezerva','Cíl plníte, ale sleva je riziková',`Prostor do cílového minima je přibližně ${percent(result.safeDiscount)}.`,`Před akcí zkontrolujte poplatky a růst nákladů.`];
    return ['','Cena nad cílovým minimem','Současný ceník má použitelnou rezervu',`Cena je o ${money(result.difference)} nad cílovým minimem a modelová marže je ${percent(result.currentMargin)}.`,`Slevu poskytujte jen s jasným obchodním cílem.`];
  }

  function renderError(message) {
    $('pricingError').hidden = false;
    setText('pricingError', message);
    ['breakEvenPrice','targetPrice','targetPriceMirror','catalogPrice','grossPrice','discountedPrice','unitCost','unitProfit','markup'].forEach((id) => setText(id, '—'));
    $('statusBadge').className = 'price-status danger';
    setText('statusBadge','Zkontrolujte zadání');
    $('verdict').className = 'price-verdict danger';
    setText('verdictKicker','Chyba ve vstupu');
    setText('verdictTitle','Výpočet nelze dokončit');
    setText('verdictText',message);
    setText('verdictAction','Opravte označené hodnoty a výsledek se přepočítá.');
    lastResult = null;
  }

  function render() {
    const values = readValues();

    if (values.mode === 'advanced') {
      setText('laborPreview', money(values.labor));
      setText('overheadPreview', money(values.overhead));
      setText('channelPreview', percent(values.channel));
      setText('costPreview', money(values.cost));
    }

    const error = validate(values);
    if (error) {
      renderError(error);
      return;
    }

    $('pricingError').hidden = true;
    const result = calculate(values);
    const verdict = getVerdict(values, result);
    lastResult = {values,result};

    setText('breakEvenPrice',money(result.breakEven));
    setText('targetPrice',money(result.target));
    setText('targetPriceMirror',money(result.target));
    setText('catalogPrice',money(result.catalog));
    setText('grossPrice',money(result.gross));
    setText('discountedPrice',money(result.discounted));
    setText('targetNote',`obsahuje marži ${percent(values.margin * 100)}`);
    setText('catalogNote',values.discount > 0 ? `unese slevu ${percent(values.discount * 100)}` : 'bez plánované slevy');
    setText('unitCost',money(result.cost));
    setText('unitProfit',money(result.profit));
    setText('markup',percent(result.markup));
    setText('mixLoad',percent((values.fees + values.margin) * 100));
    setWidth('barCost',result.cost / result.target * 100);
    setWidth('barFee',values.fees * 100);
    setWidth('barProfit',values.margin * 100);

    $('statusBadge').className = `price-status ${verdict[0]}`.trim();
    setText('statusBadge',verdict[1]);
    $('verdict').className = `price-verdict ${verdict[0]}`.trim();
    setText('verdictKicker',verdict[1]);
    setText('verdictTitle',verdict[2]);
    setText('verdictText',verdict[3]);
    setText('verdictAction',verdict[4]);

    setText('monthlyProfit',Number.isFinite(result.monthlyProfit) ? money(result.monthlyProfit) : 'Podrobný režim');
    setText('monthlyRevenue',Number.isFinite(result.monthlyRevenue) ? money(result.monthlyRevenue) : 'Podrobný režim');
    setText('rDirect',money(values.direct));
    setText('rLabor',money(values.labor));
    setText('rOverhead',money(values.overhead));
    setText('rRisk',money(values.risk));
    setText('rFees',money(result.feeAmount));
    setText('rMargin',money(result.profit));
    setText('rCurrentMargin',Number.isFinite(result.currentMargin) ? percent(result.currentMargin) : '—');
    setText('rDifference',Number.isFinite(result.difference) ? money(result.difference) : '—');

  }

  function setMode(nextMode) {
    mode = nextMode === 'advanced' ? 'advanced' : 'basic';
    document.querySelectorAll('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    $('basicPanel').hidden = mode !== 'basic';
    $('advancedPanel').hidden = mode !== 'advanced';
    render();
  }

  function applyPreset(name) {
    const preset = presets[name]?.[mode];
    if (!preset) return;
    Object.entries(preset).forEach(([id,value]) => { $(id).value = String(value); });
    document.querySelectorAll('[data-preset]').forEach((button) => button.setAttribute('aria-pressed',String(button.dataset.preset === name)));
    render();
  }

  function reset() {
    Object.entries(defaults).forEach(([id,value]) => { $(id).value = value; });
    document.querySelectorAll('[data-preset]').forEach((button) => button.setAttribute('aria-pressed','false'));
    const breakdown = document.querySelector('.price-breakdown');
    if (breakdown) breakdown.open = false;
    const resultDetails = document.querySelector('.mp-result-details');
    if (resultDetails) resultDetails.open = false;
    setText('copyStatus','');
    setMode('basic');
  }

  function createShareUrl() {
    const params = new URLSearchParams({mode});
    (mode === 'basic' ? basicIds : advancedIds).forEach((id) => params.set(id,$(id).value));
    return `${location.origin}${location.pathname}?${params}`;
  }

  function loadFromUrl() {
    const params = new URLSearchParams(location.search);
    const requestedMode = params.get('mode');
    if (requestedMode === 'basic' || requestedMode === 'advanced') mode = requestedMode;
    (mode === 'basic' ? basicIds : advancedIds).forEach((id) => {
      if (params.has(id)) $(id).value = params.get(id);
    });
    setMode(mode);
  }

  async function copy(value,message) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setText('copyStatus',message);
    } catch {
      setText('copyStatus','Kopírování se nepodařilo.');
    }
  }

  function getResultText() {
    if (!lastResult) return 'Výpočet nelze dokončit.';
    const {values,result} = lastResult;
    return `Minimální prodejní cena – RychléVýpočty.cz\nBod nula: ${money(result.breakEven)}\nCílové minimum: ${money(result.target)}\nDoporučený ceník bez DPH: ${money(result.catalog)}\nCeník s DPH: ${money(result.gross)}\nCena po slevě: ${money(result.discounted)}\nNáklad na jednotku: ${money(result.cost)}\nCílová marže: ${percent(values.margin * 100)}`;
  }

  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click',() => setMode(button.dataset.mode)));
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click',() => applyPreset(button.dataset.preset)));
  allIds.forEach((id) => {
    $(id).addEventListener('input',() => {
      document.querySelectorAll('[data-preset]').forEach((button) => button.setAttribute('aria-pressed','false'));
      render();
    });
    $(id).addEventListener('change',render);
  });

  $('resetBtn').addEventListener('click',reset);
  $('copyBtn').addEventListener('click',() => copy(getResultText(),'Výsledek byl zkopírován.'));
  $('shareBtn').addEventListener('click',() => copy(createShareUrl(),'Odkaz s nastavením byl zkopírován.'));
  form.addEventListener('submit',(event) => {
    event.preventDefault();
    render();
    if (matchMedia('(max-width:900px)').matches) $('vysledek').scrollIntoView({behavior:'smooth',block:'start'});
  });

  loadFromUrl();
  render();
})();
