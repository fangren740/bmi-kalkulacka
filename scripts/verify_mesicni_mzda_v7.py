#!/usr/bin/env python3
import csv
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'mesicni-mzda-z-hodinove-sazby-kalkulacka.html').read_text(encoding='utf-8')
JS = (ROOT / 'mesicni-mzda-z-hodinove-sazby.js').read_text(encoding='utf-8')
CSV = ROOT / 'mesicni-mzda-z-hodinove-sazby-2026-regression.csv'


def num(row, key, default=0.0):
    value = (row.get(key) or '').strip()
    return default if value == '' else float(value)


def check_source_contracts():
    required_html = [
        '/logo-rv-v32.svg?v=1',
        '/logo-rv-v32-inverse.svg?v=1',
        '/rv-brand-v32.css?v=20260801-stable',
        '/rv-social-links.css?v=20260907-1',
        'rv-brand-calculator',
        'rv-brand-result',
        'rv-brand-footer',
        'Základní placený fond bez přesčasů',
        'U kratší pracovní doby není každá hodina nad sjednaný úvazek automaticky přesčasem.',
        'Ověřené zdroje 2026',
        'https://mpsv.gov.cz/minimalni-mzda',
        'https://ppropo.mpsv.cz/XIX2Mzdanebonahradnivolnozapraci',
        'class="rv-social-links"',
    ]
    for needle in required_html:
        assert needle in HTML, f'Missing HTML contract: {needle}'
    assert 'logo-rychlevypocty.svg' not in HTML
    assert 'logo-rychlevypocty-footer.svg' not in HTML

    required_js = [
        'const MIN_HOURLY_2026=134.4',
        'function renderInvalid()',
        'Kalkulačka záměrně neponechává předchozí výsledek.',
        'input.setAttribute("aria-invalid",message?"true":"false")',
        'const minHourly=MIN_HOURLY_2026*40/v.minimumRegime',
    ]
    for needle in required_js:
        assert needle in JS, f'Missing JS contract: {needle}'


def verify_regression():
    checked = 0
    with CSV.open(encoding='utf-8', newline='') as f:
        for row in csv.DictReader(f):
            hourly = num(row, 'hourly_rate')
            weekly = num(row, 'weekly_hours')
            basis = row['basis']
            mode = row['mode']
            average_monthly_hours = weekly * 52 / 12
            selected_hours = num(row, 'actual_hours') if basis == 'actual' else average_monthly_hours
            if mode == 'advanced':
                base_paid_hours = max(0, selected_hours - num(row, 'unpaid_hours') + num(row, 'regular_extra_hours'))
                overtime_hours = num(row, 'overtime_hours')
                average_hourly = num(row, 'average_hourly', hourly)
                if (row.get('average_hourly') or '').strip() == '':
                    average_hourly = hourly
                overtime_base = overtime_hours * hourly
                overtime_premium = overtime_hours * average_hourly * (num(row, 'overtime_premium') / 100)
                monthly_extras = num(row, 'monthly_extras')
                annual_bonus = num(row, 'annual_bonus')
            else:
                base_paid_hours = selected_hours
                overtime_base = overtime_premium = monthly_extras = annual_bonus = 0
            monthly = hourly * base_paid_hours + overtime_base + overtime_premium + monthly_extras
            annual = monthly * 12 + annual_bonus
            min_hourly = 134.4 * 40 / num(row, 'minimum_regime')

            for label, actual, expected in [
                ('monthly', monthly, num(row, 'expected_monthly')),
                ('annual', annual, num(row, 'expected_annual')),
                ('min_hourly', min_hourly, num(row, 'expected_min_hourly')),
            ]:
                assert math.isclose(actual, expected, rel_tol=0, abs_tol=0.001), f"{row['case']} {label}: {actual} != {expected}"
            checked += 1
    assert checked >= 10
    return checked


if __name__ == '__main__':
    check_source_contracts()
    count = verify_regression()
    print(f'MESICNI_MZDA_V7_VERIFY_PASS {count} scenarios')
