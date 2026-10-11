from pathlib import Path
import zipfile, re, json, hashlib
import xml.etree.ElementTree as ET
b=Path('presentation_work/build')
f=Path('presentation_work/output/BSPRJ_Akustik_Monitorinq_AZ_15_Thematic_Final.pptx')
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
with zipfile.ZipFile(f) as z:
    slides=[n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)]
    notes=[n for n in z.namelist() if re.fullmatch(r'ppt/notesSlides/notesSlide\d+\.xml',n)]
    assert len(slides)==len(notes)==15
    timings=[]
    for n in notes:
        t=' '.join(ET.fromstring(z.read(n)).itertext())
        m=re.search(r'Vaxt: (\d+) saniyə\.',t)
        assert m,n
        timings.append(int(m[1]))
    assert sum(timings)==565,timings
    media={hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n.startswith('ppt/media/')}
    for n in ['baku-boulevard-real.jpg','baku-avenue-real.jpg','fdm01-real.jpg','fnb58-real.jpg','telegram-icon.png','android-original.png']:
        assert hashlib.sha256((b/n).read_bytes()).hexdigest() in media,n
    for n in slides:
        root=ET.fromstring(z.read(n))
        assert not any(v.get('u') not in (None,'none') for v in root.findall('.//a:rPr',ns)),n
r=json.loads((b/'thematic-final-validation.json').read_text())
assert r['packageIntegrity']['status']=='pass'
print(json.dumps({'slides':15,'notes':15,'seconds':565,'unchanged_source_images':6,'encoded_underlines':0,'final_sha256':hashlib.sha256(f.read_bytes()).hexdigest()},indent=2))
