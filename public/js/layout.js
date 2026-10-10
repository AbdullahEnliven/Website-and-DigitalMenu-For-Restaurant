const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=p=>'$'+Number(p).toFixed(2).replace(/\.00$/,'');
const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const $=id=>document.getElementById(id);
const hd=$('hdr'),ft=$('ftr');
const me=fetch('/api/me').then(r=>r.ok?r.json():null).catch(()=>null);
if(hd)hd.innerHTML=`<header class="hdr"><a href="/" class="brand">RED BOOTH DINER</a><nav><a href="/#story">Our story</a><a href="/#menu">Menu</a><a href="/#reviews">Reviews</a></nav>
<div class="call"><small>CALL US TODAY</small><b>(555) 010-1966</b></div><a class="acl" id="acl" href="/login">Log in</a><div class="hbtns"><a class="btn alt" href="/reserve">Reserve</a><a class="btn alt" href="/order">Order delivery</a></div></header>`;
me.then(u=>{const a=$('acl');if(a&&u){a.href='/account';a.textContent='My account'}});
if(ft)ft.innerHTML=`<footer class="ftr"><div class="fg"><div><div class="brand">RED BOOTH DINER</div><p>Family-owned American diner. Burgers, steaks and thick shakes served the old-school way.</p></div>
<div><h4>MENU</h4>${['starters:Starters','burgers:Burgers','steaks:Steaks','drinks:Shakes & Drinks','desserts:Desserts'].map(x=>x.split(':')).map(([s,n])=>`<a href="/menu/${s}" target="_blank">${n}</a>`).join('')}</div>
<div><h4>DINER</h4><a href="/#story">Our story</a><a href="/#reviews">Reviews</a><a href="/reserve">Reserve a table</a><a href="/order">Home delivery</a></div>
<div><h4>VISIT US</h4><p><span class="fh">PHONE</span>(555) 010-1966</p><p><span class="fh">ADDRESS</span>1966 Route 66 Highway<br>Tulsa, OK 74103</p><p><span class="fh">OPEN DAILY</span>11 AM to 11 PM</p></div></div><div class="copy">© Red Booth Diner. Demo website.</div></footer>`;
const post=(u,b)=>fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
const loginNote=(el,what)=>el.innerHTML=`<p class="okmsg">Please <a href="/login?next=${encodeURIComponent(location.pathname+location.search)}"><b>log in</b></a> or <a href="/login?signup=1&next=${encodeURIComponent(location.pathname+location.search)}"><b>sign up</b></a> ${what}</p>`;
async function orderForm(el,item){
 const u=await me;if(!u)return loginNote(el,'to place your order. Then you can follow its status in your account.');
 el.innerHTML=`<form class="form">${item?`<p>Item: <b>${esc(item)}</b></p>`:''}<input name="name" required minlength="2" placeholder="Full name" value="${esc(u.name)}"><input name="phone" required inputmode="numeric" minlength="8" maxlength="15" pattern="\\d{8,15}" title="8 to 15 digits" placeholder="Phone number (digits only)"><textarea name="address" required rows="3" placeholder="Delivery address"></textarea><button class="btn alt">Order now</button><p class="err"></p></form>`;
 const f=el.firstChild;f.phone.oninput=()=>f.phone.value=f.phone.value.replace(/\D/g,'');
 f.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(f));b.item=item;const r=await post('/api/orders',b),j=await r.json().catch(()=>({}));
  if(r.ok)el.innerHTML=`<p class="okmsg">Thanks ${esc(b.name)}! Your order is in. We will call you to confirm. <a href="/account"><b>Track it in your account</b></a>.</p>`;
  else if(r.status===401)loginNote(el,'to place your order.');else f.querySelector('.err').textContent=j.error||'Something went wrong'}}
document.head.append(Object.assign(document.createElement('script'),{src:'/js/fx.js',defer:true}));
