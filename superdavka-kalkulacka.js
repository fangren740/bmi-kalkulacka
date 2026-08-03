(() => {
  'use strict';

  const form = document.getElementById('dsspForm');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.max(0, Math.ceil(value || 0)))} Kč`;
  const number = (value) => Number(String(value ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const LIFE = {
    individual: 4860,
    firstAdult: 4470,
    otherAdult: 4040,
    childUnder6: 2480,
    child6to15: 3050,
    child15to26: 3490,
    existence: 3130
  };
  const SERVICE = {
    standard: [880, 1240, 1600, 1710, 1820],
    vulnerable: [1310, 1770, 2230, 2370, 2380]
  };
  const ENERGY = [2300, 2800, 3300, 3800, 4300];
  const SOLID_FUEL = [1500, 2000, 2500, 3000, 3500];
  const NORM_RENT = {
    standard: {
      small: [7580, 9245, 10600, 11230, 11487],
      large: [9430, 10950, 12300, 12632, 12052],
      prague: [12831, 14466, 16600, 17710, 17320]
    },
    vulnerable: {
      small: [10310, 12109, 13758, 14370, 14880],
      large: [12310, 13770, 15394, 16230, 15780],
      prague: [15910, 18103, 20230, 22170, 22380]
    }
  };

  const templates = {
    single: [{ type: 'adult', active: true, vulnerable: false, plan: false }],
    couple: [
      { type: 'adult', active: true, vulnerable: false, plan: false },
      { type: 'adult', active: true, vulnerable: false, plan: false }
    ],
    singleChild: [
      { type: 'adult', active: true, vulnerable: false, plan: false },
      { type: 'child6to15', active: false, vulnerable: true, plan: false }
    ],
    singleTwoChildren: [
      { type: 'adult', active: true, vulnerable: false, plan: false },
      { type: 'childUnder6', active: false, vulnerable: true, plan: false },
      { type: 'child6to15', active: false, vulnerable: true, plan: false }
    ],
    coupleChild: [
      { type: 'adult', active: true, vulnerable: false, plan: false },
      { type: 'adult', active: true, vulnerable: false, plan: false },
      { type: 'child6to15', active: false, vulnerable: true, plan: false }
    ],
    coupleTwoChildren: [
      { type: 'adult', active: true, vulnerable: false, plan: false },
      { type: 'adult', active: true, vulnerable: false, plan: false },
      { type: 'childUnder6', active: false, vulnerable: true, plan: false },
      { type: 'child6to15', active: false, vulnerable: true, plan: false }
    ]
  };

  let members = structuredClone(templates.coupleTwoChildren);

  function memberLabel(member) {
    if (member.type === 'adult') return 'Dospělá osoba';
    if (member.type === 'childUnder6') return 'Nezaopatřené dítě do 6 let';
    if (member.type === 'child6to15') return 'Nezaopatřené dítě 6–15 let';
    return 'Nezaopatřené dítě 15–26 let';
  }

  function renderMembers() {
    const host = $('memberList');
    host.innerHTML = '';
    members.forEach((member, index) => {
      const card = document.createElement('article');
      card.className = 'member-card';
      card.innerHTML = `
        <div class="member-card-head">
          <strong>Osoba ${index + 1}</strong>
          ${members.length > 1 ? `<button type="button" class="member-remove" data-remove="${index}">Odebrat</button>` : ''}
        </div>
        <label class="field">
          <span>Typ osoby</span>
          <select data-member="${index}" data-key="type">
            <option value="adult" ${member.type === 'adult' ? 'selected' : ''}>Dospělá osoba</option>
            <option value="childUnder6" ${member.type === 'childUnder6' ? 'selected' : ''}>Dítě do 6 let</option>
            <option value="child6to15" ${member.type === 'child6to15' ? 'selected' : ''}>Dítě 6–15 let</option>
            <option value="child15to26" ${member.type === 'child15to26' ? 'selected' : ''}>Dítě 15–26 let</option>
          </select>
        </label>
        <div class="member-checks ${member.type !== 'adult' ? 'is-child' : ''}">
          <label><input type="checkbox" data-member="${index}" data-key="active" ${member.active ? 'checked' : ''} ${member.type !== 'adult' ? 'disabled' : ''}> Pracovně aktivní / evidence ÚP</label>
          <label><input type="checkbox" data-member="${index}" data-key="vulnerable" ${member.vulnerable ? 'checked' : ''} ${member.type !== 'adult' ? 'disabled' : ''}> Zranitelná osoba</label>
          <label><input type="checkbox" data-member="${index}" data-key="plan" ${member.plan ? 'checked' : ''} ${member.type !== 'adult' ? 'disabled' : ''}> Plní podpůrný plán</label>
        </div>
        <small>${memberLabel(member)}</small>`;
      host.appendChild(card);
    });
    host.querySelectorAll('[data-member]').forEach((control) => {
      control.addEventListener('change', () => {
        const i = Number(control.dataset.member);
        const key = control.dataset.key;
        if (key === 'type') {
          members[i].type = control.value;
          if (control.value !== 'adult') {
            members[i].active = false;
            members[i].vulnerable = true;
            members[i].plan = false;
          }
          renderMembers();
        } else {
          members[i][key] = control.checked;
        }
        calculate();
      });
    });
    host.querySelectorAll('[data-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        members.splice(Number(button.dataset.remove), 1);
        renderMembers();
        calculate();
      });
    });
  }

  function lifeMinimum(memberList) {
    if (memberList.length === 1) {
      const only = memberList[0];
      if (only.type === 'adult') return LIFE.individual;
      return LIFE[only.type];
    }
    let firstAdultUsed = false;
    return memberList.reduce((sum, member) => {
      if (member.type === 'adult') {
        const value = firstAdultUsed ? LIFE.otherAdult : LIFE.firstAdult;
        firstAdultUsed = true;
        return sum + value;
      }
      return sum + LIFE[member.type];
    }, 0);
  }

  function adultLifeMinimum(member, index, list) {
    if (list.length === 1) return LIFE.individual;
    const adultIndexes = list.map((m, i) => m.type === 'adult' ? i : -1).filter((i) => i >= 0);
    return index === adultIndexes[0] ? LIFE.firstAdult : LIFE.otherAdult;
  }

  function categoryIndex(count) {
    return clamp(count, 1, 5) - 1;
  }

  function savingsLimit(count) {
    return Math.min(400000, 150000 + 50000 * count);
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function calculate() {
    const workIncome = Math.max(0, number($('workIncome').value));
    const otherIncome = Math.max(0, number($('otherIncome').value));
    const income = workIncome + otherIncome;
    const rent = Math.max(0, number($('rentCosts').value));
    const energyActual = Math.max(0, number($('energyCosts').value));
    const housingType = $('housingType').value;
    const region = $('region').value;
    const totalPeopleInDwelling = Math.max(members.length, Math.floor(number($('allPeople').value) || members.length));
    const solidFuel = $('solidFuel').checked;
    const schoolOk = $('schoolOk').checked;
    const savings = Math.max(0, number($('savings').value));
    const cars = Math.max(0, Math.floor(number($('cars').value)));
    const homes = Math.max(0, Math.floor(number($('homes').value)));
    const secondHomeException = $('secondHomeException').checked;

    const memberCount = members.length;
    const adults = members.filter((member) => member.type === 'adult');
    const children = members.filter((member) => member.type !== 'adult');
    const allVulnerable = members.every((member) => member.vulnerable || member.type !== 'adult');
    const allRequiredActive = adults.every((member) => member.vulnerable || member.active);
    const eligibleMembers = members.filter((member) => member.type !== 'adult' || member.active || member.vulnerable);
    const effectiveCount = Math.max(1, eligibleMembers.length);
    const lifeMin = lifeMinimum(members);
    const ratio = lifeMin > 0 ? income / lifeMin : 0;
    const idx = categoryIndex(effectiveCount);
    const normGroup = allVulnerable ? 'vulnerable' : 'standard';
    const normRent = NORM_RENT[normGroup][region][idx];
    const service = SERVICE[normGroup][idx];
    const energyPauschal = ENERGY[idx] * (allVulnerable ? 1.4 : 1);
    const solidFuelAmount = solidFuel ? SOLID_FUEL[idx] * (allVulnerable ? 1.4 : 1) : 0;

    let recognisedEnergy;
    if (ratio >= 1.43) {
      recognisedEnergy = energyPauschal;
    } else {
      recognisedEnergy = Math.min(energyActual + solidFuelAmount, energyPauschal * 1.2);
    }

    let recognisedBase;
    if (housingType === 'owner') {
      recognisedBase = 0.3 * Math.max(0, normRent - service) + service;
    } else if (housingType === 'other') {
      recognisedBase = Math.min(rent, normRent * 0.8);
    } else {
      recognisedBase = Math.min(rent, normRent);
    }
    let recognisedHousing = recognisedBase + recognisedEnergy;
    recognisedHousing *= memberCount / totalPeopleInDwelling;

    const determinedIncome = 0.3 * income + (income > 2 * lifeMin ? 0.1 * (income - 2 * lifeMin) : 0);
    const housingComponent = Math.max(0, recognisedHousing - determinedIncome);

    let needs = 0;
    members.forEach((member, index) => {
      if (member.type !== 'adult') {
        needs += LIFE[member.type];
      } else if (member.active || member.vulnerable) {
        needs += member.plan ? adultLifeMinimum(member, index, members) : LIFE.existence;
      }
    });
    const livingComponent = ratio <= 1.43 ? Math.max(0, needs - 0.7 * income) : 0;

    let childPer = 0;
    if (children.length && allRequiredActive && schoolOk && ratio <= 4) {
      if (ratio <= 1.43) childPer = allVulnerable ? 1000 : 500;
      else if (ratio < 3) childPer = 1000;
      else childPer = Math.max(0, 1000 * (4 - ratio));
    }
    const childBonus = children.length * childPer;

    let workBonus = 0;
    if (workIncome > 0 && (housingComponent > 0 || livingComponent > 0 || childBonus > 0)) {
      if (ratio <= 1.6) {
        workBonus = 0.4 * workIncome;
      } else {
        const excess = Math.max(0, income - 1.6 * lifeMin);
        const partA = 0.4 * Math.max(0, workIncome - excess);
        const partB = 0.3 * excess;
        workBonus = Math.max(0, partA - partB);
      }
    }

    const limit = savingsLimit(memberCount);
    const assetIssues = [];
    if (savings > limit) assetIssues.push(`Úspory překračují limit ${money(limit)}.`);
    if (cars > adults.length) assetIssues.push(`Počet aut je vyšší než počet zletilých členů domácnosti (${adults.length}).`);
    if (homes > 2) assetIssues.push('Domácnost vlastní více nemovitostí, než připouští základní majetkový test.');
    if (homes === 2 && !secondHomeException) assetIssues.push('Druhá nemovitost vyžaduje splnění časově omezené tříleté výjimky.');
    if (members.length === 1 && adults.length === 1 && !adults[0].active && !adults[0].vulnerable) {
      assetIssues.push('Jednočlenná domácnost bez pracovní aktivity a bez zranitelnosti nemá podle základního pravidla nárok.');
    }

    const totalBeforeAssets = Math.ceil(housingComponent + livingComponent + childBonus + workBonus);
    const hardFail = assetIssues.some((issue) => !issue.includes('tříleté výjimky'));
    const total = hardFail ? 0 : totalBeforeAssets;

    setText('totalBenefit', money(total));
    setText('housingComponent', money(housingComponent));
    setText('livingComponent', money(livingComponent));
    setText('childComponent', money(childBonus));
    setText('workComponent', money(workBonus));
    setText('lifeMinimum', money(lifeMin));
    setText('incomeRatio', `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(ratio)}× životního minima`);
    setText('recognisedHousing', money(recognisedHousing));
    setText('assetLimit', money(limit));
    setText('effectiveHousehold', `${effectiveCount} ${effectiveCount === 1 ? 'osoba' : effectiveCount < 5 ? 'osoby' : 'osob'}`);

    const status = $('resultStatus');
    const explanation = $('resultExplanation');
    const warningList = $('warningList');
    warningList.innerHTML = '';

    if (hardFail) {
      status.textContent = 'Majetkový test nesplněn';
      status.className = 'result-status is-risk';
      explanation.textContent = 'Podle zadaných údajů kalkulačka zachytila překážku, která obvykle vylučuje nárok na dávku. Výše jednotlivých složek proto není započtena do výsledku.';
    } else if (total > 0) {
      status.textContent = 'Orientační nárok';
      status.className = 'result-status is-success';
      explanation.textContent = 'Domácnosti podle zadaného modelu vychází alespoň jedna složka dávky. Úřad práce ověří skutečné příjmy, bydlení, majetek, aktivitu členů i složení domácnosti.';
    } else {
      status.textContent = 'Výsledek 0 Kč';
      status.className = 'result-status is-neutral';
      explanation.textContent = 'Podle zadaných hodnot nevychází kladná částka žádné složky. Nárok ale může změnit přesnější zařazení příjmů, členů domácnosti nebo uznatelných nákladů.';
    }

    if (!allRequiredActive && children.length) assetIssues.push('Bonus na dítě nevychází, protože některý nezranitelný dospělý není pracovně aktivní.');
    if (!schoolOk && children.length) assetIssues.push('Bonus na dítě je vypnutý kvůli nesplnění podmínky školní docházky.');
    if (ratio > 1.43) assetIssues.push('Složka na živobytí nevychází, protože příjem přesahuje 1,43násobek životního minima.');
    if (totalPeopleInDwelling > memberCount) assetIssues.push('Náklady na bydlení byly poměrně kráceny podle počtu všech osob v bytě nebo domě.');
    if (homes === 2 && secondHomeException) assetIssues.push('Druhá nemovitost je započtena jako možná tříletá výjimka; její splnění ověřuje Úřad práce.');
    if ($('rulesDate').value === 'future') assetIssues.unshift('Od 1. 10. 2026 se mají změnit některé parametry. Výpočet používá pravidla platná do 30. 9. 2026.');

    assetIssues.slice(0, 6).forEach((issue) => {
      const li = document.createElement('li');
      li.textContent = issue;
      warningList.appendChild(li);
    });
    $('warningBox').hidden = warningList.children.length === 0;

    const bars = [housingComponent, livingComponent, childBonus, workBonus];
    const maxBar = Math.max(...bars, 1);
    ['housingBar', 'livingBar', 'childBar', 'workBar'].forEach((id, i) => {
      $(id).style.width = `${Math.max(2, bars[i] / maxBar * 100)}%`;
    });
  }

  document.querySelectorAll('[data-template]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-template]').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      members = structuredClone(templates[button.dataset.template]);
      $('allPeople').value = String(members.length);
      renderMembers();
      calculate();
    });
  });

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const advanced = button.dataset.mode === 'advanced';
      document.querySelectorAll('[data-mode]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
        item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
      });
      $('advancedMembers').hidden = !advanced;
      $('basicTemplates').hidden = advanced;
      calculate();
    });
  });

  $('addMember').addEventListener('click', () => {
    if (members.length >= 8) return;
    members.push({ type: 'adult', active: true, vulnerable: false, plan: false });
    renderMembers();
    calculate();
  });

  $('resetForm').addEventListener('click', () => {
    form.reset();
    members = structuredClone(templates.coupleTwoChildren);
    $('allPeople').value = '4';
    document.querySelectorAll('[data-template]').forEach((item) => item.classList.toggle('is-active', item.dataset.template === 'coupleTwoChildren'));
    renderMembers();
    calculate();
  });

  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
    $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('rulesDate').addEventListener('change', () => {
    $('futureNotice').hidden = $('rulesDate').value !== 'future';
  });

  const menu = $('menuToggle');
  const nav = $('mainNav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
  }

  renderMembers();
  calculate();
})();
