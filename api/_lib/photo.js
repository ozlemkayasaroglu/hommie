import {
  buildFallbackPhotoSuggestions,
  parseJsonResponse,
  requestNvidiaChat,
  describePhoto,
  DEFAULT_TEXT_MODEL,
  STYLE_GUIDES
} from './ai.js';

function normalizePhotoResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.suggestions)) return payload.suggestions;
  return [];
}

// Foto analizi hem senkron /api/ai hem de Netlify arka plan işi tarafından
// kullanılıyor; mantık tek yerde dursun diye burada.
export async function runPhotoAnalysis(body) {
  const room = String(body.room || 'Genel');
  const style = String(body.style || 'İskandinav');
  const styleGuide = STYLE_GUIDES[style] || '';
  const existingNames = Array.isArray(body.existingItemNames) ? body.existingItemNames : [];
  const images = Array.isArray(body.images) ? body.images : [];

  let suggestions = buildFallbackPhotoSuggestions(room, existingNames, style);
  let source = 'fallback';
  let notice = '';

  if (images.length === 0) {
    notice = 'Fotoğraf gelmedi, örnek öneriler gösteriliyor.';
  } else if (!process.env.NVIDIA_API_KEY) {
    notice = 'NVIDIA_API_KEY tanımlı değil, örnek öneriler gösteriliyor.';
  } else {
    try {
      // 1. aşama: görseli vision modeli İngilizce tarif etsin (JSON üretmede zayıf).
      const description = String(await describePhoto(images)).trim();

      // 2. aşama: metin modeli bu tarife bakarak Türkçe JSON önerileri üretsin.
      const prompt = [
        `Sen Türkçe konuşan bir iç mimarlık asistanısın. Kullanıcı "${room}" odasının boş veya eksik kalmış bir köşesinin fotoğrafını yükledi.`,
        `Fotoğrafın tarifi: ${description}`,
        `Hedeflenen tarz: ${style}. Bu tarzın karakteri: ${styleGuide}`,
        'Tarife göre bu alanda gerçekten eksik olan somut ürünleri öner. Genel tavsiye değil, ürün öner.',
        'Her ürün adı 2-6 kelime olsun ve malzeme/renk/form içersin, ör: "Açık ahşap ayaklı tripod lambader".',
        `Zaten listede olanları tekrar etme: ${JSON.stringify(existingNames)}`,
        'Mobilya, aydınlatma, tekstil (halı/perde/kırlent), duvar sanatı, bitki, depolama kategorilerinden 5-8 öneri ver.',
        'Sadece geçerli JSON dizisi döndür, başka hiçbir metin yazma:',
        `[{"name":"ürün adı","room":"${room}","type":"Alınacak","priority":2,"reason":"fotoğrafta neyi çözdüğü, max 15 kelime","category":"Aydınlatma|Mobilya|Tekstil|Dekor|Bitki|Depolama"}]`
      ].join('\n');

      const raw = await requestNvidiaChat({
        prompt,
        model: process.env.NVIDIA_TEXT_MODEL || DEFAULT_TEXT_MODEL,
        maxTokens: 1600
      });

      const cleaned = normalizePhotoResponse(parseJsonResponse(raw))
        .filter((item) => item && item.name)
        .map((item) => ({
          name: String(item.name),
          room: String(item.room || room),
          type: String(item.type || 'Alınacak'),
          priority: Number(item.priority) || 3,
          reason: String(item.reason || `${style} tarzına uygun bir ekleme.`),
          category: String(item.category || 'Dekor'),
          style
        }));

      if (cleaned.length > 0) {
        suggestions = cleaned;
        source = 'nvidia';
      } else {
        notice = 'Model geçerli bir öneri listesi döndürmedi, örnek öneriler gösteriliyor.';
        console.error('[ai/photo] unparsable model response', String(raw).slice(0, 400));
      }
    } catch (error) {
      console.error('[ai/photo] nvidia error', error?.status, error?.message, String(error?.payload || '').slice(0, 400));
      if (error?.status === 429) {
        throw Object.assign(new Error('NVIDIA kota limiti doldu, biraz sonra tekrar dene.'), { status: 429 });
      }
      notice = error?.message || 'NVIDIA isteği başarısız oldu.';
      suggestions = buildFallbackPhotoSuggestions(room, existingNames, style);
    }
  }

  return { ok: true, style, source, notice, suggestions };
}
