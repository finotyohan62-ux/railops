const fs=require('fs');
const vm=require('vm');

const src=fs.readFileSync('js/legacy-core.js','utf8');

function extractFunction(name){
  const marker=`function ${name}(`;
  const start=src.indexOf(marker);
  if(start<0)throw new Error(`Missing ${marker}`);
  const open=src.indexOf('{',start);
  if(open<0)throw new Error(`Missing body for ${name}`);
  let depth=0,quote=null,escaped=false,lineComment=false,blockComment=false;
  for(let i=open;i<src.length;i++){
    const ch=src[i],next=src[i+1];
    if(lineComment){if(ch==='\n')lineComment=false;continue;}
    if(blockComment){if(ch==='*'&&next==='/'){blockComment=false;i++;}continue;}
    if(quote){
      if(escaped){escaped=false;continue;}
      if(ch==='\\'){escaped=true;continue;}
      if(ch===quote){quote=null;continue;}
      continue;
    }
    if(ch==='/'&&next==='/'){lineComment=true;i++;continue;}
    if(ch==='/'&&next==='*'){blockComment=true;i++;continue;}
    if(ch==='\''||ch==='"'||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(depth===0)return src.slice(start,i+1);
    }
  }
  throw new Error(`Unbalanced body for ${name}`);
}

const fnArray=extractFunction('a0a');
const fnDecode=extractFunction('a0b');
const rotStart=src.indexOf('(function(a,b){');
const rotMarker='}(a0a,0xd6d29));';
const rotEnd=src.indexOf(rotMarker,rotStart);
if(rotStart<0||rotEnd<0)throw new Error('Legacy decoder rotation bootstrap not found');
const rotation=src.slice(rotStart,rotEnd+rotMarker.length);

const ctx={parseInt};
vm.createContext(ctx);
vm.runInContext(`${fnArray}\n${fnDecode}\n${rotation}\nthis.__decode=a0b;`,ctx,{timeout:2000});
const decode=ctx.__decode;

function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
const wanted=[
  'openprofil','profil','deconnexion','se deconnecter','mot de passe','password',
  'movl','msheet','moverlay','mon profil','compte','changer le mot de passe'
];
const matches=[];
for(let i=0;i<=0x1000;i++){
  let value;
  try{value=decode(i);}catch(_){continue;}
  if(typeof value!=='string')continue;
  const n=norm(value);
  if(wanted.some(term=>n.includes(term)))matches.push({i,value});
}

console.log('=== PROFILE STRING MATCHES ===');
for(const m of matches)console.log(`0x${m.i.toString(16)} => ${JSON.stringify(m.value)}`);

console.log('=== RAW SOURCE CONTEXTS ===');
for(const m of matches){
  const hex=`0x${m.i.toString(16)}`;
  let from=0,count=0;
  while(count<12){
    const at=src.indexOf(hex,from);
    if(at<0)break;
    count++;
    const before=Math.max(0,at-1200),after=Math.min(src.length,at+1800);
    console.log(`\n--- ${hex} ${JSON.stringify(m.value)} occurrence ${count} @${at} ---`);
    console.log(src.slice(before,after));
    from=at+hex.length;
  }
}

if(!matches.some(m=>norm(m.value)==='openprofil')){
  console.log('No exact openProfil string decoded; showing all values containing profil above.');
}
throw new Error('PROFILE_DECODE_DIAGNOSTIC_COMPLETE');
