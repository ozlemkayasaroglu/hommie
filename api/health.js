import { isDbEnabled, sqlReady } from './_lib/db.js';

// Hangi depolamanın kullanıldığını ve veritabanının gerçekten erişilebilir
// olduğunu tek bakışta görmek için.
export default async function handler(req, res) {
  const backend = isDbEnabled() ? 'neon' : 'file';
  const payload = {
    ok: true,
    backend,
    runtime: Boolean(process.env.LAMBDA_TASK_ROOT) ? 'netlify' : 'local',
    // Yalnızca "tanımlı mı" bilgisi; değerler asla dışarı verilmiyor.
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      NETLIFY_DATABASE_URL: Boolean(process.env.NETLIFY_DATABASE_URL),
      NEON_DATABASE_URL: Boolean(process.env.NEON_DATABASE_URL)
    },
    commit: (process.env.COMMIT_REF || '').slice(0, 7) || null
  };

  if (!isDbEnabled()) {
    payload.warning = 'Veritabanı bağlantısı yok; veriler kalıcı değil.';
    return res.status(200).json(payload);
  }

  try {
    const sql = await sqlReady();
    const [spaces] = await sql`SELECT count(*)::int AS count FROM spaces`;
    const [members] = await sql`SELECT count(*)::int AS count FROM members`;
    const [items] = await sql`SELECT count(*)::int AS count FROM items`;
    payload.counts = { spaces: spaces.count, members: members.count, items: items.count };
  } catch (error) {
    payload.ok = false;
    payload.error = error?.message || 'Veritabanına ulaşılamadı.';
    return res.status(500).json(payload);
  }

  return res.status(200).json(payload);
}
