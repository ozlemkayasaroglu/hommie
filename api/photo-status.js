import { isPasswordAllowed } from './_lib/auth.js';
import { readJob } from './_lib/jobs.js';

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const jobId = String(req.query?.jobId || '').trim();
  if (!jobId) {
    return res.status(400).json({ ok: false, error: 'İş kimliği eksik.' });
  }

  const job = await readJob(jobId);
  if (!job) {
    return res.status(200).json({ ok: true, status: 'pending' });
  }

  return res.status(200).json({ ok: true, status: job.status, result: job.result || null });
}
