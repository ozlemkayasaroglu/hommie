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

### Exception: the footer

The footer credit line is brand territory too and stays in English, with a
deliberately romantic sign-off:

`Handcrafted with 🧡 and plain vanilla JS — for lovey.`

Altındaki Türkçe alt satır ("Ne framework, ne bundler. Sadece aşk ve biraz JavaScript.") bu istisnanın parçasıdır.

Everything outside the hero and the footer stays Turkish, and the "no romantic
language" rule below applies to that Turkish UI — not to these two blocks.

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

Her kartta üç durumlu bir seçim şeridi bulunur:

- **Başlamadı** — varsayılan
- **Devam ediyor**
- **Tamamlandı** — kart soluklaşır, başlığı üstü çizili görünür

Bu üç değer veritabanındaki tek geçerli durum kümesidir. Eski dört durumlu şema (`Yapılmadı`, `Araştırılıyor`, `Sipariş verildi`, `Tamam`) otomatik olarak dönüştürülür: `Yapılmadı → Başlamadı`, `Araştırılıyor` ve `Sipariş verildi → Devam ediyor`, `Tamam → Tamamlandı`. Excel içe aktarımı da eski etiketleri aynı şekilde çevirir.

Üstteki Durum filtresi ve düzenleme penceresi aynı üç seçeneği kullanır.

### Sıralama

Varsayılan sıralama **En yeni**'dir, yani yeni eklenen kayıt listenin en üstünde görünür. Yeni kayıt eklendiğinde sıralama "En yeni"ye döner ve "Bitenler" sekmesindeyken "Devam edenler" sekmesine geçilir ki kayıt görünür olsun.

## ALANLAR, ÜYELER, DAVET

Alan bilgisi hero'nun hemen altında kendi şeridinde durur: "BURASI" etiketi, alan adı, üye rozetleri (baş harf avatarı + isim, kendin "(sen)" ile işaretli), "Birini davet et" rozeti ve ayarlar düğmesi. Altında kaç kişi olduğunuza göre değişen bir cümle bulunur — tek kişiyken davet etmeye çağırır, iki kişiyken listeyi birlikte topladığınızı söyler.

Avatar rengi üye kimliğinden türetilir, böylece her üye kendi sabit rengini alır.

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
