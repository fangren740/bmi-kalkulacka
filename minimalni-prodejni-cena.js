(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("pricingForm");
  if (!form) return;

  const fieldIds = [
    "materialCosts", "laborCosts", "packagingCosts", "overheadCosts", "otherCosts",
    "commissionPercent", "paymentPercent", "riskPercent", "targetMargin", "vatRate",
    "priceMode", "roundingMode", "currentPrice"
  ];
  const money = (value) => new Intl.NumberFormat("cs-CZ", {
    style: "currency", currency: "CZK", minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
  const percent = (value, digits = 1) => `${new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0)} %`;

  const presets = {
    eshop: {
      materialCosts: 350, laborCosts: 50, packagingCosts: 35, overheadCosts: 40, otherCosts: 10,
      commissionPercent: 0, paymentPercent: 1.5, riskPercent: 3, targetMargin: 25,
      vatRate: 21, currentPrice: 699, priceMode: "margin", roundingMode: "1"
    },
    marketplace: {
      materialCosts: 350, laborCosts: 100, packagingCosts: 35, overheadCosts: 40, otherCosts: 0,
      commissionPercent: 12, paymentPercent: 1.5, riskPercent: 2, targetMargin: 20,
      vatRate: 21, currentPrice: 699, priceMode: "margin", roundingMode: "1"
    },
    service: {
      materialCosts: 0, laborCosts: 1200, packagingCosts: 0, overheadCosts: 300, otherCosts: 0,
      commissionPercent: 0, paymentPercent: 0, riskPercent: 5, targetMargin: 30,
      vatRate: 21, currentPrice: 2200, priceMode: "margin", roundingMode: "10"
    },
    handmade: {
      materialCosts: 220, laborCosts: 300, packagingCosts: 35, overheadCosts: 70, otherCosts: 0,
      commissionPercent: 8, paymentPercent: 1.5, riskPercent: 5, targetMargin: 25,
      vatRate: 21, currentPrice: 999, priceMode: "margin", roundingMode: "1"
    }
  };

  function numberValue(id) {
    const value = Number($(id).value);
    return Number.isFinite(value) ? value : NaN;
  }

  function readValues() {
    return {
      materialCosts: numberValue("materialCosts"),
      laborCosts: numberValue("laborCosts"),
      packagingCosts: numberValue("packagingCosts"),
      overheadCosts: numberValue("overheadCosts"),
      otherCosts: numberValue("otherCosts"),
      commissionPercent: numberValue("commissionPercent"),
      paymentPercent: numberValue("paymentPercent"),
      riskPercent: numberValue("riskPercent"),
      targetMargin: numberValue("targetMargin"),
      vatRate: numberValue("vatRate"),
      currentPrice: numberValue("currentPrice"),
      priceMode: $("priceMode").value,
      roundingMode: $("roundingMode").value
    };
  }

  function validate(v) {
    const values = [
      v.materialCosts, v.laborCosts, v.packagingCosts, v.overheadCosts, v.otherCosts,
      v.commissionPercent, v.paymentPercent, v.riskPercent, v.targetMargin, v.vatRate, v.currentPrice
    ];
    if (values.some((value) => !Number.isFinite(value))) return "Doplňte všechna pole platnými čísly.";
    if (values.some((value) => value < 0)) return "Náklady, sazby ani cena nemohou být záporné.";
    if ([v.commissionPercent, v.paymentPercent, v.riskPercent, v.targetMargin].some((value) => value >= 100)) {
      return "Jednotlivé procentní sazby musí být nižší než 100 %.";
    }
    if (v.vatRate > 100) return "Sazba DPH nemůže být vyšší než 100 %.";
    const totalCosts = v.materialCosts + v.laborCosts + v.packagingCosts + v.overheadCosts + v.otherCosts;
    if (totalCosts <= 0) return "Zadejte alespoň jeden náklad vyšší než nula.";
    const margin = v.priceMode === "margin" ? v.targetMargin : 0;
    const totalRate = v.commissionPercent + v.paymentPercent + v.riskPercent + margin;
    if (totalRate >= 100) {
      return `Součet provize, poplatků, rezervy a marže je ${percent(totalRate)}. Musí zůstat část ceny na pokrytí nákladů.`;
    }
    return "";
  }

  function roundUp(value, mode) {
    if (mode === "exact") return value;
    if (mode === "99") return Math.ceil((value + 1) / 100) * 100 - 1;
    const step = Math.max(1, Number(mode) || 1);
    return Math.ceil((value - 1e-9) / step) * step;
  }

  function calculate(v) {
    const totalCosts = v.materialCosts + v.laborCosts + v.packagingCosts + v.overheadCosts + v.otherCosts;
    const commissionRate = v.commissionPercent / 100;
    const paymentRate = v.paymentPercent / 100;
    const riskRate = v.riskPercent / 100;
    const marginRate = v.priceMode === "margin" ? v.targetMargin / 100 : 0;
    const feeRate = commissionRate + paymentRate + riskRate;
    const totalRate = feeRate + marginRate;
    const minPriceNet = totalCosts / (1 - totalRate);
    const recommendedPrice = roundUp(minPriceNet, v.roundingMode);
    const minPriceGross = recommendedPrice * (1 + v.vatRate / 100);
    const commissionAmount = minPriceNet * commissionRate;
    const paymentAmount = minPriceNet * paymentRate;
    const riskAmount = minPriceNet * riskRate;
    const marginAmount = minPriceNet * marginRate;
    const vatAmount = minPriceGross - recommendedPrice;
    const markupPercent = totalCosts > 0 ? ((minPriceNet - totalCosts) / totalCosts) * 100 : 0;
    const costShare = (totalCosts / minPriceNet) * 100;
    const feeShare = feeRate * 100;
    const marginShare = marginRate * 100;
    const currentFees = v.currentPrice * feeRate;
    const currentProfit = v.currentPrice - totalCosts - currentFees;
    const actualMargin = v.currentPrice > 0 ? (currentProfit / v.currentPrice) * 100 : NaN;
    const priceDifference = v.currentPrice > 0 ? v.currentPrice - minPriceNet : NaN;
    const maxDiscount = v.currentPrice >= minPriceNet && v.currentPrice > 0
      ? ((v.currentPrice - minPriceNet) / v.currentPrice) * 100
      : NaN;
    const requiredIncrease = v.currentPrice > 0 && v.currentPrice < minPriceNet
      ? ((minPriceNet - v.currentPrice) / v.currentPrice) * 100
      : 0;
    return {
      totalCosts, commissionRate, paymentRate, riskRate, marginRate, feeRate, totalRate,
      minPriceNet, recommendedPrice, minPriceGross, commissionAmount, paymentAmount,
      riskAmount, marginAmount, vatAmount, markupPercent, costShare, feeShare, marginShare,
      currentProfit, actualMargin, priceDifference, maxDiscount, requiredIncrease
    };
  }

  function setBar(id, value) {
    $(id).style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  function setError(message, v) {
    $("pricingError").hidden = false;
    $("pricingError").textContent = message;
    $("statusBadge").textContent = "Výpočet nelze dokončit";
    $("statusBadge").className = "min-price-status is-danger";
    ["minPriceNet", "recommendedPrice", "minPriceGross", "marginAmount", "markupPercent"].forEach((id) => {
      $(id).textContent = "—";
    });
    $("maxDiscount").textContent = "—";
    $("priceDifference").textContent = "—";
    $("decisionKicker").textContent = "Zkontrolujte zadání";
    $("decisionHeadline").textContent = "Procenta nenechávají prostor pro náklady";
    $("decisionText").textContent = message;
    $("nextStepText").textContent = "Snižte některou sazbu nebo doplňte platné jednotkové náklady.";
    $("summaryTableBody").innerHTML = `<tr><td colspan="3">${message}</td></tr>`;
    $("inputCostPreview").textContent = Number.isFinite(v.materialCosts)
      ? money([v.materialCosts, v.laborCosts, v.packagingCosts, v.overheadCosts, v.otherCosts]
        .filter(Number.isFinite).reduce((sum, value) => sum + value, 0))
      : "—";
    $("heroMinPrice").textContent = "—";
    $("heroStatus").textContent = "Zkontrolujte vstupní hodnoty";
    setBar("costBar", 0); setBar("feeBar", 0); setBar("marginBar", 0);
    setBar("heroCostBar", 0); setBar("heroFeeBar", 0); setBar("heroMarginBar", 0);
  }

  function decision(v, r) {
    if (v.currentPrice <= 0) {
      return {
        tone: "neutral",
        kicker: "Minimum bez porovnání",
        headline: "Ekonomická hranice je připravená",
        text: `Pro zadaný model potřebujete nejméně ${money(r.minPriceNet)} bez DPH. Současnou cenu jste nezadali, proto nehodnotíme rezervu ani slevu.`,
        next: "Porovnejte minimum s tržní cenou a hodnotou, kterou nabídka přináší zákazníkovi."
      };
    }
    if (v.currentPrice < r.minPriceNet) {
      return {
        tone: "danger",
        kicker: "Cena pod minimem",
        headline: "Současná cena nesplňuje zadaný cíl",
        text: `Chybí ${money(Math.abs(r.priceDifference))}. Pro dosažení minima by se cena musela zvýšit přibližně o ${percent(r.requiredIncrease)}.`,
        next: "Zvyšte cenu, snižte náklady či poplatky, nebo upravte cílovou marži."
      };
    }
    if (r.maxDiscount < 5) {
      return {
        tone: "warning",
        kicker: "Těsná rezerva",
        headline: "Cena je nad minimem, ale prostor je malý",
        text: `Do minimální hranice zbývá jen ${money(r.priceDifference)}, tedy přibližně ${percent(r.maxDiscount)} současné ceny.`,
        next: "Před slevou nebo růstem nákladů přepočítejte scénář znovu."
      };
    }
    return {
      tone: "success",
      kicker: "Cena nad minimem",
      headline: "Současná cena má použitelnou rezervu",
      text: `Cena je o ${money(r.priceDifference)} nad minimem. Teoretický prostor k minimální hranici je ${percent(r.maxDiscount)}.`,
      next: "Ověřte ještě bod zvratu a to, zda cena odpovídá hodnotě nabídky a trhu."
    };
  }

  function render() {
    const v = readValues();
    const marginMode = v.priceMode === "margin";
    $("targetMarginField").hidden = !marginMode;
    $("targetMargin").disabled = !marginMode;
    const error = validate(v);
    if (error) {
      setError(error, v);
      return;
    }
    $("pricingError").hidden = true;
    const r = calculate(v);
    const d = decision(v, r);
    $("inputCostPreview").textContent = money(r.totalCosts);
    $("minPriceNet").textContent = money(r.minPriceNet);
    $("recommendedPrice").textContent = money(r.recommendedPrice);
    $("minPriceGross").textContent = money(r.minPriceGross);
    $("marginAmount").textContent = money(r.marginAmount);
    $("markupPercent").textContent = percent(r.markupPercent);
    $("maxDiscount").textContent = Number.isFinite(r.maxDiscount) ? percent(r.maxDiscount) : "—";
    $("priceDifference").textContent = Number.isFinite(r.priceDifference) ? money(r.priceDifference) : "—";
    $("totalCosts").textContent = money(r.totalCosts);
    $("commissionAmount").textContent = money(r.commissionAmount);
    $("paymentAmount").textContent = money(r.paymentAmount);
    $("riskAmount").textContent = money(r.riskAmount);
    $("vatAmount").textContent = money(r.vatAmount);
    $("actualMarginResult").textContent = Number.isFinite(r.actualMargin) ? percent(r.actualMargin) : "—";
    $("rateLoad").textContent = `${percent(r.totalRate * 100)} z ceny`;
    $("statusBadge").textContent = d.kicker;
    $("statusBadge").className = `min-price-status${d.tone === "success" ? "" : ` is-${d.tone}`}`;
    $("decisionKicker").textContent = d.kicker;
    $("decisionHeadline").textContent = d.headline;
    $("decisionText").textContent = d.text;
    $("nextStepText").textContent = d.next;
    $("minPriceFormulaNote").textContent = v.priceMode === "margin"
      ? `Zahrnuje cílovou marži ${percent(v.targetMargin)}`
      : "Bod zvratu bez cílové marže";
    setBar("costBar", r.costShare); setBar("feeBar", r.feeShare); setBar("marginBar", r.marginShare);
    setBar("heroCostBar", r.costShare); setBar("heroFeeBar", r.feeShare); setBar("heroMarginBar", r.marginShare);
    $("heroMinPrice").textContent = money(r.minPriceNet);
    $("heroCosts").textContent = money(r.totalCosts);
    $("heroProfit").textContent = money(r.marginAmount);
    $("heroGross").textContent = money(r.minPriceGross);
    $("heroStatus").textContent = d.headline;
    const rows = [
      ["Jednotkové náklady", r.totalCosts, r.costShare],
      ["Provize", r.commissionAmount, v.commissionPercent],
      ["Platební poplatek", r.paymentAmount, v.paymentPercent],
      ["Rezerva", r.riskAmount, v.riskPercent],
      ["Cílový zisk", r.marginAmount, r.marginShare]
    ];
    $("summaryTableBody").innerHTML = rows.map(([label, amount, share]) =>
      `<tr><td>${label}</td><td>${money(amount)}</td><td>${percent(share)}</td></tr>`
    ).join("");
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([id, value]) => { $(id).value = value; });
    document.querySelectorAll("[data-pricing-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.pricingPreset === name));
    });
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    if (window.matchMedia("(max-width: 680px)").matches) {
      $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  fieldIds.forEach((id) => {
    $(id).addEventListener("input", () => {
      document.querySelectorAll("[data-pricing-preset]").forEach((button) => button.setAttribute("aria-pressed", "false"));
      render();
    });
    $(id).addEventListener("change", render);
  });
  document.querySelectorAll("[data-pricing-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.pricingPreset));
  });
  $("resetBtn").addEventListener("click", () => {
    form.reset();
    document.querySelectorAll("[data-pricing-preset]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    render();
  });
  render();
})();
