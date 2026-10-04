import { isPasswordAllowed } from './_lib/auth.js';
import { saveJob } from './_lib/jobs.js';
import { runPhotoAnalysis } from './_lib/photo.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

// Netlify'da bu fonksiyon "-background" soneki ile 15 dakikaya kadar
// çalışabilir; istemci 202 alır ve sonucu /api/photo-status'tan sorar.
export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const body = await readBody(req);
  const jobId = String(body.jobId || '').trim();
  if (!jobId) {
    return res.status(400).json({ ok: false, error: 'İş kimliği eksik.' });
  }

  await saveJob(jobId, { status: 'running' });

  try {
    const result = await runPhotoAnalysis(body);
    await saveJob(jobId, { status: 'done', result });
  } catch (error) {
    await saveJob(jobId, {
      status: 'done',
      result: {
        ok: true,
        style: String(body.style || 'İskandinav'),
        source: 'fallback',
        notice: error?.message || 'Analiz tamamlanamadı.',
        suggestions: []
      }
    });
  }

  return res.status(202).json({ ok: true, jobId });
}
