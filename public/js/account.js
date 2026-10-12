(async()=>{
 const u=await me;if(!u){location.href='/login?next=/account';return}
 let d,tz;
 const dt=(i,z)=>new Date(i).toLocaleString([],{dateStyle:'medium',timeStyle:'short',timeZone:z});
 const LBL={new:'Order received',confirmed:'Confirmed','out for delivery':'Out for delivery',delivered:'Delivered',completed:'Completed'},CL={new:'new',confirmed:'cf','out for delivery':'out',delivered:'ok',completed:'ok'};
 const bd=r=>r.status==='cancelled'?`<span class="bd x">${r.cancelled_by==='user'?'Cancelled by you':'Cancelled by Red Booth Diner'}</span>`:`<span class="bd ${CL[r.status]||''}">${esc(LBL[r.status]||r.status)}</span>`;
 const can=(t,r)=>t==='orders'?['new','confirmed'].includes(r.status):r.status==='confirmed'&&new Date(r.starts_at)>new Date();
 const btn=(t,r)=>can(t,r)?`<button class="btn ghost sm" data-t="${t}" data-id="${r.id}">Cancel</button>`:'';
 const items=r=>Array.isArray(r.items)&&r.items.length?`<ul class="its">${r.items.map(x=>`<li>${x.qty} × ${esc(x.name)}</li>`).join('')}</ul>${r.total?`<div class="tot">Total ${money(r.total)}</div>`:''}`:esc(r.item||'-');
 const table=(head,rows)=>`<div class="scroll"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
 const rv=r=>`<tr><td>${dt(r.starts_at,tz)}</td><td>${r.guests}</td><td>${r.seats} seats</td><td>${bd(r)}</td><td>${btn('reservations',r)}</td></tr>`;
 const eta=r=>r.eta_at&&['new','confirmed','out for delivery'].includes(r.status)?`<div class="eta2">⏱ Estimated arrival: <b>${new Date(r.eta_at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</b><br><small>Restaurant's estimate: ${r.eta_minutes} min</small></div>`:'';
 const od=r=>`<tr><td>${dt(r.created_at)}</td><td>${items(r)}</td><td>${esc(r.address)}</td><td>${bd(r)}${eta(r)}</td><td>${btn('orders',r)}</td></tr>`;
 const sec=(title,list,head,row,empty)=>`<h3 class="sec">${title}<small>(${list.length})</small></h3>${list.length?table(head,list.map(row)):`<p class="muted">${empty}</p>`}`;
 async function load(){const r=await fetch('/api/my');if(r.status===401){location.href='/login?next=/account';return}d=await r.json();tz=d.tz;draw()}
 function draw(){
  const R=d.reservations,O=d.orders,live=r=>r.status!=='cancelled',dead=r=>r.status==='cancelled';
  $('ac').innerHTML=`<h2>My table reservations</h2>
  ${sec('Confirmed',R.filter(live),['When','Guests','Table','Status',''],rv,'No confirmed reservations. <a href="/reserve"><b>Reserve a table</b></a>')}
  ${sec('Cancelled',R.filter(dead),['When','Guests','Table','Status',''],rv,'Nothing cancelled.')}
  <h2>My home deliveries</h2>
  <p class="eta">⏱ Expected delivery time: about <b>30 minutes</b>. If your location is far from the restaurant, it can take a little longer.</p>
  ${sec('Active orders',O.filter(live),['Placed','Items','Address','Status',''],od,'No orders yet. <a href="/order"><b>Order delivery</b></a>')}
  ${sec('Cancelled',O.filter(dead),['Placed','Items','Address','Status',''],od,'Nothing cancelled.')}
  <p class="err" id="er"></p>`}
 $('ac').onclick=async e=>{
  const b=e.target.closest('[data-t]');if(!b||!confirm('Cancel this?'))return;
  const r=await post('/api/my/cancel',{type:b.dataset.t,id:b.dataset.id}),j=await r.json();
  if(r.ok)load();else $('er').textContent=j.error||'Could not cancel.'};
 $('lo').hidden=false;$('lo').onclick=async()=>{await post('/api/logout',{});location.href='/'};
 load();setInterval(()=>{if(!document.hidden)load()},10000);
})();
