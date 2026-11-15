
const WORKER="https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts";
const ID="matematicas-power-10-quest",TITLE="POWER 10 QUEST · Operación Base 10",VIDEO_ID="YT3TkikNrTU";
const $=s=>document.querySelector(s);
let T=[],mode="practice",idx=0,studentCode="",group="",started="",score=0,answered=0,xp=0,combo=0,bestCombo=0,events=[],state={},player=null,maxTime=0,videoDone=false,timer=null;

async function init(){T=await fetch("tasks.json").then(r=>r.json());mode=document.body.dataset.mode||"practice";buildPortal();if(mode==="evaluation")$("#identity").classList.remove("hidden");else beginVideo()}
function buildPortal(){["ZERO FACTORY","POWER BUILDER","NUMBER TRANSFORMER","COSMIC NUMBERS","FINAL PORTAL"].forEach((n,i)=>{const d=document.createElement("div");d.className="portalPiece";d.id="portal"+(i+1);d.innerHTML=`<b>0${i+1}</b><small>${n}</small>`;$("#portal").appendChild(d)})}
function startEvaluation(){const v=ESPACIO6_validateStudent($("#studentCode").value,$("#group").value);$("#identityMsg").textContent="";if(!v.ok){$("#identityMsg").textContent=v.error;return}studentCode=v.code;group=v.group;$("#identity").classList.add("hidden");beginVideo()}
function beginVideo(){started=new Date().toISOString();$("#videoStage").classList.remove("hidden");loadYT()}
function loadYT(){if(window.YT&&YT.Player){createPlayer();return}const tag=document.createElement("script");tag.src="https://www.youtube.com/iframe_api";document.head.appendChild(tag);window.onYouTubeIframeAPIReady=createPlayer}
function createPlayer(){if(player)return;player=new YT.Player("ytplayer",{videoId:VIDEO_ID,playerVars:{rel:0,playsinline:1,modestbranding:1},events:{onStateChange:onPlayerState}});timer=setInterval(trackVideo,500)}
function trackVideo(){if(!player||!player.getCurrentTime)return;const cur=player.getCurrentTime()||0,dur=player.getDuration()||0;if(cur>maxTime+2&&!videoDone){player.seekTo(maxTime,true);return}if(cur>maxTime)maxTime=cur;$("#watchPct").textContent=dur?Math.min(100,Math.round(maxTime/dur*100))+"%":"0%"}
function onPlayerState(e){if(e.data===YT.PlayerState.ENDED&&!videoDone){videoDone=true;clearInterval(timer);events.push({type:"video",completed:true,videoId:VIDEO_ID,watchedSeconds:Math.round(maxTime)});$("#videoStage").classList.add("hidden");$("#gameStage").classList.remove("hidden");render()}}

function render(){
 const t=T[idx],prev=idx?T[idx-1].m:null;state={};
 if(prev&&prev!==t.m)$("#portal"+prev).classList.add("done");
 $("#portal"+t.m).classList.add("on");$("#mission").textContent=`MISIÓN 0${t.m} · ${t.n}`;$("#qnum").textContent=idx+1;$("#total").textContent=T.length;$("#bar").style.width=(idx/T.length*100)+"%";$("#prompt").textContent=t.p;$("#task").innerHTML="";$("#feedback").textContent="";$("#check").disabled=false;$("#next").classList.add("hidden");
 if(t.t==="choice")choice(t);if(t.t==="input")inputTask(t);if(t.t==="zeros")zeros(t);if(t.t==="product")product(t);if(t.t==="match")match(t);if(t.t==="sort")sortTask(t);hud()
}
function choice(t){state.selected=null;const box=document.createElement("div");box.className="answers";const sh=t.o.map((text,originalIndex)=>({text,originalIndex}));for(let i=sh.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[sh[i],sh[j]]=[sh[j],sh[i]]}state.sh=sh;sh.forEach((o,i)=>{const b=document.createElement("button");b.className="answer";b.textContent=String.fromCharCode(65+i)+". "+o.text;b.onclick=()=>{state.selected=o.originalIndex;[...box.children].forEach((x,n)=>x.classList.toggle("sel",n===i))};box.appendChild(b)});$("#task").appendChild(box)}
function inputTask(){const m=document.createElement("div");m.className="machine";m.innerHTML=`<div class="power">${$("#prompt").textContent.replace("□",'<input id="exp" class="expInput" inputmode="numeric">')}</div>`;$("#task").appendChild(m);$("#prompt").textContent="Escribe el exponente correcto."}
function zeros(t){state.zeros=0;const m=document.createElement("div");m.className="machine";m.innerHTML=`<div class="power">10<sup>${t.z}</sup></div><div class="zeroBank" id="zeroBank"></div><div class="built" id="built">1</div><p>Haz clic en tantos ceros como necesites.</p>`;$("#task").appendChild(m);for(let i=0;i<9;i++){const z=document.createElement("div");z.className="zero";z.textContent="0";z.onclick=()=>{state.zeros++;updateBuilt()};$("#zeroBank").appendChild(z)}updateBuilt()}
function updateBuilt(){$("#built").innerHTML="1"+Array.from({length:state.zeros},()=>`<span onclick="removeZero()">0</span>`).join("")}
window.removeZero=()=>{if(state.zeros){state.zeros--;updateBuilt()}}
function product(t){state.count=0;const m=document.createElement("div");m.className="machine";m.innerHTML=`<div class="productTokens" id="prod"></div><p>Selecciona exactamente ${t.a} factores 10.</p>`;$("#task").appendChild(m);for(let i=0;i<8;i++){const x=document.createElement("div");x.className="token";x.textContent="10";x.onclick=()=>{x.classList.toggle("sel");state.count=document.querySelectorAll(".token.sel").length};$("#prod").appendChild(x)}}
function match(t){state.l=null;state.r=null;state.matches=[];const g=document.createElement("div");g.className="match";const l=document.createElement("div"),r=document.createElement("div");l.className=r.className="matchCol";t.pairs.forEach((p,i)=>{const a=document.createElement("div");a.className="matchItem";a.textContent=p[0];a.onclick=()=>pick(a,"l",i);l.appendChild(a)});[...t.pairs].sort(()=>Math.random()-.5).forEach(p=>{const i=t.pairs.findIndex(x=>x[1]===p[1]);const a=document.createElement("div");a.className="matchItem";a.textContent=p[1];a.onclick=()=>pick(a,"r",i);r.appendChild(a)});g.append(l,r);$("#task").appendChild(g)}
function pick(el,side,i){if(el.classList.contains("done"))return;if(side==="l")state.l={el,i};else state.r={el,i};el.classList.add("sel");if(state.l&&state.r){if(state.l.i===state.r.i){state.matches.push(state.l.i);state.l.el.classList.add("done");state.r.el.classList.add("done")}state.l.el.classList.remove("sel");state.r.el.classList.remove("sel");state.l=state.r=null}}
function sortTask(t){state.placed={};const bank=document.createElement("div");bank.className="sortBank";t.items.forEach((it,i)=>{const d=document.createElement("div");d.className="dragItem";d.textContent=it[0];d.draggable=true;d.dataset.i=i;d.ondragstart=e=>e.dataTransfer.setData("text/plain",i);bank.appendChild(d)});const zones=document.createElement("div");zones.className="zones";t.targets.forEach(target=>{const z=document.createElement("div");z.className="zone";z.innerHTML=`<b>${target}</b>`;z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();const i=+e.dataTransfer.getData("text/plain");state.placed[i]=target;const d=document.querySelector('.dragItem[data-i="'+i+'"]');if(d)z.appendChild(d)};zones.appendChild(z)});$("#task").append(bank,zones)}

function check(){
 const t=T[idx];let ok=false,answer=null,expected=null;
 if(t.t==="choice"){answer=state.selected;expected=t.a;ok=answer===expected}
 if(t.t==="input"){answer=Number($("#exp").value);expected=t.a;ok=answer===expected}
 if(t.t==="zeros"){answer=state.zeros;expected=t.z;ok=answer===expected}
 if(t.t==="product"){answer=state.count;expected=t.a;ok=answer===expected}
 if(t.t==="match"){answer=state.matches.slice().sort();expected=t.pairs.map((_,i)=>i);ok=answer.length===expected.length&&answer.every((x,i)=>x===expected[i])}
 if(t.t==="sort"){answer=state.placed;expected=t.items.map(x=>x[1]);ok=t.items.every((it,i)=>state.placed[i]===it[1])}
 answered++;if(ok){score++;combo++;bestCombo=Math.max(bestCombo,combo);xp+=120+Math.min(combo*15,120)}else combo=0;
 events.push({type:"answer",questionNumber:idx+1,mission:t.n,taskType:t.t,question:t.p,answer,expected,correct:ok});
 $("#feedback").textContent=mode==="practice"?(ok?"⚡ POWER UP! Reto superado.":"💥 TRY AGAIN! Revisa la relación entre ceros y exponente."):"Respuesta registrada";
 $("#feedback").className="feedback "+(mode==="practice"?(ok?"good":"badmsg"):"");
 $("#check").disabled=true;$("#next").classList.remove("hidden");hud()
}
function nextTask(){idx++;idx>=T.length?finish():render()}function hud(){$("#xp").textContent=xp;$("#combo").textContent=combo}
async function finish(){for(let i=1;i<=5;i++)$("#portal"+i).classList.add("done");const acc=Math.round(score/T.length*100),note=Math.round(score/T.length*100)/10;$("#gameStage").classList.add("hidden");$("#result").classList.remove("hidden");$("#rCorrect").textContent=score+"/"+T.length;$("#rAcc").textContent=acc+"%";$("#rScore").textContent=note.toFixed(1).replace(".",",");$("#rXp").textContent=xp;$("#rank").textContent=acc>=95?"S+":acc>=90?"S":acc>=80?"A":acc>=70?"B":acc>=60?"C":"D";if(mode==="evaluation")send({activityId:ID,activityTitle:TITLE,studentCode,group,startedAtIso:started,finishedAtIso:new Date().toISOString(),finished:true,xp,comboBest:bestCombo,correct:score,answered,accuracy:acc,score10:note,stage:5,events})}
async function send(p){const s=$("#saveState");s.textContent="Guardando resultado…";try{const k="attempt_"+ID+"_"+studentCode+"_"+started;if(sessionStorage.getItem(k)==="sent"){s.textContent="✓ Resultado ya registrado";return}const r=await fetch(WORKER,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(!r.ok)throw 0;sessionStorage.setItem(k,"sent");s.textContent="✓ Resultado registrado correctamente";s.className="feedback good"}catch{window._pending=p;s.textContent="No se ha podido registrar el resultado. No cierres esta página y avisa al profesor.";s.className="feedback badmsg";$("#retry").classList.remove("hidden")}}
function retrySend(){if(window._pending)send(window._pending)}
window.addEventListener("DOMContentLoaded",init);
