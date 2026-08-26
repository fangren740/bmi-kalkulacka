(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("ageForm");
  if (!form) return;
  const MS_DAY = 86400000;
  const nf = new Intl.NumberFormat("cs-CZ");
  const df = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  const weekday = new Intl.DateTimeFormat("cs-CZ", { weekday: "long" });
  const pad = (n) => String(n).padStart(2, "0");
  const todayLocal = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const inputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const utcDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const daysBetween = (a,b) => Math.round((utcDay(b)-utcDay(a))/MS_DAY);
  const parseDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [y,m,d] = value.split("-").map(Number); const x = new Date(y,m-1,d);
    return x.getFullYear()===y && x.getMonth()===m-1 && x.getDate()===d ? x : null;
  };
  const leap = (y) => y%4===0 && (y%100!==0 || y%400===0);
  function anniversary(birth, year, rule){
    if (birth.getMonth()===1 && birth.getDate()===29 && !leap(year)) return rule==="mar1" ? new Date(year,2,1) : new Date(year,1,28);
    return new Date(year,birth.getMonth(),birth.getDate());
  }
  function addMonthsClamped(date, months){
    const first = new Date(date.getFullYear(), date.getMonth()+months, 1);
    const max = new Date(first.getFullYear(), first.getMonth()+1, 0).getDate();
    return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), max));
  }
  function breakdown(birth,target,rule){
    let years = target.getFullYear()-birth.getFullYear();
    if (anniversary(birth,birth.getFullYear()+years,rule)>target) years--;
    const lastBirthday = anniversary(birth,birth.getFullYear()+years,rule);
    let months = (target.getFullYear()-lastBirthday.getFullYear())*12 + target.getMonth()-lastBirthday.getMonth();
    if (addMonthsClamped(lastBirthday,months)>target) months--;
    months=Math.max(0,Math.min(11,months));
    const anchor=addMonthsClamped(lastBirthday,months);
    const days=daysBetween(anchor,target);
    return {years,months,days,lastBirthday,anchor};
  }
  function nextBirthday(birth,target,rule){
    let date=anniversary(birth,target.getFullYear(),rule);
    if (date<target) date=anniversary(birth,target.getFullYear()+1,rule);
    return {date,days:daysBetween(target,date)};
  }
  function fromUtcMillis(ms){ const d=new Date(ms); return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()); }
  function addCalendarDays(date,days){ return fromUtcMillis(utcDay(date)+days*MS_DAY); }
  function word(n,one,few,many){ const a=Math.abs(n); if(a===1)return one; if(a>=2&&a<=4)return few; return many; }
  const set=(id,v)=>{ const el=$(id); if(el) el.textContent=v; };
  const fnum=(n)=>nf.format(n);
  function setIdle(){
    $("idleState").hidden=false; $("resultState").hidden=true; $("formError").hidden=true;
    set("heroMode","UKÁZKA"); set("heroYears","32"); set("heroYearsUnit","let"); set("heroMonths","4"); set("heroDays","12"); set("heroNext","za 198 dní"); set("heroTotal","11 822");
    set("mileBirthday","Zadejte datum"); set("mileBirthdayMeta","—"); set("mileRound","—"); set("mileRoundMeta","—"); set("mileDays","—"); set("mileDaysMeta","—");
  }
  function invalid(message){
    $("formError").hidden=false; $("formError").textContent=message; $("idleState").hidden=false; $("resultState").hidden=true;
  }
  function render(){
    const birth=parseDate($("birthDate").value); const target=parseDate($("targetDate").value); const rule=$("feb29Rule").value;
    if(!birth){ setIdle(); return false; }
    if(!target){ invalid("Vyberte platné cílové datum."); return false; }
    if(birth>target){ invalid("Datum narození nemůže být pozdější než cílové datum."); return false; }
    $("formError").hidden=true; $("idleState").hidden=true; $("resultState").hidden=false;
    const age=breakdown(birth,target,rule); const totalDays=daysBetween(birth,target); const fullWeeks=Math.floor(totalDays/7); const remWeek=totalDays%7; const totalMonths=age.years*12+age.months; const next=nextBirthday(birth,target,rule); const nextAge=next.days===0?age.years:age.years+1;
    const exact=`${age.years} ${word(age.years,"rok","roky","let")}, ${age.months} ${word(age.months,"měsíc","měsíce","měsíců")} a ${age.days} ${word(age.days,"den","dny","dní")}`;
    set("yearsResult",fnum(age.years)); set("yearsWord",word(age.years,"rok","roky","let")); set("monthsResult",fnum(age.months)); set("monthsWord",word(age.months,"měsíc","měsíce","měsíců")); set("daysResult",fnum(age.days)); set("daysWord",word(age.days,"den","dny","dní"));
    set("exactSentence",`K datu ${df.format(target)} je přesný kalendářní věk ${exact}.`); set("totalDays",fnum(totalDays)); set("totalWeeks",`${fnum(fullWeeks)} týd. + ${remWeek} d.`); set("birthWeekday",weekday.format(birth)); set("totalMonths",fnum(totalMonths));
    const targetIsToday = inputDate(target)===inputDate(todayLocal()); set("resultBadge",targetIsToday?"K dnešnímu dni":"K vybranému datu");
    const nextText=next.days===0?"narozeniny jsou dnes":`za ${fnum(next.days)} ${word(next.days,"den","dny","dní")}`; set("nextBirthdayCountdown",nextText); set("nextBirthdayDate",`${df.format(next.date)} · ${weekday.format(next.date)} · věk ${nextAge}`);
    const following=anniversary(birth,birth.getFullYear()+age.years+1,rule); const span=Math.max(1,daysBetween(age.lastBirthday,following)); const elapsed=Math.max(0,daysBetween(age.lastBirthday,target)); const progress=Math.max(0,Math.min(1,elapsed/span)); $("railProgress").style.width=`${(progress*100).toFixed(2)}%`; $("railBirthday").style.left=`${(progress*100).toFixed(2)}%`; set("railBirth",df.format(age.lastBirthday)); set("railTarget",df.format(target)); set("railCaption",next.days===0?"Dnes začíná nový rok věku.":`Od posledních narozenin uplynulo ${fnum(elapsed)} dní.`);
    const remainingFrac=next.days/span; const pct=Math.max(0,Math.min(100,Math.round((1-remainingFrac)*100))); $("countdownPct").textContent=`${pct} %`; $("countdownPct").parentElement.style.setProperty("--ring",`${pct*3.6}deg`);
    set("heroMode","ŽIVĚ"); set("heroYears",fnum(age.years)); set("heroYearsUnit",word(age.years,"rok","roky","let")); set("heroMonths",fnum(age.months)); set("heroDays",fnum(age.days)); set("heroNext",next.days===0?"právě dnes":`za ${fnum(next.days)} dní`); set("heroTotal",fnum(totalDays));
    set("mileBirthday",df.format(next.date)); set("mileBirthdayMeta",next.days===0?`Dnes začíná věk ${nextAge}.`:`${weekday.format(next.date)} · za ${fnum(next.days)} dní · věk ${nextAge}`);
    const roundAge=Math.ceil((age.years+1)/10)*10; const roundDate=anniversary(birth,birth.getFullYear()+roundAge,rule); const roundDays=daysBetween(target,roundDate); set("mileRound",`${roundAge}. narozeniny`); set("mileRoundMeta",`${df.format(roundDate)} · za ${fnum(roundDays)} dní`);
    const milestone=Math.ceil((totalDays+1)/5000)*5000; const milestoneDate=addCalendarDays(birth,milestone); const milestoneLeft=milestone-totalDays; set("mileDays",`${fnum(milestone)} dní života`); set("mileDaysMeta",`${df.format(milestoneDate)} · za ${fnum(milestoneLeft)} dní`);
    return true;
  }
  $("targetDate").value=inputDate(todayLocal());
  form.addEventListener("submit",(e)=>{e.preventDefault(); if(render() && matchMedia("(max-width:880px)").matches) $("vysledek").scrollIntoView({behavior:"smooth",block:"start"});});
  ["birthDate","targetDate","feb29Rule"].forEach(id=>{ $(id).addEventListener("input",render); $(id).addEventListener("change",render); });
  $("todayBtn").addEventListener("click",()=>{ $("targetDate").value=inputDate(todayLocal()); render(); });
  $("resetBtn").addEventListener("click",()=>{ $("birthDate").value=""; $("targetDate").value=inputDate(todayLocal()); $("feb29Rule").value="feb28"; $("advanced").open=false; setIdle(); $("birthDate").focus(); });
  $("copyBtn").addEventListener("click",async()=>{
    if($("resultState").hidden) return; const text=`Přesný věk: ${$("yearsResult").textContent} ${$("yearsWord").textContent}, ${$("monthsResult").textContent} ${$("monthsWord").textContent} a ${$("daysResult").textContent} ${$("daysWord").textContent}. Dnů života: ${$("totalDays").textContent}. Další narozeniny: ${$("nextBirthdayCountdown").textContent}.`;
    try{ await navigator.clipboard.writeText(text); $("copyBtn").textContent="Zkopírováno"; setTimeout(()=>$("copyBtn").textContent="Zkopírovat stručný výsledek",1400); }catch(_){ $("copyBtn").textContent="Kopírování není dostupné"; }
  });
  const menu=$("menuBtn"), mobile=$("mobile-nav"); if(menu&&mobile){ menu.addEventListener("click",()=>{ const on=menu.getAttribute("aria-expanded")==="true"; menu.setAttribute("aria-expanded",String(!on)); mobile.classList.toggle("is-open",!on); }); document.addEventListener("keydown",e=>{ if(e.key==="Escape"){menu.setAttribute("aria-expanded","false");mobile.classList.remove("is-open");}}); }
  setIdle();
})();
