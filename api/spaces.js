import { isPasswordAllowed } from './_lib/auth.js';
import {
  createSpace,
  joinSpace,
  getSpace,
  getMember,
  listMembers,
  renameSpace,
  removeMember,
  recoverMember,
  rotateInviteCode,
  softDeleteSpace,
  publicSpace,
  publicMember,
  ownMember,
  SOFT_DELETE_DAYS
} from './_lib/spaces.js';
import { adoptOrphanItems } from './_lib/items-store.js';

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
          member: ownMember(created.member),
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
          member: ownMember(joined.member),
          members: (await listMembers(joined.space.id)).map(publicMember)
        });
      }

      if (action === 'recover') {
        const recovered = await recoverMember(body.code);
        if (!recovered) {
          return res.status(404).json({ ok: false, error: 'Bu kurtarma kodu geçerli değil.' });
        }
        return res.status(200).json({
          ok: true,
          space: publicSpace(recovered.space),
          member: ownMember(recovered.member),
          members: (await listMembers(recovered.space.id)).map(publicMember)
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
        member: ownMember(context.member),
        members: (await listMembers(context.space.id)).map(publicMember)
      });
    }

    if (req.method === 'PATCH') {
      const body = await readBody(req);

      if (body.action === 'rotate-invite') {
        if (context.member.role !== 'sahip') {
          return res.status(403).json({ ok: false, error: 'Davet kodunu yalnızca alanı kuran kişi yenileyebilir.' });
        }
        const rotated = await rotateInviteCode(context.space.id);
        return res.status(200).json({ ok: true, space: publicSpace(rotated) });
      }

      if (context.member.role !== 'sahip') {
        return res.status(403).json({ ok: false, error: 'Alanı yalnızca kuran kişi yeniden adlandırabilir.' });
      }
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

      // Son üye ayrılıyorsa liste de kapanacağı için alan adının yazılarak
      // onaylanmasını istiyoruz; tek tıkla her şey silinmesin.
      const isLastMember = isSelf && members.length === 1;
      if (isLastMember) {
        const confirmName = String(req.query?.confirmName || '').trim();
        if (confirmName.toLocaleLowerCase('tr-TR') !== context.space.name.toLocaleLowerCase('tr-TR')) {
          return res.status(400).json({
            ok: false,
            error: 'confirm_required',
            spaceName: context.space.name,
            message: 'Alandan ayrılmak için alan adını yaz.'
          });
        }
      }

      await removeMember(context.space.id, targetId);

      // Son üye de ayrıldıysa alan kapanır; veri hemen silinmez, saklama
      // süresi dolunca veritabanı tarafında temizlenir.
      const remaining = await listMembers(context.space.id);
      if (remaining.length === 0) {
        await softDeleteSpace(context.space.id);
        return res.status(200).json({
          ok: true,
          left: isSelf,
          spaceClosed: true,
          retentionDays: SOFT_DELETE_DAYS
        });
      }

      return res.status(200).json({ ok: true, left: isSelf });
    }

    return res.status(405).json({ ok: false, error: 'Bu yöntem desteklenmiyor.' });
  } catch (error) {
    console.error('[spaces] failed', req.method, error?.name, error?.message, error?.stack);
    return res.status(400).json({ ok: false, error: error?.message || 'Beklenmeyen bir hata oluştu.' });
  }
}
