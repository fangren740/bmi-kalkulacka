(function(){
  const $ = (id) => document.getElementById(id);
  const money = (n) => Math.round(n).toLocaleString('cs-CZ') + ' Kč';
  const num = (id) => Number($(id)?.value || 0);
  function calculate(){
    const expenses = Math.max(0, num('monthlyExpenses'));
    const savings = Math.max(0, num('currentSavings'));
    const adults = Math.max(1, num('adults'));
    const children = Math.max(0, num('children'));
    const monthlySaving = Math.max(0, num('monthlySaving'));
    const stability = $('incomeStability').value;
    const housing = $('housingType').value;
    const car = $('carRisk').value;
    let base = 3;
    if(stability === 'mixed') base += 1;
    if(stability === 'unstable') base += 3;
    if(housing === 'rent') base += .75;
    if(housing === 'mortgage') base += 1.5;
    if(children > 0) base += Math.min(1.5, children * .6);
    if(adults === 1) base += .75;
    if(car === 'yes') base += .5;
    const recMonths = Math.min(10, Math.max(3, base));
    const minMonths = Math.max(2, Math.round((recMonths - 2) * 10) / 10);
    const comfortMonths = Math.min(12, Math.round((recMonths + 3) * 10) / 10);
    const minimum = expenses * minMonths;
    const recommended = expenses * recMonths;
    const comfort = expenses * comfortMonths;
    const survival = expenses > 0 ? savings / expenses : 0;
    const gap = Math.max(0, recommended - savings);
    const coverage = recommended > 0 ? Math.min(1.25, savings / recommended) : 0;
    const score = Math.max(0, Math.min(100, Math.round((coverage / 1.05) * 100)));
    let label = 'Rezerva je nízká';
    let summary = 'Aktuální rezerva nepokrývá ani minimální bezpečný polštář. Prioritou je omezit rizikové výdaje a začít rezervu pravidelně doplňovat.';
    let nextTitle = 'Další krok: dostaňte se nejdřív na minimum.';
    let nextText = 'Začněte menším automatickým odkladem a řešte výdaje, které nejsou nutné.';
    if(savings >= minimum){ label = 'Rezerva pokrývá základ'; summary = 'Máte základní bezpečnostní polštář. Doporučená rezerva ale ještě poskytne větší klid při výpadku příjmu nebo nečekaných výdajích.'; nextTitle='Další krok: dorovnejte doporučenou rezervu.'; }
    if(savings >= recommended){ label = 'Rezerva je bezpečná'; summary = 'Aktuální úspory pokrývají doporučenou rezervu pro vaši situaci. Teď dává smysl hlídat rozpočet a oddělit rezervu od dlouhodobých investic.'; nextTitle='Další krok: držte rezervu odděleně.'; nextText='Peníze na rezervu nechte likvidní a další přebytky řešte podle dlouhodobých cílů.'; }
    if(savings >= comfort){ label = 'Rezerva je komfortní'; summary = 'Rezerva je nad komfortní hranicí. To je silná pozice; další volné peníze už mohou mířit na cíle, bydlení nebo investice podle vašeho plánu.'; nextTitle='Další krok: naplánujte přebytky.'; nextText='Zvažte, kolik ponechat jako rezervu a co už může pracovat dlouhodobě.'; }
    const monthsToGoal = gap > 0 && monthlySaving > 0 ? Math.ceil(gap / monthlySaving) : 0;
    $('recommendedReserve').textContent = money(recommended);
    $('minimumReserve').textContent = money(minimum);
    $('comfortReserve').textContent = money(comfort);
    $('survivalMonths').textContent = survival.toLocaleString('cs-CZ',{maximumFractionDigits:1}) + ' měsíce';
    $('gapValue').textContent = gap > 0 ? money(gap) : '0 Kč';
    $('scoreLabel').textContent = label;
    $('scoreValue').textContent = score + ' / 100';
    $('resultSummary').textContent = summary;
    $('nextTitle').textContent = nextTitle;
    if(gap > 0 && monthlySaving > 0) nextText = `Při odkládání ${money(monthlySaving)} měsíčně dorovnáte doporučenou rezervu přibližně za ${monthsToGoal} měsíců.`;
    if(gap > 0 && monthlySaving === 0) nextText = 'Bez pravidelného odkladu se rezerva nedoplní. Nastavte si měsíční částku, která je realistická pro váš rozpočet.';
    $('nextText').textContent = nextText;
    $('levelMin').textContent = minMonths.toLocaleString('cs-CZ',{maximumFractionDigits:1}) + ' měsíce';
    $('levelRecommended').textContent = recMonths.toLocaleString('cs-CZ',{maximumFractionDigits:1}) + ' měsíce';
    $('levelComfort').textContent = comfortMonths.toLocaleString('cs-CZ',{maximumFractionDigits:1}) + ' měsíce';
    $('meterFill').style.width = Math.min(100, Math.round(coverage * 100)) + '%';
    $('meterText').textContent = `Máte pokryto ${Math.round(Math.min(100, coverage * 100))} % doporučené rezervy.`;
    $('savingPlan').textContent = money(monthlySaving);
    $('monthsToGoal').textContent = gap <= 0 ? 'splněno' : (monthlySaving > 0 ? monthsToGoal + ' měsíců' : 'není nastaveno');
    $('heroReserve').textContent = money(recommended);
    $('heroReserveStatus').textContent = recMonths.toLocaleString('cs-CZ',{maximumFractionDigits:1}) + ' měsíce výdajů';
  }
  document.addEventListener('DOMContentLoaded', function(){
    $('calculateReserve')?.addEventListener('click', calculate);
    document.querySelectorAll('#reserveForm input,#reserveForm select').forEach(el => el.addEventListener('input', calculate));
    calculate();
  });
})();
