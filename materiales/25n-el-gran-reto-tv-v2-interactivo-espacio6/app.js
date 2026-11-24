
const D=window.GAME_DATA;
const COLORS=["#34e7ff","#ff3ca6","#ffd84c","#42e582"];
let state={
  teams:[{name:"Equipo 1",score:0,color:COLORS[0]},{name:"Equipo 2",score:0,color:COLORS[1]}],
  activeTeam:0,sound:true,warmupIndex:0,warmupLocked:false,roscoIndex:0,roscoQueue:[],
  roscoStatus:{},roscoHits:0,duelTime:20,roscoTime:120
};
let duelTimerId=null,roscoTimerId=null;

const LYRIC_ITEMS=[
  {pre:"Hoy que la tierra no es ",answer:"plana",post:""},
  {pre:"Ni la ciencia ya es de ",answer:"herejes",post:""},
  {pre:"Más las pinturas ",answer:"rupestres",post:""},
  {pre:"Las palomas ",answer:"mensajeras",post:""},
  {pre:"Ahora que por fin las redes unen al ",answer:"planeta",post:""},
  {pre:"A ella ni tú ni nadie le para los ",answer:"pies",post:""},
  {pre:"Déjala que baile con otros ",answer:"zapatos",post:""},
  {pre:"Unos que no ",answer:"aprieten",post:" cuando quiera dar sus pasos"},
  {pre:"Déjala que baile con faldas de ",answer:"vuelo",post:""},
  {pre:"Con los pies descalzos dibujando un mundo ",answer:"nuevo",post:""},
  {pre:"Ella es destino, ella es ",answer:"origen",post:""},
  {pre:"Ella es principio y ella es ",answer:"final",post:""},
  {pre:"Baila con ella en esta fiesta que es ",answer:"global",post:""},
  {pre:"Para poder desahogarnos hemos inventado ",answer:"Twitter",post:""},
  {pre:"Los filósofos no brindan con ",answer:"cicuta",post:""},
  {pre:"Pues ninguna estrella pide permiso para ",answer:"brillar",post:""}
];
let lyricState={selected:null,answers:{},checked:false,scored:false,listens:{}};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

function go(id){$$(".screen").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active")}
function openSetup(){setTeamCount(state.teams.length||2);go("setup")}
function openHow(){go("how")}
function showRounds(){stopTimers();renderScoreboard();go("rounds")}
function save(){localStorage.setItem("tv25n_state",JSON.stringify(state))}
function load(){try{const x=JSON.parse(localStorage.getItem("tv25n_state"));if(x&&x.teams)state={...state,...x}}catch{}}
function beep(freq=600,dur=.09,type="sine"){
 if(!state.sound)return;try{const a=new (window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.12,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);o.start();o.stop(a.currentTime+dur)}catch{}
}
function fanfare(){beep(520,.12);setTimeout(()=>beep(660,.12),120);setTimeout(()=>beep(820,.25),250)}
function buzz(){beep(170,.25,"sawtooth")}
function toggleSound(){state.sound=!state.sound;$("#soundLabel").textContent=state.sound?"Sonido ON":"Sonido OFF";save()}
function toggleFullscreen(){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()}

function setTeamCount(n){
 state.teams=Array.from({length:n},(_,i)=>state.teams[i]||{name:`Equipo ${i+1}`,score:0,color:COLORS[i]});
 renderTeamInputs()
}
function renderTeamInputs(){
 const w=$("#teamInputs");w.innerHTML="";
 state.teams.forEach((t,i)=>{const d=document.createElement("div");d.className="team-input";d.innerHTML=`<span class="team-dot" style="--team:${t.color}"></span><input value="${escapeHtml(t.name)}" maxlength="18">`;d.querySelector("input").oninput=e=>{t.name=e.target.value||`Equipo ${i+1}`};w.appendChild(d)})
}
function startShow(){state.teams.forEach((t,i)=>{const inp=$("#teamInputs").querySelectorAll("input")[i];if(inp)t.name=inp.value.trim()||`Equipo ${i+1}`});save();renderScoreboard();renderMusicPicker();showRounds()}
function renderScoreboard(){
 const w=$("#scoreboard");w.innerHTML="";
 state.teams.forEach((t,i)=>{const d=document.createElement("div");d.className="score-card"+(i===state.activeTeam?" active":"");d.style.setProperty("--team",t.color);d.innerHTML=`<span class="team-dot"></span><b>${escapeHtml(t.name)}</b><strong>${t.score}</strong>`;w.appendChild(d)})
}
function addScore(i,pts){state.teams[i].score+=pts;save();renderScoreboard();if(pts>0)fanfare();else if(pts<0)buzz()}
function renderMusicPicker(){const w=$("#musicTeamPicker");if(!w)return;w.innerHTML=`<select id="musicTeam">${state.teams.map((t,i)=>`<option value="${i}">${escapeHtml(t.name)}</option>`).join("")}</select>`}
function manualPoints(pts){const i=Number($("#musicTeam").value||0);addScore(i,pts)}
function startMusicRound(){
 renderMusicPicker();
 renderLyrics();
 lyricState.checked=false;
 $("#lyricsFeedback").textContent="";
 go("musicRound")
}
function toggleWorksheetZoom(){$("#zoomModal").classList.toggle("hidden")}


function renderLyrics(){
 const panel=$("#lyricsPanel"),bank=$("#wordBank");
 if(!panel||!bank)return;
 panel.innerHTML="";
 LYRIC_ITEMS.forEach((it,i)=>{
   const line=document.createElement("div");line.className="lyric-line";
   const b=document.createElement("button");
   b.className="blank";
   if(lyricState.selected===i)b.classList.add("selected");
   if(lyricState.answers[i])b.classList.add("filled");
   if(lyricState.checked)b.classList.add(norm(lyricState.answers[i])===norm(it.answer)?"good":"bad");
   b.textContent=lyricState.answers[i]||"________";
   b.onclick=()=>{if(lyricState.checked)return;lyricState.selected=i;renderLyrics()};
   line.append(document.createTextNode(it.pre),b,document.createTextNode(it.post));
   panel.appendChild(line);
 });
 const used=Object.values(lyricState.answers).map(norm);
 bank.innerHTML="";
 shuffle(LYRIC_ITEMS.map(x=>x.answer)).forEach(word=>{
   const c=document.createElement("button");c.className="word-chip";
   if(used.includes(norm(word)))c.classList.add("used");
   c.textContent=word;
   c.onclick=()=>placeWord(word);
   bank.appendChild(c)
 });
 $("#lyricsDone").textContent=Object.keys(lyricState.answers).length;
}

function placeWord(word){
 if(lyricState.checked)return;
 if(lyricState.selected===null){
   $("#lyricsFeedback").textContent="Primero toca uno de los huecos.";
   $("#lyricsFeedback").className="feedback-tv bad";
   return
 }
 const current=lyricState.answers[lyricState.selected];
 const already=Object.entries(lyricState.answers).find(([k,v])=>norm(v)===norm(word) && Number(k)!==lyricState.selected);
 if(already){
   $("#lyricsFeedback").textContent="Esa palabra ya está colocada en otro hueco.";
   $("#lyricsFeedback").className="feedback-tv bad";
   return
 }
 if(current){}
 lyricState.answers[lyricState.selected]=word;
 lyricState.selected=null;
 $("#lyricsFeedback").textContent="";
 renderLyrics()
}

function checkLyrics(){
 if(lyricState.checked)return;
 lyricState.checked=true;
 let hits=0;
 LYRIC_ITEMS.forEach((it,i)=>{if(norm(lyricState.answers[i])===norm(it.answer))hits++});
 renderLyrics();
 const pts=hits*2;
 $("#lyricsFeedback").textContent=`${hits} de ${LYRIC_ITEMS.length} huecos correctos · +${pts} puntos`;
 $("#lyricsFeedback").className="feedback-tv "+(hits>=12?"good":"bad");
 if(!lyricState.scored){
   const i=Number($("#musicTeam").value||0);
   addScore(i,pts);
   lyricState.scored=true
 }
 $("#checkLyricsBtn").disabled=true
}

function resetLyrics(){
 if(!confirm("¿Reiniciar todos los huecos de esta ronda?"))return;
 lyricState={selected:null,answers:{},checked:false,scored:false,listens:{}};
 $("#checkLyricsBtn").disabled=false;
 $("#lyricsFeedback").textContent="";
 ["listen1","listen2"].forEach(id=>$("#"+id)?.classList.remove("on"));
 renderLyrics()
}

function markListen(n){
 lyricState.listens[n]=true;
 $("#listen"+n)?.classList.add("on");
 beep(n===1?460:620,.08)
}

function startWarmup(){
 stopTimers();state.warmupIndex=0;state.warmupLocked=false;state.activeTeam=0;go("warmup");renderScoreboard();renderWarmup()
}
function renderWarmup(){
 const q=D.warmup[state.warmupIndex];state.warmupLocked=false;$("#duelNext").disabled=true;$("#duelFeedback").textContent="";$("#duelFeedback").className="feedback-tv";$("#duelLetter").textContent=q.letter;$("#duelDefinition").textContent=q.definition;$("#duelTeam").textContent=state.teams[state.activeTeam].name;
 const w=$("#duelOptions");w.innerHTML="";
 shuffle(q.options.map(x=>x)).forEach(opt=>{const b=document.createElement("button");b.className="tv-option";b.textContent=opt;b.onclick=()=>answerWarmup(opt,b);w.appendChild(b)});
 startDuelTimer()
}
function answerWarmup(opt,b){
 if(state.warmupLocked)return;state.warmupLocked=true;clearInterval(duelTimerId);
 const q=D.warmup[state.warmupIndex],ok=norm(opt)===norm(q.answer);
 $$(".tv-option").forEach(x=>{x.disabled=true;if(norm(x.textContent)===norm(q.answer))x.classList.add("correct")});
 if(ok){addScore(state.activeTeam,10);$("#duelFeedback").textContent="¡CORRECTO! +10 puntos";$("#duelFeedback").className="feedback-tv good"}else{b.classList.add("wrong");buzz();$("#duelFeedback").textContent=`Respuesta: ${q.answer}`;$("#duelFeedback").className="feedback-tv bad"}
 $("#duelNext").disabled=false
}
function nextWarmup(){
 if(state.warmupIndex>=D.warmup.length-1){showRounds();return}
 state.warmupIndex++;state.activeTeam=(state.activeTeam+1)%state.teams.length;renderScoreboard();renderWarmup()
}
function startDuelTimer(){clearInterval(duelTimerId);state.duelTime=20;$("#duelTimer").textContent=state.duelTime;duelTimerId=setInterval(()=>{state.duelTime--;$("#duelTimer").textContent=state.duelTime;if(state.duelTime<=0){clearInterval(duelTimerId);if(!state.warmupLocked){state.warmupLocked=true;buzz();$("#duelFeedback").textContent="¡TIEMPO!";$("#duelFeedback").className="feedback-tv bad";$("#duelNext").disabled=false;$$(".tv-option").forEach(x=>{x.disabled=true})}}},1000)}

function startRosco(){
 stopTimers();state.activeTeam=0;state.roscoIndex=0;state.roscoQueue=D.rosco.map((_,i)=>i);state.roscoStatus={};state.roscoHits=0;state.roscoTime=120;go("rosco");renderScoreboard();buildWheel();renderRosco();startRoscoTimer()
}
function buildWheel(){
 const w=$("#letterWheel");w.innerHTML="";const n=D.rosco.length,cx=50,cy=50,r=44;
 D.rosco.forEach((q,i)=>{const a=(-90+i*360/n)*Math.PI/180;const e=document.createElement("div");e.className="wheel-letter";e.id="wl"+i;e.style.left=(cx+r*Math.cos(a))+"%";e.style.top=(cy+r*Math.sin(a))+"%";e.textContent=q.letter;w.appendChild(e)})
}
function renderRosco(){
 if(!state.roscoQueue.length){finishRosco();return}
 state.roscoIndex=state.roscoQueue[0];const q=D.rosco[state.roscoIndex];
 $$(".wheel-letter").forEach(x=>x.classList.remove("current"));$("#wl"+state.roscoIndex).classList.add("current");
 $("#roscoLetter").textContent=q.letter;$("#roscoDefinition").textContent=q.definition;$("#roscoTeam").textContent=state.teams[state.activeTeam].name;$("#roscoHits").textContent=state.roscoHits+" aciertos";$("#roscoAnswer").value="";$("#roscoFeedback").textContent="";$("#roscoFeedback").className="feedback-tv";setTimeout(()=>$("#roscoAnswer").focus(),100)
}
function checkRosco(){
 const ans=$("#roscoAnswer").value.trim();if(!ans)return;
 const q=D.rosco[state.roscoIndex],ok=norm(ans)===norm(q.answer);
 if(ok){state.roscoStatus[state.roscoIndex]="hit";$("#wl"+state.roscoIndex).classList.add("hit");state.roscoHits++;addScore(state.activeTeam,20);$("#roscoFeedback").textContent="¡CORRECTO! +20";$("#roscoFeedback").className="feedback-tv good";advanceRosco()}
 else{markRoscoWrong()}
}
function markRoscoWrong(){
 const q=D.rosco[state.roscoIndex];state.roscoStatus[state.roscoIndex]="miss";$("#wl"+state.roscoIndex).classList.add("miss");buzz();$("#roscoFeedback").textContent=`Fallo · era: ${q.answer}`;$("#roscoFeedback").className="feedback-tv bad";advanceRosco(900)
}
function passRosco(){state.roscoStatus[state.roscoIndex]="pass";$("#wl"+state.roscoIndex).classList.add("pass");const first=state.roscoQueue.shift();state.roscoQueue.push(first);beep(350,.08);renderRosco()}
function advanceRosco(delay=500){state.roscoQueue.shift();setTimeout(()=>{if(state.roscoQueue.length)renderRosco();else finishRosco()},delay)}
function startRoscoTimer(){clearInterval(roscoTimerId);$("#roscoTimer").textContent=state.roscoTime;roscoTimerId=setInterval(()=>{state.roscoTime--;$("#roscoTimer").textContent=state.roscoTime;if(state.roscoTime<=0){clearInterval(roscoTimerId);buzz();finishRosco()}},1000)}
function finishRosco(){
 clearInterval(roscoTimerId);save();
 if(state.activeTeam<state.teams.length-1){
   const next=state.activeTeam+1;
   if(confirm(`Fin del rosco de ${state.teams[state.activeTeam].name}. ¿Juega ahora ${state.teams[next].name}?`)){
     state.activeTeam=next;state.roscoIndex=0;state.roscoQueue=D.rosco.map((_,i)=>i);state.roscoStatus={};state.roscoHits=0;state.roscoTime=120;renderScoreboard();buildWheel();renderRosco();startRoscoTimer();return
   }
 }
 showWinner()
}
function showWinner(){
 stopTimers();renderScoreboard();const sorted=[...state.teams].sort((a,b)=>b.score-a.score);$("#winnerName").textContent=sorted[0].name;$("#finalScores").innerHTML=sorted.map((t,i)=>`<div class="final-score"><b>${i===0?"🏆 ":""}${escapeHtml(t.name)}</b><strong>${t.score}</strong><span>puntos</span></div>`).join("");makeConfetti();fanfare();go("winner")
}
function makeConfetti(){const w=$("#confetti");w.innerHTML="";for(let i=0;i<80;i++){const s=document.createElement("span");s.style.setProperty("--x",Math.random()*100+"%");s.style.setProperty("--c",COLORS[i%COLORS.length]);s.style.setProperty("--d",(2.5+Math.random()*3)+"s");s.style.setProperty("--delay",(-Math.random()*4)+"s");w.appendChild(s)}}
function stopTimers(){clearInterval(duelTimerId);clearInterval(roscoTimerId)}
function resetGame(){if(!confirm("¿Reiniciar todo el programa y el marcador?"))return;localStorage.removeItem("tv25n_state");location.reload()}

function openScoreControl(){
 const w=$("#scoreControl");w.innerHTML="";
 state.teams.forEach((t,i)=>{const d=document.createElement("div");d.className="score-control-row";d.innerHTML=`<b>${escapeHtml(t.name)} · ${t.score}</b><button style="background:#42e582" onclick="addScore(${i},10);openScoreControl()">+10</button><button style="background:#ffd84c" onclick="addScore(${i},20);openScoreControl()">+20</button><button style="background:#ff4d62;color:white" onclick="addScore(${i},-10);openScoreControl()">−10</button>`;w.appendChild(d)});$("#scoreModal").classList.remove("hidden")
}
function closeScoreControl(){$("#scoreModal").classList.add("hidden")}
function norm(s){return String(s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

load();renderScoreboard();renderMusicPicker();$("#soundLabel").textContent=state.sound?"Sonido ON":"Sonido OFF";
