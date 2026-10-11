from pathlib import Path
import xml.etree.ElementTree as E
from PIL import Image
E.register_namespace('', 'http://www.w3.org/2000/svg')
build=Path('presentation_work/build')
src=Path(r'D:\ALLINNPRGDRV\PRJ\AI\electrical circuits\INA3221_ACTUAL_WIRING_RESTORED.svg')
tree=E.parse(src)
replacements={
'INA3221-C3 — обзорно-монтажный эскиз':'INA3221-C3: enerji sisteminin sxemi',
'Электрические соединения: точно по INA3221_ACTUAL_WIRING.net':'Layihənin INA3221_ACTUAL_WIRING.net bağlantıları',
'SMART SOLAR CONTROLLER — условная граница':'GÜNƏŞ ENERJİSİ NƏZARƏTÇİSİ',
'active-high • условный корпус':'active-high • şərti görünüş',
'расположение клемм условно • Rshunt = 0,1 Ω':'şərti terminal mövqeyi • Rshunt = 0,1 Ω',
'SUPERMINI • условный корпус':'SUPERMINI • şərti görünüş',
'NET_GND • ОБЩАЯ ЗЕМЛЯ':'NET_GND • ÜMUMİ GND'
}
for e in tree.getroot().iter():
 if e.text in replacements: e.text=replacements[e.text]
tree.write(build/'solar-az.svg',encoding='utf-8',xml_declaration=True)
# Crop only outside diagram annotations, preserve all three UART paths.
im=Image.open(build/'uart-original.png')
im.crop((160,160,1415,916)).save(build/'uart-detail.png')
# Remove the clipped next column from the evidence screenshot.
Image.open(build/'image22.jpg').crop((0,40,1118,360)).save(build/'summary-v2.png')
