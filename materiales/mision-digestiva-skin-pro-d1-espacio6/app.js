
const WORKER_BASE="https://espacio-sexto-resultados.javigr77.workers.dev";
const WORKER=WORKER_BASE+"/api/attempts";
const STUDENT_VALIDATE_ENDPOINT=WORKER_BASE+"/api/student/validate";
const ACTIVITY_ID="ccnn-mision-digestiva-ruta-alimento-pro";
const ACTIVITY_TITLE="Misión Digestiva · Ruta del alimento";
const $=s=>document.querySelector(s);

let TASKS=[], mode="practice", idx=0, score=0, answered=0, streak=0, best=0, studentCode="", group="", started="", state={};

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function norm(s){
  return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function arrEq(a,b){
  return JSON.stringify([...a].sort((x,y)=>x-y))===JSON.stringify([...b].sort((x,y)=>x-y));
}

async function init(){
  TASKS = await fetch("tasks.json").then(r=>r.json());
  mode = document.body.dataset.mode || "practice";
  buildTabs();
  if(mode==="evaluation"){
    $("#identity").classList.remove("hidden");
  }else{
    startGame();
  }
}

function buildTabs(){
  const names = ["Misión 1","Misión 2","Misión 3","Misión 4","Misión 5"];
  const wrap=$("#tabs");
  wrap.innerHTML="";
  names.forEach((n,i)=>{
    const d=document.createElement("div");
    d.className="tab";
    d.id="tab"+(i+1);
    d.textContent=n;
    wrap.appendChild(d);
  });
}

async function startEvaluation(){
  const rawCode = $("#studentCode").value;
  const groupValue = $("#group").value;
  const msg = $("#identityMsg");
  msg.textContent = "";

  const code = String(rawCode || "")
    .trim()
    .toUpperCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, "");

  if(!code){
    msg.textContent = "Introduce tu código personal.";
    return;
  }
  if(!groupValue){
    msg.textContent = "Selecciona tu grupo.";
    return;
  }

  const startButton = document.querySelector("#identity .btn");
  if(startButton) startButton.disabled = true;
  msg.textContent = "Comprobando código…";

  try{
    const r = await fetch(STUDENT_VALIDATE_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({studentCode:code, group:groupValue})
    });

    let data = {};
    try{ data = await r.json(); }catch{}

    if(!r.ok || !data.ok){
      throw new Error(data.error || "Código no válido o grupo incorrecto.");
    }

    studentCode = data.studentCode || code;
    group = data.group || groupValue;

    $("#identity").classList.add("hidden");
    startGame();
  }catch(e){
    msg.textContent = e.message || "No se ha podido validar el código.";
  }finally{
    if(startButton) startButton.disabled = false;
  }
}

function startGame(){
  started = new Date().toISOString();
  $("#game").classList.remove("hidden");
  render();
}

function renderPreview(currentMission){
  const nextTask = TASKS.find(t=>t.mission===Math.min(currentMission+1,5));
  if(!nextTask){
    $("#previewMission").textContent="Final";
    $("#previewTitle").textContent="¡Último reto!";
    $("#previewPanel").innerHTML='<div class="statCaption">Termina la misión actual para ver tu resultado final.</div>';
    return;
  }
  $("#previewMission").textContent="Misión "+(currentMission+1);
  $("#previewTitle").textContent=nextTask.missionName;
  if(nextTask.type==="match"){
    const right = shuffle(nextTask.pairs.map(p=>p[1]));
    $("#previewPanel").innerHTML = nextTask.pairs.map((p,i)=>`
      <div class="previewRow">
        <div class="previewChip">${p[0]}</div>
        <div class="previewDot"></div>
        <div class="previewTarget">${right[i]}</div>
      </div>
    `).join("");
  } else if(nextTask.type==="order"){
    $("#previewPanel").innerHTML = '<div class="statCaption">Ordena el recorrido correcto del alimento con botones grandes y claros.</div>';
  } else if(nextTask.type==="multi"){
    $("#previewPanel").innerHTML = '<div class="statCaption">Selecciona varias respuestas correctas y luego comprueba.</div>';
  } else if(nextTask.type==="fill"){
    $("#previewPanel").innerHTML = '<div class="statCaption">Completa frases importantes con palabras clave del tema.</div>';
  } else {
    $("#previewPanel").innerHTML = '<div class="statCaption">Pregunta de opción múltiple con respuestas grandes.</div>';
  }
}

function render(){
  const t = TASKS[idx];
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));
  $("#tab"+t.mission).classList.add("on");
  if(idx>0){
    const prevMission = TASKS[idx-1].mission;
    if(prevMission!==t.mission){ $("#tab"+prevMission).classList.add("done"); }
  }
  $("#badge").textContent = "Misión " + t.mission;
  $("#missionTitle").textContent = t.prompt;
  $("#instruction").textContent = t.instruction || "";
  $("#stageCount").textContent = `Reto ${idx+1} de ${TASKS.length}`;
  $("#taskArea").innerHTML="";
  $("#feedback").textContent="";
  $("#feedback").className="feedback";
  $("#nextBtn").classList.add("hidden");
  $("#checkBtn").disabled=false;
  state = { selected:null, selectedMany:[], matches:[], order:[], fill:"" };

  renderPreview(t.mission);

  if(t.type==="choice") renderChoice(t);
  if(t.type==="multi") renderMulti(t);
  if(t.type==="order") renderOrder(t);
  if(t.type==="match") renderMatch(t);
  if(t.type==="fill") renderFill(t);

  updateHud();
}

function renderChoice(t){
  const opts = shuffle(t.options.map((text, originalIndex)=>({text, originalIndex})));
  const wrap=document.createElement("div");
  wrap.className="answerGrid";
  opts.forEach((o,i)=>{
    const b=document.createElement("button");
    b.className="answerBtn";
    b.textContent=o.text;
    b.onclick=()=>{
      state.selected=o.originalIndex;
      wrap.querySelectorAll(".answerBtn").forEach(x=>x.classList.remove("sel"));
      b.classList.add("sel");
    };
    wrap.appendChild(b);
  });
  $("#taskArea").appendChild(wrap);
}

function renderMulti(t){
  const opts = shuffle(t.options.map((text, originalIndex)=>({text, originalIndex})));
  const wrap=document.createElement("div");
  wrap.className="answerGrid";
  opts.forEach((o)=>{
    const b=document.createElement("button");
    b.className="answerBtn";
    b.textContent=o.text;
    b.onclick=()=>{
      const p = state.selectedMany.indexOf(o.originalIndex);
      if(p>=0){ state.selectedMany.splice(p,1); b.classList.remove("sel");}
      else { state.selectedMany.push(o.originalIndex); b.classList.add("sel");}
    };
    wrap.appendChild(b);
  });
  $("#taskArea").appendChild(wrap);
}

function renderOrder(t){
  const slots=document.createElement("div");
  slots.className="orderSlots";
  slots.id="orderSlots";
  for(let i=0;i<t.items.length;i++){
    const d=document.createElement("div");
    d.className="orderSlot";
    d.textContent= String(i+1);
    slots.appendChild(d);
  }
  const bank=document.createElement("div");
  bank.className="orderAnswers";
  shuffle(t.items).forEach((label)=>{
    const b=document.createElement("button");
    b.className="orderChip";
    b.textContent=label;
    b.onclick=()=>{
      if(b.classList.contains("used")) return;
      state.order.push(label);
      b.classList.add("used");
      refreshSlots();
    };
    bank.appendChild(b);
  });
  const controls=document.createElement("div");
  controls.style.textAlign="center";
  controls.style.marginTop="16px";
  controls.innerHTML='<button class="btn alt" type="button" id="resetOrder">Reiniciar orden</button>';
  controls.querySelector = undefined
  $("#taskArea").append(slots, bank);
  const reset=document.createElement("div");
  reset.style.textAlign="center";
  reset.style.marginTop="16px";
  const rb=document.createElement("button");
  rb.className="btn alt";
  rb.textContent="Reiniciar orden";
  rb.onclick=()=>{
    state.order=[];
    $("#taskArea").querySelectorAll(".orderChip").forEach(x=>x.classList.remove("used"));
    refreshSlots();
  };
  reset.appendChild(rb);
  $("#taskArea").appendChild(reset);
  refreshSlots();
}
function refreshSlots(){
  const slots=$("#orderSlots").children;
  [...slots].forEach((slot,i)=> slot.textContent = state.order[i] || String(i+1));
}

function renderMatch(t){
  state.leftPick=null;
  state.rightPick=null;
  state.correctPairs=[];

  const wrap=document.createElement("div");
  wrap.className="matchWrap";

  // Barajamos AMBAS columnas de forma independiente para evitar patrones previsibles.
  const leftItems = shuffle(
    t.pairs.map((p,i)=>({text:p[0], pairIndex:i}))
  );
  const rightItems = shuffle(
    t.pairs.map((p,i)=>({text:p[1], pairIndex:i}))
  );

  const leftCol=document.createElement("div");
  leftCol.className="matchCol";
  leftItems.forEach((item)=>{
    const d=document.createElement("div");
    d.className="matchItem";
    d.textContent=item.text;
    d.onclick=()=>selectMatch("left", item.pairIndex, d);
    leftCol.appendChild(d);
  });

  const rightCol=document.createElement("div");
  rightCol.className="matchCol";
  rightItems.forEach((item)=>{
    const d=document.createElement("div");
    d.className="matchItem matchTarget";
    d.textContent=item.text;
    d.onclick=()=>selectMatch("right", item.pairIndex, d);
    rightCol.appendChild(d);
  });

  wrap.append(leftCol, rightCol);
  $("#taskArea").appendChild(wrap);

  const hint=document.createElement("div");
  hint.className="stageHint";
  hint.textContent="Toca un elemento de la izquierda y luego su pareja correcta de la derecha.";
  $("#taskArea").appendChild(hint);
}

function selectMatch(side, pairIndex, el){
  if(el.classList.contains("done")) return;
  if(side==="left"){
    state.leftPick = {pairIndex, el};
    $("#taskArea").querySelectorAll(".matchCol:first-child .matchItem").forEach(x=>x.classList.remove("sel"));
    el.classList.add("sel");
  }else{
    state.rightPick = {pairIndex, el};
    $("#taskArea").querySelectorAll(".matchCol:last-child .matchItem").forEach(x=>x.classList.remove("sel"));
    el.classList.add("sel");
  }

  if(state.leftPick && state.rightPick){
    if(state.leftPick.pairIndex === state.rightPick.pairIndex){
      state.correctPairs.push(state.leftPick.pairIndex);
      state.leftPick.el.classList.add("done");
      state.rightPick.el.classList.add("done");
    }
    state.leftPick.el.classList.remove("sel");
    state.rightPick.el.classList.remove("sel");
    state.leftPick=null; state.rightPick=null;
  }
}

function renderFill(t){
  const box=document.createElement("div");
  box.className="fillBox";
  box.innerHTML = `<div>${t.sentence}</div>`;
  const input=document.createElement("input");
  input.placeholder="Escribe la palabra";
  input.oninput=()=> state.fill = input.value;
  box.appendChild(input);
  $("#taskArea").appendChild(box);
}

function check(){
  const t=TASKS[idx];
  let ok=false, answer=null, expected=null;

  if(t.type==="choice"){
    answer=state.selected;
    expected=t.correct;
    ok = answer===expected;
  }
  if(t.type==="multi"){
    answer=[...state.selectedMany];
    expected=t.correct;
    ok = arrEq(answer, expected);
  }
  if(t.type==="order"){
    answer=[...state.order];
    expected=t.items;
    ok = JSON.stringify(answer)===JSON.stringify(expected);
  }
  if(t.type==="match"){
    answer=[...state.correctPairs].sort((a,b)=>a-b);
    expected=t.pairs.map((_,i)=>i);
    ok = JSON.stringify(answer)===JSON.stringify(expected);
  }
  if(t.type==="fill"){
    answer=norm(state.fill);
    expected=norm(t.answer);
    ok = answer===expected;
  }

  answered++;
  if(ok){ score++; streak++; best=Math.max(best, streak); }
  else { streak=0; }

  window.__events = window.__events || [];
  window.__events.push({
    questionNumber: idx+1,
    mission: t.missionName,
    taskType: t.type,
    question: t.prompt,
    answer, expected, correct: ok
  });

  $("#feedback").textContent = mode==="practice"
    ? (ok ? "✅ ¡Muy bien! Respuesta correcta." : "❌ No es correcto. Revisa y sigue adelante.")
    : "Respuesta registrada.";
  $("#feedback").classList.add(ok?"good":"bad");
  $("#checkBtn").disabled=true;
  $("#nextBtn").classList.remove("hidden");
  updateHud();
}

function nextTask(){
  idx++;
  if(idx>=TASKS.length){ finish(); return; }
  render();
}
function updateHud(){
  $("#points").textContent = String(score*150).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  $("#streak").textContent = streak;
  const acc = answered ? Math.round(score/answered*100) : 100;
  $("#accuracy").textContent = acc + " %";
  $("#meterFill").style.width = acc + "%";
}
async function finish(){
  $("#tab5").classList.add("done");
  const acc = Math.round(score/TASKS.length*100);
  const note = Math.round((score/TASKS.length*10)*10)/10;
  $("#game").classList.add("hidden");
  $("#result").classList.remove("hidden");
  $("#rCorrect").textContent = `${score}/${TASKS.length}`;
  $("#rAcc").textContent = acc + "%";
  $("#rScore").textContent = String(note).replace(".",",");
  $("#rStreak").textContent = best;

  if(mode==="evaluation"){
    await sendResult({
      activityId: ACTIVITY_ID,
      activityTitle: ACTIVITY_TITLE,
      studentCode,
      group,
      startedAtIso: started,
      finishedAtIso: new Date().toISOString(),
      finished: true,
      xp: score*150,
      comboBest: best,
      correct: score,
      answered: TASKS.length,
      accuracy: acc,
      score10: note,
      stage: 5,
      events: window.__events || []
    });
  }
}
async function sendResult(payload){
  const out = $("#saveState");
  out.textContent="Guardando resultado…";
  try{
    const key = "attempt_"+ACTIVITY_ID+"_"+studentCode+"_"+started;
    if(sessionStorage.getItem(key)==="sent"){
      out.textContent="✓ Resultado ya registrado";
      return;
    }
    const r = await fetch(WORKER, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    if(!r.ok) throw new Error("Error");
    sessionStorage.setItem(key,"sent");
    out.textContent="✓ Resultado registrado correctamente";
    out.className="feedback good";
  }catch(e){
    window._pending = payload;
    out.textContent="No se ha podido registrar. No cierres esta página y avisa al profesor.";
    out.className="feedback bad";
    $("#retryBtn").classList.remove("hidden");
  }
}
function retrySend(){
  if(window._pending) sendResult(window._pending);
}
window.addEventListener("DOMContentLoaded", init);
