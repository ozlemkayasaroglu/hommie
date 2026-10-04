// Adapts the Vercel-style (req, res) handlers in /api to Netlify's
// Functions v2 Request/Response signature, so the handlers stay shared
// between both platforms without a rewrite.
export function toNetlifyHandler(handler) {
  return async (req) => {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const headers = Object.fromEntries(req.headers.entries());

    let body = {};
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    let statusCode = 200;
    let responseBody = '';
    const responseHeaders = { 'Content-Type': 'application/json; charset=utf-8' };

    const res = {
      status(code) {
        statusCode = code;
        return res;
      },
      json(payload) {
        responseBody = JSON.stringify(payload);
        return res;
      },
      send(payload) {
        if (typeof payload === 'object' && payload !== null) {
          responseBody = JSON.stringify(payload);
        } else {
          responseHeaders['Content-Type'] = 'text/plain; charset=utf-8';
          responseBody = String(payload);
        }
        return res;
      }
    };

    const fakeReq = { method: req.method, query, body, headers };

    await handler(fakeReq, res);

    return new Response(responseBody, { status: statusCode, headers: responseHeaders });
  };
}
