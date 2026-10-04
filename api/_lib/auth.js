export function getAppPasswordHeader(req) {
  const headers = req.headers || {};
  const lower = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), Array.isArray(value) ? value.join(',') : value])
  );
  return lower['x-app-password'] || '';
}

export function isPasswordAllowed(req) {
  const configured = (process.env.APP_PASSWORD || '').trim();
  if (!configured) return true;

  const provided = getAppPasswordHeader(req);
  return provided === configured;
}
