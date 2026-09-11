#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

TARGETS = [
    'procenta-kalkulacka.html',
    'kalkulacka-celkove-ceny-vlastnictvi-auta.html',
    'kalkulacka-hodinove-mzdy.html',
    'kalkulacka-dovolene.html',
    'kalkulacka-prescasu.html',
    'cestovni-nahrady-kalkulacka.html',
]

BRAND_CSS = '<link rel="stylesheet" href="/rv-brand-v32.css?v=20260801-stable">'
BRAND_FAVICON = '<link rel="icon" type="image/svg+xml" href="/favicon-rv-v32.svg?v=1">'
FINISH_RUNTIME = '<script src="/rv-adsense-finish-runtime-v7.js?v=20260911-1" defer></script>'


def add_body_classes(text: str) -> str:
    m = re.search(r'<body([^>]*)>', text, flags=re.I)
    if not m:
        return text
    attrs = m.group(1)
    cm = re.search(r'class="([^"]*)"', attrs, flags=re.I)
    required = ['rv-brand-v3', 'rv-brand-v32']
    if cm:
        classes = cm.group(1).split()
        for cls in required:
            if cls not in classes:
                classes.append(cls)
        new_attrs = attrs[:cm.start()] + f'class="{" ".join(classes)}"' + attrs[cm.end():]
    else:
        new_attrs = attrs + ' class="rv-brand-v3 rv-brand-v32"'
    return text[:m.start()] + '<body' + new_attrs + '>' + text[m.end():]


def add_footer_class(text: str) -> str:
    m = re.search(r'<footer([^>]*)>', text, flags=re.I)
    if not m:
        return text
    attrs = m.group(1)
    cm = re.search(r'class="([^"]*)"', attrs, flags=re.I)
    if cm:
        classes = cm.group(1).split()
        if 'rv-brand-footer' not in classes:
            classes.append('rv-brand-footer')
        attrs = attrs[:cm.start()] + f'class="{" ".join(classes)}"' + attrs[cm.end():]
    else:
        attrs += ' class="rv-brand-footer"'
    return text[:m.start()] + '<footer' + attrs + '>' + text[m.end():]


def add_group_roles(text: str) -> str:
    for cls in ('trust-row', 'quick-flow', 'tco-presets', 'vpc-presets', 'vpc-process-cards', 'payslip-mock'):
        text = re.sub(
            rf'<div class="([^"]*\b{re.escape(cls)}\b[^"]*)"(?![^>]*\brole=)([^>]*\baria-label=)',
            r'<div class="\1" role="group"\2',
            text,
            flags=re.I,
        )
    return text


def add_tabindex(text: str, control_id: str, value: str) -> str:
    pattern = rf'(<button(?=[^>]*\bid="{re.escape(control_id)}")(?=[^>]*\brole="tab")[^>]*)(>)'
    def repl(m: re.Match[str]) -> str:
        tag = m.group(1)
        if 'tabindex=' not in tag:
            tag += f' tabindex="{value}"'
        return tag + m.group(2)
    return re.sub(pattern, repl, text, count=1, flags=re.I)


def fix_travel_wizard_tabs(text: str) -> str:
    text = re.sub(
        r'<div class="([^"]*\bwizard-tabs\b[^"]*)"(?![^>]*\brole=)([^>]*)>',
        r'<div class="\1" role="tablist" aria-label="Kroky podrobného výpočtu"\2>',
        text,
        count=1,
        flags=re.I,
    )

    def tab_repl(m: re.Match[str]) -> str:
        tag = m.group(0)
        if 'class="' not in tag or 'wizard-tab' not in tag:
            return tag
        sm = re.search(r'data-step="(\d+)"', tag)
        if not sm:
            return tag
        step = sm.group(1)
        attrs = {
            'id': f'wizardTab{step}',
            'role': 'tab',
            'aria-controls': f'wizardPanel{step}',
            'aria-selected': 'true' if step == '1' else 'false',
            'tabindex': '0' if step == '1' else '-1',
        }
        for key, value in attrs.items():
            if re.search(rf'\b{re.escape(key)}=', tag):
                tag = re.sub(rf'\b{re.escape(key)}="[^"]*"', f'{key}="{value}"', tag)
            else:
                tag = tag[:-1] + f' {key}="{value}">'
        return tag

    text = re.sub(r'<button\b[^>]*\bclass="[^"]*\bwizard-tab\b[^"]*"[^>]*>', tab_repl, text, flags=re.I)

    def panel_repl(m: re.Match[str]) -> str:
        tag = m.group(0)
        sm = re.search(r'data-step-panel="(\d+)"', tag)
        if not sm:
            return tag
        step = sm.group(1)
        attrs = {'id': f'wizardPanel{step}', 'role': 'tabpanel', 'aria-labelledby': f'wizardTab{step}'}
        for key, value in attrs.items():
            if re.search(rf'\b{re.escape(key)}=', tag):
                tag = re.sub(rf'\b{re.escape(key)}="[^"]*"', f'{key}="{value}"', tag)
            else:
                tag = tag[:-1] + f' {key}="{value}">'
        return tag

    text = re.sub(r'<(?:div|section)\b[^>]*\bdata-step-panel="\d+"[^>]*>', panel_repl, text, flags=re.I)
    return text


def patch(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    original = text

    text = text.replace('src="logo-rychlevypocty.svg"', 'src="/logo-rv-v32.svg?v=1"')
    text = text.replace('src="/logo-rychlevypocty.svg"', 'src="/logo-rv-v32.svg?v=1"')
    text = text.replace('src="logo-rychlevypocty-footer.svg"', 'src="/logo-rv-v32-inverse.svg?v=1"')
    text = text.replace('src="/logo-rychlevypocty-footer.svg"', 'src="/logo-rv-v32-inverse.svg?v=1"')

    if 'rv-brand-v32.css' not in text:
        text = text.replace('</head>', f'{BRAND_CSS}\n{BRAND_FAVICON}\n</head>', 1)
    elif 'favicon-rv-v32.svg' not in text:
        text = text.replace('</head>', f'{BRAND_FAVICON}\n</head>', 1)

    if 'rv-adsense-finish-runtime-v7.js' not in text:
        text = text.replace('</body>', f'{FINISH_RUNTIME}\n</body>', 1)

    text = add_body_classes(text)
    text = add_footer_class(text)
    text = add_group_roles(text)

    # Full tab contract for existing two-mode controls.
    for control_id, value in (
        ('basicTab', '0'), ('proTab', '-1'),
        ('basicModeTab', '0'), ('advancedModeTab', '-1'),
    ):
        text = add_tabindex(text, control_id, value)

    if path.name == 'cestovni-nahrady-kalkulacka.html':
        text = fix_travel_wizard_tabs(text)

    if path.name == 'kalkulacka-prescasu.html':
        text = text.replace(
            'Jen hodiny nad rozvrženou pracovní dobu.',
            'Zadejte jen hodiny, které skutečně splňují definici práce přesčas. U kratší pracovní doby není samotné překročení sjednaného kratšího úvazku automaticky přesčasem.'
        )

    if text != original:
        path.write_text(text, encoding='utf-8')
        print(f'PATCHED {path}')
    else:
        print(f'UNCHANGED {path}')


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    for rel in TARGETS:
        path = root / rel
        if not path.exists():
            raise SystemExit(f'Missing target: {rel}')
        patch(path)


if __name__ == '__main__':
    main()
