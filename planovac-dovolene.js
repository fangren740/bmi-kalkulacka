(() => {
  'use strict';

  const DAY_MS = 86400000;
  const MONTHS = ['leden','únor','březen','duben','květen','červen','červenec','srpen','září','říjen','listopad','prosinec'];
  const MONTHS_GEN = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
  const DAYS = ['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
  const DAYS_SHORT = ['Ne','Po','Út','St','Čt','Pá','So'];
  const STORAGE_KEY = 'rv-vacation-planner-v1';
  const nowLocal = new Date();
  const CURRENT_YEAR = nowLocal.getFullYear();
  const DEFAULT_YEAR = Math.max(2025, Math.min(2035, CURRENT_YEAR));
  const todayUtc = () => dateUTC(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());

  const DISTRICT_GROUPS = [
    ['Mladá Boleslav','Příbram','Tábor','Prachatice','Strakonice','Ústí nad Labem','Chomutov','Most','Jičín','Rychnov nad Kněžnou','Olomouc','Šumperk','Opava','Jeseník'],
    ['Benešov','Beroun','Rokycany','České Budějovice','Český Krumlov','Klatovy','Trutnov','Pardubice','Chrudim','Svitavy','Ústí nad Orlicí','Ostrava-město','Prostějov'],
    ['Praha 1 až 5','Blansko','Brno-město','Brno-venkov','Břeclav','Hodonín','Vyškov','Znojmo','Domažlice','Tachov','Louny','Karviná'],
    ['Praha 6 až 10','Cheb','Karlovy Vary','Sokolov','Nymburk','Jindřichův Hradec','Litoměřice','Děčín','Přerov','Frýdek-Místek'],
    ['Kroměříž','Uherské Hradiště','Vsetín','Zlín','Praha-východ','Praha-západ','Mělník','Rakovník','Plzeň-město','Plzeň-sever','Plzeň-jih','Hradec Králové','Teplice','Nový Jičín'],
    ['Česká Lípa','Jablonec nad Nisou','Liberec','Semily','Havlíčkův Brod','Jihlava','Pelhřimov','Třebíč','Žďár nad Sázavou','Kladno','Kolín','Kutná Hora','Písek','Náchod','Bruntál']
  ];

  const SPRING_STARTS = {
    2026: ['2026-02-02','2026-02-09','2026-02-16','2026-02-23','2026-03-02','2026-03-09'],
    2027: ['2027-02-08','2027-02-15','2027-02-22','2027-03-01','2027-03-08','2027-02-01'],
    2028: ['2028-02-21','2028-02-28','2028-03-06','2028-03-13','2028-02-07','2028-02-14']
  };

  const SCHOOL_FIXED = {
    2026: [
      ['2026-01-01','2026-01-02','Vánoční prázdniny'],
      ['2026-01-30','2026-01-30','Pololetní prázdniny'],
      ['2026-04-02','2026-04-02','Velikonoční prázdniny'],
      ['2026-06-27','2026-08-31','Hlavní prázdniny'],
      ['2026-10-29','2026-10-30','Podzimní prázdniny'],
      ['2026-12-23','2026-12-31','Vánoční prázdniny']
    ],
    2027: [
      ['2027-01-01','2027-01-03','Vánoční prázdniny'],
      ['2027-01-29','2027-01-29','Pololetní prázdniny'],
      ['2027-03-25','2027-03-25','Velikonoční prázdniny'],
      ['2027-07-01','2027-08-31','Hlavní prázdniny'],
      ['2027-10-27','2027-10-29','Podzimní prázdniny'],
      ['2027-12-23','2027-12-31','Vánoční prázdniny']
    ],
    2028: [
      ['2028-01-01','2028-01-02','Vánoční prázdniny'],
      ['2028-02-04','2028-02-04','Pololetní prázdniny'],
      ['2028-04-13','2028-04-13','Velikonoční prázdniny'],
      ['2028-07-01','2028-09-03','Hlavní prázdniny']
    ]
  };

  const els = {};
  let storageControl;
  const state = {
    year: DEFAULT_YEAR,
    budget: 20,
    profile: 'balanced',
    minBreak: 3,
    maxBreak: 18,
    allowedMonths: new Set(Array.from({length: 12}, (_, i) => i)),
    schoolMode: false,
    district: 'Benešov',
    exceptions: [],
    activePlan: 'annual',
    mobileMonth: 0,
    results: null
  };

  function $(id) { return document.getElementById(id); }
  function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

  function parseISO(value) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function dateUTC(year, month, day) {
    return new Date(Date.UTC(year, month, day));
  }

  function iso(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  function addDays(date, amount) {
    return new Date(date.getTime() + amount * DAY_MS);
  }

  function diffDays(a, b) {
    return Math.round((b.getTime() - a.getTime()) / DAY_MS);
  }

  function dateLabel(date, withYear = true) {
    return `${date.getUTCDate()}. ${MONTHS_GEN[date.getUTCMonth()]}${withYear ? ` ${date.getUTCFullYear()}` : ''}`;
  }

  function rangeLabel(start, end) {
    if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
      return `${start.getUTCDate()}.–${end.getUTCDate()}. ${MONTHS_GEN[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
    }
    if (start.getUTCFullYear() === end.getUTCFullYear()) {
      return `${start.getUTCDate()}. ${MONTHS_GEN[start.getUTCMonth()]} – ${end.getUTCDate()}. ${MONTHS_GEN[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
    }
    return `${dateLabel(start)} – ${dateLabel(end)}`;
  }

  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return dateUTC(year, month, day);
  }

  function holidayMap(year) {
    const map = new Map();
    const fixed = [
      [0,1,'Nový rok / Den obnovy samostatného českého státu'],
      [4,1,'Svátek práce'],
      [4,8,'Den vítězství'],
      [6,5,'Den slovanských věrozvěstů Cyrila a Metoděje'],
      [6,6,'Den upálení mistra Jana Husa'],
      [8,28,'Den české státnosti'],
      [9,28,'Den vzniku samostatného československého státu'],
      [10,17,'Den boje za svobodu a demokracii'],
      [11,24,'Štědrý den'],
      [11,25,'1. svátek vánoční'],
      [11,26,'2. svátek vánoční']
    ];
    fixed.forEach(([m, d, name]) => map.set(iso(dateUTC(year, m, d)), name));
    const easter = easterSunday(year);
    map.set(iso(addDays(easter, -2)), 'Velký pátek');
    map.set(iso(addDays(easter, 1)), 'Velikonoční pondělí');
    return map;
  }

  function datesBetween(start, end) {
    const result = [];
    for (let d = start; d <= end; d = addDays(d, 1)) result.push(d);
    return result;
  }

  function getSchoolCalendar(year, district) {
    const days = new Map();
    const fixed = SCHOOL_FIXED[year] || [];
    fixed.forEach(([from, to, label]) => {
      datesBetween(parseISO(from), parseISO(to)).forEach(d => days.set(iso(d), label));
    });
    const groupIndex = DISTRICT_GROUPS.findIndex(group => group.includes(district));
    const springStart = SPRING_STARTS[year] && SPRING_STARTS[year][groupIndex >= 0 ? groupIndex : 0];
    if (springStart) {
      const start = parseISO(springStart);
      datesBetween(start, addDays(start, 6)).forEach(d => days.set(iso(d), 'Jarní prázdniny'));
    }
    return days;
  }

  function exceptionMaps() {
    const off = new Map();
    const blocked = new Map();
    state.exceptions.forEach(item => {
      if (item.type === 'off') off.set(item.date, item.label || 'Vlastní den volna');
      else blocked.set(item.date, item.label || 'Dovolená není možná');
    });
    return { off, blocked };
  }

  function buildCalendarContext(year) {
    const holidays = new Map([
      ...holidayMap(year - 1),
      ...holidayMap(year),
      ...holidayMap(year + 1)
    ]);
    const school = state.schoolMode ? getSchoolCalendar(year, state.district) : new Map();
    const { off, blocked } = exceptionMaps();
    return { holidays, school, off, blocked };
  }

  function isBaselineWorkday(date, ctx) {
    const day = date.getUTCDay();
    const key = iso(date);
    return day !== 0 && day !== 6 && !ctx.holidays.has(key) && !ctx.off.has(key);
  }

  function buildCandidates(year, budget, ctx) {
    const startBuffer = addDays(dateUTC(year, 0, 1), -12);
    const endBuffer = addDays(dateUTC(year, 11, 31), 12);
    const dates = datesBetween(startBuffer, endBuffer);
    const candidates = [];
    const maxLength = Math.max(5, Math.min(35, Number(state.maxBreak) || 18));
    const minLength = Math.max(3, Math.min(maxLength, Number(state.minBreak) || 3));

    const today = todayUtc();
    for (let i = 1; i < dates.length - 2; i += 1) {
      const start = dates[i];
      if (year === CURRENT_YEAR && start < today) continue;
      if (!isBaselineWorkday(dates[i - 1], ctx)) continue;
      for (let length = minLength; length <= maxLength && i + length < dates.length; length += 1) {
        const endIndex = i + length - 1;
        const end = dates[endIndex];
        if (!isBaselineWorkday(dates[endIndex + 1], ctx)) continue;
        const interval = dates.slice(i, endIndex + 1);
        const leaveDates = interval.filter(d => isBaselineWorkday(d, ctx));
        if (!leaveDates.length || leaveDates.length > budget) continue;
        if (leaveDates.some(d => d.getUTCFullYear() !== year)) continue;
        if (!leaveDates.some(d => state.allowedMonths.has(d.getUTCMonth()))) continue;
        if (leaveDates.some(d => !state.allowedMonths.has(d.getUTCMonth()))) continue;
        if (leaveDates.some(d => ctx.blocked.has(iso(d)))) continue;
        const touchesYear = interval.some(d => d.getUTCFullYear() === year);
        if (!touchesYear) continue;
        const holidayNames = [...new Set(interval.filter(d => d.getUTCDay() >= 1 && d.getUTCDay() <= 5).map(d => ctx.holidays.get(iso(d))).filter(Boolean))];
        const schoolOverlap = interval.reduce((sum, d) => sum + (ctx.school.has(iso(d)) ? 1 : 0), 0);
        const ratio = interval.length / leaveDates.length;
        candidates.push({
          id: `${iso(start)}_${iso(end)}`,
          start,
          end,
          startTime: start.getTime(),
          endTime: end.getTime(),
          totalDays: interval.length,
          leaveCount: leaveDates.length,
          leaveDates,
          ratio,
          holidayNames,
          schoolOverlap,
          title: makeBlockTitle(start, end, holidayNames, schoolOverlap)
        });
      }
    }

    const dedup = new Map();
    candidates.forEach(c => {
      const existing = dedup.get(c.id);
      if (!existing || c.leaveCount < existing.leaveCount) dedup.set(c.id, c);
    });
    return [...dedup.values()];
  }

  function makeBlockTitle(start, end, holidayNames, schoolOverlap) {
    if (holidayNames.some(n => n.includes('Velký pátek') || n.includes('Velikonoční'))) return 'Velikonoční volno';
    if (holidayNames.some(n => n.includes('Štědrý') || n.includes('vánoční'))) return 'Vánoční volno';
    if (holidayNames.some(n => n.includes('Nový rok'))) return 'Novoroční volno';
    if (holidayNames.some(n => n.includes('Svátek práce')) && holidayNames.some(n => n.includes('Den vítězství'))) return 'Květnové volno';
    if (holidayNames.some(n => n.includes('Svátek práce') || n.includes('Den vítězství'))) return 'Květnový prodloužený víkend';
    if (holidayNames.some(n => n.includes('české státnosti'))) return 'Zářijový prodloužený víkend';
    if (holidayNames.some(n => n.includes('vzniku samostatného'))) return 'Říjnové volno';
    if (holidayNames.some(n => n.includes('boje za svobodu'))) return 'Listopadový prodloužený víkend';
    if (schoolOverlap >= 5) return 'Volno během školních prázdnin';
    if (start.getUTCMonth() !== end.getUTCMonth()) return `${capitalize(MONTHS[start.getUTCMonth()])} / ${MONTHS[end.getUTCMonth()]}`;
    return `${capitalize(MONTHS[start.getUTCMonth()])} – ${start.getUTCDate()}. až ${end.getUTCDate()}.`;
  }

  function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

  function annualPlan(candidates, budget) {
    if (!candidates.length || budget < 1) return [];
    const items = candidates.slice().sort((a, b) => a.endTime - b.endTime || a.startTime - b.startTime);
    const previous = items.map((item, index) => {
      let lo = 0;
      let hi = index - 1;
      let answer = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (items[mid].endTime < item.startTime - DAY_MS) {
          answer = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      return answer;
    });

    const n = items.length;
    const dp = Array.from({ length: n + 1 }, () => new Float64Array(budget + 1));
    const take = Array.from({ length: n + 1 }, () => new Uint8Array(budget + 1));

    function score(item) {
      let value = item.totalDays * 100;
      if (state.profile === 'short') {
        value -= 45;
        value += (item.totalDays <= 5 ? 125 : item.totalDays <= 9 ? 45 : -120);
        value += Math.round(item.ratio * 20);
      } else if (state.profile === 'long') {
        value -= 235;
        value += item.totalDays * item.totalDays * 3;
      } else {
        value -= 165;
        value += Math.round(item.ratio * 8);
        if (!item.holidayNames.length && item.totalDays <= 4) value -= 190;
      }
      if (state.schoolMode) value += item.schoolOverlap * 24;
      return value;
    }

    for (let i = 1; i <= n; i += 1) {
      const item = items[i - 1];
      const prevRow = previous[i - 1] + 1;
      for (let b = 0; b <= budget; b += 1) {
        const skip = dp[i - 1][b];
        let use = -Infinity;
        if (item.leaveCount <= b) use = dp[prevRow][b - item.leaveCount] + score(item);
        if (use > skip) {
          dp[i][b] = use;
          take[i][b] = 1;
        } else dp[i][b] = skip;
      }
    }

    let bestBudget = 0;
    for (let b = 1; b <= budget; b += 1) {
      if (dp[n][b] > dp[n][bestBudget]) bestBudget = b;
    }
    const selected = [];
    let i = n;
    let b = bestBudget;
    while (i > 0 && b >= 0) {
      if (take[i][b]) {
        const item = items[i - 1];
        selected.push(item);
        b -= item.leaveCount;
        i = previous[i - 1] + 1;
      } else i -= 1;
    }
    return selected.reverse();
  }

  function chooseResults(candidates, budget) {
    const annual = annualPlan(candidates, budget);
    const longest = candidates.slice().sort((a, b) => b.totalDays - a.totalDays || a.leaveCount - b.leaveCount || b.ratio - a.ratio)[0] || null;
    const efficient = candidates.slice().sort((a, b) => b.ratio - a.ratio || b.totalDays - a.totalDays || a.leaveCount - b.leaveCount)[0] || null;
    return { annual, longest, efficient };
  }

  function planStats(blocks) {
    const list = Array.isArray(blocks) ? blocks : blocks ? [blocks] : [];
    return {
      blocks: list,
      leave: list.reduce((sum, item) => sum + item.leaveCount, 0),
      off: list.reduce((sum, item) => sum + item.totalDays, 0),
      count: list.length,
      longest: list.reduce((max, item) => Math.max(max, item.totalDays), 0),
      efficiency: list.reduce((sum, item) => sum + item.totalDays, 0) / Math.max(1, list.reduce((sum, item) => sum + item.leaveCount, 0))
    };
  }

  function activeBlocks() {
    if (!state.results) return [];
    if (state.activePlan === 'longest') return state.results.longest ? [state.results.longest] : [];
    if (state.activePlan === 'efficient') return state.results.efficient ? [state.results.efficient] : [];
    return state.results.annual;
  }

  function calculate({ announce = false } = {}) {
    const year = clamp(Number(els.yearSelect.value) || DEFAULT_YEAR, 2025, 2035);
    const budget = clamp(Number(els.leaveDays.value) || 20, 1, 50);
    state.year = year;
    state.budget = budget;
    els.yearSelect.value = String(year);
    els.leaveDays.value = String(budget);
    const ctx = buildCalendarContext(year);
    const candidates = buildCandidates(year, budget, ctx);
    state.results = chooseResults(candidates, budget);
    renderAll(ctx);
    saveState();
    if (announce) {
      els.liveStatus.textContent = `Plán pro rok ${year} byl přepočítán. ${summarySentence(state.results.annual)}`;
      els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function summarySentence(blocks) {
    const stats = planStats(blocks);
    if (!stats.blocks.length) return 'Pro zvolené podmínky nebyl nalezen vhodný termín.';
    return `${stats.leave} ${dayWord(stats.leave)} dovolené vytvoří ${stats.off} ${dayWord(stats.off)} volna v ${stats.count} blocích.`;
  }

  function renderAll(ctx) {
    renderHero();
    renderStrategyCards();
    renderActivePlan();
    renderCalendar(ctx);
    renderExceptionList();
    renderSchoolNote();
    updateMetaYear();
  }

  function renderHero() {
    const stats = planStats(state.results.annual);
    els.heroYear.textContent = state.year;
    els.heroBudget.textContent = state.budget;
    if (els.planningScope) {
      els.planningScope.textContent = state.year === CURRENT_YEAR
        ? `Aktuální rok · termíny od ${dateLabel(todayUtc(), false)}`
        : `Celý rok ${state.year}`;
    }
    if (stats.blocks.length) {
      els.heroOff.textContent = stats.off;
      els.heroBlocks.textContent = stats.count;
      els.heroEfficiency.textContent = `${formatNumber(stats.efficiency, 1)}×`;
      els.heroResultText.innerHTML = `<strong>${stats.leave} ${dayWord(stats.leave)} dovolené</strong> může vytvořit <strong>${stats.off} ${dayWord(stats.off)} volna</strong>`;
      const scopePrefix = state.year === CURRENT_YEAR ? 'Minulé termíny se nepočítají. ' : '';
      els.heroHint.textContent = scopePrefix + (stats.leave < state.budget
        ? `Optimální plán využívá ${stats.leave} z dostupných ${state.budget} ${dayWord(state.budget)}. Zbytek zůstává jako rezerva.`
        : `Rozpočet ${state.budget} ${dayWord(state.budget)} je rozdělen do ${stats.count} navazujících bloků volna.`);
    } else {
      els.heroOff.textContent = '—';
      els.heroBlocks.textContent = '0';
      els.heroEfficiency.textContent = '—';
      els.heroResultText.innerHTML = '<strong>Nebyl nalezen vhodný plán</strong>';
      els.heroHint.textContent = 'Rozšiřte povolené měsíce nebo upravte minimální a maximální délku volna.';
    }
  }

  function renderStrategyCards() {
    const annualStats = planStats(state.results.annual);
    fillCard('annual', annualStats, 'Nejvíc volna za rozpočet', annualStats.count ? `${annualStats.count} doporučených bloků během roku` : 'Upravte podmínky výpočtu');
    const longestStats = planStats(state.results.longest ? [state.results.longest] : []);
    fillCard('longest', longestStats, 'Nejdelší souvislé volno', state.results.longest ? rangeLabel(state.results.longest.start, state.results.longest.end) : 'Bez výsledku');
    const efficientStats = planStats(state.results.efficient ? [state.results.efficient] : []);
    fillCard('efficient', efficientStats, 'Nejlepší poměr', state.results.efficient ? `${formatNumber(state.results.efficient.ratio, 1)} dne volna za 1 den dovolené` : 'Bez výsledku');
    qsa('[data-plan-card]').forEach(card => card.classList.toggle('is-active', card.dataset.planCard === state.activePlan));
    qsa('[data-plan-tab]').forEach(tab => {
      const active = tab.dataset.planTab === state.activePlan;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function fillCard(key, stats, title, subtitle) {
    $(`${key}CardTitle`).textContent = title;
    $(`${key}CardMain`).textContent = stats.blocks.length ? `${stats.off} ${dayWord(stats.off)} volna` : 'Bez výsledku';
    $(`${key}CardSub`).textContent = subtitle;
    $(`${key}CardLeave`).textContent = stats.blocks.length ? `${stats.leave} ${dayWord(stats.leave)} dovolené` : '—';
    $(`${key}CardRatio`).textContent = stats.blocks.length ? `${formatNumber(stats.efficiency, 1)}× efektivita` : '—';
  }

  function renderActivePlan() {
    const blocks = activeBlocks();
    const stats = planStats(blocks);
    const labels = {
      annual: ['Doporučený plán na celý rok','Vybrané bloky maximalizují celkový počet volných dnů v rámci vašeho rozpočtu.'],
      longest: ['Nejdelší souvislé volno','Jeden nejdelší blok, který lze vytvořit s dostupnými dny dovolené.'],
      efficient: ['Nejúspornější prodloužený víkend','Nejvyšší poměr získaného volna k jednomu dni dovolené.']
    };
    els.planTitle.textContent = labels[state.activePlan][0];
    els.planDescription.textContent = labels[state.activePlan][1];
    els.planLeave.textContent = stats.leave;
    els.planOff.textContent = stats.off;
    els.planCount.textContent = stats.count;
    els.planLongest.textContent = stats.longest;
    els.blockList.innerHTML = '';
    if (!blocks.length) {
      els.blockList.innerHTML = '<div class="vp-empty"><strong>Pro zvolená pravidla není vhodný termín.</strong><span>Zkuste povolit více měsíců, snížit minimální délku volna nebo odstranit blokované datum.</span></div>';
      return;
    }
    blocks.forEach((block, index) => {
      const article = document.createElement('article');
      article.className = 'vp-block-card';
      article.innerHTML = `
        <div class="vp-block-index">${String(index + 1).padStart(2, '0')}</div>
        <div class="vp-block-copy">
          <div class="vp-block-heading"><div><span>${escapeHtml(block.title)}</span><h3>${rangeLabel(block.start, block.end)}</h3></div><strong>${block.totalDays} ${dayWord(block.totalDays)} volna</strong></div>
          <div class="vp-block-metrics"><span><b>${block.leaveCount}</b> ${dayWord(block.leaveCount)} dovolené</span><span><b>${formatNumber(block.ratio, 1)}×</b> efektivita</span>${block.holidayNames.length ? `<span><b>${block.holidayNames.length}</b> ${usedHolidayLabel(block.holidayNames.length)}</span>` : ''}${state.schoolMode && block.schoolOverlap ? `<span><b>${block.schoolOverlap}</b> ${dayWord(block.schoolOverlap)} školního volna</span>` : ''}</div>
          <div class="vp-leave-days"><span>Vzít si dovolenou:</span>${block.leaveDates.map(d => `<time datetime="${iso(d)}">${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()}. ${d.getUTCMonth() + 1}.</time>`).join('')}</div>
        </div>
        <button type="button" class="vp-show-month" data-show-month="${block.start.getUTCMonth()}">Ukázat v kalendáři</button>`;
      els.blockList.appendChild(article);
    });
    qsa('[data-show-month]', els.blockList).forEach(btn => btn.addEventListener('click', () => {
      state.mobileMonth = Number(btn.dataset.showMonth);
      renderCalendar(buildCalendarContext(state.year));
      (els.calendarSection || $('kalendar')).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function renderCalendar(ctx) {
    const blocks = activeBlocks();
    const blockDays = new Set();
    const leaveDays = new Set();
    blocks.forEach(block => {
      datesBetween(block.start, block.end).forEach(d => blockDays.add(iso(d)));
      block.leaveDates.forEach(d => leaveDays.add(iso(d)));
    });
    els.calendarYear.textContent = state.year;
    els.mobileMonthLabel.textContent = `${capitalize(MONTHS[state.mobileMonth])} ${state.year}`;
    els.yearCalendar.innerHTML = '';
    for (let month = 0; month < 12; month += 1) {
      const card = document.createElement('article');
      card.className = 'vp-month-card';
      card.dataset.month = String(month);
      card.classList.toggle('is-mobile-active', month === state.mobileMonth);
      const first = dateUTC(state.year, month, 1);
      const last = dateUTC(state.year, month + 1, 0);
      const startOffset = (first.getUTCDay() + 6) % 7;
      let daysHtml = '<div class="vp-weekdays"><span>Po</span><span>Út</span><span>St</span><span>Čt</span><span>Pá</span><span>So</span><span>Ne</span></div><div class="vp-days">';
      for (let blank = 0; blank < startOffset; blank += 1) daysHtml += '<span class="vp-day is-blank" aria-hidden="true"></span>';
      for (let day = 1; day <= last.getUTCDate(); day += 1) {
        const date = dateUTC(state.year, month, day);
        const key = iso(date);
        const classes = ['vp-day'];
        const notes = [];
        if (date.getUTCDay() === 0 || date.getUTCDay() === 6) { classes.push('is-weekend'); notes.push('víkend'); }
        if (ctx.holidays.has(key)) { classes.push('is-holiday'); notes.push(ctx.holidays.get(key)); }
        if (ctx.school.has(key)) { classes.push('is-school'); notes.push(ctx.school.get(key)); }
        if (ctx.off.has(key)) { classes.push('is-custom-off'); notes.push(ctx.off.get(key)); }
        if (ctx.blocked.has(key)) { classes.push('is-blocked'); notes.push(ctx.blocked.get(key)); }
        if (blockDays.has(key)) classes.push('is-plan');
        if (leaveDays.has(key)) { classes.push('is-leave'); notes.push('doporučená dovolená'); }
        if (key === iso(todayUtc())) classes.push('is-today');
        const label = `${day}. ${MONTHS_GEN[month]} ${state.year}${notes.length ? ` – ${notes.join(', ')}` : ''}`;
        daysHtml += `<button type="button" class="${classes.join(' ')}" data-day="${key}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"><span>${day}</span>${leaveDays.has(key) ? '<b>D</b>' : ''}</button>`;
      }
      daysHtml += '</div>';
      card.innerHTML = `<header><h3>${capitalize(MONTHS[month])}</h3><span>${monthStats(month, leaveDays, blockDays)}</span></header>${daysHtml}`;
      els.yearCalendar.appendChild(card);
    }
    qsa('[data-day]', els.yearCalendar).forEach(btn => btn.addEventListener('click', () => showDayDetail(btn.dataset.day, ctx, leaveDays, blockDays)));
    renderLegendSchool();
  }

  function monthStats(month, leaveDays, blockDays) {
    let leave = 0;
    let off = 0;
    leaveDays.forEach(key => { if (Number(key.slice(5,7)) - 1 === month) leave += 1; });
    blockDays.forEach(key => { if (Number(key.slice(5,7)) - 1 === month) off += 1; });
    if (!leave && !off) return 'bez čerpání';
    return `${leave} D → ${off} volna`;
  }

  function showDayDetail(key, ctx, leaveDays, blockDays) {
    const date = parseISO(key);
    const notes = [];
    if (leaveDays.has(key)) notes.push('doporučený den dovolené');
    else if (blockDays.has(key)) notes.push('součást souvislého volna');
    if (ctx.holidays.has(key)) notes.push(ctx.holidays.get(key));
    if (ctx.school.has(key)) notes.push(ctx.school.get(key));
    if (ctx.off.has(key)) notes.push(ctx.off.get(key));
    if (ctx.blocked.has(key)) notes.push(ctx.blocked.get(key));
    if (!notes.length) notes.push(isBaselineWorkday(date, ctx) ? 'běžný pracovní den' : 'běžný den pracovního klidu');
    els.dayDetail.innerHTML = `<div><span>${DAYS[date.getUTCDay()]}</span><strong>${dateLabel(date)}</strong></div><p>${escapeHtml(notes.join(' · '))}</p>`;
    els.dayDetail.hidden = false;
  }

  function renderLegendSchool() {
    els.schoolLegend.hidden = !state.schoolMode;
  }

  function renderExceptionList() {
    els.exceptionList.innerHTML = '';
    if (!state.exceptions.length) {
      els.exceptionList.innerHTML = '<span class="vp-no-exceptions">Zatím nejsou přidané žádné vlastní výjimky.</span>';
      return;
    }
    state.exceptions.slice().sort((a,b) => a.date.localeCompare(b.date)).forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'vp-exception-item';
      row.innerHTML = `<span class="${item.type === 'off' ? 'is-off' : 'is-blocked'}">${item.type === 'off' ? 'Vlastní volno' : 'Dovolená není možná'}</span><strong>${dateLabel(parseISO(item.date))}</strong><small>${escapeHtml(item.label || '')}</small><button type="button" data-remove-exception="${index}" aria-label="Odstranit výjimku">×</button>`;
      els.exceptionList.appendChild(row);
    });
    qsa('[data-remove-exception]', els.exceptionList).forEach(btn => btn.addEventListener('click', () => {
      const sorted = state.exceptions.slice().sort((a,b) => a.date.localeCompare(b.date));
      const target = sorted[Number(btn.dataset.removeException)];
      state.exceptions = state.exceptions.filter(item => item !== target);
      calculate();
    }));
  }

  function renderSchoolNote() {
    const available = Boolean(SCHOOL_FIXED[state.year]);
    els.schoolToggle.disabled = !available;
    if (!available && state.schoolMode) state.schoolMode = false;
    els.schoolAvailability.textContent = available
      ? `Pro rok ${state.year} jsou použity zveřejněné termíny MŠMT.`
      : `Pro rok ${state.year} není v nástroji připraven úplný školní kalendář; rodinný režim je dostupný pro roky 2026–2028.`;
    els.schoolFields.hidden = !state.schoolMode;
  }

  function updateMetaYear() {
    const title = `Plánovač dovolené ${state.year}`;
    els.dynamicTitle.textContent = title;
    if (els.yearInIntro) els.yearInIntro.textContent = state.year;
    document.title = `${title} – jak získat maximum volna | RychléVýpočty.cz`;
  }

  function formatNumber(value, digits = 0) {
    return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
  }

  function dayWord(value) {
    const n = Math.abs(Number(value));
    return n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dnů';
  }

  function usedHolidayLabel(value) {
    const n = Math.abs(Number(value));
    return n === 1 ? 'využitý svátek' : n >= 2 && n <= 4 ? 'využité svátky' : 'využitých svátků';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  }

  function populateDistricts() {
    const districts = DISTRICT_GROUPS.flat();
    els.district.innerHTML = districts.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    els.district.value = state.district;
  }

  function renderMonthToggles() {
    els.monthToggles.innerHTML = MONTHS.map((name, index) => `<label><input type="checkbox" value="${index}" checked><span>${capitalize(name.slice(0,3))}</span></label>`).join('');
    qsa('input', els.monthToggles).forEach(input => input.addEventListener('change', () => {
      const checked = qsa('input:checked', els.monthToggles).map(el => Number(el.value));
      if (!checked.length) {
        input.checked = true;
        return;
      }
      state.allowedMonths = new Set(checked);
      calculate();
    }));
  }

  function bindEvents() {
    els.calculateBtn.addEventListener('click', () => calculate({ announce: true }));
    els.yearPrev.addEventListener('click', () => { els.yearSelect.value = String(clamp(Number(els.yearSelect.value) - 1, 2025, 2035)); calculate(); });
    els.yearNext.addEventListener('click', () => { els.yearSelect.value = String(clamp(Number(els.yearSelect.value) + 1, 2025, 2035)); calculate(); });
    els.yearSelect.addEventListener('change', () => calculate());
    els.leaveDays.addEventListener('change', () => calculate());
    qsa('[data-days-chip]').forEach(btn => btn.addEventListener('click', () => {
      els.leaveDays.value = btn.dataset.daysChip;
      calculate();
    }));
    qsa('[data-plan-card]').forEach(card => card.addEventListener('click', () => setActivePlan(card.dataset.planCard)));
    qsa('[data-plan-tab]').forEach(tab => tab.addEventListener('click', () => setActivePlan(tab.dataset.planTab)));
    qsa('input[name="profile"]').forEach(input => input.addEventListener('change', () => { state.profile = input.value; calculate(); }));
    els.minBreak.addEventListener('change', () => { state.minBreak = clamp(Number(els.minBreak.value) || 3, 3, 14); calculate(); });
    els.maxBreak.addEventListener('change', () => { state.maxBreak = clamp(Number(els.maxBreak.value) || 18, state.minBreak, 35); calculate(); });
    els.schoolToggle.addEventListener('change', () => { state.schoolMode = els.schoolToggle.checked; calculate(); });
    els.district.addEventListener('change', () => { state.district = els.district.value; calculate(); });
    els.addExceptionBtn.addEventListener('click', addException);
    els.mobilePrev.addEventListener('click', () => { state.mobileMonth = (state.mobileMonth + 11) % 12; renderCalendar(buildCalendarContext(state.year)); });
    els.mobileNext.addEventListener('click', () => { state.mobileMonth = (state.mobileMonth + 1) % 12; renderCalendar(buildCalendarContext(state.year)); });
    els.copyBtn.addEventListener('click', copyPlan);
    els.shareBtn.addEventListener('click', sharePlan);
    els.csvBtn.addEventListener('click', exportCsv);
    els.icsBtn.addEventListener('click', exportIcs);
    els.printBtn.addEventListener('click', () => window.print());
    els.resetBtn.addEventListener('click', resetPlanner);
    const menuBtn = $('menuBtn');
    const mobileNav = $('mobile-nav');
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', () => {
        const open = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', String(!open));
        mobileNav.classList.toggle('is-open', !open);
      });
      mobileNav.addEventListener('click', event => {
        if (event.target.closest('a')) {
          menuBtn.setAttribute('aria-expanded', 'false');
          mobileNav.classList.remove('is-open');
        }
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          menuBtn.setAttribute('aria-expanded', 'false');
          mobileNav.classList.remove('is-open');
        }
      });
    }
  }

  function setActivePlan(plan) {
    state.activePlan = plan;
    renderStrategyCards();
    renderActivePlan();
    renderCalendar(buildCalendarContext(state.year));
    saveState();
  }

  function addException() {
    const date = els.exceptionDate.value;
    if (!date) {
      els.exceptionDate.focus();
      return;
    }
    const type = els.exceptionType.value;
    const label = els.exceptionLabel.value.trim();
    const existing = state.exceptions.find(item => item.date === date);
    if (existing) {
      existing.type = type;
      existing.label = label;
    } else state.exceptions.push({ date, type, label });
    els.exceptionLabel.value = '';
    calculate();
  }

  function planText() {
    const blocks = activeBlocks();
    const stats = planStats(blocks);
    const lines = [
      `Plán dovolené ${state.year}`,
      `${stats.leave} ${dayWord(stats.leave)} dovolené → ${stats.off} ${dayWord(stats.off)} volna`,
      ''
    ];
    blocks.forEach((block, index) => {
      lines.push(`${index + 1}. ${block.title}: ${rangeLabel(block.start, block.end)}`);
      lines.push(`   Dovolená: ${block.leaveDates.map(d => `${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`).join(', ')}`);
      lines.push(`   ${block.leaveCount} ${dayWord(block.leaveCount)} dovolené → ${block.totalDays} ${dayWord(block.totalDays)} volna`);
    });
    lines.push('', 'Vytvořeno na RychléVýpočty.cz');
    return lines.join('\n');
  }

  async function copyPlan() {
    const text = planText();
    try {
      await navigator.clipboard.writeText(text);
      flashButton(els.copyBtn, 'Zkopírováno');
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      flashButton(els.copyBtn, 'Zkopírováno');
    }
  }

  async function sharePlan() {
    updateUrl(true);
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `Plán dovolené ${state.year}`, text: summarySentence(activeBlocks()), url }); return; } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); flashButton(els.shareBtn, 'Odkaz zkopírován'); }
    catch { flashButton(els.shareBtn, 'Odkaz je v adresním řádku'); }
  }

  function updateUrl(push) {
    const params = new URLSearchParams();
    params.set('rok', state.year);
    params.set('dny', state.budget);
    if (state.profile !== 'balanced') params.set('styl', state.profile);
    if (state.schoolMode) {
      params.set('rodina', '1');
      params.set('okres', state.district);
    }
    if (state.exceptions.length) params.set('vyjimky', btoa(unescape(encodeURIComponent(JSON.stringify(state.exceptions)))));
    const url = `${location.pathname}?${params.toString()}`;
    history[push ? 'pushState' : 'replaceState']({}, '', url);
  }

  function exportCsv() {
    const blocks = activeBlocks();
    const rows = [['Blok','Od','Do','Dnů dovolené','Dnů volna','Efektivita','Dny dovolené']];
    blocks.forEach((block, index) => rows.push([
      `${index + 1}. ${block.title}`,
      iso(block.start), iso(block.end), block.leaveCount, block.totalDays,
      formatNumber(block.ratio, 2), block.leaveDates.map(iso).join(' | ')
    ]));
    download(`plan-dovolene-${state.year}.csv`, '\uFEFF' + rows.map(row => row.map(csvEscape).join(';')).join('\n'), 'text/csv;charset=utf-8');
  }

  function csvEscape(value) {
    const text = String(value).replace(/"/g, '""');
    return `"${text}"`;
  }

  function exportIcs() {
    const blocks = activeBlocks();
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const events = blocks.map((block, index) => {
      const start = iso(block.start).replace(/-/g, '');
      const end = iso(addDays(block.end, 1)).replace(/-/g, '');
      const description = `${block.leaveCount} ${dayWord(block.leaveCount)} dovolené vytvoří ${block.totalDays} ${dayWord(block.totalDays)} volna. Dny dovolené: ${block.leaveDates.map(d => `${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`).join(', ')}`;
      return ['BEGIN:VEVENT',`UID:rv-dovolena-${state.year}-${index}-${start}@rychlevypocty.cz`,`DTSTAMP:${now}`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${icsEscape(`Dovolená – ${block.title}`)}`,`DESCRIPTION:${icsEscape(description)}`,'TRANSP:TRANSPARENT','END:VEVENT'].join('\r\n');
    }).join('\r\n');
    const content = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RychleVypocty.cz//Planovac dovolene//CS','CALSCALE:GREGORIAN','METHOD:PUBLISH',events,'END:VCALENDAR'].join('\r\n');
    download(`plan-dovolene-${state.year}.ics`, content, 'text/calendar;charset=utf-8');
  }

  function icsEscape(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function flashButton(button, text) {
    const original = button.textContent;
    button.textContent = text;
    button.classList.add('is-success');
    setTimeout(() => { button.textContent = original; button.classList.remove('is-success'); }, 1800);
  }

  function resetPlanner() {
    storageControl.disable();
    state.year = DEFAULT_YEAR;
    state.budget = 20;
    state.profile = 'balanced';
    state.minBreak = 3;
    state.maxBreak = 18;
    state.allowedMonths = new Set(Array.from({length: 12}, (_, i) => i));
    state.schoolMode = false;
    state.district = 'Benešov';
    state.exceptions = [];
    state.activePlan = 'annual';
    els.yearSelect.value = String(DEFAULT_YEAR);
    els.leaveDays.value = '20';
    els.minBreak.value = '3';
    els.maxBreak.value = '18';
    els.schoolToggle.checked = false;
    qsa('input[name="profile"]').forEach(input => { input.checked = input.value === 'balanced'; });
    qsa('input', els.monthToggles).forEach(input => { input.checked = true; });
    populateDistricts();
    calculate();
  }

  function saveState() {
    if (!storageControl.enabled()) return;
    const payload = {
      year: state.year, budget: state.budget, profile: state.profile,
      minBreak: state.minBreak, maxBreak: state.maxBreak,
      allowedMonths: [...state.allowedMonths], schoolMode: state.schoolMode,
      district: state.district, exceptions: state.exceptions, activePlan: state.activePlan
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* private mode */ }
  }

  function loadState() {
    let payload = null;
    const params = new URLSearchParams(location.search);
    if (params.has('rok') || params.has('dny')) {
      payload = {
        year: Number(params.get('rok')) || DEFAULT_YEAR,
        budget: Number(params.get('dny')) || 20,
        profile: params.get('styl') || 'balanced',
        schoolMode: params.get('rodina') === '1',
        district: params.get('okres') || 'Benešov'
      };
      if (params.get('vyjimky')) {
        try { payload.exceptions = JSON.parse(decodeURIComponent(escape(atob(params.get('vyjimky'))))); } catch { payload.exceptions = []; }
      }
    } else if (storageControl.enabled()) {
      try { payload = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { payload = null; }
    }
    if (!payload) return;
    state.year = clamp(Number(payload.year) || DEFAULT_YEAR, 2025, 2035);
    state.budget = clamp(Number(payload.budget) || 20, 1, 50);
    state.profile = ['balanced','short','long'].includes(payload.profile) ? payload.profile : 'balanced';
    state.minBreak = clamp(Number(payload.minBreak) || 3, 3, 14);
    state.maxBreak = clamp(Number(payload.maxBreak) || 18, state.minBreak, 35);
    state.allowedMonths = new Set(Array.isArray(payload.allowedMonths) && payload.allowedMonths.length ? payload.allowedMonths : Array.from({length: 12}, (_, i) => i));
    state.schoolMode = Boolean(payload.schoolMode);
    state.district = payload.district || 'Benešov';
    state.exceptions = Array.isArray(payload.exceptions) ? payload.exceptions : [];
    state.activePlan = ['annual','longest','efficient'].includes(payload.activePlan) ? payload.activePlan : 'annual';
  }

  function syncControls() {
    els.yearSelect.value = state.year;
    els.leaveDays.value = state.budget;
    els.minBreak.value = state.minBreak;
    els.maxBreak.value = state.maxBreak;
    els.schoolToggle.checked = state.schoolMode;
    qsa('input[name="profile"]').forEach(input => { input.checked = input.value === state.profile; });
    qsa('input', els.monthToggles).forEach(input => { input.checked = state.allowedMonths.has(Number(input.value)); });
    els.district.value = state.district;
    state.mobileMonth = CURRENT_YEAR === state.year ? nowLocal.getMonth() : 0;
  }

  function cacheElements() {
    [
      'yearSelect','yearPrev','yearNext','leaveDays','calculateBtn','heroYear','heroBudget','heroOff','heroBlocks','heroEfficiency','heroResultText','heroHint',
      'resultsSection','liveStatus','annualCardTitle','annualCardMain','annualCardSub','annualCardLeave','annualCardRatio','longestCardTitle','longestCardMain','longestCardSub','longestCardLeave','longestCardRatio','efficientCardTitle','efficientCardMain','efficientCardSub','efficientCardLeave','efficientCardRatio',
      'planTitle','planDescription','planLeave','planOff','planCount','planLongest','blockList','calendarSection','calendarYear','yearCalendar','mobilePrev','mobileNext','mobileMonthLabel','dayDetail','schoolLegend',
      'minBreak','maxBreak','monthToggles','schoolToggle','district','schoolFields','schoolAvailability','exceptionType','exceptionDate','exceptionLabel','addExceptionBtn','exceptionList',
      'copyBtn','shareBtn','csvBtn','icsBtn','printBtn','resetBtn','dynamicTitle','yearInIntro','planningScope'
    ].forEach(id => { els[id] = $(id); });
  }

  function init() {
    cacheElements();
    storageControl = window.RVStorageChoice.create({
      scope: 'vacationPlanner',
      dataKey: STORAGE_KEY,
      inputId: 'rememberVacationSettings',
      statusId: 'vacationStorageStatus',
      onEnable: saveState
    });
    loadState();
    populateDistricts();
    renderMonthToggles();
    syncControls();
    bindEvents();
    calculate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
