(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("daysForm");
  const resetBtn = $("resetBtn");
  const msPerDay = 86400000;
  const int = (value) => new Intl.NumberFormat("cs-CZ").format(Number.isFinite(value) ? value : 0);
  const dec = (value) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0);
  const dateValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const parse = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmt = (date) => new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const diffDays = (a, b) =>
    Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / msPerDay);

  function calendarDiff(start, end) {
    const sign = end >= start ? 1 : -1;
    const a = sign === 1 ? start : end;
    const b = sign === 1 ? end : start;
    let years = b.getFullYear() - a.getFullYear();
    let months = b.getMonth() - a.getMonth();
    let days = b.getDate() - a.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  }

  function setDefaults() {
    const today = new Date();
    const future = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
    $("startDate").value = dateValue(today);
    $("targetDate").value = dateValue(future);
  }

  function render() {
    const start = parse($("startDate").value);
    const target = parse($("targetDate").value);
    const diff = diffDays(start, target);
    const abs = Math.abs(diff);
    const weeks = Math.floor(abs / 7);
    const remaining = abs % 7;
    const monthsApprox = abs / 30.44;
    const calendar = calendarDiff(start, target);
    const status = diff > 0 ? "Datum teprve přijde" : diff < 0 ? "Datum už proběhlo" : "Stejný den";
    $("daysResult").textContent = `${int(abs)} dní`;
    $("statusResult").textContent = status;
    $("weeksResult").textContent = `${int(weeks)} týdnů ${int(remaining)} dní`;
    $("monthsResult").textContent = dec(monthsApprox);
    $("resultBadge").textContent = status;
    $("startDateResult").textContent = fmt(start);
    $("targetDateResult").textContent = fmt(target);
    $("directionResult").textContent = diff > 0 ? "do budoucna" : diff < 0 ? "do minulosti" : "bez rozdílu";
    $("calendarMonthsResult").textContent = `${calendar.years * 12 + calendar.months} měs.`;
    $("yearsResult").textContent = `${calendar.years} let`;
    $("resultNote").textContent = `Mezi daty je ${int(abs)} kalendářních dní.`;
    $("timingStatus").textContent = status;
    $("timingText").textContent =
      diff > 0
        ? `Do cílového data zbývá ${int(abs)} dní.`
        : diff < 0
          ? `Od cílového data uplynulo ${int(abs)} dní.`
          : "Obě data jsou stejná.";
    $("decisionSummary").textContent =
      "Pokud jde o termín práce, dovolenou nebo dodání, ověřte kromě kalendářních dnů také pracovní dny.";
    $("nextActionText").textContent =
      "Kalendářní rozdíl zahrnuje víkendy i svátky. Pro plánování kapacity použijte kalkulačku pracovních dnů.";
    $("summaryTableBody").innerHTML = [
      ["Počáteční datum", fmt(start), "začátek"],
      ["Cílové datum", fmt(target), "konec"],
      ["Kalendářní dny", `${int(abs)} dní`, "absolutní rozdíl"],
      ["Týdny", `${int(weeks)} týdnů ${int(remaining)} dní`, "přepočet"],
      ["Přibližné měsíce", dec(monthsApprox), "orientačně"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ["startDate", "targetDate", "calculationMode"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  resetBtn.addEventListener("click", () => {
    setDefaults();
    render();
  });
  setDefaults();
  render();
})();
