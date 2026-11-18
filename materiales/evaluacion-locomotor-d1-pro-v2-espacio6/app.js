
const BASE="https://espacio-sexto-resultados.javigr77.workers.dev";
const VALIDATE=BASE+"/api/student/validate";
const ATTEMPTS=BASE+"/api/attempts";
const ACTIVITY_ID="ccnn-evaluacion-locomotor-medio-alto-d1";
const ACTIVITY_TITLE="Evaluación · Aparato locomotor y sistema muscular";
const $=s=>document.querySelector(s);
let T=[],idx=0,autoCorrect=0,studentCode="",group="",started="",events=[],state={};

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function norm(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function arrEq(a,b){return JSON.stringify([...a].sort((x,y)=>x-y))===JSON.stringify([...b].sort((x,y)=>x-y))}

async function init(){T=await fetch("tasks.json").then(r=>r.json());buildTabs();$("#identity").classList.remove("hidden")}
function buildTabs(){const w=$("#tabs");T.forEach((t,i)=>{const d=document.createElement("div");d.className="tab"+(t.type==="open"?" open":"");d.id="tab"+i;d.textContent=t.n;w.appendChild(d)})}

async function startEvaluation(){
 const code=String($("#studentCode").value||"").trim().toUpperCase().replace(/\s+/g,"");
 const g=$("#group").value, msg=$("#identityMsg");
 msg.textContent="";
 if(!code||!g){msg.textContent="Introduce código y grupo.";return}
 const b=$("#startBtn");b.disabled=true;msg.textContent="Comprobando código en D1…";
 try{
  const r=await fetch(VALIDATE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentCode:code,group:g})});
  let d={};try{d=await r.json()}catch{}
  if(!r.ok||!d.ok)throw new Error(d.error||"Código no válido.");
  studentCode=d.studentCode||code;group=d.group||g;started=new Date().toISOString();
  $("#identity").classList.add("hidden");$("#game").classList.remove("hidden");render();
 }catch(e){msg.textContent=e.message||"No se pudo validar el alumno."}finally{b.disabled=false}
}

function render(){
 const t=T[idx];state={};
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));$("#tab"+idx).classList.add("on");
 $("#badge").textContent="Ejercicio "+t.n+" / 10";$("#taskTitle").textContent=t.title;$("#prompt").textContent=t.prompt;
 $("#typePill").textContent=t.type==="open"?"DESARROLLO":t.type==="match"?"RELACIONAR":t.type==="sort"?"CLASIFICAR":t.type==="multi"?"SELECCIÓN MÚLTIPLE":t.type==="sequence"?"ORDENAR":"ELECCIÓN";
 $("#taskArea").innerHTML="";$("#feedback").textContent="";$("#nextBtn").classList.add("hidden");$("#checkBtn").disabled=false;
 if(t.type==="choice")choice(t); if(t.type==="multi")multi(t); if(t.type==="match")match(t); if(t.type==="sort")sortTask(t); if(t.type==="sequence")sequence(t); if(t.type==="open")openTask(t);
 $("#progress").textContent=(idx+1)+"/10";$("#meterFill").style.width=((idx)/10*100)+"%";sideInfo(t);
}
function sideInfo(t){
 $("#sideType").textContent=t.type==="open"?"Respuesta abierta · 1 punto":"Autocorregible · 1 punto";
 $("#sideStatus").textContent=t.type==="open"?"Se guarda íntegra en D1 para revisión del profesor.":"No se muestra la solución durante la evaluación.";
 $("#sideScore").textContent=autoCorrect+"/7 automáticos";
}
function choice(t){state.selected=null;const g=document.createElement("div");g.className="answerGrid";shuffle(t.options.map((x,i)=>({x,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.x;b.onclick=()=>{state.selected=o.i;[...g.children].forEach(z=>z.classList.remove("sel"));b.classList.add("sel")};g.appendChild(b)});$("#taskArea").appendChild(g)}
function multi(t){state.selected=[];const g=document.createElement("div");g.className="answerGrid";shuffle(t.options.map((x,i)=>({x,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.x;b.onclick=()=>{const p=state.selected.indexOf(o.i);p>=0?state.selected.splice(p,1):state.selected.push(o.i);b.classList.toggle("sel")};g.appendChild(b)});$("#taskArea").appendChild(g)}
function match(t){
 state.left=null;state.right=null;state.done=[];
 const w=document.createElement("div");w.className="match";const l=document.createElement("div"),r=document.createElement("div");l.className=r.className="col";
 shuffle(t.pairs.map((p,i)=>({text:p[0],i}))).forEach(o=>{const d=document.createElement("div");d.className="matchItem";d.textContent=o.text;d.onclick=()=>pick("l",o.i,d);l.appendChild(d)});
 shuffle(t.pairs.map((p,i)=>({text:p[1],i}))).forEach(o=>{const d=document.createElement("div");d.className="matchItem right";d.textContent=o.text;d.onclick=()=>pick("r",o.i,d);r.appendChild(d)});
 w.append(l,r);$("#taskArea").appendChild(w)
}
function pick(side,i,el){
 if(el.classList.contains("done"))return;
 if(side==="l"){if(state.left)state.left.el.classList.remove("sel");state.left={i,el}}else{if(state.right)state.right.el.classList.remove("sel");state.right={i,el}}
 el.classList.add("sel");
 if(state.left&&state.right){
  if(state.left.i===state.right.i){state.done.push(state.left.i);state.left.el.classList.add("done");state.right.el.classList.add("done")}
  state.left.el.classList.remove("sel");state.right.el.classList.remove("sel");state.left=state.right=null;
 }
}
function sortTask(t){
 state.placed={};state.selected=null;
 const bank=document.createElement("div");bank.className="bank";
 shuffle(t.items.map((x,i)=>({label:x[0],i}))).forEach(o=>{
  const c=document.createElement("div");c.className="chip";c.textContent=o.label;c.dataset.i=o.i;
  c.onclick=()=>{state.selected=o.i;document.querySelectorAll(".chip").forEach(x=>x.style.outline="");c.style.outline="4px solid #394dc5"};
  bank.appendChild(c)
 });
 const zones=document.createElement("div");zones.className="zones";
 shuffle(t.targets).forEach(target=>{
  const z=document.createElement("div");z.className="zone";z.innerHTML="<h3>"+target+"</h3>";
  z.onclick=()=>{if(state.selected===null)return;state.placed[state.selected]=target;const c=document.querySelector('.chip[data-i="'+state.selected+'"]');if(c){c.classList.add("used");z.appendChild(c)}state.selected=null};
  zones.appendChild(z)
 });
 $("#taskArea").append(bank,zones)
}
function sequence(t){
 state.order=[];
 const slots=document.createElement("div");slots.className="sequenceSlots";slots.id="slots";
 for(let i=0;i<t.items.length;i++){const s=document.createElement("div");s.className="slot";s.textContent=i+1;slots.appendChild(s)}
 const bank=document.createElement("div");bank.className="seqBank";
 shuffle(t.items).forEach(label=>{
  const b=document.createElement("button");b.className="answer";b.textContent=label;
  b.onclick=()=>{if(b.classList.contains("used"))return;state.order.push(label);b.classList.add("used");refreshSeq()};
  bank.appendChild(b)
 });
 $("#taskArea").append(slots,bank)
}
function refreshSeq(){[...$("#slots").children].forEach((s,i)=>s.textContent=state.order[i]||String(i+1))}
function openTask(t){
 state.text="";const box=document.createElement("div");box.className="openBox";
 const rubric=document.createElement("div");rubric.className="rubric";rubric.innerHTML="<b>Criterio de corrección:</b> "+t.rubric;
 const ta=document.createElement("textarea");ta.placeholder="Desarrolla tu respuesta con vocabulario científico y oraciones completas.";ta.maxLength=1800;
 const count=document.createElement("div");count.className="counter";count.textContent="0 caracteres · mínimo recomendado "+t.minChars;
 ta.oninput=()=>{state.text=ta.value;count.textContent=ta.value.length+" caracteres · mínimo recomendado "+t.minChars};
 box.append(rubric,ta,count);$("#taskArea").appendChild(box)
}
function check(){
 const t=T[idx];let ok=null,answer=null,expected=null;
 if(t.type==="choice"){answer=state.selected;expected=t.correct;ok=answer===expected}
 if(t.type==="multi"){answer=state.selected||[];expected=t.correct;ok=arrEq(answer,expected)}
 if(t.type==="match"){answer=[...new Set(state.done)].sort((a,b)=>a-b);expected=t.pairs.map((_,i)=>i);ok=JSON.stringify(answer)===JSON.stringify(expected)}
 if(t.type==="sort"){answer=state.placed;expected=t.items.map(x=>x[1]);ok=t.items.every((it,i)=>state.placed[i]===it[1])}
 if(t.type==="sequence"){answer=state.order;expected=t.items;ok=JSON.stringify(answer)===JSON.stringify(expected)}
 if(t.type==="open"){
  answer=(state.text||"").trim();expected=t.rubric;
  if(answer.length<t.minChars){$("#feedback").textContent="Tu respuesta es demasiado breve para una pregunta de desarrollo. Amplíala antes de continuar.";$("#feedback").className="feedback bad";return}
  ok=null;
 }
 if(ok===true)autoCorrect++;
 events.push({questionNumber:t.n,type:t.type,title:t.title,question:t.prompt,answer,expected,correct:ok,points:t.points,manualReview:t.type==="open",rubric:t.rubric||null});
 $("#tab"+idx).classList.add("done");
 $("#feedback").textContent=t.type==="open"?"Respuesta guardada para corrección manual.":"Respuesta registrada.";
 $("#checkBtn").disabled=true;$("#nextBtn").classList.remove("hidden");sideInfo(t)
}
function nextTask(){idx++;if(idx>=T.length){finish();return}render()}
async function finish(){
 $("#game").classList.add("hidden");$("#result").classList.remove("hidden");$("#meterFill").style.width="100%";$("#progress").textContent="10/10";
 const autoPoints=autoCorrect; // 7 ejercicios automáticos = máximo 7 puntos
 $("#rAuto").textContent=autoPoints+"/7";$("#rOpen").textContent="3 pendientes";$("#rProvisional").textContent=autoPoints.toFixed(1).replace(".",",")+" / 10";$("#rStatus").textContent="Pendiente de corrección";
 const payload={
  activityId:ACTIVITY_ID,activityTitle:ACTIVITY_TITLE,studentCode,group,
  startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,
  correct:autoCorrect,answered:10,accuracy:Math.round(autoCorrect/7*100),
  score10:autoPoints,xp:autoCorrect*150,comboBest:0,stage:10,
  requiresManualReview:true,manualPending:3,manualPendingPoints:3,autoScoreMax:7,
  events
 };
 await send(payload)
}
async function send(payload){
 const s=$("#saveState");s.textContent="Guardando evaluación en D1…";
 try{
  const key="attempt_"+ACTIVITY_ID+"_"+studentCode+"_"+started;
  if(sessionStorage.getItem(key)==="sent"){s.textContent="✓ Evaluación ya registrada";return}
  const r=await fetch(ATTEMPTS,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  let d={};try{d=await r.json()}catch{}
  if(!r.ok)throw new Error(d.error||"No se pudo guardar");
  sessionStorage.setItem(key,"sent");s.textContent="✓ Evaluación registrada. Las 3 respuestas de desarrollo quedan pendientes de corrección.";s.className="feedback good"
 }catch(e){window._pending=payload;s.textContent="No se pudo guardar. No cierres la página y avisa al profesor.";s.className="feedback bad";$("#retry").classList.remove("hidden")}
}
function retrySend(){if(window._pending)send(window._pending)}
window.addEventListener("DOMContentLoaded",init);
