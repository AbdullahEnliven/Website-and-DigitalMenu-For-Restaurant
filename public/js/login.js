const q=new URLSearchParams(location.search);let mode=q.get('signup')?'up':'in';
const next=(n=>n&&n[0]==='/'&&n[1]!=='/'?n:'/account')(q.get('next'));
me.then(u=>{if(u)location.href=next});
function draw(){const up=mode==='up';
 $('lg').innerHTML=`<div class="tabs"><button data-m="in" class="${up?'':'on'}">Log in</button><button data-m="up" class="${up?'on':''}">Sign up</button></div>
 <form class="form" id="af" novalidate>${up?'<input name="name" required minlength="2" maxlength="80" autocomplete="name" placeholder="Full name">':''}<input name="email" type="email" required maxlength="254" autocomplete="email" placeholder="Email address"><input name="password" type="password" required minlength="6" maxlength="100" autocomplete="${up?'new-password':'current-password'}" placeholder="Password (at least 6 characters)"><button class="btn alt">${up?'Create account':'Log in'}</button><p class="err"></p></form>`;
 const f=$('af'),err=f.querySelector('.err');
 f.onsubmit=async e=>{e.preventDefault();err.textContent='';
  const b=Object.fromEntries(new FormData(f));b.email=b.email.trim();
  if(up&&b.name.trim().length<2)return err.textContent='Please enter your full name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email))return err.textContent='Please enter a valid email address.';
  if(b.password.length<6)return err.textContent='Password must be at least 6 characters.';
  const r=await post(up?'/api/signup':'/api/login',b),j=await r.json().catch(()=>({}));
  if(r.ok)location.href=next;else err.textContent=j.error||'Something went wrong'}}
$('lg').onclick=e=>{const b=e.target.closest('[data-m]');if(b){mode=b.dataset.m;draw()}};
draw();
