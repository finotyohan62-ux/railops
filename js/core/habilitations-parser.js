(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.RailOpsHabilitationsParser=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const CODE_PATTERNS=[
  /\bCH\s*\d\s*[\/\s-]*CB\s*\d\b/gi,
  /\bH\s*\d\s*B\s*\d\b/gi,
  /\bAPS\s*\d{1,2}\b/gi,
  /\bS\s*\d{1,2}\b/gi
];
const DATE_PATTERN=/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/g;

function normalizeCode(value){
  return String(value||'').toUpperCase().replace(/[\/\s-]+/g,'');
}

function parseFrenchDate(value){
  const match=String(value||'').match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/);
  if(!match)return null;
  const day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function codesInLine(line){
  const out=[];
  for(const pattern of CODE_PATTERNS){
    pattern.lastIndex=0;
    let match;
    while((match=pattern.exec(line))){
      out.push({code:normalizeCode(match[0]),labelSource:match[0].trim(),index:match.index});
      if(match.index===pattern.lastIndex)pattern.lastIndex++;
    }
  }
  return out.sort((a,b)=>a.index-b.index);
}

function datesInLine(line){
  const out=[];
  DATE_PATTERN.lastIndex=0;
  let match;
  while((match=DATE_PATTERN.exec(line))){
    const iso=parseFrenchDate(match[0]);
    if(iso)out.push({value:iso,index:match.index,source:match[0]});
    if(match.index===DATE_PATTERN.lastIndex)DATE_PATTERN.lastIndex++;
  }
  return out;
}

function extractHabilitations(text){
  const lines=String(text||'').split(/\r?\n/);
  const foldedLines=lines.map(line=>String(line||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
  const hasRangeHeader=foldedLines.some(line=>/\bdebut\b/.test(line)&&/\bfin\b/.test(line));
  const items=[];
  const ambiguities=[];
  const undated=[];
  const byCode=new Map();

  function register(item,lineNo){
    const previous=byCode.get(item.code);
    if(previous){
      if(previous.validUntil!==item.validUntil){
        ambiguities.push(`${item.code}: dates de validité contradictoires (${previous.validUntil} / ${item.validUntil})`);
        return;
      }
      if(previous.validFrom&&item.validFrom&&previous.validFrom!==item.validFrom){
        ambiguities.push(`${item.code}: dates de début contradictoires (${previous.validFrom} / ${item.validFrom})`);
        return;
      }
      if(!previous.validFrom&&item.validFrom)previous.validFrom=item.validFrom;
      return;
    }
    item.line=lineNo;
    byCode.set(item.code,item);
    items.push(item);
  }

  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    const codes=codesInLine(line);
    if(!codes.length)continue;
    if(codes.length!==1){
      ambiguities.push(`Ligne ${i+1}: plusieurs habilitations sur la même ligne`);
      continue;
    }
    const dates=datesInLine(line);
    if(dates.length===0){
      undated.push({code:codes[0].code,line:i+1});
      continue;
    }
    if(dates.length>2){
      ambiguities.push(`Ligne ${i+1}: trop de dates pour ${codes[0].code}`);
      continue;
    }
    let validFrom=null;
    let validUntil=null;
    if(dates.length===1){
      const foldedLine=foldedLines[i];
      const explicitEnd=/(jusqu|echeance|expiration|expire|date\s+de\s+fin|fin\s+de\s+validite)/.test(foldedLine);
      if(hasRangeHeader&&!explicitEnd){
        ambiguities.push(`${codes[0].code}: une seule date détectée dans un tableau Début/Fin (ligne ${i+1})`);
        continue;
      }
      validUntil=dates[0].value;
    }else{
      validFrom=dates[0].value;
      validUntil=dates[1].value;
      if(validFrom>validUntil){
        ambiguities.push(`${codes[0].code}: période de validité inversée (${validFrom} / ${validUntil})`);
        continue;
      }
    }
    register({code:codes[0].code,labelSource:codes[0].labelSource,validFrom,validUntil},i+1);
  }

  for(const mention of undated){
    if(!byCode.has(mention.code))ambiguities.push(`${mention.code}: aucune date de validité détectée (ligne ${mention.line})`);
  }

  for(const item of items)delete item.line;
  return {ok:ambiguities.length===0&&items.length>0,items,ambiguities};
}

function habilitationStatus(validUntil,now=new Date(),warningDays=60){
  const end=new Date(`${validUntil}T23:59:59.999Z`);
  const ref=now instanceof Date?now:new Date(`${now}T00:00:00.000Z`);
  if(Number.isNaN(end.getTime())||Number.isNaN(ref.getTime()))return 'unknown';
  if(end<ref)return 'expired';
  return (end-ref)<=Number(warningDays)*86400000?'expiring':'valid';
}

return {normalizeCode,parseFrenchDate,extractHabilitations,habilitationStatus};
});
