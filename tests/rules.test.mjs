import {before,after,test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,deleteDoc,collection,getDocs,query,where} from 'firebase/firestore';
let env;before(async()=>{env=await initializeTestEnvironment({projectId:'demo-learning-atlas',firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8080}});});after(async()=>{await env?.cleanup();});
const progress={id:'english-1',checks:[true,false,false,false,false,false],notes:'My day',correction:'',evidence:'',score:1,total:2,completedAt:'',updatedAt:'2026-10-30'};
const word={id:'w1',word:'reliable',meaning:'güvenilir',definition:'can be trusted',example:'a reliable service',sentence:'Our API is reliable.',type:'adjective',source:'Reader at Work',lessonDay:1,created:'2026-10-30',stage:0,nextReview:'2026-10-31',lastReview:''};
test('owner can save and read own lessons and vocabulary',async()=>{const db=env.authenticatedContext('alice').firestore();await assertSucceeds(setDoc(doc(db,'learningAtlas/alice/progress/english-1'),progress));await assertSucceeds(getDoc(doc(db,'learningAtlas/alice/progress/english-1')));await assertSucceeds(setDoc(doc(db,'learningAtlas/alice/words/w1'),word));await assertSucceeds(getDocs(collection(db,'learningAtlas/alice/words')));});
test('other account and anonymous clients cannot access private data',async()=>{for(const db of [env.authenticatedContext('bob').firestore(),env.unauthenticatedContext().firestore()]){const ref=doc(db,'learningAtlas/alice/progress/english-1');await assertFails(getDoc(ref));await assertFails(setDoc(ref,progress));await assertFails(deleteDoc(ref));await assertFails(getDocs(collection(db,'learningAtlas/alice/words')));}});
test('invalid payloads are denied',async()=>{const db=env.authenticatedContext('alice').firestore();const ref=doc(db,'learningAtlas/alice/progress/english-1');for(const change of [{score:3},{notes:'x'.repeat(20001)},{checks:[null]},{admin:true},{id:'english-2'}])await assertFails(setDoc(ref,{...progress,...change}));for(const change of [{stage:5},{lessonDay:547},{word:''},{admin:true}])await assertFails(setDoc(doc(db,'learningAtlas/alice/words/w1'),{...word,...change}));});
test('Rutinote native collection access is identical to the original deployed rules',async()=>{
 const baseline=await initializeTestEnvironment({projectId:'demo-rutinote-baseline',firestore:{rules:fs.readFileSync('firestore.rutinote.baseline.rules','utf8'),host:'127.0.0.1',port:8080}});
 try {
  const paths=['users/alice','users/bob','tasks/native-task','notes/native-note','projects/native-project','meetings/native-meeting','users/alice/devices/phone','users/alice/devices/phone/history/reading','other/data','learningAtlasArchive/legacy'];
  for(const uid of ['alice','bob',null])for(const path of paths){
   for(const target of [baseline,env]){
    const db=uid?target.authenticatedContext(uid).firestore():target.unauthenticatedContext().firestore();
    const ref=doc(db,path),check=uid?assertSucceeds:assertFails;
    await check(setDoc(ref,{title:'Existing native record',legacyField:true}));
    await check(getDoc(ref));await check(deleteDoc(ref));
   }
  }
 } finally {await baseline.cleanup();}
});
const planId='custom_'+'a'.repeat(32);
const metadata={id:planId,title:'New learning goal',description:'My plan',startDate:'2026-11-02',endDate:'2026-11-02',dailyMinutes:45,studyDays:[1,2,3,4,5],dayCount:1,schemaVersion:1,source:'custom',status:'ready',hasPdf:false,color:'violet',createdAt:'2026-10-30',updatedAt:'2026-10-30'};
const lesson={id:planId+'_1',track:planId,planId,day:1,date:'2026-11-02',level:'Kişisel plan',week:1,minutes:45,title:'New lesson',focus:'Practice',kind:'Günlük çalışma',tasks:['Read and build an example.'],links:[{label:'Docs',url:'https://example.org/docs'}],page:0};
test('private plan metadata and lessons are writable only by their owner',async()=>{const db=env.authenticatedContext('alice').firestore();await assertSucceeds(setDoc(doc(db,`learningAtlas/alice/plans/${planId}`),metadata));await assertSucceeds(setDoc(doc(db,`learningAtlas/alice/plans/${planId}/lessons/${lesson.id}`),lesson));await assertSucceeds(getDocs(collection(db,`learningAtlas/alice/plans/${planId}/lessons`)));for(const other of [env.authenticatedContext('bob').firestore(),env.unauthenticatedContext().firestore()]){await assertFails(getDoc(doc(other,`learningAtlas/alice/plans/${planId}`)));await assertFails(getDocs(collection(other,`learningAtlas/alice/plans/${planId}/lessons`)));await assertFails(setDoc(doc(other,`learningAtlas/alice/plans/${planId}`),metadata));}});
test('new plan lesson payloads and progress IDs are validated',async()=>{const db=env.authenticatedContext('alice').firestore();const ref=doc(db,`learningAtlas/alice/plans/${planId}/lessons/${lesson.id}`);for(const value of [{...lesson,tasks:['x'.repeat(5001)]},{...lesson,links:[{label:'Bad',url:'javascript:alert(1)'}]},{...lesson,planId:'other'},{...lesson,minutes:1000}])await assertFails(setDoc(ref,value));await assertSucceeds(setDoc(doc(db,`learningAtlas/alice/progress/${lesson.id}`),{...progress,id:lesson.id}));await assertFails(setDoc(doc(db,`learningAtlas/alice/plans/${planId}`),{...metadata,dayCount:9999}));});
const assignedUid='atlas-test-catalog-owner';
test('assigned catalog metadata, lessons and PDF chunks are private to the assigned UID',async()=>{
 await env.withSecurityRulesDisabled(async c=>{for(const id of ['english','aws']){await setDoc(doc(c.firestore(),`learningAtlasCatalog/${id}`),{title:'Assigned plan',ownerUid:assignedUid});await setDoc(doc(c.firestore(),`learningAtlasCatalog/${id}/sourceChunks/000`),{index:0,data:'test'});await setDoc(doc(c.firestore(),`learningAtlasCatalog/${id}/lessons/${id}-1`),{title:'Private lesson'});}});
 const assigned=env.authenticatedContext(assignedUid).firestore();
 for(const id of ['english','aws'])for(const path of [`learningAtlasCatalog/${id}`,`learningAtlasCatalog/${id}/sourceChunks/000`,`learningAtlasCatalog/${id}/lessons/${id}-1`]){
  await assertSucceeds(getDoc(doc(assigned,path)));
  for(const db of [env.authenticatedContext('alice').firestore(),env.authenticatedContext('bob').firestore(),env.unauthenticatedContext().firestore()])await assertFails(getDoc(doc(db,path)));
  await assertFails(setDoc(doc(assigned,path),{ownerUid:'bob',title:'tampered'}));
 }
 await assertSucceeds(getDocs(collection(assigned,'learningAtlasCatalog/english/lessons')));
 await assertFails(getDocs(collection(env.authenticatedContext('bob').firestore(),'learningAtlasCatalog/english/sourceChunks')));
});
test('catalog queries return only assignments, while unfiltered catalog access is denied',async()=>{
 const ownerDb=env.authenticatedContext(assignedUid).firestore(),other=env.authenticatedContext('bob').firestore();
 const assigned=await assertSucceeds(getDocs(query(collection(ownerDb,'learningAtlasCatalog'),where('ownerUid','==',assignedUid))));assert.equal(assigned.size,2);
 const empty=await assertSucceeds(getDocs(query(collection(other,'learningAtlasCatalog'),where('ownerUid','==','bob'))));assert.equal(empty.size,0);
 await assertFails(getDocs(collection(ownerDb,'learningAtlasCatalog')));
 await assertFails(getDocs(query(collection(other,'learningAtlasCatalog'),where('ownerUid','==',assignedUid))));
 await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(),'learningAtlasCatalog')));
});

test('legacy recursive permissions do not bypass Atlas namespace ownership',async()=>{
 const db=env.authenticatedContext('bob').firestore();
 for(const path of ['learningAtlas/alice','learningAtlas/alice/progress/english-1','learningAtlas/alice/words/w1','learningAtlasCatalog/english','learningAtlasCatalog/english/lessons/english-1']){
  await assertFails(getDoc(doc(db,path)));await assertFails(setDoc(doc(db,path),{admin:true}));
 }
 await assertFails(setDoc(doc(env.authenticatedContext('alice').firestore(),'learningAtlas/alice'),{admin:true}));
});

const importedProjectId='atlas_plan_5_alice_english', importedTaskId='atlas_day_5_alice_english-1';
const importedProject={userId:'alice',title:'Atlas plan',autoDailyTasks:false,totalTasks:1,completedDays:0,atlasImport:{version:1,planId:'english'}};
const importedTask={userId:'alice',projectId:importedProjectId,title:'Imported day',status:'todo',atlasImport:{version:1,planId:'english',lessonId:'english-1'}};
test('imported tasks and projects are writable/readable only by the correct account',async()=>{
 const alice=env.authenticatedContext('alice').firestore();
 await assertSucceeds(getDoc(doc(alice,'projects',importedProjectId)));
 await assertSucceeds(getDoc(doc(alice,'tasks',importedTaskId)));
 await assertSucceeds(setDoc(doc(alice,'projects',importedProjectId),importedProject));
 await assertSucceeds(setDoc(doc(alice,'tasks',importedTaskId),importedTask));
 for(const other of [env.authenticatedContext('bob').firestore(),env.unauthenticatedContext().firestore()]){
  for(const [path,value]of [[`projects/${importedProjectId}`,importedProject],[`tasks/${importedTaskId}`,importedTask]]){
   await assertFails(getDoc(doc(other,path)));await assertFails(setDoc(doc(other,path),value));await assertFails(deleteDoc(doc(other,path)));
  }
 }
 await assertSucceeds(getDocs(query(collection(alice,'tasks'),where('userId','==','alice'))));
 await assertSucceeds(getDocs(query(collection(alice,'projects'),where('userId','==','alice'))));
 await assertSucceeds(getDocs(query(collection(alice,'tasks'),where('projectId','==',importedProjectId))));
 await assertFails(getDocs(query(collection(env.authenticatedContext('bob').firestore(),'tasks'),where('projectId','==',importedProjectId))));
});
test('legacy iOS can edit imported task status/workspace and delete its project before task query',async()=>{
 const db=env.authenticatedContext('alice').firestore();
 await assertSucceeds(setDoc(doc(db,'tasks',importedTaskId),{...importedTask,status:'done',workspace:{notes:'My native note'}}));
 await assertSucceeds(deleteDoc(doc(db,'projects',importedProjectId)));
 await assertSucceeds(getDocs(query(collection(db,'tasks'),where('projectId','==',importedProjectId))));
 await assertSucceeds(getDocs(query(collection(db,'tasks'),where('projectId','==','legacy-project-id'))));
});
test('import provenance cannot be stripped, reassigned, forged into legacy ids, or matched by a shorter UID',async()=>{
 const db=env.authenticatedContext('alice').firestore();
 await assertFails(setDoc(doc(db,'tasks',importedTaskId),{...importedTask,atlasImport:null}));
 await assertFails(setDoc(doc(db,'tasks',importedTaskId),{...importedTask,userId:'bob'}));
 await assertFails(setDoc(doc(db,'tasks',importedTaskId),{...importedTask,projectId:'legacy-project-id'}));
 await assertFails(setDoc(doc(db,'tasks/legacy-id'),importedTask));
 await assertFails(getDoc(doc(env.authenticatedContext('ali').firestore(),'tasks',importedTaskId)));
 const prefixProject='atlas_plan_7_ali_foo_english';
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'tasks/atlas_day_7_ali_foo_english-1'),{userId:'ali_foo',projectId:prefixProject,atlasImport:{version:1,planId:'english',lessonId:'english-1'}});});
 await assertFails(getDocs(query(collection(env.authenticatedContext('ali').firestore(),'tasks'),where('projectId','==',prefixProject))));
});
