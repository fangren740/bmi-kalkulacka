"""Identical input and viewport comparisons against the PR's prior revision."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
out=Path('/tmp/rv-shift51');out.mkdir(exist_ok=True)
scenarios=[('sobota','2026-12-05','06:00','14:00','10:00',0,'150 Kč'),('noc','2026-12-11','22:00','06:00','02:00',0,'260 Kč'),('svatek','2026-12-25','08:00','16:00','12:00',2,'1 600 Kč')]
with sync_playwright() as p:
 b=p.chromium.launch()
 for version,folder in [('pred',root/'.shift52-before'),('po',root)]:
  for width in [320,390,1440]:
   page=b.new_page(viewport={'width':width,'height':1000 if width==1440 else 844},locale='cs-CZ',reduced_motion='reduce')
   def route(req):
    f=folder/urlsplit(req.request.url).path.lstrip('/')
    if f.is_file():req.fulfill(path=f)
    else:req.abort()
   page.route('http://rv.test/**',route)
   for name,date,start,end,pause,ot,expected in scenarios:
    page.goto('http://rv.test/kalkulacka-priplatku-za-smeny.html')
    for id,value in dict(shiftDate=date,shiftStart=start,shiftEnd=end,breakMinutes=30,breakStart=pause,hourlyRate=200,averageEarnings=200,overtimeHours=ot).items():
     el=page.locator('#'+id)
     el.evaluate("e=>{if(e.closest('details'))e.closest('details').open=true}")
     el.fill(str(value))
    page.locator('#holidayCompensation').select_option('pay')
    assert page.locator('#cashBonus').inner_text().replace('\xa0',' ').replace('\u202f',' ')==expected
    page.locator('#compDetails').evaluate('e=>e.open=false')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(version,width,name)
    if width!=320:
     page.evaluate('scrollTo(0,0)');page.screenshot(path=out/f'{version}-{width}-{name}-zadani.png')
     page.locator('#vysledek').screenshot(path=out/f'{version}-{width}-{name}-vysledek.png')
     if version=='po':page.locator('#rozbor').screenshot(path=out/f'{version}-{width}-{name}-rozbor.png')
   page.locator('#monthSample').click()
   assert '2 010' in page.locator('#monthBonus').inner_text().replace('\xa0',' ').replace('\u202f',' ')
   if width!=320:page.locator('#mesic').screenshot(path=out/f'{version}-{width}-mesic.png')
   page.close()
 b.close()
print('PASS: three independent totals, 320/390/1440 overflow, paired entry/result/month captures')
