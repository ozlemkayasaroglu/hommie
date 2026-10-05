# HOMMIE — Ürün Kuralları

## LANGUAGE REQUIREMENT — VERY IMPORTANT

The entire user-facing application UI MUST be in Turkish.

This includes:

- onboarding
- buttons
- labels
- placeholders
- validation messages
- error messages
- success messages
- empty states
- modal dialogs
- navigation
- filters
- tabs
- task-related text
- space management
- member management
- invite flow
- settings
- confirmation dialogs

Do NOT use English UI text.

Technical code, variable names, database column names, comments, commit messages, and developer documentation may remain in English.

The product language is Turkish (tr-TR).

### Exception: the hero block

The hero is brand territory and stays in English on purpose:

- The title is `Messy now.` / `Home later.`
- The typewriter line above it cycles the English nickname list (`sweetie`, `cutie`, `my love`, `xoxo`, `mine. 😏`, …).
- The brand name is written `HOMMIE` — never `Hommie` inside an uppercased element, because Turkish uppercasing turns `i` into `İ`.
- The typewriter element carries `lang="en"` so the browser uses English casing rules.

Everything outside the hero stays Turkish.

### Wording

Use natural, conversational Turkish rather than literal translations.

"Create a space" → "Alan oluştur"
"Join with invite code" → "Davet koduyla katıl"
"Give your space a name" → "Alanına bir isim ver"
"Copy invite link" → "Davet bağlantısını kopyala"
"Continue" → "Devam et"
"You're in" → "Katıldın"
"Something went wrong" → "Bir şeyler ters gitti"
"Invalid invite code" → "Bu davet kodu geçerli değil"
"Members" → "Üyeler"
"Invite someone" → "Birini davet et"
"Space settings" → "Alan ayarları"
"Create" → "Oluştur"
"Cancel" → "Vazgeç"
"Save" → "Kaydet"
"Delete" → "Sil"

Do not use "workspace" in the UI. Use "alan" instead.
Do not use "account" in the UI. Use "profil" only when necessary.

Do not use romantic/couple-oriented language in the Turkish UI:

- "Bizim ev"
- "Aşk"
- "Sevgilin"
- "Partnerin"
- "Sonsuza kadar"
- "Birlikte bir hayat"

Keep the tone: cool, playful, casual, friendly, slightly cheeky, modern.

The application should feel like a lightweight Turkish home tracker, not a corporate SaaS product.

## LİSTE YAPISI

### Sekmeler

Liste üç sekmeye ayrılır, sekmeler oda filtrelerinin üstünde durur ve her birinde sayaç bulunur:

- **Devam edenler** — durumu `Tamam` olmayan her kayıt (varsayılan sekme)
- **Bitenler** — durumu `Tamam` olan kayıtlar
- **Tümü**

Sayaçlar seçili odaya göre hesaplanır.

### Kart üzerindeki durum

Her kartta iki durumlu bir anahtar bulunur: **Devam ediyor** / **Tamamlandı**.

- "Tamamlandı" kaydı `Tamam` yapar; kart soluklaşır ve başlığı üstü çizili görünür.
- "Devam ediyor" yalnızca `Tamam` olan bir kaydı `Yapılmadı`ya döndürür. Kayıt zaten `Araştırılıyor` veya `Sipariş verildi` ise bu ayrıntılı durum korunur.
- Ayrıntılı durumlar (`Yapılmadı`, `Araştırılıyor`, `Sipariş verildi`, `Tamam`) düzenleme penceresinden ve üstteki Durum filtresinden kullanılmaya devam eder.

Kartta dört seçenekli durum menüsü kullanılmaz; o menü yerini bu anahtara bırakmıştır.

### Sıralama

Varsayılan sıralama **En yeni**'dir, yani yeni eklenen kayıt listenin en üstünde görünür. Yeni kayıt eklendiğinde sıralama "En yeni"ye döner ve "Bitenler" sekmesindeyken "Devam edenler" sekmesine geçilir ki kayıt görünür olsun.

## ALANLAR, ÜYELER, DAVET

- Alan, onboarding penceresinden kurulur ve 6 karakterlik bir davet kodu alır.
- `?davet=KOD` bağlantısı "Davet koduyla katıl" sekmesini açıp kodu doldurur.
- Öğeler `x-space-id` / `x-member-id` başlıklarıyla alana bağlıdır.
- Alanı yalnızca kuran kişi yeniden adlandırabilir ve üye çıkarabilir.
- Son üye de ayrıldığında alan ve içindeki kayıtlar silinir.

## YAPAY ZEKA — ŞİMDİLİK KAPALI

Foto analizi arayüzden kaldırıldı. "Foto analizi" düğmesi gizli, panel açılmıyor.

Kod geride duruyor ve çalışır durumda: `/api/photo-background`, `/api/photo-status`, `api/_lib/photo.js` ve NVIDIA istemcisi. Geri açmak için `index.html` içindeki `#photoTabButton` öğesinden `hidden` özniteliğini kaldırmak yeterli.

## DAĞITIM

Yalnızca Netlify. Veri Netlify Blobs'ta tutulur, yerel geliştirmede `.data/` klasöründe. Ayrıntılar için `README.md`.
