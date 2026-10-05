import { randomUUID } from 'node:crypto';
import { isDbEnabled, sqlReady } from './db.js';
import { readJson, writeJson } from './store.js';

const SPACES_KEY = 'spaces';

// Okunurken karışabilecek harf/rakamlar (0/O, 1/I) dışarıda bırakıldı.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

export const SPACE_NAME_MAX = 40;
export const MEMBER_NAME_MAX = 30;

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

function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
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
    joined_at: new Date().toISOString()
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
    INSERT INTO members (id, space_id, name, role, joined_at)
    VALUES (${member.id}, ${member.space_id}, ${member.name}, ${member.role}, ${member.joined_at})
  `;
  return { space, member };
}

export async function joinSpace({ code, memberName }) {
  const normalized = normalizeCode(code);

  if (!isDbEnabled()) {
    const store = await readStore();
    const space = store.spaces.find((entry) => entry.invite_code === normalized);
    if (!space) return null;
    const member = {
      id: randomUUID(),
      space_id: space.id,
      name: cleanName(memberName, MEMBER_NAME_MAX, 'Yeni üye'),
      role: 'üye',
      joined_at: new Date().toISOString()
    };
    store.members.push(member);
    await writeStore(store);
    return { space, member };
  }

  const sql = await sqlReady();
  const rows = await sql`SELECT * FROM spaces WHERE invite_code = ${normalized}`;
  const space = normalizeRow(rows[0]);
  if (!space) return null;

  const member = {
    id: randomUUID(),
    space_id: space.id,
    name: cleanName(memberName, MEMBER_NAME_MAX, 'Yeni üye'),
    role: 'üye',
    joined_at: new Date().toISOString()
  };
  await sql`
    INSERT INTO members (id, space_id, name, role, joined_at)
    VALUES (${member.id}, ${member.space_id}, ${member.name}, ${member.role}, ${member.joined_at})
  `;
  return { space, member };
}

export async function getSpace(spaceId) {
  if (!isDbEnabled()) {
    const store = await readStore();
    return store.spaces.find((space) => space.id === spaceId) || null;
  }
  const sql = await sqlReady();
  const rows = await sql`SELECT * FROM spaces WHERE id = ${spaceId}`;
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
