(async()=>{
 const KEY='rb_cart',root=$('om');let cart={};
 try{cart=JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch(e){}
 const cats=await(await fetch('/api/menu')).json(),price={};cats.forEach(c=>c.items.forEach(m=>price[m.name]=m.price));
 for(const k of Object.keys(cart))if(!price[k]||!(cart[k]>=1))delete cart[k];
 const add=new URLSearchParams(location.search).get('add');let startCat=null;
 if(add&&price[add]){if(!cart[add])cart[add]=1;history.replaceState(null,'','/order');const ci=cats.findIndex(c=>c.items.some(m=>m.name===add));if(ci>=0)startCat=ci}
 const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(cart))}catch(e){}};
 root.innerHTML=`<div id="bk0"></div><section class="osum" id="sum"><h2>Your order</h2><div id="lines"></div><div id="chk"></div></section>`;
 const u=await me;let done=false,step=0,single=false,N=0,leaves=[];
 const mq=matchMedia('(max-width:700px)');

 // ---------- the menu book (same look as the home page, but every dish can be ticked)
 const row=m=>{const q=cart[m.name]||0;return `<li data-n="${esc(m.name)}" class="${q?'on':''}" role="checkbox" aria-checked="${q>0}" tabindex="0"><span class="tk"></span><span class="nm">${esc(m.name)}</span><b>${money(m.price)}</b><span class="qt"><button type="button" data-d="-1" aria-label="Less">−</button><i>${q||1}</i><button type="button" data-d="1" aria-label="More">+</button></span></li>`};
 const face=(c,n,s)=>`<div class="face ${s}"><img class="corner ${s==='front'?'cr':'cl'}" src="/images/book/corner-${n}.png" alt="" onerror="this.style.display='none'"><div class="pt">THE MENU</div><h2 class="ch">${esc(c.name)}</h2><p class="tg">${esc(c.tagline||'')}</p><ul class="box ob">${c.items.map(row).join('')}</ul><span class="pg">${n}</span></div>`;
 const cover=`<div class="face front cover"><span class="scr">Red Booth</span><h1>MENU</h1><p class="tag">TASTE THAT BRINGS YOU BACK</p><div class="cp"><img src="/images/book/cover.jpg" alt="" onerror="this.style.display='none'"></div><b class="open">OPEN DAILY 11 AM – 11 PM</b></div>`;
 const blank='<div class="face back"></div>';

 function build(first){
  single=mq.matches;const host=$('bk0');
  const leafHtml=single
   ?[cover,...cats.map((c,i)=>face(c,i+1,'front'))].map(f=>`<div class="leaf">${f}${blank}</div>`)
   :[[null,0],[1,2],[3,4]].map(([a,b])=>`<div class="leaf">${a==null?cover:face(cats[a],a+1,'front')}${face(cats[b],b+1,'back')}</div>`);
  const H=single?['Tap the cover to open',...cats.map(c=>c.name),'Ready to order?']:['Tap the cover to open','Starters and Burgers','Steaks and Drinks','Desserts'];
  host.innerHTML=`<div class="mb ${single?'one':''}"><div class="scene"><div class="book ${single?'single':''}" id="bk"><div class="base"><div class="face thanks"><h2>Ready to order?</h2><a class="btn alt" href="#sum">View your order</a></div></div>${leafHtml.join('')}</div></div>
  <div class="ctrl"><button id="pv" aria-label="Previous page">←</button><span id="ht"></span><button id="nx" aria-label="Next page">→</button></div><p class="tip">Tap a dish to add it, then use + and − for how many. Tap an empty part of the page or the arrows to turn the page.</p></div>`;
  const bk=$('bk');leaves=[...bk.querySelectorAll('.leaf')];N=leaves.length;
  step=0;if(first&&startCat!=null)step=single?startCat+1:[1,1,2,2,3][Math.min(startCat,4)];
  function render(){leaves.forEach((l,i)=>{const f=i<step;l.classList.toggle('flip',f);l.style.zIndex=f?i+1:N-i+1;const fr=l.querySelector('.face.front'),bc=l.querySelector('.face.back');if(fr)fr.style.pointerEvents=f?'none':'auto';if(bc)bc.style.pointerEvents=f?'auto':'none';
   l.style.transition=`transform 1.1s cubic-bezier(.5,0,.2,1),z-index 0s linear ${f?'.55s':'0s'}`+(single?`,opacity 0s linear ${f?'1.05s':'0s'}`:'')});
   bk.className='book '+(single?'single p':'s')+step;$('ht').textContent=H[step];$('pv').disabled=step===0;$('nx').disabled=step===N}
  const go=s=>{step=Math.max(0,Math.min(N,s));render()};
  const pick=e=>{const li=e.target.closest('li[data-n]');if(!li)return false;
   const n=li.dataset.n,b=e.target.closest('.qt button');
   if(b){const q=(cart[n]||1)+(+b.dataset.d);if(q<1)delete cart[n];else cart[n]=Math.min(20,q)}
   else if(e.target.closest('.qt'))return true;
   else{if(cart[n])delete cart[n];else cart[n]=1}
   sync();return true};
  leaves.forEach((l,i)=>l.onclick=e=>{if(pick(e))return;if(e.target.closest('a,button'))return;go(i<step?i:i+1)});
  bk.onkeydown=e=>{if(e.key!=='Enter'&&e.key!==' ')return;const li=e.target.closest&&e.target.closest('li[data-n]');if(!li||e.target!==li)return;e.preventDefault();const n=li.dataset.n;if(cart[n])delete cart[n];else cart[n]=1;sync()};
  $('pv').onclick=()=>go(step-1);$('nx').onclick=()=>go(step+1);render();sync();
 }

 // ---------- cart summary and bottom bar
 function sync(){
  document.querySelectorAll('#bk0 li[data-n]').forEach(li=>{const n=li.dataset.n,q=cart[n]||0;li.classList.toggle('on',q>0);li.setAttribute('aria-checked',q>0);li.querySelector('.qt i').textContent=q||1});
  const names=Object.keys(cart),count=names.reduce((a,n)=>a+cart[n],0),total=names.reduce((a,n)=>a+cart[n]*price[n],0);
  const L=$('lines');if(L)L.innerHTML=names.length?`<ul class="ol">${names.map(n=>`<li><span class="oq">${cart[n]} ×</span><span class="on">${esc(n)}</span><span class="ot">${money(cart[n]*price[n])}</span></li>`).join('')}</ul><p class="otot"><span>Total (${count} item${count>1?'s':''})</span><b>${money(total)}</b></p>`:'<p class="muted">Nothing selected yet. Open the menu book and tap a dish to add it.</p>';
  const c=$('chk');if(c)c.hidden=!names.length;
  $('obar').hidden=!names.length||done;$('obt').textContent=count+' item'+(count>1?'s':'')+' · '+money(total);
  save()}

 const chk=$('chk');
 if(!u)loginNote(chk,'to place your order. The dishes you ticked are saved.');
 else{chk.innerHTML=`<form class="form"><h3>Delivery details</h3><input name="name" required minlength="2" placeholder="Full name" value="${esc(u.name)}"><input name="phone" required inputmode="numeric" minlength="8" maxlength="15" pattern="\\d{8,15}" title="8 to 15 digits" placeholder="Phone number (digits only)"><textarea name="address" required rows="3" placeholder="Delivery address"></textarea><button class="btn alt">Place order</button><p class="err"></p></form>`;
  const f=chk.firstChild;f.phone.oninput=()=>f.phone.value=f.phone.value.replace(/\D/g,'');
  f.onsubmit=async e=>{e.preventDefault();const err=f.querySelector('.err');err.textContent='';
   const items=Object.keys(cart).map(name=>({name,qty:cart[name]}));if(!items.length){err.textContent='Please select at least one dish.';return}
   const b=Object.fromEntries(new FormData(f));b.items=items;const r=await post('/api/orders',b),j=await r.json().catch(()=>({}));
   if(r.ok){cart={};save();done=true;sync();$('sum').innerHTML=`<p class="okmsg">Thanks ${esc(b.name)}! Your order is in. We will call you to confirm. <a href="/account"><b>Track it in your account</b></a>.</p>`;scrollTo({top:$('sum').offsetTop-120})}
   else if(r.status===401)loginNote(chk,'to place your order.');else err.textContent=j.error||'Something went wrong'}}

 build(true);
 mq.addEventListener('change',()=>build(false));
})();
