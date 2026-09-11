from pathlib import Path
p=Path('.tmp-forma/integrate.py')
text=p.read_text(encoding='utf-8')
start=text.index('# Reconstruct locally QA\'d production files.')
end=text.index('# Registry.')
replacement="""# Production files are reconstructed and hash-verified by reconstruct.py.\npage=(ROOT/'prepocet-formy-na-peceni.html').read_text(encoding='utf-8')\nreq(ABS in page,'canonical missing')\nreq('index,follow' in page,'robots not indexable')\nreq('/rv-brand-v32.css' in page and '/rv-brand-v32.js' in page,'brand contract references missing')\nreq('/prepocet-formy-core.js?v=20260911-1' in page and '/prepocet-formy-page.js?v=20260911-1' in page,'script references missing')\n\n# Registry.\n"""
p.write_text(text[:start]+replacement+text[end+len('# Registry.'):],encoding='utf-8')
print('integrator transport block patched')
