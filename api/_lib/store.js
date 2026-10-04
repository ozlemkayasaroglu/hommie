import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, '..', '..');
const dataDir = path.join(repoRoot, '.data');

// Netlify Functions'ta dosya sistemi yazılabilir değil ve kalıcı da olmaz;
// orada Blobs'a, yerel geliştirmede .data klasörüne yazıyoruz.
// Dikkat: NETLIFY değişkeni yalnızca build sırasında tanımlı, fonksiyon
// çalışırken değil — çalışma zamanını Lambda değişkenlerinden anlıyoruz.
const isNetlify = Boolean(
  process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY_BLOBS_CONTEXT ||
    process.env.NETLIFY_DEV
);

let blobStore = null;

async function getBlobStore() {
  if (blobStore) return blobStore;
  try {
    const { getStore } = await import('@netlify/blobs');
    blobStore = getStore({ name: 'hommie', consistency: 'strong' });
  } catch (error) {
    console.error('[store] blob store unavailable', error?.name, error?.message);
    throw new Error(`Depolama açılamadı: ${error?.message || 'bilinmeyen hata'}`);
  }
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
    try {
      await store.setJSON(key, value);
    } catch (error) {
      console.error('[store] blob write failed', key, error?.name, error?.message);
      throw new Error(`Kayıt yazılamadı: ${error?.message || 'bilinmeyen hata'}`);
    }
    return;
  }

  const file = path.join(dataDir, `${key}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}
