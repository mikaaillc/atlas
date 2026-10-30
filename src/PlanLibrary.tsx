import {createContext,useContext,useState,useEffect,type ReactNode} from 'react';
import {collection,doc,getDocs,onSnapshot,writeBatch,query,where} from 'firebase/firestore';
import {db} from './firebase';
import {today} from './core.mjs';
import {parsePlan,schedulePlan} from './plan-format.mjs';
import type {Lesson,Plan} from './types';
type Library={plans:Plan[];lessons:Lesson[];english:Lesson[];aws:Lesson[];all:Lesson[];loading:boolean;error:string;guidePages:{page:number;text:string}[];importPlan:(input:unknown)=>Promise<string>;openPdf:(track:string,page?:number)=>Promise<void>};
const Context=createContext<Library|null>(null);
export function PlanProvider({uid,children}:{uid:string;children:ReactNode}){
 const [plans,setPlans]=useState<Plan[]>([]),[lessons,setLessons]=useState<Lesson[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{if(!db)return;let active=true,revision=0;let catalog:Plan[]|null=null,personal:Plan[]|null=null;
  const refresh=async()=>{if(catalog===null||personal===null)return;const rev=++revision;try{const metadata=[...catalog.filter(p=>p.ownerUid===uid),...personal].filter(p=>p.status==='ready');const groups=await Promise.all(metadata.map(async p=>{const path=p.source==='catalog'?collection(db!,'learningAtlasCatalog',p.id,'lessons'):collection(db!,'learningAtlas',uid,'plans',p.id,'lessons');const snap=await getDocs(path);const rows=snap.docs.map(d=>d.data() as Lesson).sort((a,b)=>a.day-b.day);if(rows.length!==p.dayCount)throw Error('Plan günleri henüz tam yüklenmedi.');return rows;}));if(active&&rev===revision){setPlans(metadata);setLessons(groups.flat());setError('');setLoading(false);}}catch{if(active&&rev===revision){setError('Planlar yüklenemedi. Bağlantını kontrol edip sayfayı yenile.');setLoading(false);}}};
  const failure=()=>{if(active){setError('Planlarına erişilemedi. Oturumunu ve bağlantını kontrol et.');setLoading(false);}};
  const a=onSnapshot(query(collection(db,'learningAtlasCatalog'),where('ownerUid','==',uid)),s=>{catalog=s.docs.map(d=>d.data() as Plan);void refresh();},failure);
  const b=onSnapshot(collection(db,'learningAtlas',uid,'plans'),s=>{personal=s.docs.map(d=>d.data() as Plan);void refresh();},failure);
  return()=>{active=false;revision++;a();b();};
 },[uid]);
 const importPlan=async(input:unknown)=>{if(!db)throw Error('Bulut bağlantısı yok.');const normalized=parsePlan(input);const id='custom_'+crypto.randomUUID().replaceAll('-','');const {metadata,lessons:rows}=schedulePlan(normalized,id,today()) as {metadata:Plan;lessons:Lesson[]};
  const root=doc(db,'learningAtlas',uid,'plans',id);const head=writeBatch(db);head.set(root,{...metadata,status:'importing'});await head.commit();
  for(let i=0;i<rows.length;i+=200){const batch=writeBatch(db);rows.slice(i,i+200).forEach(row=>batch.set(doc(db!,'learningAtlas',uid,'plans',id,'lessons',row.id),row));await batch.commit();}
  const tail=writeBatch(db);tail.set(root,metadata);await tail.commit();return id;
 };
 const openPdf=async(track:string,page=1)=>{if(!db)throw Error('Bulut bağlantısı yok.');const plan=plans.find(p=>p.id===track&&p.source==='catalog');if(!plan?.hasPdf)throw Error('Bu planda PDF bulunmuyor.');const popup=window.open('about:blank','_blank');if(popup)popup.document.body.textContent='Kaynak PDF yükleniyor…';try{const snap=await getDocs(collection(db,'learningAtlasCatalog',track,'sourceChunks'));const chunks=snap.docs.map(d=>d.data()).sort((a,b)=>a.index-b.index);if(chunks.length!==plan.sourceChunkCount)throw Error('Kaynak dosyası eksik.');const arrays=chunks.map(c=>Uint8Array.from(atob(c.data),x=>x.charCodeAt(0)));const bytes=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let pos=0;for(const a of arrays){bytes.set(a,pos);pos+=a.length;}if(bytes.length!==plan.sourceSize)throw Error('Kaynak boyutu uyuşmuyor.');const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');if(digest!==plan.sourceSha256)throw Error('Kaynak bütünlüğü doğrulanamadı.');const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));if(popup)popup.location.href=url+'#page='+page;else{const a=document.createElement('a');a.href=url;a.download=track+'-plan.pdf';a.click();}setTimeout(()=>URL.revokeObjectURL(url),300000);}catch(e){popup?.close();throw e;}};
 const english=lessons.filter(l=>l.track==='english'),aws=lessons.filter(l=>l.track==='aws');
 const value={plans,lessons,english,aws,all:lessons,loading,error,guidePages:plans.find(p=>p.id==='english')?.guidePages||[],importPlan,openPdf};
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePlanLibrary(){const value=useContext(Context);if(!value)throw Error('Plan kütüphanesi oturum gerektirir.');return value;}
