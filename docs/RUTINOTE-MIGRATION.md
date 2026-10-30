# Ortak Rutinote backend'i

Atlas ve Rutinote artık Firebase projesi `rutinote` içindeki aynı Authentication hesaplarını ve `(default)` Firestore veritabanını kullanır. Atlas’ın `.env.local`/Vercel `VITE_FIREBASE_*` alanları Rutinote’un web SDK yapılandırmasıyla eşleşmelidir. Servis hesabı veya özel anahtar kullanılmaz.

## Veri ve kimlik sınırları

- Atlas koleksiyonları yalnızca `learningAtlas` ve `learningAtlasCatalog` kökleridir. Rutinote’un `users`, `tasks`, `projects`, `notes`, iOS/widget/bildirim kayıtlarına taşınma sırasında yazılmaz.
- Eski Atlas hesabı ile Rutinote hesabı yalnızca e-posta metniyle eşleştirilmedi: iki Authentication kaydındaki `google.com` sağlayıcı kimliğinin aynı olduğu yönetici tarafından doğrulandı. Mevcut Rutinote hesabı yeniden kullanılır; kullanıcı veya şifre kopyalama/yeniden oluşturma yapılmaz.
- Plan kataloglarının `ownerUid` alanı Rutinote UID’sine çevrilir. Kişisel ilerleme/kelimeler/planlar yeni UID altına taşınır. Günlük ders kimlikleri, içerikleri, tarihler, notlar ve quiz değerleri korunur.
- İngilizce 546 gün, AWS 112 iş günüdür. PDF parçaları da aynen kopyalanır. İçeriklerin tamamı Git ve public paketin dışında kalır.
- Eski Firebase projesindeki kaynak kayıtlar silinmez. Taşınma öncesi snapshot ve doğrulama raporları yalnızca yerel özel çalışma alanında tutulur; Git’e eklenmez.

## Kurallar

`firestore.rules`, eski Rutinote izinlerini **Atlas dışındaki** koleksiyonlarda aynen korur. Önceki genel authenticated recursive kural Atlas için hariç tutulur. Firestore’da eşleşen `allow` kuralları birleştiği için yalnızca yeni özel kuralları eklemek yeterli değildir.

Atlas kataloğu yalnızca atanmış UID tarafından okunabilir; katalog/PDF sahipliğini istemci değiştiremez. Kişisel planlar, ilerleme ve kelimeler yalnızca kendi UID altında okunup yazılır. Anonymous ve diğer hesap erişimleri reddedilir. Emülatör testleri hem bu erişim reddini hem de eski/native izinlerin önceki kural dosyasıyla eşdeğerliğini kontrol eder.

`firestore.rutinote.baseline.rules` tarihsel geri dönüş kopyasıdır. İçinde Atlas koruması yoktur; Atlas verileri bulunan canlı veritabanına doğrudan geri yüklenmez. Canlı geri dönüş gerekirse Atlas için korumalı kurallar yerinde kalmalı, istemci yönlendirmesi eski backend'e alınmalıdır.

## Hesap ve web oturumu

Rutinote web paneli mevcut `auth` ve `db` nesnelerini kullanır. Ayrı Firebase uygulaması, ikinci popup giriş veya e-posta üzerinden UID eşleştirmesi yoktur. Paneldeki hesap UID’si mevcut Rutinote oturumuyla tam olarak eşleşmelidir.

Atlas’ın ayrı web alanında tarayıcı oturumu ayrıca açılabilir; aynı Google/e-posta hesabı aynı Rutinote UID’sine gider. Token’lar URL, localStorage kopyalama veya postMessage ile uygulamalar arasında taşınmaz. Atlas alan adı Rutinote Firebase Authentication yetkili alan adları arasında olmalıdır.

## Yayın ve doğrulama sırası

1. Kaynak ve hedef snapshot'larını al; hedefte çakışan Atlas kaydı varsa üzerine yazmadan dur.
2. Birleşik kuralları emülatörde ve Firebase kural doğrulamasında kontrol et. Mevcut canlı kural hash'i değiştiyse yeniden birleştir.
3. Atlas'a özel korumalı birleşik kuralları etkinleştir. Sadece iki Atlas namespace'ine, mevcut kaydı ezmeyi reddeden önkoşullarla veriyi aktar.
4. Kaynak snapshot'ının değişmediğini ve hedefteki her belgenin beklenen alanlarla birebir eşleştiğini doğrula. PDF hash/boyut ve 658 ders korunmalı.
5. Atlas ortamını Rutinote'a yönlendir; Rutinote web panelini ortak oturumla derle. Canlı ortam değişkenlerini Git'e koyma.
6. İki uygulamanın testlerini ve derlemelerini çalıştır. iOS source map'inde yeni Atlas/web ekran modülleri bulunmamalı. Native dosyalar, SDK yapılandırması ve bağımlılıklar değişmemeli.

Bu doküman yönetici anahtarları, kullanıcı e-posta adresleri, gerçek UID eşleştirmeleri veya kişisel çalışma notları içermez.
