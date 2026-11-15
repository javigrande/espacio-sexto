
const WORKER="https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts";
const ID="lengua-manga-morpho-quest";
const TITLE="MANGA MORPHO QUEST · Numerales e indefinidos";
const $=s=>document.querySelector(s);

let T=[],mode="practice",idx=0,studentCode="",group="",started="",score=0,answered=0,xp=0,combo=0,bestCombo=0,events=[],state={};

async function init(){
 T=await fetch("tasks.json").then(r=>r.json());
 buildMap();
 mode=document.body.dataset.mode||"practice";
 if(mode==="evaluation") $("#identity").classList.remove("hidden");
 else startGame();
}
function buildMap(){
 const names=["NUMERAL SCOUT","INDEFINITE FOREST","MORPHO LAB","SYNTAX GATE","BOSS BATTLE"];
 const box=$("#map");
 names.forEach((n,i)=>{const d=document.createElement("div");d.className="node";d.id="node"+(i+1);d.innerHTML=`<b>0${i+1}</b><small>${n}</small>`;box.appendChild(d)});
}
function startEvaluation(){
 const v=ESPACIO6_validateStudent($("#studentCode").value,$("#group").value);
 $("#identityMsg").textContent="";
 if(!v.ok){$("#identityMsg").textContent=v.error;return}
 studentCode=v.code;group=v.group;$("#identity").classList.add("hidden");startGame();
}
function startGame(){started=new Date().toISOString();$("#game").classList.remove("hidden");render()}
function render(){
 const t=T[idx];
 const prev=idx?T[idx-1].m:null;
 if(prev&&prev!==t.m) $("#node"+prev).classList.add("done");
 $("#node"+t.m).classList.add("on");
 state={};
 $("#mission").textContent=`MISIÓN 0${t.m} · ${t.n}`;
 $("#qnum").textContent=idx+1;$("#total").textContent=T.length;$("#bar").style.width=(idx/T.length*100)+"%";
 $("#prompt").textContent=t.p;$("#task").innerHTML="";$("#feedback").textContent="";$("#check").disabled=false;$("#next").classList.add("hidden");
 if(t.t==="choice") renderChoice(t);
 if(t.t==="multi") renderMulti(t);
 if(t.t==="input") renderInput(t);
 if(t.t==="match") renderMatch(t);
 if(t.t==="sort") renderSort(t);
 updateHud();
}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function renderChoice(t){
 state.selected=null;
 const wrap=document.createElement("div");wrap.className="answers";
 const opts=shuffle(t.o.map((text,originalIndex)=>({text,originalIndex})));
 state.opts=opts;
 opts.forEach((o,i)=>{const b=document.createElement("button");b.className="answer";b.textContent=String.fromCharCode(65+i)+". "+o.text;b.onclick=()=>{state.selected=o.originalIndex;[...wrap.children].forEach((x,n)=>x.classList.toggle("sel",n===i))};wrap.appendChild(b)});
 $("#task").appendChild(wrap);
}
function renderMulti(t){
 state.selected=[];
 const wrap=document.createElement("div");wrap.className="answers";
 const opts=shuffle(t.o.map((text,originalIndex)=>({text,originalIndex})));
 state.opts=opts;
 opts.forEach((o,i)=>{const b=document.createElement("button");b.className="answer";b.textContent=String.fromCharCode(65+i)+". "+o.text;b.onclick=()=>{const p=state.selected.indexOf(o.originalIndex); if(p>=0) state.selected.splice(p,1); else state.selected.push(o.originalIndex); b.classList.toggle("sel")};wrap.appendChild(b)});
 $("#task").appendChild(wrap);
}
function renderInput(){
 const box=document.createElement("div");box.className="missionBox";box.innerHTML=`<p>Escribe tu respuesta con una sola palabra.</p><input id="txt" class="bigInput" autocomplete="off">`;
 $("#task").appendChild(box);
}
function renderMatch(t){
 state.l=null;state.r=null;state.ok=[];
 const g=document.createElement("div");g.className="match";
 const l=document.createElement("div"),r=document.createElement("div");l.className=r.className="col";
 t.pairs.forEach((p,i)=>{const a=document.createElement("div");a.className="mItem";a.textContent=p[0];a.onclick=()=>pick(a,"l",i);l.appendChild(a)});
 shuffle(t.pairs).forEach(p=>{const i=t.pairs.findIndex(x=>x[1]===p[1]);const a=document.createElement("div");a.className="mItem";a.textContent=p[1];a.onclick=()=>pick(a,"r",i);r.appendChild(a)});
 g.append(l,r);$("#task").appendChild(g);
}
function pick(el,side,i){
 if(el.classList.contains("done")) return;
 if(side==="l") state.l={el,i}; else state.r={el,i};
 el.classList.add("sel");
 if(state.l&&state.r){
   if(state.l.i===state.r.i){state.ok.push(state.l.i);state.l.el.classList.add("done");state.r.el.classList.add("done")}
   state.l.el.classList.remove("sel");state.r.el.classList.remove("sel");state.l=state.r=null;
 }
}
function renderSort(t){
 state.placed={};
 const bank=document.createElement("div");bank.className="bank";
 t.items.forEach((it,i)=>{const d=document.createElement("div");d.className="drag";d.textContent=it[0];d.draggable=true;d.dataset.i=i;d.ondragstart=e=>e.dataTransfer.setData("text/plain",i);bank.appendChild(d)});
 const zones=document.createElement("div");zones.className="zones";
 t.targets.forEach(target=>{const z=document.createElement("div");z.className="zone";z.innerHTML=`<b>${target}</b>`;z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();const i=+e.dataTransfer.getData("text/plain");state.placed[i]=target;const d=document.querySelector('.drag[data-i="'+i+'"]'); if(d) z.appendChild(d)};zones.appendChild(z)});
 $("#task").append(bank,zones);
}
function normalize(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function arraysEqual(a,b){a=[...a].sort((x,y)=>x-y);b=[...b].sort((x,y)=>x-y);return JSON.stringify(a)===JSON.stringify(b)}
function check(){
 const t=T[idx]; let ok=false, answer=null, expected=null;
 if(t.t==="choice"){answer=state.selected; expected=t.a; ok=answer===expected}
 if(t.t==="multi"){answer=state.selected.slice(); expected=t.a; ok=arraysEqual(answer,expected)}
 if(t.t==="input"){answer=normalize($("#txt").value); expected=normalize(t.a); ok=answer===expected}
 if(t.t==="match"){answer=state.ok.slice().sort(); expected=t.pairs.map((_,i)=>i); ok=answer.length===expected.length && answer.every((x,i)=>x===expected[i])}
 if(t.t==="sort"){answer=state.placed; expected=t.items.map(x=>x[1]); ok=t.items.every((it,i)=>state.placed[i]===it[1])}
 answered++;
 if(ok){score++; combo++; bestCombo=Math.max(bestCombo,combo); xp+=120+Math.min(combo*15,120)} else combo=0;
 events.push({type:"answer",questionNumber:idx+1,mission:t.n,taskType:t.t,question:t.p,answer,expected,correct:ok});
 $("#feedback").textContent=mode==="practice"?(ok?"✨ ¡Yatta! Reto superado.":"💥 Aún no. Revisa la teoría y vuelve a intentarlo en el siguiente reto."):"Respuesta registrada";
 $("#feedback").className="feedback "+(mode==="practice"?(ok?"good":"badmsg"):"");
 $("#check").disabled=true; $("#next").classList.remove("hidden");
 updateHud();
}
function nextTask(){idx++; if(idx>=T.length) finish(); else render()}
function updateHud(){$("#xp").textContent=xp; $("#combo").textContent=combo}
async function finish(){
 for(let i=1;i<=5;i++) $("#node"+i).classList.add("done");
 const acc=Math.round(score/T.length*100), note=Math.round(score/T.length*100)/10;
 $("#game").classList.add("hidden"); $("#result").classList.remove("hidden");
 $("#rCorrect").textContent=score+"/"+T.length; $("#rAcc").textContent=acc+"%"; $("#rScore").textContent=note.toFixed(1).replace(".",","); $("#rXp").textContent=xp;
 $("#rank").textContent=acc>=95?"S+":acc>=90?"S":acc>=80?"A":acc>=70?"B":acc>=60?"C":"D";
 if(mode==="evaluation"){
   const payload={activityId:ID,activityTitle:TITLE,studentCode,group,startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,xp,comboBest:bestCombo,correct:score,answered,accuracy:acc,score10:note,stage:5,events};
   send(payload);
 }
}
async function send(payload){
 const s=$("#saveState"); s.textContent="Guardando resultado…";
 try{
   const k="attempt_"+ID+"_"+studentCode+"_"+started;
   if(sessionStorage.getItem(k)==="sent"){s.textContent="✓ Resultado ya registrado"; s.className="feedback good"; return}
   const r=await fetch(WORKER,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   if(!r.ok) throw 0;
   sessionStorage.setItem(k,"sent");
   s.textContent="✓ Resultado registrado correctamente";
   s.className="feedback good";
 }catch{
   window._pending=payload;
   s.textContent="No se ha podido registrar el resultado. No cierres esta página y avisa al profesor.";
   s.className="feedback badmsg";
   $("#retry").classList.remove("hidden");
 }
}
function retrySend(){if(window._pending) send(window._pending)}
window.addEventListener("DOMContentLoaded",init);
