(async()=>{
 const cats=await(await fetch('/api/menu')).json(),N=3;let step=0;
 const face=(c,n,s)=>`<div class="face ${s}"><img class="corner ${s==='front'?'cr':'cl'}" src="/images/book/corner-${n}.png" alt="" onerror="this.style.display='none'"><div class="pt">THE MENU</div><h2 class="ch" title="Open this menu" data-slug="${c.slug}">${esc(c.name)} ›</h2><p class="tg">${esc(c.tagline)}</p><ul class="box">${c.items.map(i=>`<li><span>${esc(i.name)}</span><b>${money(i.price)}</b></li>`).join('')}</ul><span class="pg">${n}</span></div>`;
 const L=[[null,cats[0]],[cats[1],cats[2]],[cats[3],cats[4]]],H=['Use the arrow to open','Starters and Burgers','Steaks and Drinks','Desserts'];
 const cover=`<div class="face front cover"><span class="scr">Red Booth</span><h1>MENU</h1><p class="tag">TASTE THAT BRINGS YOU BACK</p><div class="cp"><img src="/images/book/cover.jpg" alt="" onerror="this.style.display='none'"></div><b class="open">OPEN DAILY 11 AM – 11 PM</b></div>`;
 $('book').innerHTML=`<div class="mb"><div class="scene"><div class="book" id="bk"><div class="base"><div class="face thanks"><h2>See you at the table</h2><a class="btn alt" href="/order">Order now</a></div></div>
 ${L.map((p,i)=>`<div class="leaf">${p[0]?face(p[0],i*2,'front'):cover}${face(p[1],i*2+1,'back')}</div>`).join('')}</div></div>
 <div class="ctrl"><button id="pv" aria-label="Previous page">←</button><span id="ht"></span><button id="nx" aria-label="Next page">→</button></div><p class="tip">Use the arrows to turn the pages. Tap a section title to open its full menu</p></div>`;
 const bk=$('bk'),leaves=[...bk.querySelectorAll('.leaf')];
 function render(){leaves.forEach((l,i)=>{const f=i<step;l.classList.toggle('flip',f);l.style.zIndex=f?i+1:N-i+1;const fr=l.querySelector('.face.front'),bc=l.querySelector('.face.back');if(fr)fr.style.pointerEvents=f?'none':'auto';if(bc)bc.style.pointerEvents=f?'auto':'none';l.style.transition=`transform 1.1s cubic-bezier(.5,0,.2,1),z-index 0s linear ${f?'.55s':'0s'}`});
  bk.className='book s'+step;$('ht').textContent=H[step];$('pv').disabled=step===0;$('nx').disabled=step===N}
 const go=s=>{step=Math.max(0,Math.min(N,s));render()};
 leaves.forEach((l,i)=>l.onclick=e=>{const h=e.target.closest('h2.ch');if(h){const vis=l.querySelector(i<step?'.face.back':'.face.front'),vh=vis&&vis.querySelector('h2.ch');if(vh)window.open('/menu/'+vh.dataset.slug,'_blank')}});
 $('pv').onclick=()=>go(step-1);$('nx').onclick=()=>go(step+1);render();
})();
