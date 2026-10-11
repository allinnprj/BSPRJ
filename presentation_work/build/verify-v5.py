from pathlib import Path
import json, zipfile, re, hashlib
from xml.etree import ElementTree as E
from PIL import Image, ImageChops
b=Path(__file__).parent
deck=b.parent/'output/BSPRJ_Akustik_Monitorinq_AZ_Corrected_Final.pptx'
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with zipfile.ZipFile(deck) as z:
    cover=E.fromstring(z.read('ppt/slides/slide1.xml'))
    assert 'BSPRJ' not in [x.text for x in cover.findall('.//a:t',ns)]
    times=[]
    for i in range(1,23):
        root=E.fromstring(z.read(f'ppt/slides/slide{i}.xml'))
        assert all(e.get('u') in (None,'none') for e in root.iter())
        notes=E.fromstring(z.read(f'ppt/notesSlides/notesSlide{i}.xml'))
        times.append(int(re.search(r'Vaxt: (\d+)', ' '.join(notes.itertext())).group(1)))
    assert sum(times)==585
    assert len([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)])==22
    media={hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n.startswith('ppt/media/')}
    print('Original sourced photo bytes embedded:', [n for n in ['baku-boulevard-real.jpg','baku-avenue-real.jpg','fdm01-real.jpg','fnb58-real.jpg'] if hashlib.sha256((b/n).read_bytes()).hexdigest() in media])
changed=[i for i in range(1,23) if ImageChops.difference(Image.open(b/f'authentic-{i}.png').convert('RGB'), Image.open(b/f'corrected-{i}.png').convert('RGB')).getbbox()]
assert changed==[5,16], changed
r=json.loads((b/'corrected-validation.json').read_text())
assert r['packageIntegrity']['status']=='pass'
assert r['presentationLayout']['findingCount']==0
assert r['nativeChartValidation']['passed']
assert r['nativeTableArithmetic']['passed']
print('22 slides; notes 585 seconds; no text underline; chart/tables valid; changed visuals:', changed)
print('Layout warnings:',r['presentationLayout'].get('warnings',[]))
