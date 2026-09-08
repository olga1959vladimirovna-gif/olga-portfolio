import { list, put, del } from '@vercel/blob';

const PREFIX = 'leads/';

function checkAuth(req) {
  const pw = req.headers['x-admin-password'];
  return pw && pw === process.env.ADMIN_PASSWORD;
}

async function readAll() {
  const { blobs } = await list({ prefix: PREFIX });
  const entries = await Promise.all(
    blobs.map(async (b) => {
      try {
        const r = await fetch(b.url, { cache: 'no-store' });
        if (!r.ok) return null;
        const data = await r.json();
        return { ...data, _blobUrl: b.url };
      } catch {
        return null;
      }
    })
  );
  return entries.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  if (req.method === 'GET') {
    try {
      const all = await readAll();
      return res.status(200).json(all.map(({ _blobUrl, ...rest }) => rest));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'PATCH') {
    const { id, replied } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Нужен id' });
    try {
      const all = await readAll();
      const entry = all.find((e) => e.id === id);
      if (!entry) return res.status(404).json({ error: 'Не найдено' });
      const { _blobUrl, ...record } = entry;
      record.replied = !!replied;
      await put(PREFIX + id + '.json', JSON.stringify(record), {
        access: 'public',
        contentType: 'application/json',
      });
      return res.status(200).json(record);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Нужен id' });
    try {
      const all = await readAll();
      const entry = all.find((e) => e.id === id);
      if (!entry) return res.status(404).json({ error: 'Не найдено' });
      await del(entry._blobUrl);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
