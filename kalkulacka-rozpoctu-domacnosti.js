(() => {
  "use strict";
  const form = document.querySelector("#budgetForm"); if (!form) return;
  const el = id => document.getElementById(id);
  const inputs = { income:el("budgetIncome"), fixed:el("fixedExpenses"), variable:el("variableExpenses"), annual:el("annualExpenses"), savings:el("currentSavings"), target:el("reserveMonths") };
  const value = input => Number(String(input.value).replace(",", "."));
  const money = new Intl.NumberFormat("cs-CZ",{style:"currency",currency:"CZK",maximumFractionDigits:0});
  const number = new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:1});
  const czk = n => money.format(Math.round(n)); const pct = n => `${number.format(n)} %`;
  const set = (id,text) => { el(id).textContent=text; };

  function validate(d){
    if(!Number.isFinite(d.income)||d.income<=0||d.income>100000000)return "Čistý příjem musí být vyšší než 0 Kč.";
    for(const key of ["fixed","variable","annual","savings"]){if(!Number.isFinite(d[key])||d[key]<0||d[key]>1000000000)return "Výdaje ani úspory nesmí být záporné.";}
    if(!Number.isInteger(d.target)||d.target<1||d.target>24)return "Cíl rezervy musí být celé číslo od 1 do 24 měsíců.";
    return "";
  }
  function classify(surplus,income,runway){
    const rate=surplus/income*100;
    if(surplus<0)return {badge:"Schodek",title:"Rozpočet každý měsíc spotřebovává úspory",text:"Nejdříve zastavte pravidelný schodek. Rozdělte výdaje podle nutnosti a řešte největší opakované položky."};
    if(rate<5)return {badge:"Těsný rozpočet",title:"Malý výkyv může měsíční bilanci převrátit",text:"Přebytek je kladný, ale omezený. Nepravidelné výdaje a tvorbu rezervy plánujte jako pravidelnou položku."};
    if(runway<3)return {badge:"Budujte rezervu",title:"Bilance je kladná, likvidní polštář je zatím nízký",text:"Směřujte část přebytku do snadno dostupné rezervy, dokud nepokryje zvolený počet měsíců výdajů."};
    return {badge:"Stabilnější rozpočet",title:"Rozpočet vytváří prostor pro rezervu a cíle",text:"Pravidelně kontrolujte skutečné výdaje a rozdělte přebytek mezi rezervu, očekávané cíle a dlouhodobé priority."};
  }
  function scenario(label,income,expenses,current){const surplus=income-expenses;return `<tr class="${current?"is-current":""}"><td>${label}</td><td>${czk(income)}</td><td>${czk(expenses)}</td><td class="${surplus<0?"is-negative":""}">${czk(surplus)}</td></tr>`;}
  function render(){
    const d=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,value(v)])); const error=validate(d);
    if(error){el("budgetError").hidden=false;set("budgetError",error);["balanceResult","expensesResult","savingsRateResult","runwayResult","reserveTargetResult","reserveGapResult"].forEach(id=>set(id,"—"));return;}
    el("budgetError").hidden=true;
    const irregular=d.annual/12,total=d.fixed+d.variable+irregular,balance=d.income-total,rate=balance/d.income*100,expenseRate=total/d.income*100,runway=total>0?d.savings/total:Infinity,target=total*d.target,gap=Math.max(0,target-d.savings),monthsToTarget=balance>0?Math.ceil(gap/balance):Infinity,annualBalance=balance*12;
    set("balanceResult",czk(balance));set("expensesResult",czk(total));set("savingsRateResult",pct(rate));set("runwayResult",Number.isFinite(runway)?`${number.format(runway)} měs.`:"Bez výdajů");set("reserveTargetResult",czk(target));set("reserveGapResult",czk(gap));set("fixedShareResult",pct(d.fixed/d.income*100));set("annualBalanceResult",czk(annualBalance));
    set("answerSentence",`Po započtení ${czk(irregular)} měsíčně na nepravidelné platby domácnosti ${balance>=0?"zbývá":"chybí"} ${czk(Math.abs(balance))}.`);
    el("balanceResult").classList.toggle("is-negative",balance<0);el("balanceFill").style.width=`${Math.min(100,Math.max(0,expenseRate))}%`;set("balanceShare",`${pct(expenseRate)} příjmu spotřebují modelované výdaje.`);
    const c=classify(balance,d.income,runway);set("interpretationBadge",c.badge);set("interpretationTitle",c.title);set("interpretationText",c.text);set("nextStepText",gap===0?"Zvolený cíl rezervy je podle zadaných úspor pokrytý.":Number.isFinite(monthsToTarget)?`Při ukládání celého přebytku by do cíle zbývalo přibližně ${monthsToTarget} měsíců.`:"Bez kladného přebytku se rezerva sama nedoplňuje.");
    el("budgetScenarioBody").innerHTML=[scenario("Příjem −10 %",d.income*.9,total,false),scenario("Základní plán",d.income,total,true),scenario("Výdaje +10 %",d.income,total*1.1,false)].join("");
    const categories=[{name:"Fixní výdaje",value:d.fixed},{name:"Proměnlivé výdaje",value:d.variable},{name:"Nepravidelné / měsíc",value:irregular}];
    el("categoryRows").innerHTML=categories.map(x=>`<div><span>${x.name}</span><b>${czk(x.value)}</b><i><em style="width:${total?Math.min(100,x.value/total*100):0}%"></em></i><small>${total?pct(x.value/total*100):"0 %"} výdajů</small></div>`).join("");
    set("heroBalance",czk(balance));set("heroStatus",c.badge);set("heroIncome",czk(d.income));set("heroExpenses",czk(total));set("heroRunway",Number.isFinite(runway)?`${number.format(runway)} měs.`:"—");
  }
  form.addEventListener("input",render);form.addEventListener("submit",e=>{e.preventDefault();render();el("vysledek").scrollIntoView({behavior:"smooth",block:"start"});});el("resetBudget").addEventListener("click",()=>{form.reset();render();});render();
})();
