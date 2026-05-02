(function () {
  const form = document.getElementById("severanceForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });

  function unit(value, one, few, many) {
    const absolute = Math.abs(value);
    if (Number.isInteger(absolute) && absolute === 1) return one;
    if (Number.isInteger(absolute) && absolute >= 2 && absolute <= 4) return few;
    if (Number.isInteger(absolute)) return many;
    return few;
  }

  function months(value) {
    return `${nf.format(value)} ${unit(value, "měsíc", "měsíce", "měsíců")}`;
  }

  function lengthLabel(value) {
    if (value === "under1") return "Méně než 1 rok";
    if (value === "1to2") return "Alespoň 1 rok a méně než 2 roky";
    return "Alespoň 2 roky";
  }

  function reasonLabel(value) {
    if (value === "organizational") return "Organizační důvody";
    if (value === "health") return "Zdravotní důvody";
    return "Jiný důvod / bez orientačního nároku";
  }

  function baseMultiplier(length, reason) {
    if (reason === "other") return 0;
    if (reason === "health") return 12;
    if (length === "under1") return 1;
    if (length === "1to2") return 2;
    return 3;
  }

  function values() {
    return {
      averageSalary: Number($("averageSalary").value) || 0,
      employmentLength: $("employmentLength").value,
      terminationReason: $("terminationReason").value,
      extraMonths: Number($("extraMonths").value) || 0,
      taxEstimate: Number($("taxEstimate").value) || 0,
      noticeMonths: Number($("noticeMonths").value) || 0
    };
  }

  function calculate(input) {
    const base = baseMultiplier(input.employmentLength, input.terminationReason);
    const totalMultiplier = base + input.extraMonths;
    const baseSeverance = input.averageSalary * base;
    const severanceTotal = input.averageSalary * totalMultiplier;
    const netEstimate = severanceTotal * (1 - input.taxEstimate / 100);
    const coverageMonths = totalMultiplier + input.noticeMonths;
    return { base, totalMultiplier, baseSeverance, severanceTotal, netEstimate, coverageMonths };
  }

  function renderTable(input, result) {
    $("summaryTableBody").innerHTML = [
      ["Průměrný výdělek", money(input.averageSalary), "Výchozí měsíční základ"],
      ["Základní násobek", `${result.base}×`, reasonLabel(input.terminationReason)],
      ["Dodatečné odstupné", months(input.extraMonths), "Volitelné navýšení dohodou"],
      ["Odstupné celkem", money(result.severanceTotal), `${nf.format(result.totalMultiplier)}× průměrného výdělku`],
      ["Období krytí", months(result.coverageMonths), "Odstupné plus výpovědní doba"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    $("severanceTotal").textContent = money(result.severanceTotal);
    $("multiplierOutput").textContent = `${nf.format(result.totalMultiplier)}×`;
    $("baseSeverance").textContent = money(result.baseSeverance);
    $("netEstimate").textContent = money(result.netEstimate);
    $("summarySalary").textContent = money(input.averageSalary);
    $("summaryReason").textContent = reasonLabel(input.terminationReason);
    $("summaryLength").textContent = lengthLabel(input.employmentLength);
    $("summaryExtra").textContent = months(input.extraMonths);
    $("coverageOutput").textContent = months(result.coverageMonths);
    $("statusBadge").className = result.severanceTotal > 0 ? "badge success" : "badge warning";
    $("statusBadge").textContent = result.severanceTotal > 0 ? "Orientační odstupné vychází kladně" : "Podle zadaného scénáře nevychází orientační odstupné";
    $("resultNote").textContent = result.severanceTotal > 0 ? `Při průměrném výdělku ${money(input.averageSalary)} a násobku ${nf.format(result.totalMultiplier)}× vychází odstupné ${money(result.severanceTotal)}.` : "Pro zadaný důvod ukončení kalkulačka nepočítá orientační zákonné odstupné.";
    $("heroSeverance").textContent = money(result.severanceTotal);
    $("heroMultiplier").textContent = `${nf.format(result.totalMultiplier)}×`;
    $("heroCoverage").textContent = months(result.coverageMonths);
    $("heroBase").textContent = money(result.baseSeverance);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.totalMultiplier / 12 * 100))}%`;
    renderTable(input, result);
  }

  function run() {
    render(values(), calculate(values()));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["averageSalary", "employmentLength", "terminationReason", "extraMonths", "taxEstimate", "noticeMonths"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("averageSalary").value = 42000;
    $("employmentLength").value = "1to2";
    $("terminationReason").value = "organizational";
    $("extraMonths").value = 0;
    $("taxEstimate").value = 0;
    $("noticeMonths").value = 2;
    run();
  });

  run();
})();
