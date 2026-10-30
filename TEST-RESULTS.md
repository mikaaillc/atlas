# Son doğrulama — giriş zorunluluğu ve yeni planlar

30 Ekim 2026.

- **15/15 içerik/format testi:** İngilizce Pazartesi takvimi, özgün kaynaklar, tekrar davranışı; plan içe aktarma/dışa aktarma, hafta içi takvimleme, bozuk sürüm/tarih, görev/gün/dosya sınırları ve tehlikeli kaynak URL'lerinin reddi.
- **10/10 Firestore güvenlik testi:** Atlas sahipliği, başka kullanıcı ve oturumsuz istemci reddi, özgün BatteryLook erişimlerinin korunması; yeni plan/gün izinleri ve katalog/PDF parçalarında giriş zorunluluğu, istemciden katalog yayınının reddi.
- Üretim derlemesi başarılı. Özel günlük görevler ve PDF'ler public build içinde yok; özel kaynak dizini Vite HTTP erişimine kapalı. Eski statik ders/PDF adresleri gerçek dosyayı sunmuyor.
- Canlı Firebase'de 546 İngilizce + 112 AWS günü ve özgün PDF parçaları özel kataloğa aktarıldı. Anonim katalog/ders/PDF istekleri reddedildi. BatteryLook'un mevcut kural bölümü birebir korundu.
- Gerçek yerel girişsiz ana sayfa ve doğrudan ders bağlantısı tarayıcıda kontrol edildi: yalnızca giriş ekranı gösterildi.
- **Ayrı demo emülatöründe tarayıcı akışı:** geçici QA hesabı açma/giriş, iki günlük JSON planı önizleme ve kaydetme, kişisel günlük dersi açma, iki görevi tamamlayıp not kaydetme, sayfa yenilemede not/%100 durumunun korunması ve çıkış sonrası açık kişisel dersin anında gizlenmesi başarılı.
- QA planı ve hesabı gerçek Firebase projesine eklenmedi. Geçici test sunucuları testten sonra kapatılır. Gerçek kullanıcı Google popup girişi otomatik yapılmadı.
- Üretimde mevcut Google sağlayıcısı ve yetkili alan adları değiştirilmedi. Gizli sunucu credential değerleri kopyalanmadı. Vercel deployment yapılmadı.


## Plan sahipliği kısıtlaması

- Mevcut iki plan belirtilen gerçek Firebase kullanıcı UID'sine atandı; UID'nin mevcut olduğu yönetici API'sinde doğrulandı.
- Canlı iki metadata kaydında yalnızca `ownerUid` alanı atomik olarak güncellendi. Diğer alanlar tekrar okunup karşılaştırıldı; dersler, PDF'ler ve kişisel çalışma kayıtları değiştirilmedi.
- Firestore kuralları metadata, günlük dersler ve PDF parçalarının yalnızca atanan UID tarafından okunmasına izin verir. Kuralların aktif sürümü tekrar okunarak yerel dosyayla eşleştirildi.
- Emülatörde atanan UID erişimi başarılı; diğer iki UID ve oturumsuz erişim reddedildi. Sahiplik değiştirme ve filtrelenmemiş katalog erişimi reddedildi. Doğru sahiplik filtresi başka kullanıcı için boş sonuç verdi.
- Arayüz artık katalogda plan bulunmasını varsaymaz; planı olmayan kullanıcıya boş çalışma alanı gösterilir. Menü ve sayfalar yalnızca yüklenen kendi planlarından üretilir.
- 15 veri/format testi, 10 kural testi ve üretim dosyası gizlilik kontrolü başarılı.
