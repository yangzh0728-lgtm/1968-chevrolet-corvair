"""Validate rendered routes, local references, duplicate IDs, and model assets."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, subprocess
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/'dist'
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=set(); self.duplicates=[]; self.refs=[]; self.h1=0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:self.duplicates.append(a['id'])
            self.ids.add(a['id'])
        if tag=='h1':self.h1+=1
        for key in ('src','href'):
            if a.get(key):self.refs.append(a[key])
errors=[]; pages={}
for path in DIST.rglob('*.html'):
    page=Page();page.feed(path.read_text());pages[path]=page
    if page.duplicates:errors.append(f'{path}: duplicate IDs {page.duplicates}')
    if page.h1!=1:errors.append(f'{path}: expected one h1, got {page.h1}')
for path,page in pages.items():
    for ref in page.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        target=(DIST/unquote(u.path).lstrip('/')) if u.path.startswith('/') else path.parent/unquote(u.path)
        if not u.path:target=path
        if target.is_dir():target=target/'index.html'
        if not target.exists():errors.append(f'{path.relative_to(DIST)}: missing {ref}')
        elif u.fragment and target in pages and u.fragment not in pages[target].ids:
            if not (u.fragment.startswith('stage-') and target==DIST/'restoration/index.html'):
                errors.append(f'{path.relative_to(DIST)}: missing anchor {ref}')
for path in DIST.rglob('*.js'):
    if 'vendor' in path.parts:continue
    result=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
    if result.returncode:errors.append(result.stderr)
manifest=json.loads((DIST/'anatomy/assets/manifest.json').read_text())
for asset in manifest['assets']:
    p=DIST/'anatomy/assets'/asset['url']
    if not p.exists():errors.append(f'Missing model asset {p.name}')
    elif p.stat().st_size!=asset['bytes']:errors.append(f'Model asset size mismatch {p.name}')
if errors:
    print('\n'.join(errors));raise SystemExit(1)
print(f'PASS: {len(pages)} HTML pages, local links and anchors, JavaScript syntax, {len(manifest["assets"])} model assets.')
