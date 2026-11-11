
window.ESPACIO6_6B = new Set(["6B-K7P4", "6B-M2R8", "6B-T9C3", "6B-P5X1", "6B-H8N6", "6B-V3L7", "6B-R6Q2", "6B-D4W9", "6B-N7F5", "6B-B9K2", "6B-X4M8", "6B-C6T1", "6B-J8V3", "6B-F2R7", "6B-Q5H9", "6B-L3X6", "6B-S7D4", "6B-G9P1", "6B-W2N8", "6B-E6K5", "6B-U4C7", "6B-A8Q3", "6B-Z5R2", "6B-Y7M4", "6B-I3V9"]);
window.ESPACIO6_normalizeCode=function(v){
  return String(v||"").trim().toUpperCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g,"-")
    .replace(/\s+/g,"");
};
window.ESPACIO6_validateStudent=function(raw,group){
  const code=window.ESPACIO6_normalizeCode(raw);
  if(code==="TEST-001") return {ok:true,code,group,test:true};
  if(!group) return {ok:false,error:"Selecciona tu grupo."};
  if(group==="6.º B" && !window.ESPACIO6_6B.has(code)) return {ok:false,error:"Código no válido para 6.º B."};
  if(group==="6.º A" && !/^6A-[A-Z0-9]{4,8}$/.test(code)) return {ok:false,error:"Código no válido para 6.º A."};
  if(group==="6.º A" && !code.startsWith("6A-")) return {ok:false,error:"El código no corresponde a 6.º A."};
  if(group==="6.º B" && !code.startsWith("6B-")) return {ok:false,error:"El código no corresponde a 6.º B."};
  return {ok:true,code,group,test:false};
};
