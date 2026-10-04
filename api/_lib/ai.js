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

export function buildFallbackPhotoSuggestions(room, existingItems) {
  const existing = new Set((existingItems || []).map((item) => String(item).trim().toLowerCase()));
  const suggestions = [
    { name: `${room} için büyük bir bitki`, room, type: 'Alınacak', priority: 3, reason: 'Boş köşe için büyük bir bitki alanı tamamlar.' },
    { name: 'Modern dekoratif ayna', room, type: 'Alınacak', priority: 2, reason: 'Alan hissini açıp ferahlatır.' },
    { name: 'Duygusal duvar sanatı', room, type: 'Alınacak', priority: 3, reason: 'Duvarı kişiselleştirir ve sıcaklık katar.' },
    { name: 'Şık bir halı', room, type: 'Alınacak', priority: 2, reason: 'Odaya konfor ve sıcaklık katar.' },
    { name: 'Dekoratif raf', room, type: 'Alınacak', priority: 3, reason: 'Eşyaları düzenli tutar ve stil kazandırır.' },
    { name: 'Yumuşak bir lamba', room, type: 'Alınacak', priority: 2, reason: 'Işığı daha sıcak ve davetkâr hale getirir.' }
  ];

  return suggestions.filter((suggestion) => !existing.has(suggestion.name.trim().toLowerCase()));
}

export function getNvidiaHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY || ''}`
  };
}

export async function requestNvidiaChat({ prompt, model, images = [] }) {
  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
  const modelName = model || process.env.NVIDIA_TEXT_MODEL || 'meta/llama-3.3-70b-instruct';

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful home design assistant. Return only valid JSON when required.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  if (images.length > 0) {
    messages[1].content = [
      { type: 'text', text: prompt },
      ...images.map((image) => ({
        type: 'image_url',
        image_url: { url: image }
      }))
    ];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: getNvidiaHeaders(),
    body: JSON.stringify({
      model: modelName,
      temperature: 0.2,
      messages
    })
  });

  const text = await response.text();

  if (!response.ok) {
    const error = new Error(`NVIDIA request failed: ${response.status}`);
    error.status = response.status;
    error.payload = text;
    throw error;
  }

  return text;
}
