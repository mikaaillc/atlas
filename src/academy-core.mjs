// Display-only overlay: never rewrites catalog documents or AWS lessons.
export const academyPdf='/sources/Ingilizce_A2_C1_546_Gun_Turkce_Gorev_Kelime_Defteri.pdf';
export function academyOverlay(lessons, academy) {
 return lessons.map(l=>{
  if(l.track!=='english')return l;
  const t=academy.find(t=>t.id===l.day);if(!t)return l;
  return {...l,date:t.date,title:t.lessonTitle,focus:t.focus,level:t.level,week:t.week,
   originalTasks:l.tasks,
   tasks:[t.teaching,'Atlas mini testindeki '+t.questions.length+' soruyu çöz. Cevap açıklamalarını incele; yanlışların nedenini yaz.',t.resources.map(r=>r.name+': '+r.instruction).join('\n'),t.writingPrompt,t.speakingPrompt,t.dayType===6?'Kelime defterinde bu haftanın kelimelerini tekrar et; '+t.selfCheck:'Kelime defterine bugünün kelimelerini kendi cümlenle kaydet. 1/3/7/14 günlük bekleyen tekrarları tamamla. '+t.selfCheck]};
 });
}
export function gradeQuiz(questions,answers){
 return {score:questions.filter((q,i)=>answers[i]===q.answer).length,total:questions.length};
}
