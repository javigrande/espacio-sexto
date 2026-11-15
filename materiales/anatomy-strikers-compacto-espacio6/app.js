
const WORKER="https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts";
const ID="ccnn-anatomy-strikers-camino-final",TITLE="ANATOMY STRIKERS · Camino a la Final",$=s=>document.querySelector(s);
let T=[],mode="practice",idx=0,score=0,answered=0,energy=100,streak=0,best=0,goals=0,events=[],started="",studentCode="",group="",state={};

async function init(){
 T=await fetch("tasks.json").then(r=>r.json());
 mode=document.body.dataset.mode||"practice";
 buildMissions();
 if(mode==="evaluation"){
   $("#identity").classList.remove("hidden");
 }else{
   started=new Date().toISOString();
   render();
 }
}
function showIntro(){}
function buildMissions(){["DEFENSA ÓSEA","ATAQUE MUSCULAR","PASE PERFECTO","ENTRENAMIENTO EXTREMO","SUPERTIRO ANATÓMICO"].forEach((n,i)=>{const d=document.createElement("div");d.className="mission";d.id="m"+(i+1);d.innerHTML=`<b>MISIÓN ${i+1}</b><br>${n}`;$("#missions").appendChild(d)})}
function startEvaluation(){const v=ESPACIO6_validateStudent($("#studentCode").value,$("#group").value);$("#identityMsg").textContent="";if(!v.ok){$("#identityMsg").textContent=v.error;return}studentCode=v.code;group=v.group;$("#identity").classList.add("hidden");start()}
function start(){started=new Date().toISOString();$("#game").classList.remove("hidden");render()}
function render(){
 const t=T[idx],prev=idx?T[idx-1].m:null;state={};
 if(prev&&prev!==t.m){$("#m"+prev).classList.add("done");goals++;updateHud()}
 $("#m"+t.m).classList.add("on");$("#tag").textContent=`MISIÓN ${t.m} · ${t.n}`;$("#counter").textContent=`Reto ${idx+1}/${T.length}`;$("#bar").style.width=(idx/T.length*100)+"%";$("#prompt").textContent=t.prompt;$("#task").innerHTML="";$("#feedback").textContent="";$("#check").classList.add("hidden");$("#next").classList.add("hidden");
 if(t.type==="hotspot")hotspot(t);if(t.type==="choice")choice(t,false);if(t.type==="multi")choice(t,true);if(t.type==="match")match(t);if(t.type==="sort")sortTask(t);
}
function hotspot(t){
 state.click=null;
 const box=document.createElement("div");box.className="bodyMap";box.innerHTML=`<img src="${t.img}" alt="Mapa anatómico">`;
 box.onclick=e=>{const r=box.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100;state.click={x,y};box.querySelectorAll(".hotspot,.hitmark").forEach(n=>n.remove());const h=document.createElement("span");h.className="hotspot";h.style.left=x+"%";h.style.top=y+"%";box.appendChild(h);$("#check").classList.remove("hidden")};
 $("#task").appendChild(box);
}
function choice(t,multi){
 state.selected=multi?[]:null;const box=document.createElement("div");box.className="answers";const opts=t.options.map((text,originalIndex)=>({text,originalIndex}));for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]]}
 opts.forEach((o,i)=>{const b=document.createElement("button");b.className="answer";b.textContent=String.fromCharCode(65+i)+". "+o.text;b.onclick=()=>{if(multi){const p=state.selected.indexOf(o.originalIndex);p>=0?state.selected.splice(p,1):state.selected.push(o.originalIndex);b.classList.toggle("sel")}else{state.selected=o.originalIndex;[...box.children].forEach((x,n)=>x.classList.toggle("sel",n===i))}$("#check").classList.remove("hidden")};box.appendChild(b)});$("#task").appendChild(box)
}
function match(t){state.l=null;state.r=null;state.ok=[];const g=document.createElement("div");g.className="match",l=document.createElement("div"),r=document.createElement("div");l.className=r.className="col";t.pairs.forEach((p,i)=>{const a=document.createElement("div");a.className="matchItem";a.textContent=p[0];a.onclick=()=>pick(a,"l",i);l.appendChild(a)});[...t.pairs].sort(()=>Math.random()-.5).forEach(p=>{const i=t.pairs.findIndex(x=>x[1]===p[1]),a=document.createElement("div");a.className="matchItem";a.textContent=p[1];a.onclick=()=>pick(a,"r",i);r.appendChild(a)});g.append(l,r);$("#task").appendChild(g);$("#check").classList.remove("hidden")}
function pick(el,s,i){if(el.classList.contains("done"))return;if(s==="l")state.l={el,i};else state.r={el,i};el.classList.add("sel");if(state.l&&state.r){if(state.l.i===state.r.i){state.ok.push(state.l.i);state.l.el.classList.add("done");state.r.el.classList.add("done")}state.l.el.classList.remove("sel");state.r.el.classList.remove("sel");state.l=state.r=null}}
function sortTask(t){state.placed={};const bank=document.createElement("div");bank.className="bank";t.items.forEach((it,i)=>{const d=document.createElement("div");d.className="drag";d.textContent=it[0];d.draggable=true;d.dataset.i=i;d.onclick=()=>{state.selected=i;document.querySelectorAll(".drag").forEach(x=>x.style.background="#fff");d.style.background="#ffe98a"};d.ondragstart=e=>e.dataTransfer.setData("text/plain",i);bank.appendChild(d)});const zones=document.createElement("div");zones.className="zones";t.targets.forEach(target=>{const z=document.createElement("div");z.className="zone";z.innerHTML=`<b>${target}</b>`;const place=i=>{state.placed[i]=target;const d=document.querySelector('.drag[data-i="'+i+'"]');if(d)z.appendChild(d);$("#check").classList.remove("hidden")};z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();place(+e.dataTransfer.getData("text/plain"))};z.onclick=()=>{if(state.selected!==undefined){place(state.selected);state.selected=undefined}};zones.appendChild(z)});$("#task").append(bank,zones)}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function arrEq(a,b){return JSON.stringify([...a].sort())===JSON.stringify([...b].sort())}
function check(){
 const t=T[idx];let ok=false,answer=null,expected=null;
 if(t.type==="hotspot"){answer=state.click;expected={x:t.x,y:t.y,r:t.r,label:t.answer};ok=!!answer&&dist(answer,expected)<=t.r}
 if(t.type==="choice"){answer=state.selected;expected=t.correct;ok=answer===expected}
 if(t.type==="multi"){answer=state.selected||[];expected=t.correct;ok=arrEq(answer,expected)}
 if(t.type==="match"){answer=state.ok.slice().sort();expected=t.pairs.map((_,i)=>i);ok=answer.length===expected.length&&answer.every((x,i)=>x===expected[i])}
 if(t.type==="sort"){answer=state.placed;expected=t.items.map(x=>x[1]);ok=t.items.every((it,i)=>state.placed[i]===it[1])}
 answered++;
 if(ok){score++;streak++;best=Math.max(best,streak);energy=Math.min(100,energy+3)}else{streak=0;energy=Math.max(0,energy-8)}
 events.push({type:"answer",questionNumber:idx+1,mission:t.n,taskType:t.type,question:t.prompt,answer,expected,correct:ok});
 if(mode==="practice"){if(t.type==="hotspot"&&!ok&&state.click){const map=$(".bodyMap"),m=document.createElement("span");m.className="hitmark";m.style.left=t.x+"%";m.style.top=t.y+"%";map.appendChild(m)}$("#feedback").textContent=ok?"⚽ ¡GOOOL! Respuesta correcta.":"🧤 ¡PARADA! Revisa la jugada.";$("#feedback").className="feedback "+(ok?"good":"bad")}else{$("#feedback").textContent="Jugada registrada";$("#feedback").className="feedback"}
 $("#check").classList.add("hidden");$("#next").classList.remove("hidden");updateHud()
}
function nextTask(){idx++;idx>=T.length?finish():render()}
function updateHud(){$("#energy").textContent=energy+"%";$("#streak").textContent="x"+streak;$("#goals").textContent=goals;$("#rankTop").textContent=score/Math.max(answered,1)>=.9?"Élite":score/Math.max(answered,1)>=.7?"Titular":"Novato/a"}
async function finish(){for(let i=1;i<=5;i++)$("#m"+i).classList.add("done");goals=5;updateHud();const acc=Math.round(score/T.length*100),note=Math.round(score/T.length*100)/10;$("#game").classList.add("hidden");$("#result").classList.remove("hidden");$("#rCorrect").textContent=score+"/"+T.length;$("#rAcc").textContent=acc+"%";$("#rScore").textContent=note.toFixed(1).replace(".",",");$("#rGoals").textContent=goals;$("#rank").textContent=acc>=95?"S+":acc>=90?"S":acc>=80?"A":acc>=70?"B":acc>=60?"C":"D";if(mode==="evaluation")send({activityId:ID,activityTitle:TITLE,studentCode,group,startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,xp:score*150,comboBest:best,correct:score,answered,accuracy:acc,score10:note,stage:5,events})}
async function send(p){const s=$("#saveState");s.textContent="Guardando resultado…";try{const k="attempt_"+ID+"_"+studentCode+"_"+started;if(sessionStorage.getItem(k)==="sent"){s.textContent="✓ Resultado ya registrado";return}const r=await fetch(WORKER,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(!r.ok)throw 0;sessionStorage.setItem(k,"sent");s.textContent="✓ Resultado registrado correctamente";s.className="feedback good"}catch{window._pending=p;s.textContent="No se ha podido registrar el resultado. No cierres esta página y avisa al profesor.";s.className="feedback bad";$("#retry").classList.remove("hidden")}}
function retrySend(){if(window._pending)send(window._pending)}
window.addEventListener("DOMContentLoaded",init);
