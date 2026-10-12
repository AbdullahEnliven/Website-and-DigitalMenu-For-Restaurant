const app=$('app');
// the token only lives in this page's memory: refresh or reopen the page and the password is asked again
let tok=null,d=null,tz='',main='orders',sub='active',q='';
const TABS={orders:[['active','Active',['new','confirmed','out for delivery']],['completed','Completed',['delivered']],['cancelled','Cancelled',['cancelled']]],
 reservations:[['active','Confirmed',['confirmed','completed']],['cancelled','Cancelled',['cancelled']]]};
const NEXT={new:['confirmed','Confirm order'],confirmed:['out for delivery','Out for delivery'],'out for delivery':['delivered','Mark delivered']};
const LBL={new:'New',confirmed:'Confirmed','out for delivery':'Out for delivery',delivered:'Delivered',cancelled:'Cancelled',completed:'Completed'};
const CLS={new:'new',confirmed:'cf','out for delivery':'out',delivered:'ok',completed:'ok',cancelled:'x'};
const Z=()=>tz?{timeZone:tz}:{};
const fdt=i=>new Date(i).toLocaleString([],{dateStyle:'medium',timeStyle:'short',...Z()}),
 tmf=i=>new Date(i).toLocaleTimeString([],{hour:'numeric',minute:'2-digit',...Z()}),
 dkey=i=>new Date(i).toLocaleDateString('en-CA',Z()),
 fday=i=>new Date(i).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',...Z()});
const by=r=>r.cancelled_by==='user'?'Cancelled by customer':'Cancelled by restaurant';
async function load(){if(!tok)return login();
 const r=await fetch('/api/admin/data',{headers:{'x-admin-token':tok}});if(r.status===401){tok=null;return login()}
 d=await r.json();tz=d.tz||'';if(!$('lst'))shell();draw()}
function login(){d=null;app.innerHTML=`<h1>Admin</h1><p class="lead">Enter the admin password to see orders and reservations.</p><form class="form" id="lf"><input name="password" type="password" required autocomplete="new-password" placeholder="Admin password"><button class="btn">Log in</button><p class="err"></p></form>`;
 const f=$('lf');f.password.focus();
 f.onsubmit=async e=>{e.preventDefault();const r=await post('/api/admin/login',{password:f.password.value}),j=await r.json();if(r.ok){tok=j.token;load()}else f.querySelector('.err').textContent=j.error||'Wrong password'}}
function shell(){
 app.innerHTML=`<div class="atop"><div><h1>Red Booth Diner admin</h1><p class="muted" id="note"></p></div><button class="ab" id="lo">Log out</button></div>
 <div class="acards" id="cards"></div><div class="tabs" id="mt"></div><div class="tabs sub" id="st"></div>
 <input class="asearch" id="sq" type="search" placeholder="Search by name or phone" autocomplete="off"><div class="scroll" id="lst"></div>`;
 $('sq').oninput=e=>{q=e.target.value.trim().toLowerCase();drawList()};
 $('lo').onclick=()=>{tok=null;login()}}
const ab=(r,st,label,cls='')=>`<button class="ab ${cls}" data-id="${r.id}" data-st="${st}">${label}</button>`;
function actions(r,past){
 if(r.status==='cancelled')return main==='orders'?ab(r,'new','Reopen'):'';
 if(main==='reservations')return past?'':ab(r,'cancelled','Cancel','dng');
 return (NEXT[r.status]?ab(r,NEXT[r.status][0],NEXT[r.status][1],'go'):'')+(r.status==='delivered'?'':ab(r,'cancelled','Cancel','dng'))}
const badge=r=>`<span class="bd ${CLS[r.status]||''}">${esc(LBL[r.status]||r.status)}</span>`+(r.status==='cancelled'?`<small class="by">${by(r)}</small>`:'');
const lt=i=>new Date(i).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),ldt=i=>new Date(i).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});
const etaOf=r=>r.eta_at&&['new','confirmed','out for delivery'].includes(r.status)?`<small class="by">Promised: arrives by <b>${lt(r.eta_at)}</b> (${r.eta_minutes} min)</small>`:'';
const etaBox=r=>['new','confirmed','out for delivery'].includes(r.status)?`<div class="etab"><label>Delivery time<span><input class="emin" type="number" min="5" max="480" step="5" value="${r.eta_minutes||30}" aria-label="Minutes"> min</span></label><button class="ab go" data-eta="${r.id}">${r.eta_at?'Update time':'Set time'}</button></div>`:'';
const who=r=>`<b>${esc(r.name)}</b><br><a class="tel" href="tel:${esc(r.phone)}">${esc(r.phone)}</a>`;
const itemsOf=r=>Array.isArray(r.items)&&r.items.length?`<ul class="its">${r.items.map(x=>`<li>${x.qty} × ${esc(x.name)}</li>`).join('')}</ul>${r.total?`<div class="tot">Total ${money(r.total)}</div>`:''}`:esc(r.item||'-');
function counts(){const now=Date.now(),today=dkey(now),O=d.orders,R=d.reservations,live=R.filter(r=>r.status==='confirmed');
 return[['New orders',O.filter(r=>r.status==='new').length,1],['Out for delivery',O.filter(r=>r.status==='out for delivery').length,0],
  ['Reservations today',live.filter(r=>dkey(r.starts_at)===today&&new Date(r.ends_at)>now).length,0],['Upcoming reservations',live.filter(r=>new Date(r.starts_at)>now).length,0]]}
function draw(){
 const rows=d[main],T=TABS[main];if(!T.find(t=>t[0]===sub))sub='active';
 const c=counts();$('cards').innerHTML=c.map(([n,v,hot])=>`<div class="acard${hot&&v?' hot':''}"><b>${v}</b><span>${n}</span></div>`).join('');
 const newN=d.orders.filter(r=>r.status==='new').length;
 $('mt').innerHTML=[['orders','Home deliveries'],['reservations','Table reservations']].map(([k,n])=>`<button data-m="${k}" class="${main===k?'on':''}">${n}${k==='orders'&&newN?` <i class="pip">${newN}</i>`:''}</button>`).join('');
 $('st').innerHTML=T.map(t=>`<button data-s="${t[0]}" class="${sub===t[0]?'on':''}">${t[1]} (${rows.filter(r=>t[2].includes(r.status)).length})</button>`).join('');
 $('note').textContent='Order and delivery times use your device time. Reservation times are in restaurant time'+(tz?' ('+tz+')':'')+'. This page refreshes by itself every 10 seconds.';
 drawList()}
function drawList(){
 const rows=d[main],cur=TABS[main].find(t=>t[0]===sub),o=main==='orders',now=Date.now();
 let list=rows.filter(r=>cur[2].includes(r.status));
 if(q)list=list.filter(r=>(r.name+' '+r.phone).toLowerCase().includes(q));
 if(!o&&sub==='active'){const up=list.filter(r=>new Date(r.ends_at)>=now).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)),pa=list.filter(r=>new Date(r.ends_at)<now);list=up.concat(pa)}
 if(!list.length){$('lst').innerHTML=`<p class="empty">${q?'Nothing matches your search.':o?'No orders here yet.':'No reservations here yet.'}</p>`;return}
 const head=o?['Received','Customer','Items','Address','Status','Action']:['When','Customer','Guests','Table','Status','Action'];
 const tr=r=>{
  if(o)return `<tr class="${r.status==='new'?'isnew':''}"><td data-label="Received">${ldt(r.created_at)}</td><td data-label="Customer">${who(r)}</td><td data-label="Items">${itemsOf(r)}</td><td data-label="Address">${esc(r.address)}</td><td data-label="Status">${badge(r)}${etaOf(r)}</td><td data-label="Action"><div class="acts">${actions(r)}</div>${etaBox(r)}</td></tr>`;
  const past=new Date(r.ends_at)<now,td=dkey(r.starts_at)===dkey(now);
  return `<tr class="${past&&r.status!=='cancelled'?'past':''}"><td data-label="When"><b>${fday(r.starts_at)}</b>${td?' <span class="bd ok">Today</span>':''}<br>${tmf(r.starts_at)} – ${tmf(r.ends_at)}</td><td data-label="Customer">${who(r)}</td><td data-label="Guests">${r.guests}</td><td data-label="Table">${esc(r.table_name)} (${r.seats} seats)</td><td data-label="Status">${badge(r)}${past&&r.status!=='cancelled'?'<small class="by">Finished</small>':''}</td><td data-label="Action"><div class="acts">${actions(r,past)}</div></td></tr>`};
 $('lst').innerHTML=`<table class="atbl"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${list.map(tr).join('')}</tbody></table>`}
app.onclick=async e=>{
 const b=e.target.closest('button');if(!b||!d)return;
 if(b.dataset.eta){const inp=b.closest('.etab').querySelector('.emin'),m=Math.round(+inp.value);
  if(!(m>=5&&m<=480)){alert('Please enter the delivery time in minutes (5 to 480).');return}
  b.disabled=true;const r=await fetch('/api/admin/data',{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-token':tok},body:JSON.stringify({type:'orders',id:b.dataset.eta,eta_minutes:m})});
  if(!r.ok){const j=await r.json().catch(()=>({}));alert(j.error||'Could not save the time.')}load();return}
 if(b.dataset.m){main=b.dataset.m;sub='active';return draw()}
 if(b.dataset.s){sub=b.dataset.s;return draw()}
 if(b.dataset.st){if(b.dataset.st==='cancelled'&&!confirm('Cancel this '+(main==='orders'?'order':'reservation')+'?'))return;
  b.disabled=true;const r=await fetch('/api/admin/data',{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-token':tok},body:JSON.stringify({type:main,id:b.dataset.id,status:b.dataset.st})});
  if(!r.ok){const j=await r.json().catch(()=>({}));alert(j.error||'Could not update. Please try again.')}load()}};
load();setInterval(()=>{const a=document.activeElement;if(d&&!(a&&a.closest&&a.closest('.etab')))load()},10000);
