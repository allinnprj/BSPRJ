import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const runtime='C:/Users/INN/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=runtime+'/node/node_modules';
const req=createRequire(runtime+'/node/node_modules/runtime.cjs');
const {Presentation,PresentationFile,FileBlob}=await import(pathToFileURL(req.resolve('@oai/artifact-tool')).href);
const skill='C:/Users/INN/.codex/plugins/cache/openai-primary-runtime/presentations/26.1009.11318/skills/presentations';
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(skill+'/container_tools/artifact_tool_utils.mjs').href);
const root='D:/DEV/BSPRJ/presentation_work', build=root+'/build';
const original='D:/MD/Downloads/sound/T12/Şəhər Mühitində Akustik Çirklənmənin İntellektual Monitorinqi və Xəritə Üzərində Vizualizasiyası.pptx';
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={navy:'#142C3C',teal:'#087F83',ink:'#172F40',muted:'#526674',paper:'#F7F7F2',white:'#FFFFFF'};
function text(s,str,x,y,w,h,size=28,color=C.ink,bold=false){const o=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});o.text=str;o.text.style={typeface:'Arial',fontSize:size,color,bold};return o;}
function slide(title,notes,dark=false){const s=p.slides.add();s.background.fill=dark?C.navy:C.paper;const n=p.slides.items.length; if(title)text(s,title,64,44,1152,88,42,dark?C.white:C.ink,true);text(s,String(n).padStart(2,'0')+' / 13',1110,672,106,26,16,dark?'#B7CFD8':C.muted);s.speakerNotes.text=notes;return s;}
async function img(s,name,x,y,w,h,fit='contain',crop){const bytes=await fs.readFile(build+'/'+name);s.images.add({blob:bytes,contentType:name.endsWith('.png')?'image/png':'image/jpeg',position:{left:x,top:y,width:w,height:h},fit,alt:name,crop});}
function rows(s,items,x=64,y=170,w=1120,gap=104,size=29){items.forEach((str,i)=>text(s,str,x,y+i*gap,w,gap-12,size));}
const source='Mənbə: istifadəçinin təqdim etdiyi ilkin PPTX və BSPRJ layihə qeydləri (memory.md, progress.md).';
// 1
let s=slide('',`Vaxt: 30 saniyə. Salam. Biz Ali Nuri və Zülfüqar Həsənov şəhər mühitində səs-küyün ölçülməsi və zaman üzrə təhlili layihəsini təqdim edirik. Hazırkı işimiz bir nöqtədə işləyən real prototipə əsaslanır. Məqsəd gündüz, axşam və gecə səs-küyün nə qədər dəyişdiyini etibarlı məlumatla göstərməkdir. Xəritə üzərində çoxsaylı stansiyaların birləşdirilməsi layihənin növbəti inkişaf mərhələsidir. ${source} Foto və məktəb loqosu ilkin təqdimatdan götürülüb.`,true);
await img(s,'image12.jpg',680,0,600,720,'cover');
text(s,'Şəhər mühitində\nakustik monitorinq',64,128,590,170,53,C.white,true);
text(s,'Zaman üzrə təhlil və\nxəritələmə perspektivi',64,337,560,110,32,'#C8E3E6');
text(s,'BSPRJ • Tədqiqat prototipi',64,80,540,30,20,'#C8E3E6');
text(s,'Ali Nuri və Zülfüqar Həsənov',64,566,550,42,27,C.white);
await img(s,'image10.png',64,622,70,60);
// 2
s=slide('Tədqiqat problemi',`Vaxt: 40 saniyə. Səs-küy gün ərzində dəyişir. Qısa bir ölçmə həmin məkanın bütün günü üçün nəticə vermir. Buna görə sistem ardıcıl ölçmələr toplamalı, onları günün hissələrinə ayırmalı və məlumatın nə qədər tam olduğunu göstərməlidir. Bu işdə Bakı şəhərində bir pilot müşahidə nöqtəsini araşdırırıq. Bütün şəhər üzrə nəticə çıxarmırıq və şəhərdə əvvəlki monitorinqin olmadığını iddia etmirik. ${source} Şəhər fotosu ilkin PPTX-dən götürülüb.`);
await img(s,'image1.jpg',680,170,536,416,'cover');
rows(s,['Eyni məkanın səs səviyyəsi gün ərzində dəyişir.','Qısa ölçmə sutkalıq mənzərəni tam göstərmir.','Müqayisə üçün davamlı və keyfiyyəti yoxlanmış məlumat lazımdır.'],64,178,558,139,29);
// 3
s=slide('Layihənin məqsədi',`Vaxt: 40 saniyə. Əsas sualımız budur: müşahidə nöqtəsində gündüz, axşam və gecə üçün tipik səs səviyyəsi nədir? Bunun üçün kalibrasiya edilmiş dB(A) qiymətləndirməsindən və etibarlı ölçmə müddətindən istifadə edirik. Orta səviyyə ilə yanaşı, ən çox müşahidə olunan sinfi göstəririk. Son məqsəd bu nəticələri məkanla əlaqələndirmək və cihazın real batareya rejimində davamlı işləməsini təsdiqləməkdir. ${source}`);
text(s,'Günün hansı hissəsində səs-küy daha yüksəkdir?',64,174,1135,104,43,C.teal,true);
rows(s,['DAY — gündüz     EVE — axşam     NGT — gecə','Hər dövr üçün enerji üzrə orta dB(A), tipik sinif və məlumat əhatəsi','Sabit müşahidə nöqtəsi və yoxlanmış avtonom iş'],64,321,1120,101,29);
// 4
s=slide('Hazırkı prototip və inkişaf istiqaməti',`Vaxt: 40 saniyə. Bu slaydda işləyən hissələrlə gələcək funksiyaları ayırırıq. Hazırda mikrofon siqnalı emal olunur, dB(A) qiymətləndirməsi və on dəqiqəlik statistikalar alınır, yerli jurnal və Google Sheets işləyir. Telegram diaqnostika və nəticələrə çıxış verir. GPS-dən əvvəlcədən saxlanmış sabit koordinat istifadə olunur. Çoxsaylı ölçmə nöqtələri, şəhər səs xəritəsi, anomaliya aşkarlanması və maşın təlimi ayrıca gələcək işlərdir. ${source}`);
text(s,'Hazırda işləyən hissələr',64,171,550,50,32,C.teal,true);
text(s,'Sonrakı mərhələlər',690,171,526,50,32,C.teal,true);
rows(s,['dB(A) ölçmə və zaman statistikası','Yerli jurnal, Google Sheets, Telegram','Saxlanmış GPS koordinatı'],64,256,540,104,28);
rows(s,['Bir neçə müşahidə stansiyası','Şəhər üzrə səs xəritəsi','Anomaliya aşkarlanması və maşın təlimi'],690,256,526,104,28);
text(s,'İlk mərhələ: bir cihazın nəticələrini və enerji davamlılığını təsdiqləmək',64,601,1120,45,25,C.muted);
// 5
s=slide('Texniki prototip',`Vaxt: 45 saniyə. Bu, layihənin real yığılma fotosudur. Əsas ESP32 INMP441 rəqəmsal mikrofonunun I2S siqnalını oxuyur və səs statistikalarını hesablayır. OLED cari məlumatı göstərir. Ayrı ESP32-C3 nəzarətçisi INA3221 vasitəsilə enerji məlumatını izləyir və GPS koordinatını idarə edir. Kontrollerlər UART ilə məlumat mübadiləsi aparır. Quruluş hələ sınaq yığılmasıdır. Son montaj və ortaq enerji xəttinin uzunmüddətli yoxlanması qalır. ${source} Real yığılma fotosu: ilkin PPTX, image6.png.`);
await img(s,'image6.png',800,148,352,505);
rows(s,['ESP32 + INMP441\nI2S vasitəsilə səsin qəbulu','OLED 128×64\nYerli göstəricilər','ESP32-C3 + INA3221 + GPS\nEnerji və məkan məlumatı','UART\nKontrollerlər arasında əlaqə'],64,167,680,115,28);
// 6
s=slide('Səsin emalı və statistikası',`Vaxt: 50 saniyə. Mikrofonun xam siqnalını birbaşa dB kimi təqdim etmirik. Sistem A-vəznləmə tətbiq edir, qəbul edilmiş kalibrasiya ofsetindən istifadə edir və etibarlı nümunələr üzrə səs enerjisini toplayır. On dəqiqəlik Leq həmin müddətin ekvivalent səviyyəsidir. DAY, EVE və NGT hesablamalarında etibarlı ölçmə müddəti çəkidir. dB qiymətlərinin sadə ədədi ortası səs enerjisini düzgün ifadə etmir. Mikrofonun LOW və CLIP diaqnostikası ayrıca nəzarətdə qalır. ${source} Mikrofon konstruksiyasının fotosu ilkin PPTX-dəndir.`);
await img(s,'image8.png',846,161,330,420);
rows(s,['1. INMP441: davamlı rəqəmsal siqnal','2. A-vəznləmə və kalibrasiya ofseti','3. Etibarlı nümunələrdən 10 dəqiqəlik Leq','4. DAY / EVE / NGT üçün enerji üzrə orta'],64,174,730,98,29);
text(s,'Çəki: etibarlı ölçmə müddəti. dB-lərin sadə ədədi ortası istifadə edilmir.',64,595,1120,54,24,C.muted);
// 7
s=slide('Kalibrasiya və ölçmə sərhədləri',`Vaxt: 55 saniyə. Kalibrasiya ayrıca istinad ölçməsi ilə yoxlanıb. Əlli foto cütündən qırx beş sabit cüt üçün orta mütləq xəta 1,13 dB, sistematik fərq isə mənfi 0,06 dB olub. Ölçmələrin 84,4 faizi istinaddan iki dB daxilindədir. Bu nəticə yalnız 53,2–65,9 dB(A) yoxlanmış diapazonuna aiddir. Bu göstəriciləri sertifikatlaşdırılmış ölçmə dəqiqliyi kimi təqdim etmirik. Daha aşağı və yüksək səviyyələr əlavə yoxlama tələb edir. Modelin ofseti 114,2 dB-dir və qəbul edilmiş mikrofon konstruksiyası dəyişdirilmir. Mənbə: BSPRJ memory.md, 2026-09-13 qeydi; progress.md, Real dB calibration bölməsi.`);
text(s,'1,13 dB',64,178,500,125,83,C.teal,true);
text(s,'Orta mütləq xəta (MAE)',64,316,600,52,30);
rows(s,['45 sabit istinad cütü','84,4% ölçmə ±2 dB daxilində','Yoxlanmış diapazon: 53,2–65,9 dB(A)'],690,190,526,104,29);
text(s,'Nəticələr kalibrasiya edilmiş qiymətləndirmədir. Diapazondan kənar dəqiqlik ayrıca yoxlanmalıdır.',64,546,1120,95,28,C.muted);
// 8
s=slide('Eksperiment və məlumat keyfiyyəti',`Vaxt: 45 saniyə. Pilot nöqtə ilkin təqdimatda Bakı, Mir Cəlal küçəsi, Zərifə Əliyeva parkının yaxınlığı kimi göstərilib. Lokal on dəqiqəlik jurnal əsas ölçmə ardıcıllığını saxlayır. T11 paketində build 158 üzrə 312 pəncərənin hamısında dB məlumatı var, etibarlı audio 99–100 faizdir, klip yoxdur və lokal nəticələr Google Sheets ilə eynidir. Enerji kəsintiləri və natamam dövrlər isə ayrıca işarələnir. Üç yüz on iki pəncərəni bütöv fasiləsiz avtonom sınaq kimi təqdim etmirik. Mənbə: ilkin PPTX, slayd 11; BSPRJ memory.md, 2026-09-26 T11 qeydi.`);
text(s,'Pilot nöqtə: Bakı, Mir Cəlal küçəsi, Zərifə Əliyeva parkının yaxınlığı',64,162,1120,79,29);
text(s,'312 / 312',64,274,560,110,76,C.teal,true);
text(s,'T11-də dB(A) olan ölçmə pəncərələri',64,389,620,66,28);
rows(s,['Etibarlı audio: 99–100%','Mikrofon klipləri: 0','Yerli CSV və Sheets nəticələri eynidir'],725,274,491,92,27);
text(s,'Enerji kəsintiləri, boşluqlar və natamam dövrlər nəticədə ayrıca göstərilir.',64,582,1120,60,27,C.muted);
// 9
s=slide('Bir günlük müqayisə: 6 oktyabr 2026',`Vaxt: 55 saniyə. Bu qrafik ilkin təqdimata daxil edilmiş Summary ekranından köçürülmüş üç dövrü göstərir. Altı oktyabrda gündüz 61,5, axşam 59,2, gecə 53,6 dB(A) olub. Əhatə uyğun olaraq 99,8, 99,7 və 99,7 faizdir. Gündüz və axşam üçün tipik sinif NORMAL, gecə üçün SILENT-dir. Bu nöqtədə həmin gün gündüzlə gecə arasında 7,9 dB fərq görünür. Bu bir günlük müşahidədir, bütün Bakı üçün nəticə deyil. Mənbə: ilkin PPTX, image22.jpg; summary_conclusions ekranı, 06-10-2026 sətirləri. Qrafik göstərilən yuvarlaq rəqəmlərdən yaradılıb. Lokal xam məlumatla müstəqil yenidən hesablama aparılmayıb.`);
const ch=s.charts.add('bar',{position:{left:64,top:190,width:795,height:392},categories:['DAY','EVE','NGT'],series:[{name:'Leq, dB(A)',values:[61.5,59.2,53.6],fill:C.teal}],barOptions:{direction:'column',grouping:'clustered',gapWidth:110},hasLegend:false,xAxis:{textStyle:{fontSize:23,fill:C.ink},line:{fill:'#A5B6BF',width:1}},yAxis:{min:0,max:70,majorUnit:10,numberFormatCode:'0',title:{text:'dB(A)',textStyle:{fontSize:21}},textStyle:{fontSize:19,fill:C.muted},majorGridlines:{fill:'#DCE3E3',width:1}},dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'0.0',textStyle:{fontSize:25,bold:true,fill:C.ink}},chartFill:C.paper,plotAreaFill:C.paper});applyPresentationChartFont(ch,{fontFamily:'Arial'});
rows(s,['DAY\nNORMAL · 99,8% əhatə','EVE\nNORMAL · 99,7% əhatə','NGT\nSILENT · 99,7% əhatə'],906,190,310,126,25);
text(s,'Gündüz–gecə fərqi: 7,9 dB. Nəticə yalnız bu nöqtəyə və bu günə aiddir.',64,602,1152,52,25,C.muted);
// 10
s=slide('Google Sheets-də nəticələrin təqdimatı',`Vaxt: 40 saniyə. Bu, ilkin təqdimatda olan real Summary ekranının yuxarı hissəsidir. İstifadəçi orta dB(A), tipik səviyyə, həmin səviyyənin payı və məlumatın tamlığını görür. OK, PARTIAL və NO DATA fərqli vəziyyətlərdir. PARTIAL olduqda dövrün tam ölçüldüyünü iddia etmək olmaz. Sheets-də Summary, Measurements və Charts əsas istifadəçi görünüşləridir. Telegram nəticələrə və cihazın vəziyyətinə çıxış verir. MQTT, Datacake və AppSheet üzrə tam qəbul yoxlamaları ayrıca açıq qalır. Mənbə: ilkin PPTX, image22.jpg; GOOGLE_SHEETS_MANUAL.md; BSPRJ memory.md, tasks 110 və 112.`);
await img(s,'summary-crop.png',64,179,1152,343,'contain');
text(s,'Orta dB(A)     Tipik səviyyə     Səviyyənin payı     Məlumat əhatəsi',64,551,1152,48,28,C.teal,true);
text(s,'OK / PARTIAL / NO DATA ölçmənin tamlığını göstərir',64,614,1152,42,25,C.muted);
// 11
s=slide('Məkan məlumatı və xəritələmə',`Vaxt: 40 saniyə. Hazırda sistem saxlanmış GPS koordinatını istifadə edir. GPS daim aktiv izləyici kimi işləmir. Göstərilən xəritə ilkin təqdimatdakı pilot məkan təsviridir, ölçülmüş şəhər səs xəritəsi deyil. Bir nöqtənin nəticəsi vaxt üzrə müqayisə üçün faydalıdır. Şəhər xəritəsi yaratmaq üçün müxtəlif nöqtələrdə eyni qayda ilə kalibrasiya edilmiş stansiyalar, uyğun zaman aralıqları və yetərli məlumat əhatəsi tələb olunur. Mənbə: ilkin PPTX, image24.jpg; BSPRJ GPS arxitekturası üzrə qəbul edilmiş layihə qeydləri.`);
await img(s,'image24.jpg',670,165,546,409,'contain');
rows(s,['Hazırda: saxlanmış GPS koordinatı','Növbəti mərhələ: bir neçə ölçmə nöqtəsi','Xəritə üçün eyni ölçmə qaydası və müqayisə olunan zaman aralıqları'],64,186,545,125,29);
text(s,'Pilot məkanın xəritə təsviri. Şəhər üzrə ölçülmüş səs xəritəsi hələ hazırlanmayıb.',64,598,1120,55,25,C.muted);
// 12
s=slide('Tamamlama planı',`Vaxt: 45 saniyə. Hazırkı nəticə ölçmə zəncirinin işlədiyini göstərir, lakin yekun sistem qəbulunu əvəz etmir. Əvvəl xarici interfeyslərdə dB(A) semantikasını və avtomatik AP bərpasını tamamlayırıq. Sonra ortaq enerji xəttində dolu batareya ilə dəyişikliksiz 12–24 saatlıq gecə sınağı keçiririk. Köhnə sahələr yalnız asılılıqlar və ehtiyat nüsxə yoxlandıqdan sonra təmizlənir. Sonda yeddi günlük səs sınağı və inteqrasiya olunmuş avtonom sistem yoxlanır. Hazırlıq 60 faizdir və ekspert qiymətləndirməsidir. Lokal build 161-in cihazda quraşdırıldığını iddia etmirik. Mənbə: PROJECT_TASKS.md 94, 108, 112, 113; progress.md; istifadəçinin cari təsdiqləri.`);
rows(s,['1. Xarici dB(A) çıxışları və avtomatik AP bərpası','2. Ortaq enerji xəttində 12–24 saatlıq gecə sınağı','3. Yoxlanmış asılılıqlar və ehtiyat nüsxədən sonra təmizləmə','4. Yeddi günlük səs sınağı və yekun avtonom sistem yoxlaması'],64,172,1150,98,29);
text(s,'Layihənin ümumi hazırlığı: 60% — ekspert qiymətləndirməsi',64,601,1152,49,28,C.teal,true);
// 13
s=slide('Nəticə',`Vaxt: 30 saniyə. Real prototip kalibrasiya edilmiş dB(A) qiymətləndirməsini zaman üzrə nəticələrə çevirir. Göstərilən pilot gündə gündüz və axşam səviyyələri gecədən yüksəkdir. Məlumatın keyfiyyəti nəticənin ayrılmaz hissəsidir. Növbəti iş enerji davamlılığının və yekun sistemin təsdiqidir. Bundan sonra çoxsaylı ölçmə nöqtələri və xəritələmə istiqamətinə keçmək mümkündür. Diqqətiniz üçün təşəkkür edirik. Suallarınızı cavablandırmağa hazırıq. ${source} Şəhər fotosu ilkin təqdimatdan götürülüb.`,true);
await img(s,'image19.jpg',740,179,476,335,'cover');
text(s,'İşləyən prototip\nKalibrasiya edilmiş dB(A)\nDAY / EVE / NGT nəticələri',64,190,630,247,39,C.white,true);
text(s,'Növbəti əsas yoxlama: enerji davamlılığı',64,494,646,76,28,'#C8E3E6');
text(s,'Diqqətiniz üçün təşəkkür edirik',64,616,1050,48,33,C.white);

await fs.mkdir(root+'/output',{recursive:true});
await (await PresentationFile.exportPptx(p)).save(build+'/draft.pptx');
for(let i=0;i<p.slides.items.length;i++){const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1});await fs.writeFile(build+`/slide-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Rendered 13 slides');
const result=await finalizePresentation({workspaceDir:root,candidatePath:build+'/draft.pptx',finalPath:root+'/output/BSPRJ_Akustik_Monitorinq_AZ.pptx',pythonExecutable:runtime+'/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:13,requiredNativeChartOwnerSlides:[9],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:build+'/validation.json'});console.log(JSON.stringify(result));
