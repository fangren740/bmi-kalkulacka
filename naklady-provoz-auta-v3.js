(function () {
  'use strict';

  var form = document.getElementById('carCostForm');
  if (!form) return;

  var ids = ['driveType','annualKm','consumption','energyPrice','runningBundleMonthly','valueLossMonthly','useDetailedRunning','insuranceAnnual','serviceAnnual','tiresAnnual','parkingMonthly','roadFeesAnnual','careMonthly','otherMonthly','deriveValueLoss','purchasePrice','resaleValue','ownershipYears','oneOffCosts','financeCostMonthly','householdIncome'];
  var inputs = {};
  ids.forEach(function (id) { inputs[id] = document.getElementById(id); });

  var driveDefaults = {
    petrol: { consumption: 6.8, price: 38.5, name: 'benzín', consumptionUnit: 'l/100 km', priceUnit: 'Kč/l', priceLabel: 'Cena benzínu' },
    diesel: { consumption: 5.4, price: 37.5, name: 'diesel', consumptionUnit: 'l/100 km', priceUnit: 'Kč/l', priceLabel: 'Cena nafty' },
    ev: { consumption: 18.5, price: 7.5, name: 'elektro', consumptionUnit: 'kWh/100 km', priceUnit: 'Kč/kWh', priceLabel: 'Cena elektřiny' }
  };

  var presets = {
    family: { drive:'petrol', annualKm:15000, consumption:6.8, energyPrice:38.5, runningBundleMonthly:4650, valueLossMonthly:3500, insuranceAnnual:18000, serviceAnnual:14400, tiresAnnual:4800, parkingMonthly:800, roadFeesAnnual:2400, careMonthly:250, otherMonthly:300, purchasePrice:550000, resaleValue:340000, ownershipYears:5, oneOffCosts:0, financeCostMonthly:0, householdIncome:60000 },
    city: { drive:'ev', annualKm:9000, consumption:17.5, energyPrice:6.8, runningBundleMonthly:3900, valueLossMonthly:4200, insuranceAnnual:19200, serviceAnnual:8000, tiresAnnual:5200, parkingMonthly:900, roadFeesAnnual:0, careMonthly:220, otherMonthly:250, purchasePrice:720000, resaleValue:450000, ownershipYears:5, oneOffCosts:25000, financeCostMonthly:0, householdIncome:60000 },
    distance: { drive:'diesel', annualKm:30000, consumption:5.5, energyPrice:37.5, runningBundleMonthly:5200, valueLossMonthly:4600, insuranceAnnual:20400, serviceAnnual:21000, tiresAnnual:7200, parkingMonthly:700, roadFeesAnnual:2400, careMonthly:300, otherMonthly:400, purchasePrice:680000, resaleValue:350000, ownershipYears:5, oneOffCosts:0, financeCostMonthly:0, householdIncome:65000 }
  };

  var proOrder = ['running','value','budget'];
  var proCopy = {
    running: ['Položkový provoz','Měsíční souhrn můžete nahradit skutečnými ročními a měsíčními položkami.'],
    value: ['Ztráta hodnoty','Rozdíl mezi koupí a budoucím prodejem rozpočítejte na celé plánované vlastnictví.'],
    budget: ['Finance a domácnost','Přidejte pouze cenu financování a orientačně zkontrolujte podíl auta na příjmu.']
  };
  var activePro = 'running';
  var lastResult = null;

  function numberValue(id) {
    var value = Number(inputs[id] && inputs[id].value);
    return Number.isFinite(value) ? value : 0;
  }

  function money(value) { return Math.round(value).toLocaleString('cs-CZ') + ' Kč'; }
  function decimal(value, digits) { return Number(value).toLocaleString('cs-CZ', { minimumFractionDigits:digits, maximumFractionDigits:digits }); }
  function setText(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }
  function setWidth(id, value) { var node = document.getElementById(id); if (node) node.style.width = Math.max(0, Math.min(100, value)) + '%'; }

  function selectDrive(key, replaceValues) {
    var config = driveDefaults[key];
    if (!config) return;
    inputs.driveType.value = key;
    if (replaceValues) {
      inputs.consumption.value = config.consumption;
      inputs.energyPrice.value = config.price;
    }
    document.querySelectorAll('[data-drive]').forEach(function (button) {
      var active = button.getAttribute('data-drive') === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    setText('consumptionUnit', config.consumptionUnit);
    setText('energyPriceUnit', config.priceUnit);
    setText('energyPriceLabel', config.priceLabel);
  }

  function selectPro(key, moveFocus) {
    if (proOrder.indexOf(key) === -1) return;
    activePro = key;
    var index = proOrder.indexOf(key);
    document.querySelectorAll('[data-pro-tab]').forEach(function (button) {
      var selected = button.getAttribute('data-pro-tab') === key;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) button.focus();
    });
    document.querySelectorAll('[data-pro-panel]').forEach(function (panel) { panel.hidden = panel.getAttribute('data-pro-panel') !== key; });
    setText('proStepLabel', 'KROK ' + (index + 1) + ' ZE 3');
    setText('proStepTitle', proCopy[key][0]);
    setText('proStepText', proCopy[key][1]);
    setText('proStepCount', (index + 1) + ' / 3');
    var previous = document.getElementById('proPrev');
    var next = document.getElementById('proNext');
    previous.disabled = index === 0;
    next.disabled = index === proOrder.length - 1;
    next.textContent = index === proOrder.length - 1 ? 'Vše nastaveno ✓' : 'Další část →';
  }

  function detailedRunningAnnual() {
    return numberValue('insuranceAnnual') + numberValue('serviceAnnual') + numberValue('tiresAnnual') + numberValue('roadFeesAnnual') + 12 * (numberValue('parkingMonthly') + numberValue('careMonthly') + numberValue('otherMonthly'));
  }

  function updateDerivedInputs() {
    if (inputs.useDetailedRunning.checked) inputs.runningBundleMonthly.value = Math.round(detailedRunningAnnual() / 12);
    if (inputs.deriveValueLoss.checked) {
      var months = Math.max(1, numberValue('ownershipYears') * 12);
      var value = (numberValue('purchasePrice') - numberValue('resaleValue') + numberValue('oneOffCosts')) / months;
      inputs.valueLossMonthly.value = Math.max(0, Math.round(value));
    }
    inputs.runningBundleMonthly.readOnly = inputs.useDetailedRunning.checked;
    inputs.valueLossMonthly.readOnly = inputs.deriveValueLoss.checked;
  }

  function validate() {
    var issues = [];
    if (numberValue('annualKm') < 500 || numberValue('annualKm') > 100000) issues.push('Roční nájezd musí být mezi 500 a 100 000 km.');
    if (numberValue('consumption') <= 0 || numberValue('consumption') > 100) issues.push('Spotřeba musí být vyšší než nula a v realistickém rozsahu.');
    if (numberValue('energyPrice') <= 0) issues.push('Cena energie musí být vyšší než nula.');
    if (numberValue('runningBundleMonthly') < 0 || numberValue('valueLossMonthly') < 0 || numberValue('financeCostMonthly') < 0) issues.push('Nákladové položky nemohou být záporné.');
    if (inputs.deriveValueLoss.checked) {
      if (numberValue('ownershipYears') < 1 || numberValue('ownershipYears') > 15) issues.push('Doba vlastnictví musí být mezi 1 a 15 lety.');
      if (numberValue('purchasePrice') <= 0 || numberValue('resaleValue') > numberValue('purchasePrice') + numberValue('oneOffCosts')) issues.push('Zkontrolujte pořizovací a prodejní cenu auta.');
    }
    var message = document.getElementById('formError');
    message.hidden = !issues.length;
    message.textContent = issues[0] || '';
    return issues.length === 0;
  }

  function model() {
    var annualKm = numberValue('annualKm');
    var energyAnnual = annualKm * numberValue('consumption') * numberValue('energyPrice') / 100;
    var runningAnnual = numberValue('runningBundleMonthly') * 12;
    var valueAnnual = numberValue('valueLossMonthly') * 12;
    var financeAnnual = numberValue('financeCostMonthly') * 12;
    var operatingAnnual = energyAnnual + runningAnnual;
    var fullAnnual = operatingAnnual + valueAnnual + financeAnnual;
    var householdIncome = numberValue('householdIncome');
    return {
      drive:inputs.driveType.value, annualKm:annualKm, energyAnnual:energyAnnual, runningAnnual:runningAnnual,
      valueAnnual:valueAnnual, financeAnnual:financeAnnual, operatingAnnual:operatingAnnual, fullAnnual:fullAnnual,
      operatingMonthly:operatingAnnual/12, fullMonthly:fullAnnual/12, perKm:fullAnnual/annualKm,
      incomeShare:householdIncome > 0 ? fullAnnual/12/householdIncome*100 : null
    };
  }

  function layerRows(result) {
    return [
      { name:'Energie', monthly:result.energyAnnual/12, annual:result.energyAnnual, meaning:'spotřeba × cena × roční nájezd' },
      { name:'Běžný provoz', monthly:result.runningAnnual/12, annual:result.runningAnnual, meaning:'pojištění, servis, pneumatiky a další' },
      { name:'Ztráta hodnoty', monthly:result.valueAnnual/12, annual:result.valueAnnual, meaning:'ekonomický pokles ceny vozu' },
      { name:'Cena financování', monthly:result.financeAnnual/12, annual:result.financeAnnual, meaning:'úroky a poplatky, nikoli jistina' }
    ];
  }

  function render(result) {
    lastResult = result;
    var config = driveDefaults[result.drive];
    var rows = layerRows(result);
    var largest = rows.slice().sort(function (a,b) { return b.annual-a.annual; })[0];
    var fullNoValue = result.fullAnnual - result.valueAnnual;
    var shareEnergy = result.fullAnnual ? result.energyAnnual/result.fullAnnual*100 : 0;
    var shareRunning = result.fullAnnual ? result.runningAnnual/result.fullAnnual*100 : 0;
    var shareValue = result.fullAnnual ? result.valueAnnual/result.fullAnnual*100 : 0;

    setText('fullMonthly', money(result.fullMonthly));
    setText('cashMonthly', money(result.operatingMonthly));
    setText('fullAnnual', money(result.fullAnnual));
    setText('fullPerKm', decimal(result.perKm,2) + ' Kč/km');
    setText('driveSummary', config.name + ' · ' + Math.round(result.annualKm).toLocaleString('cs-CZ') + ' km/rok');
    setText('resultStatus', result.incomeShare === null ? 'modelový průměr' : decimal(result.incomeShare,1) + ' % příjmu');
    setText('incomeShare', result.incomeShare === null ? '—' : decimal(result.incomeShare,1) + ' %');
    setText('incomeShareText', result.incomeShare === null ? 'doplňte čistý příjem' : 'orientační podíl plného nákladu');
    setText('energyMonthly', money(result.energyAnnual/12));
    setText('runningMonthly', money(result.runningAnnual/12));
    setText('valueMonthlyResult', money(result.valueAnnual/12));
    setText('energyShare', decimal(shareEnergy,0) + ' %');
    setText('runningShare', decimal(shareRunning,0) + ' %');
    setText('valueShare', decimal(shareValue,0) + ' %');
    setWidth('energyBar',shareEnergy); setWidth('runningBar',shareRunning); setWidth('valueBar',shareValue);
    setText('heroFullMonthly',money(result.fullMonthly)); setText('heroCashMonthly',money(result.operatingMonthly)); setText('heroAnnual',money(result.fullAnnual)); setText('heroPerKm',decimal(result.perKm,2)+' Kč');
    setWidth('heroEnergyBar',shareEnergy); setWidth('heroRunningBar',shareRunning); setWidth('heroValueBar',shareValue);

    var reading = largest.name === 'Ztráta hodnoty' ? ['Největší vrstvou je ztráta hodnoty','Zpřesněte budoucí prodejní cenu a dobu vlastnictví. Malá změna odhadu může převážit roky úspor paliva.'] : largest.name === 'Energie' ? ['Největší vrstvou je energie','Ověřte reálnou spotřebu, roční nájezd a dlouhodobou cenu paliva nebo nabíjení.'] : largest.name === 'Běžný provoz' ? ['Největší vrstvou je běžný provoz','Rozdělte měsíční souhrn v PRO režimu a prověřte hlavně pojištění, servisní rezervu a pneumatiky.'] : ['Rozpočet výrazně ovlivňuje financování','Zkontrolujte, že zadáváte jen úrok a poplatky, nikoli celou splátku současně se ztrátou hodnoty.'];
    setText('readingTitle',reading[0]); setText('readingText',reading[1]);
    setText('detailHeadline',largest.name + ' tvoří největší část modelu');
    setText('detailText','Její průměr je ' + money(largest.monthly) + ' měsíčně. Zpřesnění této vrstvy má větší význam než drobné zaokrouhlení ostatních položek.');
    setText('largestLayer',largest.name + ' · ' + money(largest.annual));
    setText('cashAnnual',money(fullNoValue)); setText('cashGap',money(result.valueAnnual)); setText('detailAdvice',reading[1]);

    var body = document.getElementById('costTableBody');
    body.replaceChildren();
    rows.forEach(function (row) {
      var tr=document.createElement('tr');
      [row.name,money(row.monthly),money(row.annual),row.meaning].forEach(function (text) { var td=document.createElement('td'); td.textContent=text; tr.appendChild(td); });
      body.appendChild(tr);
    });

    var energyStress = result.fullAnnual/12 + result.energyAnnual/12*.15;
    var runningStress = result.fullAnnual/12 + result.runningAnnual/12*.20;
    var valueStress = result.fullAnnual/12 + result.valueAnnual/12*.20;
    var lowKmPerKm = (result.energyAnnual*.75 + result.runningAnnual + result.valueAnnual + result.financeAnnual)/(result.annualKm*.75);
    var worst = Math.max(energyStress,runningStress,valueStress);
    var difference = worst-result.fullMonthly;
    setText('stressEnergy',money(energyStress)+'/měs.'); setText('stressRunning',money(runningStress)+'/měs.'); setText('stressValue',money(valueStress)+'/měs.'); setText('stressLowKm',decimal(lowKmPerKm,2)+' Kč/km');
    setText('stressMonthly',money(worst)); setText('stressDifference','+'+money(difference)+' proti základu'); setWidth('stressBar',result.fullMonthly ? Math.min(100,difference/result.fullMonthly*350) : 0);
  }

  function calculate() {
    updateDerivedInputs();
    if (!validate()) return;
    render(model());
  }

  function applyPreset(name) {
    var preset=presets[name];
    if (!preset) return;
    Object.keys(preset).forEach(function (key) { if (key !== 'drive' && inputs[key]) inputs[key].value=preset[key]; });
    inputs.useDetailedRunning.checked=false;
    inputs.deriveValueLoss.checked=false;
    selectDrive(preset.drive,false);
    document.querySelectorAll('[data-preset]').forEach(function (button) { var active=button.getAttribute('data-preset')===name; button.classList.toggle('is-active',active); button.setAttribute('aria-pressed',active?'true':'false'); });
    calculate();
  }

  document.querySelectorAll('[data-preset]').forEach(function (button) { button.addEventListener('click',function () { applyPreset(button.getAttribute('data-preset')); }); });
  document.querySelectorAll('[data-drive]').forEach(function (button) { button.addEventListener('click',function () { selectDrive(button.getAttribute('data-drive'),true); calculate(); }); });
  document.querySelectorAll('[data-pro-tab]').forEach(function (button) {
    button.addEventListener('click',function () { selectPro(button.getAttribute('data-pro-tab'),false); });
    button.addEventListener('keydown',function (event) { var index=proOrder.indexOf(activePro); if(event.key==='ArrowRight') index=(index+1)%proOrder.length; else if(event.key==='ArrowLeft') index=(index-1+proOrder.length)%proOrder.length; else return; event.preventDefault(); selectPro(proOrder[index],true); });
  });
  document.getElementById('proPrev').addEventListener('click',function () { var index=proOrder.indexOf(activePro); if(index>0) selectPro(proOrder[index-1],true); });
  document.getElementById('proNext').addEventListener('click',function () { var index=proOrder.indexOf(activePro); if(index<proOrder.length-1) selectPro(proOrder[index+1],true); });
  form.addEventListener('input',calculate); form.addEventListener('change',calculate); form.addEventListener('submit',function (event) { event.preventDefault(); calculate(); });
  document.getElementById('resetBtn').addEventListener('click',function () { applyPreset('family'); });
  document.getElementById('proSettings').addEventListener('toggle',function () { setText('modeBadge',this.open?'PRO režim':'BASIC režim'); });
  document.getElementById('copyResult').addEventListener('click',function () { if(!lastResult) return; var text='Náklady auta: '+money(lastResult.fullMonthly)+'/měs., '+money(lastResult.fullAnnual)+'/rok a '+decimal(lastResult.perKm,2)+' Kč/km. Orientační model RychléVýpočty.cz.'; var button=this; if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { button.textContent='Zkopírováno'; setTimeout(function () { button.textContent='Kopírovat výsledek'; },1800); }); });

  selectPro('running',false);
  applyPreset('family');
}());
