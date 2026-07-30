(()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const form=$("vatForm");
  if(!form)return;

  const moneyFormatter=new Intl.NumberFormat("cs-CZ",{style:"currency",currency:"CZK",minimumFractionDigits:2,maximumFractionDigits:2});
  const numberFormatter=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2});
  const money=value=>moneyFormatter.format(Number.isFinite(value)?value:0);
  const percent=value=>`${numberFormatter.format(Number.isFinite(value)?value:0)} %`;
  const text=(id,value)=>{const el=$(id);if(el)el.textContent=value};

  const amount=$("amount");
  const rate=$("rate");
  const error=$("vatError");
  const rows=$("invoiceRows");
  let toolMode="single";
  let direction="with";
  let rowId=0;

  const presets={
    receipt:{amount:1210,rate:21,direction:"with"},
    invoice:{amount:10000,rate:21,direction:"without"},
    reduced:{amount:1120,rate:12,direction:"with"}
  };

  function calculateSingle(input){
    if(input.direction==="with"){
      const base=input.amount/(1+input.rate/100);
      return{base,tax:input.amount-base,gross:input.amount};
    }
    const tax=input.amount*input.rate/100;
    return{base:input.amount,tax,gross:input.amount+tax};
  }

  function readSingle(){
    return{amount:Number(amount.value),rate:Number(rate.value),direction};
  }

  function validateSingle(input){
    if(!Number.isFinite(input.amount)||input.amount<0)return"Zadejte částku nula nebo vyšší.";
    if(![21,12].includes(input.rate))return"Zvolte sazbu 21 % nebo 12 %.";
    return"";
  }

  function renderSingle(){
    const input=readSingle();
    const message=validateSingle(input);
    if(message){
      error.hidden=false;
      error.textContent=message;
      return null;
    }
    error.hidden=true;
    const result=calculateSingle(input);
    const share=result.gross?result.tax/result.gross*100:0;
    const isWith=input.direction==="with";

    text("resultModeLabel","Jedna částka");
    text("statusBadge",isWith?"Rozkládáte konečnou cenu":"Tvoříte konečnou cenu");
    text("primaryLabel","Cena s DPH");
    text("withDPH",money(result.gross));
    text("withoutDPH",money(result.base));
    text("dph",money(result.tax));
    text("selectedRate",percent(input.rate));
    text("taxShare",percent(share));
    text("thirdMetricLabel","Zvolená sazba");
    text("fourthMetricLabel","Podíl daně z ceny");
    text("resultSentence",isWith?"Z konečné ceny oddělujeme základ a daň.":"K základu přičítáme daň a získáváme cenu pro zákazníka.");
    text("decisionHeadline",isWith?"Z konečné ceny jsme oddělili daň":"K základu jsme přičetli DPH");
    text("decisionText",isWith?`Z částky ${money(input.amount)} tvoří základ ${money(result.base)} a samotná DPH ${money(result.tax)}.`:`K základu ${money(input.amount)} se přidává DPH ${money(result.tax)} a konečná cena činí ${money(result.gross)}.`);
    text("nextStepText",isWith?"Pro marži a cenotvorbu plátce pracujte se základem bez DPH.":"Před použitím ceny ověřte správnou sazbu konkrétního plnění.");

    text("heroGross",money(result.gross));
    text("heroBase",money(result.base));
    text("heroTax",money(result.tax));
    text("heroRate",percent(input.rate));
    text("heroModeLabel",isWith?`z konečné ceny při sazbě ${input.rate} %`:`ze základu při sazbě ${input.rate} %`);
    text("heroMessage",`Daň tvoří přibližně ${percent(share)} konečné ceny, nikoli ${input.rate} % konečné ceny.`);
    $("heroBaseBar").style.width=`${Math.max(0,100-share)}%`;
    $("heroTaxBar").style.width=`${Math.max(0,share)}%`;

    renderRateComparison(input);
    return result;
  }

  function renderRateComparison(input){
    const root=$("rateComparison");
    root.replaceChildren();
    [21,12].forEach(currentRate=>{
      const result=calculateSingle({...input,rate:currentRate});
      const card=document.createElement("article");
      card.innerHTML=`<span>Sazba ${currentRate} %</span><strong>${money(result.gross)}</strong><small>DPH ${money(result.tax)} · základ ${money(result.base)}</small>`;
      root.appendChild(card);
    });
  }

  function addRow(data={description:"Položka",price:1000,quantity:1,rate:21}){
    rowId+=1;
    const row=document.createElement("tr");
    row.dataset.row=String(rowId);
    row.innerHTML=`
      <td data-label="Položka"><input class="desc" value="${data.description}" aria-label="Název položky"></td>
      <td data-label="Cena bez DPH"><input class="row-price" type="number" min="0" step="0.01" value="${data.price}" inputmode="decimal" aria-label="Cena bez DPH za jednotku"></td>
      <td data-label="Počet"><input class="row-quantity" type="number" min="0.01" step="0.01" value="${data.quantity}" inputmode="decimal" aria-label="Množství"></td>
      <td data-label="Sazba"><select class="row-rate" aria-label="Sazba DPH"><option value="21"${data.rate===21?" selected":""}>21 %</option><option value="12"${data.rate===12?" selected":""}>12 %</option></select></td>
      <td class="row-tax" data-label="DPH">0 Kč</td>
      <td class="row-gross" data-label="Celkem">0 Kč</td>
      <td class="row-action"><button class="remove-row" type="button" aria-label="Odebrat položku">×</button></td>`;
    row.querySelectorAll("input,select").forEach(control=>{
      control.addEventListener("input",renderInvoice);
      control.addEventListener("change",renderInvoice);
    });
    row.querySelector(".remove-row").addEventListener("click",()=>{row.remove();renderInvoice();});
    rows.appendChild(row);
    renderInvoice();
  }

  function readInvoice(){
    let base=0,tax=0,gross=0,count=0;
    rows.querySelectorAll("tr").forEach(row=>{
      const price=Number(row.querySelector(".row-price").value);
      const quantity=Number(row.querySelector(".row-quantity").value);
      const currentRate=Number(row.querySelector(".row-rate").value);
      if(!Number.isFinite(price)||!Number.isFinite(quantity)||price<0||quantity<=0)return;
      const rowBase=price*quantity;
      const rowTax=rowBase*currentRate/100;
      const rowGross=rowBase+rowTax;
      base+=rowBase;
      tax+=rowTax;
      gross+=rowGross;
      count+=1;
      row.querySelector(".row-tax").textContent=money(rowTax);
      row.querySelector(".row-gross").textContent=money(rowGross);
    });
    return{base,tax,gross,count};
  }

  function renderInvoice(){
    const result=readInvoice();
    const share=result.gross?result.tax/result.gross*100:0;
    text("invoiceCount",`${result.count} ${result.count===1?"položka":result.count>=2&&result.count<=4?"položky":"položek"}`);
    text("invoiceBase",money(result.base));
    text("invoiceTax",money(result.tax));
    text("invoiceGross",money(result.gross));
    if(toolMode!=="invoice")return result;

    text("resultModeLabel","Více položek");
    text("statusBadge","Součet dokladu");
    text("primaryLabel","Celkem s DPH");
    text("withDPH",money(result.gross));
    text("withoutDPH",money(result.base));
    text("dph",money(result.tax));
    text("thirdMetricLabel","Počet položek");
    text("selectedRate",String(result.count));
    text("fourthMetricLabel","Podíl daně z ceny");
    text("taxShare",percent(share));
    text("resultSentence","Položky se počítají samostatně a teprve potom sečtou.");
    text("decisionHeadline","Doklad drží sazby odděleně");
    text("decisionText",`Součet základů činí ${money(result.base)}, daň ${money(result.tax)} a konečná cena ${money(result.gross)}.`);
    text("nextStepText","Před vystavením dokladu zkontrolujte sazbu, zaokrouhlení a náležitosti účetního systému.");

    text("heroGross",money(result.gross));
    text("heroBase",money(result.base));
    text("heroTax",money(result.tax));
    text("heroRate","Faktura");
    text("heroModeLabel",`${result.count} položek s oddělenými sazbami`);
    text("heroMessage","Celková daň vzniká součtem daně z jednotlivých řádků.");
    $("heroBaseBar").style.width=`${Math.max(0,100-share)}%`;
    $("heroTaxBar").style.width=`${Math.max(0,share)}%`;
    return result;
  }

  function setToolMode(mode){
    toolMode=mode;
    $("singlePanel").hidden=mode!=="single";
    $("invoicePanel").hidden=mode!=="invoice";
    $("singleComparison").hidden=mode!=="single";
    $("invoiceSummary").hidden=mode!=="invoice";
    document.querySelectorAll("[data-tool-mode]").forEach(button=>{
      const active=button.dataset.toolMode===mode;
      button.classList.toggle("is-active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    if(mode==="single")renderSingle();else renderInvoice();
  }

  function setDirection(next){
    direction=next;
    document.querySelectorAll("[data-vat-direction]").forEach(button=>{
      const active=button.dataset.vatDirection===next;
      button.classList.toggle("is-active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    text("amountLabel",next==="with"?"Cena včetně DPH":"Cena bez DPH");
    text("amountHelp",next==="with"?"Konečná částka, kterou zákazník zaplatil.":"Základ daně, ke kterému chcete DPH přičíst.");
    renderSingle();
  }

  function applyPreset(name){
    const preset=presets[name];
    if(!preset)return;
    amount.value=String(preset.amount);
    rate.value=String(preset.rate);
    document.querySelectorAll("[data-preset]").forEach(button=>button.classList.toggle("is-active",button.dataset.preset===name));
    setDirection(preset.direction);
  }

  function reset(){
    if(toolMode==="single"){
      applyPreset("receipt");
    }else{
      rows.replaceChildren();
      addRow({description:"Produkt",price:1000,quantity:2,rate:21});
      addRow({description:"Kniha",price:500,quantity:1,rate:12});
      renderInvoice();
    }
  }

  form.addEventListener("submit",event=>{
    event.preventDefault();
    const valid=toolMode==="single"?renderSingle():renderInvoice();
    if(valid&&matchMedia("(max-width:760px)").matches)$("vysledek").scrollIntoView({behavior:"smooth",block:"start"});
  });
  amount.addEventListener("input",renderSingle);
  amount.addEventListener("change",renderSingle);
  rate.addEventListener("input",renderSingle);
  rate.addEventListener("change",renderSingle);
  document.querySelectorAll("[data-tool-mode]").forEach(button=>button.addEventListener("click",()=>setToolMode(button.dataset.toolMode)));
  document.querySelectorAll("[data-vat-direction]").forEach(button=>button.addEventListener("click",()=>setDirection(button.dataset.vatDirection)));
  document.querySelectorAll("[data-preset]").forEach(button=>button.addEventListener("click",()=>applyPreset(button.dataset.preset)));
  $("addInvoiceRow").addEventListener("click",()=>addRow());
  $("clearInvoiceRows").addEventListener("click",()=>{rows.replaceChildren();renderInvoice();});
  $("resetBtn").addEventListener("click",reset);

  addRow({description:"Produkt",price:1000,quantity:2,rate:21});
  addRow({description:"Kniha",price:500,quantity:1,rate:12});
  applyPreset("receipt");
  setToolMode("single");
})();
