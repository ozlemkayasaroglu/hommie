import { readJson, writeJson } from './store.js';

const jobKey = (jobId) => `jobs/${jobId}`;

export async function saveJob(jobId, payload) {
  await writeJson(jobKey(jobId), { ...payload, updated_at: new Date().toISOString() });
}

export async function readJob(jobId) {
  return readJson(jobKey(jobId), null);
}
