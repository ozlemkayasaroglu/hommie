import { readItems, writeItems, createItemRecord } from './_lib/items-store.js';
import { isPasswordAllowed } from './_lib/auth.js';
import { validateCreatePayload, validatePatchPayload, createSortComparator } from './_lib/validation.js';
import { getMember } from './_lib/spaces.js';

// Alan bağlamı: istek bir alana üyeyse öğeler o alanla sınırlanır.
// Henüz alanı olmayan kurulumlarda (eski kayıtlar) space_id boş kalır.
async function resolveSpace(req) {
  const spaceId = String(req.headers['x-space-id'] || '');
  const memberId = String(req.headers['x-member-id'] || '');
  if (!spaceId || !memberId) return null;
  const member = await getMember(spaceId, memberId);
  return member ? spaceId : null;
}

function belongsToSpace(item, spaceId) {
  if (!spaceId) return !item.space_id;
  return item.space_id === spaceId;
}

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

function jsonResponse(res, status, payload) {
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return jsonResponse(res, 401, { ok: false, error: 'unauthorized' });
  }

  try {
    const spaceId = await resolveSpace(req);

    if (req.method === 'GET') {
      const items = (await readItems())
        .filter((item) => belongsToSpace(item, spaceId))
        .sort(createSortComparator());
      return jsonResponse(res, 200, { ok: true, items });
    }

    if (req.method === 'POST') {
      const payload = await readBody(req);
      const validated = validateCreatePayload(payload);
      const items = await readItems();
      const item = createItemRecord({
        ...validated,
        space_id: spaceId,
        priority: Number(validated.priority),
        status: validated.status,
        note: validated.note || '',
        image_url: null,
        image_path: null,
        image_credit: null,
        image_tried: false,
        price: validated.price ?? null
      });
      items.push(item);
      await writeItems(items);
      return jsonResponse(res, 201, { ok: true, item });
    }

    if (req.method === 'PATCH') {
      const { id } = req.query || {};
      if (!id) {
        return jsonResponse(res, 400, { ok: false, error: 'Missing item id.' });
      }

      const payload = await readBody(req);
      const validated = validatePatchPayload(payload);
      const items = await readItems();
      const targetId = String(id);
      const index = items.findIndex(
        (item) => String(item.id) === targetId && belongsToSpace(item, spaceId)
      );
      if (index === -1) {
        return jsonResponse(res, 404, { ok: false, error: 'Item not found.' });
      }

      const updated = { ...items[index], ...validated };
      items[index] = updated;
      await writeItems(items);
      return jsonResponse(res, 200, { ok: true, item: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) {
        return jsonResponse(res, 400, { ok: false, error: 'Missing item id.' });
      }

      const items = await readItems();
      const next = items.filter(
        (item) => !(String(item.id) === String(id) && belongsToSpace(item, spaceId))
      );
      if (next.length === items.length) {
        return jsonResponse(res, 404, { ok: false, error: 'Item not found.' });
      }

      await writeItems(next);
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { ok: false, error: 'Method not allowed.' });
  } catch (error) {
    const message = error?.message || 'Unexpected server error.';
    return jsonResponse(res, 400, { ok: false, error: message });
  }
}
