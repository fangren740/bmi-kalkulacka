#!/usr/bin/env python3
import json, math, re, statistics, sys
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
from difflib import SequenceMatcher

ROOT = Path(__file__).resolve().parents[1]
TRACKER = ROOT / 'RV_VNEXT_PROGRESS.json'

NATIVE_TERMS = {
    'timeline','runway','ledger','blueprint','xray','x-ray','map','route','stack','waterfall','gauge','meter','dial','radar','matrix','flow','calendar','receipt','invoice','ticket','ruler','track','rail','bridge','compass','fingerprint','planner','board','lab','inspector','architect','crossing','scope','takeoff','pour','thermal','envelope','quarry','floor','wall','tile','paint','renovation','cashflow','amortization','odometer','tank','fuel','pregnancy','week','trimester','baby','nappy','formula','margin','markup','break-even','billable'
}
METHOD_TERMS = ('metodika','jak počítáme','jak to počítáme','zdroj','zdroje','dataset','rv data','ověřen','reference','data')
DECISION_TERMS = ('scénář','porovn','citliv','co dál','další krok','checklist','chyby','pozor','rozhod','příklad','modelový','audit','rezerva','hranice','limit')
RESULT_TERMS = ('výsledek','result','souhrn','celkem','rozpad','breakdown','output','summary','xray','x-ray','statement')
GENERIC_CLASS_TERMS = ('card','panel','box','tile','grid')

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.text = []
        self.h1 = []
        self.in_h1 = 0
        self.classes = set()
        self.ids = set()
        self.tags = Counter()
        self.sections = []
        self.section_stack = []
        self.footer = False
        self.hrefs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags[tag] += 1
        if tag in ('script','style','noscript','template'):
            self.skip += 1
        cls = attrs.get('class','') or ''
        idv = attrs.get('id','') or ''
        for c in cls.split(): self.classes.add(c)
        if idv: self.ids.add(idv)
        if tag == 'a' and attrs.get('href'): self.hrefs.append(attrs['href'])
        if tag == 'footer': self.footer = True
        if tag == 'h1': self.in_h1 += 1
        if tag == 'section':
            rec = {'class':cls,'id':idv,'tags':Counter(),'words':0,'depth':len(self.section_stack)}
            self.sections.append(rec)
            self.section_stack.append(rec)
        for sec in self.section_stack:
            sec['tags'][tag] += 1
    def handle_endtag(self, tag):
        if tag in ('script','style','noscript','template') and self.skip:
            self.skip -= 1
        if tag == 'h1' and self.in_h1: self.in_h1 -= 1
        if tag == 'section' and self.section_stack:
            self.section_stack.pop()
    def handle_data(self, data):
        if self.skip: return
        s = re.sub(r'\s+',' ',data).strip()
        if not s: return
        self.text.append(s)
        wc = len(re.findall(r"[\wÀ-ž]+", s, flags=re.UNICODE))
        for sec in self.section_stack: sec['words'] += wc
        if self.in_h1: self.h1.append(s)

def parse_page(path):
    raw = path.read_text(encoding='utf-8', errors='ignore')
    p = PageParser(); p.feed(raw)
    txt = ' '.join(p.text)
    low = txt.lower()
    words = len(re.findall(r"[\wÀ-ž]+", txt, flags=re.UNICODE))
    css_low = raw.lower()
    top_sections = [s for s in p.sections if s['depth']==0]
    grammar=[]
    for s in top_sections[:12]:
        t=s['tags']; tokens=[]
        tokens.append('F' if t['form'] else '-')
        tokens.append('S' if t['svg'] or t['figure'] or t['canvas'] else '-')
        tokens.append('T' if t['table'] else '-')
        tokens.append('D' if t['details'] else '-')
        a=t['article']; tokens.append('A'+str(min(5,a)))
        i=t['input']; tokens.append('I'+str(min(5,i)))
        b=t['button']; tokens.append('B'+str(min(5,b)))
        h=t['h2']+t['h3']; tokens.append('H'+str(min(4,h)))
        ident=(s['class']+' '+s['id']).lower()
        if any(x in ident for x in NATIVE_TERMS): tokens.append('N')
        if any(x in ident for x in RESULT_TERMS): tokens.append('R')
        grammar.append(''.join(tokens))
    classlow=' '.join(p.classes).lower()
    idlow=' '.join(p.ids).lower()
    token_space=' '.join([classlow,idlow])
    native_hits=sorted({x for x in NATIVE_TERMS if x in token_space})
    generic_classes=[c for c in p.classes if any(g in c.lower() for g in GENERIC_CLASS_TERMS)]
    method_hits=sum(1 for x in METHOD_TERMS if x in low)
    decision_hits=sum(1 for x in DECISION_TERMS if x in low)
    result_hits=sum(1 for x in RESULT_TERMS if x in low)
    v32=('logo-rv-v32' in raw or 'rv-brand-v32' in raw)
    inverse=('logo-rv-v32-inverse' in raw)
    socials=('facebook' in low and 'instagram' in low) or ('facebook.com' in raw.lower() and 'instagram.com' in raw.lower())
    placeholder=raw.count('href="#"') + raw.count("href='#'")
    mobile_css='@media' in raw and ('390' in raw or '680' in raw or '768' in raw)
    interactive=p.tags['input']+p.tags['select']+p.tags['button']+p.tags['details']
    visual=p.tags['svg']+p.tags['figure']+p.tags['canvas']+p.tags['table']+p.tags['progress']
    product_sections=sum(1 for s in top_sections if any(x in (s['class']+' '+s['id']).lower() for x in NATIVE_TERMS|set(RESULT_TERMS)|set(DECISION_TERMS)))
    return {
        'file':path.name,'bytes':len(raw.encode('utf-8')),'words':words,'h1':' '.join(p.h1)[:240],
        'sections':len(top_sections),'allSections':len(p.sections),'interactive':interactive,'visualPrimitives':visual,
        'svg':p.tags['svg'],'tables':p.tags['table'],'details':p.tags['details'],'articles':p.tags['article'],
        'nativeHits':native_hits,'nativeHitCount':len(native_hits),'methodHits':method_hits,'decisionHits':decision_hits,
        'resultHits':result_hits,'productSections':product_sections,'genericClassCount':len(generic_classes),
        'classCount':len(p.classes),'v32':v32,'inverseLogo':inverse,'socials':socials,'footer':p.footer,
        'mobileCss':mobile_css,'placeholderLinks':placeholder,'grammar':'|'.join(grammar),
        'raw':raw
    }

def score(m):
    # Static heuristic. The baseline is empirical: seq 11-25 defines the quality reference band.
    s=0; reasons=[]
    # 1) useful depth 0-20
    depth=min(20, 4 + min(8,m['sections'])*1.4 + min(5,m['productSections'])*1.3)
    if m['words']>=1400: depth+=2
    elif m['words']<700: depth-=4; reasons.append('thin-visible-content')
    s+=max(0,min(20,depth))
    # 2) topic-native visual/product grammar 0-20
    v=min(20, m['nativeHitCount']*2.2 + min(8,m['visualPrimitives'])*1.1 + min(4,m['productSections'])*1.4)
    if m['nativeHitCount']<2: reasons.append('weak-topic-native-signature')
    s+=v
    # 3) result/decision usefulness 0-18
    rd=min(18, m['resultHits']*2.1 + m['decisionHits']*2.0 + min(4,m['productSections'])*1.3)
    if m['decisionHits']<2: reasons.append('weak-post-result-decision-depth')
    s+=rd
    # 4) methodology/evidence 0-14
    meth=min(14, m['methodHits']*2.4 + (2 if 'dataset' in m['raw'].lower() else 0))
    if m['methodHits']<2: reasons.append('weak-method-evidence-layer')
    s+=meth
    # 5) interaction 0-10
    s+=min(10, 3 + min(14,m['interactive'])*0.5)
    # 6) identity/finish 0-10
    ident=(3 if m['v32'] else 0)+(2 if m['footer'] else 0)+(2 if m['inverseLogo'] else 0)+(2 if m['socials'] else 0)+(1 if m['mobileCss'] else 0)
    s+=ident
    # 7) hygiene 0-8
    hyg=8
    if m['placeholderLinks']: hyg-=3; reasons.append('placeholder-links')
    if not m['h1']: hyg-=3; reasons.append('missing-h1')
    s+=max(0,hyg)
    return round(min(100,s),1), reasons

def main():
    tracker=json.loads(TRACKER.read_text(encoding='utf-8'))
    pages=[]
    for rec in tracker.get('completedPages',[]):
        seq=rec.get('sequence')
        if not isinstance(seq,int) or seq>94: continue
        f=ROOT/rec['file']
        if not f.exists():
            pages.append({'sequence':seq,'file':rec['file'],'missing':True,'score':0,'reasons':['missing-file']})
            continue
        m=parse_page(f); sc,reasons=score(m)
        m.update({'sequence':seq,'archetype':rec.get('archetype',''),'score':sc,'reasons':reasons})
        m.pop('raw',None); pages.append(m)
    pages.sort(key=lambda x:x['sequence'])
    # structure similarity on grammar
    for p in pages:
        best=(0,None)
        for q in pages:
            if p is q: continue
            sim=SequenceMatcher(None,p.get('grammar',''),q.get('grammar','')).ratio()
            if sim>best[0]: best=(sim,q['sequence'])
        p['maxStructureSimilarity']=round(best[0],3);p['mostSimilarSequence']=best[1]
        if best[0]>=0.90:
            p['reasons'].append('very-high-structure-similarity')
    baseline=[p['score'] for p in pages if 11<=p['sequence']<=25]
    recent=[p['score'] for p in pages if 89<=p['sequence']<=94]
    baseline_median=statistics.median(baseline)
    baseline_q1=statistics.quantiles(baseline,n=4,method='inclusive')[0]
    # Weak threshold intentionally anchored to earlier reference wave, not an arbitrary fixed number.
    weak_threshold=round(baseline_q1-3,1)
    watch_threshold=round(baseline_median-2,1)
    for p in pages:
        p['band']='PASS'
        hard=('thin-visible-content' in p['reasons'] or 'weak-topic-native-signature' in p['reasons']) and p['score']<baseline_median
        if p['score']<weak_threshold or hard: p['band']='WEAK'
        elif p['score']<watch_threshold or p['maxStructureSimilarity']>=0.90: p['band']='WATCH'
    weak=[p for p in pages if p['band']=='WEAK']
    watch=[p for p in pages if p['band']=='WATCH']
    report={
      'generatedFrom':'GitHub branch checkout','completedScanned':len(pages),'referenceWave':'11-25',
      'baselineMedian':round(baseline_median,1),'baselineQ1':round(baseline_q1,1),
      'recent89to94Median':round(statistics.median(recent),1) if recent else None,
      'weakThreshold':weak_threshold,'watchThreshold':watch_threshold,
      'weakCount':len(weak),'watchCount':len(watch),'weakSequences':[p['sequence'] for p in weak],
      'watchSequences':[p['sequence'] for p in watch],'pages':pages
    }
    (ROOT/'rv-retro-quality-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=[]
    lines.append('# RV V-next Retro Quality Audit')
    lines.append('')
    lines.append(f"Scanned: **{len(pages)}** completed pages (seq 1-94)")
    lines.append(f"Reference wave #11-25 median: **{baseline_median:.1f}**, Q1: **{baseline_q1:.1f}**")
    if recent: lines.append(f"Recent wave #89-94 median: **{statistics.median(recent):.1f}**")
    lines.append(f"Weak threshold: **<{weak_threshold:.1f}** (+ hard thin/signature fail); Watch threshold: **<{watch_threshold:.1f}** or structure similarity ≥0.90")
    lines.append(f"WEAK: **{len(weak)}** · WATCH: **{len(watch)}**")
    lines.append('')
    lines.append('## Reference #11-25')
    lines.append('|Seq|File|Score|Band|Sections|Words|Native|Decision|Method|Similarity|')
    lines.append('|---:|---|---:|---|---:|---:|---:|---:|---:|---:|')
    for p in pages:
        if 11<=p['sequence']<=25:
            lines.append(f"|{p['sequence']}|{p['file']}|{p['score']}|{p['band']}|{p.get('sections',0)}|{p.get('words',0)}|{p.get('nativeHitCount',0)}|{p.get('decisionHits',0)}|{p.get('methodHits',0)}|{p.get('maxStructureSimilarity',0)}|")
    lines.append('')
    lines.append('## Recent #89-94')
    lines.append('|Seq|File|Score|Band|Sections|Words|Native|Decision|Method|Similarity|')
    lines.append('|---:|---|---:|---|---:|---:|---:|---:|---:|---:|')
    for p in pages:
        if 89<=p['sequence']<=94:
            lines.append(f"|{p['sequence']}|{p['file']}|{p['score']}|{p['band']}|{p.get('sections',0)}|{p.get('words',0)}|{p.get('nativeHitCount',0)}|{p.get('decisionHits',0)}|{p.get('methodHits',0)}|{p.get('maxStructureSimilarity',0)}|")
    lines.append('')
    lines.append('## WEAK candidates')
    for p in weak:
        lines.append(f"- #{p['sequence']} `{p['file']}` — {p['score']} — {', '.join(p['reasons']) or 'score below baseline'}")
    lines.append('')
    lines.append('## WATCH candidates')
    for p in watch:
        lines.append(f"- #{p['sequence']} `{p['file']}` — {p['score']} — sim {p.get('maxStructureSimilarity')} with #{p.get('mostSimilarSequence')} — {', '.join(p['reasons'])}")
    lines.append('')
    lines.append('> Static heuristic is a triage system, not a replacement for manual visual/product review. Final weak classification must be manually calibrated against #11-25 screenshots/HTML and user review.')
    (ROOT/'rv-retro-quality-report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('\n'.join(lines[:35]))
    print('\nWEAK_SEQUENCES=' + ','.join(map(str,report['weakSequences'])))
    print('WATCH_SEQUENCES=' + ','.join(map(str,report['watchSequences'])))

if __name__=='__main__': main()
