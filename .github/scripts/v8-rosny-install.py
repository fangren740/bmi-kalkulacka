#!/usr/bin/env python3
"""One-time install of reviewed source bytes; workflow commits generated product files."""
import base64,hashlib,lzma
from pathlib import Path
root=Path(__file__).resolve().parents[2]
expected={
 'rosny-bod-kalkulacka.html':'7d8429e074854b1e30799de2727660333d16a0a9721acd11c32d73118b5d3fd1',
 'rosny-bod-v8.css':'f402582f3d17a1dc6d849ab9fe26dfa9e2c521ee80aa722bf2275152fa7a5978',
 'rosny-bod-page.js':'4f52b7f12cbdaca898c4d8174500bfa29eb1b20baa6e79d20cc4431f8b3148e0',
}
for name,digest in expected.items():
 src=root/'.github'/'scripts'/(name+'.xz.b64')
 data=lzma.decompress(base64.b64decode(src.read_text().strip()))
 assert hashlib.sha256(data).hexdigest()==digest, f'identity mismatch: {name}'
 (root/name).write_bytes(data)
 print('VERIFIED_PRODUCT',name,digest)
