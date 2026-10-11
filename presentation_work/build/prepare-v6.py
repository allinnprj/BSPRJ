from pathlib import Path
b=Path(__file__).parent
old=(b/'build-v5.mjs').read_text(encoding='utf-8-sig')
def segment(start,end): return old[old.index(start):old.index(end)]
head=old[:old.index('// 1: striking')]
head=head.replace("const backWave=await fs.readFile(root+'/output/backgrounds/acoustic.png');", "const backWave=await fs.readFile(b+'/theme-tech.png');")
head=head.replace("const backEnergy=await fs.readFile(root+'/output/backgrounds/energy.png');", "const backEnergy=backWave;")
head=head.replace("const photo=n===1||(n>=17&&n<=20);", "const photo=n===1||n===14;")
head=head.replace("if(!photo)v.images.add({blob:[5,6,7,8].includes(n)?backEnergy:backWave", "if(!photo)v.images.add({blob:backWave")
head=head.replace("' / 22'", "' / 15'")
# Protect native evidence from decorative background contrast.
head=head.replace("if(title)tx(v,title", "if(!photo)flat(v,'#FFFFFF/30',0,0,1280,720);\n if(title)tx(v,title")
cover=segment('// 1: striking','// 2: concrete')
goal=r'''// 2: purpose before technical details
s=sl('Daha sakit yeri ölçərək seçmək',`Vaxt: 45 saniyə. Layihənin məqsədi konkret yerdə günün müxtəlif vaxtlarında səs-küyün necə dəyişdiyini anlamaqdır. Ev alarkən və ya kirayə seçərkən bir dəfə baxış gecə səs mənzərəsini göstərmir. Davamlı müşahidə gündüz, axşam və gecə səviyyələrini ayrıca göstərir. Hazırda prototip bir nöqtədə ölçmə aparır. Bir neçə ev və rayon arasında düzgün müqayisə gələcək mərhələdir: eyni kalibrasiya, eyni vaxt aralıqları və kifayət qədər əhatə tələb olunur. Mənbə: layihənin əsas məqsədi və istifadəçinin təsdiqlədiyi ev seçimi ssenarisi. Bakı foto mənbəyi: https://minval.az/news/123918269`);
await im(s,'baku-avenue-real.jpg',663,194,553,371);
tx(s,'Ev seçimi üçün məlumat',64,171,570,64,38,C.teal,true);
list(s,['Bir baxış bütün günü göstərmir.','Gündüz, axşam və gecəni ayrıca izləyirik.','Yolun təsirini və sakit vaxtları görürük.'],64,268,557,104,30);
tx(s,'İndi: bir müşahidə nöqtəsi.\nGələcək: müqayisə olunan bir neçə məkan.',64,596,1140,77,26,C.muted);
'''
chain=segment('// 4 goal','// 5 current')
hardware=segment('// 5 current','// Clearly separate')
hardware=hardware.replace("tx(s,'Vizual retuş',840,660,348,26,19,C.muted,false,'center');", "")
scheme=segment('// Two original diagrams','// Energy evidence')
pcb=segment('// Clearly separate','// Two original diagrams')
pcb=pcb.replace("'pcb-final.png'", "'pcb-pv.png'").replace("'Gələcək yığılma: lehimlənmiş lövhə'", "'Kompakt yığılma və günəş bağlantısı'")
pcb=pcb.replace("'Lehimlənmiş bağlantılar və qısa kabellər'", "'Günəş paneli üçün ayrıca PV+ / PV− klemmləri'")
pcb=pcb.replace("s.speakerNotes.text+=' Düzəliş:", "s.speakerNotes.text+=' PV klemmləri günəş panelinin enerji yoluna qoşulması üçün konseptdir. Şarj dövrəsinin yoxlanması ayrıca tələb olunur. Düzəliş:")
pcb+= "tx(s,'PV+ / PV−',1008,475,173,37,20,C.teal,true,'center');\n"
test=r'''// 7: reference instruments and calibration in one evidence slide
s=sl('Ölçmələr necə yoxlanılıb?',`Vaxt: 50 saniyə. FNIRSI FDM01 ilə A-vəznləmə və SLOW rejimində foto cütləri müqayisə olunub. 45 sabit istinad cütündə orta mütləq xəta 1,13 dB-dir; 84,4 faiz ölçmə ±2 dB daxilindədir. Yoxlanmış diapazon 53,2–65,9 dB(A). Bu praktiki kalibrasiyadır, sertifikatlaşdırılmış ölçmə dəqiqliyi iddiası deyil. FNB58 yük xəttində USB enerji müşahidəsi üçün istifadə olunur; tam INA3221 müqayisəsi ayrıca mərhələdir. Fotolar istehsalçının cihaz modelinin şəkilləridir, bizim sınağın fotosu deyil. Mənbə: DB_CALIBRATION.md; https://www.fnirsi.com/products/fdm01 ; https://www.fnirsi.com/products/fnb58`);
await im(s,'fdm01-real.jpg',64,174,225,253);
await im(s,'fnb58-real.jpg',340,174,225,253);
tx(s,'FNIRSI FDM01',64,440,225,41,27,C.teal,true,'center');
tx(s,'FNB58',340,440,225,41,27,C.gold,true,'center');
tx(s,'Səs istinadı',64,493,225,42,24,C.ink,false,'center');
tx(s,'USB enerji testeri',340,493,225,42,24,C.ink,false,'center');
tx(s,'1,13 dB',662,178,554,111,79,C.teal,true,'center');
tx(s,'Orta mütləq xəta (MAE)',662,304,554,54,30,C.ink,false,'center');
tx(s,'45 istinad cütü\n84,4% ölçmə ±2 dB daxilində',662,389,554,101,30,C.ink,false,'center');
tx(s,'53,2–65,9 dB(A)',662,518,554,50,32,C.gold,true,'center');
tx(s,'Praktik kalibrasiya. Sertifikatlaşdırılmış dəqiqlik iddiası yoxdur.',64,618,1152,48,24,C.muted);
'''
chart=segment('// 10 quantitative','// Summary evidence')
quality=segment('// Summary evidence','// Remote access')
flow=r'''// 10: consistent route from measurement to observation
s=sl('Cihazdan istifadəçiyə məlumat yolu',`Vaxt: 35 saniyə. Birinci mərhələ cihazın ölçməsi və vaxt aralığı üzrə nəticənin hazırlanmasıdır. İkinci mərhələdə məlumat şəbəkə ilə ötürülür və tarixçə saxlanır. Üçüncü mərhələdə istifadəçi nəticəni veb-paneldə və Telegram vasitəsilə görür. Bu slayd məlumatın məntiqi axınını göstərir, bütün xarici kanalların qəbul sınağının tamamlandığını bildirmir. Sheets dB(A) və əhatə üzrə əsas analitik nəticəni verir. MQTT, Datacake və AppSheet uyğunluğu task 112 üzrə ayrıca yoxlanır. Mənbə: layihə arxitekturası, DATA_DICTIONARY_RU.md, PROJECT_TASKS.md.`);
const channels=[['ÖLÇMƏ','INMP441 və ESP32\ndB(A), vaxt və cihaz statusu'],['TARİXÇƏ','Şəbəkə ilə ötürmə\nSheets-də nəticələr və əhatə'],['MÜŞAHİDƏ','Veb-panel və Telegram\nTelefon və kompüterdən baxış']];
channels.forEach((a,i)=>{const x=64+i*389;tx(s,a[0],x,183,365,58,36,C.teal,true,'center');tx(s,a[1],x,282,365,137,29,C.ink,false,'center');});
tx(s,'Bir cihaz, bir məlumat tarixçəsi, bir neçə baxış yolu',64,480,1152,81,37,C.ink,true,'center');
tx(s,'Əsas səs nəticəsi: DAY / EVE / NGT üzrə dB(A) və məlumatın əhatəsi',64,619,1152,51,25,C.muted,false,'center');
'''
telegram=r'''// 11: actual commands and clearly labeled editable Android UI proposal
s=sl('Telegram və mobil baxış',`Vaxt: 45 saniyə. Telegram artıq status və gündəlik icmal üçün istifadə olunur. /bssts BS statusunu, /c3sts enerji kontrollerinin vəziyyətini soruşur. Soldakı mesaj maketi 6 oktyabrın təsdiqlənmiş Summary rəqəmlərini göstərir; bu, real bot ekranının fotosu deyil. Sağda gələcək Android tətbiqi üçün redaktə olunan interfeys maketi var. Hazır ayrıca Android tətbiqi iddia olunmur. Mənbə: src/telegram_alert_service.cpp; google_sheets/Code.gs; 06.10 Summary ekranı. Telegram logo: https://telegram.org/tour/screenshots . Android is a trademark of Google LLC. The Android robot is reproduced from work created and shared by Google and used according to terms described in the Creative Commons 3.0 Attribution License. Source: https://developer.android.com/distribute/marketing-tools/brand-guidelines`);
await im(s,'telegram-icon.png',64,153,67,67);
tx(s,'Telegram',152,166,476,56,36,C.teal,true);
tx(s,'/bssts     /c3sts',64,252,604,53,35,C.ink,true);
flat(s,'#FFFFFF',64,325,594,265);
tx(s,'Gündəlik icmal nümunəsi',86,343,550,45,28,C.teal,true);
tx(s,'06.10.2026\nDAY   61,5 dB(A)\nEVE   59,2 dB(A)\nNGT   53,6 dB(A)',86,409,550,161,28,C.ink);
tx(s,'Mesaj maketi',64,603,594,38,22,C.muted,false,'center');
await im(s,'android-original.png',716,153,70,43);
tx(s,'Android™ üçün tətbiq',803,157,413,48,29,C.teal,true,'center');
await im(s,'phone-blank.png',802,211,344,456);
tx(s,'BS Sound Zone',884,262,181,38,23,C.teal,true,'center');
tx(s,'Məkan 01',884,317,181,32,21,C.muted,false,'center');
tx(s,'DAY  61,5\nEVE  59,2\nNGT  53,6',884,371,181,101,25,C.ink,true,'center');
tx(s,'dB(A)',884,491,181,32,23,C.teal,false,'center');
tx(s,'Tarixçə və xəritə',881,547,189,52,21,C.ink,false,'center');
tx(s,'Gələcək interfeys maketi',740,665,474,29,20,C.muted,false,'center');
'''
website=r'''// 12: future own website plus existing-panel selected values
s=sl('Layihənin veb-saytı: vahid müşahidə yeri',`Vaxt: 50 saniyə. Layihənin öz veb-saytı olacaq. Telefon və kompüterdən cihazın göstəricilərini izləmək, səs-küy tarixçəsinə və qrafiklərə baxmaq, gündüz, axşam və gecə nəticələrini müqayisə etmək və quraşdırılma yerini xəritədə görmək mümkün olacaq. Hazırda BS Sound Zone Live veb-panel nümunəsi var; bu, ayrıca hazır layihə saytının dərc edilməsi deyil. Soldakı cədvəl istifadəçinin üç yeni ekranından seçilmiş göstəricilərlə yenidən qurulub: Now 10, Hour 20%, Mean 16%, 20,4 dərəcə, 86,3 faiz, evening/NORMAL. Bunlar nisbi göstəricilərdir, dB(A) deyil. Ekranlarda müxtəlif köhnə yenilənmə vaxtları var, canlı qəbul sübutu deyil. İstifadəçi saytın gələcək inkişaf kimi göstərilməsini təsdiqləyib. Mənbə: istifadəçinin BS Sound Zone Live skrinşotları, 11.10.2026; DATA_DICTIONARY_RU.md.`);
tx(s,'Mövcud paneldən nümunə',64,157,581,46,30,C.teal,true,'center');
nativeTable(s,[['BS Sound Zone Live','Ekran nümunəsi'],['Dövr / vəziyyət','evening / NORMAL'],['Temperatur / rütubət','20,4 °C / 86,3%'],['Now / Hour / Mean','10 / 20% / 16%']],64,224,581,252,[312,269],25,'#306C78');
tx(s,'Gələcək saytın imkanları',701,157,515,46,30,C.teal,true,'center');
list(s,['Cari göstəricilər və cihaz statusu','Səs tarixçəsi və dövrlərin müqayisəsi','Məkan xəritəsi və cihaz məlumatı'],701,239,510,88,28);
tx(s,'Telefon və kompüterdən',701,521,510,67,33,C.ink,true,'center');
tx(s,'Nümunədəki faizlər dB(A) deyil. Saytda kalibrasiya edilmiş nəticələr ayrıca göstəriləcək.',64,595,1152,82,26,C.muted);
'''
gps=r'''// 13: location linked to useful comparable monitoring
s=sl('GPS: nəticənin hansı yerə aid olduğunu bilmək',`Vaxt: 40 saniyə. GPS bir dəfə əl ilə alınan FIX vasitəsilə quraşdırma nöqtəsini müəyyən edir; gündəlik işdə saxlanmış statik koordinat istifadə olunur. Sistem hərəkət edən izləmə cihazı deyil. Xəritə layihənin mövcud pilot məkanını göstərir, səs xəritəsi deyil. Bu əlaqə səs nəticəsinin harada, nə vaxt və hansı əhatə ilə ölçüldüyünü göstərir. Bir neçə məkan üçün müqayisə gələcək mərhələdir: eyni kalibrasiya, eyni günün hissələri və eyni məlumat keyfiyyəti tələb olunur. Ev seçimi üçün rayonlar barədə nəticə hazırda bir nöqtədən çıxarılmır. Mənbə: image24.jpg orijinal xəritə; saved GPS FIX qaydası; layihə məqsədi.`);
await im(s,'image24.jpg',64,182,711,444);
tx(s,'Harada?',827,182,389,53,37,C.teal,true);
tx(s,'Saxlanmış GPS nöqtəsi',827,255,389,77,29,C.ink);
tx(s,'Nə vaxt və nə qədər?',827,350,389,87,32,C.teal,true);
tx(s,'DAY / EVE / NGT\ndB(A) və məlumatın əhatəsi',827,454,389,111,29,C.ink);
tx(s,'Gələcək müqayisə: eyni qayda ilə ölçülmüş evlər və rayonlar',64,634,1152,43,25,C.muted,false,'center');
'''
uses=r'''// 14: all uses in one coherent scene, labeled concept
s=sl('',`Vaxt: 40 saniyə. Konsepsiya yerləşdirmə şəklidir, real quraşdırma deyil; imagegen ilə yaradılmış illüstrasiya. Əsas tətbiq ev seçimi və yaşayış şəraitinin səs baxımından anlaşılmasıdır. Məktəb yaxınlığında dərs vaxtı, xəstəxana və yaşlılar evi yanında axşam və gecə, vokzal və yol yaxınlığında isə səsli vaxtların müşahidəsi faydalı ola bilər. Bu yerlərdə faktiki sınaq hələ aparılmayıb. Heç bir tibbi nəticə və ya sağlamlığa təsir iddiası yoxdur. Şəkildəki kiçik panelin enerji balansı və mexanika ayrıca yoxlanacaq. Mənbə: istifadəçinin təsdiqlədiyi tətbiq ssenariləri; school-compact.png konsepti.`);
await im(s,'school-compact.png',0,0,1280,720,'cover');fade(s,'#173D34');
tx(s,'Cihaz harada faydalı ola bilər?',64,58,586,125,43,C.white,true);
tx(s,'EV VƏ YAŞAYIŞ ƏRAZİSİ',64,205,580,44,29,C.gold,true);
tx(s,'Ev seçərkən gündüz və gecə səsini anlamaq',64,264,580,88,29,C.white);
tx(s,'MƏKTƏB VƏ QAYĞI MÜƏSSİSƏLƏRİ',64,373,580,79,29,C.gold,true);
tx(s,'Dərs, istirahət və gecə vaxtlarını müşahidə etmək',64,463,580,84,29,C.white);
tx(s,'VOKZAL VƏ NƏQLİYYAT',64,570,580,44,29,C.gold,true);
tx(s,'Səsli vaxtları və dəyişiklikləri görmək',64,624,580,55,26,C.white);
tx(s,'Yerləşdirmə konsepti',907,615,309,42,21,C.white,false,'center');
tx(s,'14 / 15',1110,679,105,25,17,C.white);
'''
end=r'''// 15: useful evidence, benefit and a concrete acceptance gate
s=sl('Daha sakit mühit üçün ölçülə bilən məlumat',`Vaxt: 45 saniyə. Prototip səs səviyyəsini qiymətləndirir və DAY, EVE, NGT üzrə nəticələr verir. Pilot gündə 61,5, 59,2 və 53,6 dB(A) alınmışdır; gecə gündüzdən 7,9 dB aşağıdır. Bu nəticə bir nöqtə və bir günə aiddir. Fayda təkcə rəqəm deyil: ev, məktəb və yaşayış yeri barədə səs baxımından daha məlumatlı qərar verməkdir. Bir neçə məkanın müqayisəsi hələ gələcək mərhələdir. Növbəti ən vacib sınaq ortaq batareya və çevirici ilə 12–24 saat gecə davamlılığı və məlumat boşluqlarının yoxlanmasıdır. Xarici çıxışlar, avtomatik AP bərpası və daimi montajın qəbulu açıqdır. Layihənin ümumi hazırlığı ekspert qiymətləndirməsi ilə 60 faizdir. Mənbə: təsdiqlənmiş 06.10 Summary, memory.md, PROJECT_TASKS.md 94/112/113, progress.md.`);
tx(s,'Sübut edilmiş nəticə',64,170,538,58,37,C.teal,true);
tx(s,'7,9 dB',64,254,538,116,82,C.ink,true);
tx(s,'Pilot gündə gündüz–gecə fərqi',64,380,538,79,29,C.ink);
tx(s,'Praktik fayda',682,170,534,58,37,C.teal,true);
tx(s,'Ev və yaşayış yeri seçiminə\nsəs barədə məlumat əlavə etmək',682,264,534,136,34,C.ink);
tx(s,'Növbəti yoxlama',64,504,538,49,32,C.teal,true);
tx(s,'12–24 saat ortaq batareya ilə\nfasiləsiz iş və məlumatın tamlığı',64,573,538,85,28,C.ink);
tx(s,'İnkişaf istiqaməti',682,504,534,49,32,C.teal,true);
tx(s,'Etibarlı tək cihazdan\nmüqayisə olunan məkanlara',682,573,534,85,28,C.ink);
'''
tail=r'''
const times=[20,45,40,35,40,35,50,45,35,35,45,50,40,40,45];
p.slides.items.forEach((slide,i)=>{slide.speakerNotes.text=slide.speakerNotes.text.replace(/Vaxt: \d+ saniyə\./,`Vaxt: ${times[i]} saniyə.`);});
await (await PresentationFile.exportPptx(p)).save(b+'/compact-draft.pptx');
const r=await finalizePresentation({workspaceDir:root,candidatePath:b+'/compact-draft.pptx',finalPath:root+'/output/BSPRJ_Akustik_Monitorinq_AZ_Compact_15.pptx',pythonExecutable:runtime+'/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','9','--require-native-table-slide','12'],explicitTotalSlideCount:15,requiredNativeChartOwnerSlides:[8],requiredNativeTableOwnerSlides:[9,12],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:b+'/compact-validation.json'});
const final=await PresentationFile.importPptx(await FileBlob.load(r.finalPath));
for(let i=0;i<15;i++){const blob=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(b+`/compact-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Finalized and rendered 15 slides; speaker timing '+times.reduce((a,b)=>a+b,0)+' seconds');
'''.replace('\\d','\d').replace('\\.','\.')
(b/'build-v6.mjs').write_text(head+cover+goal+chain+hardware+scheme+pcb+test+chart+quality+flow+telegram+website+gps+uses+end+tail,encoding='utf-8')
