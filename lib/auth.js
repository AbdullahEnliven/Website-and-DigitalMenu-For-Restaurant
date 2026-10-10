const crypto=require('crypto');
// Admin: password only. The token lives in the browser page memory, so a reload asks for the password again.
const tokens=new Map();
function adminLogin(pw){const P=process.env.ADMIN_PASSWORD,a=Buffer.from(String(pw||'')),b=Buffer.from(P||'');
 if(!P||a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
 const t=crypto.randomBytes(24).toString('hex');tokens.set(t,Date.now()+12*36e5);return t}
const isAdmin=req=>(tokens.get(req.headers['x-admin-token'])||0)>Date.now();
// brute-force guard: 8 wrong tries blocks that IP for 10 minutes
const fails=new Map(),blocked=k=>{const f=fails.get(k);return !!f&&f.n>=8&&Date.now()-f.t<6e5},fail=k=>{const f=fails.get(k)||{n:0};f.n++;f.t=Date.now();fails.set(k,f)},ok=k=>fails.delete(k);
// ---------- customer accounts (email + password, signed cookie session)
const{promisify}=require('util'),scrypt=promisify(crypto.scrypt),dns=require('dns').promises;
const SECRET=process.env.AUTH_SECRET||crypto.randomBytes(32).toString('hex');
if(!process.env.AUTH_SECRET)console.warn('AUTH_SECRET is not set: customers will be logged out whenever the server restarts.');
const COOKIE='rb_sess',DAYS=30;
async function hashPw(pw){const salt=crypto.randomBytes(16);return salt.toString('hex')+':'+(await scrypt(String(pw),salt,64)).toString('hex')}
async function checkPw(pw,stored){const[s,h]=String(stored||'').split(':');if(!s||!h)return false;const a=await scrypt(String(pw),Buffer.from(s,'hex'),64),b=Buffer.from(h,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)}
const sig=v=>crypto.createHmac('sha256',SECRET).update(v).digest('hex');
function setSession(req,res,uid){const exp=Date.now()+DAYS*864e5,v=uid+'.'+exp;
 res.append('Set-Cookie',`${COOKIE}=${v}.${sig(v)}; Path=/; Max-Age=${DAYS*86400}; HttpOnly; SameSite=Lax${req.secure?'; Secure':''}`)}
const clearSession=res=>res.append('Set-Cookie',`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
function sessionUserId(req){const m=(req.headers.cookie||'').split(/;\s*/).find(c=>c.startsWith(COOKIE+'='));if(!m)return 0;
 const[uid,exp,mac]=m.slice(COOKIE.length+1).split('.');if(!uid||!exp||!mac)return 0;
 const good=sig(uid+'.'+exp);if(mac.length!==good.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(good))||+exp<Date.now())return 0;return +uid||0}
// a proper email: valid shape AND the domain must exist (dns lookup). If dns itself is unreachable we do not block the signup.
const EMAIL=/^[a-z0-9._%+-]{1,64}@([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const NODOM=['ENOTFOUND','ENODATA'],has=async d=>{try{if((await dns.resolveMx(d)).length)return true}catch(x){if(!NODOM.includes(x.code))throw x}
 try{await dns.lookup(d);return true}catch(x){if(!NODOM.includes(x.code))throw x}return false};
async function validEmail(e){if(e.length>254||!EMAIL.test(e))return false;
 try{if(await has(e.split('@')[1]))return true;return !(await has('google.com'))}catch(x){return true}}
module.exports={adminLogin,isAdmin,blocked,fail,ok,hashPw,checkPw,setSession,clearSession,sessionUserId,validEmail};
