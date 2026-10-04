import { readItems, writeItems } from './_lib/supabase.js';
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

    const items = await readItems();
    const itemIndex = items.findIndex((item) => String(item.id) === String(itemId));
    if (itemIndex === -1) {
      return res.status(404).json({ ok: false, error: 'Item not found.' });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      items[itemIndex].image_tried = true;
      await writeItems(items);
      return res.status(200).json({ ok: true, item: items[itemIndex], fallback: true });
    }

    try {
      const query = encodeURIComponent(itemName);
      const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`, {
        headers: { Authorization: apiKey }
      });

      if (!response.ok) {
        items[itemIndex].image_tried = true;
        await writeItems(items);
        return res.status(200).json({ ok: true, item: items[itemIndex], fallback: true });
      }

      const data = await response.json();
      const photo = data?.photos?.[0];
      if (!photo) {
        items[itemIndex].image_tried = true;
        await writeItems(items);
        return res.status(200).json({ ok: true, item: items[itemIndex], fallback: true });
      }

      items[itemIndex].image_url = photo.src?.medium || photo.src?.original || null;
      items[itemIndex].image_credit = photo.photographer || 'Pexels';
      items[itemIndex].image_tried = true;
      await writeItems(items);
      return res.status(200).json({ ok: true, item: items[itemIndex] });
    } catch {
      items[itemIndex].image_tried = true;
      await writeItems(items);
      return res.status(200).json({ ok: true, item: items[itemIndex], fallback: true });
    }
  } catch (error) {
    const message = error?.message || 'Image lookup failed.';
    return res.status(400).json({ ok: false, error: message });
  }
}
