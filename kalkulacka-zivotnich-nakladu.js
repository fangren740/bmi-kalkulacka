(function(){
  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('cs-CZ', {maximumFractionDigits:0});
  const money = v => `${fmt.format(Math.round(v||0))} Kč`;
  const num = id => Math.max(0, Number($(id)?.value || 0));
  const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
  const expenseMap = [['housing','Bydlení'],['utilities','Energie a služby'],['food','Jídlo a drogerie'],['transport','Doprava a auto'],['kids','Děti a škola'],['insurance','Pojištění a zdraví'],['debt','Splátky'],['other','Volný čas a ostatní'],['reserve','Rezerva a nepravidelné výdaje']];
  function calculate(){
    const adults=num('adults')||1, children=num('children'), people=adults+children;
    const income=num('income'), savings=num('savings'), lifestyle=Number($('lifestyle')?.value||1);
    const base = expenseMap.reduce((s,[id])=>s+num(id),0);
    const minimum = base * Math.min(.9, lifestyle*.9);
    const realistic = base * lifestyle;
    const comfort = base * Math.max(1.14, lifestyle*1.16);
    const perPerson = people ? realistic / people : realistic;
    const recommendedIncome = realistic * 1.25;
    const remaining = income - realistic;
    const reserveMonths = realistic ? savings / realistic : 0;
    const ratio = income ? realistic / income * 100 : 999;
    let score = 100;
    if(ratio>100) score-=50; else if(ratio>90) score-=32; else if(ratio>80) score-=18; else if(ratio>70) score-=8;
    if(reserveMonths<1) score-=18; else if(reserveMonths<3) score-=9; else if(reserveMonths>6) score+=3;
    if(num('housing') && income && num('housing')/income>.42) score-=12;
    if(num('debt') && income && num('debt')/income>.15) score-=10;
    score=Math.round(clamp(score,0,100));
    let label='Vyvážené náklady', tone='healthy', summary, next, title, text, bullets;
    if(score<45 || remaining<0){
      label='Rizikové náklady'; tone='risk';
      summary='Realistické životní náklady jsou příliš blízko příjmu nebo ho převyšují. Domácnost má malý prostor na horší měsíc.';
      next='Další krok: nejdřív snižte fixní položky nebo ověřte vyšší čistý příjem. Nová splátka či dražší bydlení teď nedává bezpečný smysl.';
      title='Domácnost jede příliš blízko hraně';
      text='Problém není jen samotný součet výdajů, ale malý prostor po zaplacení běžného měsíce. V takové situaci může stačit doplatek energií, oprava auta nebo výpadek příjmu a rozpočet se dostane do mínusu.';
      bullets=['Porovnejte bydlení s příjmem a hledejte největší fixní položku.','Zvlášť zkontrolujte splátky a pravidelné závazky.','Vytvořte alespoň minimální rezervu před větším rozhodnutím.'];
    } else if(score<70){
      label='Napjaté náklady'; tone='tight';
      summary='Výdaje se vejdou do příjmu, ale rozpočet nemá velký polštář. Vyplatí se plánovat opatrněji.';
      next='Další krok: nastavte měsíční rezervu a otestujte, co se stane při vyšším nájmu, energiích nebo nové splátce.';
      title='Rozpočet funguje, ale bez velké rezervy';
      text='Domácnost běžný měsíc zvládne, ale neměla by brát realistické náklady jako cílové maximum. Při plánování bydlení, auta nebo dítěte je vhodné držet opatrnější scénář.';
      bullets=['Držte rezervu alespoň na tři měsíce nákladů.','Roční platby rozpočítejte do měsíčního průměru.','Před novou splátkou použijte kalkulačku bezpečné splátky.'];
    } else {
      label='Vyvážené náklady'; tone='healthy';
      summary='Životní náklady vypadají zdravě vůči příjmu. Po běžném měsíci zůstává prostor na rezervu a nepravidelné výdaje.';
      next='Další krok: ověřte finanční rezervu a podle výsledku rozdělte přebytek mezi rezervu, cíle a případné investice.';
      title='Náklady odpovídají bezpečnějšímu provozu';
      text='Domácnost má po zaplacení běžných nákladů prostor na rezervu. Dává smysl hlídat hlavně bydlení, jídlo a dopravu, protože jejich růst dokáže výsledek rychle změnit.';
      bullets=['Udržujte rezervu mimo běžný účet.','Jednou za pár měsíců aktualizujte největší položky.','Při změně bydlení nebo auta počítejte znovu.'];
    }
    $('statusLabel').textContent=label; $('statusScore').textContent=`${score} / 100`;
    $('realisticTotal').textContent=money(realistic); $('minimumTotal').textContent=money(minimum); $('comfortTotal').textContent=money(comfort); $('perPerson').textContent=money(perPerson); $('recommendedIncome').textContent=money(recommendedIncome);
    $('resultSummary').textContent=summary; $('nextStep').innerHTML=`<strong>${next.split(':')[0]}:</strong>${next.includes(':') ? next.substring(next.indexOf(':')+1) : ' '+next}`;
    $('heroTotal').textContent=money(realistic); $('heroIncome').textContent=money(recommendedIncome); $('heroLabel').textContent=label.toLowerCase();
    $('scenarioMin').textContent=money(minimum); $('scenarioReal').textContent=money(realistic); $('scenarioComfort').textContent=money(comfort);
    $('insightTitle').textContent=title; $('insightText').textContent=text; $('insightBullets').innerHTML=bullets.map(b=>`<li>${b}</li>`).join('');
    document.querySelector('.rv-life-result-card')?.setAttribute('data-tone', tone);
    const max=Math.max(...expenseMap.map(([id])=>num(id)),1);
    $('breakdownList').innerHTML=expenseMap.map(([id,label])=>{const value=num(id), width=Math.max(4, Math.round(value/max*100)), pct=realistic?Math.round(value/realistic*100):0;return `<div class="rv-life-breakdown-item"><span>${label}</span><b style="width:${width}%"></b><em>${money(value)} · ${pct}%</em></div>`}).join('');
  }
  document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('#lifeForm input,#lifeForm select').forEach(el=>el.addEventListener('input',calculate));$('calculateLife')?.addEventListener('click',calculate);calculate();});
})();