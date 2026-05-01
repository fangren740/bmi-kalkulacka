(function () {
  function el(id) {
    return document.getElementById(id);
  }

  function read(id) {
    var node = el(id);
    if (!node) return 0;
    if (node.tagName === "SELECT") return node.value;
    var raw = String(node.value || "").replace(/\s/g, "").replace(",", ".");
    var value = Number(raw);
    return isFinite(value) ? value : 0;
  }

  function write(id, value) {
    var node = el(id);
    if (node) node.textContent = value;
  }

  function setValue(id, value) {
    var node = el(id);
    if (!node) return;
    node.value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function num(value, digits) {
    return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits == null ? 0 : digits }).format(isFinite(value) ? value : 0);
  }

  function money(value) {
    return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(isFinite(value) ? value : 0);
  }

  function bind(ids, render) {
    for (var i = 0; i < ids.length; i += 1) {
      var node = el(ids[i]);
      if (node) {
        node.addEventListener("input", render);
        node.addEventListener("change", render);
      }
    }
    render();
  }

  function renderHeatCompare() {
    if (!el("annualHeatNeed") || !el("bestOption")) return;
    var need = Math.max(1, Number(read("annualHeatNeed")) || 0);
    var electricity = Math.max(0, Number(read("electricityPrice")) || 0);
    var gas = Math.max(0, Number(read("gasPrice")) || 0);
    var wood = Math.max(0, Number(read("woodPrice")) || 0);
    var pellets = Math.max(0, Number(read("pelletsPrice")) || 0);
    var hpPrice = Math.max(0, Number(read("heatPumpElectricityPrice")) || 0);
    var cop = Math.max(1.1, Number(read("cop")) || 1.1);
    var showCount = Math.max(3, Math.min(5, Number(read("showCount")) || 5));
    var variants = [
      { name: "Elektřina", cost: need * electricity, per: electricity },
      { name: "Plyn", cost: need * gas, per: gas },
      { name: "Dřevo", cost: need * wood, per: wood },
      { name: "Pelety", cost: need * pellets, per: pellets },
      { name: "Tepelné čerpadlo", cost: need / cop * hpPrice, per: hpPrice / cop }
    ].sort(function (a, b) { return a.cost - b.cost; });
    var best = variants[0];
    var worst = variants[variants.length - 1];
    var diff = worst.cost - best.cost;
    write("bestOption", best.name);
    write("bestAnnualCost", money(best.cost));
    write("worstOption", worst.name);
    write("costDifference", money(diff));
    write("comparisonBadge", diff > 50000 ? "Velký rozdíl" : diff > 15000 ? "Citelný rozdíl" : "Menší rozdíl");
    write("summaryNeed", num(need, 0) + " kWh");
    write("summaryBestPerKwh", num(best.per, 2) + " Kč");
    write("summarySaving", money(diff));
    write("summaryMonthlyDifference", money(diff / 12));
    write("summaryCop", num(cop, 1));
    write("heatingVerdict", best.name + " vychází provozně nejlevněji");
    write("decisionSummary", "Nejlevnější varianta vychází na " + money(best.cost) + " ročně. Proti nejdražší variantě je rozdíl přibližně " + money(diff) + " za rok.");
    write("interpretationNote", "Do finálního rozhodnutí připočítejte pořizovací cenu, servis, životnost, komfort a vhodnost zdroje pro konkrétní dům.");
    var table = el("comparisonTableBody");
    if (table) {
      var html = "";
      for (var i = 0; i < Math.min(showCount, variants.length); i += 1) {
        var item = variants[i];
        var itemDiff = item.cost - best.cost;
        html += "<tr><td>" + (i + 1) + "</td><td>" + item.name + "</td><td>" + money(item.cost) + "</td><td>" + money(item.cost / 12) + "</td><td>" + num(item.per, 2) + " Kč</td><td>" + (itemDiff ? money(itemDiff) : "nejlevnější") + "</td></tr>";
      }
      table.innerHTML = html;
    }
  }

  function renderHeatingCost() {
    if (!el("floorArea") || !el("yearCostResult")) return;
    var heatMap = { well: 70, standard: 110, older: 165 };
    var area = Math.max(1, Number(read("floorArea")) || 0);
    var building = read("buildingType");
    var needM2 = heatMap[building] || 110;
    var price = Math.max(0, Number(read("energyPrice")) || 0);
    var efficiency = Math.max(1, Number(read("efficiency")) || 1);
    var months = Math.max(1, Math.min(12, Number(read("heatingMonths")) || 7));
    var heatNeed = area * needM2;
    var purchased = heatNeed / (efficiency / 100);
    var year = purchased * price;
    var month = year / months;
    var perM2 = year / area;
    write("yearCostResult", money(year));
    write("monthCostResult", money(month));
    write("heatNeedResult", num(heatNeed, 0) + " kWh");
    write("purchasedEnergyResult", num(purchased, 0) + " kWh");
    write("costPerM2Result", money(perM2));
    write("floorAreaResult", num(area, 0) + " m²");
    write("heatPerM2Result", num(needM2, 0) + " kWh");
    write("energyPriceResult", num(price, 2) + " Kč/kWh");
    write("efficiencyResult", num(efficiency, 0) + " %");
    write("heatingMonthsResult", num(months, 0) + " měsíců");
    write("costBadge", perM2 > 650 ? "Vysoké náklady" : perM2 > 300 ? "Běžné náklady" : "Nízké náklady");
    write("costStatus", perM2 > 650 ? "Vysoké náklady" : perM2 > 300 ? "Běžné náklady" : "Nízké náklady");
    write("costStatusText", "Roční potřeba tepla je přibližně " + num(heatNeed, 0) + " kWh. Po účinnosti zdroje je potřeba nakoupit asi " + num(purchased, 0) + " kWh energie.");
    write("decisionSummary", "Pokud náklad vychází vysoko, ověřte zateplení, regulaci a reálnou cenu energie z vyúčtování.");
    write("resultNote", "Při ceně " + num(price, 2) + " Kč/kWh vychází vytápění na " + money(year) + " ročně.");
    var table = el("summaryTableBody");
    if (table) {
      table.innerHTML =
        "<tr><td>Roční náklad</td><td>" + money(year) + "</td><td>Celkový orientační náklad za topnou sezónu.</td></tr>" +
        "<tr><td>Měsíc v sezóně</td><td>" + money(month) + "</td><td>Roční náklad rozdělený do " + num(months, 0) + " topných měsíců.</td></tr>" +
        "<tr><td>Potřeba tepla</td><td>" + num(heatNeed, 0) + " kWh</td><td>Odhad podle plochy a stavu objektu.</td></tr>" +
        "<tr><td>Nakoupená energie</td><td>" + num(purchased, 0) + " kWh</td><td>Potřeba po započtení účinnosti zdroje.</td></tr>";
    }
  }

  function renderElectricity() {
    if (!el("devicePower") || !el("periodCost")) return;
    var power = Math.max(0, Number(read("devicePower")) || 0);
    var hours = Math.max(0, Number(read("hoursPerDay")) || 0);
    var days = Math.max(1, Number(read("daysUsed")) || 30);
    var price = Math.max(0, Number(read("pricePerKwh")) || 0);
    var standby = Math.max(0, Number(read("standbyPower")) || 0);
    var daily = power / 1000 * hours + standby / 1000 * Math.max(0, 24 - hours);
    var period = daily * days;
    var monthly = daily * 30;
    var yearly = daily * 365;
    write("periodCost", money(period * price));
    write("periodConsumption", num(period, 1) + " kWh");
    write("monthlyCost", money(monthly * price));
    write("yearlyCost", money(yearly * price));
    write("dailyCost", money(daily * price));
    write("dailyConsumption", num(daily, 2) + " kWh");
    write("monthlyConsumption", num(monthly, 1) + " kWh");
    write("yearlyConsumption", num(yearly, 0) + " kWh");
    write("summaryPower", num(power, 0) + " W");
    write("statusBadge", monthly * price > 1000 ? "Vysoký měsíční dopad" : monthly * price > 250 ? "Citelná spotřeba" : "Nízká až běžná spotřeba");
    write("costStatusText", "Za zadané období spotřebič odebere přibližně " + num(period, 1) + " kWh a bude stát asi " + money(period * price) + ".");
  }

  function renderAll() {
    renderHeatCompare();
    renderHeatingCost();
    renderElectricity();
  }

  bind([
    "annualHeatNeed", "electricityPrice", "gasPrice", "woodPrice", "pelletsPrice", "heatPumpElectricityPrice", "cop", "showCount",
    "floorArea", "buildingType", "heatingSource", "energyPrice", "efficiency", "heatingMonths",
    "devicePower", "hoursPerDay", "daysUsed", "pricePerKwh", "standbyPower"
  ], renderAll);



  function setPressed(buttons, activeButton) {
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].classList.toggle("active", buttons[i] === activeButton);
      buttons[i].setAttribute("aria-pressed", buttons[i] === activeButton ? "true" : "false");
    }
  }

  function initHeatingPresets() {
    if (!el("heatingForm")) return;
    var presets = {
      "well-gas": { floorArea: 120, buildingType: "well", heatingSource: "gas", energyPrice: 1.9, efficiency: 92, heatingMonths: 7 },
      "standard-electric": { floorArea: 85, buildingType: "standard", heatingSource: "electric", energyPrice: 5.8, efficiency: 100, heatingMonths: 7 },
      "older-wood": { floorArea: 160, buildingType: "older", heatingSource: "wood", energyPrice: 1.25, efficiency: 78, heatingMonths: 8 },
      "heatpump": { floorArea: 130, buildingType: "well", heatingSource: "heatpump", energyPrice: 5.2, efficiency: 320, heatingMonths: 7 }
    };
    var sourceDefaults = {
      gas: { energyPrice: 1.9, efficiency: 92 },
      electric: { energyPrice: 5.8, efficiency: 100 },
      wood: { energyPrice: 1.25, efficiency: 78 },
      pellets: { energyPrice: 1.65, efficiency: 86 },
      heatpump: { energyPrice: 5.2, efficiency: 320 }
    };
    var buttons = Array.prototype.slice.call(document.querySelectorAll("#heatingForm [data-preset]"));
    function applyPreset(name, activeButton) {
      var preset = presets[name];
      if (!preset) return;
      Object.keys(preset).forEach(function (key) { setValue(key, preset[key]); });
      if (activeButton) setPressed(buttons, activeButton);
      renderAll();
    }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        applyPreset(button.getAttribute("data-preset"), button);
      });
    });
    var source = el("heatingSource");
    if (source) {
      source.addEventListener("change", function () {
        var defaults = sourceDefaults[source.value];
        if (!defaults) return;
        setValue("energyPrice", defaults.energyPrice);
        setValue("efficiency", defaults.efficiency);
        renderAll();
      });
    }
    var form = el("heatingForm");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      renderAll();
    });
    var reset = el("resetBtn");
    if (reset) {
      reset.addEventListener("click", function () {
        applyPreset("well-gas", buttons[0]);
      });
    }
  }

  initHeatingPresets();
  window.RV_ENERGY_FIX_LOADED = true;
})();
