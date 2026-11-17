window.ESPACIO6_WORKER="https://espacio-sexto-resultados.javigr77.workers.dev";

window.ESPACIO6_normalizeCode=function(v){
  return String(v||"").trim().toUpperCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g,"-")
    .replace(/\s+/g,"");
};

window.ESPACIO6_validateStudent=async function(raw,group){
  const code=window.ESPACIO6_normalizeCode(raw);
  if(!group) return {ok:false,error:"Selecciona tu grupo."};
  if(!code) return {ok:false,error:"Introduce tu código personal."};
  try{
    const r=await fetch(window.ESPACIO6_WORKER+"/api/student/validate",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({code,group})
    });
    const d=await r.json();
    if(!r.ok) return {ok:false,error:d.error||"No se pudo comprobar el código."};
    if(!d.valid) return {ok:false,error:d.error||"Código de alumno no válido."};
    return {ok:true,code:d.code||code,group:d.group||group,test:d.test===true};
  }catch(e){
    return {ok:false,error:"No se ha podido comprobar el código. Inténtalo de nuevo."};
  }
};