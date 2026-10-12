// Restaurant hours are in RESTAURANT_TZ; slots are real UTC instants so each visitor's browser shows them in its own time zone.
const TZ=process.env.RESTAURANT_TZ||'America/Chicago',DUR=2,OPEN=11,LAST=21,STEP=+process.env.SLOT_STEP_HOURS||DUR,GUESTS=[2,4,6,8,10];
// Fixed 2 hour blocks: 11-1, 1-3, 3-5, 5-7, 7-9, 9-11 (restaurant closes at 11 PM). Set SLOT_STEP_HOURS=1 for a start every hour.
// There are 2 tables of each size (2, 4, 6, 10 seats). A time stays visible after the first booking and disappears
// for that group size only when BOTH tables of that size are booked. (ONE_BOOKING_PER_SIZE=true limits it to one.)
const MIN=(+process.env.MIN_ADVANCE_HOURS||24)*36e5,MAX=30*864e5;
function off(t){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}).formatToParts(new Date(t)).map(x=>[x.type,x.value]));return Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-Math.floor(t/1000)*1000}
const zoned=(y,m,d,h)=>{const g=Date.UTC(y,m,d,h);return g-off(g-off(g))};
function slots(from,to){const now=Date.now(),set=new Set();
 for(let t=from-864e5;t<=to+864e5;t+=864e5){const d=new Date(t);
  for(let h=OPEN;h<=LAST;h+=STEP){const s=zoned(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),h);
   if(s>=from&&s<to&&s>=now+MIN&&s<=now+MAX)set.add(s)}}
 return[...set].sort((a,b)=>a-b)}
// table groups by size: 2 guests -> a 2 seat table, 4 -> 4 seats, 6 -> 6 seats, 8 and 10 -> the 10 seat tables
async function seatsFor(db,g){return(await db.query('select min(seats) s from tables where seats>=$1',[g])).rows[0].s}
async function free(db,s,g){const a=new Date(s),b=new Date(s+DUR*36e5);
 if(process.env.ONE_BOOKING_PER_SIZE==='true'&&(await db.query("select 1 from reservations where guests=$1 and status<>'cancelled' and starts_at<$3 and ends_at>$2 limit 1",[g,a,b])).rowCount)return null;
 const r=await db.query(`select t.id from tables t where t.seats=(select min(seats) from tables where seats>=$1) and not exists(select 1 from reservations r where r.table_id=t.id and r.status<>'cancelled' and r.starts_at<$3 and r.ends_at>$2) order by t.id limit 1`,[g,a,b]);return r.rows[0]?.id||null}
// all start times of one calendar day (YYYY-MM-DD) in restaurant time
function daySlots(ds){const[y,m,d]=String(ds).split('-').map(Number);if(!(y>2000&&m>=1&&m<=12&&d>=1&&d<=31))return[];return slots(zoned(y,m-1,d,0),zoned(y,m-1,d+1,0))}
module.exports={slots,daySlots,free,seatsFor,DUR,TZ,GUESTS};
