import { isPasswordAllowed } from './_lib/auth.js';
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

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Malformed JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (!isPasswordAllowed(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const body = await readBody(req);
    const task = String(body.task || '').trim();

    if (task === 'photo') {
      try {
        const result = await runPhotoAnalysis(body);
        return res.status(200).json(result);
      } catch (error) {
        if (error?.status === 429) {
          return res.status(429).json({ ok: false, error: 'rate_limited', message: error.message });
        }
        throw error;
      }
    }

    return res.status(400).json({ ok: false, error: 'Unsupported AI task.' });
  } catch (error) {
    const message = error?.message || 'Unexpected AI error.';
    return res.status(400).json({ ok: false, error: message });
  }
}
