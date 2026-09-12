(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.RailOpsHabilitationsParser=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const CODE_PATTERNS=[
  {pattern:/\bTES\s*M\b/gi,canonical:()=> 'TESM'},
  {pattern:/\bCH\s*\d\s*[\/\s-]*CB\s*\d\b/gi,canonical:value=>normalizeCode(value)},
  {pattern:/\bH\s*\d\s*B\s*\d\b/gi,canonical:value=>normalizeCode(value)},
  {pattern:/\bAPS\s*\d{1,2}\b/gi,canonical:value=>normalizeCode(value)},
  {pattern:/\bS\s*\d{1,2}\b/gi,canonical:value=>normalizeCode(value)}
];
const DATE_PATTERN=/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/g;

function normalizeCode(value){
  return String(value||'').toUpperCase().replace(/[\/\s-]+/g,'');
}

function fold(value){
  return String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’']/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
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
  for(const spec of CODE_PATTERNS){
    spec.pattern.lastIndex=0;
    let match;
    while((match=spec.pattern.exec(line))){
      out.push({code:spec.canonical(match[0]),matchSource:match[0].trim(),index:match.index});
      if(match.index===spec.pattern.lastIndex)spec.pattern.lastIndex++;
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

function hasRangeHeader(value){
  const normalized=fold(value);
  return /date\s+d\s+habilitation/.test(normalized)&&/date\s+limite/.test(normalized);
}

function officialLabel(lines,index,matchSource){
  const line=String(lines[index]||'').replace(/\s+/g,' ').trim();
  if(!/\b(?:TSAE|TES\s*M)\b/i.test(line))return matchSource;
  let label=line.split(/\bDate\s+d[’']?Habilitation\b/i)[0].trim();
  const next=String(lines[index+1]||'').replace(/\s+/g,' ').trim();
  if(next&&!datesInLine(next).length){
    const continuation=next.split(/\bd[’']?Habilitation\b/i)[0].trim();
    if(continuation&&!/^date\s+limite$/i.test(continuation)&&continuation.length<=80){
      label=`${label} ${continuation}`.replace(/\s+/g,' ').trim();
    }
  }
  return label||matchSource;
}

function followingRange(lines,index){
  const headerText=[lines[index],lines[index+1]].filter(Boolean).join(' ');
  if(!hasRangeHeader(headerText))return null;
  for(let offset=1;offset<=2;offset++){
    const line=String(lines[index+offset]||'');
    if(codesInLine(line).length)return null;
    const dates=datesInLine(line);
    if(dates.length===2){
      return {validFrom:dates[0].value,validUntil:dates[1].value,offset};
    }
    if(dates.length===1){
      return {ambiguous:true,offset};
    }
  }
  return null;
}

function extractHabilitations(text){
  const lines=String(text||'').split(/\r?\n/);
  const foldedLines=lines.map(fold);
  const hasGlobalRangeHeader=foldedLines.some(line=>/\bdebut\b/.test(line)&&/\bfin\b/.test(line));
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
      if(previous.labelSource===previous.code&&item.labelSource!==item.code)previous.labelSource=item.labelSource;
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
    const code=codes[0];
    const labelSource=officialLabel(lines,i,code.matchSource);
    const dates=datesInLine(line);
    if(dates.length===0){
      const range=followingRange(lines,i);
      if(range?.ambiguous){
        ambiguities.push(`${code.code}: une seule date détectée dans une ligne Début/Fin (ligne ${i+range.offset+1})`);
        continue;
      }
      if(range){
        if(range.validFrom>range.validUntil){
          ambiguities.push(`${code.code}: période de validité inversée (${range.validFrom} / ${range.validUntil})`);
          continue;
        }
        register({code:code.code,labelSource,validFrom:range.validFrom,validUntil:range.validUntil},i+1);
        continue;
      }
      undated.push({code:code.code,line:i+1});
      continue;
    }
    if(dates.length>2){
      ambiguities.push(`Ligne ${i+1}: trop de dates pour ${code.code}`);
      continue;
    }
    let validFrom=null;
    let validUntil=null;
    if(dates.length===1){
      const foldedLine=foldedLines[i];
      const explicitEnd=/(jusqu|echeance|expiration|expire|date\s+de\s+fin|fin\s+de\s+validite)/.test(foldedLine);
      if(hasGlobalRangeHeader&&!explicitEnd){
        ambiguities.push(`${code.code}: une seule date détectée dans un tableau Début/Fin (ligne ${i+1})`);
        continue;
      }
      validUntil=dates[0].value;
    }else{
      validFrom=dates[0].value;
      validUntil=dates[1].value;
      if(validFrom>validUntil){
        ambiguities.push(`${code.code}: période de validité inversée (${validFrom} / ${validUntil})`);
        continue;
      }
    }
    register({code:code.code,labelSource,validFrom,validUntil},i+1);
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
