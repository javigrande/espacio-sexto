
const BASE="https://espacio-sexto-resultados.javigr77.workers.dev";
const VALIDATE=BASE+"/api/student/validate";
const ATTEMPTS=BASE+"/api/attempts";
const ACTIVITY_ID="ccnn-el-aparato-locomotor-evaluacion-v4-navegable";
const ACTIVITY_TITLE="EL APARATO LOCOMOTOR: EVALUACIÓN";
const $=s=>document.querySelector(s);
let T=[],idx=0,studentCode="",group="",started="",answers={},sent=false;

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function norm(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function sameSet(a,b){return JSON.stringify([...a].sort((x,y)=>x-y))===JSON.stringify([...b].sort((x,y)=>x-y))}

async function init(){
 T=await fetch("tasks.json").then(r=>r.json());
 buildTabs();
 $("#identity").classList.remove("hidden");
}

function buildTabs(){
 const w=$("#tabs");w.innerHTML="";
 T.forEach((t,i)=>{
   const d=document.createElement("button");
   d.type="button";
   d.className="tab"+(t.type==="open"?" manual":"");
   d.id="tab"+i;
   d.textContent=t.n;
   d.title="Ir al ejercicio "+t.n;
   d.onclick=()=>goToQuestion(i);
   w.appendChild(d);
 });
}

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
  $("#identity").classList.add("hidden");
  $("#game").classList.remove("hidden");
  idx=0;answers={};sent=false;
  render();
 }catch(e){msg.textContent=e.message||"No se pudo validar el código."}
 finally{$("#startBtn").disabled=false}
}

function cloneState(v){
 try{return JSON.parse(JSON.stringify(v))}catch{return {}}
}

function currentSaved(){return answers[idx]||null}

function saveDraft(){
 const t=T[idx];
 if(t.type==="open"){
   const ta=$("#taskArea textarea");
   if(ta) state.text=ta.value;
 }
 answers[idx]={state:cloneState(state),savedAt:new Date().toISOString()};
 updateTabs();
 updateReviewStatus();
}

function goToQuestion(newIndex){
 if(newIndex<0||newIndex>=T.length)return;
 saveDraft();
 idx=newIndex;
 render();
}

function render(){
 const t=T[idx];
 const saved=currentSaved();
 state=saved?cloneState(saved.state):{};

 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));
 $("#tab"+idx).classList.add("on");

 $("#badge").textContent=`Ejercicio ${t.n} / ${T.length}`;
 $("#taskTitle").textContent=t.title;
 $("#prompt").textContent=t.prompt;
 $("#typePill").textContent=typeName(t.type);
 $("#taskArea").innerHTML="";
 $("#feedback").textContent="";

 if(t.type==="match")renderMatch(t);
 if(t.type==="sequence")renderSequence(t);
 if(t.type==="choice")renderChoice(t);
 if(t.type==="multi")renderMulti(t);
 if(t.type==="fill")renderFill(t);
 if(t.type==="dropdown")renderDropdown(t);
 if(t.type==="drag")renderDrag(t);
 if(t.type==="imagechoice")renderImageChoice(t);
 if(t.type==="open")renderOpen(t);

 $("#prevBtn").disabled=idx===0;
 $("#nextNavBtn").textContent=idx===T.length-1?"Ir a revisión":"Siguiente →";
 $("#progress").textContent=`${Object.keys(answers).length}/${T.length}`;
 $("#meterFill").style.width=(Object.keys(answers).length/T.length*100)+"%";
 $("#editHint").textContent="Puedes navegar por la prueba y modificar cualquier respuesta antes de enviarla.";
 updateTabs();
 updateReviewStatus();
 side(t);
}

function typeName(x){
 return ({match:"RELACIONAR",sequence:"ORDENAR",choice:"ELECCIÓN SIMPLE",multi:"ELECCIÓN MÚLTIPLE",fill:"COMPLETAR",dropdown:"DESPLEGABLES",drag:"DRAG & DROP",imagechoice:"IDENTIFICACIÓN",open:"DESARROLLO"})[x]||x
}

function side(t){
 $("#sideType").textContent=t.type==="open"?"Corrección manual":"Corrección automática";
 $("#sideText").textContent=t.type==="open"?"Respuesta breve. Podrás revisarla antes de entregar.":"Nivel medio-alto. Puedes volver a este ejercicio cuando quieras.";
 const count=Object.keys(answers).length;
 $("#sideScore").textContent=`${count}/${T.length} con respuesta guardada`;
}

function updateTabs(){
 T.forEach((t,i)=>{
   const el=$("#tab"+i);if(!el)return;
   el.classList.toggle("done",!!answers[i]);
 });
 $("#tab"+idx)?.classList.add("on");
}

function updateReviewStatus(){
 const done=Object.keys(answers).length;
 const pending=T.length-done;
 const el=$("#reviewStatus");
 if(el)el.textContent=pending?`${done} contestadas · ${pending} pendientes`:`${done}/${T.length} contestadas · lista para entregar`;
}

function prevQuestion(){
 saveDraft();
 if(idx>0){idx--;render()}
}

function nextQuestion(){
 saveDraft();
 if(idx<T.length-1){idx++;render()}
 else showReview();
}

function typeHasAnswer(t,s){
 if(!s)return false;
 if(t.type==="choice"||t.type==="imagechoice")return s.selected!==null&&s.selected!==undefined;
 if(t.type==="multi")return Array.isArray(s.selected)&&s.selected.length>0;
 if(t.type==="match")return Array.isArray(s.pairs)&&s.pairs.length===t.pairs.length;
 if(t.type==="sequence")return Array.isArray(s.order)&&s.order.length===t.items.length;
 if(t.type==="fill")return Array.isArray(s.values)&&s.values.length===t.answers.length&&s.values.every(v=>String(v||"").trim());
 if(t.type==="dropdown")return Array.isArray(s.values)&&s.values.length===t.rows.length&&s.values.every(v=>String(v||"").trim());
 if(t.type==="drag")return s.placed&&Object.keys(s.placed).length===t.items.length;
 if(t.type==="open")return String(s.text||"").trim().length>=t.minChars;
 return false;
}

function showReview(){
 saveDraft();
 $("#game").classList.add("hidden");
 $("#review").classList.remove("hidden");
 const list=$("#reviewList");list.innerHTML="";
 let complete=0;
 T.forEach((t,i)=>{
   const s=answers[i]?.state;
   const ok=typeHasAnswer(t,s);
   if(ok)complete++;
   const row=document.createElement("button");
   row.type="button";
   row.className="reviewItem "+(ok?"ready":"pending");
   row.innerHTML=`<span class="reviewNum">${t.n}</span><span><b>${t.title}</b><small>${ok?"Respuesta preparada":"Falta completar"}</small></span><span class="reviewMark">${ok?"✓":"!"}</span>`;
   row.onclick=()=>{idx=i;$("#review").classList.add("hidden");$("#game").classList.remove("hidden");render()};
   list.appendChild(row);
 });
 $("#reviewCount").textContent=`${complete}/${T.length} ejercicios completos`;
 $("#sendBtn").disabled=complete!==T.length||sent;
 $("#reviewWarning").textContent=complete===T.length
   ?"Todo está contestado. Puedes volver a cualquier pregunta o enviar definitivamente la evaluación."
   :"Todavía hay ejercicios incompletos. Tócalos para volver y terminarlos.";
}

function backToQuestions(){
 $("#review").classList.add("hidden");
 $("#game").classList.remove("hidden");
 render();
}

function renderChoice(t){
 state.selected=(state.selected??null);const g=document.createElement("div");g.className="answerGrid";
 shuffle(t.options.map((text,i)=>({text,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.text;if(state.selected===o.i)b.classList.add("sel");b.onclick=()=>{state.selected=o.i;[...g.children].forEach(z=>z.classList.remove("sel"));b.classList.add("sel");saveDraft()};g.appendChild(b)});$("#taskArea").appendChild(g)
}
function renderMulti(t){
 state.selected=Array.isArray(state.selected)?state.selected:[];const g=document.createElement("div");g.className="answerGrid";
 shuffle(t.options.map((text,i)=>({text,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.text;if(state.selected.includes(o.i))b.classList.add("sel");b.onclick=()=>{const p=state.selected.indexOf(o.i);p>=0?state.selected.splice(p,1):state.selected.push(o.i);b.classList.toggle("sel");saveDraft()};g.appendChild(b)});$("#taskArea").appendChild(g)
}
function renderMatch(t){
 state.left=null;state.right=null;
 state.pairs=Array.isArray(state.pairs)?state.pairs:[];
 const w=document.createElement("div");w.className="match";
 const l=document.createElement("div"),r=document.createElement("div");l.className=r.className="col";

 shuffle(t.pairs.map((p,i)=>({text:p[0],i}))).forEach(o=>{
   const d=document.createElement("div");d.className="matchItem";d.textContent=o.text;d.dataset.i=o.i;
   if(state.pairs.some(p=>p.li===o.i))d.classList.add("paired");
   d.onclick=()=>pickMatch("l",o.i,d);l.appendChild(d)
 });
 shuffle(t.pairs.map((p,i)=>({text:p[1],i}))).forEach(o=>{
   const d=document.createElement("div");d.className="matchItem right";d.textContent=o.text;d.dataset.i=o.i;
   if(state.pairs.some(p=>p.ri===o.i))d.classList.add("paired");
   d.onclick=()=>pickMatch("r",o.i,d);r.appendChild(d)
 });

 w.append(l,r);$("#taskArea").appendChild(w);
 const c=document.createElement("div");c.id="chosen";c.className="chosenPairs";$("#taskArea").appendChild(c);renderPairs()
}
function pickMatch(side,i,el){
 if(el.classList.contains("paired"))return;
 if(side==="l"){if(state.left)state.left.el.classList.remove("sel");state.left={i,el}}
 else{if(state.right)state.right.el.classList.remove("sel");state.right={i,el}}
 el.classList.add("sel");
 if(state.left&&state.right){
   state.pairs.push({li:state.left.i,ri:state.right.i,lt:state.left.el.textContent,rt:state.right.el.textContent});
   state.left.el.classList.remove("sel");state.right.el.classList.remove("sel");
   state.left.el.classList.add("paired");state.right.el.classList.add("paired");
   state.left=state.right=null;renderPairs();saveDraft()
 }
}
function renderPairs(){
 const c=$("#chosen");if(!c)return;
 c.innerHTML=state.pairs.length?"<b>Tus relaciones</b>":"Selecciona una opción de cada columna. Puedes cambiar cualquier pareja.";
 state.pairs.forEach((p,i)=>{
   const d=document.createElement("div");d.className="chosenPair";
   d.innerHTML=`<span>${p.lt}</span><b>↔</b><span>${p.rt}</span>`;
   const b=document.createElement("button");b.className="unlinkBtn";b.textContent="Cambiar";
   b.onclick=()=>removePair(i);d.appendChild(b);c.appendChild(d)
 })
}
function removePair(i){
 const p=state.pairs[i];
 document.querySelectorAll(".matchItem").forEach(el=>{
   const n=Number(el.dataset.i),right=el.classList.contains("right");
   if((!right&&n===p.li)||(right&&n===p.ri))el.classList.remove("paired","sel")
 });
 state.pairs.splice(i,1);renderPairs();saveDraft()
}

function renderSequence(t){
 state.order=Array.isArray(state.order)?state.order:[];
 const s=document.createElement("div");s.className="sequenceSlots";s.id="slots";
 t.items.forEach((_,i)=>{const d=document.createElement("div");d.className="slot";d.textContent=state.order[i]||String(i+1);s.appendChild(d)});
 const b=document.createElement("div");b.className="seqBank";
 shuffle(t.items).forEach(text=>{
   const x=document.createElement("button");x.className="answer";x.textContent=text;
   if(state.order.includes(text))x.classList.add("used");
   x.onclick=()=>{if(x.classList.contains("used"))return;state.order.push(text);x.classList.add("used");refreshSeq();saveDraft()};
   b.appendChild(x)
 });
 const reset=document.createElement("button");reset.className="btn secondary compact";reset.textContent="Rehacer orden";
 reset.onclick=()=>{state.order=[];saveDraft();render()};
 $("#taskArea").append(s,b,reset)
}
function refreshSeq(){[...$("#slots").children].forEach((x,i)=>x.textContent=state.order[i]||String(i+1))}

function renderFill(t){
 state.values=Array.isArray(state.values)?state.values:Array(t.answers.length).fill("");
 const box=document.createElement("div");box.className="fillBox";box.innerHTML=`<div>${t.sentence}</div>`;
 const ins=document.createElement("div");ins.className="fillInputs";
 t.answers.forEach((_,i)=>{
   const input=document.createElement("input");input.placeholder=`Hueco ${i+1}`;input.value=state.values[i]||"";
   input.oninput=()=>{state.values[i]=input.value;saveDraft()};ins.appendChild(input)
 });
 box.appendChild(ins);$("#taskArea").appendChild(box)
}
function renderDropdown(t){
 state.values=Array.isArray(state.values)?state.values:Array(t.rows.length).fill("");
 const w=document.createElement("div");w.className="dropRows";
 t.rows.forEach((row,i)=>{
   const d=document.createElement("div");d.className="dropRow";const span=document.createElement("span");span.textContent=row.text;
   const sel=document.createElement("select");
   sel.innerHTML='<option value="">Elige…</option>'+shuffle(row.options).map(o=>`<option value="${o}">${o}</option>`).join("");
   sel.value=state.values[i]||"";
   sel.onchange=()=>{state.values[i]=sel.value;saveDraft()};d.append(span,sel);w.appendChild(d)
 });
 $("#taskArea").appendChild(w)
}
function renderDrag(t){
 state.placed=state.placed||{};state.selected=null;
 const bank=document.createElement("div");bank.className="bank";
 const chips={};

 shuffle(t.items.map((x,i)=>({label:x[0],i}))).forEach(o=>{
   const c=document.createElement("div");c.className="chip";c.dataset.i=o.i;c.textContent=o.label;c.draggable=true;
   c.onclick=()=>selectChip(o.i,c);c.ondragstart=e=>e.dataTransfer.setData("text/plain",String(o.i));chips[o.i]=c;
   bank.appendChild(c)
 });
 const zones=document.createElement("div");zones.className="zones";const zoneMap={};
 shuffle(t.targets).forEach(target=>{
   const z=document.createElement("div");z.className="zone";z.innerHTML=`<h3>${target}</h3>`;
   z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();placeChip(Number(e.dataTransfer.getData("text/plain")),target,z)};
   z.onclick=()=>{if(state.selected!==null)placeChip(state.selected,target,z)};zoneMap[target]=z;zones.appendChild(z)
 });
 $("#taskArea").append(bank,zones);
 Object.entries(state.placed).forEach(([i,target])=>{if(chips[i]&&zoneMap[target])zoneMap[target].appendChild(chips[i])})
}
function selectChip(i,c){
 state.selected=i;document.querySelectorAll(".chip").forEach(x=>x.classList.remove("selected"));c.classList.add("selected")
}
function placeChip(i,target,z){
 if(!Number.isInteger(i))return;state.placed[i]=target;const c=document.querySelector(`.chip[data-i="${i}"]`);
 if(c){c.classList.remove("selected");z.appendChild(c)}state.selected=null;saveDraft()
}
function renderImageChoice(t){
 state.selected=(state.selected??null);
 const wrap=document.createElement("div");wrap.className="imageQ";
 const left=document.createElement("div");left.className="imageLeft";
 const iw=document.createElement("div");iw.className="imageWrap";
 const cx=(t.callout&&t.callout.x)||Math.min(88,t.hotspot.x+18);
 const cy=(t.callout&&t.callout.y)||Math.max(12,t.hotspot.y-14);
 iw.innerHTML=`<img src="${t.image}" alt="Imagen anatómica"><div class="hotspot precise" style="left:${t.hotspot.x}%;top:${t.hotspot.y}%"><span class="dot"></span><span class="ring"></span><span class="cross h"></span><span class="cross v"></span></div><div class="callout-line" style="left:${t.hotspot.x}%;top:${t.hotspot.y}%;width:${Math.hypot(cx-t.hotspot.x,cy-t.hotspot.y)}%;transform:translateY(-50%) rotate(${Math.atan2(cy-t.hotspot.y,cx-t.hotspot.x)}rad);"></div><div class="callout-badge" style="left:${cx}%;top:${cy}%">PUNTO EXACTO</div>`;
 const zoom=document.createElement("div");zoom.className="zoomCard";
 zoom.innerHTML=`<div class="zoomView" style="background-image:url('${t.image}');background-position:${t.hotspot.x}% ${t.hotspot.y}%"></div><div class="zoomCaption">Detalle ampliado de la zona señalada</div>`;
 left.append(iw,zoom);
 const g=document.createElement("div");g.className="answerGrid";
 shuffle(t.options.map((text,i)=>({text,i}))).forEach(o=>{const b=document.createElement("button");b.className="answer";b.textContent=o.text;if(state.selected===o.i)b.classList.add("sel");b.onclick=()=>{state.selected=o.i;[...g.children].forEach(x=>x.classList.remove("sel"));b.classList.add("sel");saveDraft()};g.appendChild(b)});
 wrap.append(left,g);$("#taskArea").appendChild(wrap)
}
function renderOpen(t){
 state.text=String(state.text||"");
 const box=document.createElement("div");box.className="openBox";
 const help=document.createElement("div");help.className="note";help.style.marginBottom="10px";
 help.textContent="Escribe un párrafo breve y claro. Podrás volver y modificarlo antes de enviar.";
 const ta=document.createElement("textarea");ta.placeholder="Escribe aquí tu respuesta.";ta.value=state.text;
 const count=document.createElement("div");count.className="counter";
 count.textContent=`${ta.value.length} caracteres · mínimo recomendado ${t.minChars}`;
 ta.oninput=()=>{state.text=ta.value;count.textContent=`${ta.value.length} caracteres · mínimo recomendado ${t.minChars}`;saveDraft()};
 box.append(help,ta,count);$("#taskArea").appendChild(box)
}

function buildEventsAndScore(){
 const events=[];let autoCorrect=0,autoPoints=0;
 T.forEach((t,i)=>{
   const s=answers[i]?.state||{};
   let answer=null,expected=null,ok=null;

   if(t.type==="choice"||t.type==="imagechoice"){answer=s.selected;expected=t.correct;ok=answer===expected}
   if(t.type==="multi"){answer=s.selected||[];expected=t.correct;ok=sameSet(answer,expected)}
   if(t.type==="match"){answer=s.pairs||[];expected=t.pairs.map((_,j)=>({li:j,ri:j}));ok=answer.length===t.pairs.length&&answer.every(p=>p.li===p.ri)&&new Set(answer.map(p=>p.li)).size===t.pairs.length}
   if(t.type==="sequence"){answer=s.order||[];expected=t.items;ok=JSON.stringify(answer)===JSON.stringify(expected)}
   if(t.type==="fill"){answer=s.values||[];expected=t.answers;ok=t.answers.every((a,j)=>norm(answer[j])===norm(a))}
   if(t.type==="dropdown"){answer=s.values||[];expected=t.rows.map(r=>r.answer);ok=expected.every((a,j)=>answer[j]===a)}
   if(t.type==="drag"){answer=s.placed||{};expected=t.items.map(x=>x[1]);ok=t.items.every((x,j)=>answer[j]===x[1])}
   if(t.type==="open"){answer=String(s.text||"").trim();expected=t.rubric;ok=null}

   if(ok===true){autoCorrect++;autoPoints+=Number(t.points||0)}
   events.push({questionNumber:t.n,type:t.type,title:t.title,question:t.prompt,answer,expected,correct:ok,points:t.points,manualReview:t.type==="open",rubric:t.rubric||null,idealAnswer:t.idealAnswer||null});
 });
 return {events,autoCorrect,autoPoints:Math.round(autoPoints*100)/100};
}

async function submitResults(){
 saveDraft();
 const incomplete=[];
 T.forEach((t,i)=>{if(!typeHasAnswer(t,answers[i]?.state))incomplete.push(t.n)});
 if(incomplete.length){
   $("#reviewWarning").textContent="No se puede enviar todavía. Faltan: "+incomplete.join(", ")+".";
   return;
 }
 if(sent)return;

 const {events,autoCorrect,autoPoints}=buildEventsAndScore();
 const payload={
   activityId:ACTIVITY_ID,activityTitle:ACTIVITY_TITLE,studentCode,group,
   startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,
   xp:autoCorrect*120,comboBest:0,correct:autoCorrect,answered:T.length,
   accuracy:Math.round(autoCorrect/11*100),score10:autoPoints,stage:T.length,
   requiresManualReview:true,manualPending:4,manualPendingPoints:3,autoScoreMax:7,events
 };

 const btn=$("#sendBtn");btn.disabled=true;btn.textContent="Enviando…";
 $("#reviewWarning").textContent="Registrando la evaluación en D1…";

 try{
   const key=`attempt_${ACTIVITY_ID}_${studentCode}_${started}`;
   if(sessionStorage.getItem(key)==="sent"){sent=true;showFinal(autoPoints);return}
   const r=await fetch(ATTEMPTS,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   let d={};try{d=await r.json()}catch{}
   if(!r.ok)throw Error(d.error||"No se pudo guardar");
   sessionStorage.setItem(key,"sent");sent=true;showFinal(autoPoints)
 }catch(e){
   btn.disabled=false;btn.textContent="Enviar resultados";
   $("#reviewWarning").textContent="No se ha podido registrar el resultado. No cierres esta página y avisa al profesor.";
 }
}

function showFinal(autoPoints){
 $("#review").classList.add("hidden");
 $("#result").classList.remove("hidden");
 $("#rAuto").textContent=autoPoints.toFixed(2).replace(".",",")+" / 7";
 $("#rManual").textContent="4 pendientes";
 $("#rScore").textContent=autoPoints.toFixed(2).replace(".",",")+" / 10";
 $("#rState").textContent="Enviado";
 $("#saveState").textContent="✓ Evaluación registrada. Las 4 preguntas abiertas quedan pendientes de corrección manual.";
 $("#saveState").className="feedback good";
}


window.addEventListener("DOMContentLoaded",init);
