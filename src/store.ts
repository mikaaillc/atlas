import {useEffect,useState,useCallback} from 'react';
import {onAuthStateChanged,type User} from 'firebase/auth';
import {collection,onSnapshot,doc,setDoc,deleteDoc} from 'firebase/firestore';
import {auth,db,cloudAccessReady} from './firebase';
import type {Progress,Word} from './types';
export function useLearning(){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(!auth),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [scope,setScope]=useState(''),[progress,setProgress]=useState<Record<string,Progress>>({}),[words,setWords]=useState<Record<string,Word>>({});
 useEffect(()=>auth?onAuthStateChanged(auth,u=>{setProgress({});setWords({});setScope('');setLoading(!!u);setUser(u);setReady(true);}):undefined,[]);
 useEffect(()=>{setError('');if(!user||!db){setProgress({});setWords({});setScope('');setLoading(false);return;}
  if(!cloudAccessReady){setLoading(false);setError('Bulut erişimi henüz etkin değil.');return;}
  let active=true,progressLoaded=false,wordsLoaded=false;setLoading(true);setScope(user.uid);
  const failure=()=>{if(active){setError('Bulut verileri okunamadı. Bağlantını kontrol et.');setLoading(false);}};
  const a=onSnapshot(collection(db,'learningAtlas',user.uid,'progress'),s=>{if(!active)return;setProgress(Object.fromEntries(s.docs.map(d=>[d.id,d.data() as Progress])));progressLoaded=true;if(wordsLoaded)setLoading(false);},failure);
  const b=onSnapshot(collection(db,'learningAtlas',user.uid,'words'),s=>{if(!active)return;setWords(Object.fromEntries(s.docs.map(d=>[d.id,d.data() as Word])));wordsLoaded=true;if(progressLoaded)setLoading(false);},failure);
  return()=>{active=false;a();b();};
 },[user]);
 const save=useCallback(async(kind:'progress'|'words',id:string,value:Progress|Word|null)=>{
  if(!user||!db)throw Error('Kayıt için giriş yapmalısın.');
  if(!ready||loading||scope!==user.uid)throw Error('Veriler yüklenirken lütfen bekle.');
  if(error||!cloudAccessReady)throw Error('Bulut bağlantısı doğrulanamadı.');
  const ref=doc(db,'learningAtlas',user.uid,kind,id);if(value)await setDoc(ref,value);else await deleteDoc(ref);
 },[user,ready,loading,scope,error]);
 const visible=!!user&&scope===user.uid;
 return {user,ready,loading,error,progress:visible?progress:{},words:visible?words:{},save};
}
