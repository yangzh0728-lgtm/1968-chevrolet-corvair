"""Render the site's small, dependency-free HTML template set into dist/."""
from pathlib import Path
import html, json
ROOT=Path(__file__).resolve().parent.parent
shell=(ROOT/'site/shell.html').read_text()
pages=json.loads((ROOT/'site/pages.json').read_text())
for page in pages:
    content=(ROOT/'site/pages'/page['source']).read_text()
    output=shell.replace('{{title}}',html.escape(page['title'])).replace('{{description}}',html.escape(page['description'],quote=True)).replace('{{content}}',content)
    path=ROOT/'dist'/page['path']/'index.html'
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(output)
print(f'Rendered {len(pages)} pages.')
