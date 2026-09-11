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


def patch(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    original = text

    # Static canonical V3.2 assets. Runtime guard handles dimensions/classes/socials/trust.
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

    # Method correctness: shorter working time is not itself overtime.
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
