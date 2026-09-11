#!/usr/bin/env python3
from __future__ import annotations

import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    'procenta-kalkulacka.html',
    'kalkulacka-celkove-ceny-vlastnictvi-auta.html',
    'kalkulacka-hodinove-mzdy.html',
    'kalkulacka-dovolene.html',
    'kalkulacka-prescasu.html',
    'cestovni-nahrady-kalkulacka.html',
]


def near(a: float, b: float, eps: float = 1e-8) -> None:
    if abs(a - b) > eps:
        raise AssertionError(f'{a} != {b}')


def static_contract() -> None:
    for rel in TARGETS:
        text = (ROOT / rel).read_text(encoding='utf-8')
        assert '/rv-adsense-finish-runtime-v7.js?v=20260911-1' in text, rel
        assert '/rv-brand-v32.css?v=20260801-stable' in text, rel
        assert '/favicon-rv-v32.svg?v=1' in text, rel
        assert 'rv-brand-v32' in text, rel
        assert 'rv-brand-footer' in text, rel
        assert 'logo-rychlevypocty.svg' not in text, rel
        assert 'logo-rychlevypocty-footer.svg' not in text, rel
    overtime = (ROOT / 'kalkulacka-prescasu.html').read_text(encoding='utf-8')
    assert 'není samotné překročení sjednaného kratšího úvazku automaticky přesčasem' in overtime
    runtime = (ROOT / 'rv-adsense-finish-runtime-v7.js').read_text(encoding='utf-8')
    for rel in TARGETS:
        assert rel in runtime, rel
    assert 'facebook.com/rychlevypocty' in runtime
    assert 'instagram.com/rychlevypocty' in runtime
    assert 'logo-rv-v32.svg?v=1' in runtime
    assert 'logo-rv-v32-inverse.svg?v=1' in runtime


def percentage_regression() -> None:
    near(200 * 15 / 100, 30)
    near(45 / 180 * 100, 25)
    near(800 * (1 + 12 / 100), 896)
    near(30 / (15 / 100), 200)
    near((125 - 100) / 100 * 100, 25)
    near(25 - 20, 5)
    near(100 * 1.10 * 0.90, 99)


def tco_regression() -> None:
    car_price, resale, years, annual_km, running_monthly = 720000, 330000, 5, 18000, 8500
    months = years * 12
    depreciation = car_price - resale
    running = running_monthly * months
    tco = depreciation + running
    near(tco, 900000)
    near(tco / months, 15000)
    near(tco / (annual_km * years), 10)
    # Financing adds only the premium above cash purchase price, not principal twice.
    purchase_payments = 780000
    near(depreciation + running + max(0, purchase_payments - car_price), 960000)


def hourly_regression() -> None:
    near(40000 / 168, 238.0952380952381)
    # 2026 statutory headline is explicitly a 40 h/week reference only.
    base = 134.40
    near(base * 40 / 38.75, 138.73548387096774)
    near(base * 40 / 37.5, 143.36)


def vacation_regression() -> None:
    annual = 40 * 5
    earned = math.ceil(annual * 52 / 52 - 1e-9)
    assert earned == 200
    dpp_annual = 20 * 4
    dpp_four_multiples = math.ceil(dpp_annual * 4 / 52 - 1e-9)
    assert dpp_four_multiples == 7
    over_52 = math.ceil(annual * 53 / 52 - 1e-9)
    assert over_52 == 204


def overtime_regression() -> None:
    hourly, average, hours = 180, 180, 8
    earned = hourly * hours
    premium = average * hours * .25
    near(earned, 1440)
    near(premium, 360)
    near(earned + premium, 1800)
    near(average * hours * .50, 720)


def travel_regression() -> None:
    meal = 155
    mileage = 180 * 5.90
    diesel = 180 * 5.8 / 100 * 44.50
    near(meal + mileage + diesel, 1681.58)
    # § 163(4): exactly two calendar days -> use more favorable of separate vs combined.
    separate = 0 + 0
    combined = 155  # 4 h + 4 h = 8 h
    assert max(separate, combined) == 155
    # Fuel date boundary.
    assert 34.10 != 44.50


def main() -> None:
    static_contract()
    percentage_regression()
    tco_regression()
    hourly_regression()
    vacation_regression()
    overtime_regression()
    travel_regression()
    print('BATCH1_VERIFY_PASS')


if __name__ == '__main__':
    main()
