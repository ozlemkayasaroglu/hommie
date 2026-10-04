import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
// Vercel's serverless filesystem is read-only outside /tmp, so the repo-local
// .data dir (used for local dev) isn't writable in that environment.
const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'hommie-data')
  : path.join(repoRoot, '.data');
const itemsFile = path.join(dataDir, 'items.json');

export const defaultSeedItems = [
  { id: '3b2878c9-7b47-42f1-9d7f-7c3dcf0dce71', name: 'Elektrik abonelik devri', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: 'Elektrik abonelik işlemleri tamamlanacak.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-01T10:00:00.000Z' },
  { id: '9f1b9d40-2ba2-45b4-b2d7-16b9048d65cf', name: 'Su abonelik devri', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: 'Su aboneliği için devri yaptır.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-02T10:00:00.000Z' },
  { id: '9d390d0d-a98d-4400-995d-d4c8af48ac0f', name: 'Doğalgaz abonelik devri', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: 'Doğalgaz devri gerekli.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-03T10:00:00.000Z' },
  { id: '6a4cf4d2-da77-42a8-9b85-4bf0be2c4ac4', name: 'İnternet aboneliği', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: 'İnternet aboneliği kurulumunu planla.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-04T10:00:00.000Z' },
  { id: '8dff7d8c-65a0-46ad-b0ea-01971ceca986', name: 'e-Devlet adres değişikliği', room: 'Genel', type: 'Resmi iş', priority: 1, status: 'Yapılmadı', note: 'Adres güncellemesi tamamlanacak.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-05T10:00:00.000Z' },
  { id: '1b0de9ec-4c7c-4ee9-9d8d-c6cb99d3ea42', name: 'Banka adres güncellemesi', room: 'Genel', type: 'Resmi iş', priority: 2, status: 'Araştırılıyor', note: 'Banka ile iletişime geç.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-06T10:00:00.000Z' },
  { id: '5525f4ba-3181-4d15-8cd7-fbc1fbb8e7a6', name: 'Kilit değişimi', room: 'Antre', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: 'Daha güvenli ve modern bir kilit tercih et.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-07T10:00:00.000Z' },
  { id: '4da1b78d-c4cb-4ef4-96a0-f8bf16ffcdf8', name: 'Ampul seti', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Sıcak beyaz ışık tercih et.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-08T10:00:00.000Z' },
  { id: 'b2af4611-e9ea-4b50-bf44-78b0a7ef3a36', name: 'Temizlik malzemeleri', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Temizlik seti al.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-09T10:00:00.000Z' },
  { id: '0e34ec4d-4acca-4e7d-b3c8-1f6d3c80e26c', name: 'Çöp kutusu', room: 'Mutfak', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Günlük atıkları için uygun kap.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-10T10:00:00.000Z' },
  { id: 'a4ba301b-f9ed-4927-8c90-1ab1b1e4861a', name: 'İlk yardım çantası', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Ev için temel bakım seti.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-11T10:00:00.000Z' },
  { id: '8af0f85c-32c7-49e8-a5a4-1c1a7ab2db5d', name: 'Alet takımı', room: 'Genel', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Küçük tamirler için gerekli.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-12T10:00:00.000Z' },
  { id: '34fc0453-1a66-4d06-a07d-62fabc7050f3', name: 'Uzatma kablosu', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Çalışma köşesi için pratik.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-13T10:00:00.000Z' },
  { id: '69f6c04a-6105-48db-9d8b-c634d02c3ff8', name: 'Perde seti', room: 'Salon', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Işık kontrolü ve sıcaklık için.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-14T10:00:00.000Z' },
  { id: 'b3ce2c41-d2c0-48ad-a9b8-0eb514f17c0a', name: 'TV ünitesi', room: 'Salon', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: 'Düzenli ve şık depolama alanı.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-15T10:00:00.000Z' },
  { id: '7dfeae74-264f-46f2-b7a7-a3dd640f5abe', name: 'Halı', room: 'Salon', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Odaya sıcaklık ve konfor katacak bir halı.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-16T10:00:00.000Z' },
  { id: '8e92dc9a-3fde-4337-9b70-a76878de8c12', name: 'Duvar sanatı', room: 'Salon', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Kişisel ve canlı bir duvar düzeni.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-17T10:00:00.000Z' },
  { id: 'f1730e7b-4309-4da2-a405-5b20dd3244b2', name: 'Pişirme seti', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Temel pişirme ve servis seti.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-18T10:00:00.000Z' },
  { id: '6cc4e837-4587-44d9-9f1a-2f2b0c42d4e5', name: 'Besin saklama kapları', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Gıda saklama için düzenleyici kaplar.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-19T10:00:00.000Z' },
  { id: 'bc3451f2-c2fe-4118-ad0a-c7f8c0d6fd3e', name: 'Duş perdesi', room: 'Banyo', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Pratik ve şık bir duş perdesi.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-20T10:00:00.000Z' },
  { id: '7d9f3e9d-f57b-47a2-8a9b-a3a55052b03f', name: 'Banyo paspası', room: 'Banyo', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Aynı zamanda dekoratif bir detay.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-21T10:00:00.000Z' },
  { id: '604d0d4f-71e4-4b98-9e44-2ebb76c6aef9', name: 'Montaj askılığı', room: 'Antre', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Eşyaları düzenlemek için.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-22T10:00:00.000Z' },
  { id: '4697d903-bcfc-45c1-b14f-c7f2049608d1', name: 'Ayakkılık', room: 'Antre', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Girişi düzenle.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-23T10:00:00.000Z' },
  { id: '9dd3ec42-a683-4dc0-a16f-4c4cf6fb273f', name: 'Kapı önü paspası', room: 'Antre', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Giriş alanını sıcak tutar.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-24T10:00:00.000Z' },
  { id: '683dc9b4-096a-4d9e-b3dc-ff0d1e2963da', name: 'Elektrikli süpürge', room: 'Genel', type: 'Alınacak', priority: 1, status: 'Sipariş verildi', note: 'Temizlik için gerekli.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-25T10:00:00.000Z' },
  { id: 'b4d0b0a5-625f-4650-9023-0ac7a67ad8c3', name: 'Ütü', room: 'Genel', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Ev düzeni için gerekli.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-26T10:00:00.000Z' },
  { id: '7af8a7b7-7f0e-4a31-8d6f-3d44dfae2ca2', name: 'Ütü masası', room: 'Genel', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Küçük bir ütü masası gerekli.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-27T10:00:00.000Z' },
  { id: 'eb8c6f63-52f2-451a-8db4-9095ded3d18e', name: 'Kurutma askısı', room: 'Banyo', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Banyo düzeni ve kurutma için.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-28T10:00:00.000Z' },
  { id: 'bf5b4d4b-f245-40bd-8a98-7136c32d012f', name: 'Saç kurutma makinesi', room: 'Banyo', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Pratik ve kullanışlı.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-29T10:00:00.000Z' },
  { id: 'e5f9a3d8-3eab-40b7-9f69-4d2ae0d70689', name: 'Kahve makinesi', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Kahve köşesi için iyi bir seçenek.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-09-30T10:00:00.000Z' },
  { id: '4d3456d9-14b9-48e8-a48d-7705a8d2f7af', name: 'Su ısıtıcısı', room: 'Mutfak', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Pratik sıcak su ihtiyacı.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-10-01T10:00:00.000Z' },
  { id: '3b6a5db7-513c-4436-863a-a720ba1d8b7d', name: 'Tost makinesi', room: 'Mutfak', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Hızlı kahvaltı için gerekli.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-10-02T10:00:00.000Z' },
  { id: 'd219eb71-dcd0-4e8b-b77f-d45da594f84d', name: 'Blender', room: 'Mutfak', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Smoothie ve çorba için.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-10-03T10:00:00.000Z' },
  { id: 'b668f8a8-2df9-40be-a450-accafe41d2da', name: 'Yatak başı lambası', room: 'Yatak Odası', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Sakin bir ortam için.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-10-04T09:00:00.000Z' },
  { id: '3c26de56-b111-4d4a-b1b9-21913c9ad46d', name: 'Yatak takımı ve yastık', room: 'Yatak Odası', type: 'Alınacak', priority: 1, status: 'Yapılmadı', note: 'Kendi tarzına uygun bir uyku alanı.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-10-05T09:00:00.000Z' },
  { id: '55af5e70-f42d-4918-a592-7d9b4348aaa3', name: 'Büyük salon bitkisi', room: 'Salon', type: 'Alınacak', priority: 2, status: 'Yapılmadı', note: 'Odaya canlılık katacak büyük bir bitki.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-10-06T09:30:00.000Z' },
  { id: '74e85d91-2af8-4c1d-8f1c-7bcc8d0f9e7c', name: 'Saksı ve dekoratif bitkiler', room: 'Salon', type: 'Alınacak', priority: 3, status: 'Yapılmadı', note: 'Raf ve kenar detayları için.', price: null, image_url: null, image_path: null, image_credit: null, image_tried: false, created_at: '2026-10-07T09:30:00.000Z' }
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
