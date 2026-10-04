import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, '..', '..');
// Serverless filesystems (Vercel, Netlify, Lambda) are read-only outside
// /tmp, so the repo-local .data dir (used for local dev) isn't writable there.
const isServerless = Boolean(
  process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const dataDir = isServerless
  ? path.join(os.tmpdir(), 'hommie-data')
  : path.join(repoRoot, '.data');
const itemsFile = path.join(dataDir, 'items.json');

export const defaultSeedItems = [
  { id: 'a7e7c6aa-df04-432a-ae46-d8b18eda32a5', name: 'Elektrik aboneliği devri', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T10:00:00.000Z' },
  { id: 'a0b0cf22-9d58-4146-bac8-86f1da0575a8', name: 'Su aboneliği devri', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T11:00:00.000Z' },
  { id: '78a5de82-5034-46dc-b0f2-bd845cfbe60a', name: 'Doğalgaz aboneliği', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T12:00:00.000Z' },
  { id: '3fed64d9-dda4-4e70-81bc-528a05d78afe', name: 'İnternet bağlantısı', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T13:00:00.000Z' },
  { id: '25daee3a-5ee0-4254-929e-b141d3953318', name: 'e-Devlet adres değişikliği', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T14:00:00.000Z' },
  { id: '8d06581c-2d67-4925-b502-122a05805be6', name: 'Banka / kargo adreslerini güncelle', room: 'Genel', type: 'Resmi iş', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T15:00:00.000Z' },
  { id: '70aa1365-3815-4844-afb9-8396079c1a91', name: 'Kapı kilidini değiştir', room: 'Antre', type: 'Yapılacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T16:00:00.000Z' },
  { id: 'b9ef1426-77f9-42eb-947f-defc2d3cd152', name: 'Ampuller', room: 'Genel', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T17:00:00.000Z' },
  { id: 'd6a61983-6e50-45ca-a404-d26b86695cfe', name: 'Temizlik malzemeleri', room: 'Genel', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T18:00:00.000Z' },
  { id: '881a9a18-fdfc-4739-9385-da2cbc8f4e83', name: 'Çöp kovaları', room: 'Genel', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T19:00:00.000Z' },
  { id: '0e58f436-63ae-450d-807f-0b2663a5f7ef', name: 'İlk yardım çantası', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T20:00:00.000Z' },
  { id: '90fad0c8-33b7-4bf6-a0bf-9327f75bdea0', name: 'Alet çantası (tornavida, matkap vb.)', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T21:00:00.000Z' },
  { id: '666bf682-e356-4b07-9981-bfd8115aa583', name: 'Uzatma kabloları / priz', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T22:00:00.000Z' },
  { id: 'bc0c5104-2a67-44bb-9609-72ccd7f8789b', name: 'Perde veya geçici karartma', room: 'Yatak Odası', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T23:00:00.000Z' },
  { id: 'fc09e082-aa4c-4040-82b0-c738d634df95', name: 'Perde', room: 'Salon', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T00:00:00.000Z' },
  { id: '932943ab-5d53-4587-8613-b44cf62f3ae9', name: 'Raf / TV ünitesi montajı', room: 'Salon', type: 'Yapılacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T01:00:00.000Z' },
  { id: '3c4766ad-9ec0-4cb6-a837-056c0d33a040', name: 'Halı', room: 'Salon', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T02:00:00.000Z' },
  { id: '1d694e2a-c393-4568-9950-3abf8694cfdc', name: 'Tablolar / dekorasyon', room: 'Salon', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T03:00:00.000Z' },
  { id: '027ddc32-07aa-4812-9b75-69751e1c5104', name: 'Tencere / tava seti', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T04:00:00.000Z' },
  { id: '146ee7ea-98f1-4319-b646-ba0da16e2742', name: 'Saklama kapları', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T05:00:00.000Z' },
  { id: 'cf9bf84f-240f-49a5-9e0a-c96875957a7a', name: 'Bulaşık süngeri, kurulama bezi', room: 'Mutfak', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T06:00:00.000Z' },
  { id: '4e643b52-04a1-4861-9305-cdda52fc2c08', name: 'Duş perdesi / askı', room: 'Banyo', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T07:00:00.000Z' },
  { id: '8492b643-b38b-4572-b01b-0d86f65d1a0a', name: 'Banyo paspası, havlu askısı', room: 'Banyo', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T08:00:00.000Z' },
  { id: 'a76945d3-e136-43fa-bbc4-9ee92f5d42f9', name: 'Askılık / ayakkabılık', room: 'Antre', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T09:00:00.000Z' },
  { id: '3ba76e8b-b25e-4f03-89f8-92b05099dbc2', name: 'Kapı paspası', room: 'Antre', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T10:00:00.000Z' },
  { id: '7cd7100d-464a-4568-bb89-67fe47336cc9', name: 'Elektrikli süpürge', room: 'Genel', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T11:00:00.000Z' },
  { id: '43f79771-bf54-43a7-8a3f-5a615b1fe8cf', name: 'Ütü', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T12:00:00.000Z' },
  { id: '5c116c94-8640-4f8a-b2c2-778e66c12229', name: 'Ütü masası', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T13:00:00.000Z' },
  { id: 'ecc87dcc-fd8f-4bc9-a7ad-d1111afa6962', name: 'Çamaşır kurutmalık', room: 'Genel', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T14:00:00.000Z' },
  { id: '3d82495d-556c-4dc2-9cf7-2150d0cc8f4d', name: 'Saç kurutma makinesi', room: 'Banyo', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T15:00:00.000Z' },
  { id: '6ea0cb4e-6ef7-422e-a386-a14694967451', name: 'Kahve makinesi', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T16:00:00.000Z' },
  { id: '0e79a9cc-5e0b-4958-8b1d-78bcb7372012', name: 'Su ısıtıcısı (kettle)', room: 'Mutfak', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T17:00:00.000Z' },
  { id: 'd6a4b328-8a6a-483a-a28e-844bae9e233f', name: 'Tost makinesi', room: 'Mutfak', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T18:00:00.000Z' },
  { id: '72abb368-5142-4712-b1bd-8dfce84e782e', name: 'Blender / doğrayıcı', room: 'Mutfak', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T19:00:00.000Z' },
  { id: 'cac5e211-b22c-47b2-9c39-e063ad12c95a', name: 'Komodin lambası', room: 'Yatak Odası', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T20:00:00.000Z' },
  { id: '2ebb3255-f1c5-4fed-9d82-97129343d30a', name: 'Nevresim takımı / yastık', room: 'Yatak Odası', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T21:00:00.000Z' },
  { id: 'fe725f30-c2a2-4625-8d5d-3634dac04930', name: 'Bitkiler / saksılar', room: 'Balkon', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: '', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T22:00:00.000Z' },
];

const normalizeSeed = (items) => items.map((item) => ({
  ...item,
  price: item.price ?? null,
  image_url: item.image_url ?? null,
  image_path: item.image_path ?? null,
  image_credit: item.image_credit ?? null,
  image_tried: Boolean(item.image_tried),
  created_at: item.created_at || new Date().toISOString()
}));

export async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(itemsFile);
  } catch {
    await fs.writeFile(itemsFile, JSON.stringify(normalizeSeed(defaultSeedItems), null, 2), 'utf8');
  }
}

export async function readItems() {
  await ensureDataFile();
  const raw = await fs.readFile(itemsFile, 'utf8');
  const parsed = JSON.parse(raw || '[]');
  return Array.isArray(parsed) ? parsed : [];
}

export async function writeItems(items) {
  await ensureDataFile();
  await fs.writeFile(itemsFile, JSON.stringify(items, null, 2), 'utf8');
}

export function createItemRecord(input) {
  return {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
    image_url: input.image_url ?? null,
    image_path: input.image_path ?? null,
    image_credit: input.image_credit ?? null,
    image_tried: Boolean(input.image_tried)
  };
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
