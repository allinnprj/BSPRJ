import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const runtime='C:/Users/INN/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=runtime+'/node/node_modules';
const req=createRequire(runtime+'/node/node_modules/runtime.cjs');
const {Presentation,PresentationFile,FileBlob}=await import(pathToFileURL(req.resolve('@oai/artifact-tool')).href);
const skill='C:/Users/INN/.codex/plugins/cache/openai-primary-runtime/presentations/26.1009.11318/skills/presentations';
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(skill+'/container_tools/artifact_tool_utils.mjs').href);
const root='D:/DEV/BSPRJ/presentation_work',b=root+'/build';
const p=Presentation.create({slideSize:{width:1280,height:720}});
const old=await PresentationFile.importPptx(await FileBlob.load(root+'/output/BSPRJ_Akustik_Monitorinq_AZ.pptx'));
const oldNotes=i=>old.slides.items[i-1].speakerNotes.text;
const C={navy:'#172B4D',teal:'#087F8C',aqua:'#63DED1',gold:'#FFC857',coral:'#EE785C',white:'#FFFFFF',cream:'#FFF8EA',ink:'#14334A',muted:'#4D6575'};
const darkSlides=new WeakSet();
function tx(s,t,x,y,w,h,size=30,color=C.ink,bold=false,alignment='left'){if(!darkSlides.has(s)){if([C.white,'#C7F1ED','#CEF4EE','#BCDAE2','#BADEE2'].includes(color))color=C.ink;else if(color===C.gold)color='#795000';else if(color===C.aqua)color='#005C66';else if(color===C.coral)color='#AC3A29';else if(color===C.teal)color='#00616B';}const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=t;a.text.style={typeface:'Arial',fontSize:size,color,bold,alignment};return a;}
const backWave=await fs.readFile(root+'/output/backgrounds/acoustic.png');
const backEnergy=await fs.readFile(root+'/output/backgrounds/energy.png');
const backCity=await fs.readFile(b+'/image19.jpg');
function flat(s,fill,x,y,w,h){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill:typeof fill==='object'&&fill.opacity!==undefined?fill.color+'/'+Math.round(fill.opacity*100):fill,line:{fill:'none',width:0}});}
function sl(title,notes,bg=C.cream){
 const v=p.slides.add(),n=p.slides.items.length;
 const photo=n===1||(n>=17&&n<=20);
 v.background.fill=C.cream;
 if(photo)darkSlides.add(v);
 if(!photo)v.images.add({blob:[5,6,7,8].includes(n)?backEnergy:backWave,contentType:'image/png',position:{left:0,top:0,width:1280,height:720},fit:'cover',alt:'Decorative presentation background'});
 if(title)tx(v,title,64,45,1152,102,43,C.ink,true,'center');
 if(!photo)tx(v,String(n).padStart(2,'0')+' / 22',1108,679,108,23,17,C.muted);
 v.speakerNotes.text=notes;return v;
}
function fade(v,color){
 flat(v,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color},{offset:56000,color},{offset:100000,color:color+'/0'}]},0,0,950,720);
}
async function im(s,n,x,y,w,h,fit='contain'){const bytes=await fs.readFile(b+'/'+n);return s.images.add({blob:bytes,contentType:n.endsWith('.png')?'image/png':'image/jpeg',position:{left:x,top:y,width:w,height:h},fit,alt:n});}
function list(s,items,x,y,w,gap=96,size=29,color=C.ink){items.forEach((a,i)=>tx(s,a,x,y+gap*i,w,gap-8,size,color));}
function nativeTable(s,values,x,y,w,h,widths,size=24,head='#385B88'){
 const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:w,height:h,columnWidths:widths,values});
 for(let r=0;r<values.length;r++) for(let c=0;c<values[0].length;c++) {const cell=t.getCell(r,c);cell.fill=r===0?head:(r%2?'#FFFFFF':'#EDF3F5');cell.text.style={typeface:'Arial',fontSize:size,color:r===0?C.white:C.ink,bold:r===0};}
 t.borders.assign({fill:'#CBD7DE',width:1,style:'solid'});return t;
}
// 1: striking, minimal title and real city context
let s=sl('',oldNotes(1),C.navy);
await im(s,'baku-boulevard-real.jpg',0,0,1280,720,'cover');
flat(s,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#142E46/0'},{offset:43000,color:'#142E46'},{offset:100000,color:'#142E46'}]},490,0,790,720);
tx(s,'Şəhər mühitində\nsəs monitorinqi',710,155,510,177,47,C.white,true,'center');
tx(s,'Akustik monitorinq və\nzaman üzrə təhlil',710,376,510,102,32,C.aqua,false,'center');
tx(s,'Ali Nuri və Zülfüqar Həsənov',710,562,510,65,25,C.white,false,'center');
await im(s,'image10.png',932,638,66,55);
s.speakerNotes.text+=' Bakı fotoşəkli dəyişdirilmədən istifadə olunur. Mənbə: https://www.archilovers.com/projects/82549/baku-flame-towers.html ; original photo https://cdn.archilovers.com/projects/d73231421a6042dab6cf071b093614f6.jpg';
// 2: concrete problem
s=sl('Bir ölçmə bütün günü təsvir etmir',oldNotes(2));
await im(s,'baku-avenue-real.jpg',615,200,601,401,'contain');
tx(s,'Bakı, Heydər Əliyev prospekti',615,617,601,33,22,C.muted,false,'center');
s.speakerNotes.text+=' Real şəhər fotoşəkli, nəqliyyat əlavə edilməyib. Mənbə: https://minval.az/news/123918269 ; original https://cdn.minval.az/2019/09/heyder_aliyev_prospekti_060919.jpg';
tx(s,'Səs-küy\nzamanla dəyişir',64,188,510,129,43,C.teal,true);
list(s,['Gündüz hərəkət çoxala bilər.','Gecə səviyyə azalır və ya dəyişir.','Nəticə üçün davamlı müşahidə lazımdır.'],64,354,497,93,28);
// 3: additional practical usefulness slide
s=sl('Cihaz hansı qərarlara kömək edə bilər?',`Vaxt: 40 saniyə. Cihazın faydası səsin bir anlıq səviyyəsini göstərməkdən daha genişdir. Məktəb və ya yaşayış ərazisi yanında günün hansı hissəsində və hansı müddətdə daha çox səs-küy olduğunu görmək mümkündür. Bu məlumat təkrar ölçmənin vaxtını seçməyə kömək edir. Sonrakı mərhələdə məsələn, yol hərəkətində və ya səs maneəsində dəyişiklikdən əvvəl və sonra eyni qaydada müşahidə aparmaq olar. Bunlar tətbiq ssenariləridir. Məktəbdə və müdaxilədən sonra faktiki sınaq hələ keçirilməyib. Mənbə: layihənin məqsədi və istifadəçinin təsdiqlədiyi gələcək tətbiq planı.`,C.teal);
tx(s,'MƏKTƏB',64,171,542,65,43,C.gold,true);
tx(s,'Dərs vaxtı və fasilələr üçün\nsəs-küyün zaman mənzərəsi',64,262,542,121,34,C.white);
tx(s,'YAŞAYIŞ ƏRAZİSİ',696,171,520,65,43,C.gold,true);
tx(s,'Gündüz, axşam və gecə\nsəviyyələrinin müqayisəsi',696,262,520,121,34,C.white);
tx(s,'Dəyişiklikdən əvvəl və sonra müşahidə: məsələn, səs maneəsinin quraşdırılması',64,473,1136,104,33,C.white);
tx(s,'Tətbiq ssenariləri. Bu məkanlarda ayrıca sınaq tələb olunur.',64,625,1140,35,22,'#C7F1ED');
// 4 goal + analytics chain
s=sl('Ölçmədən etibarlı nəticəyə',`Vaxt: 40 saniyə. Mikrofonun xam siqnalına A-vəznləmə və qəbul edilmiş kalibrasiya ofseti tətbiq olunur. Sistem etibarlı nümunələr üzrə enerjini toplayır və on dəqiqəlik Leq hesablayır. DAY, EVE və NGT üçün nəticələr etibarlı ölçmə müddəti ilə çəkilən enerji ortasıdır. dB qiymətlərinin sadə ədədi ortası istifadə olunmur. Orta səviyyə ilə yanaşı, ən çox müşahidə olunan sinif və məlumat əhatəsi göstərilir. Mənbə: BSPRJ DB_CALIBRATION.md, DATA_DICTIONARY_RU.md və Google Sheets hesablamaları.`);
const stage=[['dB(A)','Kalibrasiya edilmiş\nsəs qiymətləndirməsi'],['10 dəqiqə','Etibarlı audio üzrə\nenerji ortası (Leq)'],['DAY / EVE / NGT','Günün hissələri üzrə\nnəticə və əhatə']];
stage.forEach((a,i)=>{const x=64+i*389;tx(s,a[0],x,196,365,66,i===2?35:48,i===1?C.coral:C.teal,true);tx(s,a[1],x,304,355,132,30);});
tx(s,'İki əsas nəticə',64,478,1110,52,33,C.ink,true);
tx(s,'Orta səviyyə nədir?     Hansı sinif daha çox müşahidə olunur?',64,552,1135,79,32,C.teal);
// 5 current actual hardware
s=sl('İki kontroller, bir müşahidə sistemi',oldNotes(5)+' Əsas modulun modeli layihənin UART sxemində ESP32-WROOM-32U kimi göstərilir. C3 modeli HARDWARE.md ilə təsdiqlənir.');
await im(s,'prototype-clean.png',840,153,348,505);tx(s,'Vizual retuş',840,660,348,26,19,C.muted,false,'center');s.speakerNotes.text+=' Fotoşəkil imagegen ilə vizual təmizlənib; orijinal görüntü saxlanılıb. Retuş elektrik bağlantılarının təsdiqi deyil.';
tx(s,'ESP32-WROOM-32U',64,181,738,59,39,C.teal,true);
tx(s,'INMP441 mikrofonu · I2S\nOLED 128×64 · Wi-Fi',64,259,718,101,31);
tx(s,'ESP32-C3 SuperMini',64,402,738,59,39,C.coral,true);
tx(s,'INA3221: Solar / Battery / Load\nu-blox NEO-M8 / HW-542: saxlanmış GPS FIX',64,480,738,116,29);
// Clearly separate actual prototype from illustrative soldered-board assembly.
s=sl('Gələcək yığılma: lehimlənmiş lövhə',`Vaxt: 25 saniyə. Bu görüntü real hazır lövhənin fotosu deyil. İlkin prototipə əsaslanan gələcək səliqəli PCB yığılmasının imagegen konseptidir. Qısa bağlantılar, lehimlənmiş modullar və servis üçün əlçatan quruluş göstərilir. Faktiki PCB layihəsi, elektrik audit və fiziki sınaq ayrıca mərhələdir. Mənbə: ilkin prototip fotosu, istifadəçinin təsdiqlədiyi gələcək yığılma ideyası.`);
await im(s,'pcb-final.png',840,163,376,505);
s.speakerNotes.text+=' Düzəliş: əsas WROOM və daha kiçik C3 fərqləndirilib. Şəkil modul formasının dəqiq texniki çertyoju deyil. Elektrik bağlantıları sxem üzrə yoxlanır.';
tx(s,'Daha səliqəli montaj',64,187,639,61,40,C.teal,true);
list(s,['ESP32-WROOM-32U və ESP32-C3 SuperMini','Lehimlənmiş bağlantılar və qısa kabellər','Servis üçün əlçatan modullar'],64,292,716,89,28);
tx(s,'Gələcək konsept · hələ istehsal edilməyib',64,603,632,61,25,C.ink,true);
// Two original diagrams share one overview slide as requested.
s=sl('Rabitə və enerji sxemləri',`Vaxt: 40 saniyə. Solda kontrollerlər arasındakı UART sxemi, sağda enerji sxemi göstərilir. UART 3,3 V, ortaq GND və ayrıca wake xətti BS GPIO23 → C3 GPIO5 var. Enerji sxemində Solar, Battery və Load INA3221 kanalları ilə ayrı izlənir. Şarj tənzimlənməsi və yekun avtonom qəbul hələ ayrıca yoxlanmalıdır. Mənbə: electrical circuits/CONTROLLER_UART_TECHNICAL_V2.png; INA3221_ACTUAL_WIRING_RESTORED.svg; D:/DEV/INA3221-C3/INA3221_ACTUAL_WIRING.net və HARDWARE.md. Original sxemlər dəyişdirilməyib.`);
tx(s,'UART / WAKE',64,157,560,47,32,C.teal,true,'center');
tx(s,'SOLAR / BATTERY / LOAD',656,157,560,47,30,C.teal,true,'center');
await im(s,'uart-detail.png',64,208,560,393);
await im(s,'solar-az.png',656,208,560,393);
tx(s,'3,3 V · TX / RX · ümumi GND',64,608,560,40,23,C.ink,false,'center');
tx(s,'Panel, batareya və yük ayrıca ölçülür',656,608,560,40,23,C.ink,false,'center');
tx(s,'Wake: BS GPIO23 → C3 GPIO5. Şarj və avtonom iş ayrıca yoxlanır.',64,650,1152,32,21,C.muted);
// Energy evidence from supplied screenshot
s=sl('Enerji axınları onlayn izlənir',`Vaxt: 30 saniyə. İstifadəçinin 11 oktyabr 2026 ekran nümunəsindən iki sətir göstərilir. Solar, Battery və Load kanalları ayrı izlənir. Battery cərəyanının müsbət olması doldurma, mənfi olması boşalma istiqamətini göstərir. Bir sətir işləmənin tam gecə boyunca davam etdiyini və ya təhlükəsiz şarj qəbulunu sübut etmir. Mənbə: istifadəçinin əlavə etdiyi Solar/Battery/Load ekranı; rəqəmlər əl ilə köçürülüb. Bu slayd yeni hesablanmış enerji balansı deyil.`);
tx(s,'11 oktyabr 2026 · Solar / Battery / Load',64,157,1152,46,26,C.muted);
nativeTable(s,[['Vaxt','Solar: V / A / W','Battery: V / A / W','Load: V / A / W','Şarj'],['14:34:23–14:35:24','12,940 / 0,31 / 4,020','12,650 / +0,16 / +2,010','7,100 / 0,24 / 1,680','ON'],['15:01:53–15:02:54','0,940 / 0,00 / 0,000','11,690 / −0,20 / −2,340','7,100 / 0,32 / 2,280','OFF']],64,232,1152,202,[230,257,257,257,151],22,'#47785B');
tx(s,'Batareya dolur və boşalır',64,481,1110,65,38,'#47785B',true);
tx(s,'Gərginlik, cərəyan və güc hər kanal üzrə ayrılır.\nEkrandakı idarəetmə rejimi: Smart Auto',64,561,1152,88,28,C.ink);
// 8 exact test instruments, no invented photos
s=sl('Yoxlama üçün istifadə etdiyimiz cihazlar',`Vaxt: 40 saniyə. Səs qiymətləndirməsini FNIRSI FDM01 ilə müqayisə etmişik. Bunun üçün A-vəznləmə və SLOW rejimində foto cütləri istifadə olunub. FNB58 isə enerji yolunda gərginlik, cərəyan və gücün müşahidəsi üçün istifadə olunan USB testerdir. Müxtəlif qoşulma nöqtələri nəticəyə təsir edə bildiyinə görə FNB58-i INA3221-in tam kalibrasiyası kimi təqdim etmirik. Tam gecə-gündüz müqayisə jurnalı ayrıca optional yoxlamadır. Günəş nəzarətçisi INA3221 göstəricilərindən istifadə edir, əsas səs kontrolleri isə fasiləsiz I2S ölçməsini davam etdirir. Mənbə: BSPRJ DB_CALIBRATION.md; D:/DEV/INA3221-C3/HARDWARE.md, FNB58 Load Test Wiring; həmin layihənin memory.md, FNB58 müqayisəsinin açıq sərhədləri.`,C.navy);
tx(s,'FNIRSI FDM01',64,164,560,60,42,C.teal,true,'center');
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
// 9 calibration proof
s=sl('Kalibrasiya nəticəsi: 1,13 dB orta xəta',oldNotes(7),C.teal);
tx(s,'1,13 dB',64,174,620,132,91,C.white,true);
tx(s,'Orta mütləq xəta (MAE)',64,329,632,62,31,C.white);
tx(s,'45',845,188,345,102,76,C.gold,true);
tx(s,'sabit istinad cütü',845,312,345,93,30,C.white);
tx(s,'84,4% ölçmə ±2 dB daxilində',64,444,1100,58,37,C.white,true);
tx(s,'Yoxlanmış diapazon: 53,2–65,9 dB(A)',64,519,1100,57,30,C.white);
tx(s,'Praktik qiymətləndirmə. Sertifikatlaşdırılmış ölçmə dəqiqliyi iddiası yoxdur.',64,625,1152,36,22,'#CEF4EE');
// 10 quantitative results
s=sl('Pilot gündə gecə daha sakit olub',oldNotes(9));
tx(s,'6 oktyabr 2026 · eyni müşahidə nöqtəsi',64,155,1130,50,26,C.muted);
const chart=s.charts.add('bar',{position:{left:64,top:235,width:775,height:359},categories:['DAY','EVE','NGT'],series:[{name:'Leq, dB(A)',values:[61.5,59.2,53.6],fill:C.teal,points:[{idx:0,fill:C.coral},{idx:1,fill:'#EAB13F'},{idx:2,fill:C.teal}]}],barOptions:{direction:'column',grouping:'clustered',gapWidth:85},hasLegend:false,xAxis:{textStyle:{fontSize:25,fill:C.ink}},yAxis:{min:0,max:70,majorUnit:10,numberFormatCode:'0',title:{text:'dB(A)',textStyle:{fontSize:22}},textStyle:{fontSize:19,fill:C.muted},majorGridlines:{fill:'#DCE3DB',width:1}},dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.0',textStyle:{fontSize:27,bold:true,fill:C.ink}},chartFill:C.cream,plotAreaFill:C.cream});applyPresentationChartFont(chart,{fontFamily:'Arial'});
tx(s,'7,9 dB',907,252,309,96,59,C.teal,true);
tx(s,'Gündüz–gecə fərqi',907,359,309,80,27);
tx(s,'Əhatə:\nDAY 99,8%\nEVE 99,7%\nNGT 99,7%',907,459,309,139,25,C.muted);
tx(s,'Bu bir günlük nəticədir. Bütün şəhər üzrə ümumiləşdirmə aparılmır.',64,629,1152,40,23,C.muted);
// Summary evidence, kept editable and readable
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
// 12 spatial context
s=sl('Bir nöqtədən müşahidə şəbəkəsinə',oldNotes(11));
await im(s,'image24.jpg',679,164,537,411);
tx(s,'Hazırda',64,179,561,54,39,C.teal,true);
tx(s,'Saxlanmış GPS koordinatı\nZaman üzrə DAY / EVE / NGT',64,255,562,102,30);
tx(s,'Gələcəkdə',64,393,561,54,39,C.coral,true);
tx(s,'Bir neçə kalibrasiya edilmiş stansiya\nMüqayisə olunan ölçmələr və xəritə',64,469,562,123,30);
tx(s,'Xəritə pilot məkanı göstərir. Şəhər səs xəritəsi gələcək mərhələdir.',64,630,1152,41,24,C.muted);
// Three enclosure styles, one continuous image and editable labels.
s=sl('Korpus üçün üç dizayn seçimi',`Vaxt: 25 saniyə. Bunlar eyni məqsədli kompakt cihaz üçün üç xarici dizayn variantıdır. Solda texniki, ortada müasir şəhər, sağda minimalist üslub göstərilir. Kiçik günəş paneli və mikrofon girişi bütün variantlarda saxlanır. Bunlar ölçülmüş texniki çertyojlar deyil; hava şəraiti, enerji balansı, mikrofonun yerləşməsi və montaj ayrıca yoxlanacaq. Mənbə: imagegen ilə hazırlanmış konseptlər; istifadəçinin təsdiqlədiyi üç stil seçimi.`);
await im(s,'enclosure-styles.png',64,161,1152,413);
tx(s,'1 · Texniki',300,590,220,48,29,C.ink,true,'center');
tx(s,'2 · Şəhər üslubu',495,590,290,48,29,C.ink,true,'center');
tx(s,'3 · Minimalist',770,590,240,48,29,C.ink,true,'center');
tx(s,'Gələcək korpus konseptləri · son dizayn seçilməyib',64,650,1152,33,23,C.muted);
// 13 full concept image, clearly disclosed
s=sl('',`Vaxt: 40 saniyə. Bu slayd real quraşdırmanın fotosu deyil, məktəb yanında gələcək yerləşdirmənin süni intellektlə hazırlanmış konseptidir. Kiçik günəş paneli, qorunan korpus və yol tərəfə yönəlmiş mikrofon göstərilir. Bu quruluş məktəb ətrafındakı səsin zaman üzrə müşahidəsini izah edir. Panelin ölçüsü və enerji balansı görüntüdə yalnız konseptualdır. Daimi montaj, hava şəraitindən qorunma və batareya dövrü ayrıca mühəndislik yoxlaması tələb edir. Mənbə: istifadəçinin təsdiqlədiyi yerləşdirmə ideyası; imagegen ilə yaradılmış illüstrasiya. Prompt: məktəb və yol yanında dirəkdə kompakt səs monitoru, üstündə kiçik günəş paneli, realistik qorunan korpus, kamera və mətn yoxdur.`,C.navy);
await im(s,'school-compact.png',0,0,1280,720,'cover');fade(s,'#173D34');
tx(s,'Məktəb yanında\nsəs monitorinqi',64,81,465,154,42,C.white,true);
tx(s,'Gələcək quraşdırma\nkonsepti',64,278,461,85,29,C.gold);
tx(s,'Kiçik günəş paneli\nQorunan korpus\nZaman üzrə ölçmələr',64,414,461,139,30,C.white);
tx(s,'Süni intellektlə hazırlanmış\nillüstrasiya',64,615,461,60,21,C.aqua);
// Additional deployment concepts; hypothetical locations, no claimed field trial.
async function concept(title,asset,points,notes){const v=sl('',notes,C.navy);await im(v,asset,0,0,1280,720,'cover');fade(v,asset.startsWith('station')?'#332940':asset.startsWith('hospital')?'#203A54':'#49352A');tx(v,title,64,81,464,155,42,C.white,true);tx(v,'Gələcək tətbiq konsepti',64,278,464,84,29,C.gold);tx(v,points,64,408,464,170,29,C.white);tx(v,'Süni intellektlə hazırlanmış\nillüstrasiya',64,615,464,60,21,C.aqua);}
await concept('Vokzal ətrafında\nsəs monitorinqi','station-concept.png','Günün səsli vaxtları\nPik səviyyələrin izlənməsi\nTəkrar ölçmə üçün vaxt seçimi',`Vaxt: 25 saniyə. Vokzal yaxınlığında nəqliyyat və sərnişin hərəkəti gün ərzində dəyişir. Bu konsept həmin ərazidə səs səviyyəsinin zaman üzrə müşahidəsini göstərir. Məqsəd səsli aralıqları görmək və əlavə ölçmənin vaxtını seçməkdir. Sistem bu mərhələdə səs mənbəyini avtomatik tanımır. Vokzalda real quraşdırma və sınaq keçirilməyib. Mənbə: istifadəçinin təklif etdiyi tətbiq ssenarisi; imagegen ilə yaradılmış konsept.`);
await concept('Xəstəxana yanında\nsəs monitorinqi','hospital-tabib.png','Yol tərəfinin müşahidəsi\nGündüz–gecə müqayisəsi\nDaha sakit aralıqların müəyyən edilməsi',`Vaxt: 25 saniyə. Xəstəxana ətrafında ölçmə aparmaq yol tərəfdəki səsin gündüz və gecə necə dəyişdiyini göstərmək üçün mümkün tətbiqdir. Nəticələr ərazinin səs mənzərəsini təsvir edir. Bu slayd tibbi nəticə və ya sağlamlığa təsir sınağı təqdim etmir. Xəstəxana yanında real ölçmə hələ aparılmayıb. Mənbə: istifadəçinin təklif etdiyi tətbiq ssenarisi; imagegen ilə yaradılmış konsept.`);
await concept('Yaşlılar evi yanında\nsəs monitorinqi','eldercare-concept.png','Yaşayış ərazisinin müşahidəsi\nAxşam və gecə səviyyələri\nDəyişiklikdən əvvəl və sonra müqayisə',`Vaxt: 25 saniyə. Yaşlılar evi yaxınlığında davamlı müşahidə axşam və gecə səviyyələrini ayrıca göstərmək üçün faydalı tətbiq ssenarisidir. Gələcəkdə eyni qayda ilə məsələn, yolun təşkili dəyişməzdən əvvəl və sonra müqayisə aparmaq olar. Bu məkanlarda nəticə hələ toplanmayıb. Şəkil kompakt cihazın gələcək yerləşdirmə ideyasıdır. Mənbə: istifadəçinin təklif etdiyi tətbiq ssenarisi; imagegen ilə yaradılmış konsept.`);
// 14 completion stage
s=sl('Növbəti sınaq: real enerji davamlılığı',oldNotes(12),C.navy);
tx(s,'12–24 saat',64,171,1146,138,84,C.gold,true);
tx(s,'Ortaq batareya və çevirici ilə gecə sınağı',64,333,1138,71,34,C.white);
list(s,['Xarici dB(A) çıxışlarının və avtomatik AP bərpasının qəbulu','Təhlükəsiz təmizləmədən sonra yeddi günlük səs sınağı','Daimi montaj və yekun inteqrasiya yoxlaması'],64,443,1138,63,27,C.white);
tx(s,'Layihənin ümumi hazırlığı: 60% — ekspert qiymətləndirməsi',64,637,1138,37,23,C.aqua);
// 15 conclusion strong factual
s=sl('Ölçülə bilən nəticə, aydın inkişaf planı',oldNotes(13),C.teal);
tx(s,'Real prototip',64,184,1110,71,51,C.white,true);
tx(s,'Kalibrasiya edilmiş dB(A)',64,278,1110,71,51,C.white,true);
tx(s,'Günün hissələri üzrə nəticələr',64,372,1110,71,51,C.white,true);
tx(s,'Məktəblər və yaşayış əraziləri üçün\ndavamlı müşahidə perspektivi',64,483,1120,94,33,C.gold);
tx(s,'Diqqətiniz üçün təşəkkür edirik',64,619,1120,49,34,C.white);

const times=[20,25,25,30,25,25,40,30,25,30,35,35,30,30,25,25,20,20,20,20,30,20];
p.slides.items.forEach((slide,i)=>{slide.speakerNotes.text=slide.speakerNotes.text.replace(/Vaxt: \d+ saniyə\./,`Vaxt: ${times[i]} saniyə.`);if(i>=16&&i<=19)tx(slide,String(i+1)+' / 22',1110,679,105,25,17,C.white);});
await (await PresentationFile.exportPptx(p)).save(b+'/authentic-draft.pptx');
const r=await finalizePresentation({workspaceDir:root,candidatePath:b+'/authentic-draft.pptx',finalPath:root+'/output/BSPRJ_Akustik_Monitorinq_AZ_Corrected_Final.pptx',pythonExecutable:runtime+'/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','8','--require-native-table-slide','12','--require-native-table-slide','14'],explicitTotalSlideCount:22,requiredNativeChartOwnerSlides:[11],requiredNativeTableOwnerSlides:[8,12,14],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:b+'/corrected-validation.json'});
const final=await PresentationFile.importPptx(await FileBlob.load(r.finalPath));
for(let i=0;i<22;i++){const blob=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(b+`/corrected-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Finalized and rendered 22 slides, about '+(times.reduce((a,b)=>a+b,0)/60).toFixed(1)+' minutes');
