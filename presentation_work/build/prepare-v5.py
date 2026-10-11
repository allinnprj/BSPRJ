from pathlib import Path
b=Path(__file__).parent
s=(b/'build-v4.mjs').read_text(encoding='utf-8-sig')
s=s.replace("bold=false){", "bold=false,alignment='left'){")
s=s.replace("fontSize:size,color,bold};", "fontSize:size,color,bold,alignment};")
s=s.replace("if(title)tx(v,title,64,45,1152,102,43,C.ink,true);", "if(title)tx(v,title,64,45,1152,102,43,C.ink,true,'center');")
s=s.replace("tx(v,String(n).padStart(2,'0')+' / 22',1108,679,108,23,17,C.muted);", "if(!photo)tx(v,String(n).padStart(2,'0')+' / 22',1108,679,108,23,17,C.muted);")
a=s.index("await im(s,'image12.jpg'")
z=s.index('// 2: concrete problem',a)
s=s[:a]+'''await im(s,'baku-boulevard-real.jpg',0,0,1280,720,'cover');
flat(s,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#142E46/0'},{offset:43000,color:'#142E46'},{offset:100000,color:'#142E46'}]},490,0,790,720);
tx(s,'Şəhər mühitində\\nsəs monitorinqi',710,155,510,177,47,C.white,true,'center');
tx(s,'Akustik monitorinq və\\nzaman üzrə təhlil',710,376,510,102,32,C.aqua,false,'center');
tx(s,'Ali Nuri və Zülfüqar Həsənov',710,562,510,65,25,C.white,false,'center');
await im(s,'image10.png',932,638,66,55);
s.speakerNotes.text+=' Bakı fotoşəkli dəyişdirilmədən istifadə olunur. Mənbə: https://www.archilovers.com/projects/82549/baku-flame-towers.html ; original photo https://cdn.archilovers.com/projects/d73231421a6042dab6cf071b093614f6.jpg';
''' +s[z:]
s=s.replace("await im(s,'traffic-bright.png',615,160,601,444,'cover');", "await im(s,'baku-avenue-real.jpg',615,200,601,401,'contain');\ntx(s,'Bakı, Heydər Əliyev prospekti',615,617,601,33,22,C.muted,false,'center');\ns.speakerNotes.text+=' Real şəhər fotoşəkli, nəqliyyat əlavə edilməyib. Mənbə: https://minval.az/news/123918269 ; original https://cdn.minval.az/2019/09/heyder_aliyev_prospekti_060919.jpg';")
s=s.replace("await im(s,'pcb-concept.png',748,149,444,510);", "await im(s,'pcb-final.png',840,163,376,505);\ns.speakerNotes.text+=' Düzəliş: əsas WROOM və daha kiçik C3 fərqləndirilib. Şəkil modul formasının dəqiq texniki çertyoju deyil. Elektrik bağlantıları sxem üzrə yoxlanır.';")
s=s.replace("list(s,['Lehimlənmiş bağlantılar','Qısa və nizamlı kabel yolları','Servis üçün əlçatan modullar'],64,299,635,83,30);", "list(s,['ESP32-WROOM-32U və ESP32-C3 SuperMini','Lehimlənmiş bağlantılar və qısa kabellər','Servis üçün əlçatan modullar'],64,292,716,89,28);")
s=s.replace("Bizim sxemlər: rabitə və enerji", "Rabitə və enerji sxemləri")
s=s.replace("tx(s,'UART / WAKE',64,159,517,51,33,C.teal,true);", "tx(s,'UART / WAKE',64,157,560,47,32,C.teal,true,'center');")
s=s.replace("tx(s,'SOLAR / BATTERY / LOAD',624,159,592,51,30,C.teal,true);", "tx(s,'SOLAR / BATTERY / LOAD',656,157,560,47,30,C.teal,true,'center');")
s=s.replace("await im(s,'uart-detail.png',64,226,517,367);", "await im(s,'uart-detail.png',64,208,560,393);")
s=s.replace("await im(s,'solar-az.png',618,217,598,370);", "await im(s,'solar-az.png',656,208,560,393);")
s=s.replace("tx(s,'3,3 V · TX / RX · ümumi GND',64,600,517,44,24,C.ink);", "tx(s,'3,3 V · TX / RX · ümumi GND',64,608,560,40,23,C.ink,false,'center');")
s=s.replace("tx(s,'Panel, batareya və yük ayrıca ölçülür',624,600,592,44,24,C.ink);", "tx(s,'Panel, batareya və yük ayrıca ölçülür',656,608,560,40,23,C.ink,false,'center');")
a=s.index("tx(s,'FNIRSI FDM01'")
z=s.index('// 9 calibration proof',a)
s=s[:a]+'''tx(s,'FNIRSI FDM01',64,164,560,60,42,C.teal,true,'center');
tx(s,'FNB58',656,164,560,60,42,C.gold,true,'center');
await im(s,'fdm01-real.jpg',64,246,220,310);
await im(s,'fnb58-real.jpg',656,246,220,310);
tx(s,'Səs səviyyəsi ölçən',310,255,314,73,28,C.ink,true);
list(s,['A-vəznləmə, SLOW','Foto cütləri ilə müqayisə','dB(A) ofsetinin yoxlanması'],310,353,314,73,25);
tx(s,'USB enerji testeri',902,255,314,73,28,C.ink,true);
list(s,['Gərginlik, cərəyan, güc','Yük xəttinin müşahidəsi','Tam müqayisə ayrıca mərhələdir'],902,353,314,73,25);
tx(s,'İstehsalçının fotosu',64,570,220,31,19,C.muted,false,'center');
tx(s,'İstehsalçının fotosu',656,570,220,31,19,C.muted,false,'center');
tx(s,'Əsas nəzarətçi: ESP32-WROOM-32U. Enerji nəzarətçisi: ESP32-C3 SuperMini.',64,630,1152,36,21,C.muted,false,'center');
s.speakerNotes.text+=' Fotolar cihaz modelini göstərir, bizim sınağın ekran nəticələri deyil. FDM01 source: https://www.fnirsi.com/products/fdm01 ; FNB58 source: https://www.fnirsi.com/products/fnb58 . Mənbə təqdimatdakı GM1351 fotosu FDM01 kimi istifadə olunmur.';
''' +s[z:]
s=s.replace("'1 · Texniki',310,590,220,48,29,C.ink,true", "'1 · Texniki',300,590,220,48,29,C.ink,true,'center'")
s=s.replace("'2 · Şəhər üslubu',518,590,265,48,29,C.ink,true", "'2 · Şəhər üslubu',520,590,240,48,29,C.ink,true,'center'")
s=s.replace("'3 · Minimalist',794,590,250,48,29,C.ink,true", "'3 · Minimalist',770,590,240,48,29,C.ink,true,'center'")
s=s.replace('BSPRJ_Akustik_Monitorinq_AZ_Defense_Final.pptx','BSPRJ_Akustik_Monitorinq_AZ_Authentic_Final.pptx').replace('defense-validation.json','authentic-validation.json').replace('review-draft.pptx','authentic-draft.pptx').replace('/defense-${i+1}.png','/authentic-${i+1}.png')
(b/'build-v5.mjs').write_text(s,encoding='utf-8')
