(function(){
'use strict';
const VERSION='155-register-import-filereader-hotfix';
let attempts=0;

function install(){
  if(window.RailOpsRegisterImportFileReaderHotfix?.installed)return true;
  const tolerance=window.RailOpsRegisterImportToleranceV155;
  if(!tolerance||typeof tolerance.baseImport!=='function'||typeof tolerance.normalizeWorkbook!=='function'||typeof XLSX==='undefined')return false;

  const baseImport=tolerance.baseImport;
  const normalizeWorkbook=tolerance.normalizeWorkbook;

  async function importWithNativeFile(input){
    const file=input?.files?.[0];
    if(!file)return baseImport(input);
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!['xlsx','xls','xlsm','xlsb','ods'].includes(ext)||typeof file.arrayBuffer!=='function')return baseImport(input);
    try{
      const originalBuffer=await file.arrayBuffer();
      const wb=XLSX.read(originalBuffer,{type:'array',cellDates:true,bookVBA:true});
      const reports=normalizeWorkbook(wb);
      if(!reports.length)return baseImport(input);
      const rewritten=XLSX.write(wb,{type:'array',bookType:'xlsx'});
      const syntheticFile=new File([rewritten],file.name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const duplicates=reports.reduce((n,r)=>n+(r.duplicateRows||0),0);
      const stale=reports.filter(r=>r.declaredMismatch).length;
      console.info('[RailOps v155 FileReader import hotfix]',reports);
      if(typeof toast==='function')toast(`Registre contrôlé : ${duplicates} doublon(s) identique(s) neutralisé(s)${stale?' · total annoncé obsolète corrigé pour lecture':''}`,'warn');
      return baseImport({files:[syntheticFile],value:''});
    }catch(e){
      console.warn('[RailOps v155 FileReader import hotfix] lecture inchangée',e);
      return baseImport(input);
    }
  }

  window.importCSV=importWithNativeFile;
  try{importCSV=importWithNativeFile;}catch(e){}

  // v145 captures file-input changes and calls generalizedImport(input) directly.
  // Patch that same global binding so the real picker path cannot bypass normalization.
  window.generalizedImport=importWithNativeFile;
  try{generalizedImport=importWithNativeFile;}catch(e){}

  window.RailOpsRegisterImportFileReaderHotfix={installed:true,version:VERSION,baseImport};
  console.info('[RailOps] correctif FileReader import registre actif —',VERSION);
  return true;
}

(function waitForTolerance(){
  if(install())return;
  attempts++;
  if(attempts<50)setTimeout(waitForTolerance,100);
  else console.warn('[RailOps] correctif FileReader import registre non installé');
})();
})();
