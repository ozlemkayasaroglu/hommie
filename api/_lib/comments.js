import { randomUUID } from 'node:crypto';
import { isDbEnabled, sqlReady } from './db.js';
import { readJson, writeJson } from './store.js';

const COMMENTS_KEY = 'comments';

export const COMMENT_MAX = 1000;

function normalizeRow(row) {
  if (!row) return null;
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

async function fileAll() {
  const rows = await readJson(COMMENTS_KEY, null);
  return Array.isArray(rows) ? rows : [];
}

const inSpace = (row, spaceId) => (spaceId ? row.space_id === spaceId : !row.space_id);

export function buildComment({ itemId, spaceId, member, text }) {
  return {
    id: randomUUID(),
    item_id: itemId,
    space_id: spaceId || null,
    member_id: member?.id || null,
    member_name: member?.name || 'Biri',
    text: String(text).trim().slice(0, COMMENT_MAX),
    created_at: new Date().toISOString()
  };
}

export async function listComments(spaceId) {
  if (!isDbEnabled()) {
    return (await fileAll())
      .filter((row) => inSpace(row, spaceId))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  const sql = await sqlReady();
  const rows = spaceId
    ? await sql`SELECT * FROM comments WHERE space_id = ${spaceId} ORDER BY created_at ASC`
    : await sql`SELECT * FROM comments WHERE space_id IS NULL ORDER BY created_at ASC`;
  return rows.map(normalizeRow);
}

export async function insertComment(comment) {
  if (!isDbEnabled()) {
    const rows = await fileAll();
    await writeJson(COMMENTS_KEY, [...rows, comment]);
    return comment;
  }
  const sql = await sqlReady();
  await sql`
    INSERT INTO comments (id, item_id, space_id, member_id, member_name, text, created_at)
    VALUES (${comment.id}, ${comment.item_id}, ${comment.space_id}, ${comment.member_id},
            ${comment.member_name}, ${comment.text}, ${comment.created_at})
  `;
  return comment;
}

export async function findComment(id, spaceId) {
  if (!isDbEnabled()) {
    return (await fileAll()).find((row) => row.id === id && inSpace(row, spaceId)) || null;
  }
  const sql = await sqlReady();
  const rows = spaceId
    ? await sql`SELECT * FROM comments WHERE id = ${id} AND space_id = ${spaceId}`
    : await sql`SELECT * FROM comments WHERE id = ${id} AND space_id IS NULL`;
  return normalizeRow(rows[0]);
}

export async function removeComment(id, spaceId) {
  if (!isDbEnabled()) {
    const rows = await fileAll();
    const next = rows.filter((row) => !(row.id === id && inSpace(row, spaceId)));
    if (next.length === rows.length) return false;
    await writeJson(COMMENTS_KEY, next);
    return true;
  }
  const sql = await sqlReady();
  const rows = spaceId
    ? await sql`DELETE FROM comments WHERE id = ${id} AND space_id = ${spaceId} RETURNING id`
    : await sql`DELETE FROM comments WHERE id = ${id} AND space_id IS NULL RETURNING id`;
  return rows.length > 0;
}
