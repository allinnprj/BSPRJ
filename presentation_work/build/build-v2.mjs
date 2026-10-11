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
const C={navy:'#102B43',teal:'#008F95',aqua:'#63DED1',gold:'#FFC857',coral:'#EE785C',white:'#FFFFFF',cream:'#FFF8EA',ink:'#14334A',muted:'#4D6575'};
function tx(s,t,x,y,w,h,size=30,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=t;a.text.style={typeface:'Arial',fontSize:size,color,bold};return a;}
function sl(title,notes,bg=C.cream){const s=p.slides.add();s.background.fill=bg;const dark=[C.navy,C.teal].includes(bg);if(title)tx(s,title,64,45,1152,102,43,dark?C.white:C.ink,true);tx(s,String(p.slides.items.length).padStart(2,'0')+' / 18',1108,679,108,23,15,dark?'#BADEE2':C.muted);s.speakerNotes.text=notes;return s;}
async function im(s,n,x,y,w,h,fit='contain'){const bytes=await fs.readFile(b+'/'+n);return s.images.add({blob:bytes,contentType:n.endsWith('.png')?'image/png':'image/jpeg',position:{left:x,top:y,width:w,height:h},fit,alt:n});}
function list(s,items,x,y,w,gap=96,size=29,color=C.ink){items.forEach((a,i)=>tx(s,a,x,y+gap*i,w,gap-8,size,color));}
// 1: striking, minimal title and real city context
let s=sl('',oldNotes(1),C.navy);
await im(s,'image12.jpg',644,0,636,720,'cover');
tx(s,'BSPRJ',64,61,500,50,30,C.gold,true);
tx(s,'Şəhər mühitində\nsəs monitorinqi',64,163,570,177,57,C.white,true);
tx(s,'Akustik monitorinq və\nzaman üzrə təhlil',64,386,557,102,33,C.aqua);
tx(s,'Ali Nuri və Zülfüqar Həsənov',64,571,570,45,27,C.white);
await im(s,'image10.png',64,627,66,55);
// 2: concrete problem
s=sl('Bir ölçmə bütün günü təsvir etmir',oldNotes(2));
await im(s,'image1.jpg',615,160,601,444,'cover');
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
await im(s,'image6.png',840,153,348,505);
tx(s,'ESP32-WROOM-32U',64,181,738,59,39,C.teal,true);
tx(s,'INMP441 mikrofonu · I2S\nOLED 128×64 · Wi-Fi',64,259,718,101,31);
tx(s,'ESP32-C3 SuperMini',64,402,738,59,39,C.coral,true);
tx(s,'INA3221: Solar / Battery / Load\nu-blox NEO-M8 / HW-542: saxlanmış GPS FIX',64,480,738,116,29);
// 6 our UART drawing retained as source evidence
s=sl('Bizim sxem: kontrollerlər arasında UART',`Vaxt: 35 saniyə. Bu sxem bizim elektrik sxemləri qovluğundan götürülüb. ESP32-WROOM-32U və ESP32-C3 SuperMini arasında UART 3,3 V siqnalları və ümumi GND var. MAIN GPIO17 C3 GPIO20-yə, C3 GPIO21 isə MAIN GPIO16-ya qoşulur. Sxemdə hər siqnal xəttində 2,2 kΩ rezistor göstərilir. Hazırkı sistemdə ayrıca oyanma xətti də var: BS GPIO23 open-drain, C3 GPIO5 və 10 kΩ pull-up. Bu slayddakı tarixi sxem yalnız UART hissəsini göstərir. Mənbə: D:/ALLINNPRGDRV/PRJ/AI/electrical circuits/CONTROLLER_UART_TECHNICAL_V2.png; D:/DEV/INA3221-C3/HARDWARE.md. Sxem şərti elektrik təsviridir, yeni montaj göstərişi deyil.`);
await im(s,'uart-detail.png',64,174,834,480);
tx(s,'UART 3,3 V',946,205,270,57,34,C.teal,true);
list(s,['Səs və enerji\nməlumatı','TX / RX\nÜmumi GND','Ayrıca wake xətti:\nBS GPIO23 → C3 GPIO5'],946,287,270,115,25);
// 7 source solar topology localized
s=sl('Bizim sxem: günəş enerjisi və batareya',`Vaxt: 40 saniyə. İkinci sxem real enerji modullarının layihə netlistinə əsaslanır. Panelin enerjisi GPIO3 ilə idarə olunan açardan və INA3221-in Solar kanalından keçir. SS56 əks cərəyan yolunu məhdudlaşdıran hissədir. Battery və Load ayrıca kanallarda ölçülür. Batareya 12 V AGM kimi göstərilir, yük yolunda 12 V-dan 7 V-a DC-DC və MB102 modulu var. Elektrik sxeminin üzərində dəyişiklik aparılmayıb, yalnız təqdimat nüsxəsində bəzi rusca yazılar azərbaycancaya çevrilib. Mənbə: electrical circuits/INA3221_ACTUAL_WIRING_RESTORED.svg; D:/DEV/INA3221-C3/INA3221_ACTUAL_WIRING.net; HARDWARE.md. Quruluş ümumi avtonom sistemin yekun qəbulunu əvəz etmir.`);
await im(s,'solar-az.png',106,147,1070,470);
tx(s,'Panel, batareya və yük ayrıca izlənir. Şarj tənzimlənməsi ayrıca yoxlanmalıdır.',64,628,1152,43,23,C.teal,true);
// 8 exact test instruments, no invented photos
s=sl('Yoxlama üçün istifadə etdiyimiz cihazlar',`Vaxt: 40 saniyə. Səs qiymətləndirməsini FNIRSI FDM01 ilə müqayisə etmişik. Bunun üçün A-vəznləmə və SLOW rejimində foto cütləri istifadə olunub. FNB58 isə enerji yolunda gərginlik, cərəyan və gücün müşahidəsi üçün istifadə olunan USB testerdir. Müxtəlif qoşulma nöqtələri nəticəyə təsir edə bildiyinə görə FNB58-i INA3221-in tam kalibrasiyası kimi təqdim etmirik. Tam gecə-gündüz müqayisə jurnalı ayrıca optional yoxlamadır. Günəş nəzarətçisi INA3221 göstəricilərindən istifadə edir, əsas səs kontrolleri isə fasiləsiz I2S ölçməsini davam etdirir. Mənbə: BSPRJ DB_CALIBRATION.md; D:/DEV/INA3221-C3/HARDWARE.md, FNB58 Load Test Wiring; həmin layihənin memory.md, FNB58 müqayisəsinin açıq sərhədləri.`,C.navy);
tx(s,'FNIRSI FDM01',64,184,562,66,46,C.aqua,true);
tx(s,'Səs səviyyəsi ölçən',64,273,558,58,32,C.white);
list(s,['A-vəznləmə və SLOW rejimi','Foto cütləri ilə müqayisə','dB(A) ofsetinin yoxlanması'],64,365,560,75,27,C.white);
tx(s,'FNB58',736,184,480,66,46,C.gold,true);
tx(s,'USB enerji testeri',736,273,480,58,32,C.white);
list(s,['Gərginlik, cərəyan, güc','Yük xəttinin müşahidəsi','Tam müqayisə ayrıca mərhələdir'],736,365,480,75,27,C.white);
tx(s,'Əsas nəzarətçi: ESP32-WROOM-32U. Enerji nəzarətçisi: ESP32-C3 SuperMini.',64,625,1152,39,22,'#BCDAE2');
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
// 11 screenshot + field evidence
s=sl('Nəticə ilə birlikdə məlumatın keyfiyyəti',`Vaxt: 40 saniyə. Yuxarıda ilkin təqdimatdakı real Summary ekranıdır. Orta dB(A) ilə birlikdə tipik səviyyə, onun payı və məlumat əhatəsi görünür. PARTIAL tam müşahidə olunmamış dövrü ayırır. Aşağıdakı rəqəmlər ayrıca T11 sınağına aiddir: 312 pəncərənin hamısında dB(A), 99–100 faiz etibarlı audio və sıfır klip. T11 lokal CSV və Sheets qiymətlərinin uyğunluğunu təsdiqləyir. Bunu fasiləsiz avtonom iş sübutu kimi təqdim etmirik. Mənbə: ilkin PPTX, image22.jpg; BSPRJ memory.md, T11 qeydi.`);
await im(s,'summary-v2.png',64,157,1152,330);
tx(s,'312 / 312',64,520,552,90,57,C.teal,true);
tx(s,'T11-də dB(A) olan pəncərə',64,617,566,36,24);
tx(s,'99–100%',732,520,481,90,57,C.coral,true);
tx(s,'T11-də etibarlı audio · kliplər: 0',732,617,481,36,24);
// 12 spatial context
s=sl('Bir nöqtədən müşahidə şəbəkəsinə',oldNotes(11));
await im(s,'image24.jpg',679,164,537,411);
tx(s,'Hazırda',64,179,561,54,39,C.teal,true);
tx(s,'Saxlanmış GPS koordinatı\nZaman üzrə DAY / EVE / NGT',64,255,562,102,30);
tx(s,'Gələcəkdə',64,393,561,54,39,C.coral,true);
tx(s,'Bir neçə kalibrasiya edilmiş stansiya\nMüqayisə olunan ölçmələr və xəritə',64,469,562,123,30);
tx(s,'Xəritə pilot məkanı göstərir. Şəhər səs xəritəsi gələcək mərhələdir.',64,630,1152,41,24,C.muted);
// 13 full concept image, clearly disclosed
s=sl('',`Vaxt: 40 saniyə. Bu slayd real quraşdırmanın fotosu deyil, məktəb yanında gələcək yerləşdirmənin süni intellektlə hazırlanmış konseptidir. Kiçik günəş paneli, qorunan korpus və yol tərəfə yönəlmiş mikrofon göstərilir. Bu quruluş məktəb ətrafındakı səsin zaman üzrə müşahidəsini izah edir. Panelin ölçüsü və enerji balansı görüntüdə yalnız konseptualdır. Daimi montaj, hava şəraitindən qorunma və batareya dövrü ayrıca mühəndislik yoxlaması tələb edir. Mənbə: istifadəçinin təsdiqlədiyi yerləşdirmə ideyası; imagegen ilə yaradılmış illüstrasiya. Prompt: məktəb və yol yanında dirəkdə kompakt səs monitoru, üstündə kiçik günəş paneli, realistik qorunan korpus, kamera və mətn yoxdur.`,C.navy);
await im(s,'school-compact.png',558,133,722,470,'contain');
tx(s,'Məktəb yanında\nsəs monitorinqi',64,81,465,154,42,C.white,true);
tx(s,'Gələcək quraşdırma\nkonsepti',64,278,461,85,29,C.gold);
tx(s,'Kiçik günəş paneli\nQorunan korpus\nZaman üzrə ölçmələr',64,414,461,139,30,C.white);
tx(s,'Süni intellektlə hazırlanmış\nillüstrasiya',64,615,461,60,21,C.aqua);
// Additional deployment concepts; hypothetical locations, no claimed field trial.
async function concept(title,asset,points,notes){const v=sl('',notes,C.navy);await im(v,asset,558,133,722,470,'contain');tx(v,title,64,81,464,155,42,C.white,true);tx(v,'Gələcək tətbiq konsepti',64,278,464,84,29,C.gold);tx(v,points,64,408,464,170,29,C.white);tx(v,'Süni intellektlə hazırlanmış\nillüstrasiya',64,615,464,60,21,C.aqua);}
await concept('Vokzal ətrafında\nsəs monitorinqi','station-concept.png','Günün səsli vaxtları\nPik səviyyələrin izlənməsi\nTəkrar ölçmə üçün vaxt seçimi',`Vaxt: 25 saniyə. Vokzal yaxınlığında nəqliyyat və sərnişin hərəkəti gün ərzində dəyişir. Bu konsept həmin ərazidə səs səviyyəsinin zaman üzrə müşahidəsini göstərir. Məqsəd səsli aralıqları görmək və əlavə ölçmənin vaxtını seçməkdir. Sistem bu mərhələdə səs mənbəyini avtomatik tanımır. Vokzalda real quraşdırma və sınaq keçirilməyib. Mənbə: istifadəçinin təklif etdiyi tətbiq ssenarisi; imagegen ilə yaradılmış konsept.`);
await concept('Xəstəxana yanında\nsəs monitorinqi','hospital-concept.png','Yol tərəfinin müşahidəsi\nGündüz–gecə müqayisəsi\nDaha sakit aralıqların müəyyən edilməsi',`Vaxt: 25 saniyə. Xəstəxana ətrafında ölçmə aparmaq yol tərəfdəki səsin gündüz və gecə necə dəyişdiyini göstərmək üçün mümkün tətbiqdir. Nəticələr ərazinin səs mənzərəsini təsvir edir. Bu slayd tibbi nəticə və ya sağlamlığa təsir sınağı təqdim etmir. Xəstəxana yanında real ölçmə hələ aparılmayıb. Mənbə: istifadəçinin təklif etdiyi tətbiq ssenarisi; imagegen ilə yaradılmış konsept.`);
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

const times=[25,30,35,35,35,30,35,35,40,40,35,30,35,25,25,25,30,20];
p.slides.items.forEach((slide,i)=>{slide.speakerNotes.text=slide.speakerNotes.text.replace(/Vaxt: \d+ saniyə\./,`Vaxt: ${times[i]} saniyə.`)});
await (await PresentationFile.exportPptx(p)).save(b+'/v2-draft.pptx');
for(let i=0;i<18;i++){const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1});await fs.writeFile(b+`/v3-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Rendered 18 slides');
const r=await finalizePresentation({workspaceDir:root,candidatePath:b+'/v2-draft.pptx',finalPath:root+'/output/BSPRJ_Akustik_Monitorinq_AZ_Color_Final.pptx',pythonExecutable:runtime+'/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:18,requiredNativeChartOwnerSlides:[10],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:b+'/v4-validation.json'});
console.log(JSON.stringify({path:r.finalPath,slideCount:r.packageIntegrity.slide_count,layout:r.presentationLayout.findingCount,chart:r.nativeChartValidation.passed}));
