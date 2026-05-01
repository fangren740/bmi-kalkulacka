(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("ageForm");
  const resetBtn = $("resetBtn");
  const msPerDay = 86400000;
  const int = (value) => new Intl.NumberFormat("cs-CZ").format(Number.isFinite(value) ? value : 0);
  const dateValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const parse = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmt = (date) => new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const daysBetween = (a, b) =>
    Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / msPerDay);

  function diffYMD(start, end) {
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  }

  function nextBirthday(birth, target) {
    let date = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (date < target) date = new Date(target.getFullYear() + 1, birth.getMonth(), birth.getDate());
    return { date, days: daysBetween(target, date) };
  }

  function setDefaults() {
    const today = new Date();
    $("targetDate").value = dateValue(today);
    $("birthDate").value = dateValue(new Date(today.getFullYear() - 30, today.getMonth(), today.getDate()));
  }

  function render() {
    const birth = parse($("birthDate").value);
    const target = parse($("targetDate").value);
    const diff = diffYMD(birth, target);
    const totalDays = Math.max(0, daysBetween(birth, target));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = diff.years * 12 + diff.months;
    const next = nextBirthday(birth, target);
    const nextRound = Math.ceil((diff.years + 1) / 10) * 10;
    $("exactAgeResult").textContent = `${diff.years} let, ${diff.months} měsíců, ${diff.days} dní`;
    $("daysResult").textContent = int(totalDays);
    $("nextBirthdayResult").textContent = `${int(next.days)} dní`;
    $("monthsResult").textContent = int(totalMonths);
    $("resultBadge").textContent = "Výpočet hotový";
    $("birthDateResult").textContent = fmt(birth);
    $("targetDateResult").textContent = fmt(target);
    $("weeksResult").textContent = int(totalWeeks);
    $("birthdayCountResult").textContent = int(diff.years);
    $("roundBirthdayResult").textContent = `${nextRound}. narozeniny`;
    $("resultNote").textContent = `K datu ${fmt(target)} je věk ${diff.years} let, ${diff.months} měsíců a ${diff.days} dní.`;
    $("decisionHeadline").textContent = "Přesný věk podle data";
    $("decisionText").textContent = `Celkem jde přibližně o ${int(totalDays)} dní života.`;
    $("nextStepText").textContent = `Do dalších narozenin zbývá ${int(next.days)} dní.`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ["birthDate", "targetDate", "displayMode"].forEach((id) => {
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
