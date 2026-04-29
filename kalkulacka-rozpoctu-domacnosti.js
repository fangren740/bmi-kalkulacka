(function(){
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const money = (v) => `${fmt.format(Math.round(v || 0))} Kč`;
  const num = (id) => Math.max(0, Number($(id)?.value || 0));
  const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));

  const expenseMap = [
    ['housing','Bydlení'], ['utilities','Energie a služby'], ['food','Jídlo a drogerie'], ['transport','Doprava a auto'], ['kids','Děti a domácnost'], ['debt','Splátky'], ['insurance','Pojištění a zdraví'], ['otherExpenses','Ostatní a volný čas']
  ];
  const fixedIds = ['housing','utilities','debt','insurance'];

  function calculate(){
    const income = num('incomeMain') + num('incomeSecond') + num('incomeOther');
    const savings = num('savings');
    const expenses = expenseMap.reduce((sum,[id])=>sum+num(id),0);
    const remaining = income - expenses;
    const fixed = fixedIds.reduce((sum,id)=>sum+num(id),0);
    const fixedRatio = income ? (fixed / income) * 100 : 0;
    const expenseRatio = income ? (expenses / income) * 100 : 100;
    const reserveMonths = expenses ? savings / expenses : 0;
    const remainingRatio = income ? (remaining / income) * 100 : -100;

    let score = 100;
    if (remaining < 0) score -= 45;
    if (remainingRatio < 5) score -= 25; else if (remainingRatio < 12) score -= 14; else if (remainingRatio < 20) score -= 6;
    if (fixedRatio > 60) score -= 22; else if (fixedRatio > 50) score -= 14; else if (fixedRatio > 40) score -= 6;
    if (reserveMonths < 1) score -= 18; else if (reserveMonths < 3) score -= 10; else if (reserveMonths >= 6) score += 4;
    if (num('debt') > 0 && income && num('debt') / income > .15) score -= 10;
    score = Math.round(clamp(score, 0, 100));

    let label = 'Zdravý rozpočet', tone = 'healthy', summary, next, title, text, bullets;
    if (score < 45 || remaining < 0) {
      label = 'Rizikový rozpočet'; tone = 'risk';
      summary = remaining < 0 ? 'Výdaje převyšují příjmy. Rozpočet potřebuje rychle snížit pravidelné náklady nebo navýšit příjem.' : 'Rozpočet má velmi malý polštář. Nečekaný výdaj může způsobit problém.';
      next = 'Další krok: projděte největší položky, hlavně bydlení, energie a splátky. Nové závazky teď nedávají smysl.';
      title = 'Rozpočet je rizikový';
      text = 'Domácnost má příliš malý prostor po zaplacení nákladů. Prioritou je stabilizovat hotovostní tok a vytvořit alespoň minimální rezervu.';
      bullets = ['Snižte největší pravidelné položky.', 'Odložte novou půjčku nebo dražší bydlení.', 'Přepočítejte splátky a fixní náklady.'];
    } else if (score < 70) {
      label = 'Napjatý rozpočet'; tone = 'warning';
      summary = 'Peníze vycházejí, ale rozpočet nemá velký prostor na chyby. Zaměřte se na rezervu a fixní výdaje.';
      next = 'Další krok: nastavte měsíční odkládání rezervy a otestujte, co se stane při poklesu příjmu nebo vyšších nákladech.';
      title = 'Rozpočet je použitelný, ale napjatý';
      text = 'Příjmy výdaje pokryjí, ale větší roční platba, oprava auta nebo doplatek energií může rozpočet rozhodit.';
      bullets = ['Zkuste snížit fixní náklady pod bezpečnější úroveň.', 'Roční platby rozpočítejte do měsíčního průměru.', 'Rezervu budujte automaticky hned po výplatě.'];
    } else {
      label = 'Zdravý rozpočet'; tone = 'healthy';
      summary = 'Po běžných výdajích zůstává prostor na rezervu, nepravidelné platby i finanční cíle.';
      next = 'Další krok: ověřte, zda máte rezervu alespoň na 3 měsíce výdajů, a přebytek rozdělte mezi cíle.';
      title = 'Rozpočet má zdravou rezervu';
      text = 'Domácnost má po zaplacení běžných výdajů rozumný prostor. Dává smysl rezervu držet odděleně a pravidelně kontrolovat největší položky.';
      bullets = ['Držte rezervu alespoň 3 měsíce výdajů.', 'Přebytek rozdělte mezi rezervu a cíle.', 'Před hypotékou nebo půjčkou otestujte horší scénář.'];
    }

    $('scoreLabel').textContent = label;
    $('scoreValue').textContent = `${score} / 100`;
    $('remainingValue').textContent = money(remaining);
    $('resultSummary').textContent = summary;
    $('totalIncome').textContent = money(income);
    $('totalExpenses').textContent = money(expenses);
    $('fixedRatio').textContent = `${Math.round(fixedRatio)} %`;
    $('reserveMonths').textContent = `${reserveMonths.toLocaleString('cs-CZ',{maximumFractionDigits:1})} měsíce`;
    $('nextStep').innerHTML = `<strong>${next.split(':')[0]}:</strong>${next.includes(':') ? next.substring(next.indexOf(':')+1) : ' ' + next}`;
    $('insightTitle').textContent = title;
    $('insightText').textContent = text;
    $('insightBullets').innerHTML = bullets.map(b=>`<li>${b}</li>`).join('');

    $('heroRemaining').textContent = money(remaining);
    $('heroStatus').textContent = label.toLowerCase();
    document.querySelector('.rv-budget-result-card')?.setAttribute('data-tone', tone);

    const list = $('breakdownList');
    const max = Math.max(...expenseMap.map(([id])=>num(id)), 1);
    list.innerHTML = expenseMap.map(([id,label])=>{
      const value = num(id); const width = Math.max(3, Math.round(value / max * 100)); const pct = income ? Math.round(value / income * 100) : 0;
      return `<div class="rv-budget-breakdown-item"><span>${label}</span><b style="width:${width}%"></b><em>${money(value)} · ${pct}%</em></div>`;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#budgetForm input').forEach(input => input.addEventListener('input', calculate));
    $('calculateBudget')?.addEventListener('click', calculate);
    calculate();
  });
})();
