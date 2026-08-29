(()=>{'use strict';
const $=id=>document.getElementById(id), $$=s=>Array.from(document.querySelectorAll(s));
const inputs=['age','direct','income','irregular','shared','toAge','growth','oneOff'];
let mode='quick';
function num(v){if(v==null)return 0;const n=Number(String(v).replace(/\s/g,'').replace(',','.').replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:0}
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function money(v){return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(v))+' Kč'}
function compact(v){if(Math.abs(v)>=1e6)return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(v/1e6)+' mil. Kč';if(Math.abs(v)>=1000)return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(v/1000)+' tis. Kč';return money(v)}
function directValue(){if(mode==='detail'){const sum=$$('[data-envelope]').reduce((a,e)=>a+Math.max(0,num(e.value)),0);if(sum>0){$('direct').value=Math.round(sum);return sum}return Math.max(0,num($('direct').value))}return Math.max(0,num($('direct').value))}
function model(){const age=Math.round(clamp(num($('age').value),0,18));$('age').value=age;const direct=directValue();const irregular=Math.max(0,num($('irregular').value));const shared=Math.max(0,num($('shared').value));const income=Math.max(0,num($('income').value));const month=direct+irregular/12+shared;const year=month*12;const share=income>0?month/income*100:0;const toAge=Math.round(clamp(num($('toAge').value)||18,age,18));$('toAge').value=toAge;const growth=clamp(num($('growth').value),-20,30)/100;const oneOff=Math.max(0,num($('oneOff').value));const months=Math.max(0,(toAge-age)*12);let long=oneOff;for(let m=0;m<months;m++){const yr=Math.floor(m/12);long+=month*Math.pow(1+growth,yr)}return{age,direct,irregular,shared,income,month,year,share,toAge,growth,oneOff,months,long}}
function text(id,v){const el=$(id);if(el)el.textContent=v}
function updateBars(m){const max=Math.max(m.direct,m.irregular/12,m.shared,1);$('heroDirectBar').style.setProperty('--w',Math.round(m.direct/max*100)+'%');$('heroIrregularBar').style.setProperty('--w',Math.round((m.irregular/12)/max*100)+'%');$('heroSharedBar').style.setProperty('--w',Math.round(m.shared/max*100)+'%');const horizon=Math.max(1,(18-m.age)*12);$('runwayTrack').style.width=Math.min(100,m.months/horizon*100)+'%'}
function updateAnswer(m){let title='Začněte skutečnými výdaji',body='Tahle kalkulačka nevydává univerzální částku za „normální“. Největší hodnotu má, když do ní přenesete svůj běžný měsíc a celý rok.';if(m.month>0&&m.income===0){title='Máte měsíční náklad. Doplňte příjem jen pokud chcete kontext.';body='Roční i dlouhodobý scénář už fungují. Příjem slouží pouze k tomu, aby bylo vidět, jak velkou část rodinného cash-flow náklad tvoří.'}if(m.month>0&&m.income>0&&m.share<10){title='Dítě zabírá menší část čistého příjmu domácnosti';body='Než z toho uděláte závěr, ověřte, že jsou zahrnuté i tábory, začátky školního roku, vybavení a skutečné navýšení společných nákladů.'}else if(m.share>=10&&m.share<20){title='Je to výrazná položka rodinného rozpočtu';body='Největší přínos má rozdělit náklad na pravidelnou část a roční špičky. Ušetří to překvapení v měsících, kdy přijdou tábory nebo vybavení.'}else if(m.share>=20){title='Náklad silně zatěžuje měsíční cash-flow';body='Podívejte se i na celý rozpočet domácnosti, fixní výdaje a rezervu. Výsledek sám o sobě neříká, že výdaje na dítě jsou „příliš vysoké“.'}text('answerTitle',title);text('answerText',body)}

const lifeStages=[
  {min:0,max:2,name:'Péče',text:'V této etapě se mohou objevit výdaje na výživu, pleny, vybavení a péči. Částky ale zůstávají čistě vaše.'},
  {min:3,max:5,name:'Předškolák',text:'Do rozpočtu může přibýt školka, péče a první pravidelné aktivity. Nejde o cenový benchmark.'},
  {min:6,max:10,name:'Mladší školák',text:'Často začíná být vidět škola, družina, kroužky, tábory a sezónní vybavení.'},
  {min:11,max:14,name:'Starší školák',text:'Může růst význam dopravy, sportu, techniky a samostatných drobných výdajů.'},
  {min:15,max:18,name:'Student',text:'Do rozpočtu může více vstupovat dojíždění, jídlo mimo domov, technologie a větší samostatnost.'}
];
function pct(v,total){return total>0?Math.round(v/total*100):0}
function updateDepth(m){
  const irr=m.irregular/12,total=m.month||0;
  const parts=[
    {name:'Přímé výdaje',value:m.direct,note:'Běžná měsíční část rozpočtu.'},
    {name:'Roční špičky',value:irr,note:'Měsíční rezerva z nepravidelných výdajů.'},
    {name:'Společné navýšení',value:m.shared,note:'Část nákladů celé domácnosti vzniklá navíc.'}
  ];
  text('fingerprintTotal',money(total));
  text('fpDirectValue',money(m.direct)); text('fpDirectPct',pct(m.direct,total)+' %');
  text('fpIrregularValue',money(irr)); text('fpIrregularPct',pct(irr,total)+' %');
  text('fpSharedValue',money(m.shared)); text('fpSharedPct',pct(m.shared,total)+' %');
  $('fpDirect').style.width=pct(m.direct,total)+'%'; $('fpIrregular').style.width=pct(irr,total)+'%'; $('fpShared').style.width=pct(m.shared,total)+'%';
  const lead=parts.reduce((a,b)=>b.value>a.value?b:a,parts[0]);
  text('fingerprintLead',total>0?lead.name+' · '+money(lead.value):'—');
  text('fingerprintLeadNote',total>0?lead.note:'Doplňte vlastní částky a stopa se sestaví automaticky.');
  text('seasonReserve',money(irr)); text('seasonAnnual','z '+money(m.irregular)+' zadaných za celý rok');
  const stage=lifeStages.find(x=>m.age>=x.min&&m.age<=x.max)||lifeStages[lifeStages.length-1];
  text('lifeNow',stage.name); text('lifeNowText',stage.text);
  $$('[data-life-min]').forEach(el=>{const active=m.age>=Number(el.dataset.lifeMin)&&m.age<=Number(el.dataset.lifeMax);el.classList.toggle('is-active',active)});
  $('lifeProgress').style.width=Math.max(0,Math.min(100,m.age/18*100))+'%';
}

function update(){const m=model();text('heroAge',m.age);text('heroMonth',m.month?money(m.month):'—');text('heroYear',m.year?compact(m.year):'—');text('heroLong',m.long?compact(m.long):'—');text('resultAge',m.age+' let');text('monthResult',money(m.month));text('yearResult',money(m.year));text('shareResult',m.income>0?new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(m.share)+' %':'—');text('directResult',money(m.direct));text('irregularResult',money(m.irregular/12));text('sharedResult',money(m.shared));text('toAgeLabel',m.toAge);text('runwayCaption',new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(m.growth*100)+' % roční změna');text('longResult',money(m.long));text('runwayMeaning',m.month>0?`Scénář počítá ${m.months} měsíců z vašeho současného rozpočtu${m.oneOff?` a přidává jednorázově ${money(m.oneOff)}`:''}.`:'Doplňte vlastní částky. Dlouhodobý scénář se pak spočítá z vašeho současného rozpočtu.');text('formStatus',m.month>0?'Výsledek je přepočítaný z vašich vstupů.':'Připraveno pro vaše data.');updateBars(m);updateAnswer(m);updateDepth(m);syncUrl(false)}
function setMode(next){mode=next;$$('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});$('detailPanel').hidden=mode!=='detail';update()}
function loadDemo(){mode='quick';setMode('quick');$('age').value=8;$('direct').value=7600;$('income').value=65000;$('irregular').value=18000;$('shared').value=900;$('toAge').value=18;$('growth').value=0;$('oneOff').value=0;update();text('formStatus','Načtený je pouze ukázkový scénář — přepište ho vlastními čísly.')}
function reset(){['direct','income','irregular','shared','growth','oneOff'].forEach(id=>$(id).value=0);$$('[data-envelope]').forEach(e=>e.value=0);$('age').value=8;$('toAge').value=18;setMode('quick');text('copyStatus','');update()}
function resultText(){const m=model();return `Náklady na dítě: ${money(m.month)} měsíčně, ${money(m.year)} ročně, scénář do ${m.toAge} let ${money(m.long)}${m.income>0?`, podíl na čistém příjmu ${m.share.toFixed(1).replace('.',',')} %`:''}. RychléVýpočty.cz`}
async function copy(value){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(value);const t=document.createElement('textarea');t.value=value;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
function syncUrl(push){const p=new URLSearchParams();p.set('vek',$('age').value);p.set('rezim',mode);inputs.filter(id=>id!=='age').forEach(id=>p.set(id,$(id).value));if(mode==='detail')$$('[data-envelope]').forEach((e,i)=>p.set('e'+i,e.value));try{history[push?'pushState':'replaceState']({},'',location.pathname+'?'+p.toString())}catch(_){}}
function loadUrl(){const p=new URLSearchParams(location.search);if(!p.size)return;mode=p.get('rezim')==='detail'?'detail':'quick';if(p.has('vek'))$('age').value=p.get('vek');inputs.filter(id=>id!=='age').forEach(id=>{if(p.has(id))$(id).value=p.get(id)});$$('[data-envelope]').forEach((e,i)=>{if(p.has('e'+i))e.value=p.get('e'+i)});setMode(mode)}
inputs.forEach(id=>$(id).addEventListener('input',update));$$('[data-envelope]').forEach(e=>e.addEventListener('input',update));$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));$('demoBtn').addEventListener('click',loadDemo);$('resetBtn').addEventListener('click',reset);$('copyBtn').addEventListener('click',async()=>{try{await copy(resultText());text('copyStatus','Výsledek byl zkopírován.')}catch(_){text('copyStatus','Kopírování se nepodařilo.')}});$('shareBtn').addEventListener('click',async()=>{syncUrl(true);try{await copy(location.href);text('copyStatus','Odkaz s nastavením byl zkopírován.')}catch(_){text('copyStatus','Odkaz je připraven v adresním řádku.')}});loadUrl();update();
})();

// RV shared mobile navigation primitive
(() => {
  const menu = document.querySelector('.cc88-menu');
  const nav = document.querySelector('.cc88-mobile-nav');
  if (!menu || !nav) return;
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    nav.hidden = open;
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.setAttribute('aria-expanded','false');
    nav.hidden = true;
  }));
})();
