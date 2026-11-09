
let ALL=[],kind='Todos',subject='Todos';

async function load(){
  try{
    const r=await fetch('catalogo.json?ts='+Date.now(),{cache:'no-store'});
    ALL=await r.json();
  }catch(e){ALL=[]}
  updateStats();
  renderFeatured();
  render();
}
function updateStats(){
  document.getElementById('statTotal').textContent=ALL.length;
  document.getElementById('statJuegos').textContent=ALL.filter(x=>x.tipo==='Juego').length;
  document.getElementById('statMaterias').textContent=new Set(ALL.map(x=>x.materia).filter(Boolean)).size;
}
function renderFeatured(){
  const box=document.getElementById('featured');
  const items=ALL.filter(x=>x.destacado).slice(0,3);
  box.innerHTML='';
  (items.length?items:ALL.slice(0,3)).forEach((x,i)=>{
    const a=document.createElement('a');
    a.className='featured-card fc'+(i%3);
    a.href=x.archivo;
    a.innerHTML=`<div class="big-icon">${x.icono||'📘'}</div><span class="tag" style="width:max-content;background:rgba(255,255,255,.18);color:#fff">${x.tipo||'Recurso'}</span><h3>${x.titulo}</h3><p>${x.descripcion||''}</p>`;
    box.appendChild(a);
  });
}
function render(){
  const q=document.getElementById('search').value.toLowerCase().trim();
  const items=ALL.filter(x=>{
    const t=`${x.titulo||''} ${x.descripcion||''} ${x.materia||''} ${x.tipo||''}`.toLowerCase();
    return t.includes(q)&&(kind==='Todos'||x.tipo===kind)&&(subject==='Todos'||x.materia===subject);
  }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  const grid=document.getElementById('grid'),empty=document.getElementById('empty');
  grid.innerHTML='';
  empty.hidden=items.length!==0;

  items.forEach(x=>{
    const a=document.createElement('a');
    a.className='resource'+(x.destacado?' featured':'');
    a.href=x.archivo;
    a.innerHTML=`<div class="resource-top"><span class="tag">${x.tipo||'Recurso'}</span><span class="resource-icon">${x.icono||'📘'}</span></div><h3>${x.titulo}</h3><p>${x.descripcion||''}</p><div class="meta"><span>📘 ${x.materia||'General'}</span><span>⏱ ${x.tiempo||'—'}</span></div>`;
    grid.appendChild(a);
  });
}
document.getElementById('search').addEventListener('input',render);
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');kind=b.dataset.kind;render();
}));
document.querySelectorAll('.subject-card').forEach(b=>b.addEventListener('click',()=>{
  subject=b.dataset.filter;
  document.getElementById('biblioteca').scrollIntoView({behavior:'smooth'});
  render();
}));
load();
