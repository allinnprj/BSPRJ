from pathlib import Path
p=Path('presentation_work/build')
s=(p/'build-v2.mjs').read_text(encoding='utf-8')
s=s.replace("C={navy:'#102B43',teal:'#008F95'", "C={navy:'#172B4D',teal:'#087F8C'")
s=s.replace("function sl(title,notes,bg=C.cream){", "const backWave=await fs.readFile(root+'/output/backgrounds/acoustic.png');\nconst backEnergy=await fs.readFile(root+'/output/backgrounds/energy.png');\nconst backCity=await fs.readFile(b+'/image19.jpg');\nfunction flat(s,fill,x,y,w,h){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0}});}\nfunction sl(title,notes,bg=C.cream){")
s=s.replace("s.background.fill=bg;const dark=[C.navy,C.teal].includes(bg);", "s.background.fill=bg;const dark=[C.navy,C.teal].includes(bg);const n=p.slides.items.length;const fullConcept=n>=16&&n<=19;if(!fullConcept){const photo=dark&&n!==10;const data=photo?backCity:([5,7,8].includes(n)?backEnergy:backWave);s.images.add({blob:data,contentType:photo?'image/jpeg':'image/png',position:{left:0,top:0,width:1280,height:720},fit:'cover',alt:'Presentation background'});if(dark)flat(s,{color:n===3?'#492A69':n===9?'#342C49':n===10?'#08626C':'#162B49',opacity:0.93},0,0,1280,720);}notes+=' Fonda istifadə olunan yaradılmış teksturalar dekorativdir, ölçmə məlumatı deyil.';")
s=s.replace("+' / 18'", "+' / 21'")
s=s.replace("// 8 exact test instruments", "// Energy evidence from supplied screenshot\ns=sl('Enerji axınları onlayn izlənir',`Vaxt: 30 saniyə. İstifadəçinin 11 oktyabr 2026 ekran nümunəsindən iki sətir göstərilir. Solar, Battery və Load kanalları ayrı izlənir. Battery cərəyanının müsbət olması doldurma, mənfi olması boşalma istiqamətini göstərir. Bir sətir işləmənin tam gecə boyunca davam etdiyini və ya təhlükəsiz şarj qəbulunu sübut etmir. Mənbə: istifadəçinin əlavə etdiyi Solar/Battery/Load ekranı; rəqəmlər əl ilə köçürülüb. Bu slayd yeni hesablanmış enerji balansı deyil.`);\ntx(s,'11 oktyabr 2026 · Solar / Battery / Load',64,157,1152,46,26,C.muted);\nnativeTable(s,[['Vaxt','Solar: V / A / W','Battery: V / A / W','Load: V / A / W','Şarj'],['14:34:23–14:35:24','12,940 / 0,31 / 4,020','12,650 / +0,16 / +2,010','7,100 / 0,24 / 1,680','ON'],['15:01:53–15:02:54','0,940 / 0,00 / 0,000','11,690 / −0,20 / −2,340','7,100 / 0,32 / 2,280','OFF']],64,232,1152,202,[230,257,257,257,151],22,'#47785B');\ntx(s,'Batareya dolur və boşalır',64,481,1110,65,38,'#47785B',true);\ntx(s,'Gərginlik, cərəyan və güc hər kanal üzrə ayrılır.\nEkrandakı idarəetmə rejimi: Smart Auto',64,561,1152,88,28,C.ink);\n// 8 exact test instruments")
# A native editable table is evidence, rather than decorative UI.
anchor='// 1: striking, minimal title and real city context'
table="""function nativeTable(s,values,x,y,w,h,widths,size=24,head='#385B88'){
 const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:w,height:h,columnWidths:widths,values});
 for(let r=0;r<values.length;r++) for(let c=0;c<values[0].length;c++) {const cell=t.getCell(r,c);cell.fill=r===0?head:(r%2?'#FFFFFF':'#EDF3F5');cell.text.style={typeface:'Arial',fontSize:size,color:r===0?C.white:C.ink,bold:r===0};}
 t.borders.assign({fill:'#CBD7DE',width:1,style:'solid'});return t;
}
"""
s=s.replace(anchor,table+anchor)
# Replace old Summary screenshot composition with selected recent rows from user reference.
start=s.index('// 11 screenshot + field evidence')
end=s.index('// 12 spatial context')
s=s[:start]+"""// Summary evidence, kept editable and readable
s=sl('Səs nəticəsi və məlumatın əhatəsi',`Vaxt: 35 saniyə. Bu cədvəl istifadəçinin yeni Summary ekranından seçilmiş sətirləri göstərir. 11 oktyabr gecə nəticəsi 54,8 dB(A), SILENT və 99,8 faiz əhatədir. 11 oktyabr gündüz sətiri isə 45,4 faiz əhatə ilə PARTIAL-dır. Gündüzün tam nəticəsi kimi qəbul edilmir. T11 rəqəmləri ayrı sınağın keyfiyyət göstəricisidir: 312 pəncərənin hamısında dB(A), 99–100 faiz etibarlı audio, sıfır klip. Mənbə: istifadəçinin Summary ekranı; BSPRJ memory.md T11 qeydi. Cədvəl ekranın seçilmiş rəqəmlərindən yenidən qurulub.`);
nativeTable(s,[['Tarix / dövr','Leq est, dB(A)','Tipik sinif','Əhatə / keyfiyyət'],['11.10 · NGT','54,8','SILENT','99,8% · OK'],['11.10 · DAY','58,2','NORMAL','45,4% · PARTIAL'],['10.10 · EVE','59,3','NORMAL','99,3% · OK'],['06.10 · DAY','61,5','NORMAL','99,8% · OK'],['06.10 · EVE','59,2','NORMAL','99,7% · OK'],['06.10 · NGT','53,6','SILENT','99,7% · OK']],64,170,1152,347,[260,260,230,402],25,'#555383');
tx(s,'T11: 312 / 312 pəncərədə dB(A)',64,555,1100,62,35,C.teal,true);
tx(s,'99–100% etibarlı audio · kliplər: 0',64,626,1100,37,26,C.muted);
// Remote access is part of usefulness, not a claim that external acceptance is closed.
s=sl('Telegram: məsafədən status və gündəlik icmal',`Vaxt: 30 saniyə. Telegram istifadəçiyə cihazın yanına getmədən vəziyyət barədə məlumat verir. /bssts əmri BS statusunu göstərir; səs qiymətləndirməsi, period, səviyyə və mikrofon statusu burada mövcuddur. /c3sts enerji kontrollerinin vəziyyətini soruşur. Google Sheets ayrıca DAY, EVE və NGT üçün gündəlik Telegram icmalı hazırlayır. Soldakı mətn əmrlərin izahıdır, real Telegram ekranının fotosu deyil. Bütün xarici kanalların eyni vaxtlı dB(A) uyğunluğu ayrıca qəbul tələb edir. Mənbə: src/telegram_alert_service.cpp; google_sheets/Code.gs; memory.md T8/T11 qeydləri.`,C.navy);
tx(s,'/bssts',64,175,480,64,46,C.aqua,true);
tx(s,'BS statusu və\nsəs qiymətləndirməsi',64,264,505,111,32,C.white);
tx(s,'/c3sts',64,423,480,64,46,C.gold,true);
tx(s,'Enerji kontrollerinin vəziyyəti',64,512,500,105,30,C.white);
tx(s,'Gündəlik icmal',664,175,545,64,43,C.gold,true);
tx(s,'DAY / EVE / NGT\nOrta dB(A) və tipik səviyyə\nMəlumatın əhatəsi',664,282,545,156,31,C.white);
tx(s,'Telefonla müşahidə:\ncihazın yanına getmədən',664,483,545,111,32,C.aqua);
s=sl('Veb-panel: cari göstəricilər bir səhifədə',`Vaxt: 30 saniyə. İstifadəçinin veb-panel nümunəsində Online statusu, Wi-Fi siqnalı 98 HIGH, Current Period day, Signal State NORMAL, temperatur 27,6 dərəcə, rütubət 43,4 faiz və Now 17 görünür. Bu rəqəmlər müxtəlif son yenilənmə vaxtlarına malikdir; eyni anda toplanmış qəbul sınağı deyil. Now 17 nisbi göstəricidir, dB(A) deyil. Cədvəl təqdimat üçün ekranın seçilmiş məzmunundan yenidən qurulub; real veb-panel ekranının fotosu deyil. Mənbə: istifadəçinin əlavə etdiyi veb-panel ekranı; DATA_DICTIONARY_RU.md; task 112.`);
nativeTable(s,[['Veb-panel sahəsi','Ekrandakı nümunə','Mənası'],['Online / Wi-Fi','Online · 98 HIGH','Əlaqə vəziyyəti'],['Current Period / State','day · NORMAL','Dövr və səviyyə etiketi'],['Temperature / Humidity','27,6 °C · 43,4%','Ətraf mühit konteksti'],['Now','17','Nisbi göstərici; dB(A) deyil']],64,176,1152,300,[365,390,397],27,'#3C689C');
tx(s,'Telefon və kompüterdən görünür',64,521,1138,64,39,'#3C689C',true);
tx(s,'dB(A) üçün əsas nəticə: Sheets-də DBA LEQ EST.\nXarici kanalların uyğunluğu ayrıca yoxlanır.',64,601,1138,65,25,C.muted);
"""+s[end:]
# Expand deployment photos as backgrounds; left tint protects text.
s=s.replace("await im(s,'school-compact.png',558,133,722,470,'contain');", "await im(s,'school-compact.png',0,0,1280,720,'cover');flat(s,{color:'#183E36',opacity:0.94},0,0,530,720);")
s=s.replace("await im(v,asset,558,133,722,470,'contain');", "await im(v,asset,0,0,1280,720,'cover');flat(v,{color:asset.startsWith('station')?'#392F4E':asset.startsWith('hospital')?'#243A58':'#4F3B2E',opacity:0.94},0,0,530,720);")
s=s.replace("'hospital-concept.png'", "'hospital-crescent.png'")
# Reassert footers after full-bleed concept background was inserted.
s=s.replace("// 14 completion stage", "// 14 completion stage")
start=s.index('const times=')
s=s[:start]+"""const times=[20,25,25,30,25,25,25,30,25,30,35,35,30,30,25,20,20,20,20,30,20];
p.slides.items.forEach((slide,i)=>{slide.speakerNotes.text=slide.speakerNotes.text.replace(/Vaxt: \\d+ saniyə\\./,`Vaxt: ${times[i]} saniyə.`);if(i>=15&&i<=18)tx(slide,String(i+1)+' / 21',1110,679,105,25,15,C.white);});
await (await PresentationFile.exportPptx(p)).save(b+'/online-draft.pptx');
const r=await finalizePresentation({workspaceDir:root,candidatePath:b+'/online-draft.pptx',finalPath:root+'/output/BSPRJ_Akustik_Monitorinq_AZ_Online_Visual.pptx',pythonExecutable:runtime+'/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:21,requiredNativeChartOwnerSlides:[11],requiredNativeTableOwnerSlides:[8,12,14],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:b+'/online-validation.json'});
const final=await PresentationFile.importPptx(await FileBlob.load(r.finalPath));
for(let i=0;i<21;i++){const blob=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(b+`/online-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Finalized and rendered 21 slides, about '+(times.reduce((a,b)=>a+b,0)/60).toFixed(1)+' minutes');
"""
(p/'build-v3.mjs').write_text(s,encoding='utf-8')
