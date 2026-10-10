// Scroll reveal, 3D hover tilt, hero entrance and parallax (plain JS, no libraries)
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,hover=matchMedia('(hover:hover)').matches;
 if(reduce)return;
 const SKIP='.adm,.sl,.hero2,.mb,.modal,.noanim',
  REV='.eyebrow,.wrap>h2,.wrap>.lead,.wrap>h1,.narrow>h1,.narrow>.lead,.two>*,.hero>*,.grid3>*,.cta,.form.wide,#book,.fg>div,.copy',
  TILT='.card,.ph';
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;el.classList.add('in');io.unobserve(el);setTimeout(()=>el.style.setProperty('--d','0ms'),1700)}),{threshold:.14,rootMargin:'0px 0px -6% 0px'});
 function tilt(el){
  el.classList.add('tilt');
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--rx',(-y*10).toFixed(1)+'deg');el.style.setProperty('--ry',(x*12).toFixed(1)+'deg')});
  el.addEventListener('pointerleave',()=>{el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')});
 }
 function scan(root){
  if(root.nodeType!==1||root.closest(SKIP))return;
  const list=[...(root.matches(REV)?[root]:[]),...root.querySelectorAll(REV)];
  list.forEach(el=>{
   if(el.closest(SKIP)||el.classList.contains('rv')||el.parentElement.closest('.rv'))return;
   const sibs=[...el.parentElement.children].filter(c=>c.matches(REV)),i=sibs.indexOf(el);
   el.classList.add('rv');
   if(el.parentElement.matches('.two,.hero')){el.classList.add(i===0?'rv-l':'rv-r')}
   el.style.setProperty('--d',Math.min(i,6)*110+'ms');
   el.parentElement.style.perspective='1200px';
   io.observe(el);
  });
  if(hover)[...(root.matches(TILT)?[root]:[]),...root.querySelectorAll(TILT)].forEach(el=>{if(!el.classList.contains('tilt')&&!el.closest(SKIP))tilt(el)});
 }
 scan(document.body);
 new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.body,{childList:true,subtree:true});
 // hero: letters rise in one by one, then slow parallax while scrolling
 const sp=document.querySelector('.mega span');
 if(sp){let k=0;sp.innerHTML=sp.textContent.split(' ').map(w=>{const h=`<span class="w">${[...w].map(c=>`<i style="--i:${k++}">${c}</i>`).join('')}</span>`;k++;return h}).join(' ')}
 const h=document.querySelector('.hero2'),hd=document.querySelector('.hdr');let t=0;
 addEventListener('scroll',()=>{if(t)return;t=requestAnimationFrame(()=>{t=0;
  if(h)h.style.setProperty('--hp',Math.min(1,scrollY/h.offsetHeight).toFixed(3));
  if(hd)hd.classList.toggle('sc',scrollY>10)})},{passive:true});
})();
