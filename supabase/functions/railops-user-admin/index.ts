import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
}
const URL=Deno.env.get('SUPABASE_URL')??''
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''
const admin=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}})
function out(body:Record<string,unknown>,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8'}})}
async function sha256(text:string){const bytes=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  if(req.method!=='POST')return out({ok:false,code:'METHOD_NOT_ALLOWED'},405)
  try{
    const auth=req.headers.get('Authorization')??''
    const token=auth.replace(/^Bearer\s+/i,'').trim()
    if(!token)return out({ok:false,code:'UNAUTHORIZED'},401)
    const {data:who,error:whoErr}=await admin.auth.getUser(token)
    if(whoErr||!who?.user)return out({ok:false,code:'UNAUTHORIZED'},401)
    const {data:me,error:meErr}=await admin.from('users').select('id,nom,role,is_admin,auth_user_id').eq('auth_user_id',who.user.id).maybeSingle()
    if(meErr||!me)return out({ok:false,code:'NO_RAILOPS_PROFILE'},403)
    const body=await req.json().catch(()=>({}))
    const action=String(body?.action??'')
    const targetId=String(body?.user_id??'').trim()
    const isAdmin=!!me.is_admin

    if(action==='change_password'){
      const password=String(body?.password??'')
      if(password.length<6)return out({ok:false,code:'PASSWORD_TOO_SHORT'})
      const target=targetId||String(me.id)
      if(target!==me.id&&!isAdmin)return out({ok:false,code:'FORBIDDEN'},403)
      const {data:u,error:uErr}=await admin.from('users').select('id,auth_user_id').eq('id',target).maybeSingle()
      if(uErr||!u?.auth_user_id)return out({ok:false,code:'USER_NOT_AUTH_LINKED'},400)
      const {error:pErr}=await admin.auth.admin.updateUserById(u.auth_user_id,{password})
      if(pErr)throw pErr
      await admin.from('users').update({mdp:await sha256(`railops:${password}`)}).eq('id',target)
      return out({ok:true})
    }

    if(!isAdmin)return out({ok:false,code:'FORBIDDEN'},403)
    if(!targetId)return out({ok:false,code:'INVALID_INPUT'},400)
    const {data:target,error:tErr}=await admin.from('users').select('id,nom,badge,role,is_admin,auth_user_id').eq('id',targetId).maybeSingle()
    if(tErr||!target)return out({ok:false,code:'USER_NOT_FOUND'},404)
    if(target.is_admin)return out({ok:false,code:'OWNER_PROTECTED'},403)

    if(action==='update_profile'){
      const badge=String(body?.badge??target.badge??'').trim()
      const role=String(body?.role??target.role??'').trim()
      if(!badge||!new Set(['agent','cte','chef','chef_chantier']).has(role))return out({ok:false,code:'INVALID_INPUT'},400)
      const {data:dup}=await admin.from('users').select('id').eq('badge',badge).neq('id',targetId).maybeSingle()
      if(dup)return out({ok:false,code:'BADGE_EXISTS'},409)
      const {error:uErr}=await admin.from('users').update({badge,role}).eq('id',targetId)
      if(uErr)throw uErr
      if(target.auth_user_id){await admin.auth.admin.updateUserById(target.auth_user_id,{user_metadata:{railops_user_id:target.id,railops_name:target.nom,railops_badge:badge,railops_role:role}})}
      return out({ok:true,user:{id:target.id,nom:target.nom,badge,role,is_admin:false}})
    }

    if(action==='delete_user'){
      const {error:dErr}=await admin.from('users').delete().eq('id',targetId)
      if(dErr)throw dErr
      if(target.auth_user_id){const {error:aErr}=await admin.auth.admin.deleteUser(target.auth_user_id);if(aErr)console.warn('[railops-user-admin] auth delete',aErr.message)}
      return out({ok:true})
    }

    return out({ok:false,code:'UNKNOWN_ACTION'},400)
  }catch(e){console.error('[railops-user-admin]',e);return out({ok:false,code:'SERVER_ERROR'},500)}
})
