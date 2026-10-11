import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const req=createRequire('C:/Users/INN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/runtime.cjs');
const {PresentationFile,FileBlob}=await import(pathToFileURL(req.resolve('@oai/artifact-tool')).href);
const base='D:/DEV/BSPRJ/presentation_work';
const p=await PresentationFile.importPptx(await FileBlob.load(base+'/output/BSPRJ_Akustik_Monitorinq_AZ_Color_Final.pptx'));
for(let i=0;i<p.slides.items.length;i++){const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1}); await fs.writeFile(base+`/build/final-${i+1}.png`,new Uint8Array(await blob.arrayBuffer()));}
console.log('Final PPTX: '+p.slides.items.length+' slides rendered');
