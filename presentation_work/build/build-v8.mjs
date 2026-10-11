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
function tx(s,t,x,y,w,h,size=30,color=C.ink,bold=false,alignment='left'){if(darkSlides.has(s)){if(color===C.ink)color=C.white;else if(color===C.muted)color='#E0EBF0';else if(color===C.teal)color=C.aqua;else if(color===C.coral)color='#FFA68B';}else{if([C.white,'#C7F1ED','#CEF4EE','#BCDAE2','#BADEE2'].includes(color))color=C.ink;else if(color===C.gold)color='#795000';else if(color===C.aqua)color='#005C66';else if(color===C.coral)color='#AC3A29';else if(color===C.teal)color='#00616B';}const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=t;a.text.style={typeface:'Arial',fontSize:size,color,bold,alignment};return a;}
const backgrounds={
 mic:await fs.readFile(b+'/bg-mic-v8.png'),
 controllers:await fs.readFile(b+'/bg-controllers-v8.png'),
 wiring:await fs.readFile(b+'/bg-wiring-v8.png'),
 power:await fs.readFile(b+'/bg-power-v8.png'),
 testing:await fs.readFile(b+'/bg-testing-v8.png'),
 city:await fs.readFile(b+'/baku-boulevard-real.jpg'),
 solar:await fs.readFile(b+'/bg-solar-v7.png'),
 online:await fs.readFile(b+'/bg-online-v7.png'),
 map:await fs.readFile(b+'/image24.jpg')
};
function flat(s,fill,x,y,w,h){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill:typeof fill==='object'&&fill.opacity!==undefined?fill.color+'/'+Math.round(fill.opacity*100):fill,line:{fill:'none',width:0}});}
function sl(title,notes,bg=C.cream){
 const v=p.slides.add(),n=p.slides.items.length,photo=n===1||n===14;
 v.background.fill=C.navy;darkSlides.add(v);
 if(!photo){
  const kind=n===3?'mic':n===4?'controllers':n===5?'wiring':n===6?'power':n===7?'testing':[2,8,9,15].includes(n)?'city':[10,11,12].includes(n)?'online':'map';
  const tone={controllers:'#092F26',wiring:'#21132D',power:'#182C32',testing:'#301C25'}[kind]??'#072536';
  v.images.add({blob:backgrounds[kind],contentType:['city','map'].includes(kind)?'image/jpeg':'image/png',position:{left:0,top:0,width:1280,height:720},fit:'cover',alt:'Thematic full-slide background '+kind});
  flat(v,kind==='map'?'#072536/28':tone+'/22',0,0,1280,720);
  flat(v,{type:'gradient',gradientKind:'linear',angleDeg:90,stops:[{offset:0,color:tone+'/95'},{offset:30000,color:tone+'/30'},{offset:78000,color:tone+'/25'},{offset:100000,color:tone+'/92'}]},0,0,1280,720);
  if(kind!=='map')flat(v,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:tone+'/60'},{offset:65000,color:tone+'/30'},{offset:100000,color:tone+'/10'}]},0,0,1280,720);
  else flat(v,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#072536/0'},{offset:55000,color:'#072536/0'},{offset:69000,color:'#072536/95'},{offset:100000,color:'#072536/98'}]},0,0,1280,720);
  notes+=' Texniki mikrofon, kontroller, rabitə, enerji və yoxlama fonları ayrıca imagegen dekorativ konseptləridir; modellərin və bağlantıların sübutu deyil. Tematik arxa fon təqdimatın dekorativ kontekstidir. Günəş və onlayn səhnələr imagegen konseptidir; yerləşdirmə və yayımlanmış sayt sübutu deyil. Bakı və pilot xəritə şəkilləri mövcud orijinal mənbələrdir.';
 }
 if(title)tx(v,title,64,45,[4,6].includes(n)?620:1152,102,[4,6].includes(n)?41:43,C.white,true,'center');
 if(!photo)tx(v,String(n).padStart(2,'0')+' / 15',[4,6].includes(n)?580:1108,679,108,23,17,C.white);
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
// 2: purpose before technical details
s=sl('Daha sakit yeri ölçərək seçmək',`Vaxt: 45 saniyə. Layihənin məqsədi konkret yerdə günün müxtəlif vaxtlarında səs-küyün necə dəyişdiyini anlamaqdır. Ev alarkən və ya kirayə seçərkən bir dəfə baxış gecə səs mənzərəsini göstərmir. Davamlı müşahidə gündüz, axşam və gecə səviyyələrini ayrıca göstərir. Hazırda prototip bir nöqtədə ölçmə aparır. Bir neçə ev və rayon arasında düzgün müqayisə gələcək mərhələdir: eyni kalibrasiya, eyni vaxt aralıqları və kifayət qədər əhatə tələb olunur. Mənbə: layihənin əsas məqsədi və istifadəçinin təsdiqlədiyi ev seçimi ssenarisi. Bakı foto mənbəyi: https://minval.az/news/123918269`);
await im(s,'baku-avenue-real.jpg',663,194,553,371);
tx(s,'Ev seçimi üçün məlumat',64,171,570,64,38,C.teal,true);
list(s,['Bir baxış bütün günü göstərmir.','Gündüz, axşam və gecəni ayrıca izləyirik.','Yolun təsirini və sakit vaxtları görürük.'],64,268,557,104,30);
tx(s,'İndi: bir müşahidə nöqtəsi.\nGələcək: müqayisə olunan bir neçə məkan.',64,596,1140,77,26,C.muted);
// 4 goal + analytics chain
s=sl('Ölçmədən etibarlı nəticəyə',`Vaxt: 40 saniyə. Mikrofonun xam siqnalına A-vəznləmə və qəbul edilmiş kalibrasiya ofseti tətbiq olunur. Sistem etibarlı nümunələr üzrə enerjini toplayır və on dəqiqəlik Leq hesablayır. DAY, EVE və NGT üçün nəticələr etibarlı ölçmə müddəti ilə çəkilən enerji ortasıdır. dB qiymətlərinin sadə ədədi ortası istifadə olunmur. Orta səviyyə ilə yanaşı, ən çox müşahidə olunan sinif və məlumat əhatəsi göstərilir. Mənbə: BSPRJ DB_CALIBRATION.md, DATA_DICTIONARY_RU.md və Google Sheets hesablamaları.`);
const stage=[['dB(A)','Kalibrasiya edilmiş\nsəs qiymətləndirməsi'],['10 dəqiqə','Etibarlı audio üzrə\nenerji ortası (Leq)'],['DAY / EVE / NGT','Günün hissələri üzrə\nnəticə və əhatə']];
stage.forEach((a,i)=>{const x=64+i*389;tx(s,a[0],x,196,365,66,i===2?35:48,i===1?C.coral:C.teal,true);tx(s,a[1],x,304,355,132,30);});
tx(s,'İki əsas nəticə',64,478,1110,52,33,C.ink,true);
tx(s,'Orta səviyyə nədir?     Hansı sinif daha çox müşahidə olunur?',64,552,1135,79,32,C.teal);
// 5 current actual hardware
s=sl('İki kontroller, bir sistem',oldNotes(5)+' Əsas modulun modeli layihənin UART sxemində ESP32-WROOM-32U kimi göstərilir. C3 modeli HARDWARE.md ilə təsdiqlənir.');
await im(s,'prototype-clean.png',720,14,530,692);s.speakerNotes.text+=' Fotoşəkil imagegen ilə vizual təmizlənib; orijinal görüntü saxlanılıb. Retuş elektrik bağlantılarının təsdiqi deyil.';
tx(s,'ESP32-WROOM-32U',64,178,620,59,35,C.teal,true);
tx(s,'INMP441 · I2S\nOLED 128×64 · Wi-Fi',64,253,620,104,31);
tx(s,'ESP32-C3 SuperMini',64,387,620,59,35,C.coral,true);
tx(s,'INA3221: Solar / Battery / Load\nu-blox NEO-M8 / HW-542\nSaxlanmış GPS FIX',64,467,620,152,29);
// Two original diagrams share one overview slide as requested.
s=sl('Rabitə və enerji sxemləri',`Vaxt: 40 saniyə. Solda kontrollerlər arasındakı UART sxemi, sağda enerji sxemi göstərilir. UART 3,3 V, ortaq GND və ayrıca wake xətti BS GPIO23 → C3 GPIO5 var. Enerji sxemində Solar, Battery və Load INA3221 kanalları ilə ayrı izlənir. Şarj tənzimlənməsi və yekun avtonom qəbul hələ ayrıca yoxlanmalıdır. Mənbə: electrical circuits/CONTROLLER_UART_TECHNICAL_V2.png; INA3221_ACTUAL_WIRING_RESTORED.svg; D:/DEV/INA3221-C3/INA3221_ACTUAL_WIRING.net və HARDWARE.md. Original sxemlər dəyişdirilməyib.`);
tx(s,'UART / WAKE',24,153,604,47,32,C.teal,true,'center');
tx(s,'SOLAR / BATTERY / LOAD',652,153,604,47,30,C.teal,true,'center');
await im(s,'uart-detail.png',24,197,604,423);
await im(s,'solar-az.png',652,197,604,423);
tx(s,'3,3 V · TX / RX · ümumi GND',24,617,604,35,22,C.ink,false,'center');
tx(s,'Panel, batareya və yük ayrıca ölçülür',652,617,604,35,22,C.ink,false,'center');
tx(s,'Wake: BS GPIO23 → C3 GPIO5. Şarj və avtonom iş ayrıca yoxlanır.',64,650,1152,32,21,C.muted);
// Clearly separate actual prototype from illustrative soldered-board assembly.
s=sl('Kompakt günəş qurğusu',`Vaxt: 25 saniyə. Bu görüntü real hazır lövhənin fotosu deyil. İlkin prototipə əsaslanan gələcək səliqəli PCB yığılmasının imagegen konseptidir. Qısa bağlantılar, lehimlənmiş modullar və servis üçün əlçatan quruluş göstərilir. Faktiki PCB layihəsi, elektrik audit və fiziki sınaq ayrıca mərhələdir. Mənbə: ilkin prototip fotosu, istifadəçinin təsdiqlədiyi gələcək yığılma ideyası.`);
await im(s,'pcb-pv.png',720,14,530,692);
s.speakerNotes.text+=' PV klemmləri günəş panelinin enerji yoluna qoşulması üçün konseptdir. Şarj dövrəsinin yoxlanması ayrıca tələb olunur. Düzəliş: əsas WROOM və daha kiçik C3 fərqləndirilib. Şəkil modul formasının dəqiq texniki çertyoju deyil. Elektrik bağlantıları sxem üzrə yoxlanır.';
tx(s,'Daha səliqəli montaj',64,176,620,61,36,C.teal,true);
list(s,['WROOM-32U + C3 SuperMini','Günəş paneli üçün PV+ / PV− klemmləri','Servis üçün əlçatan modullar'],64,285,620,101,29);
tx(s,'Gələcək konsept\nHələ istehsal edilməyib',64,592,620,70,25,C.ink,true);

// 7: reference instruments and calibration in one evidence slide
s=sl('Ölçmələr necə yoxlanılıb?',`Vaxt: 50 saniyə. FNIRSI FDM01 ilə A-vəznləmə və SLOW rejimində foto cütləri müqayisə olunub. 45 sabit istinad cütündə orta mütləq xəta 1,13 dB-dir; 84,4 faiz ölçmə ±2 dB daxilindədir. Yoxlanmış diapazon 53,2–65,9 dB(A). Bu praktiki kalibrasiyadır, sertifikatlaşdırılmış ölçmə dəqiqliyi iddiası deyil. FNB58 yük xəttində USB enerji müşahidəsi üçün istifadə olunur; tam INA3221 müqayisəsi ayrıca mərhələdir. Fotolar istehsalçının cihaz modelinin şəkilləridir, bizim sınağın fotosu deyil. Mənbə: DB_CALIBRATION.md; https://www.fnirsi.com/products/fdm01 ; https://www.fnirsi.com/products/fnb58`);
await im(s,'fdm01-real.jpg',64,174,295,350);
await im(s,'fnb58-real.jpg',390,174,295,350);
tx(s,'FNIRSI FDM01',64,540,295,41,27,C.teal,true,'center');
tx(s,'FNB58',390,540,295,41,27,C.gold,true,'center');
tx(s,'Səs istinadı',64,590,295,42,24,C.ink,false,'center');
tx(s,'USB enerji testeri',390,590,295,42,24,C.ink,false,'center');
tx(s,'1,13 dB',722,178,494,111,72,C.teal,true,'center');
tx(s,'Orta mütləq xəta (MAE)',722,304,494,54,30,C.ink,false,'center');
tx(s,'45 istinad cütü\n84,4% ölçmə ±2 dB daxilində',722,389,494,101,30,C.ink,false,'center');
tx(s,'53,2–65,9 dB(A)',722,518,494,50,32,C.gold,true,'center');
tx(s,'Praktik kalibrasiya. Sertifikatlaşdırılmış dəqiqlik iddiası yoxdur.',64,646,1050,42,22,C.muted);
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
// 10: consistent route from measurement to observation
s=sl('Cihazdan istifadəçiyə məlumat yolu',`Vaxt: 35 saniyə. Birinci mərhələ cihazın ölçməsi və vaxt aralığı üzrə nəticənin hazırlanmasıdır. İkinci mərhələdə məlumat şəbəkə ilə ötürülür və tarixçə saxlanır. Üçüncü mərhələdə istifadəçi nəticəni veb-paneldə və Telegram vasitəsilə görür. Bu slayd məlumatın məntiqi axınını göstərir, bütün xarici kanalların qəbul sınağının tamamlandığını bildirmir. Sheets dB(A) və əhatə üzrə əsas analitik nəticəni verir. MQTT, Datacake və AppSheet uyğunluğu task 112 üzrə ayrıca yoxlanır. Mənbə: layihə arxitekturası, DATA_DICTIONARY_RU.md, PROJECT_TASKS.md.`);
const channels=[['ÖLÇMƏ','INMP441 və ESP32\ndB(A), vaxt və cihaz statusu'],['TARİXÇƏ','Şəbəkə ilə ötürmə\nSheets-də nəticələr və əhatə'],['MÜŞAHİDƏ','Veb-panel və Telegram\nTelefon və kompüterdən baxış']];
channels.forEach((a,i)=>{const x=64+i*389;tx(s,a[0],x,183,365,58,36,C.teal,true,'center');tx(s,a[1],x,282,365,137,29,C.ink,false,'center');});
tx(s,'Bir cihaz, bir məlumat tarixçəsi, bir neçə baxış yolu',64,480,1152,81,37,C.ink,true,'center');
tx(s,'Əsas səs nəticəsi: DAY / EVE / NGT üzrə dB(A) və məlumatın əhatəsi',64,619,1152,51,25,C.muted,false,'center');
// 11: actual commands and clearly labeled editable Android UI proposal
s=sl('Telegram və mobil baxış',`Vaxt: 45 saniyə. Telegram artıq status və gündəlik icmal üçün istifadə olunur. /bssts BS statusunu, /c3sts enerji kontrollerinin vəziyyətini soruşur. Soldakı mesaj maketi 6 oktyabrın təsdiqlənmiş Summary rəqəmlərini göstərir; bu, real bot ekranının fotosu deyil. Sağda gələcək Android tətbiqi üçün rastr dizayn konsepti var. Hazır ayrıca Android tətbiqi iddia olunmur. Mənbə: src/telegram_alert_service.cpp; google_sheets/Code.gs; 06.10 Summary ekranı. Telegram logo: https://telegram.org/tour/screenshots . Android is a trademark of Google LLC. The Android robot is reproduced from work created and shared by Google and used according to terms described in the Creative Commons 3.0 Attribution License. Source: https://developer.android.com/distribute/marketing-tools/brand-guidelines`);
await im(s,'telegram-icon.png',64,153,67,67);
tx(s,'Telegram',152,166,476,56,36,C.teal,true);
tx(s,'/bssts     /c3sts',64,252,604,53,35,C.ink,true);
flat(s,'#072536/80',64,325,594,265);
tx(s,'Gündəlik icmal nümunəsi',86,343,550,45,28,C.teal,true);
tx(s,'06.10.2026\nDAY   61,5 dB(A)\nEVE   59,2 dB(A)\nNGT   53,6 dB(A)',86,409,550,161,28,C.ink);
tx(s,'Mesaj maketi',64,603,594,38,22,C.muted,false,'center');
await im(s,'android-original.png',716,153,70,43);
tx(s,'Android™ üçün tətbiq',803,157,413,48,29,C.teal,true,'center');
await im(s,'app-ui-v7.png',752,200,464,454);
tx(s,'Gələcək tətbiqin dizayn konsepti',715,655,501,32,21,C.white,false,'center');
s.speakerNotes.text+=' Yeni tətbiq maketi imagegen ilə hazırlanmış rastr konseptidir: İcmal, Tarixçə və Xəritə bölmələri, dövr kartları, dövr qrafiki və simvolik xəritə var. Telefon ekranındakı xəritə real GPS nöqtəsinin təsdiqi deyil. Rəqəmlər 06.10.2026 pilot nəticələridir, cari canlı göstəricilər deyil. Tətbiqin görünüşü konseptdir; proqram işləkliyi hələ hazırlanmayıb.';
// 12: future own website plus existing-panel selected values
s=sl('Layihənin veb-saytı: vahid müşahidə yeri',`Vaxt: 50 saniyə. Layihənin öz veb-saytı olacaq. Telefon və kompüterdən cihazın göstəricilərini izləmək, səs-küy tarixçəsinə və qrafiklərə baxmaq, gündüz, axşam və gecə nəticələrini müqayisə etmək və quraşdırılma yerini xəritədə görmək mümkün olacaq. Hazırda BS Sound Zone Live veb-panel nümunəsi var; bu, ayrıca hazır layihə saytının dərc edilməsi deyil. Soldakı cədvəl istifadəçinin üç yeni ekranından seçilmiş göstəricilərlə yenidən qurulub: Now 10, Hour 20%, Mean 16%, 20,4 dərəcə, 86,3 faiz, evening/NORMAL. Bunlar nisbi göstəricilərdir, dB(A) deyil. Ekranlarda müxtəlif köhnə yenilənmə vaxtları var, canlı qəbul sübutu deyil. İstifadəçi saytın gələcək inkişaf kimi göstərilməsini təsdiqləyib. Mənbə: istifadəçinin BS Sound Zone Live skrinşotları, 11.10.2026; DATA_DICTIONARY_RU.md.`);
tx(s,'Mövcud paneldən nümunə',64,157,581,46,30,C.teal,true,'center');
nativeTable(s,[['BS Sound Zone Live','Ekran nümunəsi'],['Dövr / vəziyyət','evening / NORMAL'],['Temperatur / rütubət','20,4 °C / 86,3%'],['Now / Hour / Mean','10 / 20% / 16%']],64,224,581,252,[312,269],25,'#306C78');
tx(s,'Gələcək saytın imkanları',701,157,515,46,30,C.teal,true,'center');
list(s,['Cari göstəricilər və cihaz statusu','Səs tarixçəsi və dövrlərin müqayisəsi','Məkan xəritəsi və cihaz məlumatı'],701,239,510,88,28);
tx(s,'Telefon və kompüterdən',701,521,510,67,33,C.ink,true,'center');
tx(s,'Nümunədəki faizlər dB(A) deyil. Saytda kalibrasiya edilmiş nəticələr ayrıca göstəriləcək.',64,595,1152,82,26,C.muted);
// 13: location linked to useful comparable monitoring
s=sl('GPS: nəticənin hansı yerə aid olduğunu bilmək',`Vaxt: 40 saniyə. GPS bir dəfə əl ilə alınan FIX vasitəsilə quraşdırma nöqtəsini müəyyən edir; gündəlik işdə saxlanmış statik koordinat istifadə olunur. Sistem hərəkət edən izləmə cihazı deyil. Xəritə layihənin mövcud pilot məkanını göstərir, səs xəritəsi deyil. Bu əlaqə səs nəticəsinin harada, nə vaxt və hansı əhatə ilə ölçüldüyünü göstərir. Bir neçə məkan üçün müqayisə gələcək mərhələdir: eyni kalibrasiya, eyni günün hissələri və eyni məlumat keyfiyyəti tələb olunur. Ev seçimi üçün rayonlar barədə nəticə hazırda bir nöqtədən çıxarılmır. Mənbə: image24.jpg orijinal xəritə; saved GPS FIX qaydası; layihə məqsədi.`);
// Original pilot map now fills the background; pin remains in its source position.
tx(s,'Harada?',827,182,389,53,37,C.teal,true);
tx(s,'Saxlanmış GPS nöqtəsi',827,255,389,77,29,C.ink);
tx(s,'Nə vaxt və nə qədər?',827,350,389,87,32,C.teal,true);
tx(s,'DAY / EVE / NGT\ndB(A) və məlumatın əhatəsi',827,454,389,111,29,C.ink);
tx(s,'Gələcək müqayisə: eyni qayda ilə ölçülmüş evlər və rayonlar',64,634,1152,43,25,C.muted,false,'center');
// 14: all uses in one coherent scene, labeled concept
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
// 15: useful evidence, benefit and a concrete acceptance gate
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

const times=[20,45,35,30,40,30,50,40,35,30,45,45,35,40,45];
p.slides.items.forEach((slide,i)=>{slide.speakerNotes.text=slide.speakerNotes.text.replace(/Vaxt: \d+ saniyə\./,`Vaxt: ${times[i]} saniyə.`);});
await (await PresentationFile.exportPptx(p)).save(b+'/technical-draft.pptx');
const r=await finalizePresentation({workspaceDir:root,candidatePath:b+'/technical-draft.pptx',finalPath:root+'/output/BSPRJ_Akustik_Monitorinq_AZ_15_Technical_Final.pptx',pythonExecutable:runtime+'/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','9','--require-native-table-slide','12'],explicitTotalSlideCount:15,requiredNativeChartOwnerSlides:[8],requiredNativeTableOwnerSlides:[9,12],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:b+'/technical-validation.json'});
const final=await PresentationFile.importPptx(await FileBlob.load(r.finalPath));
for(let i=0;i<15;i++){const blob=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(b+`/technical-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Finalized and rendered 15 slides; speaker timing '+times.reduce((a,b)=>a+b,0)+' seconds');
