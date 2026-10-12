const{Pool}=require('pg'),data=require('./menu-data');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:false}:undefined});
const SQL=`
create table if not exists tables(id serial primary key,name text,seats int not null);
create table if not exists reservations(id serial primary key,table_id int references tables(id),name text not null,phone text not null,guests int not null,starts_at timestamptz not null,ends_at timestamptz not null,status text not null default 'confirmed',created_at timestamptz default now());
create table if not exists orders(id serial primary key,name text not null,phone text not null,address text not null,item text,status text not null default 'new',created_at timestamptz default now());
create table if not exists menu_categories(id serial primary key,slug text unique not null,name text not null,tagline text,sort int);
create table if not exists menu_items(id serial primary key,category_id int references menu_categories(id) on delete cascade,name text not null,description text,price numeric(6,2) not null,sort int);
alter table menu_items add column if not exists details jsonb;
create table if not exists users(id serial primary key,name text not null,email text unique not null,password_hash text not null,created_at timestamptz default now());
alter table orders add column if not exists items jsonb;
alter table orders add column if not exists eta_minutes int;
alter table orders add column if not exists eta_at timestamptz;
alter table orders add column if not exists total numeric(8,2);
alter table orders add column if not exists cancelled_by text;
alter table orders add column if not exists user_id int references users(id);
alter table reservations add column if not exists user_id int references users(id);
alter table reservations add column if not exists cancelled_by text;`;
// runs on every start: creates missing tables, seeds 8 tables + menu only when empty
// older versions had a phone-based users table. Keep it as users_phone_old and start a fresh email-based one.
async function migrateUsers(){
 const t=await pool.query("select to_regclass('users') u,(select count(*) from information_schema.columns where table_schema=current_schema() and table_name='users' and column_name='email')::int e");
 if(!t.rows[0].u||t.rows[0].e)return false;
 for(const tb of ['orders','reservations']){if(!(await pool.query('select to_regclass($1) r',[tb])).rows[0].r)continue;
  for(const c of(await pool.query("select conname from pg_constraint where conrelid=$1::regclass and confrelid='users'::regclass and contype='f'",[tb])).rows)await pool.query(`alter table ${tb} drop constraint "${c.conname}"`);
  if((await pool.query("select 1 from information_schema.columns where table_schema=current_schema() and table_name=$1 and column_name='user_id'",[tb])).rowCount)await pool.query(`update ${tb} set user_id=null`)}
 await pool.query('drop table if exists users_phone_old');await pool.query('alter table users rename to users_phone_old');return true}
async function init(){
 const migrated=await migrateUsers();
 await pool.query(SQL);
 if(migrated)for(const tb of ['orders','reservations'])await pool.query(`alter table ${tb} add constraint ${tb}_user_id_fk foreign key(user_id) references users(id)`);
 if(!(await pool.query('select 1 from tables limit 1')).rowCount){let n=0;for(const s of [10,10,6,6,4,4,2,2])await pool.query('insert into tables(name,seats) values($1,$2)',['Table '+(++n),s])}
 if(!(await pool.query('select 1 from menu_categories limit 1')).rowCount){let i=0;for(const[slug,name,tag,items]of data){
  const{rows:[c]}=await pool.query('insert into menu_categories(slug,name,tagline,sort) values($1,$2,$3,$4) returning id',[slug,name,tag,i++]);
  let j=0;for(const[n,d,p]of items)await pool.query('insert into menu_items(category_id,name,description,price,sort) values($1,$2,$3,$4,$5)',[c.id,n,d,p,j++])}}
 for(const[,,,items]of data)for(const it of items)await pool.query('update menu_items set details=$1 where name=$2 and details is null',[JSON.stringify(it[3]),it[0]]);
}
async function getMenu(slug){
 const c=await pool.query('select * from menu_categories '+(slug?'where slug=$1 ':'')+'order by sort',slug?[slug]:[]);
 const i=await pool.query('select category_id,name,description,price::float price,details from menu_items order by sort');
 return c.rows.map(x=>({...x,items:i.rows.filter(y=>y.category_id===x.id)}));
}
module.exports={pool,init,getMenu};
