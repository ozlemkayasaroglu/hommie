import { randomUUID } from 'node:crypto';
import { isDbEnabled, sqlReady } from './db.js';
import { readJson, writeJson } from './store.js';

const SPACES_KEY = 'spaces';

// Okunurken karışabilecek harf/rakamlar (0/O, 1/I) dışarıda bırakıldı.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export const SPACE_NAME_MAX = 40;
export const MEMBER_NAME_MAX = 30;
export const SOFT_DELETE_DAYS = 30;
const RECOVERY_LENGTH = 10;

async function readStore() {
  const store = await readJson(SPACES_KEY, null);
  return {
    spaces: Array.isArray(store?.spaces) ? store.spaces : [],
    members: Array.isArray(store?.members) ? store.members : []
  };
}

async function writeStore(store) {
  await writeJson(SPACES_KEY, store);
}

export function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function randomCode(length = CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// Cihaz değiştiğinde ya da tarayıcı verisi silindiğinde aynı üye olarak geri
// dönebilmek için; davet kodundan ayrı ve kişiye özel.
function newRecoveryCode() {
  const raw = randomCode(RECOVERY_LENGTH);
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

function isDeleted(space) {
  return Boolean(space?.deleted_at);
}

function cleanName(value, max, fallback) {
  const trimmed = String(value || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

function normalizeRow(row) {
  if (!row) return null;
  const out = { ...row };
  ['created_at', 'joined_at'].forEach((key) => {
    if (out[key] instanceof Date) out[key] = out[key].toISOString();
  });
  return out;
}

export function publicSpace(space) {
  if (!space) return null;
  return {
    id: space.id,
    name: space.name,
    invite_code: space.invite_code,
    created_at: space.created_at
  };
}

export function publicMember(member) {
  if (!member) return null;
  return {
    id: member.id,
    space_id: member.space_id,
    name: member.name,
    role: member.role,
    joined_at: member.joined_at
  };
}

// Kurtarma kodu yalnızca kodun sahibine gösterilir, üye listesinde yer almaz.
export function ownMember(member) {
  if (!member) return null;
  return { ...publicMember(member), recovery_code: member.recovery_code || null };
}

export async function createSpace({ spaceName, memberName }) {
  const space = {
    id: randomUUID(),
    name: cleanName(spaceName, SPACE_NAME_MAX, 'Evim'),
    invite_code: randomCode(),
    created_at: new Date().toISOString()
  };
  const member = {
    id: randomUUID(),
    space_id: space.id,
    name: cleanName(memberName, MEMBER_NAME_MAX, 'Ev sahibi'),
    role: 'sahip',
    joined_at: new Date().toISOString(),
    recovery_code: newRecoveryCode()
  };

  if (!isDbEnabled()) {
    const store = await readStore();
    const taken = new Set(store.spaces.map((entry) => entry.invite_code));
    while (taken.has(space.invite_code)) space.invite_code = randomCode();
    store.spaces.push(space);
    store.members.push(member);
    await writeStore(store);
    return { space, member };
  }

  const sql = await sqlReady();
  // invite_code benzersiz; çakışırsa yeni kod üretip tekrar dene.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      await sql`
        INSERT INTO spaces (id, name, invite_code, created_at)
        VALUES (${space.id}, ${space.name}, ${space.invite_code}, ${space.created_at})
      `;
      break;
    } catch (error) {
      if (!String(error?.message || '').includes('duplicate key')) throw error;
      space.invite_code = randomCode();
      if (attempt === 9) throw error;
    }
  }
  await sql`
    INSERT INTO members (id, space_id, name, role, joined_at, recovery_code)
    VALUES (${member.id}, ${member.space_id}, ${member.name}, ${member.role},
            ${member.joined_at}, ${member.recovery_code})
  `;
  return { space, member };
}

export async function joinSpace({ code, memberName }) {
  const normalized = normalizeCode(code);

  if (!isDbEnabled()) {
    const store = await readStore();
    const space = store.spaces.find((entry) => entry.invite_code === normalized && !isDeleted(entry));
    if (!space) return null;
    const member = {
      id: randomUUID(),
      space_id: space.id,
      name: cleanName(memberName, MEMBER_NAME_MAX, 'Yeni üye'),
      role: 'üye',
      joined_at: new Date().toISOString(),
      recovery_code: newRecoveryCode()
    };
    store.members.push(member);
    await writeStore(store);
    return { space, member };
  }

  const sql = await sqlReady();
  const rows = await sql`
    SELECT * FROM spaces WHERE invite_code = ${normalized} AND deleted_at IS NULL
  `;
  const space = normalizeRow(rows[0]);
  if (!space) return null;

  const member = {
    id: randomUUID(),
    space_id: space.id,
    name: cleanName(memberName, MEMBER_NAME_MAX, 'Yeni üye'),
    role: 'üye',
    joined_at: new Date().toISOString(),
    recovery_code: newRecoveryCode()
  };
  await sql`
    INSERT INTO members (id, space_id, name, role, joined_at, recovery_code)
    VALUES (${member.id}, ${member.space_id}, ${member.name}, ${member.role},
            ${member.joined_at}, ${member.recovery_code})
  `;
  return { space, member };
}

export async function getSpace(spaceId) {
  if (!isDbEnabled()) {
    const store = await readStore();
    const space = store.spaces.find((entry) => entry.id === spaceId);
    return space && !isDeleted(space) ? space : null;
  }
  const sql = await sqlReady();
  const rows = await sql`SELECT * FROM spaces WHERE id = ${spaceId} AND deleted_at IS NULL`;
  return normalizeRow(rows[0]);
}

export async function getMember(spaceId, memberId) {
  if (!isDbEnabled()) {
    const store = await readStore();
    return store.members.find((m) => m.id === memberId && m.space_id === spaceId) || null;
  }
  const sql = await sqlReady();
  const rows = await sql`SELECT * FROM members WHERE id = ${memberId} AND space_id = ${spaceId}`;
  return normalizeRow(rows[0]);
}

export async function listMembers(spaceId) {
  if (!isDbEnabled()) {
    const store = await readStore();
    return store.members
      .filter((member) => member.space_id === spaceId)
      .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
  }
  const sql = await sqlReady();
  const rows = await sql`SELECT * FROM members WHERE space_id = ${spaceId} ORDER BY joined_at ASC`;
  return rows.map(normalizeRow);
}

export async function renameSpace(spaceId, name) {
  if (!isDbEnabled()) {
    const store = await readStore();
    const space = store.spaces.find((entry) => entry.id === spaceId);
    if (!space) return null;
    space.name = cleanName(name, SPACE_NAME_MAX, space.name);
    await writeStore(store);
    return space;
  }
  const current = await getSpace(spaceId);
  if (!current) return null;
  const sql = await sqlReady();
  const rows = await sql`
    UPDATE spaces SET name = ${cleanName(name, SPACE_NAME_MAX, current.name)}
    WHERE id = ${spaceId} RETURNING *
  `;
  return normalizeRow(rows[0]);
}

export async function removeMember(spaceId, memberId) {
  if (!isDbEnabled()) {
    const store = await readStore();
    const before = store.members.length;
    store.members = store.members.filter((m) => !(m.id === memberId && m.space_id === spaceId));
    if (store.members.length === before) return false;
    await writeStore(store);
    return true;
  }
  const sql = await sqlReady();
  const rows = await sql`
    DELETE FROM members WHERE id = ${memberId} AND space_id = ${spaceId} RETURNING id
  `;
  return rows.length > 0;
}

export async function deleteSpace(spaceId) {
  if (!isDbEnabled()) {
    const store = await readStore();
    store.spaces = store.spaces.filter((space) => space.id !== spaceId);
    store.members = store.members.filter((member) => member.space_id !== spaceId);
    await writeStore(store);
    return;
  }
  const sql = await sqlReady();
  await sql`DELETE FROM spaces WHERE id = ${spaceId}`;
}

export async function recoverMember(recoveryCode) {
  const normalized = String(recoveryCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length < 6) return null;
  const formatted = `${normalized.slice(0, 5)}-${normalized.slice(5)}`;

  if (!isDbEnabled()) {
    const store = await readStore();
    const member = store.members.find(
      (entry) => String(entry.recovery_code || '').toUpperCase() === formatted
    );
    if (!member) return null;
    const space = store.spaces.find((entry) => entry.id === member.space_id);
    if (!space || isDeleted(space)) return null;
    return { space, member };
  }

  const sql = await sqlReady();
  const rows = await sql`
    SELECT m.*, s.name AS space_name, s.invite_code, s.created_at AS space_created_at
    FROM members m
    JOIN spaces s ON s.id = m.space_id
    WHERE m.recovery_code = ${formatted} AND s.deleted_at IS NULL
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    space: normalizeRow({
      id: row.space_id,
      name: row.space_name,
      invite_code: row.invite_code,
      created_at: row.space_created_at
    }),
    member: normalizeRow({
      id: row.id,
      space_id: row.space_id,
      name: row.name,
      role: row.role,
      joined_at: row.joined_at,
      recovery_code: row.recovery_code
    })
  };
}

export async function rotateInviteCode(spaceId) {
  if (!isDbEnabled()) {
    const store = await readStore();
    const space = store.spaces.find((entry) => entry.id === spaceId);
    if (!space) return null;
    const taken = new Set(store.spaces.map((entry) => entry.invite_code));
    let next = randomCode();
    while (taken.has(next)) next = randomCode();
    space.invite_code = next;
    await writeStore(store);
    return space;
  }

  const sql = await sqlReady();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const rows = await sql`
        UPDATE spaces SET invite_code = ${randomCode()} WHERE id = ${spaceId} RETURNING *
      `;
      return normalizeRow(rows[0]);
    } catch (error) {
      if (!String(error?.message || '').includes('duplicate key')) throw error;
    }
  }
  throw new Error('Yeni davet kodu üretilemedi, tekrar dene.');
}

// Alanı hemen yok etmek yerine işaretliyoruz; saklama süresi dolunca
// veritabanı tarafında siliniyor. Bu süre içinde kurtarma kodu da çalışmaz,
// ama veri geri getirilebilir durumda kalır.
export async function softDeleteSpace(spaceId) {
  const when = new Date().toISOString();
  if (!isDbEnabled()) {
    const store = await readStore();
    const space = store.spaces.find((entry) => entry.id === spaceId);
    if (space) space.deleted_at = when;
    await writeStore(store);
    return;
  }
  const sql = await sqlReady();
  await sql`UPDATE spaces SET deleted_at = ${when} WHERE id = ${spaceId}`;
}
