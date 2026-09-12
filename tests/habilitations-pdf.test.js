const assert=require('assert');
const pdf=require('../js/core/habilitations-pdf.js');

(async()=>{
  const textResult=await pdf.readHabilitationPdf(
    {type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(8)},
    {
      extractText:async()=>"H1B1 valable jusqu'au 15/04/2027",
      ocrPages:async()=>{throw new Error('OCR must not run when text exists');}
    }
  );
  assert.equal(textResult.method,'text');
  assert.ok(textResult.text.includes('H1B1'));

  const ocrResult=await pdf.readHabilitationPdf(
    {type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(8)},
    {
      extractText:async()=>'',
      ocrPages:async()=>({text:'S11 validité 03/11/2026',confidence:0.91})
    }
  );
  assert.equal(ocrResult.method,'ocr');
  assert.equal(ocrResult.confidence,0.91);

  const irrelevantText=await pdf.readHabilitationPdf(
    {type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(8)},
    {
      extractText:async()=>"Document administratif avec beaucoup de texte mais aucune habilitation électrique reconnue.",
      ocrPages:async()=>({text:'APS9 échéance 28/09/2026',confidence:0.88})
    }
  );
  assert.equal(irrelevantText.method,'ocr','native text without a recognizable habilitation must fall back to OCR');

  await assert.rejects(()=>pdf.readHabilitationPdf({type:'image/jpeg'}),/PDF/);
  console.log('habilitations PDF adapter contract: ok');
})().catch(e=>{console.error(e);process.exit(1);});
