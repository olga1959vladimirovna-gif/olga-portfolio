import { list, put } from '@vercel/blob';

const KEY = 'content/site.json';

function checkAuth(req) {
  const pw = req.headers['x-admin-password'];
  return pw && pw === process.env.ADMIN_PASSWORD;
}

async function readCurrent() {
  const { blobs } = await list({ prefix: KEY });
  const match = blobs.find((b) => b.pathname === KEY);
  if (!match) return null;
  const r = await fetch(match.url, { cache: 'no-store' });
  if (!r.ok) return null;
  return r.json();
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await readCurrent();
      return res.status(200).json(data || {});
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    if (!checkAuth(req)) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    try {
      const data = req.body || {};
      await put(KEY, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
