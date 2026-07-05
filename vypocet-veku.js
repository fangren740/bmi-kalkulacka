(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("ageForm");
  const resetBtn = $("resetBtn");
  const msPerDay = 86400000;
  const int = (value) => new Intl.NumberFormat("cs-CZ").format(Number.isFinite(value) ? value : 0);
  const dateValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const parse = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
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
    const birthdayIn = (year) => {
      if (birth.getMonth() === 1 && birth.getDate() === 29 && new Date(year, 1, 29).getMonth() !== 1) {
        return new Date(year, 1, 28);
      }
      return new Date(year, birth.getMonth(), birth.getDate());
    };
    let date = birthdayIn(target.getFullYear());
    if (date < target) date = birthdayIn(target.getFullYear() + 1);
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
    if (!birth || !target || birth > target) {
      $("exactAgeResult").textContent = "—";
      $("resultBadge").textContent = birth && target ? "Datum narození je po cílovém datu" : "Doplňte obě data";
      $("decisionHeadline").textContent = "Zkontrolujte zadání";
      $("decisionText").textContent = "Datum narození musí být stejné nebo dřívější než cílové datum.";
      $("resultNote").textContent = "Výsledek nelze bezpečně spočítat z neplatného pořadí dat.";
      return;
    }
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
