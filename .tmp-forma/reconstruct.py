from pathlib import Path
import base64, gzip, hashlib

ROOT=Path('.')
TMP=ROOT/'.tmp-forma'
FILES={
 'prepocet-formy-na-peceni.html':(['p_html_00','p_html_01','p_html_02','p_html_03','p_html_04'],'2c967098863a9addf89430afcd54a05806c466b2683b7803e2fc9f074815fa06'),
 'prepocet-formy-core.js':(['p_core_00'],'04f94a59b74d9b18bf1dc8b399f3e40c6f941f39a5df32576addb15a8fe99ddd'),
 'prepocet-formy-page.js':(['p_page_00','p_page_01'],'bfde22c3ab492b392142f98aedd5e2dd8cfd1a2ba707b3c9598d09e2be4da070'),
}
for filename,(parts,expected) in FILES.items():
    payload=''.join((TMP/p).read_text(encoding='utf-8').strip() for p in parts)
    raw=gzip.decompress(base64.b64decode(payload,validate=True))
    actual=hashlib.sha256(raw).hexdigest()
    if actual!=expected:
        raise SystemExit(f'HASH ERROR {filename}: {actual} != {expected}')
    (ROOT/filename).write_bytes(raw)
    print(f'{filename}: {len(raw)} bytes SHA256 {actual} PASS')
