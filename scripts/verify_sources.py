"""Verify every imported daily source against original PDF annotations. Needs pypdf."""
import hashlib,json,re
from pathlib import Path
from pypdf import PdfReader
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'private/catalog/provenance.json').read_text())
for track in ['english','aws']:
 pdf=root/f'private/sources/{track}-plan.pdf'
 assert hashlib.sha256(pdf.read_bytes()).hexdigest()==manifest[track]['sha256']
 reader=PdfReader(pdf)
 lessons=json.loads((root/f'private/catalog/{track}.json').read_text())
 for lesson in lessons:
  page=reader.pages[lesson['page']-1]
  assert re.search(r'GÜN\s+0*'+str(lesson['day'])+r'\b',page.extract_text()),lesson['id']
  urls=[str(a.get_object().get('/A',{}).get('/URI','')) for a in page.get('/Annots',[])]
  urls=list(dict.fromkeys(u for u in urls if u.startswith('https://')))
  assert [l['url'] for l in lesson['links']]==urls,lesson['id']
 print(f'{track}: {len(lessons)} daily PDF pages and all original source links verified')
