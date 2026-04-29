(function(){
  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  const money = (v) => `${fmt.format(Math.round(v))} Kč`;
  const num = (id) => Math.max(0, Number($(id)?.value || 0));
  function calculate(){
    const income=num('income'), expenses=num('expenses'), existing=num('existingPayments'), planned=num('plannedPayment'), savings=num('savings');
    const people=Math.max(1,num('people'));
    const stability=$('stability')?.value || 'normal';
    const type=$('paymentType')?.value || 'loan';
    const stabilityFactor = stability === 'stable' ? 1 : stability === 'unstable' ? 0.74 : 0.88;
    const baseLivingBuffer = 6500 + Math.max(0, people-1)*4200;
    const freeBeforeNew = income - expenses - existing;
    const debtCapSafe = income * 0.27 * stabilityFactor;
    const debtCapBorder = income * 0.38 * stabilityFactor;
    const reserveMonths = expenses > 0 ? savings / expenses : 0;
    const reservePenalty = reserveMonths < 2 ? 0.72 : reserveMonths < 4 ? 0.88 : 1;
    const safeByDebt = Math.max(0, debtCapSafe - existing);
    const safeByCash = Math.max(0, freeBeforeNew - baseLivingBuffer);
    const safe = Math.max(0, Math.min(safeByDebt, safeByCash) * reservePenalty);
    const border = Math.max(safe, Math.min(Math.max(0, debtCapBorder-existing), Math.max(0, freeBeforeNew - baseLivingBuffer*0.62)));
    const totalPayments = existing + planned;
    const debtRatio = income > 0 ? totalPayments / income * 100 : 0;
    const leftAfter = income - expenses - totalPayments;
    let status='safe', title='Splátka vypadá bezpečně', meter='bezpečná zóna', text='Po nové splátce vám zůstává rozumný prostor v rozpočtu a celkové zatížení příjmu je přijatelné.', next='Porovnejte splátku s celým rozpočtem domácnosti a ponechte si rezervu i na nečekané výdaje.';
    if(planned > border || leftAfter < baseLivingBuffer*0.45 || debtRatio > 45){status='risk';title='Splátka je riziková';meter='riziková zóna';text='Plánovaná splátka výrazně zatěžuje rozpočet. Po zaplacení výdajů a závazků zůstává málo prostoru, nebo je podíl splátek na příjmu příliš vysoký.';next='Zvažte nižší částku, delší splatnost, vyšší vlastní zdroje nebo odložení nákupu. Nejdřív zkontrolujte rozpočet a rezervu.'}
    else if(planned > safe || leftAfter < baseLivingBuffer || debtRatio > 32){status='border';title='Splátka je na hraně';meter='hraniční zóna';text='Splátka může být zvládnutelná, ale rozpočet už nemá velký prostor na výpadky, opravy nebo růst cen.';next='Před podpisem si projděte rozpočet domácnosti a ověřte, že máte finanční rezervu alespoň na několik měsíců výdajů.'}
    if($( 'safePayment')) $('safePayment').textContent=money(safe);
    if($( 'borderPayment')) $('borderPayment').textContent=money(border);
    if($( 'leftAfter')) $('leftAfter').textContent=money(leftAfter);
    if($( 'debtRatio')) $('debtRatio').textContent=`${debtRatio.toFixed(0)} %`;
    if($( 'reserveMonths')) $('reserveMonths').textContent=`${reserveMonths.toFixed(1).replace('.',',')} měs.`;
    if($( 'resultTitle')) $('resultTitle').textContent=title;
    if($( 'resultText')) $('resultText').textContent=text;
    if($( 'nextStep')) $('nextStep').textContent=next;
    if($( 'meterLabel')) $('meterLabel').textContent=meter;
    const bar=Math.max(3,Math.min(100,debtRatio*2.1)); if($('debtBar')) $('debtBar').style.width=`${bar}%`;
    if($('heroSafePayment')) $('heroSafePayment').textContent=money(safe);
    if($('heroStatus')) $('heroStatus').textContent=status==='safe'?'bezpečné zatížení':status==='border'?'hraniční zatížení':'rizikové zatížení';
    const result=$('vysledek'); if(result){result.dataset.status=status;}
  }
  ['income','expenses','existingPayments','plannedPayment','savings','people','stability','paymentType'].forEach(id=>{const el=$(id); if(el){el.addEventListener('input',calculate);el.addEventListener('change',calculate);}});
  $('calculateInstallment')?.addEventListener('click',calculate);
  calculate();
})();