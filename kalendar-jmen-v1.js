(() => {
'use strict';
const NAME_DAYS={"01-01":{"names":[],"occasion":"Nový rok a Den obnovy samostatného českého státu"},"01-02":{"names":["Karina"]},"01-03":{"names":["Radmila"]},"01-04":{"names":["Diana"]},"01-05":{"names":["Dalimil"]},"01-06":{"names":[],"occasion":"Tři králové"},"01-07":{"names":["Vilma"]},"01-08":{"names":["Čestmír"]},"01-09":{"names":["Vladan"]},"01-10":{"names":["Břetislav"]},"01-11":{"names":["Bohdana"]},"01-12":{"names":["Pravoslav"]},"01-13":{"names":["Edita"]},"01-14":{"names":["Radovan"]},"01-15":{"names":["Alice"]},"01-16":{"names":["Ctirad"]},"01-17":{"names":["Drahoslav"]},"01-18":{"names":["Vladislav"]},"01-19":{"names":["Doubravka"]},"01-20":{"names":["Ilona","Sebastian"]},"01-21":{"names":["Běla"]},"01-22":{"names":["Slavomír"]},"01-23":{"names":["Zdeněk"]},"01-24":{"names":["Milena"]},"01-25":{"names":["Miloš"]},"01-26":{"names":["Zora"]},"01-27":{"names":["Ingrid"]},"01-28":{"names":["Otýlie"]},"01-29":{"names":["Zdislava"]},"01-30":{"names":["Robin"]},"01-31":{"names":["Marika"]},"02-01":{"names":["Hynek"]},"02-02":{"names":["Nela"]},"02-03":{"names":["Blažej"]},"02-04":{"names":["Jarmila"]},"02-05":{"names":["Dobromila"]},"02-06":{"names":["Vanda"]},"02-07":{"names":["Veronika"]},"02-08":{"names":["Milada"]},"02-09":{"names":["Apolena"]},"02-10":{"names":["Mojmír"]},"02-11":{"names":["Božena"]},"02-12":{"names":["Slavěna"]},"02-13":{"names":["Věnceslav"]},"02-14":{"names":["Valentýn"]},"02-15":{"names":["Jiřina"]},"02-16":{"names":["Ljuba"]},"02-17":{"names":["Miloslava"]},"02-18":{"names":["Gizela"]},"02-19":{"names":["Patrik"]},"02-20":{"names":["Oldřich"]},"02-21":{"names":["Lenka","Eleonora"]},"02-22":{"names":["Petr"]},"02-23":{"names":["Svatopluk"]},"02-24":{"names":["Matěj"]},"02-25":{"names":["Liliana"]},"02-26":{"names":["Dorota"]},"02-27":{"names":["Alexandr"]},"02-28":{"names":["Lumír"]},"02-29":{"names":["Horymír"]},"03-01":{"names":["Bedřich"]},"03-02":{"names":["Anežka"]},"03-03":{"names":["Kamil"]},"03-04":{"names":["Stela"]},"03-05":{"names":["Kazimír"]},"03-06":{"names":["Miroslav"]},"03-07":{"names":["Tomáš"]},"03-08":{"names":["Gabriela"]},"03-09":{"names":["Františka"]},"03-10":{"names":["Viktorie"]},"03-11":{"names":["Anděla"]},"03-12":{"names":["Řehoř"]},"03-13":{"names":["Růžena"]},"03-14":{"names":["Rút","Matylda"]},"03-15":{"names":["Ida"]},"03-16":{"names":["Elena","Herbert"]},"03-17":{"names":["Vlastimil"]},"03-18":{"names":["Eduard"]},"03-19":{"names":["Josef"]},"03-20":{"names":["Světlana"]},"03-21":{"names":["Radek"]},"03-22":{"names":["Leona"]},"03-23":{"names":["Ivona"]},"03-24":{"names":["Gabriel"]},"03-25":{"names":["Marián"]},"03-26":{"names":["Emanuel"]},"03-27":{"names":["Dita"]},"03-28":{"names":["Soňa"]},"03-29":{"names":["Taťána"]},"03-30":{"names":["Arnošt"]},"03-31":{"names":["Kvido"]},"04-01":{"names":["Hugo"]},"04-02":{"names":["Erika"]},"04-03":{"names":["Richard"]},"04-04":{"names":["Ivana"]},"04-05":{"names":["Miroslava"]},"04-06":{"names":["Vendula"]},"04-07":{"names":["Heřman","Hermína"]},"04-08":{"names":["Ema"]},"04-09":{"names":["Dušan"]},"04-10":{"names":["Darja"]},"04-11":{"names":["Izabela"]},"04-12":{"names":["Julius"]},"04-13":{"names":["Aleš"]},"04-14":{"names":["Vincenc"]},"04-15":{"names":["Anastázie"]},"04-16":{"names":["Irena"]},"04-17":{"names":["Rudolf"]},"04-18":{"names":["Valérie"]},"04-19":{"names":["Rostislav"]},"04-20":{"names":["Marcela"]},"04-21":{"names":["Alexandra"]},"04-22":{"names":["Evženie"]},"04-23":{"names":["Vojtěch"]},"04-24":{"names":["Jiří"]},"04-25":{"names":["Marek"]},"04-26":{"names":["Oto"]},"04-27":{"names":["Jaroslav"]},"04-28":{"names":["Vlastislav"]},"04-29":{"names":["Robert"]},"04-30":{"names":["Blahoslav"]},"05-01":{"names":[],"occasion":"Svátek práce"},"05-02":{"names":["Zikmund"]},"05-03":{"names":["Alexej"]},"05-04":{"names":["Květoslav"]},"05-05":{"names":["Klaudie"]},"05-06":{"names":["Radoslav"]},"05-07":{"names":["Stanislav"]},"05-08":{"names":[],"occasion":"Den vítězství"},"05-09":{"names":["Ctibor"]},"05-10":{"names":["Blažena"]},"05-11":{"names":["Svatava"]},"05-12":{"names":["Pankrác"]},"05-13":{"names":["Servác"]},"05-14":{"names":["Bonifác"]},"05-15":{"names":["Žofie"]},"05-16":{"names":["Přemysl"]},"05-17":{"names":["Aneta"]},"05-18":{"names":["Nataša"]},"05-19":{"names":["Ivo"]},"05-20":{"names":["Zbyšek"]},"05-21":{"names":["Monika"]},"05-22":{"names":["Emil"]},"05-23":{"names":["Vladimír"]},"05-24":{"names":["Jana","Vanesa"]},"05-25":{"names":["Viola"]},"05-26":{"names":["Filip"]},"05-27":{"names":["Valdemar"]},"05-28":{"names":["Vilém"]},"05-29":{"names":["Maxmilián","Maxim"]},"05-30":{"names":["Ferdinand"]},"05-31":{"names":["Kamila"]},"06-01":{"names":["Laura"]},"06-02":{"names":["Jarmil"]},"06-03":{"names":["Tamara"]},"06-04":{"names":["Dalibor"]},"06-05":{"names":["Dobroslav"]},"06-06":{"names":["Norbert"]},"06-07":{"names":["Iveta","Slavoj"]},"06-08":{"names":["Medard"]},"06-09":{"names":["Stanislava"]},"06-10":{"names":["Gita"]},"06-11":{"names":["Bruno"]},"06-12":{"names":["Antonie"]},"06-13":{"names":["Antonín"]},"06-14":{"names":["Roland"]},"06-15":{"names":["Vít"]},"06-16":{"names":["Zbyněk"]},"06-17":{"names":["Adolf"]},"06-18":{"names":["Milan"]},"06-19":{"names":["Leoš"]},"06-20":{"names":["Květa"]},"06-21":{"names":["Alois"]},"06-22":{"names":["Pavla"]},"06-23":{"names":["Zdeňka"]},"06-24":{"names":["Jan"]},"06-25":{"names":["Ivan"]},"06-26":{"names":["Adriana"]},"06-27":{"names":["Ladislav"]},"06-28":{"names":["Lubomír"]},"06-29":{"names":["Petr","Pavel"]},"06-30":{"names":["Šárka"]},"07-01":{"names":["Jaroslava"]},"07-02":{"names":["Patricie"]},"07-03":{"names":["Radomír"]},"07-04":{"names":["Prokop"]},"07-05":{"names":[],"occasion":"Den slovanských věrozvěstů Cyrila a Metoděje"},"07-06":{"names":[],"occasion":"Den upálení mistra Jana Husa"},"07-07":{"names":["Bohuslava"]},"07-08":{"names":["Nora"]},"07-09":{"names":["Drahoslava"]},"07-10":{"names":["Libuše","Amálie"]},"07-11":{"names":["Olga"]},"07-12":{"names":["Bořek"]},"07-13":{"names":["Markéta"]},"07-14":{"names":["Karolína"]},"07-15":{"names":["Jindřich"]},"07-16":{"names":["Luboš"]},"07-17":{"names":["Martina"]},"07-18":{"names":["Drahomíra"]},"07-19":{"names":["Čeněk"]},"07-20":{"names":["Ilja"]},"07-21":{"names":["Vítězslav"]},"07-22":{"names":["Magdaléna"]},"07-23":{"names":["Libor"]},"07-24":{"names":["Kristýna"]},"07-25":{"names":["Jakub"]},"07-26":{"names":["Anna","Anita"]},"07-27":{"names":["Věroslav"]},"07-28":{"names":["Viktor","Svatomír"]},"07-29":{"names":["Marta"]},"07-30":{"names":["Bořivoj"]},"07-31":{"names":["Ignác"]},"08-01":{"names":["Oskar"]},"08-02":{"names":["Gustav"]},"08-03":{"names":["Miluše"]},"08-04":{"names":["Dominik","Dominika"]},"08-05":{"names":["Kristián"]},"08-06":{"names":["Oldřiška"]},"08-07":{"names":["Lada"]},"08-08":{"names":["Soběslav"]},"08-09":{"names":["Roman"]},"08-10":{"names":["Vavřinec"]},"08-11":{"names":["Zuzana"]},"08-12":{"names":["Klára"]},"08-13":{"names":["Alena"]},"08-14":{"names":["Alan","Sylva"]},"08-15":{"names":["Hana"]},"08-16":{"names":["Jáchym"]},"08-17":{"names":["Petra"]},"08-18":{"names":["Helena"]},"08-19":{"names":["Ludvík","Luisa"]},"08-20":{"names":["Bernard"]},"08-21":{"names":["Johana"]},"08-22":{"names":["Bohuslav"]},"08-23":{"names":["Sandra"]},"08-24":{"names":["Bartoloměj"]},"08-25":{"names":["Radim"]},"08-26":{"names":["Luděk"]},"08-27":{"names":["Otakar"]},"08-28":{"names":["Augustýn"]},"08-29":{"names":["Evelína"]},"08-30":{"names":["Vladěna"]},"08-31":{"names":["Pavlína"]},"09-01":{"names":["Linda","Samuel"]},"09-02":{"names":["Adéla"]},"09-03":{"names":["Bronislav","Bronislava"]},"09-04":{"names":["Jindřiška","Rozálie"]},"09-05":{"names":["Boris"]},"09-06":{"names":["Boleslav"]},"09-07":{"names":["Regína"]},"09-08":{"names":["Mariana"]},"09-09":{"names":["Daniela"]},"09-10":{"names":["Irma"]},"09-11":{"names":["Denisa","Denis"]},"09-12":{"names":["Marie"]},"09-13":{"names":["Lubor"]},"09-14":{"names":["Radka"]},"09-15":{"names":["Jolana"]},"09-16":{"names":["Ludmila"]},"09-17":{"names":["Naděžda"]},"09-18":{"names":["Kryštof"]},"09-19":{"names":["Zita"]},"09-20":{"names":["Oleg"]},"09-21":{"names":["Matouš"]},"09-22":{"names":["Darina"]},"09-23":{"names":["Berta"]},"09-24":{"names":["Jaromír"]},"09-25":{"names":["Zlata"]},"09-26":{"names":["Andrea"]},"09-27":{"names":["Jonáš"]},"09-28":{"names":["Václav"]},"09-29":{"names":["Michal"]},"09-30":{"names":["Jeroným"]},"10-01":{"names":["Igor"]},"10-02":{"names":["Olivie","Oliver","Galina"]},"10-03":{"names":["Bohumil"]},"10-04":{"names":["František"]},"10-05":{"names":["Eliška"]},"10-06":{"names":["Hanuš"]},"10-07":{"names":["Justýna","Sergej"]},"10-08":{"names":["Věra"]},"10-09":{"names":["Štefan","Sára"]},"10-10":{"names":["Marina"]},"10-11":{"names":["Andrej"]},"10-12":{"names":["Marcel"]},"10-13":{"names":["Renáta"]},"10-14":{"names":["Agáta"]},"10-15":{"names":["Tereza"]},"10-16":{"names":["Havel"]},"10-17":{"names":["Hedvika","Heda"]},"10-18":{"names":["Lukáš"]},"10-19":{"names":["Michaela"]},"10-20":{"names":["Vendelín"]},"10-21":{"names":["Brigita"]},"10-22":{"names":["Sabina"]},"10-23":{"names":["Teodor"]},"10-24":{"names":["Nina"]},"10-25":{"names":["Beáta"]},"10-26":{"names":["Erik"]},"10-27":{"names":["Šarlota","Zoe","Zoja"]},"10-28":{"names":[],"occasion":"Den vzniku samostatného československého státu"},"10-29":{"names":["Silvie"]},"10-30":{"names":["Tadeáš"]},"10-31":{"names":["Štěpánka"]},"11-01":{"names":["Felix"]},"11-02":{"names":[],"occasion":"Památka zesnulých"},"11-03":{"names":["Hubert"]},"11-04":{"names":["Karel","Karla"]},"11-05":{"names":["Miriam"]},"11-06":{"names":["Liběna"]},"11-07":{"names":["Saskie"]},"11-08":{"names":["Bohumír"]},"11-09":{"names":["Bohdan"]},"11-10":{"names":["Evžen"]},"11-11":{"names":["Martin"]},"11-12":{"names":["Benedikt"]},"11-13":{"names":["Tibor"]},"11-14":{"names":["Sáva"]},"11-15":{"names":["Leopold"]},"11-16":{"names":["Otmar"]},"11-17":{"names":["Mahulena"]},"11-18":{"names":["Romana"]},"11-19":{"names":["Alžběta"]},"11-20":{"names":["Nikola","Nikolas"]},"11-21":{"names":["Albert"]},"11-22":{"names":["Cecílie"]},"11-23":{"names":["Klement"]},"11-24":{"names":["Emílie"]},"11-25":{"names":["Kateřina"]},"11-26":{"names":["Artur"]},"11-27":{"names":["Xenie"]},"11-28":{"names":["René"]},"11-29":{"names":["Zina"]},"11-30":{"names":["Ondřej"]},"12-01":{"names":["Iva"]},"12-02":{"names":["Blanka"]},"12-03":{"names":["Svatoslav"]},"12-04":{"names":["Barbora","Barbara"]},"12-05":{"names":["Jitka"]},"12-06":{"names":["Mikuláš"]},"12-07":{"names":["Ambrož","Benjamín"]},"12-08":{"names":["Květoslava"]},"12-09":{"names":["Vratislav","Vratislava"]},"12-10":{"names":["Julie"]},"12-11":{"names":["Dana"]},"12-12":{"names":["Simona"]},"12-13":{"names":["Lucie"]},"12-14":{"names":["Lýdie"]},"12-15":{"names":["Radana","Radan"]},"12-16":{"names":["Albína"]},"12-17":{"names":["Daniel"]},"12-18":{"names":["Miloslav"]},"12-19":{"names":["Ester"]},"12-20":{"names":["Dagmar"]},"12-21":{"names":["Natálie"]},"12-22":{"names":["Šimon"]},"12-23":{"names":["Vlasta"]},"12-24":{"names":["Adam","Eva"]},"12-25":{"names":[],"occasion":"1. svátek vánoční"},"12-26":{"names":["Štěpán"]},"12-27":{"names":["Žaneta"]},"12-28":{"names":["Bohumila"]},"12-29":{"names":["Judita"]},"12-30":{"names":["David"]},"12-31":{"names":["Silvestr"]}};
const ALIASES={"pepa":["Josef"],"honza":["Jan"],"jenda":["Jan"],"kuba":["Jakub"],"lucka":["Lucie"],"terka":["Tereza"],"katka":["Kateřina"],"kačka":["Kateřina"],"verča":["Veronika"],"verca":["Veronika"],"tom":["Tomáš"],"péťa":["Petr","Petra"],"peta":["Petr","Petra"],"míša":["Michal","Michaela"],"misa":["Michal","Michaela"],"kája":["Karel","Karolína"],"kaja":["Karel","Karolína"],"mára":["Marek"],"mara":["Marek"],"maty":["Matěj","Matouš"],"ája":["Adéla","Andrea","Anna"],"láďa":["Ladislav"],"lada":["Ladislav"],"venca":["Václav"],"vašek":["Václav"],"vasek":["Václav"],"radek":["Radek"],"martin":["Martin"]};
const MONTHS=['leden','únor','březen','duben','květen','červen','červenec','srpen','září','říjen','listopad','prosinec'];
const MONTHS_GEN=['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
const WEEKDAYS=['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const md=(m,d)=>`${pad(m)}-${pad(d)}`;
const normalize=value=>(value||'').toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const localDate=(year,month,day)=>new Date(year,month-1,day,12,0,0);
const today=()=>{const n=new Date();return localDate(n.getFullYear(),n.getMonth()+1,n.getDate())};
const isLeap=year=>year%4===0&&(year%100!==0||year%400===0);
const daysInMonth=(year,month)=>new Date(year,month,0).getDate();
const formatDate=(date,weekday=true)=>new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'long',year:'numeric',weekday:weekday?'long':undefined}).format(date);
const formatShort=date=>new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}).format(date);
const entryFor=date=>NAME_DAYS[md(date.getMonth()+1,date.getDate())]||{names:[]};
const labelFor=entry=>entry.names.length?entry.names.join(' a '):(entry.occasion||'Bez jména v základním kalendáři');
const dateFromMd=(year,key)=>{const [m,d]=key.split('-').map(Number);if(m===2&&d===29&&!isLeap(year))return null;return localDate(year,m,d)};
const dayDiff=(a,b)=>Math.round((b-a)/86400000);
const plural=(n,one,few,many)=>Math.abs(n)===1?one:(Math.abs(n)>=2&&Math.abs(n)<=4?few:many);
function nextOccurrence(key,from=today()){
  const [m,d]=key.split('-').map(Number);let y=from.getFullYear();
  for(let i=0;i<8;i++,y++){if(m===2&&d===29&&!isLeap(y))continue;const candidate=localDate(y,m,d);if(candidate>=localDate(from.getFullYear(),from.getMonth()+1,from.getDate()))return candidate;}
  return null;
}
const allNameRecords=[];
Object.entries(NAME_DAYS).forEach(([key,entry])=>entry.names.forEach(name=>allNameRecords.push({key,name,norm:normalize(name)})));
const uniqueNames=[...new Set(allNameRecords.map(r=>r.name))].sort((a,b)=>a.localeCompare(b,'cs'));
function recordsForName(value){
  const norm=normalize(value);if(!norm)return [];
  let canonical=[];
  if(ALIASES[norm]) canonical=ALIASES[norm].map(normalize);
  const exact=allNameRecords.filter(r=>r.norm===norm||canonical.includes(r.norm));
  return exact.sort((a,b)=>a.key.localeCompare(b.key));
}
function searchNames(value,limit=8){
  const norm=normalize(value);if(!norm)return [];
  const aliasTargets=(ALIASES[norm]||[]).map(normalize);
  return allNameRecords
    .map(r=>({...r,score:r.norm===norm?0:aliasTargets.includes(r.norm)?1:r.norm.startsWith(norm)?2:r.norm.includes(norm)?3:99}))
    .filter(r=>r.score<99)
    .sort((a,b)=>a.score-b.score||a.name.localeCompare(b.name,'cs'))
    .filter((r,i,a)=>a.findIndex(x=>x.name===r.name)===i)
    .slice(0,limit);
}
function setText(id,value){const el=q(id);if(el)el.textContent=value}
function updateHero(){
  const base=today();const dates=[0,1,2].map(n=>new Date(base.getFullYear(),base.getMonth(),base.getDate()+n,12));
  const [d0,d1,d2]=dates, e0=entryFor(d0),e1=entryFor(d1),e2=entryFor(d2);
  setText('#todayWeekday',WEEKDAYS[d0.getDay()]);setText('#todayDate',`${d0.getDate()}. ${MONTHS_GEN[d0.getMonth()]}`);setText('#todayNames',labelFor(e0));
  setText('#tomorrowNames',labelFor(e1));setText('#tomorrowDate',`${d1.getDate()}. ${MONTHS_GEN[d1.getMonth()]}`);
  setText('#afterNames',labelFor(e2));setText('#afterDate',`${d2.getDate()}. ${MONTHS_GEN[d2.getMonth()]}`);
}
let state={year:today().getFullYear(),month:today().getMonth()+1,selected:today(),selectedName:null};
function validYear(v){return Math.min(2100,Math.max(1900,Number(v)||today().getFullYear()))}
function selectDate(date,options={}){
  state.selected=date;state.year=date.getFullYear();state.month=date.getMonth()+1;state.selectedName=options.name||null;
  if(q('#dateSearch'))q('#dateSearch').value=`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;if(q('#calendarYear'))q('#calendarYear').value=String(date.getFullYear());
  const entry=entryFor(date), names=entry.names;
  setText('#resultEyebrow',names.length?'Svátek v českém kalendáři':'Významný kalendářní den');
  setText('#resultDate',formatDate(date));setText('#resultNames',labelFor(entry));
  const days=dayDiff(today(),date), diffLabel=days===0?'je dnes':days>0?`je za ${days} ${plural(days,'den','dny','dní')}`:`byl před ${Math.abs(days)} ${plural(Math.abs(days),'dnem','dny','dny')}`;
  setText('#resultDistance',`${formatShort(date)} · ${diffLabel}`);
  const note=q('#resultNote');if(note) note.textContent=entry.occasion&&!names.length?'Tento den je v použitém základním kalendáři veden jako významný den, nikoli jako jmeniny konkrétního jména.':'U některých vydavatelů se může seznam doplňkových jmen lišit. Zobrazen je náš jednotný základní kalendář.';
  const save=q('#saveName');if(save){save.hidden=!names.length;save.dataset.name=options.name||names[0]||'';}
  const ics=q('#downloadIcs');if(ics)ics.disabled=!names.length;
  qa('.calendar-day.is-selected').forEach(el=>el.classList.remove('is-selected'));
  const cell=q(`[data-date="${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}"]`);if(cell)cell.classList.add('is-selected');
  updateQuery(options.push!==false);
}
function updateQuery(push=true){
  const url=new URL(location.href);url.search='';url.searchParams.set('datum',`${pad(state.selected.getMonth()+1)}-${pad(state.selected.getDate())}`);url.searchParams.set('rok',String(state.selected.getFullYear()));
  if(state.selectedName)url.searchParams.set('jmeno',state.selectedName);
  history[push?'pushState':'replaceState']({},'',url);
}
function renderSuggestions(value){
  const box=q('#nameSuggestions'),results=searchNames(value);box.innerHTML='';
  if(!value.trim()){box.hidden=true;return}
  if(!results.length){box.innerHTML='<p class="suggestion-empty">Jméno v základním kalendáři nenalezeno. Zkuste jinou podobu nebo zkontrolujte pravopis.</p>';box.hidden=false;return}
  results.forEach(r=>{const button=document.createElement('button');button.type='button';button.className='suggestion';button.innerHTML=`<strong>${r.name}</strong><span>${Number(r.key.slice(3))}. ${MONTHS_GEN[Number(r.key.slice(0,2))-1]}</span>`;button.addEventListener('click',()=>selectName(r.name));box.append(button)});box.hidden=false;
}
function selectName(name){
  const records=recordsForName(name);if(!records.length)return;
  q('#nameSearch').value=name;q('#nameSuggestions').hidden=true;
  const upcoming=records.map(r=>({...r,date:nextOccurrence(r.key)})).filter(r=>r.date).sort((a,b)=>a.date-b.date);
  const first=upcoming[0];state.selectedName=name;state.year=first.date.getFullYear();state.month=first.date.getMonth()+1;renderMonth();renderYearOverview();selectDate(first.date,{name});
  const multi=q('#multipleDates');multi.innerHTML='';
  if(upcoming.length>1){
    multi.hidden=false;const title=document.createElement('strong');title.textContent='Další termíny stejného jména v kalendáři';multi.append(title);
    upcoming.forEach(item=>{const b=document.createElement('button');b.type='button';b.textContent=`${item.name} · ${Number(item.key.slice(3))}. ${MONTHS_GEN[Number(item.key.slice(0,2))-1]}`;b.addEventListener('click',()=>selectDate(item.date,{name:item.name}));multi.append(b)});
  } else multi.hidden=true;
}
function renderUpcoming(){
  const wrap=q('#upcomingDays');wrap.innerHTML='';const base=today();
  for(let i=0;i<7;i++){const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+i,12),entry=entryFor(d);const button=document.createElement('button');button.type='button';button.className='upcoming-day'+(i===0?' is-today':'');button.innerHTML=`<span>${i===0?'Dnes':WEEKDAYS[d.getDay()]}</span><strong>${d.getDate()}. ${MONTHS_GEN[d.getMonth()]}</strong><small>${labelFor(entry)}</small>`;button.addEventListener('click',()=>{state.month=d.getMonth()+1;state.year=d.getFullYear();renderMonth();selectDate(d)});wrap.append(button)}
}
function renderMonth(){
  state.year=validYear(state.year);const year=state.year,month=state.month,grid=q('#monthGrid');grid.innerHTML='';
  q('#calendarYear').value=String(year);setText('#monthTitle',`${MONTHS[month-1]} ${year}`);
  ['Po','Út','St','Čt','Pá','So','Ne'].forEach(x=>{const h=document.createElement('div');h.className='weekday-head';h.textContent=x;grid.append(h)});
  const first=localDate(year,month,1),offset=(first.getDay()+6)%7;
  for(let i=0;i<offset;i++){const blank=document.createElement('span');blank.className='calendar-empty';grid.append(blank)}
  for(let day=1;day<=daysInMonth(year,month);day++){
    const date=localDate(year,month,day),entry=entryFor(date),key=`${year}-${pad(month)}-${pad(day)}`,button=document.createElement('button');button.type='button';button.className='calendar-day';button.dataset.date=key;
    if(date.toDateString()===today().toDateString())button.classList.add('is-today');if(state.selected&&date.toDateString()===state.selected.toDateString())button.classList.add('is-selected');if(date.getDay()===0||date.getDay()===6)button.classList.add('is-weekend');if(entry.occasion&&!entry.names.length)button.classList.add('is-occasion');
    button.innerHTML=`<span class="day-weekday">${WEEKDAYS[date.getDay()]}</span><b class="day-number">${day}</b><span class="day-names">${labelFor(entry)}</span>`;button.setAttribute('aria-label',`${formatDate(date)}: ${labelFor(entry)}`);button.addEventListener('click',()=>selectDate(date));grid.append(button);
  }
}
function renderYearOverview(){
  const wrap=q('#yearOverview');wrap.innerHTML='';const year=state.year;setText('#overviewYear',String(year));
  for(let month=1;month<=12;month++){const article=document.createElement('article');article.className='year-month';const h=document.createElement('h3');h.textContent=MONTHS[month-1];article.append(h);const list=document.createElement('div');list.className='year-month-list';
    for(let day=1;day<=daysInMonth(year,month);day++){const date=localDate(year,month,day),entry=entryFor(date),button=document.createElement('button');button.type='button';button.innerHTML=`<b>${day}.</b><span>${labelFor(entry)}</span>`;button.addEventListener('click',()=>{state.month=month;renderMonth();selectDate(date);q('#kalendar').scrollIntoView({behavior:'smooth'})});list.append(button)}article.append(list);wrap.append(article)}
}
const storageKey='rv-name-calendar-favourites-v1';
function getSaved(){try{const v=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function setSaved(v){try{localStorage.setItem(storageKey,JSON.stringify(v.slice(0,20)));return true}catch{setText('#copyStatus','Prohlížeč nepovolil místní uložení. Jméno můžete přidat do kalendáře pomocí ICS.');setTimeout(()=>setText('#copyStatus',''),4200);return false}}
function saveName(name){if(!name)return;const saved=getSaved();if(!saved.includes(name))saved.push(name);if(setSaved(saved))renderSaved()}
function removeName(name){if(setSaved(getSaved().filter(x=>x!==name)))renderSaved()}
function renderSaved(){
  const wrap=q('#savedNames'),saved=getSaved();wrap.innerHTML='';
  if(!saved.length){const empty=document.createElement('p');empty.className='saved-empty';empty.id='savedEmpty';empty.textContent='Zatím zde nic není. Najděte jméno a zvolte „Přidat do mých jmen“.';wrap.append(empty);return}
  saved.map(name=>{const recs=recordsForName(name),dates=recs.map(r=>({...r,date:nextOccurrence(r.key)})).filter(r=>r.date).sort((a,b)=>a.date-b.date);return {name,item:dates[0]}}).filter(x=>x.item).sort((a,b)=>a.item.date-b.item.date).forEach(x=>{const card=document.createElement('div');card.className='saved-name';const days=dayDiff(today(),x.item.date);card.innerHTML=`<button type="button" class="saved-open"><strong>${x.name}</strong><span>${x.item.date.getDate()}. ${MONTHS_GEN[x.item.date.getMonth()]}</span><small>${days===0?'dnes':`za ${days} ${plural(days,'den','dny','dní')}`}</small></button><button type="button" class="saved-remove" aria-label="Odebrat ${x.name}">×</button>`;card.querySelector('.saved-open').addEventListener('click',()=>selectName(x.name));card.querySelector('.saved-remove').addEventListener('click',()=>removeName(x.name));wrap.append(card)})
}
function downloadIcs(){
  const entry=entryFor(state.selected);if(!entry.names.length)return;const name=state.selectedName||entry.names[0],date=state.selected;const stamp=`${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}`;
  const recur=md(date.getMonth()+1,date.getDate())==='02-29'?'':'RRULE:FREQ=YEARLY\r\n';
  const content=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//RychleVypocty.cz//Kalendar jmen//CS\r\nBEGIN:VEVENT\r\nUID:${normalize(name)}-${stamp}@rychlevypocty.cz\r\nDTSTART;VALUE=DATE:${stamp}\r\nSUMMARY:Svátek: ${name}\r\n${recur}DESCRIPTION:Přidáno z kalendáře jmen na RychléVýpočty.cz\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
  const blob=new Blob([content],{type:'text/calendar;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`svatek-${normalize(name)}.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
async function copyLink(){try{await navigator.clipboard.writeText(location.href);setText('#copyStatus','Odkaz zkopírován')}catch{setText('#copyStatus','Odkaz označte v adresním řádku')}setTimeout(()=>setText('#copyStatus',''),2400)}
function initQuery(){
  const p=new URLSearchParams(location.search),year=validYear(p.get('rok')),name=p.get('jmeno'),datum=p.get('datum');state.year=year;
  if(datum&&/^\d{2}-\d{2}$/.test(datum)){const d=dateFromMd(year,datum);if(d){state.month=d.getMonth()+1;state.selected=d}}
  if(name&&recordsForName(name).length){q('#nameSearch').value=name;selectName(name);return}
  state.month=state.selected.getMonth()+1;renderMonth();selectDate(state.selected,{push:false});
}
function bind(){
  const input=q('#nameSearch');input.addEventListener('input',()=>renderSuggestions(input.value));input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const r=searchNames(input.value,1)[0];if(r)selectName(r.name)}if(e.key==='Escape')q('#nameSuggestions').hidden=true});
  document.addEventListener('click',e=>{if(!e.target.closest('.name-search-wrap'))q('#nameSuggestions').hidden=true});
  q('#nameSearchButton').addEventListener('click',()=>{const r=searchNames(input.value,1)[0];if(r)selectName(r.name);else renderSuggestions(input.value)});
  q('#dateSearch').addEventListener('change',e=>{if(!e.target.value)return;const [y,m,d]=e.target.value.split('-').map(Number),date=localDate(y,m,d);state.month=m;state.year=y;renderMonth();renderYearOverview();selectDate(date)});
  q('#calendarYear').addEventListener('change',e=>{state.year=validYear(e.target.value);renderMonth();renderYearOverview()});
  q('#prevMonth').addEventListener('click',()=>{state.month--;if(state.month<1){state.month=12;state.year--}renderMonth()});q('#nextMonth').addEventListener('click',()=>{state.month++;if(state.month>12){state.month=1;state.year++}renderMonth()});
  q('#todayButton').addEventListener('click',()=>{const d=today();state.year=d.getFullYear();state.month=d.getMonth()+1;renderMonth();renderYearOverview();selectDate(d)});
  q('#copyLink').addEventListener('click',copyLink);q('#downloadIcs').addEventListener('click',downloadIcs);q('#saveName').addEventListener('click',e=>saveName(e.currentTarget.dataset.name));
  q('#clearSaved').addEventListener('click',()=>{if(setSaved([]))renderSaved()});
  window.addEventListener('popstate',()=>location.reload());
}
function menu(){const button=q('.menu-toggle'),nav=q('#main-nav');if(!button||!nav)return;button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open)})}
updateHero();renderUpcoming();renderSaved();bind();menu();initQuery();renderYearOverview();q('#dateSearch').value=`${state.selected.getFullYear()}-${pad(state.selected.getMonth()+1)}-${pad(state.selected.getDate())}`;
})();
