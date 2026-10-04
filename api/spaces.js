import { isPasswordAllowed } from './_lib/auth.js';
import {
  createSpace,
  joinSpace,
  getSpace,
  getMember,
  listMembers,
  renameSpace,
  removeMember,
  publicSpace,
  publicMember
} from './_lib/spaces.js';
import { readItems, writeItems } from './_lib/items-store.js';

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
        reject(new Error('Gönderilen veri okunamadı.'));
      }
    });
    req.on('error', reject);
  });
}

// İlk alan açıldığında, alan kavramından önce eklenmiş öğeler sahipsiz kalmasın.
async function adoptOrphanItems(spaceId) {
  const items = await readItems();
  const orphans = items.filter((item) => !item.space_id);
  if (orphans.length === 0) return;
  orphans.forEach((item) => {
    item.space_id = spaceId;
  });
  await writeItems(items);
}

async function requireMembership(req) {
  const spaceId = String(req.headers['x-space-id'] || '');
  const memberId = String(req.headers['x-member-id'] || '');
  if (!spaceId || !memberId) return null;
  const member = await getMember(spaceId, memberId);
  if (!member) return null;
  const space = await getSpace(spaceId);
  if (!space) return null;
  return { space, member };
}

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    if (req.method === 'POST') {
      const body = await readBody(req);
      const action = String(body.action || '').trim();

      if (action === 'create') {
        const created = await createSpace({ spaceName: body.spaceName, memberName: body.memberName });
        const isFirstSpace = (await listMembers(created.space.id)).length === 1;
        if (isFirstSpace) await adoptOrphanItems(created.space.id);
        return res.status(201).json({
          ok: true,
          space: publicSpace(created.space),
          member: publicMember(created.member),
          members: (await listMembers(created.space.id)).map(publicMember)
        });
      }

      if (action === 'join') {
        const joined = await joinSpace({ code: body.code, memberName: body.memberName });
        if (!joined) {
          return res.status(404).json({ ok: false, error: 'Bu davet kodu geçerli değil.' });
        }
        return res.status(200).json({
          ok: true,
          space: publicSpace(joined.space),
          member: publicMember(joined.member),
          members: (await listMembers(joined.space.id)).map(publicMember)
        });
      }

      return res.status(400).json({ ok: false, error: 'Bilinmeyen işlem.' });
    }

    const context = await requireMembership(req);
    if (!context) {
      return res.status(403).json({ ok: false, error: 'Bu alana erişimin yok.' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        space: publicSpace(context.space),
        member: publicMember(context.member),
        members: (await listMembers(context.space.id)).map(publicMember)
      });
    }

    if (req.method === 'PATCH') {
      if (context.member.role !== 'sahip') {
        return res.status(403).json({ ok: false, error: 'Alanı yalnızca kuran kişi yeniden adlandırabilir.' });
      }
      const body = await readBody(req);
      const updated = await renameSpace(context.space.id, body.name);
      return res.status(200).json({ ok: true, space: publicSpace(updated) });
    }

    if (req.method === 'DELETE') {
      const targetId = String(req.query?.memberId || context.member.id);
      const isSelf = targetId === context.member.id;
      if (!isSelf && context.member.role !== 'sahip') {
        return res.status(403).json({ ok: false, error: 'Üyeleri yalnızca alanı kuran kişi çıkarabilir.' });
      }

      const members = await listMembers(context.space.id);
      const target = members.find((member) => member.id === targetId);
      if (!target) {
        return res.status(404).json({ ok: false, error: 'Üye bulunamadı.' });
      }
      if (target.role === 'sahip' && members.length > 1) {
        return res.status(400).json({
          ok: false,
          error: 'Alanı kuran kişi, başka üyeler varken ayrılamaz.'
        });
      }

      await removeMember(context.space.id, targetId);
      return res.status(200).json({ ok: true, left: isSelf });
    }

    return res.status(405).json({ ok: false, error: 'Bu yöntem desteklenmiyor.' });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error?.message || 'Beklenmeyen bir hata oluştu.' });
  }
}
