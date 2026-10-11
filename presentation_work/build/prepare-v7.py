from pathlib import Path
p=Path('presentation_work/build')
t=(p/'build-v6.mjs').read_text(encoding='utf-8-sig')
t=t.replace("if(!darkSlides.has(s)){", "if(darkSlides.has(s)){if(color===C.ink)color=C.white;else if(color===C.muted)color='#E0EBF0';else if(color===C.teal)color=C.aqua;else if(color===C.coral)color='#FFA68B';}else{")
start=t.index("const backWave=")
end=t.index("function fade(",start)
t=t[:start]+'''const backgrounds={
 tech:await fs.readFile(b+'/theme-tech.png'),
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
  const kind=[2,3,8,9,15].includes(n)?'city':[5,6].includes(n)?'solar':[10,11,12].includes(n)?'online':n===13?'map':'tech';
  v.images.add({blob:backgrounds[kind],contentType:['city','map'].includes(kind)?'image/jpeg':'image/png',position:{left:0,top:0,width:1280,height:720},fit:'cover',alt:'Thematic full-slide background '+kind});
  flat(v,kind==='map'?'#072536/28':'#072536/40',0,0,1280,720);
  flat(v,{type:'gradient',gradientKind:'linear',angleDeg:90,stops:[{offset:0,color:'#072536/95'},{offset:30000,color:'#072536/40'},{offset:78000,color:'#072536/35'},{offset:100000,color:'#072536/92'}]},0,0,1280,720);
  if(kind!=='map')flat(v,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#072536/75'},{offset:65000,color:'#072536/45'},{offset:100000,color:'#072536/10'}]},0,150,1280,515);
  else flat(v,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#072536/0'},{offset:55000,color:'#072536/0'},{offset:69000,color:'#072536/95'},{offset:100000,color:'#072536/98'}]},0,150,1280,470);
  notes+=' Tematik arxa fon təqdimatın dekorativ kontekstidir. Günəş və onlayn səhnələr imagegen konseptidir; yerləşdirmə və yayımlanmış sayt sübutu deyil. Bakı və pilot xəritə şəkilləri mövcud orijinal mənbələrdir.';
 }
 if(title)tx(v,title,64,45,1152,102,43,C.white,true,'center');
 if(!photo)tx(v,String(n).padStart(2,'0')+' / 15',1108,679,108,23,17,C.white);
 v.speakerNotes.text=notes;return v;
}
''' +t[end:]
t=t.replace("flat(s,'#FFFFFF',64,325,594,265);", "flat(s,'#072536/80',64,325,594,265);")
start=t.index("await im(s,'phone-blank.png'")
end=t.index('// 12:',start)
t=t[:start]+'''await im(s,'app-ui-v7.png',752,200,464,454);
tx(s,'Gələcək tətbiqin dizayn konsepti',715,655,501,32,21,C.white,false,'center');
s.speakerNotes.text+=' Yeni tətbiq maketi imagegen ilə hazırlanmış rastr konseptidir: İcmal, Tarixçə və Xəritə bölmələri, dövr kartları, dövr qrafiki və simvolik xəritə var. Telefon ekranındakı xəritə real GPS nöqtəsinin təsdiqi deyil. Rəqəmlər 06.10.2026 pilot nəticələridir, cari canlı göstəricilər deyil. Tətbiqin görünüşü konseptdir; proqram işləkliyi hələ hazırlanmayıb.';
''' +t[end:]
t=t.replace("await im(s,'image24.jpg',64,182,711,444);", "// Original pilot map now fills the background; pin remains in its source position.")
t=t.replace('compact-draft.pptx','thematic-draft.pptx').replace('BSPRJ_Akustik_Monitorinq_AZ_15_Final.pptx','BSPRJ_Akustik_Monitorinq_AZ_15_Thematic.pptx').replace('compact-final-validation.json','thematic-validation.json').replace('/compact-${i+1}.png','/thematic-${i+1}.png')
(p/'build-v7.mjs').write_text(t,encoding='utf-8')
