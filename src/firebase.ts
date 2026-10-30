import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
const env=import.meta.env;
export const configured=!!(env.VITE_FIREBASE_API_KEY&&env.VITE_FIREBASE_AUTH_DOMAIN&&env.VITE_FIREBASE_PROJECT_ID&&env.VITE_FIREBASE_APP_ID);
const app=configured?initializeApp({apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID,storageBucket:env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:env.VITE_FIREBASE_APP_ID}):null;
export const cloudAccessReady=env.VITE_FIREBASE_RULES_READY==='true';
export const emailEnabled=env.VITE_AUTH_EMAIL_ENABLED!=='false';
export const googleEnabled=env.VITE_AUTH_GOOGLE_ENABLED==='true';
export const auth=app?getAuth(app):null;
export const db=app?getFirestore(app,env.VITE_FIREBASE_DATABASE_ID||'(default)'):null;
if(auth&&db&&env.VITE_USE_EMULATORS==='true'&&['localhost','127.0.0.1'].includes(location.hostname)){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);}
