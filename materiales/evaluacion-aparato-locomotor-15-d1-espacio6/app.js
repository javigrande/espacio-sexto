
const BASE="https://espacio-sexto-resultados.javigr77.workers.dev";
const VALIDATE=BASE+"/api/student/validate";
const ATTEMPTS=BASE+"/api/attempts";
const ACTIVITY_ID="ccnn-evaluacion-aparato-locomotor-15-d1";
const ACTIVITY_TITLE="Evaluación · Aparato locomotor y sistema muscular";
const $=s=>document.querySelector(s);
let T=[],idx=0,autoPoints=0,autoCorrect=0,studentCode="",group="",started="",events=[],state={},locked=false;

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function norm(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function sameSet(a,b){return JSON.stringify([...a].sort((x,y)=>x-y))===JSON.stringify([...b].sort((x,y)=>x-y))}

async function init(){T=await fetch("tasks.json").then(r=>r.json());buildTabs();$("#identity").classList.remove("hidden")}
function buildTabs(){T.forEach((t,i)=>{const d=document.createElement("div");d.className="tab"+(t.type==="open"?" manual":"");d.id="tab"+i;d.textContent=t.n;$("#tabs").appendChild(d)})}

async function startEvaluation(){
 const code=String($("#studentCode").value||"").trim().toUpperCase().replace(/\s+/g,"");
 const g=$("#group").value,msg=$("#identityMsg");msg.textContent="";
 if(!code||!g){msg.textContent="Introduce tu código y selecciona el grupo.";return}
 $("#startBtn").disabled=true;msg.textContent="Comprobando código en D1…";
 try{
  const r=await fetch(VALIDATE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentCode:code,group:g})});
  let d={};try{d=await r.json()}catch{}
  if(!r.ok||!d.ok)throw Error(d.error||"Código no válido.");
  studentCode=d.studentCode||code;group=d.group||g;started=new Date().toISOString();
  $("#identity").classList.add("hidden");$("#game").classList.remove("hidden");render()
 }catch(e){msg.textContent=e.message||"No se pudo validar el código."}finally{$("#startBtn").disabled=false}
}

function render(){
 const t=T[idx];state={};locked=false;
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));$("#tab"+idx).classList.add("on");
 $("#badge").textContent=`Ejercicio ${t.n} / ${T.length}`;$("#taskTitle").textContent=t.title;$("#prompt").textContent=t.prompt;
 $("#typePill").textContent=typeName(t.type);$("#taskArea").innerHTML="";$("#feedback").textContent="";
 $("#checkBtn").disabled=false;$("#resetBtn").classList.remove("hidden");$("#nextBtn").classList.add("hidden");
 $("#editHint").textContent="Puedes cambiar tu respuesta antes de guardarla.";
 if(t.type==="match")renderMatch(t); if(t.type==="sequence")renderSequence(t); if(t.type==="choice")renderChoice(t);
 if(t.type==="multi")renderMulti(t); if(t.type==="fill")renderFill(t); if(t.type==="dropdown")renderDropdown(t);
 if(t.type==="drag")renderDrag(t); if(t.type==="imagechoice")renderImageChoice(t); if(t.type==="open")renderOpen(t);
 $("#progress").textContent=`${idx}/${T.length}`;$("#meterFill").style.width=(idx/T.length*100)+"%";side(t)
}
function typeName(x){return ({match:"RELACIONAR",sequence:"ORDENAR",choice:"ELECCIÓN SIMPLE",multi:"ELECCIÓN MÚLTIPLE",fill:"COMPLETAR",dropdown:"DESPLEGABLES",drag:"DRAG & DROP",imagechoice:"IDENTIFICACIÓN",open:"DESARROLLO"})[x]||x}
function side(t){$("#sideType").textContent=t.type==="open"?"Corrección manual":"Corrección automática";$("#sideText").textContent=t.type==="open"?"Respuesta breve guardada íntegramente en D1.":"Nivel medio-alto. No se muestra la solución durante la prueba.";$("#sideScore").textContent=`${autoCorrect}/11 automáticos`}

function renderChoice(t){
 state.selected=null;const g=document.createElement("div");g.className="answerGrid";
 shuffle(t.options.map((text,i)=>({text,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.text;b.onclick=()=>{if(locked)return;state.selected=o.i;[...g.children].forEach(z=>z.classList.remove("sel"));b.classList.add("sel")};g.appendChild(b)});$("#taskArea").appendChild(g)
}
function renderMulti(t){
 state.selected=[];const g=document.createElement("div");g.className="answerGrid";
 shuffle(t.options.map((text,i)=>({text,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.text;b.onclick=()=>{if(locked)return;const p=state.selected.indexOf(o.i);p>=0?state.selected.splice(p,1):state.selected.push(o.i);b.classList.toggle("sel")};g.appendChild(b)});$("#taskArea").appendChild(g)
}
function renderMatch(t){
 state.left=null;state.right=null;state.pairs=[];
 const w=document.createElement("div");w.className="match";const l=document.createElement("div"),r=document.createElement("div");l.className=r.className="col";
 shuffle(t.pairs.map((p,i)=>({text:p[0],i}))).forEach(o=>{const d=document.createElement("div");d.className="matchItem";d.textContent=o.text;d.dataset.i=o.i;d.onclick=()=>pickMatch("l",o.i,d);l.appendChild(d)});
 shuffle(t.pairs.map((p,i)=>({text:p[1],i}))).forEach(o=>{const d=document.createElement("div");d.className="matchItem right";d.textContent=o.text;d.dataset.i=o.i;d.onclick=()=>pickMatch("r",o.i,d);r.appendChild(d)});
 w.append(l,r);$("#taskArea").appendChild(w);const c=document.createElement("div");c.id="chosen";c.className="chosenPairs";$("#taskArea").appendChild(c);renderPairs()
}
function pickMatch(side,i,el){
 if(locked||el.classList.contains("paired"))return;
 if(side==="l"){if(state.left)state.left.el.classList.remove("sel");state.left={i,el}}else{if(state.right)state.right.el.classList.remove("sel");state.right={i,el}}
 el.classList.add("sel");
 if(state.left&&state.right){state.pairs.push({li:state.left.i,ri:state.right.i,lt:state.left.el.textContent,rt:state.right.el.textContent});state.left.el.classList.remove("sel");state.right.el.classList.remove("sel");state.left.el.classList.add("paired");state.right.el.classList.add("paired");state.left=state.right=null;renderPairs()}
}
function renderPairs(){const c=$("#chosen");if(!c)return;c.innerHTML=state.pairs.length?"<b>Tus relaciones</b>":"Selecciona una opción de cada columna. Puedes cambiar cualquier pareja antes de guardar.";state.pairs.forEach((p,i)=>{const d=document.createElement("div");d.className="chosenPair";d.innerHTML=`<span>${p.lt}</span><b>↔</b><span>${p.rt}</span>`;const b=document.createElement("button");b.className="unlinkBtn";b.textContent="Cambiar";b.onclick=()=>removePair(i);d.appendChild(b);c.appendChild(d)})}
function removePair(i){const p=state.pairs[i];document.querySelectorAll(".matchItem").forEach(el=>{const n=Number(el.dataset.i),right=el.classList.contains("right");if((!right&&n===p.li)||(right&&n===p.ri))el.classList.remove("paired","sel")});state.pairs.splice(i,1);renderPairs()}

function renderSequence(t){
 state.order=[];const s=document.createElement("div");s.className="sequenceSlots";s.id="slots";t.items.forEach((_,i)=>{const d=document.createElement("div");d.className="slot";d.textContent=i+1;s.appendChild(d)});
 const b=document.createElement("div");b.className="seqBank";shuffle(t.items).forEach(text=>{const x=document.createElement("button");x.className="answer";x.textContent=text;x.onclick=()=>{if(locked||x.classList.contains("used"))return;state.order.push(text);x.classList.add("used");refreshSeq()};b.appendChild(x)});$("#taskArea").append(s,b)
}
function refreshSeq(){[...$("#slots").children].forEach((x,i)=>x.textContent=state.order[i]||String(i+1))}
function renderFill(t){
 state.values=Array(t.answers.length).fill("");const box=document.createElement("div");box.className="fillBox";box.innerHTML=`<div>${t.sentence}</div>`;const ins=document.createElement("div");ins.className="fillInputs";t.answers.forEach((_,i)=>{const input=document.createElement("input");input.placeholder=`Hueco ${i+1}`;input.oninput=()=>state.values[i]=input.value;ins.appendChild(input)});box.appendChild(ins);$("#taskArea").appendChild(box)
}
function renderDropdown(t){
 state.values=Array(t.rows.length).fill("");const w=document.createElement("div");w.className="dropRows";
 t.rows.forEach((row,i)=>{const d=document.createElement("div");d.className="dropRow";const span=document.createElement("span");span.textContent=row.text;const sel=document.createElement("select");sel.innerHTML='<option value="">Elige…</option>'+shuffle(row.options).map(o=>`<option value="${o}">${o}</option>`).join("");sel.onchange=()=>state.values[i]=sel.value;d.append(span,sel);w.appendChild(d)});$("#taskArea").appendChild(w)
}
function renderDrag(t){
 state.placed={};state.selected=null;const bank=document.createElement("div");bank.className="bank";
 shuffle(t.items.map((x,i)=>({label:x[0],i}))).forEach(o=>{const c=document.createElement("div");c.className="chip";c.dataset.i=o.i;c.textContent=o.label;c.draggable=true;c.onclick=()=>selectChip(o.i,c);c.ondragstart=e=>e.dataTransfer.setData("text/plain",String(o.i));bank.appendChild(c)});
 const zones=document.createElement("div");zones.className="zones";
 shuffle(t.targets).forEach(target=>{const z=document.createElement("div");z.className="zone";z.innerHTML=`<h3>${target}</h3>`;z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();placeChip(Number(e.dataTransfer.getData("text/plain")),target,z)};z.onclick=()=>{if(state.selected!==null)placeChip(state.selected,target,z)};zones.appendChild(z)});
 $("#taskArea").append(bank,zones)
}
function selectChip(i,c){if(locked)return;state.selected=i;document.querySelectorAll(".chip").forEach(x=>x.classList.remove("selected"));c.classList.add("selected")}
function placeChip(i,target,z){if(locked||!Number.isInteger(i))return;state.placed[i]=target;const c=document.querySelector(`.chip[data-i="${i}"]`);if(c){c.classList.remove("selected");z.appendChild(c)}state.selected=null}
function renderImageChoice(t){
 state.selected=null;const wrap=document.createElement("div");wrap.className="imageQ";const iw=document.createElement("div");iw.className="imageWrap";iw.innerHTML=`<img src="${t.image}" alt="Imagen anatómica"><div class="hotspot" style="left:${t.hotspot.x}%;top:${t.hotspot.y}%"></div>`;
 const g=document.createElement("div");g.className="answerGrid";shuffle(t.options.map((text,i)=>({text,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.text;b.onclick=()=>{if(locked)return;state.selected=o.i;[...g.children].forEach(x=>x.classList.remove("sel"));b.classList.add("sel")};g.appendChild(b)});wrap.append(iw,g);$("#taskArea").appendChild(wrap)
}
function renderOpen(t){
 state.text="";const box=document.createElement("div");box.className="openBox";box.innerHTML=`<div class="rubric"><b>Criterio de corrección:</b> ${t.rubric}</div>`;const ta=document.createElement("textarea");ta.placeholder="Escribe un párrafo breve y claro.";const count=document.createElement("div");count.className="counter";count.textContent=`0 caracteres · mínimo recomendado ${t.minChars}`;ta.oninput=()=>{state.text=ta.value;count.textContent=`${ta.value.length} caracteres · mínimo recomendado ${t.minChars}`};box.append(ta,count);$("#taskArea").appendChild(box)
}

function resetCurrent(){if(locked)return;render()}
function check(){
 const t=T[idx];let answer=null,expected=null,ok=null;
 if(t.type==="choice"||t.type==="imagechoice"){answer=state.selected;expected=t.correct;ok=answer===expected}
 if(t.type==="multi"){answer=state.selected||[];expected=t.correct;ok=sameSet(answer,expected)}
 if(t.type==="match"){answer=state.pairs||[];expected=t.pairs.map((_,i)=>({li:i,ri:i}));ok=answer.length===t.pairs.length&&answer.every(p=>p.li===p.ri)&&new Set(answer.map(p=>p.li)).size===t.pairs.length}
 if(t.type==="sequence"){answer=state.order||[];expected=t.items;ok=JSON.stringify(answer)===JSON.stringify(expected)}
 if(t.type==="fill"){answer=state.values||[];expected=t.answers;ok=t.answers.every((a,i)=>norm(answer[i])===norm(a))}
 if(t.type==="dropdown"){answer=state.values||[];expected=t.rows.map(r=>r.answer);ok=expected.every((a,i)=>answer[i]===a)}
 if(t.type==="drag"){answer=state.placed;expected=t.items.map(x=>x[1]);ok=t.items.every((x,i)=>state.placed[i]===x[1])}
 if(t.type==="open"){answer=(state.text||"").trim();expected=t.rubric;if(answer.length<t.minChars){$("#feedback").textContent="Amplía un poco la respuesta antes de guardarla.";$("#feedback").className="feedback bad";return}ok=null}
 if(t.type!=="open"&&(answer===null||answer===undefined)){$("#feedback").textContent="Completa la respuesta antes de guardarla.";$("#feedback").className="feedback bad";return}
 if(ok===true){autoCorrect++;autoPoints+=Number(t.points||0)}
 events.push({questionNumber:t.n,type:t.type,title:t.title,question:t.prompt,answer,expected,correct:ok,points:t.points,manualReview:t.type==="open",rubric:t.rubric||null});
 locked=true;$("#tab"+idx).classList.add("done");$("#feedback").textContent=t.type==="open"?"Respuesta guardada para corrección manual.":"Respuesta guardada.";$("#feedback").className="feedback good";$("#checkBtn").disabled=true;$("#resetBtn").classList.add("hidden");$("#nextBtn").classList.remove("hidden");$("#editHint").textContent="Respuesta guardada. Ya puedes pasar al siguiente ejercicio.";$("#taskArea").querySelectorAll("button,input,select,textarea,.chip,.matchItem,.zone").forEach(el=>{if("disabled" in el)el.disabled=true;el.style.pointerEvents="none"});side(t)
}
function nextTask(){idx++;if(idx>=T.length){finish();return}render()}

async function finish(){
 $("#game").classList.add("hidden");$("#result").classList.remove("hidden");$("#progress").textContent="15/15";$("#meterFill").style.width="100%";
 const provisional=Math.round(autoPoints*100)/100;$("#rAuto").textContent=provisional.toFixed(2).replace(".",",")+" / 7";$("#rManual").textContent="4 pendientes";$("#rScore").textContent=provisional.toFixed(2).replace(".",",")+" / 10";$("#rState").textContent="Pendiente";
 const payload={activityId:ACTIVITY_ID,activityTitle:ACTIVITY_TITLE,studentCode,group,startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,xp:autoCorrect*120,comboBest:0,correct:autoCorrect,answered:15,accuracy:Math.round(autoCorrect/11*100),score10:provisional,stage:15,requiresManualReview:true,manualPending:4,manualPendingPoints:3,autoScoreMax:7,events};
 await send(payload)
}
async function send(payload){
 const s=$("#saveState");s.textContent="Guardando evaluación en D1…";
 try{const key=`attempt_${ACTIVITY_ID}_${studentCode}_${started}`;if(sessionStorage.getItem(key)==="sent"){s.textContent="✓ Evaluación ya registrada";return}const r=await fetch(ATTEMPTS,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||"No se pudo guardar");sessionStorage.setItem(key,"sent");s.textContent="✓ Evaluación registrada. Las 4 preguntas abiertas quedan pendientes de corrección manual.";s.className="feedback good"}catch(e){window._pending=payload;s.textContent="No se pudo guardar. No cierres esta página y avisa al profesor.";s.className="feedback bad";$("#retryBtn").classList.remove("hidden")}
}
function retrySend(){if(window._pending)send(window._pending)}
window.addEventListener("DOMContentLoaded",init);
