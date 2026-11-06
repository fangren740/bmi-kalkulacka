from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import expect, sync_playwright
import json
import os
out = Path(os.environ.get('RV_QA_OUTPUT', '/tmp/rv-shift51'))
out.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[2]
url='http://rv.test/kalkulacka-priplatku-za-smeny.html'
def norm(s):
    return s.replace('\xa0',' ').replace('\u202f',' ')
def load(page,folder):
    def route(req):
        f=folder/urlsplit(req.request.url).path.lstrip('/')
        if f.is_file(): req.fulfill(path=f)
        else: req.abort()
    page.route('http://rv.test/**',route)
    page.goto(url)
def fill(page,**fields):
    for id,value in fields.items():
        target=page.locator('#'+id)
        if not target.is_visible():
            target.evaluate("el=>{if(el.closest('details'))el.closest('details').open=true}")
        if id.endswith('Compensation'): target.select_option(str(value))
        else: target.fill(str(value))
def check(page,**fields):
    for id,value in fields.items():
        actual=norm(page.locator('#'+id).text_content()).strip()
        assert actual==value,(id,actual,value)
with sync_playwright() as p:
    executable = os.environ.get('RV_CHROMIUM')
    args = ['--no-sandbox', '--single-process', '--no-zygote', '--disable-dev-shm-usage'] if executable else []
    browser = p.chromium.launch(executable_path=executable, args=args)
    for width,height in [(390,844),(1440,1000)]:
        page=browser.new_page(viewport={'width':width,'height':height},locale='cs-CZ',timezone_id='America/Los_Angeles',reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        load(page,root)
        brand=page.get_by_role('link',name='RychléVýpočty.cz – domů').first
        assert brand.inner_text()=='RychléVýpočty.cz'
        logo=brand.bounding_box()
        masthead=page.locator('.sf-header-inner').bounding_box()
        assert logo['x']>=masthead['x'] and logo['x']+logo['width']<=masthead['x']+masthead['width']
        toggle=page.locator('#menuToggle')
        if width==390:
            button=toggle.bounding_box()
            assert button['width']>=44 and logo['x']+logo['width']<button['x']
            assert abs(logo['y']+logo['height']/2-button['y']-button['height']/2)<=1
            expect(page.get_by_role('navigation',name='Mobilní navigace')).to_be_hidden()
            toggle.focus()
            page.keyboard.press('Enter')
            expect(toggle).to_have_attribute('aria-expanded','true')
            expect(page.get_by_role('navigation',name='Mobilní navigace').get_by_role('link',name='Spočítat směnu')).to_be_visible()
            page.screenshot(path=out/'header-390-menu.png')
            page.keyboard.press('Tab')
            page.keyboard.press('Escape')
            expect(toggle).to_be_focused()
            expect(toggle).to_have_attribute('aria-expanded','false')
            toggle.blur()
        else:
            expect(toggle).to_be_hidden()
            nav=page.get_by_role('navigation',name='Hlavní navigace').bounding_box()
            cta=page.locator('.sf-header-cta').bounding_box()
            assert logo['x']+logo['width']<nav['x']<nav['x']+nav['width']<cta['x']
            assert abs(nav['x']+nav['width']/2-width/2)<=1
        page.screenshot(path=out/f'header-{width}.png')
        fill(page,shiftDate='2026-11-06',shiftStart='22:00',shiftEnd='06:00',breakMinutes=30,breakStart='02:00',hourlyRate=200,averageEarnings=200)
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=out/f'candidate-{width}.png')
        page.locator('.sf-show-result').click()
        page.screenshot(path=out/f'candidate-{width}-vysledek.png')
        check(page,cashBonus='260 Kč',totalPay='1 760 Kč')
        assert page.locator('#shiftDate').input_value()=='6. 11. 2026', 'ISO URL/test date should be normalized visually to Czech format'
        fill(page,shiftStart='2200')
        page.locator('#shiftEnd').click()
        assert page.locator('#shiftStart').input_value()=='22:00', 'compact 24h value must normalize on blur'
        check(page,cashBonus='260 Kč')
        assert page.locator('#shiftStart').get_attribute('type')=='text', '24h time must never render AM/PM'
        assert page.locator('#shiftDate').get_attribute('type')=='text', 'date field must have stable Czech format'
        fill(page,shiftDate='6. 11. 2026')
        check(page,cashBonus='260 Kč')
        assert page.locator('#shiftDateNative').input_value()=='2026-11-06'
        page.locator('#shiftDateNative').fill('2026-11-07')
        assert page.locator('#shiftDate').input_value()=='7. 11. 2026'
        fill(page,shiftDate='6. 11. 2026')
        check(page,cashBonus='260 Kč')
        fill(page,shiftStart='25:00')
        check(page,cashBonus='—')
        fill(page,shiftStart='22:00')
        fill(page,paidBonus=240,auditCount=1)
        check(page,auditExpected='260 Kč',auditPaid='240 Kč',auditDifference='−20 Kč')
        fill(page,paidBonus=0)
        check(page,auditDifference='−260 Kč')
        fill(page,paidBonus=500,repeatCount=2)
        check(page,auditExpected='520 Kč',auditDifference='−20 Kč',repeatBonus='520 Kč')
        fill(page,repeatCount=1,shiftDate='2026-12-25',holidayCompensation='pay',overtimeHours=2,overtimeStart='04:00')
        check(page,autoWorked='7,5 h',autoNight='7,5 h',autoWeekend='5,5 h',autoHoliday='7,5 h',cashBonus='1 860 Kč',totalPay='3 360 Kč')
        assert page.locator('#overtimeTrack i').count()==1
        page.locator('[data-regime=salary]').click()
        page.locator('#salaryRestDay').check()
        check(page,cashBonus='2 275 Kč',totalPay='3 775 Kč')
        fill(page,overtimeCompensation='leave')
        check(page,cashBonus='2 075 Kč',basePay='1 100 Kč',timeOff='2 h')
        fill(page,holidayCompensation='leave')
        check(page,cashBonus='575 Kč',timeOff='9,5 h')
        page.locator('[data-regime=agreement]').click()
        check(page,cashBonus='260 Kč',timeOff='7,5 h')
        page.locator('[data-regime=wage]').click()
        fill(page,overtimeStart='',overtimeHours=0,breakMinutes=0,shiftDate='2026-03-28')
        check(page,autoWorked='7 h',autoNight='7 h',autoWeekend='7 h',cashBonus='280 Kč')
        fill(page,shiftDate='2026-10-24')
        check(page,autoWorked='9 h',autoNight='9 h',autoWeekend='9 h',cashBonus='360 Kč')
        fill(page,breakMinutes=30,breakStart='02:00')
        check(page,cashBonus='—',auditExpected='—')
        assert 'dvojznačný' in page.locator('#formError').inner_text()
        fill(page,shiftDate='2026-11-06',shiftStart='08:00',shiftEnd='16:00',breakMinutes=30,breakStart='15:45')
        check(page,cashBonus='—')
        assert 'uvnitř směny' in page.locator('#formError').inner_text()
        fill(page,breakMinutes=0)
        check(page,cashBonus='0 Kč',totalPay='1 600 Kč')
        fill(page,averageEarnings='')
        check(page,cashBonus='—',auditExpected='—')
        fill(page,averageEarnings=200)
        page.locator('#sfManualTab').click()
        fill(page,manualWorked=0,manualNight=0,manualWeekend=0,manualHoliday=0)
        check(page,cashBonus='0 Kč',totalPay='0 Kč')
        fill(page,manualNight=1)
        check(page,cashBonus='—')
        page.locator('#sfShiftTab').click()
        fill(page,shiftDate='31. 11. 2026')
        check(page,cashBonus='—')
        fill(page,shiftDate='30. 11. 2026',shiftStart='22:00',shiftEnd='06:00')
        page.locator('#saveShift').click()
        assert 'dalšího měsíce' in page.locator('#shiftSaveStatus').text_content()
        assert page.locator('#monthRows li').count()==0

        # Independent December ledger: 150 + 260 + (7.5 × 200 + 2 × 50).
        page.locator('#monthSample').click()
        check(page,monthBonus='2 010 Kč',monthBase='4 500 Kč',monthTotal='6 510 Kč',
              monthWorked='22,5 h',monthNight='7,5 h',monthWeekend='13 h',
              monthHoliday='7,5 h',monthOvertime='2 h',monthLeave='0 h')
        assert page.locator('#monthRows li').count()==3
        check(page,**{'expected-night':'150 Kč','expected-weekend':'260 Kč',
                     'expected-holidayCash':'1 500 Kč','expected-overtimeCash':'100 Kč','expected-custom':'0 Kč'})
        page.locator('#paid-night').fill('150')
        page.locator('#paid-weekend').fill('280')
        page.locator('#paid-holidayCash').fill('1400')
        page.locator('#paid-overtimeCash').fill('0')
        check(page,**{'difference-night':'0 Kč','difference-weekend':'+20 Kč',
                     'difference-holidayCash':'−100 Kč','difference-overtimeCash':'−100 Kč','difference-custom':'—'})
        assert 'Svátek −100 Kč' in norm(page.locator('#auditLargest').text_content())
        check(page,auditPaid='1 830 Kč',auditDifference='—')
        assert '4 z 5' in page.locator('#auditMessage').text_content()
        page.locator('#paid-custom').fill('0')
        check(page,auditPaid='1 830 Kč',auditDifference='−180 Kč')
        page.locator('#paid-custom').fill('250')
        check(page,auditPaid='2 080 Kč',auditDifference='+70 Kč')
        page.locator('#paidBonus').fill('2050')
        assert 'liší o −30 Kč' in norm(page.locator('#auditMessage').text_content())
        page.locator('#paidBonus').fill('2100')
        assert 'liší o +20 Kč' in norm(page.locator('#auditMessage').text_content())
        with page.expect_download() as download:
            page.locator('#exportAudit').click()
        csv=download.value.path().read_text(encoding='utf-8-sig')
        assert '"Celkem";"2010";"2080";"70"' in csv
        assert '"Přesčas";"100";"0";"-100"' in csv
        page.locator('#paid-custom').fill('')
        check(page,auditPaid='1 830 Kč',auditDifference='—')
        page.locator('#auditView').select_option('total')
        page.locator('#paidBonus').fill('1830')
        check(page,auditExpected='2 010 Kč',auditDifference='−180 Kč')
        page.locator('#auditScope').select_option('shift')
        assert page.locator('#paidBonus').input_value()=='500'
        page.locator('#auditScope').select_option('month')
        assert page.locator('#paidBonus').input_value()=='1830'
        page.locator('#auditView').select_option('categories')
        assert page.locator('#paid-holidayCash').input_value()=='1400'
        page.locator('#monthSample').click()
        assert page.locator('#monthRows li').count()==0

        fill(page,shiftDate='11. 12. 2026',shiftStart='22:00',shiftEnd='06:00',
             breakMinutes=30,breakStart='02:00',repeatCount=3)
        page.locator('#timelineCursor').fill('240')
        check(page,timelineCursorFlags='Neplacená pauza')
        page.locator('#timelineCursor').fill('120')
        check(page,timelineCursorFlags='Práce · Noční · Víkend')
        page.locator('#saveShift').click()
        check(page,monthBonus='260 Kč',monthWorked='7,5 h')
        page.locator('#saveShift').click()
        assert 'překrývá' in page.locator('#shiftSaveStatus').text_content()
        page.locator('[data-month-action=duplicate]').click()
        assert page.locator('#shiftDate').input_value()==''
        fill(page,shiftDate='5. 12. 2026',shiftStart='06:00',shiftEnd='14:00',breakStart='10:00')
        page.locator('#saveShift').click()
        check(page,monthBonus='410 Kč')
        assert page.locator('#monthRows li').first.get_by_text('5. 12. 2026').is_visible()
        page.locator('[data-month-action=edit]').first.click()
        fill(page,averageEarnings=220,weekendPercent=15)
        page.locator('#saveShift').click()
        check(page,monthBonus='507,5 Kč')
        # Real browser download, refresh, then validated import of heterogeneous shifts.
        with page.expect_download() as download:
            page.locator('#exportMonth').click()
        backup=download.value.path().read_bytes()
        payload=json.loads(backup)
        assert sorted(shift['values']['averageEarnings'] for shift in payload['shifts'])==['200','220']
        assert sorted(shift['values']['weekendPercent'] for shift in payload['shifts'])==['10','15']
        page.reload()
        assert page.locator('#monthRows li').count()==0
        with page.expect_file_chooser() as chooser:
            page.locator('#importMonth').click()
        chooser.value.set_files({'name':'evidence.json','mimeType':'application/json','buffer':backup})
        expect(page.locator('#monthStatus')).to_contain_text('Přidáno 2')
        check(page,monthBonus='507,5 Kč',monthBase='3 000 Kč',monthTotal='3 507,5 Kč',monthWorked='15 h')
        assert page.locator('#monthRows li').count()==2
        file_input=page.locator('#monthBackupFile')
        file_input.set_input_files({'name':'evidence.json','mimeType':'application/json','buffer':backup})
        expect(page.locator('#monthStatus')).to_contain_text('přeskočeno 2')
        conflict=json.loads(backup)
        conflict['shifts'][0]['values']['averageEarnings']='999'
        file_input.set_input_files({'name':'konflikt.json','mimeType':'application/json','buffer':json.dumps(conflict).encode()})
        expect(page.locator('#monthStatus')).to_contain_text('překrývá')
        malformed=json.loads(backup)
        malformed['shifts'][0]['values']['shiftDate']='15. 12. 2026'
        malformed['shifts'][1]['values']['averageEarnings']='neplatné'
        file_input.set_input_files({'name':'vadna.json','mimeType':'application/json','buffer':json.dumps(malformed).encode()})
        expect(page.locator('#monthStatus')).to_contain_text('beze změny')
        assert page.locator('#monthRows li').count()==2
        check(page,monthBonus='507,5 Kč')
        page.locator('[data-month-action=edit]').first.click()
        assert page.locator('#averageEarnings').input_value()=='220'
        page.locator('#cancelShiftEdit').click()
        page.locator('[data-month-action=remove]').first.click()
        check(page,monthBonus='260 Kč')
        page.locator('[data-month-action=duplicate]').click()
        fill(page,shiftDate='2. 1. 2027',shiftStart='06:00',shiftEnd='14:00',breakStart='10:00')
        page.locator('#saveShift').click()
        check(page,monthBonus='150 Kč')
        page.locator('#monthSelect').select_option('2026-12')
        check(page,monthBonus='260 Kč',monthWorked='7,5 h')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        print(width,'PASS',flush=True)
        if not executable:
            page.close()
