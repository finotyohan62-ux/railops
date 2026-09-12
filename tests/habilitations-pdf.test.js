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

  // Real titles may store content-stream items out of visual order. Rebuild rows by coordinates,
  // not by the order in which PDF.js returns the text objects.
  const shuffledVisualRows=pdf.textItemsToLines([
    {str:'TES M - ASP déplacement dans les emprises',transform:[1,0,0,1,15,700]},
    {str:'TSAE op - Agent Prestataire S9',transform:[1,0,0,1,15,640]},
    {str:"Date d'Habilitation",transform:[1,0,0,1,154,700]},
    {str:'Date limite',transform:[1,0,0,1,228,700]},
    {str:'20/01/2025',transform:[1,0,0,1,163,680]},
    {str:'19/01/2028',transform:[1,0,0,1,229,680]},
    {str:"Date d'Habilitation",transform:[1,0,0,1,154,640]},
    {str:'Date limite',transform:[1,0,0,1,228,640]},
    {str:'31/03/2026',transform:[1,0,0,1,163,620]},
    {str:'30/03/2029',transform:[1,0,0,1,229,620]}
  ]);
  const visualLines=shuffledVisualRows.split('\n');
  assert.ok(visualLines[0].includes('TES M - ASP déplacement dans les emprises'), 'first visual row must be reconstructed first');
  assert.ok(visualLines[1].includes('20/01/2025')&&visualLines[1].includes('19/01/2028'),'the first date row must remain directly below its habilitation');
  assert.ok(visualLines[2].includes('TSAE op - Agent Prestataire S9'),'the second habilitation row must follow the first date row');

  assert.equal(pdf.hasHabilitationCode('TES M - ASP déplacement dans les emprises'),true,'TES M must be recognized as an habilitation marker');

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
