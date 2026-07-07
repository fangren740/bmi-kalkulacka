(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("billingForm");
  if (!form) return;
  const ids = ["targetIncome","businessCosts","activeMonths","annualInvestments","obligationReserve","safetyReserve","currentBilling","averageInvoice","weeksPerMonth"];
  const mf = new Intl.NumberFormat("cs-CZ", {style:"currency",currency:"CZK",maximumFractionDigits:0});
  const nf = new Intl.NumberFormat("cs-CZ", {maximumFractionDigits:1});
  const money = value => mf.format(Number.isFinite(value) ? value : 0);
  const num = value => nf.format(Number.isFinite(value) ? value : 0);
  const set = (id,value) => { const el=$(id); if(el) el.textContent=value; };
  const read = () => Object.fromEntries(ids.map(id => [id,Number($(id).value)]));

  function validate(v){
    if(!Number.isFinite(v.targetIncome)||v.targetIncome<0)return"Osobní měsíční cíl nemůže být záporný.";
    if(!Number.isFinite(v.businessCosts)||v.businessCosts<0)return"Náklady podnikání nemohou být záporné.";
    if(v.targetIncome+v.businessCosts<=0)return"Zadejte osobní cíl nebo náklady vyšší než nula.";
    if(!Number.isFinite(v.activeMonths)||v.activeMonths<1||v.activeMonths>12)return"Počet aktivních měsíců musí být v rozmezí 1 až 12.";
    if(!Number.isFinite(v.annualInvestments)||v.annualInvestments<0)return"Plánované investice nemohou být záporné.";
    if(!Number.isFinite(v.obligationReserve)||v.obligationReserve<0||v.obligationReserve>=90)return"Rezerva na povinné platby musí být od 0 do méně než 90 %.";
    if(!Number.isFinite(v.safetyReserve)||v.safetyReserve<0||v.safetyReserve>100)return"Provozní polštář musí být v rozmezí 0 až 100 %.";
    if(!Number.isFinite(v.currentBilling)||v.currentBilling<0)return"Současná fakturace nemůže být záporná.";
    if(!Number.isFinite(v.averageInvoice)||v.averageInvoice<0)return"Průměrná faktura nemůže být záporná.";
    if(!Number.isFinite(v.weeksPerMonth)||v.weeksPerMonth<1||v.weeksPerMonth>6)return"Počet fakturačních týdnů musí být v rozmezí 1 až 6.";
    return"";
  }

  function calculate(v,months=v.activeMonths){
    const personalAnnual=v.targetIncome*12,costsAnnual=v.businessCosts*12;
    const annualBase=personalAnnual+costsAnnual+v.annualInvestments;
    const safetyAmount=annualBase*v.safetyReserve/100;
    const beforeObligations=annualBase+safetyAmount;
    const annualTarget=beforeObligations/(1-v.obligationReserve/100);
    const obligationAmount=annualTarget-beforeObligations;
    const activeMonthlyTarget=annualTarget/months;
    const calendarAverage=annualTarget/12;
    const weeklyTarget=activeMonthlyTarget/v.weeksPerMonth;
    const invoiceCount=v.averageInvoice>0?Math.ceil(activeMonthlyTarget/v.averageInvoice):0;
    const currentAnnual=v.currentBilling*12;
    const annualGap=v.currentBilling>0?currentAnnual-annualTarget:0;
    return {...v,months,personalAnnual,costsAnnual,annualBase,safetyAmount,beforeObligations,obligationAmount,annualTarget,activeMonthlyTarget,calendarAverage,weeklyTarget,invoiceCount,currentAnnual,annualGap};
  }

  function insight(r){
    if(r.currentBilling>0&&r.annualGap<0)return{badge:"Roční deficit",title:"Současná fakturace je pod plánem",text:`Při zachování současného průměru chybí za rok přibližně ${money(Math.abs(r.annualGap))}. Rozdíl je potřeba rozdělit mezi cenu, objem zakázek, náklady a počet aktivních měsíců.`,next:"Nejprve ověřte reálnou průměrnou fakturu a kapacitu; teprve potom měňte cenu nebo počet zakázek."};
    if(r.activeMonths>11)return{badge:"Těsný kalendář",title:"Plán téměř nepočítá s výpadkem",text:`Roční cíl rozdělujete mezi ${num(r.activeMonths)} měsíce. Zbývá jen malý prostor na dovolenou, nemoc, sezónnost nebo čekání na podklady.`,next:"Porovnejte v tabulce variantu s deseti nebo jedenácti aktivními měsíci."};
    if(r.activeMonths<8)return{badge:"Koncentrovaný výkon",title:"Málo aktivních měsíců výrazně zvyšuje měsíční cíl",text:`Celý roční plán musí vzniknout během ${num(r.activeMonths)} měsíců. Ověřte, zda potřebný objem zakázek odpovídá kapacitě a sezóně vašeho oboru.`,next:"Zkontrolujte počet průměrných faktur a navazující hodinovou sazbu."};
    return{badge:"Vyvážený roční plán",title:"Aktivní měsíce financují celý rok",text:`Roční minimum ${money(r.annualTarget)} se rozděluje mezi ${num(r.activeMonths)} měsíců s plnou fakturací. Kalendářní průměr je nižší než výkonnostní cíl aktivního měsíce.`,next:"Minimum používejte jako spodní hranici a skutečný obchodní cíl nastavte s rezervou nad ní."};
  }

  function comparison(r){
    const box=$("currentComparison");
    if(!r.currentBilling){box.dataset.state="neutral";set("currentBillingText","Doplňte současnou fakturaci pro porovnání.");return;}
    if(r.annualGap<0){box.dataset.state="warning";set("currentBillingText",`${money(r.currentBilling)} měsíčně vytváří roční deficit ${money(Math.abs(r.annualGap))} proti vypočtenému minimu.`);}
    else{box.dataset.state="good";set("currentBillingText",`${money(r.currentBilling)} měsíčně vytváří roční prostor ${money(r.annualGap)} nad vypočteným minimem.`);}
  }

  function breakdown(r){
    const rows=[["Osobní cíl na rok",r.personalAnnual],["Provozní náklady na rok",r.costsAnnual],["Plánované investice",r.annualInvestments],["Provozní polštář",r.safetyAmount],["Rezerva na povinné platby",r.obligationAmount],["Roční minimum fakturace",r.annualTarget]];
    $("calculationRows").replaceChildren(...rows.map(([label,value])=>{const row=document.createElement("div"),span=document.createElement("span"),strong=document.createElement("strong");span.textContent=label;strong.textContent=money(value);row.append(span,strong);return row;}));
  }

  function scenarios(v){
    const choices=[7,8,9,10,11,12];
    $("scenarioBody").replaceChildren(...choices.map(months=>{const r=calculate(v,months),tr=document.createElement("tr");if(months===Math.round(v.activeMonths))tr.className="is-current";[`${months} měs.`,`${12-months} měs.`,money(r.activeMonthlyTarget),money(r.weeklyTarget),money(r.annualTarget)].forEach(value=>{const td=document.createElement("td");td.textContent=value;tr.append(td);});return tr;}));
  }

  function clear(){["activeMonthlyTarget","annualTarget","calendarAverage","weeklyTarget","invoiceCount"].forEach(id=>set(id,"—"));set("resultStatus","Zkontrolujte zadání");}
  function render(options={}){
    const v=read(),message=validate(v),error=$("billingError");
    if(message){error.hidden=false;error.textContent=message;clear();return false;}
    error.hidden=true;const r=calculate(v),i=insight(r);
    set("activeMonthlyTarget",money(r.activeMonthlyTarget));set("annualTarget",money(r.annualTarget));set("calendarAverage",money(r.calendarAverage));set("weeklyTarget",money(r.weeklyTarget));set("invoiceCount",r.invoiceCount?`${r.invoiceCount} za měsíc`:"Doplňte průměr");
    set("answerSentence",`${num(r.activeMonths)} aktivních měsíců financuje osobní cíl, provoz, investice i zvolené rezervy.`);set("activeMonthsLabel",`${num(r.activeMonths)} z 12 měsíců`);$("activeMonthsFill").style.width=`${r.activeMonths/12*100}%`;set("capacityText",`${num(12-r.activeMonths)} měsíce zůstávají bez požadavku na plnou fakturaci.`);
    set("interpretationBadge",i.badge);set("interpretationTitle",i.title);set("interpretationText",i.text);set("nextStepText",i.next);set("resultStatus","Plán přepočítán");comparison(r);breakdown(r);scenarios(v);
    if(options.scroll&&matchMedia("(max-width:720px)").matches)$("vysledek").scrollIntoView({behavior:"smooth",block:"start"});return true;
  }
  form.addEventListener("submit",event=>{event.preventDefault();render({scroll:true});});
  ids.forEach(id=>{const input=$(id);input.addEventListener("input",()=>render());input.addEventListener("change",()=>render());});
  $("resetBtn").addEventListener("click",()=>{form.reset();render();});render();
})();
