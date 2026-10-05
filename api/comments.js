import { isPasswordAllowed } from './_lib/auth.js';
import { getMember } from './_lib/spaces.js';
import { findItem } from './_lib/items-store.js';
import {
  listComments,
  insertComment,
  findComment,
  removeComment,
  buildComment,
  COMMENT_MAX
} from './_lib/comments.js';

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
        reject(new Error('Gönderilen veri okunamadı.'));
      }
    });
    req.on('error', reject);
  });
}

// Yorumu kimin yazdığını kaydedebilmek için üyeyi de çözüyoruz.
async function resolveContext(req) {
  const spaceId = String(req.headers['x-space-id'] || '');
  const memberId = String(req.headers['x-member-id'] || '');
  if (!spaceId || !memberId) return { spaceId: null, member: null };
  const member = await getMember(spaceId, memberId);
  return member ? { spaceId, member } : { spaceId: null, member: null };
}

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const { spaceId, member } = await resolveContext(req);

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, comments: await listComments(spaceId) });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const itemId = String(body.itemId || '').trim();
      const text = String(body.text || '').trim();

      if (!itemId) return res.status(400).json({ ok: false, error: 'Hangi kayda yazıldığı belli değil.' });
      if (!text) return res.status(400).json({ ok: false, error: 'Boş yorum gönderilemez.' });
      if (text.length > COMMENT_MAX) {
        return res.status(400).json({ ok: false, error: `Yorum en fazla ${COMMENT_MAX} karakter olabilir.` });
      }

      const item = await findItem(itemId, spaceId);
      if (!item) return res.status(404).json({ ok: false, error: 'Kayıt bulunamadı.' });

      const comment = buildComment({ itemId, spaceId, member, text });
      await insertComment(comment);
      return res.status(201).json({ ok: true, comment });
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, error: 'Yorum kimliği eksik.' });

      const comment = await findComment(id, spaceId);
      if (!comment) return res.status(404).json({ ok: false, error: 'Yorum bulunamadı.' });

      // Kendi yorumunu herkes silebilir; başkasınınkini yalnızca alanı kuran kişi.
      const isOwnComment = comment.member_id && comment.member_id === member?.id;
      if (!isOwnComment && member?.role !== 'sahip') {
        return res.status(403).json({ ok: false, error: 'Bu yorumu silemezsin.' });
      }

      await removeComment(id, spaceId);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Bu yöntem desteklenmiyor.' });
  } catch (error) {
    console.error('[comments] failed', req.method, error?.message);
    return res.status(400).json({ ok: false, error: error?.message || 'Yorum işlenemedi.' });
  }
}
