(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var inputIds = ['purchasePrice','resaleValue','ownershipYears','annualKm','includeCosts','entryCosts','sellingCosts','optimisticResale','conservativeResale','enableComparison','comparePurchase','compareResale'];
  var inputs = {};
  inputIds.forEach(function (id) { inputs[id] = $(id); });

  var presets = {
    family: { purchasePrice:550000,resaleValue:340000,ownershipYears:5,annualKm:15000,entryCosts:0,sellingCosts:0,optimisticResale:380000,conservativeResale:300000,comparePurchase:420000,compareResale:280000 },
    city: { purchasePrice:320000,resaleValue:220000,ownershipYears:4,annualKm:10000,entryCosts:10000,sellingCosts:5000,optimisticResale:245000,conservativeResale:185000,comparePurchase:280000,compareResale:195000 },
    distance: { purchasePrice:680000,resaleValue:330000,ownershipYears:5,annualKm:30000,entryCosts:15000,sellingCosts:8000,optimisticResale:380000,conservativeResale:270000,comparePurchase:570000,compareResale:285000 }
  };
  var tabs = ['Costs','Scenarios','Compare'];
  var activeStep = 0;

  function value(id) {
    var number = Number(inputs[id].value);
    return Number.isFinite(number) ? number : 0;
  }
  function checked(id) { return Boolean(inputs[id] && inputs[id].checked); }
  function text(id, value) { var element = $(id); if (element) element.textContent = value; }
  function hidden(id, state) { var element = $(id); if (element) element.hidden = state; }
  function width(id, percent) { var element = $(id); if (element) element.style.width = Math.max(3,Math.min(100,percent)) + '%'; }
  function money(number) { return Math.round(number).toLocaleString('cs-CZ') + ' Kč'; }
  function decimal(number, digits) { return number.toLocaleString('cs-CZ',{minimumFractionDigits:digits,maximumFractionDigits:digits}); }
  function yearsLabel(number) { return decimal(number,number % 1 ? 1 : 0) + (number === 1 ? ' rok' : number >= 2 && number <= 4 ? ' roky' : ' let'); }

  function calculateForResale(resale) {
    var useCosts = checked('includeCosts');
    var effectivePurchase = value('purchasePrice') + (useCosts ? value('entryCosts') : 0);
    var netResale = resale - (useCosts ? value('sellingCosts') : 0);
    var years = value('ownershipYears');
    var mileage = years * value('annualKm');
    var loss = effectivePurchase - netResale;
    return {
      effectivePurchase:effectivePurchase,
      netResale:netResale,
      years:years,
      mileage:mileage,
      loss:loss,
      monthly:loss/(years*12),
      annual:loss/years,
      perKm:loss/mileage,
      retained:effectivePurchase > 0 ? netResale/effectivePurchase*100 : 0,
      annualRate:effectivePurchase > 0 && netResale > 0 ? (1-Math.pow(netResale/effectivePurchase,1/years))*100 : 100
    };
  }

  function validate() {
    var error = $('formError');
    var issue = '';
    var purchase = value('purchasePrice');
    var resale = value('resaleValue');
    if (purchase <= 0) issue = 'Pořizovací cena musí být vyšší než nula.';
    else if (resale < 0 || resale > purchase + value('entryCosts')) issue = 'Prodejní cena musí být nezáporná a nesmí převyšovat ekonomickou pořizovací hodnotu.';
    else if (value('ownershipYears') < .5) issue = 'Doba držení musí být alespoň půl roku.';
    else if (value('annualKm') <= 0) issue = 'Roční nájezd musí být vyšší než nula.';
    else if (value('optimisticResale') < resale) issue = 'Příznivá prodejní cena má být alespoň stejně vysoká jako základní odhad.';
    else if (value('conservativeResale') > resale) issue = 'Konzervativní prodejní cena má být nižší nebo stejná jako základní odhad.';
    else if (checked('enableComparison') && value('compareResale') > value('comparePurchase')) issue = 'Prodejní cena auta B nesmí převyšovat jeho pořizovací cenu.';
    error.hidden = !issue;
    error.textContent = issue;
    return !issue;
  }

  function renderTable(result) {
    var body = $('detailTableBody');
    var rows = [
      ['Pořizovací hodnota',money(result.effectivePurchase),'kupní cena' + (checked('includeCosts') ? ' a vstupní investice' : '')],
      ['Čistá hodnota při prodeji',money(result.netResale),'prodejní cena' + (checked('includeCosts') ? ' po nákladech prodeje' : '')],
      ['Celková ztráta',money(result.loss),'rozdíl pořízení a prodeje'],
      ['Doba držení',yearsLabel(result.years),'horizont modelu'],
      ['Celkový nájezd',Math.round(result.mileage).toLocaleString('cs-CZ') + ' km','roční nájezd × doba'],
      ['Měsíční průměr',money(result.monthly),'nejde o pravidelnou platbu'],
      ['Amortizace na km',decimal(result.perKm,2) + ' Kč/km','jen pokles hodnoty']
    ];
    body.replaceChildren();
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      row.forEach(function (cell) { var td=document.createElement('td'); td.textContent=cell; tr.appendChild(td); });
      body.appendChild(tr);
    });
  }

  function renderComparison(result) {
    var enabled = checked('enableComparison');
    hidden('resultComparison',!enabled);
    if (!enabled) return;
    var lossB = value('comparePurchase') - value('compareResale');
    var monthlyB = lossB/(result.years*12);
    var perKmB = lossB/result.mileage;
    var difference = result.monthly-monthlyB;
    var bWins = difference > 0;
    text('compareMonthlyPreview',money(monthlyB) + '/měs.');
    text('compareAdvicePreview',bWins ? 'Při stejném horizontu ztrácí méně než auto A.' : difference < 0 ? 'Při stejném horizontu ztrácí více než auto A.' : 'Obě auta mají stejný měsíční pokles.');
    text('comparisonHeadline',bWins ? 'Auto B ztrácí méně' : difference < 0 ? 'Auto A ztrácí méně' : 'Obě auta vycházejí stejně');
    text('comparisonText','Rozdíl činí ' + money(Math.abs(difference)) + ' měsíčně a auto B vychází na ' + decimal(perKmB,2) + ' Kč/km. Porovnejte ještě provoz, stav a financování.');
  }

  function renderScenarios(result) {
    var optimistic = calculateForResale(value('optimisticResale'));
    var conservative = calculateForResale(value('conservativeResale'));
    var maxMonthly = Math.max(optimistic.monthly,result.monthly,conservative.monthly,1);
    text('previewOptimistic',money(optimistic.monthly) + '/měs.');
    text('previewBase',money(result.monthly) + '/měs.');
    text('previewConservative',money(conservative.monthly) + '/měs.');
    text('scenarioOptimisticMonthly',money(optimistic.monthly) + '/měs.');
    text('scenarioBaseMonthly',money(result.monthly) + '/měs.');
    text('scenarioConservativeMonthly',money(conservative.monthly) + '/měs.');
    text('scenarioOptimisticText','Prodej za ' + money(value('optimisticResale')));
    text('scenarioBaseText','Prodej za ' + money(value('resaleValue')));
    text('scenarioConservativeText','Prodej za ' + money(value('conservativeResale')));
    width('scenarioOptimisticBar',optimistic.monthly/maxMonthly*100);
    width('scenarioBaseBar',result.monthly/maxMonthly*100);
    width('scenarioConservativeBar',conservative.monthly/maxMonthly*100);
    var reserve = Math.max(0,conservative.monthly-result.monthly);
    var totalGap = Math.max(0,conservative.loss-result.loss);
    text('stressReserve',money(reserve) + ' měsíčně');
    text('stressText','Konzervativní prodej by zvýšil celkovou ztrátu o ' + money(totalGap) + '. Tuto částku nevydáte každý měsíc, ale projeví se při prodeji.');
    text('scenarioRange',money(Math.min(optimistic.monthly,conservative.monthly)) + '–' + money(Math.max(optimistic.monthly,conservative.monthly)));
  }

  function render(result) {
    var retained = Math.max(0,Math.min(100,result.retained));
    var lossShare = 100-retained;
    var costsActive = checked('includeCosts');
    var proActive = costsActive || checked('enableComparison');
    text('modeBadge',proActive ? 'PRO režim' : 'BASIC režim');
    text('monthlyLoss',money(result.monthly));
    text('totalLoss',money(result.loss));
    text('annualLoss',money(result.annual));
    text('lossPerKm',decimal(result.perKm,2) + ' Kč/km');
    text('retainedShare',decimal(retained,1) + ' %');
    text('resultPurchase',money(result.effectivePurchase));
    text('resultResale',money(result.netResale));
    text('resultStatus',lossShare > 50 ? 'vyšší pokles hodnoty' : lossShare > 30 ? 'střední pokles hodnoty' : 'nižší pokles hodnoty');
    text('resultSummary',money(result.effectivePurchase) + ' → ' + money(result.netResale) + ' za ' + yearsLabel(result.years));
    width('resultCurveBar',retained);
    text('readingTitle','Každý měsíc mizí průměrně ' + money(result.monthly) + ' hodnoty.');
    text('readingText','Odhad prodejní ceny ovlivní výsledek víc než drobné zaokrouhlení doby nebo nájezdu.');

    text('heroLoss',money(result.loss));
    text('heroLossShare',decimal(lossShare,1) + ' % pořizovací ceny');
    text('heroPurchase',money(result.effectivePurchase));
    text('heroResale',money(result.netResale));
    text('heroMonthly',money(result.monthly));
    text('heroAnnual',money(result.annual));
    text('heroPerKm',decimal(result.perKm,2) + ' Kč');
    width('heroRetainedBar',retained);

    text('detailHeadline','Auto si ponechá přibližně ' + decimal(retained,0) + ' % pořizovací hodnoty.');
    text('detailText','Základní model počítá s prodejem za ' + money(value('resaleValue')) + ' po ' + yearsLabel(result.years) + '.');
    text('detailMileage',Math.round(result.mileage).toLocaleString('cs-CZ') + ' km');
    text('annualRate',decimal(result.annualRate,1) + ' % ročně');
    renderTable(result);
    renderScenarios(result);
    renderComparison(result);
  }

  function run() {
    if (!validate()) return;
    render(calculateForResale(value('resaleValue')));
  }

  function activateStep(index) {
    activeStep = Math.max(0,Math.min(tabs.length-1,index));
    tabs.forEach(function (name,tabIndex) {
      var button = $('tab' + name);
      var panel = $('panel' + name);
      var active = tabIndex === activeStep;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-selected',String(active));
      panel.hidden = !active;
    });
    text('proStep',(activeStep+1) + ' / ' + tabs.length);
    $('proPrev').disabled = activeStep === 0;
    $('proNext').disabled = activeStep === tabs.length-1;
  }

  function applyPreset(name) {
    var preset = presets[name];
    Object.keys(preset).forEach(function (key) { inputs[key].value = preset[key]; });
    inputs.includeCosts.checked = false;
    inputs.enableComparison.checked = false;
    document.querySelectorAll('[data-preset]').forEach(function (button) {
      var active = button.getAttribute('data-preset') === name;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    run();
  }

  $('depreciationForm').addEventListener('submit',function (event) { event.preventDefault(); run(); });
  inputIds.forEach(function (id) {
    inputs[id].addEventListener('input',run);
    inputs[id].addEventListener('change',run);
  });
  document.querySelectorAll('[data-preset]').forEach(function (button) { button.addEventListener('click',function () { applyPreset(button.getAttribute('data-preset')); }); });
  tabs.forEach(function (name,index) { $('tab' + name).addEventListener('click',function () { activateStep(index); }); });
  $('proPrev').addEventListener('click',function () { activateStep(activeStep-1); });
  $('proNext').addEventListener('click',function () { activateStep(activeStep+1); });
  $('resetBtn').addEventListener('click',function () { applyPreset('family'); $('proSettings').open = false; activateStep(0); });

  activateStep(0);
  applyPreset('family');
})();
