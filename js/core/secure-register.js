(function installRailOpsSecureRegistration(){
  'use strict';
  const VERSION='156-secure-registration';

  function valueByHints(ids,hints,type){
    for(const id of ids){
      const el=document.getElementById(id);
      if(el&&String(el.value||'').trim())return String(el.value||'').trim();
    }
    const root=document.getElementById('app')||document;
    const selector=type?`input[type="${type}"]`:'input,select';
    for(const el of root.querySelectorAll(selector)){
      const hay=[el.id,el.name,el.placeholder,el.getAttribute('aria-label')].filter(Boolean).join(' ').toLowerCase();
      if(hints.some(h=>hay.includes(h))&&String(el.value||'').trim())return String(el.value||'').trim();
    }
    return '';
  }

  function roleValue(){
    const root=document.getElementById('app')||document;
    for(const id of ['ir','role','ins-role','reg-role','register-role']){
      const el=document.getElementById(id);if(el?.value)return String(el.value).trim();
    }
    for(const el of root.querySelectorAll('select')){
      const values=[...el.options].map(o=>String(o.value||''));
      if(values.some(v=>['agent','cte','chef','chef_chantier'].includes(v)))return String(el.value||'agent').trim();
    }
    return 'agent';
  }

  function registrationFields(){
    const root=document.getElementById('app')||document;
    const passwords=[...root.querySelectorAll('input[type="password"]')].map(el=>String(el.value||''));
    return {
      nom:valueByHints(['in','rn','nom','ins-nom','reg-nom','register-nom'],['nom','name','identité','identite']),
      badge:valueByHints(['ib','rb','badge','ins-badge','reg-badge','register-badge'],['badge','matricule']),
      password:valueByHints(['ip','rp','password','ins-password','reg-password','register-password'],['mot de passe','password'],'password')||passwords[0]||'',
      role:roleValue(),
      invitation_code:valueByHints(['ic','rcode','invitation_code','invitation-code','ins-code','reg-code'],['invitation','code'])
    };
  }

  function messageFor(code){
    if(code==='NAME_EXISTS')return 'Ce nom est déjà utilisé.';
    if(code==='BADGE_EXISTS')return 'Ce badge est déjà utilisé.';
    if(code==='BAD_INVITATION_CODE')return "Code d’invitation incorrect.";
    if(code==='INVALID_INPUT')return 'Vérifiez les informations saisies.';
    return 'Création du compte impossible. Réessayez dans quelques instants.';
  }

  async function railopsSecureRegistration(){
    const {nom,badge,password,role,invitation_code}=registrationFields();
    if(!nom||!badge||!password){toast('Veuillez renseigner votre nom, votre badge et votre mot de passe','danger');return;}
    const button=document.querySelector('#app button[onclick*="doInscription"]');
    const oldText=button?.textContent||'';
    if(button){button.disabled=true;button.textContent='Création…';}
    try{
      const {data,error}=await db.functions.invoke('railops-register',{body:{nom,badge,password,role,invitation_code}});
      if(error||!data?.ok||!data?.session?.access_token||!data?.session?.refresh_token){
        console.warn('[RailOps register]',error||data?.code||'REGISTER_FAILED');
        toast(messageFor(data?.code),'danger');return;
      }
      const {error:sessionError}=await db.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
      if(sessionError)throw sessionError;
      const {data:authCheck,error:authError}=await db.auth.getUser();
      if(authError||!authCheck?.user)throw authError||new Error('Session Supabase non établie');
      const profile=data.profile||{};
      if(!profile.nom||!profile.role)throw new Error('Profil RailOps incomplet');
      localStorage.removeItem('ro3_c');localStorage.removeItem('ro3_m');localStorage.removeItem('ro3_u');
      S.agent=profile.nom;S.role=profile.role;S.page='dashboard';
      localStorage.setItem('ro3_a',JSON.stringify({agent:S.agent,role:S.role}));
      await load();render();setupRealtime();setTimeout(flushOfflineQueue,2000);
      toast('Compte créé ✓','ok');
    }catch(err){
      console.error('[RailOps register] création impossible',err);
      toast('Création du compte impossible. Réessayez dans quelques instants.','danger');
    }finally{
      if(button&&document.contains(button)){button.disabled=false;button.textContent=oldText||'Créer mon compte';}
    }
  }

  doInscription=railopsSecureRegistration;
  window.doInscription=railopsSecureRegistration;
  window.RailOpsSecureRegistration={version:VERSION,register:railopsSecureRegistration};
  console.info('[RailOps] inscription sécurisée active —',VERSION);
})();
