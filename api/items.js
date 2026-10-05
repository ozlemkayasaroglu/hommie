import {
  listItems,
  findItem,
  insertItems,
  patchItem,
  removeItem,
  createItemRecord
} from './_lib/items-store.js';
import { isPasswordAllowed } from './_lib/auth.js';
import { validateCreatePayload, validatePatchPayload, createSortComparator } from './_lib/validation.js';
import { getMember } from './_lib/spaces.js';

// Alan bağlamı: istek bir alana üyeyse öğeler o alanla sınırlanır.
async function resolveSpace(req) {
  const spaceId = String(req.headers['x-space-id'] || '');
  const memberId = String(req.headers['x-member-id'] || '');
  if (!spaceId || !memberId) return null;
  const member = await getMember(spaceId, memberId);
  return member ? spaceId : null;
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
      const items = (await listItems(spaceId)).sort(createSortComparator());
      return jsonResponse(res, 200, { ok: true, items });
    }

    if (req.method === 'POST') {
      const payload = await readBody(req);
      const validated = validateCreatePayload(payload);
      const item = createItemRecord({
        ...validated,
        space_id: spaceId,
        priority: Number(validated.priority),
        note: validated.note || '',
        price: validated.price ?? null
      });
      await insertItems([item]);
      return jsonResponse(res, 201, { ok: true, item });
    }

    if (req.method === 'PATCH') {
      const { id } = req.query || {};
      if (!id) {
        return jsonResponse(res, 400, { ok: false, error: 'Missing item id.' });
      }

      const payload = await readBody(req);
      const validated = validatePatchPayload(payload);
      const updated = await patchItem(String(id), spaceId, validated);
      if (!updated) {
        return jsonResponse(res, 404, { ok: false, error: 'Item not found.' });
      }
      return jsonResponse(res, 200, { ok: true, item: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) {
        return jsonResponse(res, 400, { ok: false, error: 'Missing item id.' });
      }

      const existing = await findItem(String(id), spaceId);
      if (!existing) {
        return jsonResponse(res, 404, { ok: false, error: 'Item not found.' });
      }

      await removeItem(String(id), spaceId);
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { ok: false, error: 'Method not allowed.' });
  } catch (error) {
    console.error('[items] failed', req.method, error?.message);
    const message = error?.message || 'Unexpected server error.';
    return jsonResponse(res, 400, { ok: false, error: message });
  }
}
