import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, '..', '..');
const dataDir = path.join(repoRoot, '.data');

// Netlify Functions'ta dosya sistemi kalıcı değil: her çağrı kendi /tmp'sini
// görür. Netlify üzerinde Blobs'a, yerel geliştirmede .data klasörüne yazıyoruz.
const isNetlify = Boolean(process.env.NETLIFY || process.env.NETLIFY_LOCAL);

let blobStore = null;

async function getBlobStore() {
  if (blobStore) return blobStore;
  const { getStore } = await import('@netlify/blobs');
  blobStore = getStore({ name: 'hommie', consistency: 'strong' });
  return blobStore;
}

export async function readJson(key, fallback) {
  if (isNetlify) {
    try {
      const store = await getBlobStore();
      const value = await store.get(key, { type: 'json' });
      return value ?? fallback;
    } catch (error) {
      console.error('[store] blob read failed', key, error?.message);
      return fallback;
    }
  }

  try {
    const raw = await fs.readFile(path.join(dataDir, `${key}.json`), 'utf8');
    return JSON.parse(raw || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key, value) {
  if (isNetlify) {
    const store = await getBlobStore();
    await store.setJSON(key, value);
    return;
  }

  const file = path.join(dataDir, `${key}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}
