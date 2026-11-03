export function pdfDraft(pages, byDay) {
  const groups = [];
  let current;
  for (const {number, lines, urls} of pages) {
    if (!lines.length) throw Error('Sayfa ' + number + ' okunamadı. Metin tanıma (OCR) uygulanmış PDF seç veya sayfa aralığını daralt.');
    if (!byDay) {
      current = {title: lines[0].slice(0, 200), lines: [], urls: new Set()};
      groups.push(current);
    }
    for (const line of lines) {
      const match = byDay && !line.includes('(+') && /^(?:gün|day)\s+(\d{1,3})\b|^(\d{1,3})\s*\.\s*(?:gün|day)\b/iu.exec(line);
      if (match) {
        const day = Number(match[1] || match[2]);
        if (current?.day !== day) {
          if (current && day !== current.day + 1) throw Error('Gün sırası değişiyor. İçindekiler ve ekleri dışarıda bırak veya sayfa başına ders seç.');
          current = {day, title: line.slice(0, 200), lines: [], urls: new Set()};
          groups.push(current);
        }
      }
      if (current) {
        current.lines.push(line);
        for (const url of urls) current.urls.add(url);
      }
    }
  }
  if (!groups.length) throw Error('Gün başlığı bulunamadı. Her sayfayı bir ders olarak aktarabilirsin.');
  if (groups.length > 730) throw Error('En fazla 730 ders aktarılabilir. Sayfa aralığını daralt.');
  return groups.map(group => {
    const tasks = [];
    for (const line of group.lines) {
      const clean = line.trim();
      if (!clean) continue;
      const previous = tasks.at(-1);
      if (previous && previous.length + clean.length < 4000) tasks[tasks.length-1] += ' ' + clean;
      else tasks.push(clean);
    }
    return {title:group.title, tasks:tasks.join('\n'), resources:[...group.urls].map(url=>'PDF kaynağı | '+url).join('\n')};
  });
}
