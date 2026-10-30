"""Reproduce the content import. Requires Python 3 + pypdf. No generated lessons."""
import json, re, hashlib, shutil, sys
from pathlib import Path
from datetime import date, timedelta
from pypdf import PdfReader
root=Path(__file__).resolve().parents[1]
if len(sys.argv)<3: raise SystemExit('Usage: python3 scripts/import_plans.py <PDF-directory> <verified-AWS-JSON-path>')
source=Path(sys.argv[1])
(root/'private/catalog').mkdir(parents=True,exist_ok=True)
(root/'private/sources').mkdir(parents=True,exist_ok=True)
eng=source/'Ingilizce_A2_C1_546_Gun_Turkce_Gorev_Kelime_Defteri.pdf'
aws=source/'AWS_112_Gun_Educative_Udemy_Ders_Dogrulama_Duzenlenmis.pdf'
aws_json=Path(sys.argv[2])
schedule=json.loads((root/'src/data/schedule.json').read_text())
r=PdfReader(eng);days=[]
for page_num,p in enumerate(r.pages,1):
 t=p.extract_text();match=re.search(r'GÜN (\d{3}) ·',t)
 if not match: continue
 n=int(match[1]); meta=re.search(r'\n(A2|B1|B2|C1)\s+·\s+(\d+)\. hafta\s+·\s+(\d+) dakika\n(.*?)\nOdak: (.*?)\s+Çalışma: (.*?)\nO GÜN',t,re.S)
 assert meta,(n,t[:200])
 body=t.split('TEK DERS AKIŞI: ÖĞREN · KULLAN · DÜZELT · DEFTERE İŞLE\n')[1].split('ÇALIŞMA KANITIN')[0]
 steps=[re.sub(r'\s+',' ',s).strip() for s in re.split(r'(?m)^\d\. ',body)[1:]]
 assert len(steps)==6,(n,len(steps))
 labels=[s.strip().replace('↗','').strip() for s in t.split('O GÜN AÇILACAK KAYNAKLAR\n')[1].split('TEK DERS AKIŞI')[0].splitlines() if s.strip()]
 urls=[str(a.get_object().get('/A',{}).get('/URI','')) for a in p.get('/Annots',[])];urls=[u for u in urls if u.startswith('https://')]
 assert len(urls)==len(labels),(n,labels,urls)
 days.append({'id':f'english-{n}','track':'english','day':n,'date':str(date.fromisoformat(schedule['englishStart'])+timedelta(days=n-1)),'originalDate':str(date.fromisoformat(schedule['englishSourceStart'])+timedelta(days=n-1)),'level':meta[1],'week':int(meta[2]),'minutes':int(meta[3]),'title':meta[4].strip(),'focus':meta[5].strip(),'kind':meta[6].strip(),'tasks':steps,'links':[{'label':l,'url':u} for l,u in zip(labels,urls)],'page':page_num})
assert len(days)==546
(root/'private/catalog/english.json').write_text(json.dumps(days,ensure_ascii=False))
a=json.loads(aws_json.read_text());awsdays=[]
r2=PdfReader(aws)
page_by_day={}
for page_num,p in enumerate(r2.pages,1):
 m=re.search(r'GÜN\s+(\d{3})\s*\|',p.extract_text())
 if m: page_by_day[int(m[1])]=(page_num,p)
for d in a['days']:
 n=d['dayIndex']; dt=date.fromisoformat(d['date']); assert dt.weekday()<5
 page_num,p=page_by_day[n]
 urls=list(dict.fromkeys(str(a.get_object().get('/A',{}).get('/URI','')) for a in p.get('/Annots',[])))
 urls=[u for u in urls if u.startswith('https://')]
 def label(u):
  if 'educative.io' in u: return 'Educative · '+('C# / .NET' if 'c-sharp' in u or 'asp-net' in u else 'SAA-C03' if n<=70 else 'AIF-C01')
  if 'udemy.com' in u: return 'Udemy · '+('SAA-C03' if n<=70 else 'AIF-C01')
  if 'skillbuilder.aws' in u: return 'AWS · Resmî soru seti'
  return 'AWS · Kaynak'
 assert urls,n
 awsday={'id':f'aws-{n}','track':'aws','day':n,'date':d['date'],'level':'SAA-C03' if n<=70 else 'AIF-C01','week':(n-1)//5+1,'minutes':75,'title':d['title'],'focus':'.NET + AWS' if n<=70 else '.NET + AI','kind':'Educative' if n%2 else 'Udemy','tasks':[s for s in d['details'] if not s.startswith('Kaynak:')],'links':[{'label':label(u),'url':u} for u in urls],'page':page_num}
 awsdays.append(awsday)
assert len(awsdays)==112
(root/'private/catalog/aws.json').write_text(json.dumps(awsdays,ensure_ascii=False))
for src,name in [(eng,'english-plan.pdf'),(aws,'aws-plan.pdf')]: shutil.copyfile(src,root/'private/sources'/name)
manifest={'importedAt':'2026-10-30','english':{'source':eng.name,'sha256':hashlib.sha256(eng.read_bytes()).hexdigest(),'days':len(days),'applicationStartDate':schedule['englishStart'],'sourceStartDate':schedule['englishSourceStart'],'dateOffsetDays':schedule['englishDateOffsetDays'],'method':'All 546 daily pages, six steps and original PDF link annotations; no synthetic daily tasks.'},'aws':{'source':aws.name,'sha256':hashlib.sha256(aws.read_bytes()).hexdigest(),'structuredSource':aws_json.name,'structuredSha256':hashlib.sha256(aws_json.read_bytes()).hexdigest(),'days':len(awsdays),'method':'Existing verified JSON tasks, all daily source links imported from the original PDF annotations, original PDF retained. Course verification labels are source claims, not a new verification.'}}
(root/'private/catalog/provenance.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(root/'private/catalog/guide.json').write_text(json.dumps({'pages':[{'page':i+1,'text':p.extract_text()} for i,p in enumerate(r.pages) if i<6 or i>=552]},ensure_ascii=False))
print('Imported',len(days),'English days;',len(awsdays),'AWS days')
