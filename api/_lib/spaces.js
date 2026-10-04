import { randomUUID } from 'node:crypto';
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

function generateInviteCode(existing) {
  const taken = new Set(existing.map((space) => space.invite_code));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!taken.has(code)) return code;
  }
  return randomUUID().slice(0, CODE_LENGTH).toUpperCase();
}

function cleanName(value, max, fallback) {
  const trimmed = String(value || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
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
  const store = await readStore();
  const space = {
    id: randomUUID(),
    name: cleanName(spaceName, SPACE_NAME_MAX, 'Evim'),
    invite_code: generateInviteCode(store.spaces),
    created_at: new Date().toISOString()
  };
  const member = {
    id: randomUUID(),
    space_id: space.id,
    name: cleanName(memberName, MEMBER_NAME_MAX, 'Ev sahibi'),
    role: 'sahip',
    joined_at: new Date().toISOString()
  };

  store.spaces.push(space);
  store.members.push(member);
  await writeStore(store);
  return { space, member };
}

export async function joinSpace({ code, memberName }) {
  const store = await readStore();
  const normalized = normalizeCode(code);
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

export async function getSpace(spaceId) {
  const store = await readStore();
  return store.spaces.find((space) => space.id === spaceId) || null;
}

export async function getMember(spaceId, memberId) {
  const store = await readStore();
  return store.members.find((member) => member.id === memberId && member.space_id === spaceId) || null;
}

export async function listMembers(spaceId) {
  const store = await readStore();
  return store.members
    .filter((member) => member.space_id === spaceId)
    .sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at));
}

export async function renameSpace(spaceId, name) {
  const store = await readStore();
  const space = store.spaces.find((entry) => entry.id === spaceId);
  if (!space) return null;
  space.name = cleanName(name, SPACE_NAME_MAX, space.name);
  await writeStore(store);
  return space;
}

export async function removeMember(spaceId, memberId) {
  const store = await readStore();
  const before = store.members.length;
  store.members = store.members.filter(
    (member) => !(member.id === memberId && member.space_id === spaceId)
  );
  if (store.members.length === before) return false;
  await writeStore(store);
  return true;
}

export async function hasAnySpace() {
  const store = await readStore();
  return store.spaces.length > 0;
}
