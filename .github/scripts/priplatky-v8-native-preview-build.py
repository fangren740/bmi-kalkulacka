#!/usr/bin/env python3
"""Make an offline, single-file HTML preview from exact approved-for-review source.
Only a review artifact: never commits calculator changes to main or deploys.
"""
from pathlib import Path
from urllib.parse import urlsplit
import base64
import hashlib
import json
import mimetypes
import re

ROOT = Path(__file__).resolve().parents[2]
SOURCE_SHA = '09352428b75f5145cb11af9f2484e80b6a8e1dd2'
OUTPUT = ROOT / 'RV_PRIPLATKY_V8_NATIVE_LIVE_PREVIEW.html'
SOURCE = ROOT / 'kalkulacka-priplatku-za-smeny.html'
text = SOURCE.read_text(encoding='utf-8')
assert '20260916-v8-validation1' in text and 'id="kalkulacka"' in text, 'Wrong calculator version'
assert '<iframe' not in text.lower(), 'Source contains an iframe'

assets = {}
def local_path(uri):
    p = urlsplit(uri).path.lstrip('/')
    if not p or '..' in Path(p).parts:
        raise ValueError('Unsafe local asset: '+uri)
    result = (ROOT / p).resolve()
    if not result.is_relative_to(ROOT.resolve()) or not result.is_file():
        raise FileNotFoundError('Missing inline asset '+uri)
    return result

def data_uri(uri):
    file = local_path(uri)
    data = file.read_bytes()
    mime = mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
    if file.suffix == '.svg': mime = 'image/svg+xml'
    assets[str(file.relative_to(ROOT))] = hashlib.sha256(data).hexdigest()
    return 'data:'+mime+';base64,'+base64.b64encode(data).decode('ascii')

# Inlining CSS retains exact cascade and removes all remote CSS requests.
stylesheet = re.compile(r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=["\'](?P<src>[^"\']+)["\'][^>]*>', re.I)
def inline_css(match):
    src = match.group('src')
    file = local_path(src)
    css = file.read_text(encoding='utf-8')
    assets[str(file.relative_to(ROOT))] = hashlib.sha256(css.encode()).hexdigest()
    def replace_url(m):
        uri = m.group(2).strip()
        if not uri or uri.startswith(('data:', 'http:', 'https:', '#')): return m.group(0)
        return 'url("'+data_uri(uri)+'")'
    css = re.sub(r'url\(\s*(["\']?)([^)"\']+)\1\s*\)', replace_url, css, flags=re.I)
    assert '</style' not in css.lower(), 'Unsafe stylesheet delimiter'
    return '<style data-original-stylesheet="'+src+'">\n'+css+'\n</style>'
text, css_count = stylesheet.subn(inline_css, text)
assert css_count >= 2, 'Stylesheets missing'

# Inline all local images and actual branding as data URLs.
image = re.compile(r'(<(?:img|source)\b[^>]*\bsrc=["\'])(?P<src>[^"\']+)(["\'])', re.I)
def inline_image(match):
    src = match.group('src')
    if src.startswith(('http:', 'https:', 'data:')): return match.group(0)
    return match.group(1)+data_uri(src)+match.group(3)
text = image.sub(inline_image, text)
assert 'data:image/svg+xml;base64,' in text, 'Brand assets were not inlined'

# Remove external favicons/manifest and canonical from preview.
text = re.sub(r'<link\b[^>]*\brel=["\'](?:icon|apple-touch-icon|manifest|canonical)["\'][^>]*>\s*', '', text, flags=re.I)
text = re.sub(r'<meta\s+name=["\']robots["\'][^>]*>', '<meta name="robots" content="noindex,nofollow">', text, count=1, flags=re.I)

# Keep navigation to production; in-page anchors remain native.
def link_to_site(m):
    return m.group(1)+'https://rychlevypocty.cz/'+m.group(2)
text = re.sub(r'(<a\b[^>]*\bhref=["\'])/([^"\']*)', link_to_site, text, flags=re.I)

# Move DOM-dependent scripts to end in original order (brand, calculator).
script = re.compile(r'<script\b(?P<attrs>[^>]*)\bsrc=["\'](?P<src>[^"\']+)["\'][^>]*>\s*</script>', re.I)
scripts = []
def collect_js(match):
    src = match.group('src')
    file = local_path(src)
    js = file.read_text(encoding='utf-8')
    assets[str(file.relative_to(ROOT))] = hashlib.sha256(js.encode()).hexdigest()
    assert '</script' not in js.lower(), 'Unsafe JS script delimiter'
    scripts.append('<script data-original-script="'+src+'">\n'+js+'\n</script>')
    return '<!-- Script moved intact to end of document: '+src+' -->'
text, js_count = script.subn(collect_js, text)
assert js_count == 2, f'Expected brand and calculator JS, got {js_count}'
# A callable replacement prevents Python's regex replacement-template parser from corrupting JS escapes.
text = re.sub(r'</body>', lambda _: '\n'+'\n'.join(scripts)+'\n</body>', text, count=1, flags=re.I)
assert re.search(r'<script\b[^>]*\bsrc=', text, re.I) is None, 'External script remains'
assert re.search(r'<link\b[^>]*\brel=["\']stylesheet', text, re.I) is None, 'External CSS remains'
assert '<iframe' not in text.lower(), 'Iframes forbidden in native preview'
assert '20260916-v8-validation1' in text, 'Version identifier missing'

manifest = {'source_commit': SOURCE_SHA, 'source_html_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'inlined_assets_sha256':assets, 'note':'Self-contained candidate preview only; production main untouched'}
(OUTPUT.with_suffix('.manifest.json')).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
OUTPUT.write_text(text,encoding='utf-8')
print('NATIVE_PREVIEW_OK',OUTPUT.name,'bytes',OUTPUT.stat().st_size,'css',css_count,'scripts',js_count,'sha256',hashlib.sha256(OUTPUT.read_bytes()).hexdigest())
print('SOURCE_SHA',SOURCE_SHA)
print('ASSETS',json.dumps(assets,sort_keys=True))
