
const WORKER="https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts";
const ID="ccnn-video-puzzle-aparato-digestivo";
const TITLE="Puzzle Digestivo · Vídeo + 10 preguntas";
const $=s=>document.querySelector(s);
let Q=[],mode="practice",idx=0,answers=[],studentCode="",group="",started=null,videoEnded=false,maxWatched=0,events=[];

async function init(){
 Q=await fetch("questions.json").then(r=>r.json());
 mode=document.body.dataset.mode||"practice";
 $("#total").textContent=Q.length;
 buildPuzzle();
 const v=$("#video");
 v.addEventListener("timeupdate",()=>{maxWatched=Math.max(maxWatched,v.currentTime);$("#watchPct").textContent=Math.min(100,Math.round((maxWatched/v.duration)*100||0))+"%"});
 v.addEventListener("seeking",()=>{if(v.currentTime>maxWatched+1)v.currentTime=maxWatched});
 v.addEventListener("ratechange",()=>{if(v.playbackRate!==1)v.playbackRate=1});
 v.addEventListener("ended",unlockQuestions);
 if(mode==="evaluation")$("#identity").classList.remove("hidden"); else startVideo();
}
function buildPuzzle(){
 const p=$("#puzzle");
 for(let i=0;i<10;i++){
   const piece=document.createElement("div");piece.className="piece";piece.id="piece"+i;
   const col=i%5,row=Math.floor(i/5);
   piece.innerHTML=`<div class="face front">?</div><div class="face back" style="background-size:500% 200%;background-position:${col*25}% ${row*100}%"></div>`;
   p.appendChild(piece);
 }
}
function startEvaluation(){
 const v=ESPACIO6_validateStudent($("#studentCode").value,$("#group").value);
 $("#identityMsg").textContent="";
 if(!v.ok){$("#identityMsg").textContent=v.error;return}
 studentCode=v.code;group=v.group;$("#identity").classList.add("hidden");startVideo();
}
function startVideo(){started=new Date().toISOString();$("#videoStage").classList.remove("hidden")}
function unlockQuestions(){
 if(videoEnded)return;
 videoEnded=true;
 events.push({type:"video",completed:true,duration:$("#video").duration,watchedSeconds:maxWatched});
 $("#videoStage").classList.add("hidden");
 $("#quizStage").classList.remove("hidden");
 render();
}
function render(){
 const q=Q[idx];
 $("#qnum").textContent=idx+1;$("#bar").style.width=(idx/Q.length*100)+"%";$("#question").textContent=q.q;$("#options").innerHTML="";$("#feedback").textContent="";$("#next").disabled=true;
 const shuffled=q.o.map((text,originalIndex)=>({text,originalIndex}));
 for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
 q._shuffled=shuffled;
 shuffled.forEach((o,i)=>{const b=document.createElement("button");b.className="opt";b.textContent=String.fromCharCode(65+i)+". "+o.text;b.onclick=()=>choose(i);$("#options").appendChild(b)});
}
function choose(displayIndex){
 const q=Q[idx],sel=q._shuffled[displayIndex];
 answers[idx]=sel.originalIndex;
 [...document.querySelectorAll(".opt")].forEach((b,n)=>b.classList.toggle("sel",n===displayIndex));
 $("#next").disabled=false;

 if(mode==="practice"){
   const ok=sel.originalIndex===q.a;
   [...document.querySelectorAll(".opt")].forEach((b,n)=>{b.disabled=true;const o=q._shuffled[n];if(o.originalIndex===q.a)b.classList.add("ok");if(n===displayIndex&&!ok)b.classList.add("bad")});
   if(ok){
     reveal(idx);$("#feedback").textContent="✓ Pieza desbloqueada";$("#feedback").className="feedback good";
   }else{
     $("#feedback").textContent="✗ Esa pieza sigue bloqueada. Observa y prueba otra vez.";$("#feedback").className="feedback badmsg";
     $("#next").disabled=true;
     setTimeout(()=>{[...document.querySelectorAll(".opt")].forEach(b=>{b.disabled=false;b.classList.remove("sel","bad","ok")});$("#feedback").textContent=""},900);
   }
 }
}
function reveal(i){$("#piece"+i)?.classList.add("revealed")}
function nextQ(){
 const q=Q[idx],ok=answers[idx]===q.a;
 events.push({type:"answer",questionNumber:idx+1,question:q.q,answer:q.o[answers[idx]],expected:q.o[q.a],correct:ok});
 if(mode==="evaluation")reveal(idx);
 idx++;
 if(idx>=Q.length)finish();else render();
}
async function finish(){
 const correct=answers.reduce((n,a,i)=>n+(a===Q[i].a?1:0),0),acc=Math.round(correct/Q.length*100),note=Math.round(correct/Q.length*100)/10;
 $("#quizStage").classList.add("hidden");$("#result").classList.remove("hidden");
 $("#rCorrect").textContent=correct+"/10";$("#rAcc").textContent=acc+"%";$("#rScore").textContent=note.toFixed(1).replace(".",",");$("#rPuzzle").textContent="10/10";
 if(mode==="evaluation"){
   const payload={activityId:ID,activityTitle:TITLE,studentCode,group,startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,xp:correct*100,comboBest:0,correct,answered:answers.length,accuracy:acc,score10:note,stage:2,events};
   send(payload);
 }
}
async function send(p){
 const s=$("#saveState");s.textContent="Guardando resultado…";
 try{
  const k="attempt_"+ID+"_"+studentCode+"_"+started;
  if(sessionStorage.getItem(k)==="sent"){s.textContent="✓ Resultado ya registrado";s.className="feedback good";return}
  const r=await fetch(WORKER,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
  if(!r.ok)throw 0;sessionStorage.setItem(k,"sent");s.textContent="✓ Resultado registrado correctamente";s.className="feedback good";
 }catch{window._pending=p;s.textContent="No se ha podido registrar el resultado. No cierres esta página y avisa al profesor.";s.className="feedback badmsg";$("#retry").classList.remove("hidden")}
}
function retrySend(){if(window._pending)send(window._pending)}
window.addEventListener("DOMContentLoaded",init);
