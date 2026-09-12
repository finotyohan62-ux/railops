const assert=require('assert');
const pdf=require('../js/core/habilitations-pdf.js');

(async()=>{
  const reconstructed=pdf.textItemsToLines([
    {str:'Habilitation',transform:[1,0,0,1,50,700]},
    {str:'Debut',transform:[1,0,0,1,180,700]},
    {str:'Fin',transform:[1,0,0,1,300,700],hasEOL:true},
    {str:'H1B1',transform:[1,0,0,1,50,680]},
    {str:'15/04/2024',transform:[1,0,0,1,180,680]},
    {str:'15/04/2027',transform:[1,0,0,1,300,680],hasEOL:true},
    {str:'S11',transform:[1,0,0,1,50,660]},
    {str:'03/11/2024',transform:[1,0,0,1,180,660]},
    {str:'03/11/2026',transform:[1,0,0,1,300,660]}
  ]);
  assert.equal(reconstructed.split('\n').length,3,'PDF.js text items must preserve visual rows');
  assert.ok(reconstructed.includes('H1B1 15/04/2024 15/04/2027'));

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

  assert.ok(Number(pdf.OCR_RENDER_SCALE)>=3.3,'OCR render scale must be high enough for small habilitation codes');

  await assert.rejects(()=>pdf.readHabilitationPdf({type:'image/jpeg'}),/PDF/);
  console.log('habilitations PDF adapter contract: ok');
})().catch(e=>{console.error(e);process.exit(1);});
