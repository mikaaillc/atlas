import {useState,useEffect,useRef} from 'react';
import {pdfDraft} from './pdf-draft.mjs';
type Day = {title:string; tasks:string; resources:string};
type Page = {number:number; lines:string[]; urls:string[]};
export default function PdfImport({onDraft}:{onDraft:(name:string,days:Day[])=>void}) {
  const [file,setFile]=useState<File>(), [first,setFirst]=useState(1), [last,setLast]=useState(''), [byDay,setByDay]=useState(true);
  const [busy,setBusy]=useState(false), [status,setStatus]=useState(''), [error,setError]=useState('');
  const active=useRef(true);
  useEffect(()=>{active.current=true;return ()=>{active.current=false;};},[]);
  async function read() {
    if (!file || busy) return;
    setError('');setBusy(true);setStatus('PDF açılıyor…');
    let task:import('pdfjs-dist').PDFDocumentLoadingTask|undefined;
    try {
      if(file.size>20*1024*1024) throw Error('En fazla 20 MB büyüklüğünde bir PDF seç.');
      const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc=(await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
      task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
      const doc=await task.promise;
      const end=last ? Number(last) : doc.numPages;
      if(!Number.isInteger(first)||!Number.isInteger(end)||first<1||end<first||end>doc.numPages||end-first>=750)
        throw Error('Bu PDF '+doc.numPages+' sayfa. En fazla 750 sayfalık geçerli bir aralık seç.');
      const pages:Page[]=[];
      let size=0;
      for(let number=first;number<=end && active.current;number++) {
        setStatus('Okunan sayfa: '+number+' / '+end);
        const page=await doc.getPage(number), content=await page.getTextContent();
        const lines:string[]=[];let line='';
        for(const item of content.items) {
          if(!('str' in item)) continue;
          line+=(line?' ':'')+item.str;
          if(item.hasEOL){if(line.trim()) lines.push(line.trim());line='';}
        }
        if(line.trim()) lines.push(line.trim());
        size+=lines.join(' ').length;
        if(size>1800000) throw Error('Metin tek plana sığmıyor. Daha kısa bir sayfa aralığı seç.');
        const urls:string[]=[];
        for(const annotation of await page.getAnnotations()) {
          if(!annotation.url) continue;
          try {const url=new URL(annotation.url);if(url.protocol==='https:'&&!url.username&&!url.password) urls.push(url.href);} catch {}
        }
        pages.push({number,lines,urls});page.cleanup();
      }
      if(active.current) onDraft(file.name.replace(/\.pdf$/i,'').slice(0,160),pdfDraft(pages,byDay));
    } catch(e) {
      if(active.current) setError((e as Error).name==='PasswordException'?'PDF şifreli. Şifresiz bir kopya seç.':(e as Error).message);
    } finally {await task?.destroy();if(active.current){setBusy(false);setStatus('');}}
  }
  return <section><p>Metin içeren bir PDF seç. Dersleri çıkardıktan sonra başlıkları, görevleri ve takvimi düzenleyebilirsin. PDF cihazında okunur, hesabına yalnızca kaydettiğin plan eklenir.</p>
    <label className="plan-file">PDF dosyası (en fazla 20 MB)<input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]);setError('');}}/></label>
    <div className="form-grid"><label className="field">İlk sayfa<input type="number" min={1} value={first} disabled={busy} onChange={e=>setFirst(Number(e.target.value))}/></label><label className="field">Son sayfa<input type="number" min={first} placeholder="Dosyanın sonu" value={last} disabled={busy} onChange={e=>setLast(e.target.value)}/></label></div>
    <label className="field">Derslere ayırma<select value={byDay?'days':'pages'} disabled={busy} onChange={e=>setByDay(e.target.value==='days')}><option value="days">Gün 1 / Day 1 başlıklarına göre</option><option value="pages">Her sayfa bir ders</option></select></label>
    <p className="small-note">Kapak, içindekiler ve ekleri aralığın dışında bırak. Taranmış sayfalar için önce metin tanıma (OCR) gerekir.</p>
    <button className="button primary" disabled={!file||busy} onClick={read}>Dersleri çıkar ve düzenle</button><p role="status">{status}</p>{error&&<p className="error" role="alert">{error}</p>}</section>;
}
