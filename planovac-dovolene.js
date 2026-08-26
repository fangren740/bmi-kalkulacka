(() => {
  "use strict";
  const MS=86400000;
  const CZ_MONTHS=["leden","únor","březen","duben","květen","červen","červenec","srpen","září","říjen","listopad","prosinec"];
  const CZ_MONTHS_GEN=["ledna","února","března","dubna","května","června","července","srpna","září","října","listopadu","prosince"];
  const CZ_WEEK=["Ne","Po","Út","St","Čt","Pá","So"];
  const DISTRICT_GROUPS=[
    ["Mladá Boleslav","Příbram","Tábor","Prachatice","Strakonice","Ústí nad Labem","Chomutov","Most","Jičín","Rychnov nad Kněžnou","Olomouc","Šumperk","Opava","Jeseník"],
    ["Benešov","Beroun","Rokycany","České Budějovice","Český Krumlov","Klatovy","Trutnov","Pardubice","Chrudim","Svitavy","Ústí nad Orlicí","Ostrava-město","Prostějov"],
    ["Praha 1 až 5","Blansko","Brno-město","Brno-venkov","Břeclav","Hodonín","Vyškov","Znojmo","Domažlice","Tachov","Louny","Karviná"],
    ["Praha 6 až 10","Cheb","Karlovy Vary","Sokolov","Nymburk","Jindřichův Hradec","Litoměřice","Děčín","Přerov","Frýdek-Místek"],
    ["Kroměříž","Uherské Hradiště","Vsetín","Zlín","Praha-východ","Praha-západ","Mělník","Rakovník","Plzeň-město","Plzeň-sever","Plzeň-jih","Hradec Králové","Teplice","Nový Jičín"],
    ["Česká Lípa","Jablonec nad Nisou","Liberec","Semily","Havlíčkův Brod","Jihlava","Pelhřimov","Třebíč","Žďár nad Sázavou","Kladno","Kolín","Kutná Hora","Písek","Náchod","Bruntál"]
  ];
  const SPRING={
    2026:["2026-02-02","2026-02-09","2026-02-16","2026-02-23","2026-03-02","2026-03-09"],
    2027:["2027-02-08","2027-02-15","2027-02-22","2027-03-01","2027-03-08","2027-02-01"],
    2028:["2028-02-21","2028-02-28","2028-03-06","2028-03-13","2028-02-07","2028-02-14"]
  };
  const SCHOOL={
    2026:[["2026-01-01","2026-01-02","Vánoční prázdniny"],["2026-01-30","2026-01-30","Pololetní prázdniny"],["2026-04-02","2026-04-02","Velikonoční prázdniny"],["2026-06-27","2026-08-31","Hlavní prázdniny"],["2026-10-29","2026-10-30","Podzimní prázdniny"],["2026-12-23","2026-12-31","Vánoční prázdniny"]],
    2027:[["2027-01-01","2027-01-03","Vánoční prázdniny"],["2027-01-29","2027-01-29","Pololetní prázdniny"],["2027-03-25","2027-03-25","Velikonoční prázdniny"],["2027-07-01","2027-08-31","Hlavní prázdniny"],["2027-10-27","2027-10-29","Podzimní prázdniny"],["2027-12-23","2027-12-31","Vánoční prázdniny"]],
    2028:[["2028-01-01","2028-01-02","Vánoční prázdniny"],["2028-02-04","2028-02-04","Pololetní prázdniny"],["2028-04-13","2028-04-13","Velikonoční prázdniny"],["2028-07-01","2028-09-03","Hlavní prázdniny"]]
  };
  const $=id=>document.getElementById(id);
  const all=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const pad=n=>String(n).padStart(2,"0");
  const utc=(y,m,d)=>new Date(Date.UTC(y,m,d));
  const iso=d=>`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  const add=(d,n)=>new Date(d.getTime()+n*MS);
  const diff=(a,b)=>Math.round((b-a)/MS);
  const parse=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?utc(+m[1],+m[2]-1,+m[3]):null};
  const fmt=d=>`${d.getUTCDate()}. ${CZ_MONTHS_GEN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const short=d=>`${CZ_WEEK[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth()+1}.`;
  const today=()=>{const d=new Date();return utc(d.getFullYear(),d.getMonth(),d.getDate())};
  const currentYear=today().getUTCFullYear();
  const state={year:Math.max(2026,Math.min(2035,currentYear)),budget:20,profile:"balanced",minBreak:4,maxBreak:18,months:new Set(Array.from({length:12},(_,i)=>i)),school:false,district:"Benešov",exceptions:[],active:"annual",mobileMonth:0,plans:null,ctx:null};

  function easter(year){let a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31)-1,day=(h+l-7*m+114)%31+1;return utc(year,month,day)}
  function holidays(year){
    const map=new Map();
    [[0,1,"Nový rok / Den obnovy samostatného českého státu"],[4,1,"Svátek práce"],[4,8,"Den vítězství"],[6,5,"Den slovanských věrozvěstů Cyrila a Metoděje"],[6,6,"Den upálení mistra Jana Husa"],[8,28,"Den české státnosti"],[9,28,"Den vzniku samostatného československého státu"],[10,17,"Den boje za svobodu a demokracii"],[11,24,"Štědrý den"],[11,25,"1. svátek vánoční"],[11,26,"2. svátek vánoční"]].forEach(([m,d,n])=>map.set(iso(utc(year,m,d)),n));
    const e=easter(year);map.set(iso(add(e,-2)),"Velký pátek");map.set(iso(add(e,1)),"Velikonoční pondělí");return map;
  }
  function schoolDays(year,district){
    const map=new Map();
    (SCHOOL[year]||[]).forEach(([a,b,label])=>{for(let d=parse(a),end=parse(b);d<=end;d=add(d,1))map.set(iso(d),label)});
    const gi=Math.max(0,DISTRICT_GROUPS.findIndex(g=>g.includes(district)));const start=SPRING[year]?.[gi];if(start){let d=parse(start);for(let i=0;i<7;i++)map.set(iso(add(d,i)),"Jarní prázdniny")};return map;
  }
  function context(){
    const h=new Map([...holidays(state.year-1),...holidays(state.year),...holidays(state.year+1)]),off=new Map(),blocked=new Map();
    state.exceptions.forEach(x=>(x.type==="off"?off:blocked).set(x.date,x.label||"Vlastní omezení"));
    return {holidays:h,off,blocked,school:state.school?schoolDays(state.year,state.district):new Map()};
  }
  function isWork(d,ctx){const w=d.getUTCDay(),key=iso(d);return w>=1&&w<=5&&!ctx.holidays.has(key)&&!ctx.off.has(key)}
  function yearStats(ctx){
    const y=state.year,start=utc(y,0,1),end=utc(y,11,31),now=today();let work=0,future=0,weekdayHol=0;
    for(let d=start;d<=end;d=add(d,1)){const k=iso(d),weekday=d.getUTCDay()>=1&&d.getUTCDay()<=5;if(weekday&&ctx.holidays.has(k))weekdayHol++;if(isWork(d,ctx)){work++;if(y!==currentYear||d>=now)future++}}
    return {work,future,holidayTotal:holidays(y).size,weekdayHol};
  }
  function titleFor(c){
    const names=c.holidayNames.join(" ");if(/Velký pátek|Velikonoční/.test(names))return "Velikonoční volno";if(/Štědrý|vánoční/.test(names))return "Vánoční volno";if(/Nový rok/.test(names))return "Novoroční most";if(/Svátek práce|Den vítězství/.test(names))return "Květnový most";if(/české státnosti/.test(names))return "Zářijový most";if(/vzniku samostatného/.test(names))return "Říjnový most";if(/boje za svobodu/.test(names))return "Listopadový most";if(c.schoolOverlap>=3)return "Volno během školních prázdnin";if(c.totalDays>=12)return "Delší souvislá dovolená";if(c.totalDays>=7)return "Týdenní blok volna";return "Prodloužené volno";
  }
  function candidates(ctx){
    const y=state.year,start=utc(y,0,1),end=utc(y,11,31),now=today();const first=y===currentYear&&now>start?now:start;const works=[];
    for(let d=first;d<=end;d=add(d,1))if(isWork(d,ctx))works.push(d);
    const out=[],maxLeave=Math.min(state.budget,18);
    for(let i=0;i<works.length;i++){
      for(let n=1;n<=maxLeave&&i+n-1<works.length;n++){
        const leave=works.slice(i,i+n);if(leave.some(d=>ctx.blocked.has(iso(d))||!state.months.has(d.getUTCMonth())))continue;
        let a=leave[0],b=leave[leave.length-1];while(!isWork(add(a,-1),ctx)&&diff(add(a,-1),a)===1)a=add(a,-1);while(!isWork(add(b,1),ctx)&&diff(b,add(b,1))===1)b=add(b,1);
        const total=diff(a,b)+1;if(total<state.minBreak||total>state.maxBreak)continue;
        let holidayNames=[],schoolOverlap=0,naturalWeekdayOff=0;for(let d=a;d<=b;d=add(d,1)){const key=iso(d),wd=d.getUTCDay()>=1&&d.getUTCDay()<=5;if(ctx.holidays.has(key)){holidayNames.push(ctx.holidays.get(key));if(wd)naturalWeekdayOff++}if(ctx.off.has(key)&&wd)naturalWeekdayOff++;if(ctx.school.has(key))schoolOverlap++}
        holidayNames=[...new Set(holidayNames)];const ratio=total/n;const meaningful=naturalWeekdayOff>0||total>=7;out.push({id:`${iso(a)}_${iso(b)}_${n}`,start:a,end:b,leave,totalDays:total,leaveCount:n,ratio,naturalWeekdayOff,holidayNames,schoolOverlap,meaningful});
      }
    }
    const best=new Map();out.forEach(c=>{const key=`${iso(c.start)}_${iso(c.end)}`,old=best.get(key);if(!old||c.leaveCount<old.leaveCount)best.set(key,c)});return [...best.values()].map(c=>(c.title=titleFor(c),c));
  }
  function utility(c){
    if(state.profile==="efficient")return c.totalDays*80+c.ratio*120+c.naturalWeekdayOff*30+c.schoolOverlap*2;
    if(state.profile==="long")return c.totalDays*115+c.totalDays*c.totalDays*4+c.naturalWeekdayOff*20+c.schoolOverlap*2-35;
    return c.totalDays*100+c.naturalWeekdayOff*35+c.schoolOverlap*2+(c.totalDays>=7?45:0)-20;
  }
  function annualPlan(allCandidates){
    let c=allCandidates.filter(x=>x.meaningful&&x.leaveCount<=state.budget).sort((a,b)=>a.end-b.end||a.start-b.start);if(!c.length)return [];
    const ends=c.map(x=>x.end.getTime()),prev=c.map((x,i)=>{let lo=0,hi=i-1,ans=-1,t=x.start.getTime()-MS;while(lo<=hi){let mid=(lo+hi)>>1;if(ends[mid]<t){ans=mid;lo=mid+1}else hi=mid-1}return ans});
    const B=state.budget,N=c.length,dp=Array.from({length:N+1},()=>new Float64Array(B+1)),take=Array.from({length:N+1},()=>new Uint8Array(B+1));
    for(let i=1;i<=N;i++){const x=c[i-1],p=prev[i-1]+1,u=utility(x);for(let b=0;b<=B;b++){let best=dp[i-1][b],yes=-1;if(x.leaveCount<=b)yes=dp[p][b-x.leaveCount]+u;if(yes>best){dp[i][b]=yes;take[i][b]=1}else dp[i][b]=best}}
    let b=B,i=N,res=[];while(i>0){if(take[i][b]){const x=c[i-1];res.push(x);b-=x.leaveCount;i=prev[i-1]+1}else i--}return res.reverse().sort((a,b)=>a.start-b.start);
  }
  function singleLongest(c){return c.filter(x=>x.leaveCount<=state.budget).sort((a,b)=>b.totalDays-a.totalDays||a.leaveCount-b.leaveCount||b.ratio-a.ratio)[0]||null}
  function singleEfficient(c){return c.filter(x=>x.leaveCount<=state.budget&&(x.naturalWeekdayOff>0||x.totalDays>=4)).sort((a,b)=>b.ratio-a.ratio||b.totalDays-a.totalDays||a.leaveCount-b.leaveCount)[0]||null}
  function planStats(blocks){const leave=blocks.reduce((s,x)=>s+x.leaveCount,0),free=blocks.reduce((s,x)=>s+x.totalDays,0),longest=blocks.reduce((m,x)=>Math.max(m,x.totalDays),0);return {leave,free,longest,blocks:blocks.length,ratio:leave?free/leave:0}}
  function compute(){
    state.ctx=context();const c=candidates(state.ctx),annual=annualPlan(c),longest=singleLongest(c),efficient=singleEfficient(c);state.plans={annual,longest:longest?[longest]:[],efficient:efficient?[efficient]:[]};renderAll();
  }
  function currentBlocks(){return state.plans?.[state.active]||[]}
  function setText(id,v){const e=$(id);if(e)e.textContent=v}
  function renderAll(){renderModel();renderStrategyCards();renderPlan();renderCalendar();renderHero()}
  function renderModel(){const s=yearStats(state.ctx);setText("modelTitle",`Český pracovní kalendář ${state.year}`);setText("holidayTotal",s.holidayTotal);setText("holidayWeekday",s.weekdayHol);setText("workdayTotal",s.work);setText("futureWorkdays",s.future);setText("heroYearText",state.year);setText("calendarYear",state.year);setText("heroScope",state.year===currentYear?`${state.year} · OD DNEŠKA`:`${state.year} · CELÝ ROK`)}
  function renderStrategyCards(){
    const a=planStats(state.plans.annual),l=planStats(state.plans.longest),e=planStats(state.plans.efficient);
    setText("annualFree",a.free?`${a.free} dní`:"—");setText("annualMeta",a.free?`${a.leave} dní dovolené · ${a.blocks} bloků · páka ${a.ratio.toFixed(1)}×`:"Pro zadané podmínky není vhodný plán");
    setText("longestFree",l.free?`${l.free} dní`:"—");setText("longestMeta",l.free?`${l.leave} dní dovolené · jeden souvislý blok`:"Nenalezen vhodný blok");
    setText("efficientFree",e.free?`${e.ratio.toFixed(1)}×`:"—");setText("efficientMeta",e.free?`${e.free} dní volna za ${e.leave} dní dovolené`:"Nenalezen vhodný blok");
  }
  function renderHero(){const s=planStats(currentBlocks());setText("heroBudget",state.budget);setText("heroFree",s.free||"—");setText("heroBlocks",s.blocks||"—");setText("heroLongest",s.longest?`${s.longest} dní`:"—");setText("heroRatio",s.ratio?`${s.ratio.toFixed(1)}×`:"—");setText("heroHint",s.free?`Aktivní strategie využívá ${s.leave} z ${state.budget} dnů dovolené.`:"Upravte rozpočet nebo preference; pro zadané podmínky není vhodný blok.")}
  function planName(){return state.active==="longest"?"Nejdelší souvislý blok":state.active==="efficient"?"Nejlepší poměr volna k dovolené":"Doporučený plán na rok"}
  function planDesc(){return state.active==="longest"?"Jeden blok s největším počtem souvislých dnů volna.":state.active==="efficient"?"Blok s nejvyšším poměrem celkového volna k jednomu dni dovolené.":"Kombinace nepřekrývajících se bloků, která využívá rozpočet co nejefektivněji."}
  function renderPlan(){
    const blocks=currentBlocks(),s=planStats(blocks);setText("planTitle",planName());setText("planDescription",planDesc());setText("sumLeave",s.leave||0);setText("sumFree",s.free||0);setText("sumBlocks",s.blocks||0);setText("sumLongest",s.longest?`${s.longest} dní`:"—");
    const list=$("planList");list.innerHTML="";if(!blocks.length){list.innerHTML='<div class="vac61-empty"><strong>Pro zadané podmínky jsme nenašli vhodný blok.</strong>Zkuste povolit více měsíců, zvýšit maximální délku bloku nebo změnit strategii.</div>';return}
    blocks.forEach((b,i)=>{const el=document.createElement("article");el.className="vac61-block";const holidays=b.holidayNames.length?` · ${b.holidayNames.join(", ")}`:"";el.innerHTML=`<div class="vac61-block-no">${pad(i+1)}</div><div><div class="vac61-block-head"><div><span>${b.title.toUpperCase()}</span><h3>${fmt(b.start)} – ${fmt(b.end)}</h3></div><strong>${b.totalDays} dní volna</strong></div><div class="vac61-block-meta"><span><b>${b.leaveCount}</b> dní dovolené</span><span><b>${b.ratio.toFixed(1)}×</b> páka</span>${b.schoolOverlap?`<span><b>${b.schoolOverlap}</b> dní školních prázdnin</span>`:""}${holidays?`<span>${holidays.slice(3)}</span>`:""}</div><div class="vac61-leave-days"><span>Nahlásit dovolenou:</span>${b.leave.map(d=>`<time datetime="${iso(d)}">${short(d)}</time>`).join("")}</div></div><button class="vac61-show-month" type="button" data-month="${b.start.getUTCMonth()}">Ukázat v kalendáři</button>`;list.appendChild(el)});
    all(".vac61-show-month",list).forEach(btn=>btn.addEventListener("click",()=>{state.mobileMonth=+btn.dataset.month;renderCalendar();$("kalendar").scrollIntoView({behavior:"smooth",block:"start"})}));
  }
  function renderCalendar(){
    const cal=$("yearCalendar"),blocks=currentBlocks(),leaveSet=new Set(blocks.flatMap(b=>b.leave.map(iso))),blockSet=new Set();blocks.forEach(b=>{for(let d=b.start;d<=b.end;d=add(d,1))if(d.getUTCFullYear()===state.year)blockSet.add(iso(d))});const h=holidays(state.year),now=today();cal.innerHTML="";
    for(let m=0;m<12;m++){const card=document.createElement("article");card.className="vac61-month-card"+(m===state.mobileMonth?" is-mobile-active":"");const first=utc(state.year,m,1),last=utc(state.year,m+1,0),startDow=(first.getUTCDay()+6)%7;let body="";for(let i=0;i<startDow;i++)body+='<span class="vac61-day is-empty"></span>';for(let d=first;d<=last;d=add(d,1)){const k=iso(d),weekend=[0,6].includes(d.getUTCDay()),classes=["vac61-day"];if(weekend)classes.push("is-weekend");if(h.has(k))classes.push("is-holiday");if(blockSet.has(k))classes.push("is-block");if(leaveSet.has(k))classes.push("is-leave");if(state.year===currentYear&&d<now)classes.push("is-past");const title=[h.get(k),leaveSet.has(k)?"Dovolená":null,blockSet.has(k)?"Součást bloku volna":null].filter(Boolean).join(" · ");body+=`<span class="${classes.join(" ")}"${title?` title="${title}"`:""}>${d.getUTCDate()}</span>`}card.innerHTML=`<header><h3>${CZ_MONTHS[m]}</h3><span>${state.year}</span></header><div class="vac61-weekdays">${["Po","Út","St","Čt","Pá","So","Ne"].map(x=>`<span>${x}</span>`).join("")}</div><div class="vac61-days">${body}</div>`;cal.appendChild(card)}setText("mobileMonthLabel",CZ_MONTHS[state.mobileMonth]);
  }
  function updateStateFromForm(){state.year=+$('yearSelect').value;state.budget=Math.max(1,Math.min(40,+$('budgetInput').value||20));$('budgetInput').value=state.budget;state.profile=document.querySelector('input[name="profile"]:checked')?.value||"balanced";state.minBreak=Math.max(3,Math.min(14,+$('minBreak').value||4));state.maxBreak=Math.max(state.minBreak,Math.min(30,+$('maxBreak').value||18));state.school=$('schoolMode').checked;state.district=$('districtSelect').value||"Benešov";if(state.school&&![2026,2027,2028].includes(state.year))state.school=false;$('schoolMode').checked=state.school;$('districtWrap').hidden=!state.school;state.mobileMonth=state.year===currentYear?today().getUTCMonth():0}
  function populateMonths(){const box=$("monthToggles");box.innerHTML=CZ_MONTHS.map((m,i)=>`<label><input type="checkbox" value="${i}" checked><span>${m.slice(0,3)}</span></label>`).join("");all('input[type="checkbox"]',box).forEach(cb=>cb.addEventListener("change",()=>{state.months=new Set(all('input:checked',box).map(x=>+x.value));if(!state.months.size){cb.checked=true;state.months.add(+cb.value)}compute()}))}
  function populateDistricts(){const names=[...new Set(DISTRICT_GROUPS.flat())].sort((a,b)=>a.localeCompare(b,"cs"));$('districtSelect').innerHTML=names.map(n=>`<option${n===state.district?' selected':''}>${n}</option>`).join("")}
  function renderExceptions(){const box=$("exceptionList");box.innerHTML=state.exceptions.map((x,i)=>`<div class="vac61-exception-item"><b>${x.date}</b><span>${x.type==="off"?"volno":"blokováno"}${x.label?` · ${x.label}`:""}</span><button type="button" data-remove="${i}" aria-label="Odstranit ${x.date}">×</button></div>`).join("");all("button[data-remove]",box).forEach(b=>b.addEventListener("click",()=>{state.exceptions.splice(+b.dataset.remove,1);renderExceptions();compute()}))}
  function addException(){const date=$('exceptionDate').value;if(!date)return;const item={date,type:$('exceptionType').value,label:$('exceptionLabel').value.trim()};const idx=state.exceptions.findIndex(x=>x.date===date);if(idx>=0)state.exceptions[idx]=item;else state.exceptions.push(item);state.exceptions.sort((a,b)=>a.date.localeCompare(b.date));$('exceptionLabel').value="";renderExceptions();compute()}
  function switchPlan(name){state.active=name;all(".vac61-strategy").forEach(b=>{const on=b.dataset.plan===name;b.classList.toggle("is-active",on);b.setAttribute("aria-pressed",String(on))});renderPlan();renderCalendar();renderHero()}
  function copyPlan(){const blocks=currentBlocks();if(!blocks.length)return;const s=planStats(blocks),lines=[`${planName()} ${state.year}`,`Dovolená: ${s.leave} dní · volno: ${s.free} dní`,...blocks.map((b,i)=>`${i+1}. ${fmt(b.start)} – ${fmt(b.end)} (${b.totalDays} dní volna; dovolená: ${b.leave.map(short).join(", ")})`)];navigator.clipboard?.writeText(lines.join("\n")).then(()=>{const b=$('copyPlan'),old=b.textContent;b.textContent="Zkopírováno";setTimeout(()=>b.textContent=old,1300)}).catch(()=>{})}
  function exportIcs(){const blocks=currentBlocks();if(!blocks.length)return;const esc=s=>s.replace(/[,;\\]/g,m=>"\\"+m);const date=d=>iso(d).replaceAll("-","");let lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//RychleVypocty.cz//Planovac dovolene//CS","CALSCALE:GREGORIAN"];blocks.forEach((b,i)=>{lines.push("BEGIN:VEVENT",`UID:rv-vac-${state.year}-${i}-${Date.now()}@rychlevypocty.cz`,`DTSTART;VALUE=DATE:${date(b.start)}`,`DTEND;VALUE=DATE:${date(add(b.end,1))}`,`SUMMARY:${esc(`Volno: ${b.title}`)}`,`DESCRIPTION:${esc(`Doporučené dny dovolené: ${b.leave.map(short).join(", ")}`)}`,"END:VEVENT")});lines.push("END:VCALENDAR");const blob=new Blob([lines.join("\r\n")],{type:"text/calendar;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`plan-dovolene-${state.year}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  function bind(){
    $('plannerForm').addEventListener('submit',e=>e.preventDefault());
    $('yearSelect').value=state.year;$('budgetInput').value=state.budget;
    ['yearSelect','budgetInput','minBreak','maxBreak','districtSelect'].forEach(id=>$(id).addEventListener("change",()=>{updateStateFromForm();compute()}));all('input[name="profile"]').forEach(x=>x.addEventListener("change",()=>{updateStateFromForm();compute()}));$('schoolMode').addEventListener("change",()=>{updateStateFromForm();compute()});
    $('budgetMinus').addEventListener("click",()=>{$('budgetInput').value=Math.max(1,+$('budgetInput').value-1);updateStateFromForm();compute()});$('budgetPlus').addEventListener("click",()=>{$('budgetInput').value=Math.min(40,+$('budgetInput').value+1);updateStateFromForm();compute()});$('addException').addEventListener("click",addException);all('.vac61-strategy').forEach(b=>b.addEventListener("click",()=>switchPlan(b.dataset.plan)));$('copyPlan').addEventListener("click",copyPlan);$('exportIcs').addEventListener("click",exportIcs);$('monthPrev').addEventListener("click",()=>{state.mobileMonth=(state.mobileMonth+11)%12;renderCalendar()});$('monthNext').addEventListener("click",()=>{state.mobileMonth=(state.mobileMonth+1)%12;renderCalendar()});
    const menu=$('menuBtn'),nav=$('mobile-nav');menu?.addEventListener("click",()=>{const on=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!on));nav.classList.toggle("is-open",!on)});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&menu){menu.setAttribute("aria-expanded","false");nav.classList.remove("is-open")}});
  }
  populateMonths();populateDistricts();bind();updateStateFromForm();compute();
})();
