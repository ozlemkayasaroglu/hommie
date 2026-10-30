import { randomUUID } from 'node:crypto';
import { isDbEnabled, sqlReady } from './db.js';
import { readJson, writeJson } from './store.js';

const KEY = 'notifications';
const KEEP = 50;

function normalizeRow(row) {
  if (!row) return null;
  const out = { ...row };
  ['created_at', 'read_at'].forEach((k) => {
    if (out[k] instanceof Date) out[k] = out[k].toISOString();
  });
  return out;
}

async function fileAll() {
  const rows = await readJson(KEY, null);
  return Array.isArray(rows) ? rows : [];
}

export function buildNotification({ spaceId, memberId, actorName, item, comment }) {
  return {
    id: randomUUID(),
    space_id: spaceId || null,
    member_id: memberId,
    actor_name: actorName || 'Biri',
    item_id: item?.id || null,
    item_name: item?.name || '',
    comment_id: comment?.id || null,
    excerpt: String(comment?.text || '').slice(0, 140),
    read_at: null,
    created_at: new Date().toISOString()
  };
}

export async function insertNotifications(rows) {
  if (rows.length === 0) return;
  if (!isDbEnabled()) {
    const all = await fileAll();
    await writeJson(KEY, [...all, ...rows]);
    return;
  }
  const sql = await sqlReady();
  for (const n of rows) {
    await sql`
      INSERT INTO notifications (id, space_id, member_id, actor_name, item_id, item_name,
                                 comment_id, excerpt, read_at, created_at)
      VALUES (${n.id}, ${n.space_id}, ${n.member_id}, ${n.actor_name}, ${n.item_id},
              ${n.item_name}, ${n.comment_id}, ${n.excerpt}, ${n.read_at}, ${n.created_at})
    `;
  }
}

export async function listNotifications(memberId) {
  if (!memberId) return [];
  if (!isDbEnabled()) {
    return (await fileAll())
      .filter((row) => row.member_id === memberId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, KEEP);
  }
  const sql = await sqlReady();
  const rows = await sql`
    SELECT * FROM notifications WHERE member_id = ${memberId}
    ORDER BY created_at DESC LIMIT ${KEEP}
  `;
  return rows.map(normalizeRow);
}

export async function markRead(memberId, id) {
  const when = new Date().toISOString();
  if (!isDbEnabled()) {
    const all = await fileAll();
    all.forEach((row) => {
      if (row.member_id === memberId && (!id || row.id === id) && !row.read_at) row.read_at = when;
    });
    await writeJson(KEY, all);
    return;
  }
  const sql = await sqlReady();
  if (id) {
    await sql`UPDATE notifications SET read_at = ${when} WHERE member_id = ${memberId} AND id = ${id} AND read_at IS NULL`;
  } else {
    await sql`UPDATE notifications SET read_at = ${when} WHERE member_id = ${memberId} AND read_at IS NULL`;
  }
}
