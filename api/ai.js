import { readItems, writeItems } from './_lib/supabase.js';
import { isPasswordAllowed } from './_lib/auth.js';
import { buildFallbackPhotoSuggestions, buildFallbackPriceEstimate, parseJsonResponse, requestNvidiaChat } from './_lib/ai.js';
import { extractFirstJsonArray, extractFirstJsonObject } from './_lib/json.js';
import { isOfficialItem } from './_lib/validation.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Malformed JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

function normalizePriceResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

function normalizePhotoResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.suggestions)) return payload.suggestions;
  return [];
}

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const body = await readBody(req);
    const task = String(body.task || '').trim();

    if (task === 'price') {
      const ids = Array.isArray(body.ids) ? body.ids : [];
      const items = await readItems();
      const selected = items.filter((item) => ids.includes(item.id) && !isOfficialItem(item));

      let priceResults = [];

      if (process.env.NVIDIA_API_KEY) {
        try {
          const prompt = `You are a home shopping assistant in Turkish. For each item below, return a JSON array with objects: {"id":"UUID","range":"₺...","tip":"max 12 words advice","when":"YYYY-MM-DD"}. The range should be a realistic Turkish Lira estimate and clearly framed as AI estimate only. Use the exact item IDs.\n${JSON.stringify(selected.map((item) => ({ id: item.id, name: item.name, room: item.room, type: item.type, priority: item.priority })))}`;
          const raw = await requestNvidiaChat({ prompt, model: process.env.NVIDIA_TEXT_MODEL || 'meta/llama-3.3-70b-instruct' });
          const parsed = parseJsonResponse(raw);
          const data = normalizePriceResponse(parsed);
          if (Array.isArray(data) && data.length > 0) {
            priceResults = data;
          }
        } catch (error) {
          if (error?.status === 429) {
            return res.status(429).json({ ok: false, error: 'rate_limited', message: 'Bir dakika sonra tekrar dene.' });
          }
        }
      }

      if (priceResults.length === 0) {
        priceResults = selected.map((item) => buildFallbackPriceEstimate(item));
      }

      const nextItems = await readItems();
      nextItems.forEach((item) => {
        const match = priceResults.find((entry) => entry.id === item.id);
        if (match) {
          item.price = {
            range: match.range || '₺0 – ₺0',
            tip: match.tip || 'Bu bir AI tahminidir. Güncel fiyat için mağazalara bak.',
            when: match.when || new Date().toISOString().slice(0, 10)
          };
        }
      });
      await writeItems(nextItems);

      return res.status(200).json({ ok: true, items: priceResults });
    }

    if (task === 'photo') {
      const room = String(body.room || 'Genel');
      const existingNames = Array.isArray(body.existingItemNames) ? body.existingItemNames : [];
      const images = Array.isArray(body.images) ? body.images : [];

      let suggestions = buildFallbackPhotoSuggestions(room, existingNames);

      if (process.env.NVIDIA_API_KEY && images.length > 0) {
        try {
          const prompt = `You are a home styling assistant in Turkish. Compare the room photo against the existing checklist and return only a JSON array of objects: [{"name":"...","room":"${room}","type":"Alınacak","priority":2,"reason":"..."}] Use Turkish names, avoid duplicates present in this checklist: ${JSON.stringify(existingNames)}. Focus on useful missing furniture, decor, lighting, plants, rugs, art, shelving, storage, practical household upgrades. Do not include items already in the checklist. Return only JSON array.`;
          const raw = await requestNvidiaChat({
            prompt,
            model: process.env.NVIDIA_VISION_MODEL || 'meta/llama-3.2-90b-vision-instruct',
            images
          });
          const parsed = parseJsonResponse(raw);
          const extracted = normalizePhotoResponse(parsed);
          if (Array.isArray(extracted) && extracted.length > 0) {
            suggestions = extracted.filter((item) => item && item.name && item.room).map((item) => ({
              name: String(item.name),
              room: String(item.room || room),
              type: String(item.type || 'Alınacak'),
              priority: Number(item.priority) || 3,
              reason: String(item.reason || 'Bu alan için faydalı bir ekleme.')
            }));
          }
        } catch (error) {
          if (error?.status === 429) {
            return res.status(429).json({ ok: false, error: 'rate_limited', message: 'Bir dakika sonra tekrar dene.' });
          }
          suggestions = buildFallbackPhotoSuggestions(room, existingNames);
        }
      }

      return res.status(200).json({ ok: true, suggestions });
    }

    return res.status(400).json({ ok: false, error: 'Unsupported AI task.' });
  } catch (error) {
    const message = error?.message || 'Unexpected AI error.';
    return res.status(400).json({ ok: false, error: message });
  }
}
