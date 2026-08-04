(function(){
  'use strict';
  var form=document.getElementById('calorieForm');
  if(!form)return;
  var mode='basic';
  var modes=Array.from(document.querySelectorAll('[data-mode]'));
  var goalFields=document.getElementById('goalFields');
  var errorBox=document.getElementById('formError');
  var goal=document.getElementById('goal');
  var pace=document.getElementById('pace');
  var paceField=document.getElementById('paceField');
  var paceHelp=document.getElementById('paceHelp');
  var warning=document.getElementById('safetyWarning');
  var lastResult=null;
  var nf=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  var activityNames={'1.4':'nízká aktivita','1.6':'střední aktivita','1.8':'vysoká aktivita','2':'velmi vysoká aktivita'};
  var adjustments={lose:{gentle:-300,standard:-500,strong:-700},gain:{gentle:200,standard:350,strong:500},maintain:{gentle:0,standard:0,strong:0}};

  function number(id){return Number(String(document.getElementById(id).value).replace(',','.'));}
  function selected(name){var el=form.querySelector('input[name="'+name+'"]:checked');return el?el.value:'';}
  function round10(value){return Math.round(value/10)*10;}
  function format(value){return nf.format(Math.round(value));}
  function showError(message){errorBox.textContent=message;errorBox.hidden=false;errorBox.scrollIntoView({behavior:'smooth',block:'center'});}
  function clearError(){errorBox.hidden=true;errorBox.textContent='';}
  function validate(age,height,weight){
    if(!Number.isFinite(age)||age<18||age>79)return 'Zadejte věk od 18 do 79 let.';
    if(!Number.isFinite(height)||height<130||height>230)return 'Zadejte výšku od 130 do 230 cm.';
    if(!Number.isFinite(weight)||weight<35||weight>300)return 'Zadejte hmotnost od 35 do 300 kg.';
    return '';
  }
  function updateGoalUi(){
    var value=goal.value;
    paceField.hidden=value==='maintain';
    if(value==='lose')paceHelp.textContent='Mírná −300, střední −500, výraznější −700 kcal denně.';
    else if(value==='gain')paceHelp.textContent='Mírná +200, střední +350, výraznější +500 kcal denně.';
    else paceHelp.textContent='Pro udržení se žádná změna nepřičítá ani neodečítá.';
  }
  function setMode(next){
    mode=next;
    modes.forEach(function(button){var active=button.dataset.mode===mode;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    goalFields.hidden=mode!=='advanced';
    if(mode==='basic')goal.value='maintain';
    updateGoalUi();
    calculate(false);
  }
  function calculate(announce){
    clearError();
    var age=number('age'),height=number('height'),weight=number('weight');
    var invalid=validate(age,height,weight);
    if(invalid){if(announce)showError(invalid);return;}
    var sex=selected('sex');
    var pal=Number(selected('activity'));
    if(!sex||!pal){if(announce)showError('Vyberte pohlaví použité ve vzorci a úroveň aktivity.');return;}
    var bmr=10*weight+6.25*height-5*age+(sex==='male'?5:-161);
    var tdee=bmr*pal;
    var bmi=weight/Math.pow(height/100,2);
    var goalValue=mode==='advanced'?goal.value:'maintain';
    var paceValue=pace.value;
    var adjustment=adjustments[goalValue][paceValue];
    var blockedLowBmi=goalValue==='lose'&&bmi<18.5;
    if(blockedLowBmi)adjustment=0;
    var target=tdee+adjustment;
    var lowTarget=goalValue==='lose'&&target<1200;
    var displayTarget=lowTarget?1200:target;
    var status=goalValue==='lose'?'Snižování':goalValue==='gain'?'Zvyšování':'Udržování';
    var label=goalValue==='lose'?'Orientační příjem pro úbytek':goalValue==='gain'?'Orientační příjem pro nárůst':'Udržovací příjem';
    if(blockedLowBmi){status='Individuální posouzení';label='Udržovací orientace';displayTarget=tdee;}
    document.getElementById('resultStatus').textContent=status;
    document.getElementById('mainLabel').textContent=label;
    document.getElementById('mainCalories').textContent=format(round10(displayTarget));
    document.getElementById('mainKilojoules').textContent=format(round10(displayTarget*4.184));
    document.getElementById('bmrValue').textContent=format(round10(bmr));
    document.getElementById('tdeeValue').textContent=format(round10(tdee));
    document.getElementById('activityLabel').textContent=activityNames[String(pal)];
    document.getElementById('rangeValue').textContent=format(round10(tdee*.9))+'–'+format(round10(tdee*1.1))+' kcal';
    document.getElementById('adjustmentValue').textContent=(adjustment>0?'+':'')+format(adjustment)+' kcal';
    document.getElementById('goalLabel').textContent=blockedLowBmi?'hubnoucí scénář nepoužit':goalValue==='lose'?'proti vypočtenému TDEE':goalValue==='gain'?'proti vypočtenému TDEE':'udržovací scénář';
    document.getElementById('meal3').textContent=format(displayTarget/3)+' kcal';
    document.getElementById('meal4').textContent=format(displayTarget/4)+' kcal';
    document.getElementById('meal5').textContent=format(displayTarget/5)+' kcal';
    var ratio=Math.max(0,Math.min(100,bmr/tdee*100));
    document.getElementById('bmrBar').style.width=ratio.toFixed(1)+'%';
    document.getElementById('balanceText').textContent='BMR '+Math.round(ratio)+' % • aktivita '+Math.round(100-ratio)+' %';
    var insight='Výsledek '+format(round10(tdee))+' kcal je výchozí odhad pro běžný den. Ověřte jej podle několikatýdenního trendu, ne podle jediného vážení.';
    if(goalValue==='lose'&&!blockedLowBmi)insight='Scénář odečítá '+format(Math.abs(adjustment))+' kcal od vypočteného TDEE. Začněte konzervativně a podle delšího trendu upravujte po malých krocích.';
    if(goalValue==='gain')insight='Scénář přidává '+format(adjustment)+' kcal k vypočtenému TDEE. Skutečný poměr svalové a tukové hmoty kalkulačka neumí předpovědět.';
    document.getElementById('resultInsight').textContent=insight;
    warning.hidden=true;warning.textContent='';
    if(blockedLowBmi){warning.hidden=false;warning.textContent='Při vypočteném BMI pod 18,5 kalkulačka nevytváří cíl pro další snižování hmotnosti. Zobrazuje udržovací orientaci; vhodný postup řešte individuálně se zdravotníkem.';}
    else if(lowTarget){warning.hidden=false;warning.textContent='Zvolený scénář by vyšel pod 1 200 kcal denně. Kalkulačka proto zobrazuje pouze bezpečnostní hranici 1 200 kcal, nikoli doporučení. Pro vhodný cíl použijte mírnější změnu nebo individuální konzultaci.';}
    else if(bmi>=35&&goalValue==='lose'){warning.hidden=false;warning.textContent='Při BMI 35 a vyšším může být změna hmotnosti zdravotně přínosná, ale vhodný deficit, léky a případné komplikace patří do individuálního plánu se zdravotníkem.';}
    lastResult={sex:sex,age:age,height:height,weight:weight,pal:pal,bmr:round10(bmr),tdee:round10(tdee),target:round10(displayTarget),status:status,adjustment:adjustment};
  }
  modes.forEach(function(button){button.addEventListener('click',function(){setMode(button.dataset.mode);});});
  goal.addEventListener('change',function(){updateGoalUi();calculate(false);});
  pace.addEventListener('change',function(){calculate(false);});
  form.addEventListener('input',function(event){if(event.target.matches('input,select'))calculate(false);});
  form.addEventListener('change',function(){calculate(false);});
  form.addEventListener('submit',function(event){event.preventDefault();calculate(true);if(errorBox.hidden)document.getElementById('vysledek').scrollIntoView({behavior:'smooth',block:'start'});});
  document.getElementById('resetForm').addEventListener('click',function(){form.reset();setMode('basic');calculate(false);});
  document.getElementById('copyResult').addEventListener('click',function(){
    if(!lastResult)return;
    var text='Kalorická kalkulačka – orientační výsledek\nBMR: '+format(lastResult.bmr)+' kcal/den\nTDEE: '+format(lastResult.tdee)+' kcal/den\nScénář: '+lastResult.status+'\nZobrazený příjem: '+format(lastResult.target)+' kcal/den\nPAL: '+String(lastResult.pal).replace('.',',')+'\nVýsledek je orientační a nenahrazuje individuální nutriční doporučení.';
    var button=this;
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(function(){button.textContent='Zkopírováno';setTimeout(function(){button.textContent='Zkopírovat stručný přehled';},1800);});
    else{var area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();button.textContent='Zkopírováno';setTimeout(function(){button.textContent='Zkopírovat stručný přehled';},1800);}
  });
  updateGoalUi();
  calculate(false);
})();
