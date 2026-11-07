from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit
import json
root=Path(__file__).parent/'dist';out=Path('/tmp/concepts52');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch()
 for mode in ['a','b']:
  for width in [390,1440]:
   page=b.new_page(viewport={'width':width,'height':844 if width==390 else 1000},locale='cs-CZ')
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.route('http://concept.test/**',lambda r:r.fulfill(path=root/urlsplit(r.request.url).path.lstrip('/')))
   page.goto('http://concept.test/koncept-'+mode+'.html')
   page.screenshot(path=out/f'{mode}-{width}-vstup.png',full_page=True)
   if mode=='b':
    page.locator('.decision-list [data-go=shift]').click()
    page.locator('[data-step="2"]').last.click()
    page.locator('[data-step="3"]').last.click()
   assert '260' in page.locator('#x-verdict .big-money').inner_text()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=out/f'{mode}-{width}-vysledek.png',full_page=True)
   page.locator('#surface [data-go=audit]').first.click()
   page.locator('#x-paid').fill('240')
   assert '20' in page.locator('#x-difference').inner_text()
   page.screenshot(path=out/f'{mode}-{width}-paska.png',full_page=True)
   page.locator('[data-nav=month]:visible').first.click()
   page.locator('#x-demo').click()
   assert '2\xa0010' in page.locator('.month-hero .big-money').inner_text() or '2 010' in page.locator('.month-hero .big-money').inner_text()
   page.screenshot(path=out/f'{mode}-{width}-mesic.png',full_page=True)
   page.locator('[data-nav=guide]').first.click()
   assert page.locator('#surface .article section').count()==6
   page.screenshot(path=out/f'{mode}-{width}-pruvodce.png',full_page=True)
   assert not errors,errors
   page.close()
 b.close()
print('PASS: A/B 390/1440, 260 Kč shift, −20 Kč variance, 2010 Kč ledger, 6 guide sections, no JS errors/overflow')
