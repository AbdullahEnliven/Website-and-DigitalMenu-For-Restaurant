(async()=>{
 const r=await fetch('/api/menu/'+location.pathname.split('/').pop());
 if(!r.ok){document.body.innerHTML='<p style="padding:40px">Menu not found. <a href="/">Home</a></p>';return}
 const cat=await r.json(),it=cat.items,n=it.length,sl=$('sl');let cur=0,open=false;
 const T=[{bg:'#E8C79A',ink:'#fff7e8'},{bg:'#E8878A',ink:'#ffe9e6'},{bg:'#F2C94C',ink:'#fff6cf'},{bg:'#7A4A33',ink:'#a56d4f',d:1},{bg:'#3B5A49',ink:'#5d8470',d:1}];
 document.title=cat.name+' | Red Booth Diner';
 sl.innerHTML=`<div class="slnav"><span class="dn" id="dn" aria-label="Dish number"></span><a class="btn" id="back" href="/#menu">Back</a></div>
 <div class="stage"><div class="word" id="wd"></div>${it.map((m,i)=>`<div class="plate" data-i="${i}"><img src="/images/menu/${cat.slug}/${slugify(m.name)}.jpg" alt="${esc(m.name)}" onerror="this.style.display='none'"></div>`).join('')}<button class="arrow prev" id="pv" aria-label="Previous">←</button><button class="arrow next" id="nx" aria-label="Next">→</button></div>
 <section class="info"><div class="irow"><h2 id="nm"></h2><div class="dots">${it.map((m,i)=>`<button class="dt" data-i="${i}" aria-label="${esc(m.name)}"></button>`).join('')}</div><div class="buy"><span class="price" id="pr"></span><button class="btn ghost" id="vw">View</button><button class="btn" id="od">Order now</button></div></div>
 <div class="more"><div class="mi"><div id="dtl"></div></div></div></section>`;
 const plates=[...sl.querySelectorAll('.plate')],dots=[...sl.querySelectorAll('.dt')];
 const detail=x=>{const d=x.details||{};return `<p class="long">${esc(d.l||x.description)}</p><dl class="facts">${[['Ingredients',d.i],['Allergens',d.a]].filter(f=>f[1]).map(f=>`<div><dt>${f[0]}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>`};
 function paint(){const t=T[cur%T.length],x=it[cur];
  sl.classList.toggle('open',open);
  sl.style.setProperty('--bg',t.bg);sl.style.setProperty('--ink',t.ink);sl.style.setProperty('--text',t.d?'#fff7e8':'#2b1a10');
  const wd=$('wd');wd.textContent=x.name.split(' ')[0].toUpperCase();wd.style.animation='none';wd.offsetHeight;wd.style.animation='';
  const h=Math.floor(n/2);
  plates.forEach((p,i)=>{const o=((i-cur+n+h)%n)-h,c=o===0; // circular: the last dish shows on the left of the first one
   p.style.transform=c&&open?'translate(-50%,-50%) scale(.95) rotate(360deg)':`translate(calc(-50% + ${o*34}vw),-50%) scale(${c?1:.6}) rotate(${o*7}deg)`;
   p.style.opacity=open&&!c?0:Math.abs(o)>1?0:c?1:.85;p.style.pointerEvents=open&&!c?'none':'';p.style.zIndex=c?3:1});
  dots.forEach((d,i)=>d.classList.toggle('on',i===cur));
  $('dn').textContent=cur+1;
  $('nm').textContent=x.name;$('dtl').innerHTML=detail(x);
  $('pr').textContent=open?money(x.price):'';$('vw').textContent=open?'Close':'View'}
 const go=i=>{cur=((i%n)+n)%n;open=false;paint()};
 plates.forEach(p=>p.onclick=()=>{const i=+p.dataset.i;if(i===cur){open=!open;paint()}else go(i)});
 dots.forEach(d=>d.onclick=()=>go(+d.dataset.i));
 $('pv').onclick=()=>go(cur-1);$('nx').onclick=()=>go(cur+1);$('vw').onclick=()=>{open=!open;paint()};
 addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(cur+1);if(e.key==='ArrowLeft')go(cur-1)});
 $('back').onclick=e=>{if(window.opener){e.preventDefault();window.close()}};
 $('od').onclick=()=>{location.href='/order?add='+encodeURIComponent(it[cur].name)};
 paint();
})();
