#!/usr/bin/env python3
"""Derived portfolio inventory; never infer DONE from inclusion in completedPages."""
import argparse
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'RV_VNEXT_INVENTORY.json'


def inventory():
    progress = json.loads((ROOT / 'RV_VNEXT_PROGRESS.json').read_text())
    registry = json.loads((ROOT / 'calculators-registry.json').read_text())
    tracked = {p['file']: p for key in ('completedPages', 'inProgressPages') for p in progress[key]}
    references = {p['file'] for p in progress['referencePages']}
    items = []
    for page in registry['items']:
        if page['type'] != 'calculator':
            continue
        actual = tracked.get(page['file'])
        items.append({
            'file': page['file'], 'categoryId': page['categoryId'],
            'sequence': actual.get('sequence') if actual else None,
            'status': actual['status'] if actual else ('REFERENCE_ONLY' if page['file'] in references else 'REVIEW_REQUIRED'),
        })
    return {'schemaVersion': 1, 'derivedFrom': ['calculators-registry.json', 'RV_VNEXT_PROGRESS.json'],
            'note': 'Status is tracker evidence, not a substitute for release QA. REVIEW_REQUIRED does not imply a full rebuild.',
            'totalCalculators': len(items), 'statusCounts': dict(sorted(Counter(p['status'] for p in items).items())), 'items': items}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    expected = json.dumps(inventory(), ensure_ascii=False, indent=2) + '\n'
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != expected:
            raise SystemExit('FAIL: regenerate RV_VNEXT_INVENTORY.json with python .github/scripts/vnext_inventory.py')
        print('PASS: complete calculator inventory matches registry and tracker')
    else:
        OUTPUT.write_text(expected)
        print(f'Updated {OUTPUT.name}')
