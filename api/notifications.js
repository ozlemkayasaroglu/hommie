import { isPasswordAllowed } from './_lib/auth.js';
import { getMember } from './_lib/spaces.js';
import { listNotifications, markRead } from './_lib/notifications.js';

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
    req.on('data', (c) => {
      raw += c;
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

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const spaceId = String(req.headers['x-space-id'] || '');
  const memberId = String(req.headers['x-member-id'] || '');
  const member = spaceId && memberId ? await getMember(spaceId, memberId) : null;

  if (!member) {
    return res.status(200).json({ ok: true, notifications: [] });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, notifications: await listNotifications(member.id) });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      await markRead(member.id, body.id ? String(body.id) : null);
      return res.status(200).json({ ok: true, notifications: await listNotifications(member.id) });
    }

    return res.status(405).json({ ok: false, error: 'Bu yöntem desteklenmiyor.' });
  } catch (error) {
    console.error('[notifications] failed', req.method, error?.message);
    return res.status(400).json({ ok: false, error: error?.message || 'Bildirimler alınamadı.' });
  }
}
