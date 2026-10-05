import { randomUUID } from 'node:crypto';
import { isDbEnabled, sqlReady } from './db.js';
import { readJson, writeJson } from './store.js';
import { normalizeStatus } from './validation.js';

const ITEMS_KEY = 'items';

export const defaultSeedItems = [];

function normalizeRow(row) {
  if (!row) return null;
  return {
    ...row,
    status: normalizeStatus(row.status),
    priority: Number(row.priority),
    image_tried: Boolean(row.image_tried),
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

export function createItemRecord(input) {
  return {
    id: randomUUID(),
    space_id: input.space_id ?? null,
    name: input.name,
    room: input.room,
    type: input.type,
    priority: Number(input.priority) || 3,
    status: normalizeStatus(input.status),
    note: input.note || '',
    price: input.price ?? null,
    image_url: input.image_url ?? null,
    image_path: input.image_path ?? null,
    image_credit: input.image_credit ?? null,
    image_tried: Boolean(input.image_tried),
    created_at: new Date().toISOString()
  };
}

// --- Dosya tabanlı yedek (yerel geliştirme, DATABASE_URL yokken) ---

async function fileAll() {
  const items = await readJson(ITEMS_KEY, null);
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({ ...item, status: normalizeStatus(item.status) }));
}

const inSpace = (item, spaceId) => (spaceId ? item.space_id === spaceId : !item.space_id);

// --- Ortak API ---

export async function listItems(spaceId) {
  if (!isDbEnabled()) {
    return (await fileAll()).filter((item) => inSpace(item, spaceId));
  }
  const sql = await sqlReady();
  const rows = spaceId
    ? await sql`SELECT * FROM items WHERE space_id = ${spaceId} ORDER BY created_at DESC`
    : await sql`SELECT * FROM items WHERE space_id IS NULL ORDER BY created_at DESC`;
  return rows.map(normalizeRow);
}

export async function findItem(id, spaceId) {
  if (!isDbEnabled()) {
    return (await fileAll()).find((item) => String(item.id) === String(id) && inSpace(item, spaceId)) || null;
  }
  const sql = await sqlReady();
  const rows = spaceId
    ? await sql`SELECT * FROM items WHERE id = ${id} AND space_id = ${spaceId}`
    : await sql`SELECT * FROM items WHERE id = ${id} AND space_id IS NULL`;
  return normalizeRow(rows[0]);
}

export async function insertItems(records) {
  if (records.length === 0) return [];
  if (!isDbEnabled()) {
    const items = await fileAll();
    await writeJson(ITEMS_KEY, [...items, ...records]);
    return records;
  }
  const sql = await sqlReady();
  for (const item of records) {
    await sql`
      INSERT INTO items (id, space_id, name, room, type, priority, status, note, price,
                         image_url, image_path, image_credit, image_tried, created_at)
      VALUES (${item.id}, ${item.space_id}, ${item.name}, ${item.room}, ${item.type},
              ${item.priority}, ${item.status}, ${item.note}, ${item.price},
              ${item.image_url}, ${item.image_path}, ${item.image_credit},
              ${item.image_tried}, ${item.created_at})
    `;
  }
  return records;
}

export async function patchItem(id, spaceId, patch) {
  const current = await findItem(id, spaceId);
  if (!current) return null;
  const next = { ...current, ...patch };

  if (!isDbEnabled()) {
    const items = await fileAll();
    const index = items.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return null;
    items[index] = next;
    await writeJson(ITEMS_KEY, items);
    return next;
  }

  const sql = await sqlReady();
  const rows = await sql`
    UPDATE items SET
      name = ${next.name},
      room = ${next.room},
      type = ${next.type},
      priority = ${Number(next.priority) || 3},
      status = ${next.status},
      note = ${next.note || ''},
      price = ${next.price ?? null},
      image_url = ${next.image_url ?? null},
      image_path = ${next.image_path ?? null},
      image_credit = ${next.image_credit ?? null},
      image_tried = ${Boolean(next.image_tried)}
    WHERE id = ${id}
    RETURNING *
  `;
  return normalizeRow(rows[0]);
}

export async function removeItem(id, spaceId) {
  if (!isDbEnabled()) {
    const items = await fileAll();
    const next = items.filter((item) => !(String(item.id) === String(id) && inSpace(item, spaceId)));
    if (next.length === items.length) return false;
    await writeJson(ITEMS_KEY, next);
    return true;
  }
  const sql = await sqlReady();
  const rows = spaceId
    ? await sql`DELETE FROM items WHERE id = ${id} AND space_id = ${spaceId} RETURNING id`
    : await sql`DELETE FROM items WHERE id = ${id} AND space_id IS NULL RETURNING id`;
  return rows.length > 0;
}

export async function adoptOrphanItems(spaceId) {
  if (!isDbEnabled()) {
    const items = await fileAll();
    let touched = false;
    items.forEach((item) => {
      if (!item.space_id) {
        item.space_id = spaceId;
        touched = true;
      }
    });
    if (touched) await writeJson(ITEMS_KEY, items);
    return;
  }
  const sql = await sqlReady();
  await sql`UPDATE items SET space_id = ${spaceId} WHERE space_id IS NULL`;
}

export async function deleteItemsBySpace(spaceId) {
  if (!isDbEnabled()) {
    const items = await fileAll();
    const next = items.filter((item) => item.space_id !== spaceId);
    if (next.length !== items.length) await writeJson(ITEMS_KEY, next);
    return;
  }
  const sql = await sqlReady();
  await sql`DELETE FROM items WHERE space_id = ${spaceId}`;
}
