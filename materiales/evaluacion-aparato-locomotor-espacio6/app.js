
const WORKER_URL="https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts";
const ACTIVITY_ID="evaluacion-aparato-locomotor";
const ACTIVITY_TITLE="Evaluación · El aparato locomotor";
const $=s=>document.querySelector(s);
let Q=[],studentCode="",group="",startedAt="",index=0,answers={},objectivePoints=0;

async function init(){
  Q=await fetch("questions.json").then(r=>r.json());
  $("#total").textContent=Q.length;
}
function startEvaluation(){
  const r=window.ESPACIO6_validateStudent($("#studentCode").value,$("#group").value);
  $("#identityMsg").textContent="";
  if(!r.ok){$("#identityMsg").textContent=r.error;return}
  studentCode=r.code;group=r.group;startedAt=new Date().toISOString();
  $("#identity").classList.add("hidden");$("#quiz").classList.remove("hidden");render();
}
function render(){
  const q=Q[index];
  $("#qnum").textContent=index+1;
  $("#bar").style.width=(index/Q.length*100)+"%";
  $("#qpoints").textContent=q.points.toFixed(2).replace(".",",")+" p";
  $("#question").textContent=q.question;
  const media=$("#media");media.innerHTML=q.image?`<img class="qimg" src="${q.image}" alt="Imagen de apoyo">`:"";
  const area=$("#answerArea");area.innerHTML="";
  if(q.type==="single"){
    q.options.forEach((o,i)=>area.insertAdjacentHTML("beforeend",`<label class="opt"><input type="radio" name="ans" value="${i}"> <span>${o}</span></label>`));
  }else if(q.type==="multi"){
    q.options.forEach((o,i)=>area.insertAdjacentHTML("beforeend",`<label class="opt"><input type="checkbox" name="ans" value="${i}"> <span>${o}</span></label>`));
  }else if(q.type==="classify"){
    area.className="classgrid";
    q.items.forEach((it,i)=>area.insertAdjacentHTML("beforeend",`<div class="classrow"><b>${it.text}</b><select data-i="${i}"><option value="">Selecciona...</option>${q.choices.map(c=>`<option>${c}</option>`).join("")}</select></div>`));
  }else if(q.type==="matching"){
    area.className="matchgrid";
    q.pairs.forEach((it,i)=>area.insertAdjacentHTML("beforeend",`<div class="matchrow"><b>${it.left}</b><select data-i="${i}"><option value="">Selecciona...</option>${q.choices.map(c=>`<option>${c}</option>`).join("")}</select></div>`));
  }else{
    area.className="";
    area.innerHTML=`<textarea id="textAnswer" placeholder="Escribe una respuesta completa y bien explicada."></textarea><div class="note">Mínimo recomendado: ${q.minChars||60} caracteres.</div>`;
  }
  $("#prevBtn").disabled=index===0;
  $("#nextBtn").textContent=index===Q.length-1?"Finalizar evaluación":"Siguiente";
}
function collect(){
  const q=Q[index];
  let v=null;
  if(q.type==="single") v=Number(document.querySelector('input[name="ans"]:checked')?.value);
  else if(q.type==="multi") v=[...document.querySelectorAll('input[name="ans"]:checked')].map(x=>Number(x.value)).sort((a,b)=>a-b);
  else if(q.type==="classify"||q.type==="matching") v=[...document.querySelectorAll("#answerArea select")].map(x=>x.value);
  else v=$("#textAnswer")?.value.trim()||"";
  answers[q.id]=v;
}
function restore(){
  const q=Q[index],v=answers[q.id];if(v===undefined)return;
  if(q.type==="single") document.querySelector(`input[name="ans"][value="${v}"]`)?.click();
  else if(q.type==="multi") v.forEach(i=>document.querySelector(`input[name="ans"][value="${i}"]`)?.click());
  else if(q.type==="classify"||q.type==="matching") [...document.querySelectorAll("#answerArea select")].forEach((x,i)=>x.value=v[i]||"");
  else $("#textAnswer").value=v||"";
}
function validateCurrent(){
  collect();const q=Q[index],v=answers[q.id];
  if(q.type==="single" && Number.isNaN(v)) return false;
  if(q.type==="multi" && (!v||!v.length)) return false;
  if((q.type==="classify"||q.type==="matching") && (!v||v.some(x=>!x))) return false;
  if(q.type==="text" && (!v||v.length<(q.minChars||40))) return false;
  return true;
}
function next(){
  $("#msg").textContent="";
  if(!validateCurrent()){ $("#msg").textContent="Completa esta pregunta antes de continuar.";return}
  if(index===Q.length-1){finish();return}
  index++;render();restore();
}
function prev(){collect();if(index>0){index--;render();restore()}}
function eqArr(a,b){return JSON.stringify([...a].sort())===JSON.stringify([...b].sort())}
function grade(){
  let autoEarned=0,autoMax=0,events=[];
  Q.forEach(q=>{
    const a=answers[q.id];let correct=null;
    if(q.type==="single"){correct=a===q.answer;autoMax+=q.points;if(correct)autoEarned+=q.points}
    else if(q.type==="multi"){correct=eqArr(a||[],q.answers||[]);autoMax+=q.points;if(correct)autoEarned+=q.points}
    else if(q.type==="classify"){correct=q.items.every((it,i)=>(a||[])[i]===it.answer);autoMax+=q.points;if(correct)autoEarned+=q.points}
    else if(q.type==="matching"){correct=q.pairs.every((it,i)=>(a||[])[i]===it.right);autoMax+=q.points;if(correct)autoEarned+=q.points}
    events.push({type:"answer",question:q.question,questionId:q.id,answer:a,correct,points:q.points,manual:q.type==="text"});
  });
  return {autoEarned,autoMax,events};
}
async function finish(){
  collect();
  const g=grade();
  const score10=Math.round(g.autoEarned*10)/10; // objective section = 8 points of final grade
  const accuracy=Math.round((g.autoEarned/g.autoMax)*100);
  $("#quiz").classList.add("hidden");$("#results").classList.remove("hidden");
  $("#rAuto").textContent=score10.toFixed(1).replace(".",",")+" / 8";
  $("#rAcc").textContent=accuracy+"%";
  $("#rManual").textContent="2 puntos";
  $("#rFinal").textContent="Pendiente";
  const payload={
    activityId:ACTIVITY_ID,activityTitle:ACTIVITY_TITLE,studentCode,group,
    startedAtIso:startedAt,finishedAtIso:new Date().toISOString(),finished:true,
    xp:Math.round(g.autoEarned*100),comboBest:0,
    correct:Math.round(g.autoEarned*100),answered:Q.length,
    accuracy,score10,stage:1,events:g.events
  };
  try{
    const r=await fetch(WORKER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!r.ok)throw new Error();
    $("#saveState").textContent="✓ Resultado y respuestas escritas registradas.";
    $("#saveState").className="message good";
  }catch{
    $("#saveState").textContent="⚠ No se pudo registrar el resultado.";
    $("#saveState").className="message bad";
  }
}
window.addEventListener("DOMContentLoaded",init);
