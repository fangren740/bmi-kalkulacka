(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("daysForm");
  if (!form) return;

  const MS_DAY = 86400000;
  const nf = new Intl.NumberFormat("cs-CZ");
  const dateFmt = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  const shortFmt = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
  const weekdayFmt = new Intl.DateTimeFormat("cs-CZ", { weekday: "long" });
  const monthFmt = new Intl.DateTimeFormat("cs-CZ", { month: "short" });
  const pad = (n) => String(n).padStart(2, "0");
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const todayLocal = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const toInput = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const utcDay = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const daysBetween = (a,b) => Math.round((utcDay(b)-utcDay(a))/MS_DAY);
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()+n); return x; };
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth()+1, 0);
  const endOfYear = (d) => new Date(d.getFullYear(), 11, 31);
  const parseDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [y,m,d] = value.split("-").map(Number);
    const x = new Date(y,m-1,d);
    return x.getFullYear()===y && x.getMonth()===m-1 && x.getDate()===d ? x : null;
  };
  const word = (n, one, few, many) => { const x=Math.abs(n); return x===1?one:(x>=2&&x<=4?few:many); };
  const daysLabel = (n) => word(n,"den","dny","dní");
  const weeksLabel = (n) => word(n,"týden","týdny","týdnů");
  const monthsLabel = (n) => word(n,"měsíc","měsíce","měsíců");
  const yearsLabel = (n) => word(n,"rok","roky","let");
  const cap = (s) => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
  const monthCode = (d) => monthFmt.format(d).replace(".","").toUpperCase();

  function addYearsClamped(date, years){
    const y=date.getFullYear()+years, m=date.getMonth(), day=date.getDate();
    const max=new Date(y,m+1,0).getDate();
    return new Date(y,m,Math.min(day,max));
  }
  function addMonthsClamped(date, months){
    const first=new Date(date.getFullYear(),date.getMonth()+months,1);
    const max=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    return new Date(first.getFullYear(),first.getMonth(),Math.min(date.getDate(),max));
  }
  function calendarBreakdown(a,b){
    let start=a, end=b;
    if (start>end) [start,end]=[end,start];
    let years=end.getFullYear()-start.getFullYear();
    if (addYearsClamped(start,years)>end) years--;
    let anchor=addYearsClamped(start,years);
    let months=(end.getFullYear()-anchor.getFullYear())*12 + end.getMonth()-anchor.getMonth();
    if (addMonthsClamped(anchor,months)>end) months--;
    months=Math.max(0,months);
    anchor=addMonthsClamped(anchor,months);
    const days=Math.max(0,daysBetween(anchor,end));
    return {years,months,days};
  }
  function breakdownText(b){
    const parts=[];
    if(b.years) parts.push(`${nf.format(b.years)} ${yearsLabel(b.years)}`);
    if(b.months) parts.push(`${nf.format(b.months)} ${monthsLabel(b.months)}`);
    if(b.days || !parts.length) parts.push(`${nf.format(b.days)} ${daysLabel(b.days)}`);
    return parts.join(" · ");
  }
  function activeStart(){ return parseDate($("startDate").value) || todayLocal(); }
  function updateStartUI(){
    const start=activeStart(), isToday=toInput(start)===toInput(todayLocal());
    set("startAnchorText",isToday?"dnes":"vlastní datum");
    set("startAnchorDate",dateFmt.format(start));
    set("customState",isToday?"Dnes":shortFmt.format(start));
    set("liveStartLabel",isToday?"Počítáme od dneška.":`Počítáme od ${dateFmt.format(start)}.`);
  }
  function monthSegments(start,target){
    let a=start,b=target;
    if(a>b) [a,b]=[b,a];
    if(daysBetween(a,b)===0) return [{date:a,count:0,from:a,to:a}];
    const firstIncluded=addDays(a,1);
    const out=[];
    let cursor=new Date(firstIncluded.getFullYear(), firstIncluded.getMonth(), 1);
    const endMonth=new Date(b.getFullYear(),b.getMonth(),1);
    let guard=0;
    while(cursor<=endMonth && guard<5000){
      const monthStart=new Date(cursor.getFullYear(),cursor.getMonth(),1);
      const monthEnd=new Date(cursor.getFullYear(),cursor.getMonth()+1,0);
      const from=firstIncluded>monthStart?firstIncluded:monthStart;
      const to=b<monthEnd?b:monthEnd;
      if(from<=to) out.push({date:new Date(cursor),count:daysBetween(from,to)+1,from,to});
      cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1); guard++;
    }
    return out;
  }
  function renderMonthRoute(start,target){
    const grid=$("monthRoute"); grid.innerHTML="";
    const segs=monthSegments(start,target);
    const reversed=target<start;
    let visible=segs;
    let hidden=0;
    if(segs.length>12){ visible=[...segs.slice(0,5),...segs.slice(-5)]; hidden=segs.length-visible.length; }
    visible.forEach((seg,idx)=>{
      if(hidden && idx===5){
        const ell=document.createElement("div"); ell.className="dd60-month-card dd60-month-card--ellipsis"; ell.innerHTML=`<span>MEZI</span><strong>+${hidden}</strong><small>dalších měsíců</small>`; grid.appendChild(ell);
      }
      const el=document.createElement("article"); el.className="dd60-month-card";
      const label=cap(new Intl.DateTimeFormat("cs-CZ",{month:"long"}).format(seg.date));
      el.innerHTML=`<span>${seg.date.getFullYear()}</span><strong>${label}</strong><b>${nf.format(seg.count)} ${daysLabel(seg.count)}</b><small>${shortFmt.format(seg.from)} → ${shortFmt.format(seg.to)}</small>`;
      grid.appendChild(el);
    });
    set("routeStart",shortFmt.format(start)); set("routeTarget",shortFmt.format(target));
    set("routeNote",reversed?"Cílové datum leží před počátkem. Měsíční mapa je proto zobrazena chronologicky od staršího data k novějšímu.":"Měsíční karty rozdělují hlavní kalendářní vzdálenost: počáteční den je vynechaný, cílový den zahrnutý.");
  }
  function renderWeekBlocks(total){
    const wrap=$("weekBlocks"); wrap.innerHTML="";
    const full=Math.floor(total/7), rem=total%7;
    const show=Math.min(full,7);
    for(let i=0;i<show;i++){ const s=document.createElement("i"); s.className="is-full"; wrap.appendChild(s); }
    if(full>7){ const e=document.createElement("b"); e.textContent=`+${full-7}`; wrap.appendChild(e); }
    if(rem){ const s=document.createElement("i"); s.className="is-rem"; s.style.setProperty("--fill",`${rem/7*100}%`); wrap.appendChild(s); }
    if(!full&&!rem){ const s=document.createElement("i"); s.className="is-zero"; wrap.appendChild(s); }
  }
  function render(){
    const start=activeStart(), target=parseDate($("targetDate").value);
    updateStartUI();
    if(!target){ $("formError").hidden=false; $("formError").textContent="Vyberte platné cílové datum."; return false; }
    $("formError").hidden=true;
    const signed=daysBetween(start,target), total=Math.abs(signed), inclusive=total+1;
    const fullWeeks=Math.floor(total/7), rem=total%7, cal=calendarBreakdown(start,target), calText=breakdownText(cal);
    const future=signed>0, past=signed<0;
    const title=future?"Datum přijde za":past?"Od data uplynulo":"Je to právě dnes";
    set("resultTitle",title); set("resultBadge",future?"budoucí datum":past?"minulé datum":"stejný den");
    set("daysResult",nf.format(total)); set("daysWord",daysLabel(total));
    set("resultSentence",future?`${dateFmt.format(target)} je za ${nf.format(total)} ${daysLabel(total)} od ${dateFmt.format(start)}.`:past?`${dateFmt.format(target)} bylo před ${nf.format(total)} ${daysLabel(total)} vzhledem k ${dateFmt.format(start)}.`:`${dateFmt.format(target)} je stejné datum jako počáteční den.`);
    set("weeksResult",`${nf.format(fullWeeks)} ${weeksLabel(fullWeeks)}${rem?` + ${rem} ${daysLabel(rem)}`:" přesně"}`);
    set("calendarBreak",calText); set("inclusiveDays",nf.format(inclusive)); set("targetWeekday",weekdayFmt.format(target)); set("fullWeeks",nf.format(fullWeeks)); set("weekRemainder",nf.format(rem));
    renderWeekBlocks(total); renderMonthRoute(start,target);
    set("heroMode","ŽIVĚ"); set("heroStartDay",pad(start.getDate())); set("heroStartMonth",monthCode(start)); set("heroStartWeekday",weekdayFmt.format(start)); set("heroTargetDay",pad(target.getDate())); set("heroTargetMonth",monthCode(target)); set("heroTargetWeekday",weekdayFmt.format(target)); set("heroDays",nf.format(total)); set("heroWeeks",`${fullWeeks} + ${rem} ${daysLabel(rem)}`); set("heroCalendar",calText);
    return true;
  }
  function setPreset(type){
    const start=activeStart(); let target;
    if(type==="tomorrow") target=addDays(start,1);
    if(type==="week") target=addDays(start,7);
    if(type==="month") target=addDays(start,30);
    if(type==="month-end") target=endOfMonth(start);
    if(type==="year-end") target=endOfYear(start);
    if(target){ $("targetDate").value=toInput(target); render(); }
  }
  function reset(){
    const today=todayLocal(); $("startDate").value=toInput(today); $("targetDate").value=toInput(addDays(today,30)); $("customStart").open=false; render();
  }

  const today=todayLocal(); $("startDate").value=toInput(today); $("targetDate").value=toInput(addDays(today,30));
  form.addEventListener("submit",(e)=>{ e.preventDefault(); if(render() && matchMedia("(max-width:880px)").matches) $("vysledek").scrollIntoView({behavior:"smooth",block:"start"}); });
  ["startDate","targetDate"].forEach(id=>{ $(id).addEventListener("input",render); $(id).addEventListener("change",render); });
  document.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>setPreset(btn.dataset.preset)));
  $("todayBtn").addEventListener("click",()=>{ $("startDate").value=toInput(todayLocal()); render(); });
  $("swapBtn").addEventListener("click",()=>{ const a=$("startDate").value,b=$("targetDate").value; $("startDate").value=b; $("targetDate").value=a; $("customStart").open=true; render(); });
  $("resetBtn").addEventListener("click",reset);
  $("copyBtn").addEventListener("click",async()=>{
    const start=activeStart(), target=parseDate($("targetDate").value); if(!target) return;
    const total=Math.abs(daysBetween(start,target)); const full=Math.floor(total/7), rem=total%7;
    const text=`Kalendářní rozdíl: ${nf.format(total)} ${daysLabel(total)} (${full} ${weeksLabel(full)}${rem?` + ${rem} ${daysLabel(rem)}`:""}) mezi ${dateFmt.format(start)} a ${dateFmt.format(target)}.`;
    try{ await navigator.clipboard.writeText(text); $("copyBtn").textContent="Zkopírováno"; setTimeout(()=>$("copyBtn").textContent="Zkopírovat stručný výsledek",1400); }catch(_){ $("copyBtn").textContent="Kopírování není dostupné"; }
  });
  const menu=$("menuBtn"), mobile=$("mobile-nav"); if(menu&&mobile){ menu.addEventListener("click",()=>{ const on=menu.getAttribute("aria-expanded")==="true"; menu.setAttribute("aria-expanded",String(!on)); mobile.classList.toggle("is-open",!on); }); document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu.setAttribute("aria-expanded","false");mobile.classList.remove("is-open");}}); }
  render();
})();
