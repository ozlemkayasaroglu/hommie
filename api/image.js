import { findItem, patchItem } from './_lib/items-store.js';
import { isPasswordAllowed } from './_lib/auth.js';

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

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const body = await readBody(req);
    const itemId = body.id || body.itemId;
    const itemName = String(body.name || '').trim();

    if (!itemId || !itemName) {
      return res.status(400).json({ ok: false, error: 'Missing item id or name.' });
    }

    const spaceId = String(req.headers['x-space-id'] || '') || null;
    const existing = await findItem(String(itemId), spaceId);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Item not found.' });
    }

    const markTried = (extra = {}) => patchItem(String(itemId), spaceId, { image_tried: true, ...extra });

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      const item = await markTried();
      return res.status(200).json({ ok: true, item, fallback: true });
    }

    try {
      const query = encodeURIComponent(itemName);
      const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`, {
        headers: { Authorization: apiKey }
      });

      if (!response.ok) {
        const item = await markTried();
        return res.status(200).json({ ok: true, item, fallback: true });
      }

      const data = await response.json();
      const photo = data?.photos?.[0];
      if (!photo) {
        const item = await markTried();
        return res.status(200).json({ ok: true, item, fallback: true });
      }

      const item = await markTried({
        image_url: photo.src?.medium || photo.src?.original || null,
        image_credit: photo.photographer || 'Pexels'
      });
      return res.status(200).json({ ok: true, item });
    } catch {
      const item = await markTried();
      return res.status(200).json({ ok: true, item, fallback: true });
    }
  } catch (error) {
    const message = error?.message || 'Image lookup failed.';
    return res.status(400).json({ ok: false, error: message });
  }
}
