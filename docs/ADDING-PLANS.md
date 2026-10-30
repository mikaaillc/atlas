# Yeni konu veya öğrenme planı eklemek

Uygulama kodunu değiştirmek veya yeniden deploy etmek gerekmez. Giriş yaptıktan sonra **Öğrenme planlarım → Yeni plan ekle** akışını kullanın.

## ChatGPT / Codex ile plan hazırlama

1. Öğrenme planlarım sayfasındaki **Plan hazırlama komutunu kopyala** düğmesine basın.
2. Komutu ChatGPT/Codex'e verip öğrenmek istediğiniz konuyu, mevcut seviyenizi, hedefinizi, başlangıç tarihinizi ve günlük sürenizi belirtin. Örneğin: “Docker öğrenmek istiyorum, başlangıç seviyesindeyim; hafta içi 45 dakika ayırabilirim. Atlas'a aktarılabilir bir plan hazırla.”
3. Hazırlanan JSON dosyasını **Dosya / metin ile aktar** alanına yükleyin veya metnini yapıştırın.
4. Tarihleri, günlük görevleri ve kaynakları önizleyin. **Planı hesabıma ekle** düğmesine basın.

Uygulama kendi başına bir AI hizmetini çağırmaz. Plan içeriği sizin sağladığınız dosyadan veya manuel girişten gelir. İçerik üreten asistan gerçek kaynak kullanmalı, bilinmeyen ders başlıkları/bağlantıları uydurmamalıdır.

## Elle plan oluşturma

**Kendim oluşturacağım** sekmesinde ad, hedef, başlangıç, süre ve çalışma günlerini seçin. Her gün için başlık, görevler ve kaynakları yazın. Görevlerde her satır bir adımdır. Kaynaklarda her satır `Kaynak adı | https://...` biçimindedir. İstediğiniz kadar gün ekleyip önizleyin.

## Dosya biçimi — sürüm 1

```json
{
  "schemaVersion": 1,
  "title": "Planın adı",
  "description": "Hedef ve kapsam",
  "startDate": "2026-11-02",
  "dailyMinutes": 45,
  "studyDays": [1, 2, 3, 4, 5],
  "days": [
    {
      "title": "Günün gerçek konusu",
      "focus": "İsteğe bağlı odak",
      "minutes": 45,
      "tasks": ["O gün yapılacak somut çalışma"],
      "resources": []
    }
  ]
}
```

Bu yalnızca biçim açıklamasıdır; örnek gün uygulamaya otomatik eklenmez. Kaynak varsa `resources` alanına `{"title":"Kaynak adı","url":"https://..."}` eklenir.

- `studyDays`: 0=Pazar, 1=Pazartesi, … 6=Cumartesi. Başlangıç seçilen bir çalışma günü değilse ilk ders bir sonraki uygun güne atanır.
- En fazla 2 MB dosya, 1–730 ders günü, günde 1–10 görev ve 8 kaynak.
- Süreler 5–480 dakika. Günün `minutes` değeri yoksa `dailyMinutes` kullanılır.
- Kaynaklar HTTPS olmalı; kullanıcı adı/şifre içeren adresler kabul edilmez.
- Bilinmeyen dosya sürümleri ve geçersiz tarihler kaydetmeden önce reddedilir.

Geliştirme sırasında bir dosyayı yazmadan kontrol etmek için:

```sh
node scripts/validate-plan.mjs /tam/yol/plan.json
```

## Saklama ve mevcut planlar

Yeni planlar `learningAtlas/{uid}/plans/{planId}` ve altındaki `lessons` koleksiyonunda tutulur. Her yeni aktarım benzersiz bir kimlik alır; mevcut İngilizce/AWS planını veya önceki ilerlemeyi ezmez. Sadece sahibi okur ve yazar. Tamamlanmamış aktarım `importing` olarak saklanır ve normal plan listesinde gösterilmez. Bağlantı hatası olursa tekrar aktarabilirsiniz; yarım aktarım tamamlanmış gibi sunulmaz.

Plan kartındaki **Dışa aktar** düğmesi aynı Atlas dosya biçimini üretir; başka hesabınıza veya daha sonra yeni bir plan olarak içe aktarabilirsiniz. Bir planın değişmiş sürümünü içe aktarmak yeni plan oluşturur; ilerleme kayıtları önceki planla kalır. Bu sürümde mevcut planı yerinde düzenleme/silme arayüzü yoktur.
