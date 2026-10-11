from pathlib import Path
import re
p=Path('presentation_work/build')
s=(p/'build-v3.mjs').read_text(encoding='utf-8')
# Explicit ink colors on light backgrounds prevent the previous white-on-cream defect.
s=s.replace('function tx(s,t,x,y,w,h,size=30,color=C.ink,bold=false){',"const darkSlides=new WeakSet();\nfunction tx(s,t,x,y,w,h,size=30,color=C.ink,bold=false){if(!darkSlides.has(s)){if([C.white,'#C7F1ED','#CEF4EE','#BCDAE2','#BADEE2'].includes(color))color=C.ink;else if(color===C.gold)color='#795000';else if(color===C.aqua)color='#005C66';else if(color===C.coral)color='#AC3A29';else if(color===C.teal)color='#00616B';}")
start=s.index('function sl(')
end=s.index('async function im(',start)
s=s[:start]+r"""function sl(title,notes,bg=C.cream){
 const v=p.slides.add(),n=p.slides.items.length;
 const photo=n===1||(n>=17&&n<=20);
 v.background.fill=C.cream;
 if(photo)darkSlides.add(v);
 if(!photo)v.images.add({blob:[5,6,7,8].includes(n)?backEnergy:backWave,contentType:'image/png',position:{left:0,top:0,width:1280,height:720},fit:'cover',alt:'Decorative presentation background'});
 if(title)tx(v,title,64,45,1152,102,43,C.ink,true);
 tx(v,String(n).padStart(2,'0')+' / 22',1108,679,108,23,17,C.muted);
 v.speakerNotes.text=notes;return v;
}
function fade(v,color){
 flat(v,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color},{offset:56000,color},{offset:100000,color:color+'/0'}]},0,0,950,720);
}
"""+s[end:]
# Preserve native structured gradients in flat helper.
s=s.replace("fill:typeof fill==='object'?fill.color+'/'+Math.round(fill.opacity*100):fill", "fill:typeof fill==='object'&&fill.opacity!==undefined?fill.color+'/'+Math.round(fill.opacity*100):fill")
s=s.replace("await im(s,'image12.jpg',644,0,636,720,'cover');", "await im(s,'image12.jpg',0,0,1280,720,'cover');fade(s,'#142E46');")
s=s.replace("'image1.jpg'","'traffic-bright.png'")
s=s.replace("await im(s,'image6.png',840,153,348,505);", "await im(s,'prototype-clean.png',840,153,348,505);tx(s,'Vizual retuş',840,660,348,26,19,C.muted);s.speakerNotes.text+=' Fotoşəkil imagegen ilə vizual təmizlənib; orijinal görüntü saxlanılıb. Retuş elektrik bağlantılarının təsdiqi deyil.';")
start=s.index('// 6 our UART drawing')
end=s.index('// Energy evidence',start)
s=s[:start]+r"""// Clearly separate actual prototype from illustrative soldered-board assembly.
s=sl('Gələcək yığılma: lehimlənmiş lövhə',`Vaxt: 25 saniyə. Bu görüntü real hazır lövhənin fotosu deyil. İlkin prototipə əsaslanan gələcək səliqəli PCB yığılmasının imagegen konseptidir. Qısa bağlantılar, lehimlənmiş modullar və servis üçün əlçatan quruluş göstərilir. Faktiki PCB layihəsi, elektrik audit və fiziki sınaq ayrıca mərhələdir. Mənbə: ilkin prototip fotosu, istifadəçinin təsdiqlədiyi gələcək yığılma ideyası.`);
await im(s,'pcb-concept.png',748,149,444,510);
tx(s,'Daha səliqəli montaj',64,187,639,61,40,C.teal,true);
list(s,['Lehimlənmiş bağlantılar','Qısa və nizamlı kabel yolları','Servis üçün əlçatan modullar'],64,299,635,83,30);
tx(s,'Gələcək konsept · hələ istehsal edilməyib',64,603,632,61,25,C.ink,true);
// Two original diagrams share one overview slide as requested.
s=sl('Bizim sxemlər: rabitə və enerji',`Vaxt: 40 saniyə. Solda kontrollerlər arasındakı UART sxemi, sağda enerji sxemi göstərilir. UART 3,3 V, ortaq GND və ayrıca wake xətti BS GPIO23 → C3 GPIO5 var. Enerji sxemində Solar, Battery və Load INA3221 kanalları ilə ayrı izlənir. Şarj tənzimlənməsi və yekun avtonom qəbul hələ ayrıca yoxlanmalıdır. Mənbə: electrical circuits/CONTROLLER_UART_TECHNICAL_V2.png; INA3221_ACTUAL_WIRING_RESTORED.svg; D:/DEV/INA3221-C3/INA3221_ACTUAL_WIRING.net və HARDWARE.md. Original sxemlər dəyişdirilməyib.`);
tx(s,'UART / WAKE',64,159,517,51,33,C.teal,true);
tx(s,'SOLAR / BATTERY / LOAD',624,159,592,51,30,C.teal,true);
await im(s,'uart-detail.png',64,226,517,367);
await im(s,'solar-az.png',618,217,598,370);
tx(s,'3,3 V · TX / RX · ümumi GND',64,600,517,44,24,C.ink);
tx(s,'Panel, batareya və yük ayrıca ölçülür',624,600,592,44,24,C.ink);
tx(s,'Wake: BS GPIO23 → C3 GPIO5. Şarj və avtonom iş ayrıca yoxlanır.',64,650,1152,32,21,C.muted);
"""+s[end:]
# Insert comparison before installation scenarios.
idx=s.index('// 13 full concept image')
s=s[:idx]+r"""// Three enclosure styles, one continuous image and editable labels.
s=sl('Korpus üçün üç dizayn seçimi',`Vaxt: 25 saniyə. Bunlar eyni məqsədli kompakt cihaz üçün üç xarici dizayn variantıdır. Solda texniki, ortada müasir şəhər, sağda minimalist üslub göstərilir. Kiçik günəş paneli və mikrofon girişi bütün variantlarda saxlanır. Bunlar ölçülmüş texniki çertyojlar deyil; hava şəraiti, enerji balansı, mikrofonun yerləşməsi və montaj ayrıca yoxlanacaq. Mənbə: imagegen ilə hazırlanmış konseptlər; istifadəçinin təsdiqlədiyi üç stil seçimi.`);
await im(s,'enclosure-styles.png',64,161,1152,413);
tx(s,'1 · Texniki',64,590,354,48,31,C.ink,true);
tx(s,'2 · Şəhər üslubu',450,590,354,48,31,C.ink,true);
tx(s,'3 · Minimalist',839,590,354,48,31,C.ink,true);
tx(s,'Gələcək korpus konseptləri · son dizayn seçilməyib',64,650,1152,33,23,C.muted);
"""+s[idx:]
s=s.replace("flat(s,{color:'#183E36',opacity:0.94},0,0,530,720);", "fade(s,'#173D34');")
s=s.replace("flat(v,{color:asset.startsWith('station')?'#392F4E':asset.startsWith('hospital')?'#243A58':'#4F3B2E',opacity:0.94},0,0,530,720);", "fade(v,asset.startsWith('station')?'#332940':asset.startsWith('hospital')?'#203A54':'#49352A');")
s=s.replace("'hospital-crescent.png'","'hospital-tabib.png'")
# Change text itself on calibration slide to dark colors through the centralized helper;
# no opaque overlay is required for readability.
start=s.index('const times=')
s=s[:start]+r"""const times=[20,25,25,30,25,25,40,30,25,30,35,35,30,30,25,25,20,20,20,20,30,20];
p.slides.items.forEach((slide,i)=>{slide.speakerNotes.text=slide.speakerNotes.text.replace(/Vaxt: \d+ saniyə\./,`Vaxt: ${times[i]} saniyə.`);if(i>=16&&i<=19)tx(slide,String(i+1)+' / 22',1110,679,105,25,17,C.white);});
await (await PresentationFile.exportPptx(p)).save(b+'/review-draft.pptx');
const r=await finalizePresentation({workspaceDir:root,candidatePath:b+'/review-draft.pptx',finalPath:root+'/output/BSPRJ_Akustik_Monitorinq_AZ_Review_Final.pptx',pythonExecutable:runtime+'/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','8','--require-native-table-slide','12','--require-native-table-slide','14'],explicitTotalSlideCount:22,requiredNativeChartOwnerSlides:[11],requiredNativeTableOwnerSlides:[8,12,14],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:b+'/review-validation.json'});
const final=await PresentationFile.importPptx(await FileBlob.load(r.finalPath));
for(let i=0;i<22;i++){const blob=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(b+`/review-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Finalized and rendered 22 slides, about '+(times.reduce((a,b)=>a+b,0)/60).toFixed(1)+' minutes');
"""
# Fix doubled regexp slash from raw source construction.
s=s.replace(r'/Vaxt: \\d+',r'/Vaxt: \d+')
(p/'build-v4.mjs').write_text(s,encoding='utf-8')
