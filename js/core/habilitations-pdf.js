(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.RailOpsHabilitationsPdf=api;
})(typeof window!=='undefined'?window:null,function(root){
'use strict';

const PDFJS_VERSION='6.3.289';
const TESSERACT_VERSION='7.0.0';
const PDFJS_URL=`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`;
const PDFJS_WORKER_URL=`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;
const TESSERACT_URL=`https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/tesseract.min.js`;
const OCR_RENDER_SCALE=3.5;
const ROW_Y_TOLERANCE=2.2;
let pdfJsPromise=null;
let tesseractPromise=null;

function hasHabilitationCode(text){
  const value=String(text||'');
  return /\b(?:TES\s*M|H\s*\d\s*B\s*\d|CH\s*\d\s*[\/\s-]*CB\s*\d|APS\s*\d{1,2}|S\s*\d{1,2})\b/i.test(value);
}

async function loadPdfJs(){
  if(pdfJsPromise)return pdfJsPromise;
  pdfJsPromise=(async()=>{
    if(!root)throw new Error('PDF.js nécessite un navigateur');
    const mod=await import(PDFJS_URL);
    if(mod?.GlobalWorkerOptions)mod.GlobalWorkerOptions.workerSrc=PDFJS_WORKER_URL;
    return mod;
  })();
  return pdfJsPromise;
}

function loadScript(src,id){
  if(!root?.document)return Promise.reject(new Error('Chargement navigateur indisponible'));
  const existing=root.document.getElementById(id);
  if(existing){
    if(existing.dataset.loaded==='1')return Promise.resolve();
    return new Promise((resolve,reject)=>{
      existing.addEventListener('load',resolve,{once:true});
      existing.addEventListener('error',()=>reject(new Error(`Échec du chargement ${src}`)),{once:true});
    });
  }
  return new Promise((resolve,reject)=>{
    const script=root.document.createElement('script');
    script.id=id;script.src=src;script.async=true;
    script.onload=()=>{script.dataset.loaded='1';resolve();};
    script.onerror=()=>reject(new Error(`Échec du chargement ${src}`));
    (root.document.head||root.document.documentElement).appendChild(script);
  });
}

async function loadTesseract(){
  if(tesseractPromise)return tesseractPromise;
  tesseractPromise=(async()=>{
    if(root?.Tesseract)return root.Tesseract;
    await loadScript(TESSERACT_URL,'railops-tesseract-habilitations');
    if(!root?.Tesseract)throw new Error('Tesseract OCR indisponible');
    return root.Tesseract;
  })();
  return tesseractPromise;
}

async function openPdf(file){
  const pdfjs=await loadPdfJs();
  const bytes=await file.arrayBuffer();
  const task=pdfjs.getDocument({data:new Uint8Array(bytes)});
  return task.promise;
}

function textItemsToLines(items){
  const positioned=[];
  const unpositioned=[];
  for(let index=0;index<(Array.isArray(items)?items.length:0);index++){
    const item=items[index];
    const text=String(item?.str||'').replace(/\s+/g,' ').trim();
    if(!text)continue;
    const x=Number(item?.transform?.[4]);
    const y=Number(item?.transform?.[5]);
    if(Number.isFinite(x)&&Number.isFinite(y))positioned.push({text,x,y,index});
    else unpositioned.push({text,index});
  }

  positioned.sort((a,b)=>{
    if(Math.abs(a.y-b.y)>ROW_Y_TOLERANCE)return b.y-a.y;
    if(Math.abs(a.x-b.x)>0.25)return a.x-b.x;
    return a.index-b.index;
  });

  const rows=[];
  for(const item of positioned){
    let row=rows[rows.length-1];
    if(!row||Math.abs(item.y-row.y)>ROW_Y_TOLERANCE){
      row={y:item.y,items:[]};
      rows.push(row);
    }
    row.items.push(item);
    row.y=(row.y*(row.items.length-1)+item.y)/row.items.length;
  }

  const lines=rows.map(row=>row.items
    .sort((a,b)=>a.x-b.x||a.index-b.index)
    .map(item=>item.text)
    .join(' ')
    .replace(/\s+/g,' ')
    .trim()
  ).filter(Boolean);

  if(unpositioned.length){
    lines.push(...unpositioned.sort((a,b)=>a.index-b.index).map(item=>item.text));
  }
  return lines.join('\n');
}

async function extractTextWithPdfJs(file){
  const doc=await openPdf(file);
  const pages=[];
  try{
    for(let pageNo=1;pageNo<=doc.numPages;pageNo++){
      const page=await doc.getPage(pageNo);
      const content=await page.getTextContent();
      pages.push(textItemsToLines(content.items));
    }
    return pages.join('\n');
  }finally{
    try{await doc.destroy?.();}catch(_){}
  }
}

async function ocrWithTesseract(file){
  const [doc,Tesseract]=await Promise.all([openPdf(file),loadTesseract()]);
  const worker=await Tesseract.createWorker('fra');
  const texts=[];
  const confidences=[];
  try{
    for(let pageNo=1;pageNo<=doc.numPages;pageNo++){
      const page=await doc.getPage(pageNo);
      const viewport=page.getViewport({scale:OCR_RENDER_SCALE});
      const canvas=root.document.createElement('canvas');
      canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      const context=canvas.getContext('2d',{alpha:false});
      await page.render({canvasContext:context,viewport}).promise;
      const result=await worker.recognize(canvas);
      texts.push(String(result?.data?.text||''));
      const confidence=Number(result?.data?.confidence);
      if(Number.isFinite(confidence))confidences.push(confidence/100);
    }
    return {
      text:texts.join('\n'),
      confidence:confidences.length?confidences.reduce((a,b)=>a+b,0)/confidences.length:null
    };
  }finally{
    try{await worker.terminate?.();}catch(_){}
    try{await doc.destroy?.();}catch(_){}
  }
}

async function readHabilitationPdf(file,deps={}){
  if(!file||file.type!=='application/pdf')throw new Error('Un fichier PDF est requis');
  if(typeof file.arrayBuffer!=='function'&&!deps.extractText)throw new Error('Le fichier PDF est illisible');
  const extractText=deps.extractText||extractTextWithPdfJs;
  const ocrPages=deps.ocrPages||ocrWithTesseract;
  const native=String(await extractText(file)||'').trim();
  if(native.length>=20&&hasHabilitationCode(native))return {text:native,method:'text',confidence:null};
  const ocr=await ocrPages(file);
  return {text:String(ocr?.text||'').trim(),method:'ocr',confidence:Number.isFinite(ocr?.confidence)?ocr.confidence:null};
}

return {
  PDFJS_VERSION,TESSERACT_VERSION,PDFJS_URL,PDFJS_WORKER_URL,TESSERACT_URL,OCR_RENDER_SCALE,ROW_Y_TOLERANCE,
  hasHabilitationCode,textItemsToLines,readHabilitationPdf,extractTextWithPdfJs,ocrWithTesseract
};
});
