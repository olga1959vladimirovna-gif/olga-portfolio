import { put } from '@vercel/blob';

const PREFIX = 'leads/';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};

  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const name = (body.name || '').trim().slice(0, 200);
  const contact = (body.contact || '').trim().slice(0, 200);
  const message = (body.message || '').trim().slice(0, 4000);

  if (!name || !contact || !message) {
    return res.status(400).json({ error: 'Нужны имя, контакт и сообщение' });
  }

  try {
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      createdAt: new Date().toISOString(),
      name,
      contact,
      message,
      replied: false,
    };

    await put(PREFIX + record.id + '.json', JSON.stringify(record), {
      access: 'public',
      contentType: 'application/json',
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
