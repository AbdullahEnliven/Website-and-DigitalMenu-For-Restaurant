const express=require('express'),path=require('path');
const{pool,init,getMenu}=require('./lib/db'),{slots,daySlots,free,seatsFor,DUR,TZ,GUESTS}=require('./lib/slots'),A=require('./lib/auth');
const app=express(),P=path.join(__dirname,'public'),w=f=>(q,s,n)=>f(q,s,n).catch(n);
const PHONE=/^\d{8,15}$/,bad=(s,m,c=400)=>s.status(c).json({error:m});
app.set('trust proxy',1);app.use(express.json());app.use(express.static(P,{extensions:['html']}));
app.get('/menu/:slug',(q,s)=>s.sendFile(path.join(P,'menu.html')));
app.get('/api/menu',w(async(q,s)=>s.json(await getMenu())));
app.get('/api/menu/:slug',w(async(q,s)=>{const[c]=await getMenu(q.params.slug);c?s.json(c):s.status(404).json({})}));
// ---------- customer accounts
const user=async q=>{const id=A.sessionUserId(q);if(!id)return null;return(await pool.query('select id,name,email from users where id=$1',[id])).rows[0]||null};
const pub=u=>({id:u.id,name:u.name,email:u.email}),need=s=>s.status(401).json({error:'Please log in first.'});
app.get('/api/me',w(async(q,s)=>{const u=await user(q);u?s.json(pub(u)):s.status(401).json({})}));
app.post('/api/signup',w(async(q,s)=>{
 const b=q.body||{},name=String(b.name||'').trim().replace(/\s+/g,' '),email=String(b.email||'').trim().toLowerCase(),pw=String(b.password||'');
 if(name.length<2||name.length>80)return bad(s,'Please enter your full name.');
 if(!(await A.validEmail(email)))return bad(s,'Please enter a valid email address.');
 if(pw.length<6||pw.length>100)return bad(s,'Password must be 6 to 100 characters.');
 if((await pool.query('select 1 from users where email=$1',[email])).rowCount)return bad(s,'An account with this email already exists. Please log in.',409);
 try{const{rows:[u]}=await pool.query('insert into users(name,email,password_hash) values($1,$2,$3) returning id,name,email',[name,email,await A.hashPw(pw)]);
  A.setSession(q,s,u.id);s.json(pub(u))}catch(e){if(e.code==='23505')return bad(s,'An account with this email already exists. Please log in.',409);throw e}}));
app.post('/api/login',w(async(q,s)=>{
 const b=q.body||{},email=String(b.email||'').trim().toLowerCase(),k='u'+q.ip+email;
 if(A.blocked(k))return bad(s,'Too many tries. Please wait a few minutes.',429);
 const{rows:[u]}=await pool.query('select * from users where email=$1',[email]);
 if(!u||!(await A.checkPw(b.password,u.password_hash))){A.fail(k);return bad(s,'Wrong email or password.',401)}
 A.ok(k);A.setSession(q,s,u.id);s.json(pub(u))}));
app.post('/api/logout',(q,s)=>{A.clearSession(s);s.json({ok:true})});
app.get('/api/my',w(async(q,s)=>{const u=await user(q);if(!u)return need(s);
 const o=await pool.query('select id,item,items,total::float total,address,status,cancelled_by,created_at from orders where user_id=$1 order by created_at desc limit 100',[u.id]);
 const r=await pool.query('select r.id,r.guests,r.starts_at,r.status,r.cancelled_by,t.seats from reservations r join tables t on t.id=r.table_id where r.user_id=$1 order by r.starts_at desc limit 100',[u.id]);
 s.json({orders:o.rows,reservations:r.rows,tz:TZ})}));
app.post('/api/my/cancel',w(async(q,s)=>{const u=await user(q);if(!u)return need(s);
 const{type,id}=q.body||{};if(!['orders','reservations'].includes(type)||!(+id>0))return bad(s,'Invalid request.');
 const sql=type==='orders'?"update orders set status='cancelled',cancelled_by='user' where id=$1 and user_id=$2 and status in ('new','confirmed')"
  :"update reservations set status='cancelled',cancelled_by='user' where id=$1 and user_id=$2 and status='confirmed' and starts_at>now()";
 (await pool.query(sql,[+id,u.id])).rowCount?s.json({ok:true}):bad(s,'This can no longer be cancelled. Please call us.',409)}));
app.post('/api/orders',w(async(q,s)=>{
 const u=await user(q);if(!u)return need(s);
 const b=q.body||{},name=String(b.name||'').trim(),address=String(b.address||'').trim(),phone=String(b.phone||'');
 if(name.length<2||address.length<5)return bad(s,'Please enter your name and full address.');
 if(!PHONE.test(phone))return bad(s,'Phone number must be 8 to 15 digits.');
 // the cart: prices always come from the database, never from the browser
 const want=new Map();for(const x of Array.isArray(b.items)?b.items.slice(0,40):[]){const n=String(x&&x.name||''),k=Math.floor(+(x&&x.qty));if(n&&k>=1&&k<=20)want.set(n,Math.min(20,(want.get(n)||0)+k))}
 if(!want.size&&b.item)want.set(String(b.item),1);
 if(!want.size)return bad(s,'Please select at least one dish.');
 const menu=new Map();for(const c of await getMenu())for(const m of c.items)menu.set(m.name,m.price);
 const items=[];let total=0;for(const[n,k]of want){if(!menu.has(n))return bad(s,'"'+n.slice(0,60)+'" is not on the menu.');items.push({name:n,qty:k,price:menu.get(n)});total+=menu.get(n)*k}
 const summary=items.map(x=>x.qty+' x '+x.name).join(', ').slice(0,300);
 await pool.query('insert into orders(name,phone,address,item,items,total,user_id) values($1,$2,$3,$4,$5,$6,$7)',[name.slice(0,80),phone,address.slice(0,300),summary,JSON.stringify(items),total.toFixed(2),u.id]);s.json({ok:true})}));
app.get('/api/availability',w(async(q,s)=>{
 const g=+q.query.guests;if(!GUESTS.includes(g))return s.status(400).json({slots:[],tz:TZ});
 const seats=await seatsFor(pool,g);let list;
 if(q.query.date)list=daySlots(q.query.date);
 else{const from=Date.parse(q.query.from),to=Date.parse(q.query.to);if(!(from<to)||to-from>2*864e5)return s.status(400).json({slots:[],tz:TZ});list=slots(from,to)}
 const out=[];for(const t of list)if(await free(pool,t,g))out.push(new Date(t).toISOString());s.json({slots:out,tz:TZ,seats,dur:DUR})}));
app.post('/api/reservations',w(async(q,s)=>{
 const u=await user(q);if(!u)return need(s);
 const b=q.body||{},t=Date.parse(b.start),g=+b.guests,name=String(b.name||'').trim(),phone=String(b.phone||'');
 if(name.length<2)return bad(s,'Please enter your name.');
 if(!PHONE.test(phone))return bad(s,'Phone number must be 8 to 15 digits.');
 if(!GUESTS.includes(g)||!slots(t,t+1).includes(t))return bad(s,'That time is not available.');
 const c=await pool.connect();
 try{await c.query('begin');await c.query('select pg_advisory_xact_lock(66)');
  const id=await free(c,t,g);
  if(!id){await c.query('rollback');return bad(s,'Sorry, that time was just taken. Please pick another.',409)}
  await c.query('insert into reservations(table_id,name,phone,guests,starts_at,ends_at,user_id) values($1,$2,$3,$4,$5,$6,$7)',[id,name.slice(0,80),phone,g,new Date(t),new Date(t+DUR*36e5),u.id]);
  await c.query('commit');s.json({ok:true})}catch(e){await c.query('rollback');throw e}finally{c.release()}}));
// ---------- admin (password only, asked again on every page load)
app.post('/api/admin/login',(q,s)=>{
 const k='a'+q.ip;if(A.blocked(k))return bad(s,'Too many tries. Please wait a few minutes.',429);
 const t=A.adminLogin((q.body||{}).password);if(!t){A.fail(k);return bad(s,'Wrong password.',401)}A.ok(k);s.json({token:t})});
const OK={orders:['new','confirmed','out for delivery','delivered','cancelled'],reservations:['confirmed','cancelled']};
app.get('/api/admin/data',w(async(q,s)=>{if(!A.isAdmin(q))return s.status(401).json({});
 const o=await pool.query('select * from orders order by created_at desc limit 300');
 const r=await pool.query('select r.*,t.seats,t.name table_name from reservations r join tables t on t.id=r.table_id order by r.starts_at desc limit 400');
 s.json({orders:o.rows,reservations:r.rows,tz:TZ})}));
app.patch('/api/admin/data',w(async(q,s)=>{if(!A.isAdmin(q))return s.status(401).json({});
 const{type,id,status}=q.body||{};if(!OK[type]?.includes(status))return s.status(400).json({});
 if(type==='reservations'&&status==='confirmed'){const{rows:[r]}=await pool.query('select table_id,starts_at,ends_at from reservations where id=$1',[+id]);
  if(r&&(await pool.query("select 1 from reservations where table_id=$1 and id<>$2 and status<>'cancelled' and starts_at<$4 and ends_at>$3 limit 1",[r.table_id,+id,r.starts_at,r.ends_at])).rowCount)return s.status(409).json({error:'That table is already booked at this time, so this reservation cannot be re-confirmed.'})}
 await pool.query(`update ${type} set status=$1,cancelled_by=$2 where id=$3`,[status,status==='cancelled'?'admin':null,+id]);s.json({ok:true})}));
app.use((e,q,s,n)=>{console.error(e);s.status(500).json({error:'Server error'})});
(async()=>{
 for(let i=1;;i++){try{await init();break}catch(e){console.error('DB not ready ('+e.message+'), try '+i);if(i>=10)process.exit(1);await new Promise(r=>setTimeout(r,3000))}}
 app.listen(process.env.PORT||3000,()=>console.log('Red Booth Diner running on port '+(process.env.PORT||3000)));
})();
