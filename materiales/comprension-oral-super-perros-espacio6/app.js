
const BASE="https://espacio-sexto-resultados.javigr77.workers.dev";
const VALIDATE=BASE+"/api/student/validate";
const ATTEMPTS=BASE+"/api/attempts";
const ACTIVITY_ID="comprension-oral-super-perros";
const ACTIVITY_TITLE="Comprensión oral · Superperros";
const AUDIO_FILE="Super Perros.mp3";
let Q=[],idx=0,answers={},studentCode="",group="",started="",listenCount=0,sent=false;
const $=s=>document.querySelector(s);

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

async function init(){
 Q=await fetch("questions.json").then(r=>r.json());
 buildTabs();
 const audio=$("#evalAudio");
 audio.addEventListener("play",()=>{
   if(audio.currentTime<1 && !audio.dataset.counting){
     if(listenCount>=2){audio.pause();audio.currentTime=0;return}
     listenCount++;audio.dataset.counting="1";updateListen();
   }
 });
 audio.addEventListener("ended",()=>{delete audio.dataset.counting});
 audio.addEventListener("pause",()=>{if(audio.currentTime<1) delete audio.dataset.counting});
 $("#identity").classList.remove("hidden");
}
function updateListen(){
 $("#listenCount").textContent=`Escuchas: ${listenCount}/2`;
 if(listenCount>=2)$("#listenHelp").textContent="Has utilizado las dos escuchas permitidas.";
}
function buildTabs(){
 const w=$("#tabs");Q.forEach((q,i)=>{const b=document.createElement("button");b.className="qtab";b.id="tab"+i;b.textContent=q.n;b.onclick=()=>go(i);w.appendChild(b)})
}
async function startEvaluation(){
 const code=$("#studentCode").value.trim().toUpperCase().replace(/\s+/g,""),g=$("#group").value,msg=$("#identityMsg");
 if(!code||!g){msg.textContent="Introduce tu código y selecciona el grupo.";return}
 $("#startBtn").disabled=true;msg.textContent="Comprobando código…";
 try{
  const r=await fetch(VALIDATE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentCode:code,group:g})});
  let d={};try{d=await r.json()}catch{}
  if(!r.ok||!d.ok)throw Error(d.error||"Código no válido.");
  studentCode=d.studentCode||code;group=d.group||g;started=new Date().toISOString();
  $("#identity").classList.add("hidden");$("#evaluation").classList.remove("hidden");render()
 }catch(e){msg.textContent=e.message||"No se pudo validar el código."}
 finally{$("#startBtn").disabled=false}
}
function go(i){idx=i;render()}
function render(){
 const q=Q[idx];$("#qnum").textContent=`Pregunta ${q.n} de ${Q.length}`;$("#qtext").textContent=q.q;
 const g=$("#answers");g.innerHTML="";
 shuffle(q.options.map((text,i)=>({text,i}))).forEach(o=>{
  const b=document.createElement("button");b.className="answer";b.textContent=o.text;
  if(answers[idx]===o.i)b.classList.add("sel");
  b.onclick=()=>{answers[idx]=o.i;render();updateTabs()};
  g.appendChild(b)
 });
 $("#prevBtn").disabled=idx===0;$("#nextBtn").textContent=idx===Q.length-1?"Revisar prueba":"Siguiente →";
 updateTabs();$("#answered").textContent=`${Object.keys(answers).length}/15 respondidas`;
}
function updateTabs(){
 Q.forEach((q,i)=>{const e=$("#tab"+i);e.classList.toggle("done",answers[i]!==undefined);e.classList.toggle("on",i===idx)})
}
function prev(){if(idx>0){idx--;render()}}
function next(){if(idx<Q.length-1){idx++;render()}else review()}
function review(){
 $("#evaluation").classList.add("hidden");$("#review").classList.remove("hidden");
 const w=$("#reviewGrid");w.innerHTML="";
 Q.forEach((q,i)=>{
  const ok=answers[i]!==undefined,d=document.createElement("button");d.className="reviewItem "+(ok?"ok":"pending");
  d.innerHTML=`<b>${q.n}. ${q.q}</b><span>${ok?"Respondida":"Sin responder"}</span>`;
  d.onclick=()=>{$("#review").classList.add("hidden");$("#evaluation").classList.remove("hidden");idx=i;render()};w.appendChild(d)
 });
 const missing=Q.length-Object.keys(answers).length;
 $("#reviewMsg").textContent=missing?`Quedan ${missing} preguntas sin responder. Puedes volver a ellas o enviar la prueba igualmente.`:"Todas las preguntas están respondidas. Puedes enviar la prueba.";
}
function back(){ $("#review").classList.add("hidden");$("#evaluation").classList.remove("hidden");render() }
async function submitResults(){
 if(sent)return;
 const missing=Q.filter((q,i)=>answers[i]===undefined).map(q=>q.n);
 if(missing.length&&!confirm(`Quedan ${missing.length} preguntas sin responder (${missing.join(", ")}). ¿Quieres enviar la prueba igualmente?`))return;
 let correct=0;
 const events=Q.map((q,i)=>{
   const ans=answers[i]===undefined?null:answers[i],ok=ans===q.correct;
   if(ok)correct++;
   return {questionNumber:q.n,type:"choice",question:q.q,answer:ans===null?null:q.options[ans],expected:q.options[q.correct],correct:ans===null?null:ok}
 });
 const answered=Q.length-missing.length,score10=Math.round((correct/Q.length)*100)/10,accuracy=Math.round((correct/Q.length)*100);
 const payload={activityId:ACTIVITY_ID,activityTitle:ACTIVITY_TITLE,studentCode,group,startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,correct,answered,accuracy,score10,listenCount,stage:Q.length,incompleteQuestions:missing,events};
 const btn=$("#sendBtn");btn.disabled=true;btn.textContent="Enviando…";
 try{
  const key=`attempt_${ACTIVITY_ID}_${studentCode}_${started}`;
  if(sessionStorage.getItem(key)!=="sent"){
   const r=await fetch(ATTEMPTS,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   let d={};try{d=await r.json()}catch{}
   if(!r.ok)throw Error(d.error||"No se pudo guardar");
   sessionStorage.setItem(key,"sent");
  }
  sent=true;$("#review").classList.add("hidden");$("#result").classList.remove("hidden");
  $("#score").textContent=score10.toFixed(1).replace(".",",")+" / 10";$("#resultMeta").textContent=`${correct}/15 aciertos · ${accuracy}% · ${listenCount} escucha${listenCount===1?"":"s"}`;
 }catch(e){btn.disabled=false;btn.textContent="Enviar resultados";$("#reviewMsg").textContent="No se pudo registrar el resultado. No cierres la página y avisa al profesor."}
}
window.addEventListener("DOMContentLoaded",init);
