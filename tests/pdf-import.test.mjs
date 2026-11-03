import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {pdfDraft} from '../src/pdf-draft.mjs';
import {parsePlan} from '../src/plan-format.mjs';
test('Academy PDF lesson pages produce a valid 546-day import',async()=>{
 const data=await fs.readFile(new URL('../public/sources/Ingilizce_A2_C1_546_Gun_Turkce_Gorev_Kelime_Defteri.pdf',import.meta.url));
 const task=getDocument({data:new Uint8Array(data),verbosity:0});
 try {
  const pdf=await task.promise;
  const pages=[];
  for(let number=7;number<=552;number++){
   const page=await pdf.getPage(number), lines=[];
   let line='';
   for(const item of (await page.getTextContent()).items){
    line+=(line?' ':'')+item.str;
    if(item.hasEOL){if(line.trim())lines.push(line.trim());line='';}
   }
   if(line.trim())lines.push(line.trim());
   pages.push({number,lines,urls:(await page.getAnnotations()).map(a=>a.url).filter(url=>url?.startsWith('https://'))});
  }
  const rows=pdfDraft(pages,true);
  assert.equal(rows.length,546);
  const days=rows.map(row=>({title:row.title,tasks:row.tasks.split('\n'),resources:row.resources.split('\n').filter(Boolean).map(line=>({title:'Kaynak',url:line.split(' | ')[1]}))}));
  assert.equal(parsePlan({schemaVersion:1,title:'PDF',startDate:'2026-11-03',dailyMinutes:45,studyDays:[1],days}).days.length,546);
 }finally{await task.destroy();}
});
