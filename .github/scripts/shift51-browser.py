from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
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
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        print(width,'PASS',flush=True)
        if not executable:
            page.close()
