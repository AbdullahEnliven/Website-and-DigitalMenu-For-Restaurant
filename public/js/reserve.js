const fmt=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
let RTZ,RDUR=2;const tm=i=>new Date(i).toLocaleTimeString([],{hour:'numeric',minute:'2-digit',timeZone:RTZ}),rg=x=>tm(x)+' – '+tm(+new Date(x)+RDUR*36e5);
me.then(u=>{if(!u)return loginNote($('rv'),'to book a table. Then you can see your reservations in your account.');
const box=$('rv');let pick='',slots=null;
const today=new Date(),max=new Date();max.setDate(max.getDate()+30);const tom=new Date();tom.setDate(tom.getDate()+1);
box.innerHTML=`<div class="form wide"><label>Date<input type="date" id="dt" value="${fmt(tom)}" min="${fmt(today)}" max="${fmt(max)}"></label>
<label>Guests<select id="gs">${[2,4,6,8,10].map(n=>`<option ${n===2?'selected':''}>${n}</option>`).join('')}</select></label>
<p class="muted">We are open every day from 11 AM to 11 PM. Pick a date and the number of guests, then choose any free time. Each booking holds the table for 2 hours (11 AM–1 PM, 1–3 PM, and so on until 11 PM). <span id="tzn"></span></p>
<div id="sl"></div><form class="form" id="bf" hidden><input name="name" required minlength="2" placeholder="Full name"><input name="phone" required inputmode="numeric" minlength="8" maxlength="15" pattern="\\d{8,15}" title="8 to 15 digits" placeholder="Phone number (digits only)"><button class="btn alt" id="bb"></button></form><p class="err" id="er"></p></div>`;
const bf=$('bf');bf.name.value=u.name;bf.phone.oninput=()=>bf.phone.value=bf.phone.value.replace(/\D/g,'');
function draw(){const s=$('sl');
 if(slots===null)s.innerHTML='<p>Checking tables...</p>';
 else if(!slots.length){s.innerHTML='<p>No tables are free on this date for that many guests. Please try another date or fewer guests.</p>';pick=''}
 else{if(!slots.includes(pick))pick='';s.innerHTML='<div class="slots">'+slots.map(x=>`<button type="button" data-t="${x}" class="${x===pick?'on':''}">${rg(x)}</button>`).join('')+'</div>'}
 bf.hidden=!pick;if(pick)$('bb').textContent='Book '+rg(pick)}
async function load(){const[y,m,d]=$('dt').value.split('-').map(Number);if(!y)return;
 const r=await fetch(`/api/availability?date=${$('dt').value}&guests=${$('gs').value}`),j=await r.json();
 RTZ=j.tz;RDUR=j.dur||2;if($('tzn'))$('tzn').textContent='Times are in restaurant time ('+j.tz+'). '+(j.seats?'Your party gets a table with '+j.seats+' seats.':'');slots=j.slots||[];draw()}
$('sl').onclick=e=>{const b=e.target.closest('button');if(b){pick=b.dataset.t;draw()}};
$('dt').onchange=$('gs').onchange=()=>{slots=null;draw();load()};
bf.onsubmit=async e=>{e.preventDefault();$('er').textContent='';
 const b=Object.fromEntries(new FormData(bf)),g=+$('gs').value,r=await post('/api/reservations',{start:pick,guests:g,...b}),j=await r.json();
 if(r.ok)box.innerHTML=`<p class="okmsg">You are booked, ${esc(b.name)}! ${g} guest${g>1?'s':''} on ${new Date(pick).toLocaleString([],{dateStyle:'full',timeStyle:'short',timeZone:RTZ})}. See you at the diner. <a href="/account"><b>View it in your account</b></a>.</p>`;
 else if(r.status===401)loginNote(box,'to book a table.');else{$('er').textContent=j.error||'Something went wrong';load()}};
draw();load();setInterval(()=>{if(document.getElementById('dt'))load()},15000);
});
