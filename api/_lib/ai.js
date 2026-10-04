import { extractFirstJsonArray, extractFirstJsonObject } from './json.js';

const PRICE_HINTS = [
  'Günlük kullanım için uygun, temiz ve sade bir seçenek tercih et.',
  'Orta boy, kolay temizlenen bir model tercih et.',
  'Estetik görünüm ve pratik kullanım için dengeli bir seçenek seç.',
  'İhtiyacına göre kompakt ama dayanıklı tercih yap.',
  'Fonksiyonel ve modern bir model seçerek evin kullanımını kolaylaştır.'
];

export function parseJsonResponse(text) {
  return extractFirstJsonArray(text) || extractFirstJsonObject(text) || null;
}

export function buildFallbackPriceEstimate(item) {
  const base = Number(item.priority || 2) * 2000;
  const rangeMin = Math.max(1200, Math.round((base + (item.name.length * 85)) / 2));
  const rangeMax = Math.round(rangeMin * 1.65);
  const tip = PRICE_HINTS[Math.abs((item.name.length + item.room.length) % PRICE_HINTS.length)];
  return {
    id: item.id,
    range: `₺${rangeMin.toLocaleString('tr-TR')} – ₺${rangeMax.toLocaleString('tr-TR')}`,
    tip,
    when: new Date().toISOString().slice(0, 10)
  };
}

export const STYLE_GUIDES = {
  'İskandinav': 'Açık ahşap, beyaz/krem yüzeyler, sade çizgiler, bol doğal ışık, yumuşak dokuma tekstil.',
  Japandi: 'İskandinav sadeliği + Japon minimalizmi; mat siyah, bambu, kil tonları, az ama kaliteli parça.',
  Minimal: 'Az parça, nötr palet, gizli depolama, görsel gürültü yok.',
  Modern: 'Temiz geometri, metal ve cam detay, kontrastlı nötrler.',
  Bohem: 'Katmanlı tekstil, rattan, bol bitki, sıcak toprak tonları, vintage dokunuşlar.',
  Endüstriyel: 'Ham beton/tuğla, siyah metal, koyu ahşap, açıkta kablolu aydınlatma.',
  Rustik: 'Masif ahşap, el yapımı seramik, keten, sıcak ve yaşanmış doku.',
  'Mid-century': 'Konik ahşap ayaklar, hardal/petrol tonları, 50-60\'lar grafik formlar.'
};

const STYLE_FALLBACK_PRODUCTS = {
  'İskandinav': ['Açık ahşap ayaklı tripod lambader', 'Krem renkli dokuma halı', 'Huş ağacı yan sehpa'],
  Japandi: ['Mat siyah kağıt abajur', 'Düşük profilli ahşap sehpa', 'Kil tonlu seramik vazo'],
  Minimal: ['Çizgisiz beyaz duvar rafı', 'Tek parça nötr halı', 'İnce gövdeli zemin lambası'],
  Modern: ['Krom detaylı ark lambader', 'Geometrik desenli halı', 'Cam üstü metal sehpa'],
  Bohem: ['Rattan asma avize', 'Makrome duvar süsü', 'Büyük boy hasır saksı'],
  Endüstriyel: ['Siyah metal kafesli sarkıt lamba', 'Boru ayaklı ahşap raf', 'Koyu deri puf'],
  Rustik: ['Masif ahşap sehpa', 'Keten kırlent takımı', 'El yapımı seramik abajur'],
  'Mid-century': ['Konik ayaklı ahşap dolap', 'Hardal rengi tekli koltuk', 'Pirinç gövdeli masa lambası']
};

export function buildFallbackPhotoSuggestions(room, existingItems, style = 'İskandinav') {
  const existing = new Set((existingItems || []).map((item) => String(item).trim().toLowerCase()));
  const products = STYLE_FALLBACK_PRODUCTS[style] || STYLE_FALLBACK_PRODUCTS['İskandinav'];
  const suggestions = [
    ...products.map((name, index) => ({
      name,
      room,
      type: 'Alınacak',
      priority: index === 0 ? 2 : 3,
      reason: `${style} tarzına uygun bir seçim.`
    })),
    { name: `${room} için büyük yeşil bitki`, room, type: 'Alınacak', priority: 3, reason: 'Boş köşeyi doldurup alanı canlandırır.' },
    { name: 'Dekoratif ayna', room, type: 'Alınacak', priority: 2, reason: 'Alan hissini açıp ferahlatır.' },
    { name: 'Duvar tablosu', room, type: 'Alınacak', priority: 3, reason: 'Boş duvara karakter katar.' }
  ];

  return suggestions.filter((suggestion) => !existing.has(suggestion.name.trim().toLowerCase()));
}

export const DEFAULT_TEXT_MODEL = 'openai/gpt-oss-20b';
export const DEFAULT_VISION_MODEL = 'meta/llama-3.2-11b-vision-instruct';

// Inline (base64) görsel üst sınırı; bazı NVIDIA modelleri daha büyüğü için asset upload ister.
const MAX_INLINE_IMAGE_BYTES = 500_000;

function describeNvidiaError(status, payload) {
  if (status === 401 || status === 403) return 'NVIDIA_API_KEY geçersiz ya da yetkisiz.';
  if (status === 404) return 'Model bulunamadı; NVIDIA_VISION_MODEL/NVIDIA_TEXT_MODEL değerini kontrol et.';
  if (status === 429) return 'NVIDIA ücretsiz kota limiti doldu, biraz sonra tekrar dene.';
  if (status === 413) return 'Fotoğraf çok büyük, daha küçük bir görsel dene.';
  try {
    const parsed = JSON.parse(payload);
    return parsed?.detail || parsed?.message || parsed?.error?.message || `NVIDIA isteği başarısız (${status}).`;
  } catch {
    return `NVIDIA isteği başarısız (${status}).`;
  }
}

function assertInlineImage(image) {
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    throw Object.assign(new Error('Görsel data URL formatında olmalı.'), { status: 400 });
  }
  const base64 = image.slice(image.indexOf(',') + 1);
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_INLINE_IMAGE_BYTES) {
    throw Object.assign(new Error('Fotoğraf 180KB sınırını aşıyor, daha fazla sıkıştır.'), { status: 413 });
  }
  return image;
}

export function getNvidiaHeaders() {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY || ''}`
  };
}

export async function requestNvidiaChat({ prompt, model, images = [], maxTokens = 1024, timeoutMs = 90_000 }) {
  if (!process.env.NVIDIA_API_KEY) {
    throw Object.assign(new Error('NVIDIA_API_KEY tanımlı değil.'), { status: 401 });
  }

  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
  const modelName = model || process.env.NVIDIA_TEXT_MODEL || DEFAULT_TEXT_MODEL;

  const userContent = images.length > 0
    ? [
        { type: 'text', text: prompt },
        ...images.map((image) => ({ type: 'image_url', image_url: { url: assertInlineImage(image) } }))
      ]
    : prompt;

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful home design assistant. Return only valid JSON when required.'
    },
    { role: 'user', content: userContent }
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: getNvidiaHeaders(),
      body: JSON.stringify({
        model: modelName,
        temperature: 0.2,
        max_tokens: maxTokens,
        stream: false,
        messages
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('NVIDIA isteği zaman aşımına uğradı.'), { status: 504 });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();

  if (!response.ok) {
    const error = new Error(describeNvidiaError(response.status, text));
    error.status = response.status;
    error.payload = text;
    throw error;
  }

  try {
    const data = JSON.parse(text);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map((part) => part?.text || '').join('\n');
    }
  } catch {
    // Beklenmedik gövde: ham metni döndür, JSON ayıklayıcı dener.
  }

  return text;
}

export const PHOTO_DESCRIBE_PROMPT = [
  'Describe this photo for an interior designer.',
  'List in English: room type, visible furniture and objects, wall/floor/window and light conditions,',
  'empty or unfurnished areas, dominant colors. Max 120 words, plain prose, no advice.'
].join(' ');

export async function describePhoto(images) {
  return requestNvidiaChat({
    prompt: PHOTO_DESCRIBE_PROMPT,
    model: process.env.NVIDIA_VISION_MODEL || DEFAULT_VISION_MODEL,
    images,
    maxTokens: 400
  });
}
