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

function validateDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return false;
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(dataUrl)) {
    return false;
  }
  const base64 = dataUrl.split(',')[1] || '';
  if (!base64 || base64.length === 0) return false;
  const sizeBytes = Math.round((base64.length * 3) / 4);
  return sizeBytes <= 3 * 1024 * 1024;
}

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const body = await readBody(req);
    const itemId = body.itemId || body.id;
    const dataUrl = body.dataURL || body.image;

    if (!itemId) {
      return res.status(400).json({ ok: false, error: 'Missing item id.' });
    }

    if (!validateDataUrl(dataUrl)) {
      return res.status(400).json({ ok: false, error: 'Invalid or oversized upload.' });
    }

    const spaceId = String(req.headers['x-space-id'] || '') || null;
    const existing = await findItem(String(itemId), spaceId);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'Item not found.' });
    }

    const updated = await patchItem(String(itemId), spaceId, {
      image_path: `photos/${Date.now()}-${itemId}.jpg`,
      image_url: dataUrl,
      image_credit: 'Kullanıcı yüklemesi',
      image_tried: true
    });

    return res.status(200).json({ ok: true, item: updated });
  } catch (error) {
    const message = error?.message || 'Upload failed.';
    return res.status(400).json({ ok: false, error: message });
  }
}
