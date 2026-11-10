
const WORKER="https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts";
const ACTIVITY_ID="lengua-numerales-cardinales-ordinales-funciones";
const ACTIVITY_TITLE="Misión Numerales · Cardinales, ordinales y funciones";
const $=s=>document.querySelector(s);
let Q=[],mode="practice",idx=0,answers=[],started=null,studentCode="",group="",xp=0,combo=0,bestCombo=0;

async function init(){
 Q=await fetch("questions.json").then(r=>r.json());
 mode=document.body.dataset.mode||"practice";
 $("#total").textContent=Q.length;
 if(mode==="evaluation") $("#identity").classList.remove("hidden"); else startQuiz();
}
function startEvaluation(){
 const v=window.ESPACIO6_validateStudent($("#studentCode").value,$("#group").value);
 $("#identityMsg").textContent="";
 if(!v.ok){$("#identityMsg").textContent=v.error;return}
 studentCode=v.code;group=v.group;$("#identity").classList.add("hidden");startQuiz();
}
function startQuiz(){started=new Date().toISOString();$("#quiz").classList.remove("hidden");render()}
function render(){
 const q=Q[idx];$("#mission").textContent=q.mission;$("#qnum").textContent=idx+1;$("#bar").style.width=(idx/Q.length*100)+"%";$("#question").textContent=q.q;
 const box=$("#options");box.innerHTML="";$("#feedback").textContent="";$("#next").disabled=true;
 q.o.forEach((t,i)=>{const b=document.createElement("button");b.className="opt";b.textContent=String.fromCharCode(65+i)+". "+t;b.onclick=()=>choose(i);box.appendChild(b)});
 updateHud();
}
function choose(i){
 answers[idx]=i;[...document.querySelectorAll(".opt")].forEach((b,n)=>b.classList.toggle("sel",n===i));
 $("#next").disabled=false;
 if(mode==="practice"){
   const q=Q[idx],ok=i===q.a;
   [...document.querySelectorAll(".opt")].forEach((b,n)=>{b.disabled=true;if(n===q.a)b.classList.add("ok");if(n===i&&!ok)b.classList.add("bad")});
   if(ok){combo++;bestCombo=Math.max(bestCombo,combo);xp+=100+Math.min(combo*10,60);$("#feedback").textContent="✓ Correcto";$("#feedback").className="feedback good"}
   else{combo=0;$("#feedback").textContent="✗ Revisa la idea antes de continuar";$("#feedback").className="feedback badmsg"}
   updateHud();
 }
}
function nextQ(){if(answers[idx]===undefined)return;if(mode==="evaluation"){const ok=answers[idx]===Q[idx].a;if(ok){combo++;bestCombo=Math.max(bestCombo,combo);xp+=100+Math.min(combo*10,60)}else combo=0}idx++;if(idx>=Q.length)finish();else render()}
function updateHud(){$("#xp").textContent=xp;$("#combo").textContent=combo}
async function finish(){
 const correct=answers.reduce((n,a,i)=>n+(a===Q[i].a?1:0),0),acc=Math.round(correct/Q.length*100),score=Math.round(correct/Q.length*100)/10;
 $("#quiz").classList.add("hidden");$("#result").classList.remove("hidden");
 $("#rCorrect").textContent=correct+"/"+Q.length;$("#rAcc").textContent=acc+"%";$("#rScore").textContent=score.toFixed(1).replace(".",",");$("#rXp").textContent=xp;
 const rank=acc>=95?"S+":acc>=90?"S":acc>=80?"A":acc>=70?"B":acc>=60?"C":"D";$("#rank").textContent=rank;
 if(mode==="evaluation"){
   const events=Q.map((q,i)=>({type:"answer",questionNumber:i+1,mission:q.mission,question:q.q,answer:q.o[answers[i]],expected:q.o[q.a],correct:answers[i]===q.a,xp,combo:bestCombo}));
   const payload={activityId:ACTIVITY_ID,activityTitle:ACTIVITY_TITLE,studentCode,group,startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,xp,comboBest:bestCombo,correct,answered:answers.filter(x=>x!==undefined).length,accuracy:acc,score10:score,stage:4,events};
   await send(payload);
 }
}
async function send(payload){
 const status=$("#saveState");status.textContent="Guardando resultado…";status.className="feedback";
 try{
   const key="attempt_"+ACTIVITY_ID+"_"+studentCode+"_"+started;
   if(sessionStorage.getItem(key)==="sent"){status.textContent="✓ Resultado ya registrado";status.className="feedback good";return}
   const r=await fetch(WORKER,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   if(!r.ok)throw new Error("No se pudo registrar");
   sessionStorage.setItem(key,"sent");status.textContent="✓ Resultado registrado correctamente";status.className="feedback good";
 }catch(e){
   window._pendingPayload=payload;status.textContent="No se ha podido registrar el resultado. No cierres esta página y avisa al profesor.";status.className="feedback badmsg";$("#retry").classList.remove("hidden");
 }
}
function retrySend(){if(window._pendingPayload)send(window._pendingPayload)}
window.addEventListener("DOMContentLoaded",init);
