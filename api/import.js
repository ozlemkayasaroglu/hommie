import { isPasswordAllowed } from './_lib/auth.js';
import { listItems, insertItems, createItemRecord } from './_lib/items-store.js';
import { getMember } from './_lib/spaces.js';
import { parseSheet } from './_lib/sheet.js';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 500;

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
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Dosya okunamadı.'));
      }
    });
    req.on('error', reject);
  });
}

async function resolveSpace(req) {
  const spaceId = String(req.headers['x-space-id'] || '');
  const memberId = String(req.headers['x-member-id'] || '');
  if (!spaceId || !memberId) return null;
  const member = await getMember(spaceId, memberId);
  return member ? spaceId : null;
}

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Bu yöntem desteklenmiyor.' });
  }

  try {
    const body = await readBody(req);
    const base64 = String(body.file || '').split(',').pop() || '';
    if (!base64) {
      return res.status(400).json({ ok: false, error: 'Dosya gelmedi.' });
    }

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_FILE_BYTES) {
      return res.status(413).json({ ok: false, error: 'Dosya çok büyük (en fazla 4 MB).' });
    }

    const parsed = parseSheet(buffer);
    if (parsed.items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Dosyada liste bulunamadı. Sütun başlıkları Oda, Kalem, Tür, Öncelik, Durum olmalı.'
      });
    }

    const spaceId = await resolveSpace(req);
    const items = await listItems(spaceId);
    const existing = new Set(
      items.map((item) => String(item.name).trim().toLocaleLowerCase('tr-TR'))
    );

    const created = [];
    let duplicates = 0;

    for (const row of parsed.items.slice(0, MAX_ROWS)) {
      const key = row.name.trim().toLocaleLowerCase('tr-TR');
      if (existing.has(key)) {
        duplicates += 1;
        continue;
      }
      existing.add(key);
      created.push(
        createItemRecord({
          ...row,
          space_id: spaceId,
          price: null,
          image_url: null,
          image_path: null,
          image_credit: null,
          image_tried: false
        })
      );
    }

    if (created.length > 0) {
      await insertItems(created);
    }

    return res.status(200).json({
      ok: true,
      added: created.length,
      duplicates,
      total: parsed.items.length
    });
  } catch (error) {
    console.error('[import] failed', error?.name, error?.message);
    return res.status(400).json({ ok: false, error: error?.message || 'Dosya işlenemedi.' });
  }
}
