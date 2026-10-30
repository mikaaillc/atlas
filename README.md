# Atlas — Kişisel öğrenme platformu

React + TypeScript + Vite; Firebase Authentication + Firestore. Koyu ve responsive arayüz. Aynı BatteryLook Firebase projesinde ayrı Atlas veri alanları kullanır. Vercel'e web sitesi deployment yapılmadı.

## Çalıştırma

Node.js 22.12+ veya 24 LTS:

```sh
npm ci
npm run dev -- --port 5173
```

`http://localhost:5173` adresini açın ve Google hesabınızla giriş yapın. `localhost` mevcut Firebase projesinde zaten yetkilidir. Masaüstündeki projede `.env.local` hazırlanmıştır; kaynak ZIP'inde gerçek değerler bulunmaz. Kendi kopyanız için `.env.example` alanlarını yerel `.env.local` olarak doldurun.

## Giriş ve içerik gizliliği

Giriş zorunludur. Oturum kontrolü bitmeden çalışma alanı gösterilmez; girişsiz doğrudan ders/plan bağlantıları da giriş ekranını açar. Çıkışta planlar ve kişisel kayıtlar ekrandan kaldırılır. Girişsiz yerel deneme modu kaldırılmıştır.

Ders içerikleri JavaScript paketine dahil edilmez. Özgün PDF'ler `public/` altında sunulmaz. Mevcut iki plan ve PDF parçaları Firestore'daki `learningAtlasCatalog` alanından yalnızca planın atandığı kullanıcı oturum açtıktan sonra okunur. PDF parçaları birleştirilirken boyut ve SHA-256 kontrol edilir. Kullanıcı içeriği kendi yetkili oturumunda açabilir veya indirebilir.

Yeni planlar ve ilerleme kayıtları yalnızca sahibine aittir. Emülatör testleri hesaplar arası erişim reddini doğrular. Sunucu tarafından korunmuş içerik kullanıldığı için yalnızca bir arayüz perdesiyle gizleme yapılmaz.

## Yeni plan ekleme

**Öğrenme planlarım → Yeni plan ekle**:

- Atlas biçiminde JSON dosyası yükleyin veya plan metnini yapıştırın.
- Ya da **Kendim oluşturacağım** sekmesinden ad, hedef, tarih, çalışma günleri ve günlük görevleri yazın.
- Tarih/görev/kaynak önizlemesini inceleyip **Planı hesabıma ekle** deyin.

**Plan hazırlama komutunu kopyala** düğmesi ChatGPT/Codex'e verilecek komutu hazırlar. Konu, seviye ve sürenizi belirterek yeni bir plan isteyebilir, çıkan dosyayı kod değiştirmeden içe aktarabilirsiniz. Uygulama kendi başına AI API çağrısı yapmaz.

Her yeni aktarım benzersiz plan kimliği alır; önceki planları veya ilerlemeyi ezmez. Karttaki **Dışa aktar** aynı biçimde JSON üretir. Planı yerinde düzenleme/silme arayüzü bu sürümde yoktur. Tamamlanmamış aktarım normal listede gösterilmez.

Biçim ve adımlar: [Yeni plan rehberi](docs/ADDING-PLANS.md).

## Mevcut planlar

- İngilizce: 546 gün, **2 Kasım 2026 Pazartesi – 30 Nisan 2028 Pazar**. Her gün çalışma; her yedinci gün hafif tekrar. Busuu Premium, Reader at Work, News in Levels, British Council ve diğer özgün PDF kaynakları. Altı adım, Türkçe challenge ve İngilizce üretim görevleri korunur.
- AWS: 112 iş günü, 26 Ekim 2026 – 30 Mart 2027. İlk 70 gün SAA-C03, sonraki 42 gün AIF-C01; hafta sonu tatil. Educative, Udemy, C#/.NET, OrderFlow ve EnterpriseDoc Copilot görevleri korunur.
- Günlük görev işaretleme, yazı/konuşma notları, düzeltmeler, uygulama kanıtları, quiz doğru/toplam sonuçları.
- Kelime defteri: bağlam, anlam, kişisel cümle ve gerçek eklenme tarihinden +1/+3/+7/+14 günlük aktif hatırlama. Hatırlanmayan kelime ertesi gün döner.
- İlerleme, gerçek çalışma serisi, seviye kontrol noktaları ve kişisel yeni planların günlük dersleri.

Günlük ilerleme **İlerlemeyi kaydet** ile saklanır. Açık uçlu quizler otomatik puanlanmaz. Süre istatistiği plan süresinin toplamıdır; kronometre ölçümü değildir. Kaynak plandaki kurs doğrulama notları önceki incelemeyi yansıtır; kurs içerikleri değişebilir. C1 takvimi seviye garantisi değildir.

## Veri modeli

```text
learningAtlasCatalog/{english | aws}
  metadata including ownerUid, source hash/size/chunk count
  /lessons/{lessonId}       # assigned owner read, admin publish only
  /sourceChunks/{partId}    # assigned owner read, admin publish only
learningAtlas/{uid}/plans/{customId}
  metadata, schemaVersion, status
  /lessons/{lessonId}       # owner read/write
learningAtlas/{uid}/progress/{lessonId}  # owner only
learningAtlas/{uid}/words/{wordId}       # owner only
```

BatteryLook'un `users/...` kuralları korunur. `firestore.rules` mevcut canlı birleşik kurallardır; `firestore.batterylook.baseline.rules` entegrasyon öncesi orijinal kopyadır. `firestore.atlas.rules` ayrı projeye yönelik Atlas kopyasıdır; paylaşılan veritabanına tek başına uygulanmaz.

Authentication aynı Firebase projesinin mevcut Google sağlayıcısını kullanır. E-posta sağlayıcısı canlı projede kapalıdır ve bu ayar değiştirilmedi. Özel sunucu anahtarları, service-account JSON veya CLI token'ları projeye kopyalanmaz. `.env.local` sadece Firebase web istemci alanlarını içerir; Git ve ZIP dışındadır. Firebase istemci alanlarının niteliği için [resmî açıklama](https://firebase.google.com/docs/projects/api-keys).

## Özgün kaynaklar ve yeniden aktarım

Özgün dosyalar kaynak projede `private/sources/` altında, yapılandırılmış planlar `private/catalog/` altında bulunur. Vite bu özel dizini HTTP üzerinden reddeder; üretim `dist/` çıktısına kopyalanmazlar. Bu yerel kaynaklar `.gitignore` ile GitHub deposundan da dışlanır. Kaynak ZIP'i arşivleme amacıyla özel kopyaları içerebilir; yayımlanan web çıktısı ve Git deposu içermez. Uygulama çalışma sırasında verileri korumalı Firestore'dan alır; build için yerel PDF/JSON gerekmez.

- `private/catalog/provenance.json`: SHA-256 ve aktarım izleri.
- `src/data/schedule.json`: İngilizce başlangıcı ve özgün PDF takvimi farkı.
- `scripts/import_plans.py`: kaynak PDF'lerden yeniden aktarım; `pypdf` gerekir. Günlük içerik/kaynak sırası korunur. Bu komut yerel kaynakları yeniler; canlı kataloğu kendiliğinden değiştirmez.
- `scripts/verify_sources.py`: 658 günün bağlantılarını özgün PDF anotasyonlarıyla karşılaştırır.

Özgün İngilizce PDF'inin ilk tarihi 30 Ekim 2026 olarak kalır. Uygulama takvimi üç gün ileri kaydırılmıştır; her derste `originalDate` kaynağın tarihini saklar. Var olan bulut ilerleme kimlikleri ve kelime tarihleri korunur. Eski tarayıcı deneme kayıtları otomatik aktarılmaz veya silinmez; yeni arayüz onları kullanmaz.

## Vercel kurulumu

1. Projeyi kendi deponuzdan Vercel'e aktarın. Framework: Vite; install `npm ci`; build `npm run build`; çıktı `dist`.
2. `.env.local` içindeki web istemci alanlarını Vercel ortam değişkenlerine kendiniz ekleyin. `VITE_USE_EMULATORS=false`, `VITE_AUTH_GOOGLE_ENABLED=true`, `VITE_AUTH_EMAIL_ENABLED=false`, `VITE_FIREBASE_RULES_READY=true` olmalı.
3. Vercel/custom alan adınızı Firebase Authentication yetkili alan adlarına ekleyin. Ortam değişkeni değişiminden sonra yeniden build gerekir.
4. Mevcut Firebase projesindeki katalog ve kurallar hazırdır. Başka bir Firebase projesine geçiş ayrıca özel kataloğun yönetici tarafından aktarılmasını ve kuralların o projede kurulmasını gerektirir.

Yeni kişisel öğrenme planları uygulamadan eklenir; yeniden deployment gerekmez. `vercel.json` statik çıktı/yönlendirme/yanıt başlıklarını içerir. Navigasyon hash tabanlıdır.

## Kontroller

```sh
npm test
npm run build
npm run test:privacy
npm run test:rules
# Aşağıdakiler yalnızca yerel özel kaynaklar varsa çalışır:
npm run test:sources
python3 scripts/verify_sources.py
```

10 genel mantık/format testi, yerel kaynaklarla 5 ek içerik/takvim testi ve 10 güvenlik kuralı testi başarılıdır. Yeni bir Git klonunda `npm test` özel kaynaklara ihtiyaç duymaz. Üretim dosyalarında ders içeriği/PDF bulunmadığı ayrıca kontrol edilir. Giriş, plan önizleme/aktarma, günlük kayıt, sayfa yenilemede korunma ve çıkış sonrası gizlenme ayrı demo Auth + Firestore emülatöründe tarayıcıdan test edildi. Gerçek Google popup girişi otomatik yapılmadı.

`npm run test:rules` yalnızca `demo-learning-atlas` yerel Firestore emülatörünü kullanır; Java 21+ gerekir. `scripts/seed-qa-emulator.mjs` sadece bu sabit demo projesine küçük QA verisi ekler; üretim için kullanılmaz.

## Kullanıcıya özel plan ataması

Mevcut İngilizce ve AWS planlarının `ownerUid` değeri yalnızca kullanıcının belirttiği hesaba atanmıştır. Bu kayıt, altındaki günlük dersler ve PDF parçaları yalnızca o UID tarafından okunabilir. İstemciler plan sahipliğini değiştiremez.

Katalog sorgusu `where('ownerUid', '==', auth.uid)` ile yapılır. Firestore kuralları da aynı sahiplik koşulunu doğrular; filtrelenmemiş katalog sorguları reddedilir. Yeni/diğer kullanıcılar bu iki planı otomatik almaz. Kendi boş çalışma alanlarını veya kendilerinin eklediği planları görürler. Ana sayfa, menüler, kaynaklar, takvim, arama, ilerleme ve veri dışa aktarımı yalnızca yüklenen kendi planlarından oluşur. Planı olmayan kullanıcı kendi planını eklemeye devam edebilir.

Yeni kişisel planlar önceki gibi `learningAtlas/{uid}/plans` altında sahibine özeldir. Mevcut iki planın içeriği, kimlikleri, çalışma takvimi ve kişisel ilerleme kayıtları bu atama sırasında değiştirilmedi.

## Uzun süre çalışan Node işlemi

`npm run build` bir kez derler ve biter. `npm run dev` ise localhost önizlemesini ve değişiklik takibini sunan Vite geliştirme sunucusudur; siz kapatana kadar çalışması beklenir. Terminalde Ctrl+C ile kapatabilirsiniz.

## GitHub gönderim kapsamı

Depoya uygulama kaynak kodu, testler, boş ortam şablonu ve Vercel yapılandırması eklenir. `.env.local`, `private/` öğrenme içerikleri, gerçek kullanıcı kimliği içeren doğrulama raporları, `dist/` ve `node_modules/` dışlanır. Testlerde gerçek kullanıcı UID'si yerine sentetik bir test UID'si kullanılır.
