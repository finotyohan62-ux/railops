import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
}
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')??''
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''
const ANON_KEY=Deno.env.get('SUPABASE_ANON_KEY')??''
const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
function out(body:Record<string,unknown>,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8'}})}
function norm(v:unknown){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase()}
async function sha256(text:string){const bytes=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function emailFor(id:string){return `railops+${id.toLowerCase().replace(/[^a-z0-9._+-]/g,'-')}@railops.invalid`}
async function newRailOpsId(){for(let i=0;i<8;i++){const n=crypto.getRandomValues(new Uint32Array(1))[0]%1000000;const id='USR'+String(n).padStart(6,'0');const {data}=await admin.from('users').select('id').eq('id',id).maybeSingle();if(!data)return id}throw new Error('ID_GENERATION_FAILED')}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return out({ok:false,code:'METHOD_NOT_ALLOWED'},405)
  try{
    if(!SUPABASE_URL||!SERVICE_ROLE_KEY||!ANON_KEY)return out({ok:false,code:'SERVER_NOT_CONFIGURED'},500)
    const body=await req.json().catch(()=>({}))
    const nom=String(body?.nom??'').trim().replace(/\s+/g,' ')
    const badge=String(body?.badge??'').trim()
    const password=String(body?.password??'')
    const role=String(body?.role??'').trim()
    const invitation=String(body?.invitation_code??'').trim()
    const allowed=new Set(['agent','cte','chef','chef_chantier'])
    if(!nom||!badge||password.length<6||!allowed.has(role))return out({ok:false,code:'INVALID_INPUT'})
    if(role!=='agent'){
      const key=role==='chef'?'code_chef':role==='cte'?'code_cte':'code_chef_chantier'
      const {data:cfg,error:cfgErr}=await admin.from('app_config').select('value').eq('key',key).maybeSingle()
      if(cfgErr||!cfg?.value||invitation!==String(cfg.value).trim())return out({ok:false,code:'INVITATION_INVALID'})
    }
    const {data:all,error:readErr}=await admin.from('users').select('id,nom,badge')
    if(readErr)throw readErr
    if((all??[]).some((u:any)=>norm(u.nom)===norm(nom)))return out({ok:false,code:'NAME_EXISTS'})
    if((all??[]).some((u:any)=>String(u.badge??'').trim().toLowerCase()===badge.toLowerCase()))return out({ok:false,code:'BADGE_EXISTS'})
    const id=await newRailOpsId()
    const email=emailFor(id)
    const {data:created,error:createErr}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{railops_user_id:id,railops_name:nom,railops_badge:badge,railops_role:role}})
    if(createErr||!created?.user)throw createErr??new Error('AUTH_CREATE_FAILED')
    const legacyHash=await sha256(`railops:${password}`)
    const {error:insertErr}=await admin.from('users').insert({id,nom,badge,role,mdp:legacyHash,auth_user_id:created.user.id,auth_email:email,auth_migrated_at:new Date().toISOString(),is_admin:false})
    if(insertErr){await admin.auth.admin.deleteUser(created.user.id).catch(()=>{});if(String(insertErr.code)==='23505')return out({ok:false,code:'BADGE_EXISTS'});throw insertErr}
    const client=createClient(SUPABASE_URL,ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
    const {data:authData,error:authErr}=await client.auth.signInWithPassword({email,password})
    if(authErr||!authData.session)throw authErr??new Error('AUTH_SESSION_FAILED')
    return out({ok:true,profile:{id,nom,badge,role},session:{access_token:authData.session.access_token,refresh_token:authData.session.refresh_token}})
  }catch(e){console.error('[railops-register]',e);return out({ok:false,code:'SERVER_ERROR'},500)}
})
