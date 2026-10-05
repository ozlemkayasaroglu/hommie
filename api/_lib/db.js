import { neon } from '@neondatabase/serverless';
import { readJson } from './store.js';

// Netlify'ın Neon eklentisi NETLIFY_DATABASE_URL'i kendisi tanımlar;
// elle bağlananlar için DATABASE_URL de kabul ediliyor.
const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  '';

let sqlClient = null;
let schemaPromise = null;

export function isDbEnabled() {
  return Boolean(connectionString);
}

export function getSql() {
  if (!connectionString) {
    throw new Error('Veritabanı bağlantısı tanımlı değil (NETLIFY_DATABASE_URL).');
  }
  if (!sqlClient) sqlClient = neon(connectionString);
  return sqlClient;
}

// Şema her soğuk başlangıçta bir kez kuruluyor; IF NOT EXISTS olduğu için
// tekrar çalışması zararsız.
export function ensureSchema() {
  if (schemaPromise) return schemaPromise;
  const sql = getSql();
  schemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS spaces (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        invite_code text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id uuid PRIMARY KEY,
        space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
        name text NOT NULL,
        role text NOT NULL DEFAULT 'üye',
        joined_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id uuid PRIMARY KEY,
        space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
        name text NOT NULL,
        room text NOT NULL,
        type text NOT NULL,
        priority integer NOT NULL DEFAULT 3,
        status text NOT NULL DEFAULT 'Başlamadı',
        note text NOT NULL DEFAULT '',
        price jsonb,
        image_url text,
        image_path text,
        image_credit text,
        image_tried boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    // Sonradan eklenen sütunlar: kurtarma anahtarı ve yumuşak silme.
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS recovery_code text`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS members_recovery_idx ON members(recovery_code)`;
    await sql`ALTER TABLE spaces ADD COLUMN IF NOT EXISTS deleted_at timestamptz`;

    await sql`CREATE INDEX IF NOT EXISTS items_space_idx ON items(space_id)`;
    await sql`CREATE INDEX IF NOT EXISTS members_space_idx ON members(space_id)`;
    await migrateFromBlobs(sql);
    await migrateStatuses(sql);
    await purgeExpiredSpaces(sql);
  })().catch((error) => {
    // Sonraki istek yeniden denesin.
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

// Neon'a geçmeden önce Blobs'ta kalan alanlar, üyeler ve kayıtlar bir kez
// taşınır; tablolar boş değilse hiçbir şey yapılmaz.
async function migrateFromBlobs(sql) {
  try {
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM spaces`;
    const [items] = await sql`SELECT count(*)::int AS count FROM items`;
    if (count > 0 || items.count > 0) return;

    const legacySpaces = await readJson('spaces', null);
    const legacyItems = await readJson('items', null);
    const spaces = Array.isArray(legacySpaces?.spaces) ? legacySpaces.spaces : [];
    const members = Array.isArray(legacySpaces?.members) ? legacySpaces.members : [];
    const rows = Array.isArray(legacyItems) ? legacyItems : [];
    if (spaces.length === 0 && rows.length === 0) return;

    for (const space of spaces) {
      await sql`
        INSERT INTO spaces (id, name, invite_code, created_at)
        VALUES (${space.id}, ${space.name}, ${space.invite_code}, ${space.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    for (const member of members) {
      await sql`
        INSERT INTO members (id, space_id, name, role, joined_at)
        VALUES (${member.id}, ${member.space_id}, ${member.name}, ${member.role}, ${member.joined_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    for (const item of rows) {
      await sql`
        INSERT INTO items (id, space_id, name, room, type, priority, status, note, price,
                           image_url, image_path, image_credit, image_tried, created_at)
        VALUES (${item.id}, ${item.space_id ?? null}, ${item.name}, ${item.room}, ${item.type},
                ${Number(item.priority) || 3}, ${item.status}, ${item.note || ''}, ${item.price ?? null},
                ${item.image_url ?? null}, ${item.image_path ?? null}, ${item.image_credit ?? null},
                ${Boolean(item.image_tried)}, ${item.created_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log('[db] migrated from blobs', { spaces: spaces.length, members: members.length, items: rows.length });
  } catch (error) {
    // Taşıma başarısız olsa bile uygulama Neon ile çalışmaya devam etmeli.
    console.error('[db] blob migration failed', error?.message);
  }
}

// Dört durumlu eski şemadan üç duruma geçiş.
async function migrateStatuses(sql) {
  try {
    await sql`UPDATE items SET status = 'Başlamadı' WHERE status = 'Yapılmadı'`;
    await sql`UPDATE items SET status = 'Devam ediyor' WHERE status IN ('Araştırılıyor', 'Sipariş verildi')`;
    await sql`UPDATE items SET status = 'Tamamlandı' WHERE status = 'Tamam'`;
  } catch (error) {
    console.error('[db] status migration failed', error?.message);
  }
}

// Yumuşak silinen alanlar saklama süresi dolunca gerçekten silinir.
export const SOFT_DELETE_DAYS = 30;

async function purgeExpiredSpaces(sql) {
  try {
    await sql`
      DELETE FROM spaces
      WHERE deleted_at IS NOT NULL
        AND deleted_at < now() - (${SOFT_DELETE_DAYS} || ' days')::interval
    `;
  } catch (error) {
    console.error('[db] purge failed', error?.message);
  }
}

export async function sqlReady() {
  await ensureSchema();
  return getSql();
}
