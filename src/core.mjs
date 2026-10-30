export const intervals = [1, 3, 7, 14];
export function today() { return new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Istanbul', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date()); }
export function addDays(date, n) { const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10); }
export function reviewWord(word, remembered, date=today()) {
 if(word.stage>=4 || word.nextReview>date || word.lastReview===date) return word;
 if(!remembered) return {...word, nextReview:addDays(date,1),lastReview:date};
 const stage=word.stage+1;
 return {...word,stage,lastReview:date,nextReview:stage===4?'': [addDays(word.created,intervals[stage]),addDays(date,1)].sort().at(-1)};
}
export function dueWords(words,date=today()) {return words.filter(w=>w.stage<4 && w.nextReview<=date && w.lastReview!==date);}
export function complete(lesson,progress) {return lesson.tasks.every((_,i)=>progress?.checks?.[i]===true);}
export function nextLesson(lessons,progress,date=today()) {return lessons.find(d=>d.date<=date&&!complete(d,progress[d.id]))||lessons.find(d=>!complete(d,progress[d.id]))||lessons.at(-1);}
export function streak(progress,date=today()) {let days=new Set(Object.values(progress).filter(p=>p.completedAt).map(p=>p.completedAt));let n=0,d=days.has(date)?date:addDays(date,-1);while(days.has(d)){n++;d=addDays(d,-1);}return n;}
