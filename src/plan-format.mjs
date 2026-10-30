import {addDays} from './core.mjs';
export const MAX_PLAN_BYTES=2_000_000;
const fail=message=>{throw new Error(message);};
const text=(value,label,max,required=true)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(`${label} geçerli bir metin olmalı (en fazla ${max} karakter).`);return value.trim();};
export function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===value;}
export function parsePlan(input){
 if(typeof input==='string'){if(new TextEncoder().encode(input).length>MAX_PLAN_BYTES)fail('Plan dosyası en fazla 2 MB olabilir.');try{input=JSON.parse(input);}catch{fail('JSON okunamadı. Dosyanın biçimini kontrol et.');}}
 let encoded;try{encoded=JSON.stringify(input);}catch{fail('Plan verisi okunamadı.');}if(encoded&&new TextEncoder().encode(encoded).length>MAX_PLAN_BYTES)fail('Plan dosyası en fazla 2 MB olabilir.');
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Bir Atlas plan dosyası seç.');
 if(input.schemaVersion!==1)fail('Bu plan sürümü desteklenmiyor. schemaVersion değeri 1 olmalı.');
 const title=text(input.title,'Plan adı',160),description=text(input.description??'','Açıklama',4000,false);
 if(!validDate(input.startDate))fail('Başlangıç tarihi YYYY-AA-GG biçiminde gerçek bir tarih olmalı.');
 const dailyMinutes=input.dailyMinutes;if(!Number.isInteger(dailyMinutes)||dailyMinutes<5||dailyMinutes>480)fail('Günlük süre 5–480 dakika olmalı.');
 const studyDays=input.studyDays;if(!Array.isArray(studyDays)||!studyDays.length||studyDays.length>7||new Set(studyDays).size!==studyDays.length||!studyDays.every(x=>Number.isInteger(x)&&x>=0&&x<=6))fail('Çalışma günlerini 0=Pazar, 1=Pazartesi … 6=Cumartesi olarak seç.');
 if(!Array.isArray(input.days)||input.days.length<1||input.days.length>730)fail('Bir planda 1–730 günlük ders olabilir.');
 const days=input.days.map((d,i)=>{if(!d||typeof d!=='object')fail(`${i+1}. gün okunamadı.`);const title=text(d.title,`${i+1}. gün başlığı`,200),focus=text(d.focus??'','Odak',300,false);if(!Array.isArray(d.tasks)||!d.tasks.length||d.tasks.length>10)fail(`${i+1}. günde 1–10 görev olmalı.`);const tasks=d.tasks.map(t=>text(t,`${i+1}. gün görevi`,5000));const resources=d.resources??[];if(!Array.isArray(resources)||resources.length>8)fail(`${i+1}. günde en fazla 8 kaynak olabilir.`);const links=resources.map(r=>{const label=text(r?.title,'Kaynak adı',160),url=text(r?.url,'Kaynak bağlantısı',2000);let u;try{u=new URL(url);}catch{fail('Kaynak bağlantısı geçerli bir HTTPS adresi olmalı.');}if(u.protocol!=='https:'||u.username||u.password)fail('Kaynaklar yalnızca kullanıcı bilgisi içermeyen HTTPS adresleri olabilir.');return {title:label,url};});const minutes=d.minutes??dailyMinutes;if(!Number.isInteger(minutes)||minutes<5||minutes>480)fail(`${i+1}. günün süresi 5–480 dakika olmalı.`);return {title,focus,minutes,tasks,resources:links};});
 return {schemaVersion:1,title,description,startDate:input.startDate,dailyMinutes,studyDays:[...studyDays].sort(),days};
}
export function schedulePlan(plan,id,created){
 if(!/^custom_[a-f0-9]{32}$/.test(id))fail('Plan kimliği geçersiz.');
 let cursor=plan.startDate;
 const lessons=plan.days.map((day,i)=>{while(!plan.studyDays.includes(new Date(cursor+'T12:00Z').getUTCDay()))cursor=addDays(cursor,1);const date=cursor;cursor=addDays(cursor,1);return {id:`${id}_${i+1}`,track:id,planId:id,day:i+1,date,level:'Kişisel plan',week:Math.floor(i/7)+1,minutes:day.minutes,title:day.title,focus:day.focus,kind:'Günlük çalışma',tasks:day.tasks,links:day.resources.map(r=>({label:r.title,url:r.url})),page:0};});
 const metadata={id,title:plan.title,description:plan.description,startDate:lessons[0].date,endDate:lessons.at(-1).date,dailyMinutes:plan.dailyMinutes,studyDays:plan.studyDays,dayCount:lessons.length,schemaVersion:1,source:'custom',status:'ready',hasPdf:false,color:'violet',createdAt:created,updatedAt:created};
 return {metadata,lessons};
}
export function exportPlan(metadata,lessons){return {schemaVersion:1,title:metadata.title,description:metadata.description,startDate:metadata.startDate,dailyMinutes:metadata.dailyMinutes,studyDays:metadata.studyDays,days:lessons.map(l=>({title:l.title,focus:l.focus,minutes:l.minutes,tasks:l.tasks,resources:l.links.map(r=>({title:r.label,url:r.url}))}))};}
export const blankTemplate={schemaVersion:1,title:'',description:'',startDate:'2026-11-02',dailyMinutes:45,studyDays:[1,2,3,4,5],days:[{title:'',focus:'',minutes:45,tasks:[''],resources:[]}]};
