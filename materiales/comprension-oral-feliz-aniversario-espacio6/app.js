
const WORKER_URL="https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts";
const ACTIVITY_ID="comprension-oral-feliz-aniversario";
const ACTIVITY_TITLE="Comprensión oral · Feliz aniversario";
const $=s=>document.querySelector(s);
let QUESTIONS=[],mode="practice",studentCode="",group="",startedAt=null,index=0,answers=[],plays=0,maxPlays=Infinity;

async function init(){
  QUESTIONS=await fetch("questions.json").then(r=>r.json());
  mode=document.body.dataset.mode||"practice";
  maxPlays=mode==="evaluation"?2:Infinity;
  $("#total").textContent=QUESTIONS.length;
  $("#listenLimit").textContent=mode==="evaluation"?"Máximo 2 escuchas":"Escuchas libres";
  if(mode==="evaluation") $("#identity").classList.remove("hidden"); else startQuiz();
}
function startEvaluation(){
  const result=window.ESPACIO6_validateStudent($("#studentCode").value,$("#group").value);
  $("#identityMsg").textContent="";
  if(!result.ok){$("#identityMsg").textContent=result.error;return}
  studentCode=result.code; group=result.group;
  $("#identity").classList.add("hidden"); startQuiz();
}
function startQuiz(){
  startedAt=new Date().toISOString();
  $("#quiz").classList.remove("hidden");
  renderQuestion();
}
function playAudio(){
  if(plays>=maxPlays) return;
  const a=$("#audio"); a.currentTime=0; a.play(); plays++;
  $("#plays").textContent=plays;
  if(plays>=maxPlays && Number.isFinite(maxPlays)) $("#playBtn").disabled=true;
}
function renderQuestion(){
  const q=QUESTIONS[index];
  $("#qnum").textContent=index+1; $("#question").textContent=q.q;
  $("#bar").style.width=((index)/QUESTIONS.length*100)+"%";
  const box=$("#options"); box.innerHTML="";
  q.o.forEach((label,i)=>{
    const b=document.createElement("button"); b.className="opt"; b.textContent=String.fromCharCode(65+i)+". "+label;
    b.onclick=()=>selectAnswer(i); box.appendChild(b);
  });
  $("#nextBtn").disabled=true; $("#feedback").textContent="";
}
function selectAnswer(choice){
  [...document.querySelectorAll(".opt")].forEach((b,i)=>b.classList.toggle("selected",i===choice));
  answers[index]=choice; $("#nextBtn").disabled=false;
}
function nextQuestion(){
  if(answers[index]===undefined)return;
  index++;
  if(index>=QUESTIONS.length) finish(); else renderQuestion();
}
async function finish(){
  const correct=answers.reduce((n,a,i)=>n+(a===QUESTIONS[i].a?1:0),0);
  const accuracy=Math.round(correct/QUESTIONS.length*100);
  const score10=Math.round((correct/QUESTIONS.length*10)*10)/10;
  $("#quiz").classList.add("hidden"); $("#results").classList.remove("hidden");
  $("#rCorrect").textContent=`${correct}/${QUESTIONS.length}`;
  $("#rAcc").textContent=accuracy+"%"; $("#rScore").textContent=score10.toFixed(1).replace(".",",");
  $("#rPlays").textContent=plays;
  if(mode==="evaluation"){
    const events=QUESTIONS.map((q,i)=>({
      type:"answer",questionNumber:i+1,question:q.q,
      answer:answers[i]===undefined?null:q.o[answers[i]],
      expected:q.o[q.a],correct:answers[i]===q.a
    }));
    events.unshift({type:"audio",plays,maxPlays:2});
    const payload={
      activityId:ACTIVITY_ID,activityTitle:ACTIVITY_TITLE,studentCode,group,
      startedAtIso:startedAt,finishedAtIso:new Date().toISOString(),finished:true,
      xp:correct*100,comboBest:0,correct,answered:answers.filter(x=>x!==undefined).length,
      accuracy,score10,stage:1,events
    };
    try{
      const r=await fetch(WORKER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!r.ok) throw new Error("No se pudo registrar");
      $("#saveState").textContent="✓ Resultado registrado";
      $("#saveState").className="message good";
    }catch(e){
      $("#saveState").textContent="⚠ No se pudo registrar el resultado.";
      $("#saveState").className="message bad";
    }
  }
}
window.addEventListener("DOMContentLoaded",init);
